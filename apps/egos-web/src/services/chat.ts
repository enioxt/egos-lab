/**
 * Chat Intelligence Service — RAG-powered responses via serverless proxy
 * Queries Supabase for relevant commits, then calls /api/chat (server-side).
 * NO secrets are exposed to the client bundle.
 */

import { supabase } from '../lib/supabase';

interface CommitContext {
  sha: string;
  message: string;
  author: string;
  date: string;
  repo: string;
}

/**
 * Fetch recent commits from Supabase as context for the chat.
 */
async function fetchRelevantContext(query: string): Promise<CommitContext[]> {
  const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

  if (keywords.length === 0) {
    const { data } = await supabase
      .from('commits')
      .select('sha, message, author, date, repo')
      .order('date', { ascending: false })
      .limit(10);
    return data || [];
  }

  const orFilter = keywords.map((k: string) => `message.ilike.%${k}%`).join(',');

  const { data } = await supabase
    .from('commits')
    .select('sha, message, author, date, repo')
    .or(orFilter)
    .order('date', { ascending: false })
    .limit(10);

  if (!data || data.length === 0) {
    const { data: recent } = await supabase
      .from('commits')
      .select('sha, message, author, date, repo')
      .order('date', { ascending: false })
      .limit(10);
    return recent || [];
  }

  return data;
}

/**
 * Generate a response via /api/chat serverless proxy.
 */
export async function generateChatResponse(userMessage: string): Promise<string> {
  const context = await fetchRelevantContext(userMessage);

  const contextStr = context
    .map((c: CommitContext) => `[${c.sha.slice(0, 7)}] ${c.repo}: ${c.message} — by ${c.author} on ${c.date}`)
    .join('\n');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, context: contextStr }),
    });

    if (!res.ok) {
      if (res.status === 503) {
        // AI not configured — return local fallback
        if (context.length === 0) {
          return 'Ainda não tenho dados de commits carregados.';
        }
        const commitList = context
          .slice(0, 5)
          .map((c: CommitContext) => `• [${c.repo}] ${c.message} (${c.author}, ${new Date(c.date).toLocaleDateString('pt-BR')})`)
          .join('\n');
        return `Encontrei ${context.length} commits relevantes:\n\n${commitList}`;
      }
      return `Erro na IA (${res.status}). Tente novamente.`;
    }

    const data = await res.json();
    return data.reply || 'Sem resposta da IA.';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Chat error:', err);
    return `Erro de conexão: ${msg}`;
  }
}
