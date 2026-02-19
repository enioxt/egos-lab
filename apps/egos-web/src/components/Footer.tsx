import React from 'react';
import { Linkedin, Github, Twitter, Send } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer style={{
            padding: '40px 20px',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            marginTop: '40px',
            background: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 10
        }}>
            <div style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 500 }}>
                Conecte-se com Enio Rocha (Criador do EGOS)
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                alignItems: 'center'
            }}>
                <a
                    href="https://www.linkedin.com/in/eniorochaxt"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0077b5', transition: 'transform 0.2s', display: 'flex' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    aria-label="LinkedIn"
                >
                    <Linkedin size={24} />
                </a>
                <a
                    href="https://github.com/enioxt"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#fff', transition: 'transform 0.2s', display: 'flex' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    aria-label="GitHub"
                >
                    <Github size={24} />
                </a>
                <a
                    href="https://x.com/anoineim"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#fff', transition: 'transform 0.2s', display: 'flex' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    aria-label="X (Twitter)"
                >
                    <Twitter size={24} />
                </a>
                <a
                    href="https://t.me/ethikin"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0088cc', transition: 'transform 0.2s', display: 'flex' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    aria-label="Telegram"
                >
                    <Send size={24} />
                </a>
            </div>
        </footer>
    );
};

export default Footer;
