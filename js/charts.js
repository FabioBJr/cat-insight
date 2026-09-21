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
// Gráfico de barras horizontais - profissões
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
  const paddingBot   = 24;

  const maxVal    = Math.max(...data.map(d => d.valor));
  const barCount  = data.length;
  const totalH    = H - paddingTop - paddingBot;
  const barH      = Math.floor((totalH / barCount) * 0.55);
  const gap       = Math.floor((totalH / barCount) * 0.45);
  const availW    = W - paddingLeft - paddingRight;

  // DESENHANDO AS LINHAS DE GRADE VERTICAIS E VALORES DO EIXO X
  const linhasGrade = 4; // Dividindo em 4 partes
  
  ctx.font = '500 11px Inter, sans-serif'; 
  ctx.textAlign = 'center'; 
  ctx.textBaseline = 'top';

  for (let j = 0; j <= linhasGrade; j++) {
    // Calcula a posição X da linha
    const xGrade = paddingLeft + (availW / linhasGrade) * j;
    const valorLinha = (maxVal / linhasGrade) * j;
    
    // Formata o número (ex: 10000 vira "10k")
    let textoValor = Math.round(valorLinha).toString();
    if (valorLinha >= 1000) {
      textoValor = Math.round(valorLinha / 1000) + 'k';
    }

    // Desenha o número abaixo da grade
    ctx.fillStyle = TEXT_MUTED; 
    ctx.fillText(textoValor, xGrade, paddingTop + totalH + 8);

    // Desenha a linha vertical
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)'; 
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xGrade, paddingTop); 
    ctx.lineTo(xGrade, paddingTop + totalH); 
    ctx.stroke();
  }

  // DESENHANDO O EIXO Y PRINCIPAL (A LINHA QUE SEPARA OS TEXTOS)
  ctx.strokeStyle = '#475569'; 
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop); 
  ctx.lineTo(paddingLeft, paddingTop + totalH); 
  ctx.stroke();

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
	ctx.textAlign    = 'right';
	ctx.textBaseline = 'middle';
	ctx.fillText(labelsFit[i].labelFit, 328, centerY);

	// Valor à direita
	ctx.fillStyle  = TEXT_MUTED;
	ctx.font       = `600 11px Inter, sans-serif`;
	ctx.textAlign  = 'left';
	ctx.fillText(formatNumber(item.valor), paddingLeft + barW + 8, centerY);
  });
}

// ------------------------------------------------------------
// Gráfico de barras verticais - faixa etária
// canvas: elemento <canvas>
// data:   [{ label, valor }]
// color:  cor das barras
// ------------------------------------------------------------
function drawVerticalBarChart(canvas, data, color = '#3b82f6') { // Azul padrão da sua imagem
  const ctx    = canvas.getContext('2d');
  const dpr    = window.devicePixelRatio || 1;
  const W      = canvas.offsetWidth;
  const H      = canvas.offsetHeight;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  // Inversão das margens para o formato vertical
  const paddingLeft  = 40;
  const paddingRight = 16;
  const paddingTop   = 24; // Espaço para o valor acima da barra
  const paddingBot   = 24; // Espaço para o label abaixo da barra

  const maxVal   = Math.max(...data.map(d => d.valor));
  const barCount = data.length;
  const totalW   = W - paddingLeft - paddingRight;
  const barW     = Math.floor((totalW / barCount) * 0.55); // 55% largura da barra
  const gap      = Math.floor((totalW / barCount) * 0.45); // 45% espaçamento
  const availH   = H - paddingTop - paddingBot;

  // DESENHANDO AS LINHAS DE GRADE E OS VALORES DO EIXO y
  // Configurando fonte dos números laterais
  ctx.font = '500 11px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseLine = 'middle';

  const linhasGrade = 5; // Quantidade de linhas horizontais

  for (let j = 0; j <= linhasGrade; j++) {
    // Calcula a posição Y de cada linha
    const yGrade = paddingTop + (availH / linhasGrade) * j;

    // Calcula o valor matemático correspondente a essa altura
    // Topo (j=0) é maxVal, base (j=5) é 0.
    const valorLinha = maxVal - (maxVal / linhasGrade) * j;

    // Formata o número (ex: 50000 vira "50k")
    let textoValor = Math.round(valorLinha).toString();
    if (valorLinha >= 1000) {
      textoValor = Math.round(valorLinha / 1000) + 'k';
    }

    // Desenha o número um pouco à esquerda de onde a linha começa
    ctx.fillStyle = TEXT_MUTED; 
    ctx.fillText(textoValor, paddingLeft - 8, yGrade);

    // Desenha a linha
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)'; 
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, yGrade); 
    ctx.lineTo(W - paddingRight, yGrade); 
    ctx.stroke();
  }

  // DESENHANDO O EIXO X PRINCIPAL (BASE)
  ctx.strokeStyle = '#475569'; 
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop + availH); 
  ctx.lineTo(W - paddingRight, paddingTop + availH); 
  ctx.stroke();

  data.forEach((item, i) => {
    // Calcula a posição no eixo X e a altura (eixo Y)
    const x       = paddingLeft + i * (barW + gap) + gap / 2;
    const barH    = Math.round((item.valor / maxVal) * availH) || 1; // Garante 1px se o valor for muito baixo
    const y       = paddingTop + availH - barH;
    const centerX = x + barW / 2;

    // Barra de fundo (BG_BAR) ocupando a altura total disponível
    ctx.fillStyle = BG_BAR;
    roundRect(ctx, x, paddingTop, barW, availH, 4);
    ctx.fill();

    // Barra de valor preenchida de baixo para cima[cite: 2]
    ctx.fillStyle = color;
    roundRect(ctx, x, y, barW, barH, 4);
    ctx.fill();

    // Valores totais posicionados acima de cada barra (ex: 34.858)
    ctx.fillStyle    = TEXT_MUTED;
    ctx.font         = `600 11px Inter, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatNumber(item.valor), centerX, y - 6);

    // Labels do eixo X posicionados abaixo de cada barra (ex: 18-24)
    ctx.fillStyle    = TEXT_PRIMARY;
    ctx.font         = `500 12px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(item.label, centerX, paddingTop + availH + 8);
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