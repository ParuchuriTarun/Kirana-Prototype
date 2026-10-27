// 60FPS Ultra-Smooth High-Performance Deep Forest Green Liquid Motion
// Calibrated to soothing, deep natural forest & pine green (#183a2a / #1a402e)
export function initAuroraCanvas(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  let animId = null;

  // Optimized buffer: 480x270 (renders in <0.5ms per frame on CPU, scaled smoothly by GPU)
  const width = (canvas.width = 480);
  const height = (canvas.height = 270);

  // Deep, soothing, natural forest & pine green tones (calm, elegant, never harsh or neon)
  const nodes = [
    { x: 0.20, y: 0.25, sx: 0.8, sy: 0.7, rx: 0.25, ry: 0.22, color: [32, 80, 56],  alpha: 0.32 }, // Calm deep forest
    { x: 0.78, y: 0.68, sx: 0.7, sy: 0.9, rx: 0.26, ry: 0.24, color: [26, 68, 48],  alpha: 0.36 }, // Soft pine
    { x: 0.65, y: 0.22, sx: 0.9, sy: 0.8, rx: 0.22, ry: 0.25, color: [38, 92, 66],  alpha: 0.28 }, // Balanced sage
    { x: 0.25, y: 0.75, sx: 0.7, sy: 1.0, rx: 0.28, ry: 0.22, color: [24, 62, 44],  alpha: 0.30 }, // Muted moss
    { x: 0.50, y: 0.48, sx: 1.0, sy: 0.9, rx: 0.20, ry: 0.18, color: [35, 86, 60],  alpha: 0.26 }  // Gentle core forest green
  ];

  const startTime = performance.now();

  function render(now) {
    const t = (now - startTime) / 1000;
    ctx.clearRect(0, 0, width, height);

    // 1. Swirling Organic Liquid Glowing Nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const curX = (n.x + Math.sin(t * n.sx + i * 1.6) * n.rx + Math.cos(t * 0.6 + i) * 0.08) * width;
      const curY = (n.y + Math.cos(t * n.sy + i * 1.4) * n.ry + Math.sin(t * 0.7 + i) * 0.08) * height;
      const curR = (0.42 + Math.sin(t * 1.2 + i * 1.2) * 0.08) * width;

      const grad = ctx.createRadialGradient(curX, curY, 0, curX, curY, Math.max(10, curR));
      const [r, g, b] = n.color;
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${n.alpha})`);
      grad.addColorStop(0.40, `rgba(${r}, ${g}, ${b}, ${n.alpha * 0.65})`);
      grad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${n.alpha * 0.18})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Gentle Undulating Wave Ribbons (soft, natural motion)
    for (let w = 0; w < 3; w++) {
      ctx.beginPath();
      const baseY = height * (0.28 + w * 0.26);
      ctx.moveTo(-20, baseY);

      const waveSpeed = 1.2 - w * 0.2;
      const waveFreq = 0.012 + w * 0.003;
      const amp1 = 18 + w * 5;
      const amp2 = 10 + w * 3;

      for (let x = -20; x <= width + 20; x += 16) {
        const y = baseY +
          Math.sin(x * waveFreq + t * waveSpeed + w * 1.8) * amp1 +
          Math.cos(x * 0.008 - t * (waveSpeed * 0.6)) * amp2;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width + 20, height + 20);
      ctx.lineTo(-20, height + 20);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, baseY - 40, width, baseY + 80);
      if (w === 0) {
        grad.addColorStop(0, 'rgba(38, 92, 66, 0.22)');
        grad.addColorStop(0.5, 'rgba(32, 80, 56, 0.12)');
        grad.addColorStop(1, 'rgba(24, 62, 44, 0.0)');
      } else if (w === 1) {
        grad.addColorStop(0, 'rgba(32, 80, 56, 0.18)');
        grad.addColorStop(0.5, 'rgba(26, 68, 48, 0.09)');
        grad.addColorStop(1, 'rgba(20, 54, 38, 0.0)');
      } else {
        grad.addColorStop(0, 'rgba(35, 86, 60, 0.16)');
        grad.addColorStop(0.6, 'rgba(26, 68, 48, 0.08)');
        grad.addColorStop(1, 'rgba(18, 48, 34, 0.0)');
      }

      ctx.fillStyle = grad;
      ctx.fill();
    }

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);

  return () => {
    if (animId) cancelAnimationFrame(animId);
  };
}
