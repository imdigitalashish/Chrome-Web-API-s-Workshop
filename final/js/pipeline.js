import { elements } from './elements.js';
import { pipelineState, resetState } from './state.js';
import { setStatus, setButtonBusy, pushLog, resetPipelineView } from './ui.js';
import { buildMillennialPrompt, buildRewriteInstructions, buildProofreadInstructions } from './promptBuilders.js';
import { sanitizeText } from './sanitizers.js';

function requireTopic() {
    const topic = elements.scenarioInput.value.trim();
    if (!topic) {
        setStatus('prompt', 'error', 'Add a topic first.');
        elements.scenarioInput.focus();
        throw new Error('Topic required.');
    }
    return topic;
}

// TODO: Create the session
// async function createSession(label, createFn) {
//     if (typeof createFn !== 'function') {
//         throw new Error(`${label} is not available in this browser.`);
//     }
//     return createFn({
//         monitor(monitor) {
//             monitor.addEventListener('downloadprogress', (event) => {
//                 const pct = Math.round((event.loaded || 0) * 100);
//                 pushLog(`${label} download ${pct}%`);
//             });
//         },
//     });
// }

// async function createPromptText(topic, vibe) {
//     if (typeof LanguageModel === 'undefined' || typeof LanguageModel.create !== 'function') {
//         throw new Error('LanguageModel API missing.');
//     }
//     const session = await createSession('Prompt API', (options) => LanguageModel.create(options));
//     const result = await session.prompt(buildMillennialPrompt(topic, vibe));
//     const text = sanitizeText(result);
//     if (!text) {
//         throw new Error('Prompt API returned empty text.');
//     }
//     return text;
// }

// async function rewriteLikeGenZ(text, vibe) {
//     if (typeof Rewriter === 'undefined' || typeof Rewriter.create !== 'function') {
//         throw new Error('Rewriter API missing.');
//     }
//     const instruction = buildRewriteInstructions(vibe);
//     const session = await createSession('Rewriter API', (options) => Rewriter.create({
//         ...options,
//         format: 'plain-text',
//         tone: 'more-casual',
//     }));

//     let output;
//     if (typeof session.rewrite === 'function') {
//         output = await session.rewrite(text, {
//             context: instruction,
//             format: 'plain-text',
//             tone: 'more-casual',
//         });
//     } else {
//         output = await session.prompt(`Rewrite the text below using Gen Z slang. Instructions: ${instruction}\n\n${text}`);
//     }

//     const genZ = sanitizeText(output);
//     if (!genZ) {
//         throw new Error('Rewriter API returned empty text.');
//     }
//     return genZ;
// }

// async function proofGenZText(text) {
//     if (typeof Proofreader === 'undefined' || typeof Proofreader.create !== 'function') {
//         throw new Error('Proofreader API missing.');
//     }
//     const instruction = buildProofreadInstructions();
//     const session = await createSession('Proofreader API', (options) => Proofreader.create({
//         ...options,
//         format: 'plain-text',
//     }));
//     let output;
//     if (typeof session.proofread === 'function') {
//         output = await session.proofread(text, { context: instruction, format: 'plain-text' });
//     } else if (typeof session.rewrite === 'function') {
//         output = await session.rewrite(text, { context: instruction, format: 'plain-text' });
//     } else {
//         output = await session.prompt(`Proofread the following for grammar and clarity while keeping the Gen Z slang: ${text}`);
//     }
//     const cleaned = sanitizeText(output);
//     if (!cleaned) {
//         throw new Error('Proofreader API returned empty text.');
//     }
//     return cleaned;
// }

