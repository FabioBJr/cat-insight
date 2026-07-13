// ============================================================
// charts.js - Gráficos com Canvas puro (zero dependências)
// ============================================================

const ACCENT       = '#f59e0b';
const ACCENT_DIM   = 'rgba(245,158,11,0.15)';
const DANGER       = '#ef4444';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_MUTED   = '#64748b';
const BORDER_COLOR = '#2a2d3e';
const BG_BAR       = '#2a3040';

// ------------------------------------------------------------
// Gráfico de barras horizontais - profissões ou faixa etária
// canvas: elemento <canvas>
// data:   [{ label, valor }]
// color:  cor das barras
// ------------------------------------------------------------
function drawBarChart(canvas, data, color = ACCENT) {
  const ctx    = canvas.getContext('2d');
  const dpr    = window.devicePixelRatio || 1;
  const W      = canvas.offsetWidth;
  const H      = canvas.offsetHeight;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, W, H);

  const MAX_CHARS    = 75;
  const truncate     = (s) => s.length > MAX_CHARS ? s.slice(0, MAX_CHARS - 1) + '…' : s;
  const labelsFit    = data.map(d => ({ ...d, labelFit: truncate(d.label) }));

  ctx.font = `500 12px Inter, sans-serif`;
  const maxLabelW   = Math.max(...labelsFit.map(d => ctx.measureText(d.labelFit).width));
  const paddingLeft  = Math.ceil(maxLabelW) + 16;
  const paddingRight = 72;
  const paddingTop   = 12;
  const paddingBot   = 12;

  const maxVal    = Math.max(...data.map(d => d.valor));
  const barCount  = data.length;
  const totalH    = H - paddingTop - paddingBot;
  const barH      = Math.floor((totalH / barCount) * 0.55);
  const gap       = Math.floor((totalH / barCount) * 0.45);
  const availW    = W - paddingLeft - paddingRight;

  data.forEach((item, i) => {
	const y       = paddingTop + i * (barH + gap);
	const barW    = Math.round((item.valor / maxVal) * availW);
	const centerY = y + barH / 2;

	// Barra de fundo
	ctx.fillStyle = BG_BAR;
	roundRect(ctx, paddingLeft, y, availW, barH, 4);
	ctx.fill();

	// Barra de valor
	ctx.fillStyle = color;
	roundRect(ctx, paddingLeft, y, barW, barH, 4);
	ctx.fill();

	ctx.fillStyle    = TEXT_PRIMARY;
	ctx.font         = `500 12px Inter, sans-serif`;
	ctx.textAlign    = 'left';
	ctx.textBaseline = 'middle';
	ctx.fillText(labelsFit[i].labelFit, 0, centerY);

	// Valor à direita
	ctx.fillStyle  = TEXT_MUTED;
	ctx.font       = `600 11px Inter, sans-serif`;
	ctx.textAlign  = 'left';
	ctx.fillText(formatNumber(item.valor), paddingLeft + barW + 8, centerY);
  });
}

// ------------------------------------------------------------
// Mini linha de evolução - para o modal da cidade
// canvas: elemento <canvas>
// values: [n, n, n, n, n]
// labels: ['2019','2020',...]
// ------------------------------------------------------------
function drawLineChart(canvas, values, labels) {
  const ctx  = canvas.getContext('2d');
  const dpr  = window.devicePixelRatio || 1;
  const W    = canvas.offsetWidth;
  const H    = canvas.offsetHeight;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, W, H);

  const padL = 12, padR = 12, padT = 16, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range  = maxVal - minVal || 1;

  const points = values.map((v, i) => ({
	x: padL + (i / (values.length - 1)) * innerW,
	y: padT + (1 - (v - minVal) / range) * innerH,
  }));

  // Área preenchida abaixo da linha
  ctx.beginPath();
  ctx.moveTo(points[0].x, padT + innerH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padT + innerH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, padT, 0, padT + innerH);
  grad.addColorStop(0,   'rgba(245,158,11,0.25)');
  grad.addColorStop(1,   'rgba(245,158,11,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Linha
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // Pontos
  points.forEach(p => {
	ctx.beginPath();
	ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
	ctx.fillStyle   = ACCENT;
	ctx.fill();
	ctx.strokeStyle = '#0f1117';
	ctx.lineWidth   = 2;
	ctx.stroke();
  });

  // Labels do eixo X
  ctx.fillStyle    = TEXT_MUTED;
  ctx.font         = `11px Inter, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  labels.forEach((label, i) => {
	ctx.fillText(label, points[i].x, padT + innerH + 8);
  });

  // Valores acima dos pontos
  ctx.fillStyle    = TEXT_PRIMARY;
  ctx.font         = `bold 10px Inter, sans-serif`;
  ctx.textBaseline = 'bottom';
  points.forEach((p, i) => {
	ctx.fillText(formatNumber(values[i]), p.x, p.y - 6);
  });
}

// Helper: retângulo com cantos arredondados
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

// Redimensiona gráficos ao redimensionar janela
function initChartResize(redrawFn) {
  let timer;
  window.addEventListener('resize', () => {
	clearTimeout(timer);
	timer = setTimeout(redrawFn, 120);
  });
}