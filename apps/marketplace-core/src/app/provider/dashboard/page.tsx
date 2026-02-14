'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Calendar, DollarSign, Clock, Star } from 'lucide-react';

const MOCK_REQUESTS = [
    {
        id: 'req_1',
        title: 'Aulas para Habilitados',
        category: 'Medo de Dirigir',
        location: 'Copacabana, RJ',
        date: '15/02/2026',
        status: 'open',
        budget: 'R$ 80 - R$ 120'
    },
    {
        id: 'req_2',
        title: 'Reciclagem CNH',
        category: 'Legislação',
        location: 'Centro, RJ',
        date: 'Flexible',
        status: 'open',
        budget: 'R$ 200 - R$ 300'
    }
];

export default function ProviderDashboard() {
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Portal do Instrutor</h1>
                        <p className="text-slate-500">Bem-vindo, Carlos Silva.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-slate-500">Saldo Disponível</span>
                        <div className="text-xl font-bold text-emerald-600">R$ 1.250,00</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Propostas Ativas</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">4</div>
                            <p className="text-xs text-muted-foreground">2 visualizadas hoje</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Fechamento</CardTitle>
                            <Star className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">18%</div>
                            <p className="text-xs text-muted-foreground">+2% essa semana</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ganhos (Fev)</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ 3.400</div>
                            <p className="text-xs text-muted-foreground">+12% vs Jan</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Request Feed */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Pedidos na sua Área (Raio 5km)</h2>
                    {MOCK_REQUESTS.map((req) => (
                        <Card key={req.id}>
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{req.title}</h3>
                                            <Badge variant="outline">{req.category}</Badge>
                                        </div>
                                        <div className="flex items-center text-sm text-slate-500 gap-4">
                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.location}</span>
                                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {req.date}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden md:block">
                                            <div className="text-sm font-medium text-slate-900">{req.budget}</div>
                                            <div className="text-xs text-slate-500">Orçamento estimado</div>
                                        </div>
                                        <Button onClick={() => alert(`Enviando proposta para ${req.id}`)}>Enviar Proposta</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

            </div>
        </div>
    );
}
