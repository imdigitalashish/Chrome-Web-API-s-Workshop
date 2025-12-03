# Millennial to Gen Z Converter 💅

A modular web application that uses Chrome's built-in AI (Gemini Nano) to translate text styles.

## Architecture 🏗️

This project demonstrates a **Sequential Pipeline Pattern**.

- **`js/services/aiService.js`**: A singleton service that abstracts the `window.ai` APIs.
- **`js/pipeline/Pipeline.js`**: An orchestrator that runs a queue of tasks (Steps).
- **`js/steps/`**: Individual modules for each stage of the process.
  - `InputStep`: UI for user input.
  - `ConvertStep`: AI prompt for translation.
  - `ProofreadStep`: AI prompt for refinement.

## Requirements 📋

- **Google Chrome** (Canary or Dev channel recommended).
- **Gemini Nano** enabled:
  1. Go to `chrome://flags`
  2. Enable "Prompt API for Gemini Nano"
  3. Enable "Enables optimization guide on device"
  4. Restart Chrome.
  5. Go to `chrome://components` and ensure `Optimization Guide On Device Model` is downloaded.

## How to Run 🚀

Since this uses ES Modules, you must serve it via a local web server (file:// protocol won't work).

Using pnpm:
```bash
pnpm dlx http-server .
```

Then open `http://localhost:8080` (or the port shown) in your Chrome browser.
