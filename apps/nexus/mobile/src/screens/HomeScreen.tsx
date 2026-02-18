/**
 * HomeScreen — Consumer product browsing experience
 * 
 * Features:
 * - Hero header with greeting + search bar
 * - Category filter pills (horizontal scroll)
 * - 2-column product grid with AI quality badges
 * - Pull-to-refresh
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    SafeAreaView,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useProducts, useCategories, type Product } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HomeScreen() {
    const { products, loading, error, refetch } = useProducts();
    const categories = useCategories(products);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const { colors, isDark, toggle } = useTheme();

    // Filter products by category and search
    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (selectedCategory !== 'Todos') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
        }

        return filtered;
    }, [products, selectedCategory, searchQuery]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <ProductCard product={item} />
    );

    const ListHeader = () => (
        <View>
            {/* Hero Header */}
            <View style={styles.hero}>
                <View style={styles.heroGradient}>
                    <Text style={styles.greeting}>Bom dia! 👋</Text>
                    <Text style={styles.subtitle}>O que vamos comprar hoje?</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar produtos..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Text style={styles.clearButton} onPress={() => setSearchQuery('')}>✕</Text>
                    )}
                </View>
            </View>

            {/* Category Pills */}
            <CategoryFilter
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
            />

            {/* Section Title */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {selectedCategory === 'Todos' ? '🔥 Produtos frescos' : `📦 ${selectedCategory}`}
                </Text>
                <Text style={styles.sectionCount}>
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'}
                </Text>
            </View>
        </View>
    );

    if (loading && products.length === 0) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Carregando produtos...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.errorEmoji}>😞</Text>
                <Text style={styles.errorText}>Erro ao carregar produtos</Text>
                <Text style={styles.errorDetail}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.grid}
                ListHeaderComponent={ListHeader}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#16A34A']}
                        tintColor="#16A34A"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyEmoji}>🛒</Text>
                        <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
                    </View>
                }
            />

            {/* Floating Bottom Nav */}
            <View style={[styles.bottomNav, { backgroundColor: colors.surface }]}>
                <View style={styles.navItem}>
                    <Text style={[styles.navIcon, { color: colors.primary, opacity: 1 }]}>🏠</Text>
                    <Text style={[styles.navLabel, { color: colors.primary }]}>Início</Text>
                </View>
                <View style={styles.navItem}>
                    <Text style={[styles.navIcon, { color: colors.textMuted }]}>🔍</Text>
                    <Text style={[styles.navLabel, { color: colors.textMuted }]}>Buscar</Text>
                </View>
                <View style={styles.navItem}>
                    <Text style={[styles.navIcon, { color: colors.textMuted }]}>🛒</Text>
                    <Text style={[styles.navLabel, { color: colors.textMuted }]}>Carrinho</Text>
                </View>
                <TouchableOpacity style={styles.navItem} onPress={toggle} activeOpacity={0.7}>
                    <Text style={[styles.navIcon, { color: colors.textMuted, opacity: 1 }]}>{isDark ? '☀️' : '🌙'}</Text>
                    <Text style={[styles.navLabel, { color: colors.textMuted }]}>{isDark ? 'Claro' : 'Escuro'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAFBFC',
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 14,
    },
    errorEmoji: { fontSize: 48 },
    errorText: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 12 },
    errorDetail: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

    // Hero
    hero: {
        paddingTop: 12,
        paddingBottom: 8,
    },
    heroGradient: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        marginTop: 4,
    },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },
    clearButton: {
        fontSize: 14,
        color: '#9CA3AF',
        paddingLeft: 8,
    },

    // Section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    sectionCount: {
        fontSize: 13,
        color: '#9CA3AF',
    },

    // Grid
    grid: {
        paddingBottom: 100,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },

    // Empty State
    empty: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 8 },

    // Bottom Nav
    bottomNav: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    navIcon: {
        fontSize: 20,
        opacity: 0.5,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    navActive: {
        opacity: 1,
        color: '#16A34A',
    },
});
