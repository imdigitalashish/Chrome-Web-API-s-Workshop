import { elements } from './elements.js';

const STATUS_LABELS = {
    idle: 'Idle',
    working: 'Working',
    done: 'Done',
    error: 'Error',
};

export function setStatus(step, status, detail) {
    const chip = elements.statuses[step];
    if (!chip) {
        return;
    }
    chip.className = `status ${status}`;
    const label = STATUS_LABELS[status] || STATUS_LABELS.idle;
    chip.textContent = detail ? `${label} - ${detail}` : label;
}

export function setButtonBusy(button, isBusy) {
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

export function pushLog(message, type = 'info') {
    const logEl = elements.log;
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

export function clearOutputs() {
    Object.values(elements.outputs).forEach((area) => {
        if (area) {
            area.value = '';
        }
    });
}

export function resetPipelineView(hasTopic) {
    clearOutputs();
    setStatus('prompt', 'idle', 'Waiting for topic.');
    setStatus('rewrite', 'idle', 'Waiting for millennial script.');
    setStatus('proof', 'idle', 'Waiting for Gen Z draft.');
    elements.buttons.rewrite.disabled = true;
    elements.buttons.proof.disabled = true;
    elements.buttons.runAll.disabled = !hasTopic;
}
