const scenarioInput = document.querySelector('#scenarioInput');
const vibeSelect = document.querySelector('#vibeSelect');
const buttons = {
    prompt: document.querySelector('#promptBtn'),
    rewrite: document.querySelector('#rewriteBtn'),
    proof: document.querySelector('#proofBtn'),
    runAll: document.querySelector('#runAllBtn'),
};
const outputs = {
    millennial: document.querySelector('#millennialOutput'),
    genz: document.querySelector('#genzOutput'),
    final: document.querySelector('#finalOutput'),
};
const statuses = {
    prompt: document.querySelector('#promptStatus'),
    rewrite: document.querySelector('#rewriteStatus'),
    proof: document.querySelector('#proofStatus'),
};
const logEl = document.querySelector('#eventLog');

const vibeCopy = {
    hype: "Channel fearless hype-squad energy with shout-outs to playlists, festivals, and besties.",
    cozy: "Sound like a sleepy millennial sharing feelings over a latte. Sprinkle soft humor and nostalgia.",
    snarky: "Lean into sarcastic corporate-warrior energy with clever eye-roll moments.",
    wholesome: "Write like a big sibling dishing heartfelt advice with gentle optimism.",
};

const state = {
    millennialText: '',
    genZDraft: '',
    polished: '',
};

const STATUS_LABELS = {
    idle: 'Idle',
    working: 'Working',
    done: 'Done',
    error: 'Error',
};

function setStatus(step, status, detail) {
    const el = statuses[step];
    if (!el) {
        return;
    }
    el.className = `status ${status}`;
    const base = STATUS_LABELS[status] || STATUS_LABELS.idle;
    el.textContent = detail ? `${base} - ${detail}` : base;
}

function setButtonBusy(button, isBusy) {
    if (!button) {
        return;
    }
    if (!button.dataset.label) {
        button.dataset.label = button.textContent;
    }
    button.disabled = isBusy;
    if (isBusy) {
        button.textContent = button.dataset.workingLabel || 'Working...';
        button.classList.add('busy');
    } else {
        button.textContent = button.dataset.label;
        button.classList.remove('busy');
    }
}

function pushLog(message, type = 'info') {
    if (!logEl) {
        return;
    }
    const stamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '!!' : '--';
    const line = `[${stamp}] ${prefix} ${message}`;
    const existing = logEl.textContent === 'Waiting for your scenario...' ? '' : logEl.textContent;
    const next = `${line}\n${existing}`.trim();
    logEl.textContent = next.slice(0, 6000);
}

function sanitizeText(result) {
    if (!result) {
        return '';
    }
    if (typeof result === 'string') {
        return result.trim();
    }
    if (Array.isArray(result)) {
        return sanitizeText(result[0]);
    }
    if (typeof result.output === 'string') {
        return result.output.trim();
    }
    if (result.output?.length) {
        return sanitizeText(result.output[0]);
    }
    if (result.output_text) {
        return sanitizeText(result.output_text);
    }
    if (typeof result.text === 'string') {
        return result.text.trim();
    }
    if (result.text?.length) {
        return sanitizeText(result.text[0]);
    }
    if (result.rewrites?.length) {
        const rewrite = result.rewrites[0];
        if (typeof rewrite === 'string') {
            return rewrite.trim();
        }
        if (rewrite?.text) {
            return sanitizeText(rewrite.text);
        }
    }
    if (result.proofreads?.length) {
        const proof = result.proofreads[0];
        if (typeof proof === 'string') {
            return proof.trim();
        }
        if (proof?.text) {
            return sanitizeText(proof.text);
        }
    }
    if (result?.candidates?.length) {
        return sanitizeText(result.candidates[0]);
    }
    if (typeof result.result === 'string') {
        return result.result.trim();
    }
    return String(result).trim();
}

function buildMillennialPrompt(topic, vibe) {
    const flavor = vibeCopy[vibe] || vibeCopy.hype;
    return `Pretend you are a dramatically funny millennial influencer. Give a short first-person paragraph (4 to 6 sentences) about: ${topic}. Mention adulting struggles, emoji-worthy nostalgia, and at least one specific sensory detail. ${flavor}`;
}

