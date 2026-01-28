import React, { useRef, useEffect, useState } from 'react';

interface FlowChartProps {
  flow: number;
  width?: number;
  height?: number;
  maxPoints?: number;
  maxFlow?: number;
  tickMs?: number;
}

const FlowChart: React.FC<FlowChartProps> = ({ flow, width, height = 180, maxPoints = 60, maxFlow = 10, tickMs = 500 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const obs = new ResizeObserver(() => {
      const w = Math.floor(node.getBoundingClientRect().width);
      setMeasuredWidth(w);
    });
    obs.observe(node);
    setMeasuredWidth(Math.floor(node.getBoundingClientRect().width));
    return () => obs.disconnect();
  }, []);

  const effectiveWidth = width || measuredWidth || 380;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const latestRef = useRef<number>(Number.isFinite(flow) ? flow : 0);

  useEffect(() => {
    latestRef.current = Number.isFinite(flow) ? flow : 0;
  }, [flow]);

  useEffect(() => {
    const id = setInterval(() => {
      setPoints(prev => {
        const next = prev.slice(-maxPoints + 1);
        next.push(latestRef.current);
        return next;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [maxPoints, tickMs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = effectiveWidth;
    canvas.width = w * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = (i / gridLines) * height;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }

    if (points.length === 0) return;

    const usedPoints = points.slice(-maxPoints);

    const step = width / (Math.max(usedPoints.length - 1, 1));
    ctx.beginPath();
    for (let i = 0; i < usedPoints.length; i++) {
      const x = i * step;
      const v = Math.max(0, Math.min(usedPoints[i], maxFlow));
      const y = height - (v / maxFlow) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < usedPoints.length; i++) {
      const x = i * step;
      const v = Math.max(0, Math.min(usedPoints[i], maxFlow));
      const y = height - (v / maxFlow) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.stroke();

    const lastX = (usedPoints.length - 1) * step;
    const lastV = Math.max(0, Math.min(usedPoints[usedPoints.length - 1], maxFlow));
    const lastY = height - (lastV / maxFlow) * height;
    ctx.beginPath();
    ctx.fillStyle = '#059669';
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8892a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxFlow.toFixed(0)} L/min`, width - 4, 12);
    ctx.fillText('0 L/min', width - 4, height - 4);

  }, [points, effectiveWidth, height, maxPoints, maxFlow]);

  return (
    <div ref={containerRef} className="flow-chart w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default FlowChart;
