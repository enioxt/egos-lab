'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { RequestMachine } from '@/domain/marketplace/state-machine';
import { ArrowRight, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';

export default function RequestPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        location: '',
        date: ''
    });

    const machine = new RequestMachine('draft');

    const handleNext = () => setStep(step + 1);

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-20 md:p-8">
            <div className="mx-auto max-w-md space-y-6">

                {/* Header */}
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Novo Pedido</h1>
                    <p className="text-slate-500">Encontre o profissional ideal em minutos.</p>
                </div>

                {/* Progress */}
                <div className="flex justify-between px-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`h-2 flex-1 rounded-full mx-1 transition-colors ${s <= step ? 'bg-primary' : 'bg-slate-200'}`} />
                    ))}
                </div>

                {/* Step 1: Category */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>O que você precisa?</CardTitle>
                            <CardDescription>Escolha a categoria do serviço.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {['Aulas de Direção', 'Regularização CNH', 'Psicologia de Trânsito', 'Recursos de Multa'].map((cat) => (
                                <Button
                                    key={cat}
                                    variant="outline"
                                    className={`justify-start text-left h-auto py-4 ${formData.category === cat ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                    onClick={() => setFormData({ ...formData, category: cat })}
                                >
                                    <span className="font-medium">{cat}</span>
                                </Button>
                            ))}
                            <Button className="mt-4 w-full" disabled={!formData.category} onClick={handleNext}>
                                Continuar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Details */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes do Pedido</CardTitle>
                            <CardDescription>Onde e quando será o serviço?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Título do Pedido</label>
                                <Input
                                    placeholder="Ex: Aula para habilitados na Zona Sul"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Localização (Bairro/Cidade)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Ex: Copacabana, Rio de Janeiro"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data Preferencial</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        className="pl-9"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                                <Button className="flex-1" onClick={handleNext}>Revisar</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                    <Card className="border-primary">
                        <CardHeader>
                            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <CardTitle>Pronto para enviar?</CardTitle>
                            <CardDescription>Seu pedido será enviado para profissionais qualificados.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-slate-50 p-4 space-y-3 border">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Categoria</span>
                                    <Badge variant="secondary">{formData.category}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Local</span>
                                    <span className="text-sm font-medium">{formData.location}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Data</span>
                                    <span className="text-sm font-medium">{formData.date}</span>
                                </div>
                            </div>

                            <div className="bg-amber-50 p-3 rounded text-xs text-amber-800 border border-amber-200">
                                ⚠️ Ao confirmar, você concorda que a plataforma apenas conecta as partes e não garante aprovação em exames.
                            </div>

                            <Button size="lg" className="w-full" onClick={() => alert('Quantum State Transition: OPEN -> Notifications sent!')}>
                                Confirmar e Solicitar Orçamentos
                            </Button>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
}
