import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const SUGGESTED_PROMPTS = [
  "Why did I overspend this month?",
  "What's my biggest expense category?",
  "How can I save more money?",
  "Show me my recent recurring bills"
];

/* Inject keyframes once for the bounce + pulse + spin animations */
const styleId = 'ai-chat-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes aichat-bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }
    @keyframes aichat-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes aichat-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI financial advisor. Ask me anything about your spending, trends, or how to save more.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredPrompt, setHoveredPrompt] = useState(null);
  const [sendHovered, setSendHovered] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: messageText });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);

      let errorMessage = "Sorry, I'm having trouble analyzing your data right now. Please try again later.";
      if (err.response?.status === 429) {
        errorMessage = "You've reached the limit for AI requests. Please wait a few minutes and try again.";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /* ── Style helpers ── */
  const getBubbleStyle = (msg) => {
    if (msg.role === 'user') {
      return {
        padding: '12px 16px',
        borderRadius: '18px 18px 4px 18px',
        background: 'linear-gradient(135deg, #059669, #10b981)',
        color: '#ffffff',
      };
    }
    if (msg.isError) {
      return {
        padding: '12px 16px',
        borderRadius: '18px 18px 18px 4px',
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: '#f87171',
      };
    }
    return {
      padding: '12px 16px',
      borderRadius: '18px 18px 18px 4px',
      background: '#1a1a1a',
      border: '1px solid #222222',
      color: '#e5e7eb',
    };
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#111111',
      border: '1px solid #1a1a1a',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'linear-gradient(to right, #111111, #151515)',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(16,185,129,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#10b981',
        }}>
          <Sparkles size={16} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontWeight: 600, color: '#ffffff', fontSize: '0.95rem' }}>
            Expense IT AI
          </h2>
          <p style={{
            margin: 0,
            fontSize: '0.7rem',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              display: 'inline-block',
              animation: 'aichat-pulse 2s ease-in-out infinite',
            }} />
            Online
          </p>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              display: 'flex',
              maxWidth: '85%',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}>
              {/* Avatar */}
              <div style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 4,
                ...(msg.role === 'user'
                  ? { background: '#222222', color: '#9ca3af', marginLeft: 12 }
                  : { background: '#10b981', color: '#ffffff', marginRight: 12 }
                ),
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Bubble + timestamp */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={getBubbleStyle(msg)}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                  }}>
                    {msg.content}
                  </p>
                </div>
                <span style={{
                  fontSize: 10,
                  color: '#6b7280',
                  marginTop: 4,
                  paddingLeft: 4,
                  paddingRight: 4,
                }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', justifyContent: 'flex-start' }}
          >
            <div style={{ display: 'flex', maxWidth: '85%', flexDirection: 'row' }}>
              <div style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                marginRight: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 4,
              }}>
                <Bot size={16} />
              </div>
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #222222',
                padding: 16,
                borderRadius: '18px 18px 18px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'rgba(16,185,129,0.5)',
                      animation: `aichat-bounce 1.4s ease-in-out ${delay}ms infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div style={{
        padding: 16,
        borderTop: '1px solid #1a1a1a',
        background: '#111111',
      }}>
        {/* Suggested Prompts */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          paddingBottom: 12,
          gap: 8,
        }}>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              onMouseEnter={() => setHoveredPrompt(idx)}
              onMouseLeave={() => setHoveredPrompt(null)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 12px',
                borderRadius: 9999,
                background: hoveredPrompt === idx ? '#222222' : '#1a1a1a',
                border: hoveredPrompt === idx ? '1px solid rgba(16,185,129,0.3)' : '1px solid #2a2a2a',
                color: '#d1d5db',
                fontSize: '0.75rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input + Send */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Ask about your finances..."
            disabled={loading}
            style={{
              width: '100%',
              background: '#1a1a1a',
              border: inputFocused ? '1px solid #10b981' : '1px solid #2a2a2a',
              borderRadius: 9999,
              padding: '12px 48px 12px 16px',
              color: '#ffffff',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: inputFocused ? '0 0 0 1px #10b981' : 'none',
              opacity: loading ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            onMouseEnter={() => setSendHovered(true)}
            onMouseLeave={() => setSendHovered(false)}
            style={{
              position: 'absolute',
              right: 8,
              padding: 8,
              background: (!input.trim() || loading) ? '#374151' : (sendHovered ? '#059669' : '#10b981'),
              color: '#ffffff',
              borderRadius: '50%',
              border: 'none',
              cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
          >
            {loading
              ? <Loader2 size={16} style={{ animation: 'aichat-spin 1s linear infinite' }} />
              : <Send size={16} style={{ marginLeft: 1 }} />
            }
          </button>
        </form>
      </div>
    </div>
  );
}
