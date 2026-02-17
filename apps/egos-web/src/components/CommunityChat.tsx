import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generateChatResponse } from '../services/chat';

const CommunityChat: React.FC = () => {
    const {
        isChatOpen,
        setChatOpen,
        messages,
        addMessage,
        userQuery,
        setUserQuery,
        isThinking,
        setIsThinking,
    } = useAppStore();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    return (
        <>
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        className="chat-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-left">
                                <Sparkles size={16} className="chat-sparkle" />
                                <span className="chat-title">EGOS Intelligence</span>
                            </div>
                            <button className="chat-close" onClick={() => setChatOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    className={`chat-bubble ${msg.sender}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                >
                                    {msg.text}
                                </motion.div>
                            ))}
                            {isThinking && (
                                <div className="chat-bubble bot thinking">
                                    <Loader2 size={14} className="spin" />
                                    <span>Analisando...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chat-input-area">
                            <input
                                type="text"
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Pergunte sobre o projeto..."
                                className="chat-input"
                                disabled={isThinking}
                            />
                            <button
                                className="chat-send"
                                onClick={handleSend}
                                disabled={isThinking || !userQuery.trim()}
                            >
                                {isThinking ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            {!isChatOpen && (
                <motion.button
                    className="chat-fab"
                    onClick={() => setChatOpen(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Sparkles size={24} />
                </motion.button>
            )}
        </>
    );
};

export default CommunityChat;
