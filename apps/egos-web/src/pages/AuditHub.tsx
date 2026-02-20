import { useState } from 'react';
import { Search, Loader2, ShieldCheck, AlertTriangle, FileWarning, ArrowRight } from 'lucide-react';

export default function AuditHub() {
    const [repoUrl, setRepoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!repoUrl) return;

        setLoading(true);
        setResult(null);

        // TODO: Connect this to the actual /api/audit endpoint once built
        // For now, mock a delay and response for the MVP
        setTimeout(() => {
            setResult({
                repo: repoUrl,
                health: 85,
                findings: {
                    errors: 12,
                    warnings: 45,
                    info: 108
                },
                duration: "3.2s",
                status: "success"
            });
            setLoading(false);
        }, 2500);
    };

    return (
        <div className="layout-content fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '16px', background: 'linear-gradient(90deg, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Self-Service Audit Hub
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Cole a URL de qualquer repositório GitHub público e deixe nossos agentes de IA escanearem a arquitetura, vulnerabilidades e código morto em segundos.
                </p>
            </div>

            <div style={{ background: 'rgba(20, 20, 25, 0.6)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
                <form onSubmit={handleAudit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px', position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="url"
                            placeholder="https://github.com/usuario/repositorio"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '16px 16px 16px 48px',
                                color: '#fff',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s ease'
                            }}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#8b5cf6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0 32px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: loading ? 0.7 : 1,
                            transition: 'background 0.2s ease',
                            minHeight: '54px'
                        }}>
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                        {loading ? 'Analisando...' : 'Auditar Repo'}
                    </button>
                </form>
            </div>

            {result && (
                <div className="fade-in" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 4px 0', color: '#fff' }}>Resultado da Auditoria</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.9rem' }}>{result.repo}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{result.health}%</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Health Score</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                            <AlertTriangle size={24} color="#ef4444" style={{ margin: '0 auto 8px auto' }} />
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444' }}>{result.findings.errors}</div>
                            <div style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '0.85rem', fontWeight: 500 }}>Erros Críticos</div>
                        </div>

                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                            <FileWarning size={24} color="#f59e0b" style={{ margin: '0 auto 8px auto' }} />
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>{result.findings.warnings}</div>
                            <div style={{ color: 'rgba(245, 158, 11, 0.8)', fontSize: '0.85rem', fontWeight: 500 }}>Avisos</div>
                        </div>

                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                            <ShieldCheck size={24} color="#3b82f6" style={{ margin: '0 auto 8px auto' }} />
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3b82f6' }}>{result.findings.info}</div>
                            <div style={{ color: 'rgba(59, 130, 246, 0.8)', fontSize: '0.85rem', fontWeight: 500 }}>Info & SSOT</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 24px', color: '#fff', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Ver Relatório Completo <ArrowRight size={16} />
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                        Processado em {result.duration} por 10 Agentes EGOS
                    </div>
                </div>
            )}

            {/* Empty State / How it works */}
            {!result && !loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', opacity: 0.7 }}>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: '#8b5cf6', marginBottom: '12px', fontSize: '1.2rem', fontWeight: 700 }}>1. System Prompt Auditor</div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Verifica se o repositório segue regras definidas em Prompts de Sistema (como <code>.cursorrules</code>, <code>.windsurfrules</code> ou arquivos <code>context.md</code>) e aponta desvios arquiteturais, agnóstico a qual IDE a equipe utiliza.
                        </p>
                    </div>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: '#ec4899', marginBottom: '12px', fontSize: '1.2rem', fontWeight: 700 }}>2. Dead Code</div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Localiza exports que nunca são importados, arquivos vazios e componentes órfãos.
                        </p>
                    </div>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: '#10b981', marginBottom: '12px', fontSize: '1.2rem', fontWeight: 700 }}>3. Cortex Reviewer</div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Aciona a IA para revisar a complexidade ciclomática e buscar falhas de segurança lógicas e credenciais vazadas.
                        </p>
                    </div>

                    <div style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', gridColumn: '1 / -1' }}>
                        <div style={{ color: '#a5b4fc', marginBottom: '12px', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🚀 Provado em Produção
                        </div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Nossos agentes já auditaram grandes repositórios open-source do mundo real gerando relatórios completos da arquitetura atual deles:
                            <br />
                            <strong style={{ color: '#fff' }}>Medusa</strong> (2.427 findings), <strong style={{ color: '#fff' }}>Cal.com</strong> (1.469 findings), <strong style={{ color: '#fff' }}>Documenso</strong> (1.012 findings) e <strong style={{ color: '#fff' }}>tRPC</strong> (388 findings).
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}
