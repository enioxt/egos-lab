import React, { useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';

// 🌀 The Listening Spiral Component
// Visualizes a conversation thread spiraling inward from context to core.

interface SpiralNode {
    id: string;
    group: number; // 1=Outer, 2=Middle, 3=Core
    name: string;
    val: number;
}

interface SpiralLink {
    source: string;
    target: string;
}

const ListeningSpiral: React.FC = () => {
    // Generate Spiral Data (Mocking Git Graph)
    const data = useMemo(() => {
        const nodes: SpiralNode[] = [];
        const links: SpiralLink[] = [];

        // 1. The "Main" Branch (Solid Core)
        for (let i = 0; i < 40; i++) {
            const id = `main-${i}`;
            const group = 1; // Core
            nodes.push({ id, group, name: `Commit #${i} (Main)`, val: 3 });
            if (i > 0) links.push({ source: `main-${i - 1}`, target: id });
        }

        // 2. The "Proposal" Branches (Orbits)
        // Branch A: "Feature X"
        for (let i = 0; i < 10; i++) {
            const id = `feat-x-${i}`;
            const group = 2; // Proposal
            nodes.push({ id, group, name: `Proposal X (Draft)`, val: 1 });
            if (i === 0) links.push({ source: `main-30`, target: id }); // Fork from Main
            else links.push({ source: `feat-x-${i - 1}`, target: id });
        }

        // Branch B: "Refactor Y"
        for (let i = 0; i < 10; i++) {
            const id = `refactor-y-${i}`;
            const group = 3; // Proposal
            nodes.push({ id, group, name: `Refactor Y (WIP)`, val: 1 });
            if (i === 0) links.push({ source: `main-35`, target: id }); // Fork from Main
            else links.push({ source: `refactor-y-${i - 1}`, target: id });
        }

        return { nodes, links };
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ForceGraph3D
                graphData={data}
                nodeAutoColorBy="group" // 1=Main (Blue?), 2/3=Branches
                nodeLabel="name"
                backgroundColor="#050505"
                linkOpacity={0.5}
                linkWidth={1}
            />
            <div style={{ position: 'absolute', top: 20, left: 20, color: '#eee', fontFamily: 'monospace' }}>
                <h1>🌀 Espiral de Escuta (Git Universe)</h1>
                <p>🔴 Main Branch (Consensus)</p>
                <p>🟣 Proposal Branches (Voices)</p>
            </div>
        </div>
    );
};

export default ListeningSpiral;
