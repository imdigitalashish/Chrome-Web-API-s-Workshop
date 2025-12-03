import { elements } from './elements.js';
import { pushLog } from './ui.js';
import { runPromptStep, runRewriteStep, runProofStep, runPipeline, resetFromPromptChange, initializePipeline } from './pipeline.js';

function wireEvents() {
    elements.buttons.prompt?.addEventListener('click', () => runPromptStep().catch(() => undefined));
    elements.buttons.rewrite?.addEventListener('click', () => runRewriteStep().catch(() => undefined));
    elements.buttons.proof?.addEventListener('click', () => runProofStep().catch(() => undefined));
    elements.buttons.runAll?.addEventListener('click', () => runPipeline());
    elements.scenarioInput?.addEventListener('input', () => resetFromPromptChange());
}

async function startApp() {
    wireEvents();
    await initializePipeline();
}

startApp().catch((error) => {
    pushLog(`Initialization failed: ${error.message || error}`, 'error');
});
