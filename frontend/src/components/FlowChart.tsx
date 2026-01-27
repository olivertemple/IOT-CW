import React, { useRef, useEffect, useState } from 'react';

interface FlowChartProps {
  flow: number; // current flow value (L/min)
  width?: number;
  height?: number;
  maxPoints?: number;
  maxFlow?: number;
  tickMs?: number;
}

const FlowChart: React.FC<FlowChartProps> = ({ flow, width = 380, height = 180, maxPoints = 60, maxFlow = 10, tickMs = 500 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const latestRef = useRef<number>(Number.isFinite(flow) ? flow : 0);

  // update latestRef when parent flow changes
  useEffect(() => {
    latestRef.current = Number.isFinite(flow) ? flow : 0;
  }, [flow]);

  // ticking timer to push latest value into rolling buffer for smooth realtime movement
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

  // draw to canvas whenever points change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // grid lines
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

    // no data
    if (points.length === 0) return;

    const usedPoints = points.slice(-maxPoints);

    // draw filled area
    const step = width / (maxPoints - 1 || 1);
    ctx.beginPath();
    for (let i = 0; i < usedPoints.length; i++) {
      const x = i * step;
      const v = Math.max(0, Math.min(usedPoints[i], maxFlow));
      const y = height - (v / maxFlow) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    // close path to bottom
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    // gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    // stroke line
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

    // current value marker
    const lastX = (usedPoints.length - 1) * step;
    const lastV = Math.max(0, Math.min(usedPoints[usedPoints.length - 1], maxFlow));
    const lastY = height - (lastV / maxFlow) * height;
    ctx.beginPath();
    ctx.fillStyle = '#059669';
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();

    // axes labels (right)
    ctx.fillStyle = '#8892a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxFlow.toFixed(0)} L/min`, width - 4, 12);
    ctx.fillText('0 L/min', width - 4, height - 4);

  }, [points, width, height, maxPoints, maxFlow]);

  return (
    <div className="flow-chart">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default FlowChart;
