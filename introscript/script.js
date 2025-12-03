async function start() {
    const availability = await LanguageModel.availability();
    console.log(`Language model is ${availability}`);
    const rewriter_availability = await Rewriter.availability();
    console.log(`Rewriter API is ${rewriter_availability}`);

    const proof_rewriter = await Proofreader.availability();
    console.log(`Proof rewrite is ${proof_rewriter}`);

    const summariser_availability = await Summarizer.availability();
    console.log(`Summariser Availability ${summariser_availability}`);

    
}

function attachDownloadListener(selector, label, createSession) {
    const button = document.querySelector(selector);
    if (!button) {
        console.warn(`Button ${selector} not found for ${label}`);
        return;
    }

    button.addEventListener("click", async () => {
        try {
            await createSession({
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        const downloaded = Math.round((e.loaded || 0) * 100);
                        console.log(`[${label}] Downloaded ${downloaded}%`);
                    });
                },
            });
        } catch (error) {
            console.error(`[${label}] download failed`, error);
        }
    });
}

// TODO: UNCOMMENT ALL THE LINES OVER HERE

// attachDownloadListener("#downloadpromptAPI", "Prompt API", (options) => LanguageModel.create(options));
// attachDownloadListener("#downloadRewriterAPI", "Rewriter API", (options) => Rewriter.create(options));
// attachDownloadListener("#downloadProofreaderAPI", "Proofreader API", (options) => Proofreader.create(options));
// attachDownloadListener("#downloadSummarizerAPI", "Summarizer API", (options) => Summarizer.create(options));

start();
