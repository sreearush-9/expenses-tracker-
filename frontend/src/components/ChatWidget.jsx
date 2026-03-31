import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const SUGGESTED_PROMPTS = [
  '📊 Analyze my spending',
  '💡 Give me budget tips',
  '⚠️ Any unusual expenses?',
  '💰 How can I save more?',
];

const ChatWidget = () => {
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem('chatbot_enabled');
    return stored !== null ? stored === 'true' : true;
  });
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyFetched, setHistoryFetched] = useState(false);
  const messagesEndRef = useRef(null);

  // Persist enabled state
  useEffect(() => {
    localStorage.setItem('chatbot_enabled', enabled);
  }, [enabled]);

  // Fetch history on first open
  useEffect(() => {
    if (open && !historyFetched) {
      fetchHistory();
    }
  }, [open]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/chat/history');
      if (res.data.messages?.length > 0) {
        setMessages(res.data.messages.map((m) => ({ role: m.role, content: m.content })));
      } else {
        setMessages([{
          role: 'assistant',
          content: "👋 Hi! I'm your AI expense assistant. I can analyze your spending, suggest budgets, detect unusual expenses, and give you savings tips. How can I help?",
        }]);
      }
      setHistoryFetched(true);
    } catch {
      setMessages([{
        role: 'assistant',
        content: "👋 Hi! I'm your AI expense assistant. Ask me anything about your spending!",
      }]);
      setHistoryFetched(true);
    }
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await api.post('/chat', { message: userText });
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages([...newMessages, { role: 'assistant', content: `❌ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = () => {
    setEnabled((prev) => !prev);
    if (open) setOpen(false);
  };

  if (!enabled) {
    return (
      <button
        className="chat-toggle chat-toggle--disabled"
        onClick={handleToggleEnabled}
        title="Enable AI Assistant"
        id="btn-chat-enable"
      >
        🤖
        <span className="chat-toggle__badge chat-toggle__badge--off">OFF</span>
      </button>
    );
  }

  return (
    <div className="chat-widget">
      {/* Chat Panel */}
      {open && (
        <div className="chat-panel" id="chat-panel">
          {/* Header */}
          <div className="chat-panel__header">
            <div className="chat-panel__header-info">
              <div className="chat-panel__avatar">🤖</div>
              <div>
                <p className="chat-panel__title">AI Expense Assistant</p>
                <p className="chat-panel__status">Powered by Gemini 2.0 Flash</p>
              </div>
            </div>
            <div className="chat-panel__header-actions">
              <button
                className="chat-panel__disable-btn"
                onClick={handleToggleEnabled}
                title="Disable assistant"
              >
                Disable
              </button>
              <button
                className="chat-panel__close"
                onClick={() => setOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-msg chat-msg--${msg.role === 'user' ? 'user' : 'bot'}`}
              >
                {msg.role === 'assistant' && (
                  <span className="chat-msg__avatar">🤖</span>
                )}
                <div className="chat-msg__bubble">{msg.content}</div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg chat-msg--bot">
                <span className="chat-msg__avatar">🤖</span>
                <div className="chat-msg__bubble chat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (only when no real conversation yet) */}
          {messages.length <= 1 && !loading && (
            <div className="chat-suggestions">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  className="chat-suggestion-btn"
                  onClick={() => sendMessage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask about your expenses..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
              id="chat-input"
              autoFocus
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              id="btn-chat-send"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* FAB Toggle Button */}
      <button
        className={`chat-toggle ${open ? 'chat-toggle--open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        title={open ? 'Close assistant' : 'Open AI assistant'}
        id="btn-chat-toggle"
      >
        {open ? '✕' : '🤖'}
      </button>
    </div>
  );
};

export default ChatWidget;
