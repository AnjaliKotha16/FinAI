import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../components/PageHeader';
import { aiService } from '../services/aiService';
import './AIAssistantPage.css';

const SUGGESTED_QUESTIONS = [
  'How much did I spend this month?',
  'What category do I spend the most on?',
  'How much did I save this month?',
  'Am I staying within my budget?',
  'How much do I need to save for my goal?',
  'How is my spending different from last month?',
  'Explain my current financial situation.'
];

export const AIAssistantPage = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load user conversation list on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsInitialLoading(true);
      const res = await aiService.getConversations();
      if (res.ok && res.data?.data) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Load selected conversation history
  const loadConversation = async (convId) => {
    try {
      setErrorMsg(null);
      setIsLoading(true);
      const res = await aiService.getConversationById(convId);
      if (res.ok && res.data?.data) {
        setCurrentConversationId(res.data.data._id);
        setMessages(res.data.data.messages || []);
      } else {
        setErrorMsg(res.data?.message || 'Failed to load conversation messages.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to AI service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setErrorMsg(null);
    setInputText('');
  };

  // Delete conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const res = await aiService.deleteConversation(convId);
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c._id !== convId));
        if (currentConversationId === convId) {
          startNewConversation();
        }
      } else {
        setErrorMsg(res.data?.message || 'Could not delete conversation.');
      }
    } catch (err) {
      setErrorMsg('Failed to delete conversation.');
    }
  };

  // Send message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text || text.trim().length === 0 || isLoading) return;

    setErrorMsg(null);
    const userMsg = text.trim();
    setInputText('');

    // Optimistically push user message to UI
    const tempUserMsg = {
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await aiService.sendMessage(userMsg, currentConversationId);

      if (res.ok && res.data?.success) {
        const assistantMsg = res.data.message;
        const newConvId = res.data.conversationId;

        if (!currentConversationId && newConvId) {
          setCurrentConversationId(newConvId);
        }

        setMessages((prev) => [...prev, assistantMsg]);
        // Refresh sidebar conversation list
        fetchConversations();
      } else {
        const errMsg = res.data?.message || 'The AI assistant is temporarily unavailable. Please try again shortly.';
        setErrorMsg(errMsg);
      }
    } catch (err) {
      setErrorMsg('The AI assistant is temporarily unavailable. Please try again shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format assistant text with basic bold & list rendering
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split by newlines
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Bold replacement (**word**)
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <div key={idx} style={{ minHeight: line.trim() === '' ? '8px' : 'auto' }}>
          {formattedLine}
        </div>
      );
    });
  };

  return (
    <div className="ai-assistant-container">
      <PageHeader
        title="AI Financial Assistant"
        subtitle="Ask questions about your spending, savings, budgets, goals, and financial plans."
        phaseBadge="Phase 12"
        icon="🤖"
      />

      {errorMsg && (
        <div className="error-banner">
          <span>⚠️ {errorMsg}</span>
          <button className="dismiss-error" onClick={() => setErrorMsg(null)}>
            ✕
          </button>
        </div>
      )}

      <div className="ai-layout">
        {/* Sidebar / Conversation Drawer */}
        <div className="ai-sidebar">
          <div className="ai-sidebar-header">
            <span className="ai-sidebar-title">💬 Chat History</span>
          </div>

          <button className="new-chat-btn" onClick={startNewConversation}>
            <span>+</span> New Conversation
          </button>

          <div className="conversations-list">
            {isInitialLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '8px' }}>
                Loading history...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '8px' }}>
                No prior conversations found.
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`conversation-item ${currentConversationId === conv._id ? 'active' : ''}`}
                  onClick={() => loadConversation(conv._id)}
                >
                  <div className="conv-info">
                    <span className="conv-title">{conv.title}</span>
                    <span className="conv-date">
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <button
                    className="delete-conv-btn"
                    title="Delete Conversation"
                    onClick={(e) => handleDeleteConversation(e, conv._id)}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Main Window */}
        <div className="ai-chat-main">
          <div className="ai-chat-header">
            <div className="chat-header-info">
              <div className="bot-avatar-badge">🤖</div>
              <div>
                <div className="chat-title-text">FinAI Assistant</div>
                <div className="chat-status-indicator">
                  <span className="chat-status-dot"></span> Online & Personalized to your data
                </div>
              </div>
            </div>

            {messages.length > 0 && (
              <button className="clear-chat-btn" onClick={startNewConversation}>
                Clear Screen
              </button>
            )}
          </div>

          {/* Messages Container */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-chat-state">
                <div className="welcome-icon">💡</div>
                <h3 className="welcome-title">Ask me anything about your finances</h3>
                <p className="welcome-desc">
                  I retrieve your authentic transactions, budgets, goals, and risk profile to answer questions grounded in your actual data.
                </p>

                <div className="suggested-section">
                  <div className="suggested-title">Suggested Questions</div>
                  <div className="suggested-grid">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        className="suggested-chip"
                        onClick={() => handleSendMessage(q)}
                      >
                        <span>❓</span> {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message-wrapper ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div>
                    <div className="message-bubble">
                      {renderFormattedText(msg.content)}
                    </div>
                    <div className="message-time">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="loading-wrapper">
                <div className="typing-dots">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
                <span>Analyzing your financial information...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form Bar */}
          <div className="ai-input-container">
            <form
              className="input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                className="chat-input"
                placeholder="Ask about your spending, savings, budgets, or goals..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={isLoading || !inputText.trim()}
              >
                <span>Send</span> ➔
              </button>
            </form>
            <div className="persistent-disclaimer">
              This information is for educational and planning purposes only and is not a guarantee of investment performance or a substitute for professional financial advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
