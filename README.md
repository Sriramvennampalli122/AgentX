# ⚡ AgentX — Multi-Tool AI Agent

AgentX is a production-ready autonomous reasoning terminal. Built with Google Gemini and Next.js, it orchestrates complex tasks across web search, sandboxed code execution, and precision calculation tools to act as your intelligent coding and research assistant.

**Live Demo:** [Deployed on Vercel]

## 🎥 Demo Video

<video src="https://github.com/Sriramvennampalli122/AgentX/raw/main/demo.mp4" autoplay="autoplay" loop="loop" muted="muted" playsinline="playsinline" style="max-width: 100%;"></video>

## 🚀 Features

- **Autonomous Reasoning Engine:** Independent planning and execution using a multi-step tool-calling loop.
- **Live Progress Tracking:** Real-time visualization of "thinking" steps, tool triggers, and results.
- **Sandboxed Execution:** Execution of agent-generated JavaScript in an isolated scope for algorithmic verification.
- **Multi-Source Web Search:** Real-time web scraping and summarization for up-to-the-minute facts using DuckDuckGo.
- **Precision Math:** Tool-based calculation to prevent LLM arithmetic hallucinations.
- **Session History:** Persistent local archiving of all agent tasks and synthesis.

## 🛠️ Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Next.js Server Actions
- **AI Models:** Groq (Llama 3), Google Gemini
- **Data Parsing:** Cheerio (Web Scraping)
- **Deployment:** Vercel

## 📂 Project Structure

```plaintext
├── src/ai/          # Autonomous agent logic, flows, and API integrations
├── src/app/         # Next.js App Router pages and Server Actions
├── src/components/  # React UI components (Execution Panel, etc.)
├── src/lib/tools/   # Standalone agent tools (web search, code runner)
└── README.md        # Project documentation
```

## 🛡️ Security & Privacy

- **Isolated Runtime:** Code execution happens in a restricted function scope with whitelisted globals to prevent malicious access.
- **Input Sanitization:** Search queries and code strings are validated and length-limited.
- **Privacy First:** Tasks and history are stored locally in the browser's storage by default.
