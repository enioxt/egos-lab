/**
 * ProductCard — Premium product card component
 * Glassmorphism style with AI data quality indicator
 */

import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, Dimensions } from 'react-native';
import type { Product } from '../hooks/useProducts';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

interface Props {
    product: Product;
    onPress?: (product: Product) => void;
}

export function ProductCard({ product, onPress }: Props) {
    const qualityColor =
        product.data_quality_score >= 75 ? '#22C55E'
            : product.data_quality_score >= 50 ? '#FBBF24'
                : '#EF4444';

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => onPress?.(product)}
        >
            {/* Product Image */}
            <View style={styles.imageContainer}>
                {product.image_url ? (
                    <Image
                        source={{ uri: product.image_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.image, styles.placeholderImage]}>
                        <Text style={styles.placeholderText}>📷</Text>
                    </View>
                )}

                {/* AI Quality Badge */}
                <View style={[styles.qualityBadge, { backgroundColor: qualityColor }]}>
                    <Text style={styles.qualityText}>{product.data_quality_score}%</Text>
                </View>
            </View>

            {/* Product Info */}
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                    {product.name}
                </Text>
                <Text style={styles.category}>
                    {product.category || 'Sem categoria'}
                </Text>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>
                        R$ {Number(product.price).toFixed(2)}
                    </Text>
                    <Pressable style={styles.addButton}>
                        <Text style={styles.addButtonText}>+</Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    pressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: CARD_WIDTH * 0.85,
        backgroundColor: '#F9FAFB',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
    },
    placeholderText: {
        fontSize: 40,
    },
    qualityBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    qualityText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    info: {
        padding: 12,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        lineHeight: 18,
        marginBottom: 4,
    },
    category: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'capitalize',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    price: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16A34A',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#16A34A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
