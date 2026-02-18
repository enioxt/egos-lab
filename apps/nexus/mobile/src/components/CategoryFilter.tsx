/**
 * CategoryFilter — Horizontal scrollable category pills
 */

import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';

interface Props {
    categories: string[];
    selected: string;
    onSelect: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
    'Todos': '🏠',
    'bebidas': '🥤',
    'grãos': '🌾',
    'laticínios': '🧀',
    'mercearia': '🛒',
    'limpeza': '🧹',
    'padaria': '🍞',
    'hortifrúti': '🥬',
    'higiene': '🧴',
};

export function CategoryFilter({ categories, selected, onSelect }: Props) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {categories.map(cat => {
                const isSelected = cat === selected;
                const icon = CATEGORY_ICONS[cat.toLowerCase()] || '📦';

                return (
                    <Pressable
                        key={cat}
                        style={[styles.pill, isSelected && styles.pillSelected]}
                        onPress={() => onSelect(cat)}
                    >
                        <Text style={styles.icon}>{icon}</Text>
                        <Text style={[styles.label, isSelected && styles.labelSelected]}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        gap: 6,
    },
    pillSelected: {
        backgroundColor: '#16A34A',
    },
    icon: {
        fontSize: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    labelSelected: {
        color: '#fff',
    },
});
