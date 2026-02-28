import { useRef, useEffect, useState } from 'react';

export default function QualityGauge({ score, size = 160 }) {
    const canvasRef = useRef(null);
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        let frame;
        const start = performance.now();
        const duration = 800;
        const from = animatedScore;

        const animate = (now) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setAnimatedScore(Math.round(from + (score - from) * eased));
            if (t < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [score]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, size, size);

        const cx = size / 2;
        const cy = size / 2;
        const r = size * 0.42;
        const lineWidth = 3; // Thin stroke
        const startAngle = 0.75 * Math.PI;
        const endAngle = 2.25 * Math.PI;
        const totalArc = endAngle - startAngle;
        const fillAngle = startAngle + (animatedScore / 100) * totalArc;

        // Background track (very subtle)
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.strokeStyle = '#2d2d2d';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'butt';
        ctx.stroke();

        // Status color (white, or green/red only at extremes)
        let color = '#ffffff';
        if (animatedScore >= 85) color = '#3fb950'; // success color
        else if (animatedScore < 50) color = '#f85149';

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, fillAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'butt';
        ctx.stroke();

        // Center text - Monospace
        ctx.fillStyle = '#ededed';
        ctx.font = '500 32px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(animatedScore.toString(), cx, cy - 2);

    }, [animatedScore, size]);

    return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}
