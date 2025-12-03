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

const log = document.querySelector('#eventLog');

export const elements = {
    scenarioInput,
    vibeSelect,
    buttons,
    outputs,
    statuses,
    log,
};
