import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles, Bot, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generateChatResponse } from '../services/chat';

const IntelligenceChat: React.FC = () => {
  const {
    messages,
    addMessage,
    userQuery,
    setUserQuery,
    isThinking,
    setIsThinking,
  } = useAppStore();

  const messagesAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const query = userQuery.trim();
    if (!query || isThinking) return;

    addMessage({ text: query, sender: 'user', timestamp: Date.now() });
    setUserQuery('');
    setIsThinking(true);

    try {
      const response = await generateChatResponse(query);
      addMessage({ text: response, sender: 'bot', timestamp: Date.now() });
    } catch {
      addMessage({
        text: 'Erro ao processar. Tente novamente.',
        sender: 'bot',
        timestamp: Date.now(),
      });
    } finally {
      setIsThinking(false);
    }
  };

  const suggestions = [
    'O que é o Eagle Eye?',
    'Quais projetos estão ativos?',
    'Como contribuir?',
    'Qual a arquitetura do sistema?',
  ];

  return (
    <section id="intelligence" className="intelligence">
      <motion.div
        className="section-intro"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="section-title">EGOS Intelligence</h2>
        <p className="section-desc">
          Converse com a IA do ecossistema. Ela conhece todos os commits,
          projetos e decisões de arquitetura.
        </p>
      </motion.div>

      <div className="chat-container">
        {/* Messages Area */}
        <div ref={messagesAreaRef} className="chat-messages-area">
          {messages.length === 0 && (
            <div className="chat-empty">
              <Sparkles size={32} className="chat-empty-icon" />
              <p className="chat-empty-title">Olá! Sou o EGOS Intelligence.</p>
              <p className="chat-empty-desc">
                Posso te contar sobre qualquer projeto, decisão técnica,
                ou ajudar a entender o ecossistema.
              </p>
              <div className="chat-suggestions">
                {suggestions.map(s => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    onClick={() => {
                      setUserQuery(s);
                      setTimeout(() => {
                        const fakeEvent = { key: 'Enter' };
                        if (fakeEvent.key === 'Enter') {
                          addMessage({ text: s, sender: 'user', timestamp: Date.now() });
                          setUserQuery('');
                          setIsThinking(true);
                          generateChatResponse(s).then(response => {
                            addMessage({ text: response, sender: 'bot', timestamp: Date.now() });
                            setIsThinking(false);
                          }).catch(() => {
                            addMessage({ text: 'Erro ao processar.', sender: 'bot', timestamp: Date.now() });
                            setIsThinking(false);
                          });
                        }
                      }, 50);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`chat-msg ${msg.sender}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="msg-avatar">
                {msg.sender === 'bot' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className="msg-content">
                <span className="msg-sender">{msg.sender === 'bot' ? 'EGOS' : 'Você'}</span>
                <p className="msg-text">{msg.text}</p>
              </div>
            </motion.div>
          ))}

          {isThinking && (
            <div className="chat-msg bot">
              <div className="msg-avatar"><Bot size={14} /></div>
              <div className="msg-content">
                <span className="msg-sender">EGOS</span>
                <p className="msg-text thinking-text">
                  <Loader2 size={14} className="spin" /> Analisando...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="chat-input-bar">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte sobre o ecossistema EGOS..."
            className="chat-input-field"
            disabled={isThinking}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={isThinking || !userQuery.trim()}
          >
            {isThinking ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </section>
  );
};

export default IntelligenceChat;
