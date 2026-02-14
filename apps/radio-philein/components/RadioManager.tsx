"use client";

import React from 'react';
// TODO: Implement Radio components (RadioContext, RadioPhileinSheet, RadioPhileinCTA)
// import { RadioProvider } from './RadioContext';
// import RadioPhileinSheet from './RadioPhileinSheet';
// import RadioPhileinCTA from './RadioPhileinCTA';

interface RadioManagerProps {
    children: React.ReactNode;
}

export default function RadioManager({ children }: RadioManagerProps) {
    return <>{children}</>;
}
