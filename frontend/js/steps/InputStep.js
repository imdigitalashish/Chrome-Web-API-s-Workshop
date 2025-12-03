import { Step } from './Step.js';

export class InputStep extends Step {
    constructor() {
        super('Millennial Input', 'input');
    }

    render() {
        const container = super.render();
        const content = container.querySelector('.step-content');
        
        content.innerHTML = `
            <p style="margin-bottom: 1rem; color: #aaa;">Enter your standard/Millennial English text below:</p>
            <textarea id="input-text" placeholder="e.g., 'I am going to the store to buy some avocados. It is very expensive.'"></textarea>
            <div style="margin-top: 1rem; text-align: right;">
                <button id="submit-input" class="primary-btn">Transform ✨</button>
            </div>
        `;

        return container;
    }

    async execute() {
        return new Promise((resolve) => {
            const btn = this.element.querySelector('#submit-input');
            const textarea = this.element.querySelector('#input-text');

            // Focus the textarea when active
            textarea.focus();

            btn.onclick = () => {
                const text = textarea.value.trim();
                if (!text) {
                    alert("Please enter some text first!");
                    return;
                }
                
                // Disable inputs
                textarea.disabled = true;
                btn.disabled = true;
                btn.textContent = "Processing...";
                
                resolve(text);
            };
        });
    }
}
