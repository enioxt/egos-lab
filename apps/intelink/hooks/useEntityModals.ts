/**
 * useEntityModals - Hook para gerenciar modais de entidades
 * Centraliza a lógica de abertura/fechamento e navegação entre entidades
 */

import { useState, useCallback } from 'react';

export type EntityType = 'PERSON' | 'VEHICLE' | 'LOCATION' | 'ORGANIZATION' | 'COMPANY' | 'FIREARM' | 'WEAPON' | 'PHONE';

export interface EntityModalState {
    entity: any | null;
    isOpen: boolean;
}

export interface UseEntityModalsReturn {
    // Modal states
    locationModal: EntityModalState;
    personModal: EntityModalState;
    vehicleModal: EntityModalState;
    organizationModal: EntityModalState;
    firearmModal: EntityModalState;
    
    // Navigation history
    modalHistory: any[];
    
    // Actions
    openEntity: (entity: any, investigationId: string) => void;
    closeAll: () => void;
    navigateTo: (nextEntity: any, currentEntity: any, investigationId: string) => void;
    goBack: (investigationId: string) => void;
    canGoBack: boolean;
}

export function useEntityModals(): UseEntityModalsReturn {
    // Modal states
    const [locationModal, setLocationModal] = useState<EntityModalState>({ entity: null, isOpen: false });
    const [personModal, setPersonModal] = useState<EntityModalState>({ entity: null, isOpen: false });
    const [vehicleModal, setVehicleModal] = useState<EntityModalState>({ entity: null, isOpen: false });
    const [organizationModal, setOrganizationModal] = useState<EntityModalState>({ entity: null, isOpen: false });
    const [firearmModal, setFirearmModal] = useState<EntityModalState>({ entity: null, isOpen: false });
    
    // Navigation history
    const [modalHistory, setModalHistory] = useState<any[]>([]);
    
    // Close all modals
    const closeAll = useCallback(() => {
        setLocationModal({ entity: null, isOpen: false });
        setPersonModal({ entity: null, isOpen: false });
        setVehicleModal({ entity: null, isOpen: false });
        setOrganizationModal({ entity: null, isOpen: false });
        setFirearmModal({ entity: null, isOpen: false });
    }, []);
    
    // Open entity modal based on type
    const openEntity = useCallback((entity: any, investigationId: string) => {
        setModalHistory([]); // Reset history on main click
        closeAll();
        
        const enrichedEntity = { ...entity, investigation_id: investigationId };
        
        switch (entity.type) {
            case 'LOCATION':
                setLocationModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'PERSON':
                setPersonModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'VEHICLE':
                setVehicleModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'ORGANIZATION':
            case 'COMPANY':
                setOrganizationModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'WEAPON':
            case 'FIREARM':
                setFirearmModal({ entity: enrichedEntity, isOpen: true });
                break;
        }
    }, [closeAll]);
    
    // Navigate to another entity (from within a modal)
    const navigateTo = useCallback((nextEntity: any, currentEntity: any, investigationId: string) => {
        setModalHistory(prev => [...prev, currentEntity]);
        closeAll();
        
        const enrichedEntity = { ...nextEntity, investigation_id: investigationId };
        
        switch (nextEntity.type) {
            case 'PERSON':
                setPersonModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'LOCATION':
                setLocationModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'VEHICLE':
                setVehicleModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'ORGANIZATION':
            case 'COMPANY':
                setOrganizationModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'WEAPON':
            case 'FIREARM':
                setFirearmModal({ entity: enrichedEntity, isOpen: true });
                break;
        }
    }, [closeAll]);
    
    // Go back in history
    const goBack = useCallback((investigationId: string) => {
        if (modalHistory.length === 0) return;
        
        const previousEntity = modalHistory[modalHistory.length - 1];
        setModalHistory(prev => prev.slice(0, -1));
        closeAll();
        
        const enrichedEntity = { ...previousEntity, investigation_id: investigationId };
        
        switch (previousEntity.type) {
            case 'PERSON':
                setPersonModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'LOCATION':
                setLocationModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'VEHICLE':
                setVehicleModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'ORGANIZATION':
            case 'COMPANY':
                setOrganizationModal({ entity: enrichedEntity, isOpen: true });
                break;
            case 'WEAPON':
            case 'FIREARM':
                setFirearmModal({ entity: enrichedEntity, isOpen: true });
                break;
        }
    }, [modalHistory, closeAll]);
    
    return {
        locationModal,
        personModal,
        vehicleModal,
        organizationModal,
        firearmModal,
        modalHistory,
        openEntity,
        closeAll,
        navigateTo,
        goBack,
        canGoBack: modalHistory.length > 0,
    };
}