function buildRewriteInstructions(vibe) {
    const tones = {
        hype: 'Keep it feral, high-energy, and ready for the group chat.',
        cozy: 'Blend sleepy cozy-core energy with chaotic bestie slang.',
        snarky: 'Be playful but savage, with corporate meme references.',
        wholesome: 'Keep the serotonin high with gentle chaos and supportive slang.',
    };
    const vibeNote = tones[vibe] || tones.hype;
    return `${vibeNote} Use Gen Z slang, quick punchy sentences, and trending internet references. Keep emoji count under 3 and preserve the original meaning.`;
}

function buildProofreadInstructions() {
    return 'Fix grammar, clarity, and flow but do not remove the Gen Z slang or tone. Keep it first-person and playful.';
}

async function createSession(factory, label) {
    if (typeof factory !== 'function') {
        throw new Error(`${label} is not available in this browser.`);
    }
    return factory({
        monitor(monitor) {
            monitor.addEventListener('downloadprogress', (event) => {
                const pct = Math.round((event.loaded || 0) * 100);
                pushLog(`${label} download ${pct}%`);
            });
        },
    });
}

async function callPromptSession(session, prompt) {
    if (!session || typeof session.prompt !== 'function') {
        throw new Error('Prompt API session is missing the prompt method.');
    }
    return session.prompt(prompt);
}

async function callRewriterSession(session, payload) {
    if (session && typeof session.rewrite === 'function') {
        return session.rewrite(payload);
    }
    if (session && typeof session.prompt === 'function') {
        const composed = `Rewrite the text below using Gen Z slang. Instructions: ${payload.instructions}\n\n${payload.text}`;
        return session.prompt(composed);
    }
    throw new Error('Rewriter session does not support rewrite or prompt.');
}

async function callProofreaderSession(session, payload) {
    if (session && typeof session.proofread === 'function') {
        return session.proofread(payload);
    }
    if (session && typeof session.rewrite === 'function') {
        return session.rewrite({ text: payload.text, instructions: payload.instructions });
    }
    if (session && typeof session.prompt === 'function') {
        const composed = `Proofread the following for grammar and clarity while keeping the Gen Z slang: ${payload.text}`;
        return session.prompt(composed);
    }
    throw new Error('Proofreader session does not support proofread/rewrite/prompt.');
}

async function runPromptStep() {
    const topic = scenarioInput.value.trim();
    if (!topic) {
        setStatus('prompt', 'error', 'Add a topic first.');
        scenarioInput.focus();
        throw new Error('Topic required.');
    }
    setStatus('prompt', 'working', 'Calling Prompt API...');
    setButtonBusy(buttons.prompt, true);
    try {
        if (typeof LanguageModel === 'undefined' || typeof LanguageModel.create !== 'function') {
            throw new Error('LanguageModel API missing.');
        }
        const session = await createSession((options) => LanguageModel.create(options), 'Prompt API');
        const prompt = buildMillennialPrompt(topic, vibeSelect.value);
        const result = await callPromptSession(session, prompt);
        const text = sanitizeText(result);
        if (!text) {
            throw new Error('Prompt API returned empty text.');
        }
        state.millennialText = text;
        outputs.millennial.value = text;
        setStatus('prompt', 'done', 'Millennial POV ready.');
        buttons.rewrite.disabled = false;
        buttons.runAll.disabled = false;
        pushLog('Prompt API generated the millennial script.');
        return text;
    } catch (error) {
        setStatus('prompt', 'error', error.message || 'Prompt step failed.');
        pushLog(`Prompt error: ${error.message || error}`, 'error');
        throw error;
    } finally {
        setButtonBusy(buttons.prompt, false);
    }
}

async function runRewriteStep() {
    if (!state.millennialText) {
        throw new Error('Generate the millennial text first.');
    }
    setStatus('rewrite', 'working', 'Translating to Gen Z.');
    setButtonBusy(buttons.rewrite, true);
    try {
        if (typeof Rewriter === 'undefined' || typeof Rewriter.create !== 'function') {
            throw new Error('Rewriter API missing.');
        }
        const session = await createSession((options) => Rewriter.create(options), 'Rewriter API');
        const payload = {
            text: state.millennialText,
            instructions: buildRewriteInstructions(vibeSelect.value),
        };
        const result = await callRewriterSession(session, payload);
        const text = sanitizeText(result);
        if (!text) {
            throw new Error('Rewriter API returned empty text.');
        }
        state.genZDraft = text;
        outputs.genz.value = text;
        setStatus('rewrite', 'done', 'Gen Z remix ready.');
        buttons.proof.disabled = false;
        pushLog('Rewriter API delivered the Gen Z glow-up.');
        return text;
    } catch (error) {
        setStatus('rewrite', 'error', error.message || 'Rewrite failed.');
        pushLog(`Rewriter error: ${error.message || error}`, 'error');
        throw error;
    } finally {
        setButtonBusy(buttons.rewrite, false);
    }
}

