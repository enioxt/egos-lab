/**
 * useProducts — Fetches enriched products from Supabase
 * Uses the shared Supabase client from @nexus/shared
 */

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@nexus/shared';

export interface Product {
    id: string;
    name: string;
    category: string | null;
    price: number;
    image_url: string | null;
    barcode: string | null;
    data_quality_score: number;
    is_available: boolean;
}

export function useProducts(merchantId?: string) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();
            let query = supabase
                .from('nexusmkt_products')
                .select('id, name, category, price, image_url, barcode, data_quality_score, is_available')
                .eq('is_available', true)
                .order('name');

            if (merchantId) {
                query = query.eq('merchant_id', merchantId);
            }

            const { data, error: dbError } = await query;

            if (dbError) throw new Error(dbError.message);
            setProducts(data || []);
        } catch (err: any) {
            setError(err.message);
            console.error('[useProducts]', err.message);
        } finally {
            setLoading(false);
        }
    }, [merchantId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return { products, loading, error, refetch: fetchProducts };
}

/**
 * Get unique categories from product list
 */
export function useCategories(products: Product[]): string[] {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return ['Todos', ...Array.from(cats).sort()];
}
