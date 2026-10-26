// ============================================================
// charts.js - Gráficos com Canvas puro (zero dependências)
// ============================================================

const ACCENT       = '#f59e0b';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_MUTED   = '#64748b';
const BAR_BG       = '#2a3040';
const GRID_COLOR   = 'rgba(100, 116, 139, 0.2)';
const AXIS_COLOR   = '#475569';

// Abaixo desta largura (px) os gráficos entram em modo compacto (celulares)
const COMPACT_WIDTH = 520;

// Ajusta o canvas à densidade de pixels da tela e retorna contexto + dimensões lógicas
function setupCanvas(canvas) {
  const ctx    = canvas.getContext('2d');
  const dpr    = window.devicePixelRatio || 1;
  const width  = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  canvas.width  = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  return { ctx, width, height };
}

// Corta o texto com reticências para caber em maxWidth pixels (usa a fonte atual do ctx)
function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}

// Abrevia números grandes para telas estreitas (34858 -> "34,9k")
function abbreviateNumber(n) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return (k >= 100 ? Math.round(k) : k.toFixed(1).replace('.', ',').replace(',0', '')) + 'k';
}

// Rótulo dos eixos (ex: 10000 vira "10k")
function formatAxisValue(value) {
  return value >= 1000 ? Math.round(value / 1000) + 'k' : String(Math.round(value));
}

