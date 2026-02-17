import type { IncomingMessage, ServerResponse } from 'http';

export type VercelRequest = IncomingMessage & {
  body: Record<string, unknown>;
  query: Record<string, string>;
};

export type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
};
