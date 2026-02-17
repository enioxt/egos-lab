import React, { useEffect, useState, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { fetchRepoGraph, type GraphData } from '../services/github';

const ListeningSpiral: React.FC = () => {
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const loadData = async () => {
            const graph = await fetchRepoGraph();
            setData(graph);
        };
        loadData();
    }, []);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: '#050505' }}>
            <ForceGraph3D
                width={dimensions.width}
                height={dimensions.height}
                graphData={data as never}
                nodeAutoColorBy="group"
                nodeLabel="message"
                backgroundColor="#050505"
                linkOpacity={0.4}
                linkWidth={0.8}
                linkColor={() => 'rgba(19, 182, 236, 0.2)'}
                nodeVal="val"
                onNodeClick={(node: Record<string, unknown>) => {
                    if (node.url) window.open(node.url as string, '_blank');
                }}
            />
            {/* Overlay */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                zIndex: 10,
                pointerEvents: 'none',
            }}>
                <p style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    fontFamily: 'Space Grotesk, sans-serif',
                }}>
                    {data.nodes.length} nodes · {data.links.length} links · enioxt/egos-lab
                </p>
            </div>
        </div>
    );
};

export default ListeningSpiral;