// ------------------------------------------------------------
// Gráfico de barras horizontais - profissões
// canvas:      elemento <canvas>
// data:        [{ label, value }]
// color:       cor das barras
// forceMaxVal: máximo fixo da escala (mantém a mesma referência entre filtros)
// ------------------------------------------------------------
function drawBarChart(canvas, data, color = ACCENT, forceMaxVal = null) {
  const { ctx, width: W, height: H } = setupCanvas(canvas);

  // Modo compacto para celulares: fontes/margens menores e rótulos mais curtos
  const compact = W < COMPACT_WIDTH;

  // Os rótulos podem ocupar no máximo uma fração da largura, o resto fica para as barras
  const maxLabelArea = Math.floor(W * (compact ? 0.38 : 0.45));
  ctx.font = `500 ${compact ? 11 : 12}px Inter, sans-serif`;
  const labels = data.map(d => fitText(ctx, d.label, maxLabelArea));

  const maxLabelW    = Math.max(...labels.map(l => ctx.measureText(l).width));
  const paddingLeft  = Math.ceil(maxLabelW) + 16;
  const paddingRight = compact ? 52 : 72; // espaço para o número à direita da barra mais longa
  const paddingTop   = 12;
  const paddingBot   = 24;

  const maxVal = Math.max(forceMaxVal || 0, ...data.map(d => d.value));
  const totalH = H - paddingTop - paddingBot;
  const barH   = Math.floor((totalH / data.length) * 0.55);
  const gap    = Math.floor((totalH / data.length) * 0.45);
  const availW = W - paddingLeft - paddingRight;

  // Linhas de grade verticais e valores do eixo X
  const gridLines = 4;
  ctx.font         = '500 11px Inter, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';

  for (let j = 0; j <= gridLines; j++) {
    const xGrid = paddingLeft + (availW / gridLines) * j;

    // Número abaixo da grade
    ctx.fillStyle = TEXT_MUTED;
    ctx.fillText(formatAxisValue((maxVal / gridLines) * j), xGrid, paddingTop + totalH + 8);

    // Linha vertical
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(xGrid, paddingTop);
    ctx.lineTo(xGrid, paddingTop + totalH);
    ctx.stroke();
  }

  // Eixo Y principal (linha que separa os textos das barras)
  ctx.strokeStyle = AXIS_COLOR;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, paddingTop + totalH);
  ctx.stroke();

  data.forEach((item, i) => {
    const y       = paddingTop + i * (barH + gap);
    const barW    = Math.round((item.value / maxVal) * availW);
    const centerY = y + barH / 2;

    // Barra de fundo
    ctx.fillStyle = BAR_BG;
    roundRect(ctx, paddingLeft, y, availW, barH, 4);
    ctx.fill();

    // Barra de valor
    ctx.fillStyle = color;
    roundRect(ctx, paddingLeft, y, barW, barH, 4);
    ctx.fill();

    // Rótulo à esquerda do eixo
    ctx.fillStyle    = TEXT_PRIMARY;
    ctx.font         = `500 ${compact ? 11 : 12}px Inter, sans-serif`;
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], paddingLeft - 12, centerY);

    // Valor à direita da barra
    ctx.fillStyle = TEXT_MUTED;
    ctx.font      = `600 ${compact ? 10 : 11}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(formatNumber(item.value), paddingLeft + barW + 8, centerY);
  });
}

// ------------------------------------------------------------
// Gráfico de barras verticais - faixa etária
// canvas:      elemento <canvas>
// data:        [{ label, value }]
// color:       cor das barras
// forceMaxVal: máximo fixo da escala (mantém a mesma referência entre filtros)
// ------------------------------------------------------------
function drawVerticalBarChart(canvas, data, color = '#3b82f6', forceMaxVal = null) {
  const { ctx, width: W, height: H } = setupCanvas(canvas);

  // Modo compacto para celulares: margens e fontes menores
  const compact = W < COMPACT_WIDTH;

  const paddingLeft  = compact ? 32 : 40;
  const paddingRight = compact ? 8  : 16;
  const paddingTop   = 24; // espaço para o valor acima da barra
  const paddingBot   = 24; // espaço para o rótulo abaixo da barra

  const maxVal = Math.max(forceMaxVal || 0, ...data.map(d => d.value));
  const totalW = W - paddingLeft - paddingRight;
  const barW   = Math.floor((totalW / data.length) * 0.55); // 55% largura da barra
  const gap    = Math.floor((totalW / data.length) * 0.45); // 45% espaçamento
  const availH = H - paddingTop - paddingBot;

  // Linhas de grade horizontais e valores do eixo Y
  const gridLines = 5;
  ctx.font         = '500 11px Inter, sans-serif';
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';

  for (let j = 0; j <= gridLines; j++) {
    const yGrid = paddingTop + (availH / gridLines) * j;

    // Topo (j=0) é maxVal, base (j=gridLines) é 0
    const lineValue = maxVal - (maxVal / gridLines) * j;

    // Número à esquerda de onde a linha começa
    ctx.fillStyle = TEXT_MUTED;
    ctx.fillText(formatAxisValue(lineValue), paddingLeft - 8, yGrid);

    // Linha horizontal
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, yGrid);
    ctx.lineTo(W - paddingRight, yGrid);
    ctx.stroke();
  }

  // Eixo X principal (base)
  ctx.strokeStyle = AXIS_COLOR;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop + availH);
  ctx.lineTo(W - paddingRight, paddingTop + availH);
  ctx.stroke();

  data.forEach((item, i) => {
    const x       = paddingLeft + i * (barW + gap) + gap / 2;
    const barH    = Math.round((item.value / maxVal) * availH) || 1; // garante 1px se o valor for muito baixo
    const y       = paddingTop + availH - barH;
    const centerX = x + barW / 2;
    const slotW   = barW + gap;

    // Barra de fundo ocupando a altura total disponível
    ctx.fillStyle = BAR_BG;
    roundRect(ctx, x, paddingTop, barW, availH, 4);
    ctx.fill();

    // Barra de valor preenchida de baixo para cima
    ctx.fillStyle = color;
    roundRect(ctx, x, y, barW, barH, 4);
    ctx.fill();

    // Valor acima da barra; em telas estreitas o número completo não cabe: abrevia (34,9k)
    const valueText  = compact && slotW < 56 ? abbreviateNumber(item.value) : formatNumber(item.value);
    ctx.fillStyle    = TEXT_MUTED;
    ctx.font         = `600 ${compact ? 10 : 11}px Inter, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(valueText, centerX, y - 6);

    // Rótulo do eixo X abaixo da barra (ex: 18-24)
    ctx.fillStyle    = TEXT_PRIMARY;
    ctx.font         = `500 ${compact ? 10 : 12}px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(fitText(ctx, item.label, slotW - 2), centerX, paddingTop + availH + 8);
  });
}

// ------------------------------------------------------------
// Linha de evolução anual - modal da cidade
// canvas: elemento <canvas>
// values: [n, n, n, ...]
// labels: [2022, 2023, ...]
// ------------------------------------------------------------
function drawLineChart(canvas, values, labels) {
  const { ctx, width: W, height: H } = setupCanvas(canvas);

  // Padding lateral generoso: os rótulos são centralizados em cada ponto,
  // então o primeiro/último precisam de espaço para não serem cortados
  const padL = 36, padR = 36, padT = 24, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Escala começa em 0 para não distorcer quedas pequenas;
  // mínimo de 10 para cidades com pouquíssimos registros
  const maxVal = Math.max(...values, 10);

  const points = values.map((v, i) => ({
    x: padL + (values.length > 1 ? i / (values.length - 1) : 0.5) * innerW,
    y: padT + (1 - v / maxVal) * innerH,
  }));

  // Área preenchida abaixo da linha
  ctx.beginPath();
  ctx.moveTo(points[0].x, padT + innerH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padT + innerH);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, padT, 0, padT + innerH);
  gradient.addColorStop(0, 'rgba(245,158,11,0.25)');
  gradient.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.fillStyle = gradient;
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

  // Rótulos do eixo X
  ctx.fillStyle    = TEXT_MUTED;
  ctx.font         = '11px Inter, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  labels.forEach((label, i) => {
    ctx.fillText(label, points[i].x, padT + innerH + 8);
  });

  // Valores acima dos pontos
  ctx.fillStyle    = TEXT_PRIMARY;
  ctx.font         = 'bold 10px Inter, sans-serif';
  ctx.textBaseline = 'bottom';
  points.forEach((p, i) => {
    ctx.fillText(formatNumber(values[i]), p.x, p.y - 6);
  });
}

// Retângulo com cantos arredondados
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

// Redesenha os gráficos ao redimensionar a janela / girar o celular
function initChartResize(redrawFn) {
  let timer;
  let lastWidth = window.innerWidth;
  const onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // Em celulares, rolar a página dispara 'resize' (barra de endereço): só redesenha se a largura mudou
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      redrawFn();
    }, 120);
  };
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
}
