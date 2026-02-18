import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

const NetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, down: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const nodes: Node[] = [];
    const NODE_COUNT = 80;
    const CONNECT_DIST = 120;
    const MOUSE_RADIUS = 150;
    const MOUSE_ATTRACT = 0.02;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = document.documentElement.scrollHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = `${document.documentElement.scrollHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(document.documentElement);

    const w = () => window.innerWidth;
    const h = () => document.documentElement.scrollHeight;

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.8,
        opacity: Math.random() * 0.4 + 0.08,
        hue: Math.random() > 0.7 ? 260 : 192,
      });
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY + window.scrollY;
    };
    const onMouseDown = () => { mouseRef.current.down = true; };
    const onMouseUp = () => { mouseRef.current.down = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY + window.scrollY;
        mouseRef.current.down = true;
      }
    };
    const onTouchEnd = () => { mouseRef.current.down = false; mouseRef.current.x = -1000; };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    const animate = () => {
      const W = w();
      const H = h();
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isDown = mouseRef.current.down;
      const attractStrength = isDown ? MOUSE_ATTRACT * 3 : MOUSE_ATTRACT;

      for (const n of nodes) {
        // Mouse interaction
        const dmx = mx - n.x;
        const dmy = my - n.y;
        const dMouse = Math.sqrt(dmx * dmx + dmy * dmy);
        if (dMouse < MOUSE_RADIUS && mx > 0) {
          n.vx += (dmx / dMouse) * attractStrength;
          n.vy += (dmy / dMouse) * attractStrength;
        }

        // Damping
        n.vx *= 0.99;
        n.vy *= 0.99;

        n.x += n.vx;
        n.y += n.vy;

        // Wrap around
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;

        // Draw node
        const glowSize = (dMouse < MOUSE_RADIUS && mx > 0) ? n.size * 1.8 : n.size;
        const glowOpacity = (dMouse < MOUSE_RADIUS && mx > 0) ? n.opacity * 2 : n.opacity;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${n.hue}, 80%, 65%, ${Math.min(glowOpacity, 0.8)})`;
        ctx.fill();
      }

      // Connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.08;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(19, 182, 236, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Mouse connection lines (when holding)
      if (isDown && mx > 0) {
        for (const n of nodes) {
          const d = Math.sqrt((mx - n.x) ** 2 + (my - n.y) ** 2);
          if (d < MOUSE_RADIUS * 1.5) {
            const alpha = (1 - d / (MOUSE_RADIUS * 1.5)) * 0.2;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(n.x, n.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default NetworkBackground;
