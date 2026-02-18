'use client';

import React, { useEffect, useState } from 'react';
import { 
    Clock, Bell, User, FileText, MessageSquare, 
    Network, ChevronRight, X, Check, AlertTriangle,
    Users, Target, Eye
} from 'lucide-react';
import Link from 'next/link';

interface Activity {
    id: string;
    type: 'investigation_update' | 'entity_added' | 'chat_shared' | 'analysis_complete' | 'mention' | 'assignment';
    title: string;
    description?: string;
    timestamp: string;
    link?: string;
    read: boolean;
    actor?: string;
}

interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message?: string;
    timestamp: string;
    read: boolean;
    action_url?: string;
}

interface ActivityHistoryProps {
    memberId: string;
    isOpen: boolean;
    onClose: () => void;
    activeTab?: 'history' | 'notifications';
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
    investigation_update: FileText,
    entity_added: Users,
    chat_shared: MessageSquare,
    analysis_complete: Target,
    mention: User,
    assignment: Clock,
};

const NOTIFICATION_COLORS: Record<string, string> = {
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ActivityHistory({ memberId, isOpen, onClose, activeTab = 'history' }: ActivityHistoryProps) {
    const [tab, setTab] = useState<'history' | 'notifications'>(activeTab);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && memberId) {
            loadData();
        }
    }, [isOpen, memberId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load activities
            const actRes = await fetch(`/api/activities?member_id=${memberId}&limit=50`);
            if (actRes.ok) {
                const data = await actRes.json();
                setActivities(data.activities || []);
            }

            // Load notifications
            const notifRes = await fetch(`/api/notifications?member_id=${memberId}&limit=20`);
            if (notifRes.ok) {
                const data = await notifRes.json();
                setNotifications(data.notifications || []);
            }
        } catch (e) {
            console.error('Error loading activity data:', e);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (type: 'activity' | 'notification', id: string) => {
        try {
            const endpoint = type === 'activity' ? '/api/activities/read' : '/api/notifications/read';
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (type === 'activity') {
                setActivities(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
            } else {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            }
        } catch (e) {
            console.error('Error marking as read:', e);
        }
    };

    const markAllAsRead = async (type: 'activity' | 'notification') => {
        try {
            const endpoint = type === 'activity' ? '/api/activities/read-all' : '/api/notifications/read-all';
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId })
            });

            if (type === 'activity') {
                setActivities(prev => prev.map(a => ({ ...a, read: true })));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
        } catch (e) {
            console.error('Error marking all as read:', e);
        }
    };

    const unreadActivities = activities.filter(a => !a.read).length;
    const unreadNotifications = notifications.filter(n => !n.read).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
            <div className="w-full max-w-md bg-slate-900 border-l border-slate-700 h-full overflow-hidden flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Atividades
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => setTab('history')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                            tab === 'history' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            Histórico
                            {unreadActivities > 0 && (
                                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {unreadActivities}
                                </span>
                            )}
                        </div>
                        {tab === 'history' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setTab('notifications')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                            tab === 'notifications' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Bell className="w-4 h-4" />
                            Notificações
                            {unreadNotifications > 0 && (
                                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {unreadNotifications}
                                </span>
                            )}
                        </div>
                        {tab === 'notifications' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                        )}
                    </button>
                </div>

                {/* Mark all as read */}
                {((tab === 'history' && unreadActivities > 0) || (tab === 'notifications' && unreadNotifications > 0)) && (
                    <div className="px-4 py-2 border-b border-slate-800">
                        <button
                            onClick={() => markAllAsRead(tab === 'history' ? 'activity' : 'notification')}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            <Check className="w-3 h-3" />
                            Marcar tudo como lido
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : tab === 'history' ? (
                        <div className="divide-y divide-slate-800">
                            {activities.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma atividade recente</p>
                                </div>
                            ) : (
                                activities.map(activity => {
                                    const Icon = ACTIVITY_ICONS[activity.type] || Clock;
                                    return (
                                        <div
                                            key={activity.id}
                                            onClick={() => !activity.read && markAsRead('activity', activity.id)}
                                            className={`p-4 hover:bg-slate-800/50 transition-colors ${
                                                !activity.read ? 'bg-blue-500/5' : ''
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center
                                                    ${!activity.read ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}
                                                `}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className={`font-medium ${!activity.read ? 'text-white' : 'text-slate-300'}`}>
                                                            {activity.title}
                                                        </h4>
                                                        {!activity.read && (
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                                                        )}
                                                    </div>
                                                    {activity.description && (
                                                        <p className="text-sm text-slate-500 mt-0.5">{activity.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                        <span>{new Date(activity.timestamp).toLocaleString('pt-BR')}</span>
                                                        {activity.actor && (
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {activity.actor}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {activity.link && (
                                                        <Link
                                                            href={activity.link}
                                                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                                        >
                                                            Ver detalhes
                                                            <ChevronRight className="w-3 h-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {notifications.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma notificação</p>
                                </div>
                            ) : (
                                notifications.map(notif => {
                                    const colorClass = NOTIFICATION_COLORS[notif.type];
                                    const NotifIcon = notif.type === 'warning' ? AlertTriangle : 
                                                      notif.type === 'success' ? Check : 
                                                      notif.type === 'error' ? AlertTriangle : Bell;
                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => !notif.read && markAsRead('notification', notif.id)}
                                            className={`p-4 hover:bg-slate-800/50 transition-colors ${
                                                !notif.read ? 'bg-blue-500/5' : ''
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${colorClass}`}>
                                                    <NotifIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className={`font-medium ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        {!notif.read && (
                                                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                                                        )}
                                                    </div>
                                                    {notif.message && (
                                                        <p className="text-sm text-slate-500 mt-0.5">{notif.message}</p>
                                                    )}
                                                    <span className="text-xs text-slate-500 mt-2 block">
                                                        {new Date(notif.timestamp).toLocaleString('pt-BR')}
                                                    </span>
                                                    {notif.action_url && (
                                                        <Link
                                                            href={notif.action_url}
                                                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                                        >
                                                            Ver mais
                                                            <ChevronRight className="w-3 h-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
