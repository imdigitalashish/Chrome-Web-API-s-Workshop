import { Step } from './Step.js';
import { aiService } from '../services/aiService.js';

export class ProofreadStep extends Step {
    constructor() {
        super('Vibe Check (Proofread)', 'proofread');
    }

    render() {
        const container = super.render();
        const content = container.querySelector('.step-content');
        content.innerHTML = `
            <div id="proofread-output" class="output-box hidden"></div>
            <div id="proofread-loading" class="hidden" style="color: var(--secondary-color);">
                Running final vibe check... <span class="spinner">✨</span>
            </div>
        `;
        return container;
    }

    async execute(inputText) {
        const loading = this.element.querySelector('#proofread-loading');
        const outputBox = this.element.querySelector('#proofread-output');
        
        loading.classList.remove('hidden');

        const systemPrompt = "You are a 'Vibe Checker'. Your job is to review Gen Z slang text. If it sounds like a corporate attempt at being cool (too cringe), fix it to sound natural. If it's already good, just output it as is. Return ONLY the final polished text.";
        const prompt = `Review and polish this Gen Z text:\n"${inputText}"`;

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
            throw error;
        }
    }
}
