import React, { useEffect, useRef } from 'react';

export default function BackgroundRippleEffect() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const tilesRef = useRef([]);
  const ripplesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    const tileSize = 45; // Size of each grid box

    let cols = 0;
    let rows = 0;

    const resizeCanvas = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      cols = Math.ceil(width / tileSize);
      rows = Math.ceil(height / tileSize);

      // Initialize tile opacity matrix
      tilesRef.current = Array.from({ length: cols * rows }, () => 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse Move listener on Hero container
    const handleMouseMove = (e) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const col = Math.floor(mouseX / tileSize);
      const row = Math.floor(mouseY / tileSize);

      // Trigger hover intensity for target and neighbor tiles
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const targetCol = col + c;
          const targetRow = row + r;
          if (targetCol >= 0 && targetCol < cols && targetRow >= 0 && targetRow < rows) {
            const dist = Math.sqrt(c * c + r * r);
            const intensity = Math.max(0, 1 - dist / 2.5);
            const index = targetRow * cols + targetCol;
            tilesRef.current[index] = Math.max(tilesRef.current[index], intensity * 0.85);
          }
        }
      }
    };

    // Mouse Click listener for expanding wave ripple
    const handleClick = (e) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      ripplesRef.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 0,
        maxRadius: Math.max(rect.width, rect.height) * 0.6,
        alpha: 1
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    // Render Animation Loop
    const render = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Process Click Ripples
      ripplesRef.current.forEach((ripple, rIndex) => {
        ripple.radius += 12;
        ripple.alpha -= 0.015;

        if (ripple.alpha <= 0 || ripple.radius >= ripple.maxRadius) {
          ripplesRef.current.splice(rIndex, 1);
        } else {
          // Highlight tiles intersected by ripple ring
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const tileCenterX = c * tileSize + tileSize / 2;
              const tileCenterY = r * tileSize + tileSize / 2;
              const dx = tileCenterX - ripple.x;
              const dy = tileCenterY - ripple.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (Math.abs(dist - ripple.radius) < tileSize * 1.5) {
                const index = r * cols + c;
                tilesRef.current[index] = Math.max(tilesRef.current[index], ripple.alpha * 0.9);
              }
            }
          }
        }
      });

      // 3. Draw Active Tiles
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          let val = tilesRef.current[index];

          if (val > 0.01) {
            const x = c * tileSize;
            const y = r * tileSize;

            // Fill glow
            ctx.fillStyle = `rgba(56, 189, 248, ${val * 0.12})`;
            ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

            // Luminous border glow
            ctx.strokeStyle = `rgba(168, 85, 247, ${val * 0.65})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);

            // Decay tile intensity
            tilesRef.current[index] *= 0.93;
          } else {
            tilesRef.current[index] = 0;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('click', handleClick);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
}
