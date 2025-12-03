export class Step {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.element = null;
        this.output = null;
        this.onComplete = null; // Callback
    }

    render() {
        const div = document.createElement('div');
        div.className = 'step-card';
        div.id = `step-${this.id}`;
        
        div.innerHTML = `
            <div class="step-header">
                <span class="step-title">${this.name}</span>
                <span class="step-status" id="status-${this.id}">Pending</span>
            </div>
            <div class="step-content" id="content-${this.id}">
                <!-- Content goes here -->
            </div>
        `;
        
        this.element = div;
        return div;
    }

    activate() {
        if (this.element) {
            this.element.classList.add('active');
            this.updateStatus('Active');
        }
    }

    complete(output) {
        this.output = output;
        if (this.element) {
            this.element.classList.remove('active');
            this.element.classList.add('completed');
            this.updateStatus('Completed');
        }
        if (this.onComplete) {
            this.onComplete(output);
        }
    }

    updateStatus(text) {
        const badge = this.element.querySelector(`#status-${this.id}`);
        if (badge) badge.textContent = text;
    }

    // Abstract method
    async execute(input) {
        throw new Error("Execute method must be implemented");
    }
}
