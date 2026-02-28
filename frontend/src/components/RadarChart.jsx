import { useRef, useEffect } from 'react';

const LABELS = ['Clarity', 'Rigor', 'Novelty', 'Coherence', 'Citations'];
const KEYS = ['clarity', 'rigor', 'novelty', 'coherence', 'citation_completeness'];

export default function RadarChart({ scores, size = 260 }) {
    const canvasRef = useRef(null);
    const center = size / 2;
    const radius = size * 0.35;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, size, size);

        const n = LABELS.length;
        const angleStep = (Math.PI * 2) / n;
        const startAngle = -Math.PI / 2;

        // Grid rings (clean dashed or solid lines)
        for (let ring = 1; ring <= 4; ring++) {
            const r = (radius * ring) / 4;
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const angle = startAngle + i * angleStep;
                const x = center + Math.cos(angle) * r;
                const y = center + Math.sin(angle) * r;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = '#2d2d2d'; // var(--border)
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Axis lines
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
            ctx.strokeStyle = '#2d2d2d';
            ctx.stroke();
        }

        // Data polygon
        const values = KEYS.map(k => (scores?.[k] || 0) / 100);
        ctx.beginPath();
        values.forEach((v, i) => {
            const angle = startAngle + i * angleStep;
            const x = center + Math.cos(angle) * radius * v;
            const y = center + Math.sin(angle) * radius * v;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff'; // White solid line
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Small data points
        values.forEach((v, i) => {
            const angle = startAngle + i * angleStep;
            const x = center + Math.cos(angle) * radius * v;
            const y = center + Math.sin(angle) * radius * v;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        });

        // Labels
        ctx.font = '400 10px JetBrains Mono, monospace'; // monospace labels
        ctx.fillStyle = '#8b8b8b';
        ctx.textAlign = 'center';
        LABELS.forEach((label, i) => {
            const angle = startAngle + i * angleStep;
            const lx = center + Math.cos(angle) * (radius + 20);
            const ly = center + Math.sin(angle) * (radius + 20) + 4;
            ctx.fillText(label.toUpperCase(), lx, ly);
        });

    }, [scores, size]);

    return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}
