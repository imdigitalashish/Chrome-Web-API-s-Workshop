import { Step } from './Step.js';
import { aiService } from '../services/aiService.js';

export class ConvertStep extends Step {
    constructor() {
        super('Gen Z Conversion', 'convert');
    }

    render() {
        const container = super.render();
        const content = container.querySelector('.step-content');
        content.innerHTML = `
            <div id="convert-output" class="output-box hidden"></div>
            <div id="convert-loading" class="hidden" style="color: var(--primary-color);">
                Converting based on vibes... <span class="spinner">⏳</span>
            </div>
        `;
        return container;
    }

    async execute(inputText) {
        const loading = this.element.querySelector('#convert-loading');
        const outputBox = this.element.querySelector('#convert-output');
        
        loading.classList.remove('hidden');
        
        // Artificial delay for dramatic effect (optional, but feels more "app-like")
        // await new Promise(r => setTimeout(r, 500));

        const systemPrompt = "You are a helpful assistant that translates standard English or 'Millennial' text into authentic, humorous Gen Z slang. Use terms like 'no cap', 'bet', 'slay', 'rizz', 'fr', 'gyatt' (carefully), 'fanum tax' etc. Keep the meaning but change the vibe.";
        const prompt = `Translate this text to Gen Z slang:\n"${inputText}"`;

        try {
            const result = await aiService.generate(prompt, systemPrompt);
            
            loading.classList.add('hidden');
            outputBox.textContent = result;
            outputBox.classList.remove('hidden');
            
            return result;
        } catch (error) {
            loading.classList.add('hidden');
            outputBox.textContent = "Error: " + error.message;
            outputBox.classList.remove('hidden');
            outputBox.style.borderLeftColor = "red";
            throw error;
        }
    }
}
