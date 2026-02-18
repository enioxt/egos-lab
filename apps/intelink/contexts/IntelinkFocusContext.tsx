'use client';

/**
 * IntelinkFocusContext — Context Bridge
 * 
 * Permite que o Chat AI saiba o que o usuário está vendo/selecionando no Dashboard.
 * 
 * @version 1.0.0
 * @see docs/design/CONTEXT_BRIDGE_ARCH.md
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

export type ViewType = 'list' | 'graph' | 'map' | 'timeline' | 'analysis' | 'chat';

export interface SelectedEntity {
  id: string;
  name: string;
  type: string;
}

export interface IntelinkFocus {
  investigationId: string | null;
  investigationTitle: string | null;
  selectedEntities: SelectedEntity[];
  activeView: ViewType;
  filters: Record<string, any>;
  lastInteraction: number;
}

interface IntelinkFocusContextType {
  focus: IntelinkFocus;
  setInvestigation: (id: string | null, title?: string) => void;
  selectEntity: (entity: SelectedEntity) => void;
  deselectEntity: (entityId: string) => void;
  clearSelection: () => void;
  setActiveView: (view: ViewType) => void;
  setFilters: (filters: Record<string, any>) => void;
  getContextForChat: () => string;
}

// ============================================
// DEFAULT STATE
// ============================================

const defaultFocus: IntelinkFocus = {
  investigationId: null,
  investigationTitle: null,
  selectedEntities: [],
  activeView: 'list',
  filters: {},
  lastInteraction: Date.now(),
};

// ============================================
// CONTEXT
// ============================================

const IntelinkFocusContext = createContext<IntelinkFocusContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function IntelinkFocusProvider({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState<IntelinkFocus>(defaultFocus);

  const setInvestigation = useCallback((id: string | null, title?: string) => {
    setFocus(prev => ({
      ...prev,
      investigationId: id,
      investigationTitle: title || null,
      selectedEntities: [], // Clear selection on investigation change
      lastInteraction: Date.now(),
    }));
  }, []);

  const selectEntity = useCallback((entity: SelectedEntity) => {
    setFocus(prev => {
      // Avoid duplicates
      if (prev.selectedEntities.some(e => e.id === entity.id)) {
        return prev;
      }
      return {
        ...prev,
        selectedEntities: [...prev.selectedEntities, entity],
        lastInteraction: Date.now(),
      };
    });
  }, []);

  const deselectEntity = useCallback((entityId: string) => {
    setFocus(prev => ({
      ...prev,
      selectedEntities: prev.selectedEntities.filter(e => e.id !== entityId),
      lastInteraction: Date.now(),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setFocus(prev => ({
      ...prev,
      selectedEntities: [],
      lastInteraction: Date.now(),
    }));
  }, []);

  const setActiveView = useCallback((view: ViewType) => {
    setFocus(prev => ({
      ...prev,
      activeView: view,
      lastInteraction: Date.now(),
    }));
  }, []);

  const setFilters = useCallback((filters: Record<string, any>) => {
    setFocus(prev => ({
      ...prev,
      filters,
      lastInteraction: Date.now(),
    }));
  }, []);

  /**
   * Gera uma string de contexto para injetar no System Prompt do Chat
   */
  const getContextForChat = useCallback((): string => {
    const lines: string[] = [];

    if (focus.investigationId) {
      lines.push(`📂 INVESTIGAÇÃO ATIVA: ${focus.investigationTitle || focus.investigationId}`);
    }

    if (focus.selectedEntities.length > 0) {
      lines.push(`\n🎯 ENTIDADES SELECIONADAS (${focus.selectedEntities.length}):`);
      focus.selectedEntities.forEach(e => {
        lines.push(`  - ${e.name} (${e.type})`);
      });
    }

    const viewLabels: Record<ViewType, string> = {
      list: 'Lista de Entidades',
      graph: 'Grafo de Vínculos',
      map: 'Mapa de Localizações',
      timeline: 'Linha do Tempo',
      analysis: 'Painel de Análise',
      chat: 'Chat com IA',
    };
    lines.push(`\n👁️ VISUALIZAÇÃO ATIVA: ${viewLabels[focus.activeView]}`);

    if (Object.keys(focus.filters).length > 0) {
      lines.push(`\n🔍 FILTROS APLICADOS: ${JSON.stringify(focus.filters)}`);
    }

    return lines.join('\n');
  }, [focus]);

  return (
    <IntelinkFocusContext.Provider
      value={{
        focus,
        setInvestigation,
        selectEntity,
        deselectEntity,
        clearSelection,
        setActiveView,
        setFilters,
        getContextForChat,
      }}
    >
      {children}
    </IntelinkFocusContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useIntelinkFocus() {
  const context = useContext(IntelinkFocusContext);
  if (context === undefined) {
    throw new Error('useIntelinkFocus must be used within an IntelinkFocusProvider');
  }
  return context;
}

// ============================================
// OPTIONAL: Standalone hook for components outside provider
// ============================================

export function useIntelinkFocusOptional() {
  return useContext(IntelinkFocusContext);
}
