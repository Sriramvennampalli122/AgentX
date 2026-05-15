export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  type?: 'thinking' | 'tool_call' | 'tool_result' | 'final' | 'error';
  timestamp: number;
  toolName?: string;
}

export interface Session {
  id: string;
  task: string;
  status: 'running' | 'complete' | 'error';
  createdAt: number;
  toolCallCount: number;
  iterationCount: number;
  finalAnswer?: string;
  elapsedMs?: number;
}

// In-memory store for demonstration purposes as we can't guarantee a real Firestore connection in this sandbox
// In a real production app, these would be Firestore calls.
const SESSIONS_KEY = 'agentx_sessions';
const MESSAGES_KEY_PREFIX = 'agentx_messages_';

export const sessionStore = {
  saveSession: (session: Session) => {
    if (typeof window === 'undefined') return;
    const sessions = sessionStore.getSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    if (existingIndex > -1) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 50)));
  },

  getSessions: (): Session[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  deleteSession: (id: string) => {
    if (typeof window === 'undefined') return;
    const sessions = sessionStore.getSessions().filter(s => s.id !== id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${id}`);
  },

  saveMessage: (sessionId: string, message: Message) => {
    if (typeof window === 'undefined') return;
    const messages = sessionStore.getMessages(sessionId);
    messages.push(message);
    localStorage.setItem(`${MESSAGES_KEY_PREFIX}${sessionId}`, JSON.stringify(messages));
  },

  getMessages: (sessionId: string): Message[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${sessionId}`);
    return stored ? JSON.parse(stored) : [];
  }
};