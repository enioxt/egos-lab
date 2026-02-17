
import React, { useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { fetchRepoGraph, type GraphData } from '../services/github';

// 🌀 The Listening Spiral Component
// Visualizes a conversation thread spiraling inward from context to core.

const ListeningSpiral: React.FC = () => {
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });

    useEffect(() => {
        const loadData = async () => {
            const graph = await fetchRepoGraph();
            setData(graph);
        };
        loadData();
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
            <ForceGraph3D
                graphData={data}
                nodeAutoColorBy="group" // 1=Main (Blue?), 2/3=Branches
                nodeLabel="message"
                backgroundColor="#050505"
                linkOpacity={0.5}
                linkWidth={1}
                nodeVal="val"
                onNodeClick={(node: any) => {
                    if (node.url) window.open(node.url, '_blank');
                }}
            />
            <div style={{ position: 'absolute', top: 20, left: 20, color: '#eee', fontFamily: 'monospace', zIndex: 100 }}>
                <h1>🌀 Espiral de Escuta (Git Universe)</h1>
                <p>🔴 Main Branch (Core)</p>
                <p>🟣 Feature Branches (Orbits)</p>
                <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
                    repo: enioxt/egos-lab
                </p>
                <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
                    {data.nodes.length} nodes | {data.links.length} links
                </p>
            </div>
        </div>
    );
};

export default ListeningSpiral;