async function runProofStep() {
    if (!state.genZDraft) {
        throw new Error('Run the Rewriter step first.');
    }
    setStatus('proof', 'working', 'Cleaning grammar...');
    setButtonBusy(buttons.proof, true);
    try {
        if (typeof Proofreader === 'undefined' || typeof Proofreader.create !== 'function') {
            throw new Error('Proofreader API missing.');
        }
        const session = await createSession((options) => Proofreader.create(options), 'Proofreader API');
        const payload = {
            text: state.genZDraft,
            instructions: buildProofreadInstructions(),
        };
        const result = await callProofreaderSession(session, payload);
        const text = sanitizeText(result);
        if (!text) {
            throw new Error('Proofreader API returned empty text.');
        }
        state.polished = text;
        outputs.final.value = text;
        setStatus('proof', 'done', 'Ready for showtime.');
        pushLog('Proofreader API kept the slang but fixed the grammar.');
        return text;
    } catch (error) {
        setStatus('proof', 'error', error.message || 'Proofreader failed.');
        pushLog(`Proofreader error: ${error.message || error}`, 'error');
        throw error;
    } finally {
        setButtonBusy(buttons.proof, false);
    }
}

async function runPipeline() {
    if (!scenarioInput.value.trim()) {
        setStatus('prompt', 'error', 'Add a topic first.');
        scenarioInput.focus();
        return;
    }
    setButtonBusy(buttons.runAll, true);
    pushLog('Starting full pipeline...');
    try {
        if (!state.millennialText) {
            await runPromptStep();
        }
        await runRewriteStep();
        await runProofStep();
        pushLog('Full pipeline completed! Enjoy the Gen Z monologue.');
    } catch (error) {
        pushLog(`Pipeline stopped: ${error.message || error}`, 'error');
    } finally {
        setButtonBusy(buttons.runAll, false);
    }
}

function resetPipelineFromPrompt() {
    state.millennialText = '';
    state.genZDraft = '';
    state.polished = '';
    outputs.millennial.value = '';
    outputs.genz.value = '';
    outputs.final.value = '';
    buttons.rewrite.disabled = true;
    buttons.proof.disabled = true;
    buttons.runAll.disabled = scenarioInput.value.trim().length === 0;
    setStatus('prompt', 'idle', 'Waiting for topic.');
    setStatus('rewrite', 'idle', 'Waiting for millennial script.');
    setStatus('proof', 'idle', 'Waiting for Gen Z draft.');
}

function wireEvents() {
    buttons.prompt?.addEventListener('click', () => runPromptStep().catch(() => undefined));
    buttons.rewrite?.addEventListener('click', () => runRewriteStep().catch(() => undefined));
    buttons.proof?.addEventListener('click', () => runProofStep().catch(() => undefined));
    buttons.runAll?.addEventListener('click', () => runPipeline());
    scenarioInput?.addEventListener('input', () => resetPipelineFromPrompt());
}

async function checkAvailability() {
    const availabilityChecks = [
        { key: 'Prompt API', getter: () => (typeof LanguageModel !== 'undefined' ? LanguageModel.availability?.() : 'unavailable') },
        { key: 'Rewriter API', getter: () => (typeof Rewriter !== 'undefined' ? Rewriter.availability?.() : 'unavailable') },
        { key: 'Proofreader API', getter: () => (typeof Proofreader !== 'undefined' ? Proofreader.availability?.() : 'unavailable') },
    ];

    for (const check of availabilityChecks) {
        try {
            const availability = await check.getter();
            pushLog(`${check.key} availability: ${availability}`);
        } catch (error) {
            pushLog(`${check.key} availability check failed: ${error.message || error}`, 'error');
        }
    }
}

async function start() {
    resetPipelineFromPrompt();
    wireEvents();
    await checkAvailability();
    pushLog('Ready to remix a millennial rant.');
}

start().catch((error) => {
    pushLog(`Initialization failed: ${error.message || error}`, 'error');
});