async function logAvailability() {
    const data = [
        { name: 'Prompt API', has: () => (typeof LanguageModel !== 'undefined' ? LanguageModel.availability?.() : 'unavailable') },
        { name: 'Rewriter API', has: () => (typeof Rewriter !== 'undefined' ? Rewriter.availability?.() : 'unavailable') },
        { name: 'Proofreader API', has: () => (typeof Proofreader !== 'undefined' ? Proofreader.availability?.() : 'unavailable') },
    ];

    for (const item of data) {
        try {
            const availability = await item.has();
            pushLog(`${item.name} availability: ${availability}`);
        } catch (error) {
            pushLog(`${item.name} availability check failed: ${error.message || error}`, 'error');
        }
    }
}

export async function runPromptStep() {
    const topic = requireTopic();
    setStatus('prompt', 'working', 'Calling Prompt API...');
    setButtonBusy(elements.buttons.prompt, true);

    try {
        const text = await createPromptText(topic, elements.vibeSelect.value);
        pipelineState.millennialText = text;
        elements.outputs.millennial.value = text;
        setStatus('prompt', 'done', 'Millennial POV ready.');
        elements.buttons.rewrite.disabled = false;
        elements.buttons.runAll.disabled = false;
        pushLog('Prompt API generated the millennial script.');
        return text;
    } catch (error) {
        setStatus('prompt', 'error', error.message || 'Prompt step failed.');
        pushLog(`Prompt error: ${error.message || error}`, 'error');
        throw error;
    } finally {
        setButtonBusy(elements.buttons.prompt, false);
    }
}

export async function runRewriteStep() {
    if (!pipelineState.millennialText) {
        throw new Error('Generate the millennial text first.');
    }
    setStatus('rewrite', 'working', 'Translating to Gen Z.');
    setButtonBusy(elements.buttons.rewrite, true);

    try {
        const text = await rewriteLikeGenZ(pipelineState.millennialText, elements.vibeSelect.value);
        console.log(text)
        pipelineState.genZDraft = text;
        elements.outputs.genz.value = text;
        setStatus('rewrite', 'done', 'Gen Z remix ready.');
        elements.buttons.proof.disabled = false;
        pushLog('Rewriter API delivered the Gen Z glow-up.');
        return text;
    } catch (error) {
        setStatus('rewrite', 'error', error.message || 'Rewrite failed.');
        pushLog(`Rewriter error: ${error.message || error}`, 'error');
        throw error;
    } finally {
        setButtonBusy(elements.buttons.rewrite, false);
    }
}

export async function runProofStep() {
    if (!pipelineState.genZDraft) {
        throw new Error('Run the Rewriter step first.');
    }
    setStatus('proof', 'working', 'Cleaning grammar...');
    setButtonBusy(elements.buttons.proof, true);

    try {
        const text = await proofGenZText(pipelineState.genZDraft);
        pipelineState.polished = text;
        elements.outputs.final.value = text;
        setStatus('proof', 'done', 'Ready for showtime.');
        pushLog('Proofreader API kept the slang but fixed the grammar.');
        return text;
    } catch (error) {
        setStatus('proof', 'error', error.message || 'Proofreader failed.');
        pushLog(`Proofreader error: ${error.message || error}`, 'error');
        throw error;
    } finally {
        setButtonBusy(elements.buttons.proof, false);
    }
}

export async function runPipeline() {
    try {
        requireTopic();
    } catch (error) {
        pushLog(error.message, 'error');
        return;
    }

    setButtonBusy(elements.buttons.runAll, true);
    pushLog('Starting full pipeline...');
    try {
        if (!pipelineState.millennialText) {
            await runPromptStep();
        }
        await runRewriteStep();
        await runProofStep();
        pushLog('Full pipeline completed! Enjoy the Gen Z monologue.');
    } catch (error) {
        pushLog(`Pipeline stopped: ${error.message || error}`, 'error');
    } finally {
        setButtonBusy(elements.buttons.runAll, false);
    }
}

export function resetFromPromptChange() {
    resetState();
    const hasTopic = elements.scenarioInput.value.trim().length > 0;
    resetPipelineView(hasTopic);
}

export async function initializePipeline() {
    resetFromPromptChange();
    await logAvailability();
    pushLog('Ready to remix a millennial rant.');
}
