
import React, { useState } from 'react';

// 🤖 The Community Chat Widget
// Implements the "Hitchhiker Guide" flow.

const CommunityChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ text: string, sender: 'bot' | 'user' }[]>([
        { text: "Olá! Sou o Eagle Eye. Vi que você está navegando no Lab.", sender: 'bot' },
        { text: "Quer saber como contribuir ou ver o código fonte?", sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState("");

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { text: inputValue, sender: 'user' }]);
        setInputValue("");

        // Mock Bot Response (Simulating AI)
        setTimeout(() => {
            const responses = [
                "Interessante! Vou registrar isso no RHO.",
                "Você sabia que pode ganhar pontos contribuindo?",
                "Esse projeto é open-source. Tente rodar 'bun rho' no terminal!",
                "Estou analisando seus commits... brincadeira (ainda não)."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            setMessages(prev => [...prev, { text: randomResponse, sender: 'bot' }]);
        }, 1000);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            fontFamily: 'sans-serif'
        }}>
            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: '300px',
                    height: '400px',
                    background: 'rgba(20, 20, 30, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '12px',
                        borderBottom: '1px solid #333',
                        background: 'rgba(255,255,255,0.05)',
                        borderTopLeftRadius: '12px',
                        borderTopRightRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>EGOS</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px' }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.sender === 'user' ? '#3b82f6' : '#222',
                                color: '#eee',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                maxWidth: '80%',
                                fontSize: '14px',
                                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
                                borderTopLeftRadius: msg.sender === 'bot' ? '2px' : '12px'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div style={{ padding: '12px', borderTop: '1px solid #333', display: 'flex' }}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Digite algo..."
                            style={{
                                flex: 1,
                                background: '#111',
                                border: '1px solid #333',
                                borderRadius: '20px',
                                padding: '8px 12px',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '24px'
                    }}
                >
                    🦅
                </button>
            )}
        </div>
    );
};

export default CommunityChat;
