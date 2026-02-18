/**
 * Journeys API - List and manage Investigation Journeys
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List journeys
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const investigationId = searchParams.get('investigation_id');
        const status = searchParams.get('status') || 'all';
        const limit = parseInt(searchParams.get('limit') || '20');
        
        let query = supabase
            .from('intelink_journeys')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (userId) {
            query = query.eq('user_id', userId);
        }
        
        if (investigationId) {
            query = query.eq('investigation_id', investigationId);
        }
        
        if (status !== 'all') {
            query = query.eq('status', status);
        }
        
        const { data: journeys, error } = await query;
        
        if (error) throw error;
        
        return NextResponse.json({
            journeys: journeys || [],
            count: journeys?.length || 0,
        });
    } catch (error) {
        console.error('[Journeys API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch journeys' },
            { status: 500 }
        );
    }
}

// POST - Create or update journey
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, user_id, investigation_id, title, context, steps, status } = body;
        
        if (id) {
            // Update existing
            const { data, error } = await supabase
                .from('intelink_journeys')
                .update({
                    title,
                    context,
                    steps,
                    status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            return NextResponse.json({ journey: data });
        } else {
            // Create new
            const { data, error } = await supabase
                .from('intelink_journeys')
                .insert({
                    user_id,
                    investigation_id,
                    title: title || `Jornada ${new Date().toLocaleDateString('pt-BR')}`,
                    context,
                    steps: steps || [],
                    status: status || 'active',
                })
                .select()
                .single();
            
            if (error) throw error;
            
            return NextResponse.json({ journey: data }, { status: 201 });
        }
    } catch (error) {
        console.error('[Journeys API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to save journey' },
            { status: 500 }
        );
    }
}
