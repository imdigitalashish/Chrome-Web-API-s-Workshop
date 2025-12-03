export class Pipeline {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.steps = [];
        this.currentStepIndex = 0;
        this.isRunning = false;
    }

    addStep(step) {
        this.steps.push(step);
        this.container.appendChild(step.render());
    }

    reset() {
        this.container.innerHTML = '';
        this.steps = [];
        this.currentStepIndex = 0;
        this.isRunning = false;
    }

    async start() {
        if (this.steps.length === 0) return;
        
        this.isRunning = true;
        let previousOutput = null;

        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];
            this.currentStepIndex = i;
            
            // Highlight current step
            step.activate();
            
            // Scroll into view smoothly
            step.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            try {
                // Execute step with output from previous step
                previousOutput = await step.execute(previousOutput);
                step.complete(previousOutput);
            } catch (e) {
                console.error(`Step ${step.name} failed:`, e);
                step.updateStatus('Failed');
                // Stop pipeline on error
                break;
            }
        }
        
        this.isRunning = false;
    }
}
