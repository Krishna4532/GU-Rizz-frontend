export function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create particles
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * 1200,
      y: Math.random() * 800,
      z: Math.random() * 400 + 100,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 0.5
    });
  }

  let mouseX = 0.5, mouseY = 0.5;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
    // cursor glow
    const g = document.getElementById('cursor-glow');
    if (g) { g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
  });

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Connection lines
    particles.forEach((p, i) => {
      const sx = (p.x / p.z) * W + W / 2 * (1 - 1 / p.z);
      const sy = (p.y / p.z) * H + H / 2 * (1 - 1 / p.z);
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const qx = (q.x / q.z) * W + W / 2 * (1 - 1 / q.z);
        const qy = (q.y / q.z) * H + H / 2 * (1 - 1 / q.z);
        const dist = Math.hypot(sx - qx, sy - qy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(qx, qy);
          ctx.strokeStyle = `rgba(192,19,42,${0.12 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });

    // Particles
    particles.forEach(p => {
      p.x += p.vx + (mouseX - 0.5) * 0.1;
      p.y += p.vy + (mouseY - 0.5) * 0.1;
      p.z += p.vz;
      if (p.x < -200) p.x = 1400; if (p.x > 1400) p.x = -200;
      if (p.y < -200) p.y = 1000; if (p.y > 1000) p.y = -200;
      if (p.z < 100) p.z = 500; if (p.z > 500) p.z = 100;

      const scale = 600 / p.z;
      const sx = (p.x - 600) * scale + W / 2;
      const sy = (p.y - 400) * scale + H / 2;
      const r = p.r * scale;
      const alpha = Math.min(1, scale * 0.5);

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(192,19,42,${alpha * 0.5})`;
      ctx.fill();
    });

    requestAnimationFrame(drawFrame);
  }
  drawFrame();
}
