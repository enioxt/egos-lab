'use client';
/**
 * AI Operator Chatbot — Context-Aware Assistant
 * 
 * Knows the entire system, guides operators through tasks,
 * diagnoses errors, updates prices via natural language,
 * and escalates to human support when needed.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    escalated?: boolean;
}

const SYSTEM_CONTEXT = `Você é o Assistente Nexus, um operador IA do Nexus Market.
Você ajuda motoristas e comerciantes com:
- Cadastro de produtos (nome, preço, categoria)
- Import de CSV (formato, encoding, colunas obrigatórias)
- Gestão de estoque (atualizar preços, adicionar imagens)
- Entregas (status, rotas, problemas)
- Diagnóstico de erros (CSV não importou, imagem não carregou)

Regras:
1. Responda SEMPRE em português brasileiro
2. Seja conciso e direto
3. Use emojis para clareza visual
4. Se não souber, diga honestamente
5. Para pagamentos/billing → escale para humano
6. Após 3 tentativas sem resolver → escale automaticamente

Funções especiais:
- "atualizar preço [produto] para R$[valor]" → confirme e execute
- "quantos produtos tenho?" → consulte Supabase
- "quais sem imagem?" → liste produtos sem image_url`;

const ESCALATION_KEYWORDS = ['humano', 'suporte', 'ajuda humana', 'falar com pessoa', 'atendente'];
const PAYMENT_KEYWORDS = ['pagamento', 'pagar', 'cobrança', 'fatura', 'billing', 'assinatura'];

// AI-powered responses (mock for now, wired to OpenRouter in production)
function generateResponse(userMessage: string, history: Message[]): string {
    const lower = userMessage.toLowerCase();

    // Escalation check
    if (ESCALATION_KEYWORDS.some(k => lower.includes(k))) {
        return '🙋 Entendido! Estou encaminhando você para um atendente humano. Ticket #' +
            Math.floor(Math.random() * 9000 + 1000) + ' criado. Tempo estimado: 5 minutos.';
    }

    // Payment → always escalate
    if (PAYMENT_KEYWORDS.some(k => lower.includes(k))) {
        return '💰 Questões de pagamento são tratadas pela equipe financeira. Encaminhando para suporte humano. Ticket #' +
            Math.floor(Math.random() * 9000 + 1000) + ' criado.';
    }

    // Product help
    if (lower.includes('cadastrar') || lower.includes('adicionar produto')) {
        return `📦 Para cadastrar um produto:\n\n1. Vá em **Produtos** → **Novo Produto**\n2. Preencha: nome, preço, categoria\n3. A IA vai buscar imagens automaticamente\n4. Revise e confirme\n\nOu use o **scanner de código de barras** na tela do Motorista para preenchimento automático!`;
    }

    if (lower.includes('csv') || lower.includes('importar') || lower.includes('planilha')) {
        return `📄 Para importar via CSV:\n\n1. Vá em **Importar** no menu lateral\n2. Arraste seu arquivo .csv\n3. Colunas obrigatórias: \`nome\`, \`preco\`\n4. Opcionais: \`categoria\`, \`marca\`, \`peso\`\n5. Separador: vírgula ou ponto-e-vírgula\n\n⚠️ **Encoding:** Use UTF-8. Se os acentos estiverem errados, salve o arquivo como UTF-8 no Excel.`;
    }

    if (lower.includes('preço') || lower.includes('preco') || lower.includes('atualizar')) {
        const priceMatch = lower.match(/(?:para|por)\s*r?\$?\s*(\d+[.,]?\d*)/);
        if (priceMatch) {
            const price = priceMatch[1].replace(',', '.');
            return `💲 Confirma a atualização de preço para **R$ ${parseFloat(price).toFixed(2)}**?\n\n✅ Digite "sim" para confirmar\n❌ Digite "não" para cancelar`;
        }
        return `💲 Para atualizar preços:\n\n1. **Individual:** Vá em Produtos → clique no produto → edite o preço\n2. **Em massa:** Diga "aumentar 10% em laticínios" e eu aplico\n3. **Por voz:** "Arroz 5kg por 24.90"\n\nQual método prefere?`;
    }

    if (lower.includes('imagem') || lower.includes('foto') || lower.includes('sem imagem')) {
        return `🖼️ Produtos sem imagem podem ser enriquecidos assim:\n\n1. **Automático:** Na importação, a IA busca imagens pela web (Serper API)\n2. **Manual:** Clique no produto → Upload de foto\n3. **IA:** Use o botão "Gerar Imagem" para criar via AI\n\nDica: O **PhotoHunter** tenta 3 fontes antes de gerar artificialmente!`;
    }

    if (lower.includes('quantos') || lower.includes('produto')) {
        return `📊 Consultando seu catálogo...\n\n• **Total:** 15 produtos cadastrados\n• **Com imagem:** 12 (80%)\n• **Qualidade IA > 70%:** 10 produtos\n• **Sem categoria:** 2 produtos\n\n💡 Dica: Importe mais produtos via CSV para crescer seu catálogo!`;
    }

    if (lower.includes('entrega') || lower.includes('rota') || lower.includes('pedido')) {
        return `🚚 Resumo de entregas:\n\n• **Ativas:** 3 entregas pendentes\n• **Próxima:** Maria Silva — 2.3 km\n• **Rota otimizada:** Centro → Jd. América → Sta. Efigênia\n\nUse o **Painel do Motorista** para atualizar status em tempo real!`;
    }

    if (lower === 'sim' || lower === 'confirmar') {
        return `✅ Atualização confirmada e aplicada! O preço foi alterado com sucesso.`;
    }

    // Default helpful response
    return `🤖 Posso ajudar com:\n\n• 📦 **Produtos** — cadastrar, importar CSV, buscar imagens\n• 💲 **Preços** — atualizar individual ou em massa\n• 🚚 **Entregas** — status, rotas, problemas\n• 📊 **Relatórios** — estoque, qualidade, vendas\n• 🔧 **Erros** — diagnóstico e resolução\n\nDigite sua dúvida ou "humano" para falar com suporte.`;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: '👋 Olá! Sou o Assistente Nexus. Como posso ajudar você hoje?\n\nPosso ajudar com produtos, entregas, importações, preços e muito mais.',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-focus input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = useCallback(() => {
        if (!input.trim() || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response delay
        setTimeout(() => {
            const response = generateResponse(userMessage.content, messages);
            const isEscalated = ESCALATION_KEYWORDS.some(k => userMessage.content.toLowerCase().includes(k)) ||
                PAYMENT_KEYWORDS.some(k => userMessage.content.toLowerCase().includes(k));

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                escalated: isEscalated,
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsTyping(false);

            // Track attempts for auto-escalation
            if (!isEscalated) {
                setAttemptCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 3) {
                        setTimeout(() => {
                            setMessages(prev2 => [...prev2, {
                                id: (Date.now() + 2).toString(),
                                role: 'system',
                                content: '⚠️ Percebo que estou tendo dificuldade em resolver sua questão. Encaminhando para um atendente humano automaticamente. Ticket #' + Math.floor(Math.random() * 9000 + 1000),
                                timestamp: new Date(),
                                escalated: true,
                            }]);
                        }, 1000);
                        return 0;
                    }
                    return newCount;
                });
            }
        }, 800 + Math.random() * 700);
    }, [input, isTyping, messages]);

    const quickActions = [
        { label: '📦 Cadastrar produto', msg: 'Como cadastrar um produto?' },
        { label: '📄 Importar CSV', msg: 'Como importar uma planilha?' },
        { label: '💲 Atualizar preços', msg: 'Como atualizar preços?' },
        { label: '📊 Meu catálogo', msg: 'Quantos produtos tenho?' },
        { label: '🚚 Entregas', msg: 'Como estão minhas entregas?' },
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 80px)',
            maxWidth: '800px',
            margin: '0 auto',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f1f5f9',
                background: 'white',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                    }}>
                        🤖
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Assistente Nexus</div>
                        <div style={{ fontSize: '12px', color: '#10b981' }}>● Online — IA + Suporte Humano</div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: '#fafbfc',
            }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                        <div style={{
                            maxWidth: '85%',
                            padding: '14px 18px',
                            borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: msg.role === 'user' ? '#3b82f6' :
                                msg.role === 'system' ? '#fef3c7' : 'white',
                            color: msg.role === 'user' ? 'white' :
                                msg.role === 'system' ? '#92400e' : '#0f172a',
                            boxShadow: msg.role !== 'user' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                            border: msg.escalated ? '2px solid #f59e0b' : 'none',
                            fontSize: '14px',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                        }}>
                            {msg.content}
                            <div style={{
                                fontSize: '11px',
                                marginTop: '8px',
                                opacity: 0.6,
                                textAlign: msg.role === 'user' ? 'right' : 'left',
                            }}>
                                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            padding: '14px 18px',
                            borderRadius: '18px 18px 18px 4px',
                            background: 'white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            color: '#94a3b8',
                            fontSize: '14px',
                        }}>
                            <span className="typing-dots">●  ●  ●</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
                <div style={{
                    padding: '12px 24px',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    background: '#fafbfc',
                    borderTop: '1px solid #f1f5f9',
                }}>
                    {quickActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setInput(action.msg);
                                setTimeout(() => {
                                    setInput(action.msg);
                                    handleSend();
                                }, 100);
                            }}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '20px',
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                color: '#475569',
                                cursor: 'pointer',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                            }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div style={{
                padding: '16px 24px',
                background: 'white',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                gap: '8px',
            }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder='Pergunte sobre produtos, entregas, preços...'
                    style={{
                        flex: 1,
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: '2px solid #e2e8f0',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={isTyping || !input.trim()}
                    style={{
                        padding: '14px 24px',
                        borderRadius: '14px',
                        border: 'none',
                        background: isTyping || !input.trim() ? '#e2e8f0' : '#3b82f6',
                        color: isTyping || !input.trim() ? '#94a3b8' : 'white',
                        fontWeight: 600,
                        cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                    }}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}
