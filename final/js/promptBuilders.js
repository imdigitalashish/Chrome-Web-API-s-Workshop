const vibeCopy = {
    hype: 'Channel fearless hype-squad energy with shout-outs to playlists, festivals, and besties.',
    cozy: 'Sound like a sleepy millennial sharing feelings over a latte. Sprinkle soft humor and nostalgia.',
    snarky: 'Lean into sarcastic corporate-warrior energy with clever eye-roll moments.',
    wholesome: 'Write like a big sibling dishing heartfelt advice with gentle optimism.',
};

const rewriteTones = {
    hype: 'Keep it feral, high-energy, and ready for the group chat.',
    cozy: 'Blend sleepy cozy-core energy with chaotic bestie slang.',
    snarky: 'Be playful but savage, with corporate meme references.',
    wholesome: 'Keep the serotonin high with gentle chaos and supportive slang.',
};

export function buildMillennialPrompt(topic, vibe) {
    const flavor = vibeCopy[vibe] || vibeCopy.hype;
    return `Write a plain first-person paragraph (3 to 4 sentences) about: ${topic}. Use straightforward language, no emojis, no hashtags, and keep the tone grounded but relatable. Include at least one concrete detail so it feels real. ${flavor}`;
}

export function buildRewriteInstructions(vibe) {
    const vibeNote = rewriteTones[vibe] || rewriteTones.hype;
    return `${vibeNote} Use Gen Z slang, quick punchy sentences, and trending internet references. Keep emoji count under 3 and preserve the original meaning.`;
}

export function buildProofreadInstructions() {
    return 'Fix grammar, clarity, and flow but do not remove the Gen Z slang or tone. Keep it first-person and playful.';
}
