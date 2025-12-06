import React, { useState, useEffect, useRef } from 'react';
import { saveToOPFS, getOPFSHandler, checkFileExists, deleteFromOPFS } from './lib/opfs';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

// Constants for the demo
const MODEL_ID = 'Xenova/llama2.c-stories15M';
// Note: added credentials: 'omit' to fetch calls to avoid 401s on some networks
// FODO: First step is to get the files.
const FILES_TO_FETCH = [
  {
    url: 'https://huggingface.co/Xenova/llama2.c-stories15M/resolve/main/config.json',
    name: 'config.json',
    size: 1000
  },
  {
    url: 'https://huggingface.co/Xenova/llama2.c-stories15M/resolve/main/tokenizer.json',
    name: 'tokenizer.json',
    size: 1845000
  },
  {
    url: 'https://huggingface.co/Xenova/llama2.c-stories15M/resolve/main/tokenizer_config.json',
    name: 'tokenizer_config.json',
    size: 5000
  },
  {
    url: 'https://huggingface.co/Xenova/llama2.c-stories15M/resolve/main/onnx/decoder_model_merged_quantized.onnx',
    name: 'model_quantized.onnx',
    size: 45000000
  }
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({});
  const [logs, setLogs] = useState([]);
  const [showViz, setShowViz] = useState(false);
  const [inputText, setInputText] = useState("Once upon a time");
  const [generatedText, setGeneratedText] = useState("");
  const [generating, setGenerating] = useState(false);
  
  const worker = useRef(null);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, msg }, ...prev]);
  };

  useEffect(() => {
    // Initialize Worker
    worker.current = new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module'
    });

    worker.current.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === 'ready') {
        setReady(true);
        addLog('System Ready: Model loaded in worker');
      } else if (type === 'generation-update') {
        setGeneratedText(data);
      } else if (type === 'complete') {
        setGenerating(false);
        addLog('Generation complete');
      } else if (type === 'error') {
        addLog(`Error: ${data}`);
        setGenerating(false);
      }
    };
    
    checkOPFS();

    return () => worker.current?.terminate();
  }, []);

  const checkOPFS = async () => {
    const exists = await checkFileExists('model_quantized.onnx');
    if (exists) {
      setReady(true);
      addLog('Storage Check: Model found in OPFS');
    } else {
      addLog('Storage Check: No model found');
    }
  };

  // FODO: Step two downloading the models
  const downloadModel = async () => {
    setDownloading(true);
    addLog('Starting secure download to OPFS...');
    
    try {
      for (const file of FILES_TO_FETCH) {
        addLog(`Fetching ${file.name}...`);
        
        // Use robust fetch options to avoid 401s and caching issues
        const response = await fetch(file.url, { 
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          cache: 'no-store'
        });
        if (!response.ok) throw new Error(`Failed to fetch ${file.name}: ${response.status} ${response.statusText}`);
        
        const total = parseInt(response.headers.get('content-length') || file.size);
        const stream = response.body;
        
        if (!stream) throw new Error('No stream support');

        await saveToOPFS(file.name, stream, (bytesWritten) => {
          const pct = Math.round((bytesWritten / total) * 100);
          setProgress(prev => ({ ...prev, [file.name]: pct }));
        });
        
        addLog(`Saved ${file.name} to OPFS`);
      }
      
      addLog('All files downloaded successfully.');
      setReady(true);
      worker.current.postMessage({ type: 'preload' });
      
    } catch (err) {
      addLog(`Download failed: ${err.message}`);
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const clearOPFS = async () => {
    for (const file of FILES_TO_FETCH) {
        await deleteFromOPFS(file.name);
    }
    setReady(false);
    setProgress({});
    addLog('Cleared OPFS storage');
  };

  const generate = () => {
    // if (!inputText) return;
    setGenerating(true);
    setGeneratedText('');
    addLog(`Generating...`);
    worker.current.postMessage({
      type: 'generate',
      data: { prompt: inputText }
    });
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Local AI Playground</h1>
        <p className="subtitle">
        </p>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 500 }}>System Status</span>
            <span className={cn("status-badge", ready ? "ready" : "missing")}>
              {ready ? 'Model Ready' : 'Model Missing'}
            </span>
          </div>
          <button className="btn secondary" onClick={() => setShowViz(!showViz)}>
            {showViz ? 'Hide Logs' : 'Show Logs'}
          </button>
        </div>

        {!ready && !downloading && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Downloading model to runtime
            </p>
            <button className="btn" onClick={downloadModel}>
              Download Model
            </button>
          </div>
        )}

        {ready && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn danger" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={clearOPFS}>
              Clear Local Storage
            </button>
          </div>
        )}

        {downloading && (
          <div className="progress-container">
            {Object.entries(progress).map(([name, pct]) => (
              <div key={name} style={{ marginBottom: '0.75rem' }}>
                <div className="progress-label">
                  <span>{name}</span>
                  <span>{pct}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showViz && (
        <div className="card logs-panel">
          <div style={{ marginBottom: '0.5rem', color: '#fff', fontWeight: 600 }}>System Events</div>
          {logs.map((log, i) => (
            <div key={i} className="log-entry">
              <span className="log-time">{log.time}</span>
              {log.msg}
            </div>
          ))}
          {logs.length === 0 && <div style={{ color: '#64748b' }}>No events yet...</div>}
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: 0 }}>Interactive Storyteller</h3>
        <div className="input-group">
          <input 
            type="text" 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)}
            disabled={generating || !ready}
            placeholder="Enter a prompt (e.g., 'Once upon a time')..."
            onKeyDown={(e) => e.key === 'Enter' && generate()}
          />
          <button className="btn" onClick={generate} disabled={generating || !ready} style={{ minWidth: '100px' }}>
            {generating ? '...' : 'Generate'}
          </button>
        </div>
        
        <div className="generated-text">
           {generatedText ? (
             <>
               <span style={{ color: 'var(--text-muted)' }}>{inputText}</span>
               <span>{generatedText.replace(inputText, '')}</span>
             </>
           ) : (
             <span className="placeholder">The AI generated story will appear here...</span>
           )}
        </div>
      </div>
    </div>
  );
}