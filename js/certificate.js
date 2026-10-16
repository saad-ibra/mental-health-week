/* ===================================================================
   CERTIFICATE GENERATOR — MENTAL HEALTH WEEK
   Canvas-based digital participation certificate with downloadable PNG
   =================================================================== */

/**
 * Generates and downloads a participation certificate as a PNG image.
 * @param {Object} opts
 * @param {string} opts.name - Participant full name
 * @param {string} opts.course - Course / department
 * @param {number} opts.totalScore - Combined score across all activities
 * @param {string} [opts.date] - Optional date string; defaults to today
 */
export function downloadCertificate({ name, course, totalScore, date }) {
  const W = 1200;
  const H = 850;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // === Background gradient ===
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#1e293b');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // === Decorative accent circles ===
  const accentGrad1 = ctx.createRadialGradient(150, 150, 0, 150, 150, 300);
  accentGrad1.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
  accentGrad1.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = accentGrad1;
  ctx.fillRect(0, 0, 450, 450);

  const accentGrad2 = ctx.createRadialGradient(W - 150, H - 150, 0, W - 150, H - 150, 300);
  accentGrad2.addColorStop(0, 'rgba(20, 184, 166, 0.2)');
  accentGrad2.addColorStop(1, 'rgba(20, 184, 166, 0)');
  ctx.fillStyle = accentGrad2;
  ctx.fillRect(W - 450, H - 450, 450, 450);

  // === Inner border frame ===
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
  ctx.lineWidth = 2;
  roundRect(ctx, 30, 30, W - 60, H - 60, 16);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, 42, 42, W - 84, H - 84, 12);
  ctx.stroke();

  // === Top decorative line ===
  const topLine = ctx.createLinearGradient(200, 80, W - 200, 80);
  topLine.addColorStop(0, 'rgba(99, 102, 241, 0)');
  topLine.addColorStop(0.5, 'rgba(99, 102, 241, 0.6)');
  topLine.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.strokeStyle = topLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 80);
  ctx.lineTo(W - 200, 80);
  ctx.stroke();

  // === Brain icon placeholder ===
  ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
  ctx.beginPath();
  ctx.arc(W / 2, 132, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#818cf8';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u2B22', W / 2, 140); // hexagon unicode

  // === Title ===
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '600 14px "Inter", "Segoe UI", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'center';
  ctx.fillText('MENTAL HEALTH WEEK 2026', W / 2, 195);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 42px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('Certificate of Participation', W / 2, 250);

  // === Divider ===
  const divLine = ctx.createLinearGradient(350, 275, W - 350, 275);
  divLine.addColorStop(0, 'rgba(99, 102, 241, 0)');
  divLine.addColorStop(0.5, 'rgba(99, 102, 241, 0.4)');
  divLine.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.strokeStyle = divLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(350, 275);
  ctx.lineTo(W - 350, 275);
  ctx.stroke();

  // === "This certifies that" ===
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 16px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('This certifies that', W / 2, 320);

  // === Participant Name ===
  ctx.fillStyle = '#e0e7ff';
  ctx.font = '700 48px "Inter", "Segoe UI", sans-serif';
  const displayName = name || 'Participant';
  ctx.fillText(displayName, W / 2, 385);

  // === Name underline ===
  const nameWidth = ctx.measureText(displayName).width;
  const nameLineGrad = ctx.createLinearGradient(W / 2 - nameWidth / 2, 400, W / 2 + nameWidth / 2, 400);
  nameLineGrad.addColorStop(0, 'rgba(99, 102, 241, 0)');
  nameLineGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.5)');
  nameLineGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.strokeStyle = nameLineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameWidth / 2 - 20, 400);
  ctx.lineTo(W / 2 + nameWidth / 2 + 20, 400);
  ctx.stroke();

  // === Course ===
  if (course) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 16px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(course, W / 2, 430);
  }

  // === Body text ===
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 15px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(
    'has successfully participated in the Mind Matters Activity Hub',
    W / 2, 475
  );
  ctx.fillText(
    'completing interactive wellbeing challenges and mental health awareness activities.',
    W / 2, 500
  );

  // === Score badge ===
  const scoreY = 560;
  const scoreText = `Total Score: ${totalScore || 0} pts`;
  const scoreW = ctx.measureText(scoreText).width + 60;

  ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
  roundRect(ctx, W / 2 - scoreW / 2, scoreY - 22, scoreW, 44, 22);
  ctx.fill();

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, W / 2 - scoreW / 2, scoreY - 22, scoreW, 44, 22);
  ctx.stroke();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '600 17px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(scoreText, W / 2, scoreY + 6);

  // === Bottom decorative line ===
  const botLine = ctx.createLinearGradient(200, H - 80, W - 200, H - 80);
  botLine.addColorStop(0, 'rgba(20, 184, 166, 0)');
  botLine.addColorStop(0.5, 'rgba(20, 184, 166, 0.5)');
  botLine.addColorStop(1, 'rgba(20, 184, 166, 0)');
  ctx.strokeStyle = botLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, H - 80);
  ctx.lineTo(W - 200, H - 80);
  ctx.stroke();

  // === Date and organizer ===
  const dateStr = date || new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  ctx.fillStyle = '#64748b';
  ctx.font = '400 13px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Date: ${dateStr}`, 80, H - 50);

  ctx.textAlign = 'right';
  ctx.fillText('Mind Matters Hub | Mental Health Week 2026', W - 80, H - 50);

  // === Download ===
  const link = document.createElement('a');
  link.download = `MHW_Certificate_${(name || 'participant').replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Renders a certificate preview directly into a container element.
 * Returns the canvas element for further use.
 */
export function renderCertificatePreview(container, { name, course, totalScore, date }) {
  // Reuse the same drawing logic but render into an existing container
  const W = 1200;
  const H = 850;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = '100%';
  canvas.style.maxWidth = '600px';
  canvas.style.height = 'auto';
  canvas.style.borderRadius = '12px';
  canvas.style.border = '1px solid rgba(99, 102, 241, 0.2)';

  container.innerHTML = '';
  container.appendChild(canvas);

  // Draw the certificate (lightweight copy of downloadCertificate draw calls)
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#1e293b');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
  ctx.lineWidth = 2;
  roundRect(ctx, 30, 30, W - 60, H - 60, 16);
  ctx.stroke();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '600 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MENTAL HEALTH WEEK 2026', W / 2, 195);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 42px sans-serif';
  ctx.fillText('Certificate of Participation', W / 2, 250);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 16px sans-serif';
  ctx.fillText('This certifies that', W / 2, 320);

  ctx.fillStyle = '#e0e7ff';
  ctx.font = '700 48px sans-serif';
  ctx.fillText(name || 'Participant', W / 2, 385);

  if (course) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 16px sans-serif';
    ctx.fillText(course, W / 2, 430);
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 15px sans-serif';
  ctx.fillText('has successfully participated in the Mind Matters Activity Hub', W / 2, 475);

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '600 17px sans-serif';
  ctx.fillText(`Total Score: ${totalScore || 0} pts`, W / 2, 560);

  const dateStr = date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillStyle = '#64748b';
  ctx.font = '400 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Date: ${dateStr}`, 80, H - 50);
  ctx.textAlign = 'right';
  ctx.fillText('Mind Matters Hub | Mental Health Week 2026', W - 80, H - 50);

  return canvas;
}

// Helper: rounded rectangle path
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
