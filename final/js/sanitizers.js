const PREFERRED_KEYS = [
    'text',
    'output_text',
    'output',
    'content',
    'parts',
    'rewrites',
    'proofreads',
    'candidates',
    'result',
    'response',
];

function extractFirstText(node) {
    if (!node) {
        return '';
    }
    if (typeof node === 'string') {
        return node.trim();
    }
    if (Array.isArray(node)) {
        for (const entry of node) {
            const text = extractFirstText(entry);
            if (text) {
                return text;
            }
        }
        return '';
    }
    if (typeof node === 'object') {
        for (const key of PREFERRED_KEYS) {
            if (key in node) {
                const text = extractFirstText(node[key]);
                if (text) {
                    return text;
                }
            }
        }
        // Some responses nest text in arbitrary keys like { message: { content: [...] } }
        for (const value of Object.values(node)) {
            const text = extractFirstText(value);
            if (text) {
                return text;
            }
        }
    }
    return '';
}

export function sanitizeText(result) {
    const text = extractFirstText(result);
    if (text) {
        return text;
    }
    try {
        return JSON.stringify(result, null, 2);
    } catch (_error) {
        return String(result ?? '').trim();
    }
}
