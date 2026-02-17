/**
 * Chat Intelligence Service — RAG-powered responses via OpenRouter Gemini
 * Queries Supabase for relevant commits, then generates contextual answers.
 */

import { supabase } from '../lib/supabase';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const CHAT_MODEL = 'google/gemini-2.0-flash-001';

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
  // First try: keyword search in commit messages
  const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

  if (keywords.length === 0) {
    // Fallback: get most recent commits
    const { data } = await supabase
      .from('commits')
      .select('sha, message, author, date, repo')
      .order('date', { ascending: false })
      .limit(10);

    return data || [];
  }

  // Search by keyword matching
  const orFilter = keywords.map((k: string) => `message.ilike.%${k}%`).join(',');

  const { data } = await supabase
    .from('commits')
    .select('sha, message, author, date, repo')
    .or(orFilter)
    .order('date', { ascending: false })
    .limit(10);

  // If no keyword matches, fall back to recent
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
 * Generate a response using OpenRouter Gemini with commit context.
 */
export async function generateChatResponse(userMessage: string): Promise<string> {
  // 1. Get relevant commit context
  const context = await fetchRelevantContext(userMessage);

  if (!OPENROUTER_API_KEY) {
    // Fallback: return context-aware response without AI
    if (context.length === 0) {
      return "Ainda não tenho dados de commits. Execute o script de ingestão primeiro: `bun apps/egos-web/scripts/ingest-commits.ts`";
    }

    const commitList = context
      .slice(0, 5)
      .map((c: CommitContext) => `• [${c.repo}] ${c.message} (${c.author}, ${new Date(c.date).toLocaleDateString('pt-BR')})`)
      .join('\n');

    return `Encontrei ${context.length} commits relevantes:\n\n${commitList}\n\nPara respostas inteligentes com IA, configure VITE_OPENROUTER_API_KEY.`;
  }

  // 2. Build system prompt with context
  const contextStr = context
    .map((c: CommitContext) => `[${c.sha.slice(0, 7)}] ${c.repo}: ${c.message} — by ${c.author} on ${c.date}`)
    .join('\n');

  const systemPrompt = `You are EGOS Intelligence, the AI assistant for the EGOS Lab open-source project ecosystem.
You speak Portuguese (PT-BR) by default, but can switch to English if asked.

Your knowledge comes from the project's Git history. Here are the most relevant commits:

${contextStr || 'No commits loaded yet.'}

RULES:
- Be concise and technical
- Reference specific commits when relevant (use SHA prefix)
- If asked about architecture, refer to the monorepo structure (apps/, packages/, projects/)
- If asked about what exists, list real apps: eagle-eye (gazette monitor), egos-web (this site), radio-philein
- Be honest about what's implemented vs planned
- Use the "Sacred Code" sign-off only if asked about identity: 000.111.369.963.1618`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://egos.ia.br',
        'X-Title': 'EGOS Intelligence',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', errText);
      return `Erro na IA (${response.status}). Tente novamente.`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sem resposta da IA.';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Chat error:', err);
    return `Erro de conexão: ${msg}`;
  }
}
