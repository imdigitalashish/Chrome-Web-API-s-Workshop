import { aiService } from './services/aiService.js';
import { Pipeline } from './pipeline/Pipeline.js';
import { InputStep } from './steps/InputStep.js';
import { ConvertStep } from './steps/ConvertStep.js';
import { ProofreadStep } from './steps/ProofreadStep.js';

const statusDiv = document.getElementById('status-indicator');
const startBtn = document.getElementById('start-btn');
const pipeline = new Pipeline('pipeline-container');

async function init() {
    try {
        statusDiv.classList.remove('hidden');
        await aiService.init();
        statusDiv.textContent = "AI Capabilities Ready";
        statusDiv.classList.add('ready');
    } catch (e) {
        statusDiv.textContent = "AI Not Available: " + e.message;
        statusDiv.classList.add('error');
        startBtn.disabled = true;
    }
}

function startNewTransformation() {
    // Clear existing if needed (though here we might want to append or clear)
    // For this simple app, we'll reset the pipeline each time or just append a new flow?
    // Let's reset for cleanliness.
    pipeline.reset();
    
    // Re-add steps (creating new instances ensures clean state)
    pipeline.addStep(new InputStep());
    pipeline.addStep(new ConvertStep());
    pipeline.addStep(new ProofreadStep());

    pipeline.start();
}

startBtn.addEventListener('click', startNewTransformation);

// Initialize on load
init();
