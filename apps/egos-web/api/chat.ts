import type { VercelRequest, VercelResponse } from './_types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const CHAT_MODEL = 'google/gemini-2.0-flash-001';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI not configured' });
  }

  const { message, context } = req.body as { message?: string; context?: string };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing message' });
  }

  const systemPrompt = `You are EGOS Intelligence, the AI assistant for the EGOS Lab open-source project ecosystem.
You speak Portuguese (PT-BR) by default, but can switch to English if asked.

Your knowledge comes from the project's Git history. Here are the most relevant commits:

${context || 'No commits loaded yet.'}

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
          { role: 'user', content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', errText);
      return res.status(502).json({ error: `AI error (${response.status})` });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sem resposta da IA.';
    return res.status(200).json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Chat proxy error:', msg);
    return res.status(500).json({ error: msg });
  }
}
