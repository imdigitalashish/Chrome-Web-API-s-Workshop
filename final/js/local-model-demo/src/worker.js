
import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use OPFS cache
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.cacheDir = 'local-models';

// Use defaults for caching to ensure performance after initial load
// We will demonstrate OPFS storage explicitly in the main thread

// FODO: Step 4 Creating the robust inference.
class ModelWorker {
  static instance = null;

  static async getInstance(progressCallback) {
    if (!this.instance) {
      this.instance = pipeline('text-generation', 'Xenova/llama2.c-stories15M', {
        progress_callback: progressCallback
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  console.log(type)
  if (type === 'generate') {
    try {
        console.log(data)
      const pipe = await ModelWorker.getInstance((data) => {
          self.postMessage({ type: 'init-progress', data });
      });

      console.log("PIPE")
      
      const output = await pipe(data.prompt, {
        max_new_tokens: 60,
        callback_function: (beams) => {
            const decodedText = pipe.tokenizer.decode(beams[0].output_token_ids, {
                skip_special_tokens: true,
            });
            self.postMessage({
                type: 'generation-update',
                data: decodedText
            });
        }
      });

      console.log(output)

      self.postMessage({ type: 'complete', data: output });
    } catch (err) {
        console.log(err)
      self.postMessage({ type: 'error', data: err.message });
    }
  } else if (type === 'preload') {
      // Just initialize to trigger download
      try {
        await ModelWorker.getInstance((progress) => {
            self.postMessage({ type: 'download-progress', data: progress });
        });
        self.postMessage({ type: 'ready' });
      } catch (e) {
        self.postMessage({ type: 'error', data: e.message });
      }
  }
});
