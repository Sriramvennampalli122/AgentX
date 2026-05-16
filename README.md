
# ⚡ AgentX — Multi-Tool AI Agent

AgentX is a production-ready autonomous reasoning terminal. Built with Google Gemini and Next.js, it orchestrates complex tasks across web search, sandboxed code execution, and precision calculation tools.

## 🎥 Demo

https://drive.google.com/file/d/1Vb7_N7edTqHYmzG8rUUgb9LUSk4g9-NH/view?usp=drive_link

## 🚀 Architecture

```
Browser (Next.js Client)
  ├── Autonomous Reasoning Engine (Genkit Flow)
  ├── Terminal Progress Monitor (Thinking Steps)
  └── Local Persistence (IndexedDB/LocalStorage)

Server (Next.js Actions)
  └── Agent Orchestration
        ├── Web Search (DuckDuckGo + Cheerio)
        ├── Code Runner (Isolated JS Scope)
        └── Math Parser (Precision Logic)
```

## ✨ Features

- **Autonomous Reasoning Engine**: Independent planning and execution using a multi-step tool-calling loop.
- **Live Progress Tracking**: Real-time visualization of "thinking" steps, tool triggers, and results.
- **Sandboxed Execution**: Execution of agent-generated JavaScript in an isolated scope for algorithmic verification.
- **Multi-Source Web Search**: Real-time web scraping and summarization for up-to-the-minute facts.
- **Precision Math**: Tool-based calculation to prevent LLM arithmetic hallucinations.
- **Session History**: Persistent local archiving of all agent tasks and synthesis.

## 🛠️ Tools

| Tool | Run Environment | Description |
| :--- | :--- | :--- |
| **Web Search** | Cloud / Server | DuckDuckGo scraping for current events & facts |
| **Run Code** | Isolated Scope | Secure JavaScript execution for data processing |
| **Calculate** | Specialized Engine | Precision math for formulas and arithmetic |
| **Summarize** | AI Pipeline | Condensation of long-form search results |

## 📦 Deployment Guide

### 1. Project Setup
- Clone the repository
- `npm install`
- Create a `.env.local` file with your `GOOGLE_GENAI_API_KEY`

### 2. Environment Variables
```env
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
```

### 3. Local Development
```bash
npm run dev
```

## 🔐 Security & Safety

- **Isolated Runtime**: Code execution happens in a restricted function scope with whitelisted globals.
- **Input Sanitization**: Search queries and code strings are validated and length-limited.
- **Privacy**: Tasks and history are stored locally in the browser's storage by default.

## 🎯 Test Tasks to Try

1. **Market Intelligence**: "Search for today's top AI news and summarize the 3 biggest stories"
2. **Algorithm Test**: "Write JavaScript to find all prime numbers up to 200 and count them"
3. **Financial Math**: "Calculate: If I invest $10,000 at 9% annual return for 15 years, what's the final amount? Show the formula."
4. **Competitor Analysis**: "Search for LangChain vs LlamaIndex comparison and tell me which is better for RAG pipelines"
5. **Combined Workflow**: "Generate the first 20 Fibonacci numbers, then calculate their average"
