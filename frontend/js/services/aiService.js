export class AIService {
    constructor() {
        this.session = null;
        this.capabilities = null;
    }

    async init() {
        if (!window.ai || !window.ai.languageModel) {
            throw new Error("Chrome AI APIs are not available. Please enable 'Prompt API for Gemini Nano' in chrome://flags.");
        }

        try {
            this.capabilities = await window.ai.languageModel.capabilities();
            if (this.capabilities.available === 'no') {
                throw new Error("AI model is not available on this device.");
            }
            console.log("AI Service Initialized. Capabilities:", this.capabilities);
            return true;
        } catch (e) {
            console.error("Failed to initialize AI:", e);
            throw e;
        }
    }

    async createSession(systemPrompt = "") {
        if (this.session) {
            // Optional: Destroy old session if needed, or keep one persistent session.
            // For this app, a fresh session per pipeline run might be cleaner to clear context,
            // or we just reuse one if we want to maintain chat history (which we don't really need for this pipeline).
            this.session.destroy();
        }

        const options = {};
        if (systemPrompt) {
            options.systemPrompt = systemPrompt;
        }

        this.session = await window.ai.languageModel.create(options);
        return this.session;
    }

    async generate(prompt, systemInstruction = null) {
        if (!this.session) {
            await this.createSession(systemInstruction);
        } else if (systemInstruction) {
            // If we need a DIFFERENT system instruction, we need a new session.
            // This is a simplified logic.
            // In a rigorous app, we'd manage multiple sessions or check config.
            this.session.destroy();
            await this.createSession(systemInstruction);
        }

        console.log(`Generating with prompt: ${prompt.substring(0, 50)}...`);
        
        try {
            const result = await this.session.prompt(prompt);
            return result;
        } catch (e) {
            console.error("Generation failed:", e);
            throw e;
        }
    }
}

export const aiService = new AIService();
