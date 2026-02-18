import { NextResponse } from 'next/server';
import { handleIntelinkUpdate } from '@/lib/intelink-service';

export async function POST(req: Request) {
    try {
        const update = await req.json();
        await handleIntelinkUpdate(update);
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ [Intelink Webhook Error]:', message);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
