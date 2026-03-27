const svg = document.getElementById("plant");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalHint = document.getElementById("modalHint");
const levelRange = document.getElementById("levelRange");
const levelNumber = document.getElementById("levelNumber");
const previewPercent = document.getElementById("previewPercent");
const previewText = document.getElementById("previewText");
const previewMeta = document.getElementById("previewMeta");
const humiditySelect = document.getElementById("humiditySelect");
const categorySelect = document.getElementById("categorySelect");
const notesInput = document.getElementById("notesInput");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const closeModal = document.getElementById("closeModal");
const resetBtn = document.getElementById("resetBtn");
const actionModalBackdrop = document.getElementById("actionModalBackdrop");
const addActionBtn = document.getElementById("addActionBtn");
const closeActionModal = document.getElementById("closeActionModal");
const cancelActionBtn = document.getElementById("cancelActionBtn");
const saveActionBtn = document.getElementById("saveActionBtn");
const actionOrigin = document.getElementById("actionOrigin");
const actionDestination = document.getElementById("actionDestination");
const actionsTableBody = document.getElementById("actionsTableBody");
const historyTableBody = document.getElementById("historyTableBody");
const confirmModalBackdrop = document.getElementById("confirmModalBackdrop");
const confirmText = document.getElementById("confirmText");
const closeConfirmModalBtn = document.getElementById("closeConfirmModalBtn");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
const confirmFinalizeBtn = document.getElementById("confirmFinalizeBtn");

let currentEquipment = null;
const NS = "http://www.w3.org/2000/svg";

let ongoingActions = [];
let actionHistory = [];
let pendingFinalizeId = null;

const STORAGE_KEYS = {
  equipment: "scada_equipment_state_v2",
  ongoing: "scada_ongoing_actions_v2",
  history: "scada_action_history_v2"
};

function saveAllData() {
  try {
    const equipmentState = equipments.map(eq => ({
      id: eq.id,
      level: eq.level || 0,
      humidity: eq.humidity || "Seca",
      category: eq.category || "Genética",
      notes: eq.notes || ""
    }));

    localStorage.setItem(STORAGE_KEYS.equipment, JSON.stringify(equipmentState));
    localStorage.setItem(STORAGE_KEYS.ongoing, JSON.stringify(ongoingActions || []));
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(actionHistory || []));
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
  }
}

function loadAllData() {
  try {
    const equipmentState = JSON.parse(localStorage.getItem(STORAGE_KEYS.equipment) || "[]");
    const ongoingState = JSON.parse(localStorage.getItem(STORAGE_KEYS.ongoing) || "[]");
    const historyState = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || "[]");

    if (Array.isArray(equipmentState)) {
      equipmentState.forEach(saved => {
        const eq = equipments.find(item => item.id === saved.id);
        if (!eq) return;
        eq.level = Number(saved.level || 0);
        eq.humidity = saved.humidity || "Seca";
        eq.category = saved.category || "Genética";
        eq.notes = saved.notes || "";
      });
    }

    ongoingActions = Array.isArray(ongoingState) ? ongoingState : [];
    actionHistory = Array.isArray(historyState) ? historyState : [];
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    ongoingActions = [];
    actionHistory = [];
  }
}

const flowColors = [
  "#c7a055", "#6bbf59", "#3aaed8", "#e67e22",
  "#9b59b6", "#e74c3c", "#16a085", "#f1c40f"
];


const equipmentAnchors = {
  moega: { bottom: { x: 115, y: 530 }, top: { x: 115, y: 410 } },
  caixa_ensaque: { bottom: { x: 265, y: 505 }, top: { x: 265, y: 380 } },
  pulmao_01: { bottom: { x: 387.5, y: 525 }, top: { x: 387.5, y: 217 } },
  pulmao_02: { bottom: { x: 522.5, y: 525 }, top: { x: 522.5, y: 217 } },
  pulmao_03: { bottom: { x: 657.5, y: 525 }, top: { x: 657.5, y: 217 } },
  pulmao_04: { bottom: { x: 792.5, y: 525 }, top: { x: 792.5, y: 217 } },
  secador: { bottom: { x: 950, y: 530 }, top: { x: 950, y: 75 } },
  exp_01: { bottom: { x: 1092.5, y: 525 }, top: { x: 1092.5, y: 247 } },
  exp_02: { bottom: { x: 1227.5, y: 525 }, top: { x: 1227.5, y: 247 } },
  exp_03: { bottom: { x: 1362.5, y: 525 }, top: { x: 1362.5, y: 247 } },
  exp_04: { bottom: { x: 1497.5, y: 525 }, top: { x: 1497.5, y: 247 } }
};

const labelGrid = {
  moega: { x: 48, y: 575, w: 124 },
  caixa_ensaque: { x: 198, y: 575, w: 138 },
  pulmao_01: { x: 340, y: 575, w: 128 },
  pulmao_02: { x: 478, y: 575, w: 128 },
  pulmao_03: { x: 616, y: 575, w: 128 },
  pulmao_04: { x: 754, y: 575, w: 128 },
  secador: { x: 892, y: 575, w: 130 },
  exp_01: { x: 1038, y: 575, w: 132 },
  exp_02: { x: 1174, y: 575, w: 132 },
  exp_03: { x: 1310, y: 575, w: 132 },
  exp_04: { x: 1446, y: 575, w: 132 }
};


const equipments = [
  {
    id: "moega",
    name: "MOEGA",
    hint: "Informe o percentual da moega. O preenchimento sobe do fundo para o topo.",
    segments: [{ type: "polygon", points: "40,410 190,410 190,468 132,530 98,530 40,468" }],
    draw: drawMoega
  },
  {
    id: "caixa_ensaque",
    name: "CAIXA DE ENSAQUE",
    hint: "Informe o percentual da caixa de ensaque.",
    segments: [{ type: "polygon", points: "230,380 300,380 300,468 265,505 230,468" }],
    draw: drawCaixaEnsaque
  },
  { id: "pulmao_01", name: "SILO PULMÃO 01", hint: "Cada anel e o funil são estágios. O nível sobe de baixo para cima.", segments: createSiloSegments(335, 245, 105, 34, 5, 415, 470, 525), draw: () => drawSilo(335, 245, 105, 34, 5, 415, 470, 525) },
  { id: "pulmao_02", name: "SILO PULMÃO 02", hint: "Cada anel e o funil são estágios. O nível sobe de baixo para cima.", segments: createSiloSegments(470, 245, 105, 34, 5, 415, 470, 525), draw: () => drawSilo(470, 245, 105, 34, 5, 415, 470, 525) },
  { id: "pulmao_03", name: "SILO PULMÃO 03", hint: "Cada anel e o funil são estágios. O nível sobe de baixo para cima.", segments: createSiloSegments(605, 245, 105, 34, 5, 415, 470, 525), draw: () => drawSilo(605, 245, 105, 34, 5, 415, 470, 525) },
  { id: "pulmao_04", name: "SILO PULMÃO 04", hint: "Cada anel e o funil são estágios. O nível sobe de baixo para cima.", segments: createSiloSegments(740, 245, 105, 34, 5, 415, 470, 525), draw: () => drawSilo(740, 245, 105, 34, 5, 415, 470, 525) },
  {
    id: "secador",
    name: "SECADOR",
    hint: "Informe o percentual do secador. O preenchimento sobe de baixo para cima.",
    segments: [{ type: "rect", x: 924, y: 190, width: 42, height: 340 }],
    draw: drawSecador
  },
  { id: "exp_01", name: "SILO EXPEDIÇÃO 01", hint: "Cada anel e o funil são estágios. O nível sobe de baixo para cima.", segments: createSiloSegments(1040, 275, 105, 34, 4, 411, 470, 525), draw: () => drawSilo(1040, 275, 105, 34, 4, 411, 470, 525) },
  { id: "exp_02", name: "SILO EXPEDIÇÃO 02", hint: "Cada anel e o funil são estágios. O nível sobe de baixo para cima.", segments: createSiloSegments(1175, 275, 105, 34, 4, 411, 470, 525), draw: () => drawSilo(1175, 275, 105, 34, 4, 411, 470, 525) },
  { id: "exp_03", name: "SILO EXPEDIÇÃO 03", hint: "Cada anel e o funil são estágios. O nível sobe de baixo para cima.", segments: createSiloSegments(1310, 275, 105, 34, 4, 411, 470, 525), draw: () => drawSilo(1310, 275, 105, 34, 4, 411, 470, 525) },
  { id: "exp_04", name: "SILO EXPEDIÇÃO 04", hint: "Cada anel e o funil são estágios. O nível sobe de baixo para cima.", segments: createSiloSegments(1445, 275, 105, 34, 4, 411, 470, 525), draw: () => drawSilo(1445, 275, 105, 34, 4, 411, 470, 525) },
].map(item => ({ ...item, level: 0, humidity: "Seca", category: "Genética", notes: "", fillEls: [] }));

function createSVG(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function createDefs() {
  const defs = createSVG("defs");

  const metalGrad = createSVG("linearGradient", { id: "metalGrad", x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
  metalGrad.innerHTML = `
    <stop offset="0%" stop-color="#dce3ea"/>
    <stop offset="22%" stop-color="#b4c1cc"/>
    <stop offset="50%" stop-color="#edf3f8"/>
    <stop offset="78%" stop-color="#a9b6c2"/>
    <stop offset="100%" stop-color="#d9e3eb"/>
  `;

  const roofGrad = createSVG("linearGradient", { id: "roofGrad", x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
  roofGrad.innerHTML = `
    <stop offset="0%" stop-color="#b4c0cb"/>
    <stop offset="50%" stop-color="#ecf3f7"/>
    <stop offset="100%" stop-color="#a4b0bc"/>
  `;

  const orangeGrad = createSVG("linearGradient", { id: "orangeGrad", x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
  orangeGrad.innerHTML = `
    <stop offset="0%" stop-color="#f48b3a"/>
    <stop offset="45%" stop-color="#e26a15"/>
    <stop offset="100%" stop-color="#c8530c"/>
  `;

  const soyPattern = createSVG("pattern", { id: "soyPattern", width: "24", height: "24", patternUnits: "userSpaceOnUse" });
  soyPattern.appendChild(createSVG("rect", { x: 0, y: 0, width: 24, height: 24, fill: "#d9b46b" }));
  [
    { cx: 5, cy: 6, rx: 4.1, ry: 3.1, fill: "#c39a56" },
    { cx: 16, cy: 5, rx: 4.2, ry: 3.2, fill: "#e4c786" },
    { cx: 8, cy: 15, rx: 4.0, ry: 3.0, fill: "#bf944e" },
    { cx: 19, cy: 16, rx: 4.1, ry: 3.1, fill: "#d7b16a" },
    { cx: 12, cy: 11, rx: 3.3, ry: 2.5, fill: "#b8873f" }
  ].forEach(b => soyPattern.appendChild(createSVG("ellipse", b)));

  defs.appendChild(metalGrad);
  defs.appendChild(roofGrad);
  defs.appendChild(orangeGrad);
  defs.appendChild(soyPattern);
  svg.appendChild(defs);
}

function drawGround() {
  svg.appendChild(createSVG("line", { x1: 20, y1: 560, x2: 1580, y2: 560, stroke: "#a6afb8", "stroke-width": 3 }));
}

function createLabel(x, y, w, text, eq = null) {
  const g = createSVG("g");
  const height = 64;
  g.appendChild(createSVG("rect", { x, y, rx: 6, ry: 6, width: w, height, class: "label-plate" }));

  const title = createSVG("text", { x: x + (w / 2), y: y + 18, class: "label-text" });
  title.textContent = text;
  g.appendChild(title);

  if (eq) {
    const cat = createSVG("text", { x: x + (w / 2), y: y + 35, class: "label-subtext" });
    cat.textContent = "";
    g.appendChild(cat);

    const hum = createSVG("text", { x: x + (w / 2), y: y + 50, class: "label-subtext" });
    hum.textContent = "";
    g.appendChild(hum);

    eq.labelCategory = cat;
    eq.labelHumidity = hum;
  }

  return g;
}

function createShape(segment, attrs = {}) {
  if (segment.type === "rect") {
    return createSVG("rect", { x: segment.x, y: segment.y, width: segment.width, height: segment.height, ...attrs });
  }
  return createSVG("polygon", { points: segment.points, ...attrs });
}

function createSiloSegments(x, y, width, ringHeight, ringCount, funnelTopY, funnelMidY, funnelBottomY) {
  const list = [];
  list.push({ type: "polygon", points: `${x},${funnelTopY} ${x+width},${funnelTopY} ${x+width-32},${funnelMidY} ${x+width-45},${funnelBottomY} ${x+45},${funnelBottomY} ${x+32},${funnelMidY}` });
  for (let i = ringCount - 1; i >= 0; i--) {
    list.push({ type: "rect", x, y: y + i * ringHeight, width, height: ringHeight });
  }
  return list;
}

function drawMoega() {
  const g = createSVG("g");
  g.appendChild(createSVG("polygon", { points: "40,410 190,410 190,468 132,530 98,530 40,468", class: "body-metal" }));
  g.appendChild(createSVG("line", { x1: 54, y1: 410, x2: 54, y2: 470, class: "outline" }));
  g.appendChild(createSVG("line", { x1: 40, y1: 410, x2: 190, y2: 410, class: "outline" }));
  g.appendChild(createSVG("line", { x1: 40, y1: 468, x2: 98, y2: 530, class: "outline" }));
  g.appendChild(createSVG("line", { x1: 190, y1: 468, x2: 132, y2: 530, class: "outline" }));
  const moegaLabel = labelGrid.moega;
  g.appendChild(createLabel(moegaLabel.x, moegaLabel.y, moegaLabel.w, "MOEGA", equipments.find(e => e.id === "moega")));
  return g;
}

function drawCaixaEnsaque() {
  const g = createSVG("g");
  g.appendChild(createSVG("rect", { x: 230, y: 388, width: 70, height: 70, class: "frame-green" }));
  g.appendChild(createSVG("polygon", { points: "230,458 300,458 265,505", class: "frame-green" }));
  g.appendChild(createSVG("line", { x1: 235, y1: 458, x2: 235, y2: 530, stroke: "#0c4513", "stroke-width": 6 }));
  g.appendChild(createSVG("line", { x1: 295, y1: 458, x2: 295, y2: 530, stroke: "#0c4513", "stroke-width": 6 }));
  const caixaLabel = labelGrid.caixa_ensaque;
  g.appendChild(createLabel(caixaLabel.x, caixaLabel.y, caixaLabel.w, "CAIXA", equipments.find(e => e.id === "caixa_ensaque")));
  return g;
}

function drawSilo(x, y, width, ringHeight, ringCount, funnelTopY, funnelMidY, funnelBottomY) {
  const g = createSVG("g");
  g.appendChild(createSVG("polygon", { points: `${x-5},${y} ${x+width+5},${y} ${x+width/2},${y-28}`, class: "roof-metal" }));

  for (let i = 0; i < ringCount; i++) {
    const ry = y + i * ringHeight;
    g.appendChild(createSVG("rect", { x, y: ry, width, height: ringHeight, class: "body-metal" }));
    g.appendChild(createSVG("line", { x1: x, y1: ry, x2: x+width, y2: ry, class: "outline" }));
  }

  g.appendChild(createSVG("polygon", { points: `${x},${funnelTopY} ${x+width},${funnelTopY} ${x+width-32},${funnelMidY} ${x+width-45},${funnelBottomY} ${x+45},${funnelBottomY} ${x+32},${funnelMidY}`, class: "body-metal" }));
  g.appendChild(createSVG("line", { x1: x, y1: funnelTopY, x2: x+width, y2: funnelTopY, class: "outline" }));
  g.appendChild(createSVG("line", { x1: x+32, y1: funnelMidY, x2: x+width-32, y2: funnelMidY, class: "outline" }));

  return g;
}

function drawSecador() {
  const g = createSVG("g");
  g.appendChild(createSVG("rect", { x: 905, y: 150, width: 28, height: 380, class: "orange-main" }));
  g.appendChild(createSVG("rect", { x: 935, y: 95, width: 50, height: 435, class: "orange-main" }));
  g.appendChild(createSVG("polygon", { points: "935,95 985,95 985,75 955,75", class: "orange-main" }));
  g.appendChild(createSVG("rect", { x: 900, y: 460, width: 100, height: 70, class: "orange-main" }));
  g.appendChild(createSVG("line", { x1: 1000, y1: 150, x2: 1000, y2: 530, class: "outline" }));
  [190, 250, 310].forEach(y => {
    g.appendChild(createSVG("rect", { x: 970, y, width: 32, height: 34, rx: 8, ry: 8, class: "orange-main" }));
  });
  const secadorLabel = labelGrid.secador;
  g.appendChild(createLabel(secadorLabel.x, secadorLabel.y, secadorLabel.w, "SECADOR", equipments.find(e => e.id === "secador")));
  return g;
}

function buildEquipment(eq) {
  const g = createSVG("g", { class: "equipment highlight", "data-id": eq.id });
  g.appendChild(eq.draw());

  eq.fillEls = [];
  eq.segments.forEach(seg => {
    const fill = createShape(seg, { class: "fill-segment" });
    g.appendChild(fill);
    eq.fillEls.push(fill);

    if (seg.type === "rect") {
      g.appendChild(createShape(seg, { class: "grid-line", fill: "none" }));
    } else {
      g.appendChild(createShape(seg, { class: "grid-line", fill: "none" }));
    }
  });

  // hover outline
  eq.segments.forEach(seg => {
    g.appendChild(createShape(seg, { class: "outline-hover" }));
  });

  // labels for silos that are not included in drawSilo
  if (eq.id.startsWith("pulmao")) {
    const idx = eq.name.replace("SILO PULMÃO ", "");
    const gridLabel = labelGrid[eq.id];
    g.appendChild(createLabel(gridLabel.x, gridLabel.y, gridLabel.w, `PULMÃO ${idx}`, eq));
  }
  if (eq.id.startsWith("exp_")) {
    const idx = eq.name.replace("SILO EXPEDIÇÃO ", "");
    const gridLabel = labelGrid[eq.id];
    g.appendChild(createLabel(gridLabel.x, gridLabel.y, gridLabel.w, `EXP ${idx}`, eq));
  }

  g.addEventListener("click", () => openModal(eq.id));
  svg.appendChild(g);
  renderEquipment(eq);
}

function renderEquipment(eq) {
  const total = eq.fillEls.length;
  const activeCount = Math.round((eq.level / 100) * total);
  eq.fillEls.forEach((el, i) => {
    el.classList.toggle("active", i < activeCount);
  });

  if (eq.labelCategory && eq.labelHumidity) {
    if (eq.level === 0) {
      eq.labelCategory.textContent = "";
      eq.labelHumidity.textContent = "";
    } else {
      eq.labelCategory.textContent = eq.category || "Genética";
      eq.labelHumidity.textContent = eq.humidity || "Seca";
    }
  }
}

function openModal(id) {
  currentEquipment = equipments.find(e => e.id === id);
  if (!currentEquipment) return;
  modalTitle.textContent = currentEquipment.name;
  modalHint.textContent = currentEquipment.hint;
  levelRange.value = currentEquipment.level;
  levelNumber.value = currentEquipment.level;
  humiditySelect.value = currentEquipment.humidity || "Seca";
  categorySelect.value = currentEquipment.category || "Genética";
  notesInput.value = currentEquipment.notes || "";
  updatePreview(currentEquipment.level);
  modalBackdrop.classList.remove("hidden");
}

function closeCurrentModal() {
  modalBackdrop.classList.add("hidden");
  currentEquipment = null;
}

function clamp(v) {
  v = Number(v);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function updatePreview(value) {
  value = clamp(value);
  previewPercent.textContent = value + "%";
  if (!currentEquipment) {
    previewText.textContent = "";
    // removed meta "";
    return;
  }
  const total = currentEquipment.fillEls.length;
  const activeCount = Math.round((value / 100) * total);
  previewText.textContent = `Estágios preenchidos: ${activeCount} de ${total}.`;
  const notes = (notesInput.value || "").trim();
  // removed meta
    `Umidade: ${humiditySelect.value}\n` +
    `Categoria: ${categorySelect.value}\n` +
    `Observações: ${notes ? notes : "Sem observações"}`;
}

levelRange.addEventListener("input", () => {
  const v = clamp(levelRange.value);
  levelNumber.value = v;
  updatePreview(v);
});

levelNumber.addEventListener("input", () => {
  const v = clamp(levelNumber.value);
  levelRange.value = v;
  updatePreview(v);
});

humiditySelect.addEventListener("change", () => updatePreview(levelNumber.value));
categorySelect.addEventListener("change", () => updatePreview(levelNumber.value));
notesInput.addEventListener("input", () => updatePreview(levelNumber.value));

saveBtn.addEventListener("click", () => {
  if (!currentEquipment) return;
  currentEquipment.level = clamp(levelNumber.value);
  currentEquipment.humidity = humiditySelect.value;
  currentEquipment.category = categorySelect.value;
  currentEquipment.notes = notesInput.value.trim();
  renderEquipment(currentEquipment);
  saveAllData();
  closeCurrentModal();
});

cancelBtn.addEventListener("click", closeCurrentModal);
closeModal.addEventListener("click", closeCurrentModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeCurrentModal();
});

if (resetBtn) resetBtn.addEventListener("click", () => {
  equipments.forEach(eq => {
    eq.level = 0;
    eq.humidity = "Seca";
    eq.category = "Genética";
    eq.notes = "";
    renderEquipment(eq);
  });
  saveAllData();
});



function getEquipmentNameById(id) {
  const eq = equipments.find(item => item.id === id);
  return eq ? eq.name : id;
}

function buildFlowPath(originId, destinationId, routeIndex = 0) {
  const origin = equipmentAnchors[originId];
  const destination = equipmentAnchors[destinationId];
  if (!origin || !destination) return "";

  const start = origin.bottom;
  const end = destination.top;

  const useRightSide = end.x >= start.x;

  const sideGap = 16;
  const verticalGap = 10;

  const sideLaneX = useRightSide
    ? 1575 - (routeIndex * sideGap)
    : 25 + (routeIndex * sideGap);

  const bottomLaneY = 548 - (routeIndex * verticalGap);
  const topLaneY = 52 + (routeIndex * verticalGap);

  return [
    `M ${start.x} ${start.y}`,
    `L ${start.x} ${bottomLaneY}`,
    `L ${sideLaneX} ${bottomLaneY}`,
    `L ${sideLaneX} ${topLaneY}`,
    `L ${end.x} ${topLaneY}`,
    `L ${end.x} ${end.y}`
  ].join(" ");
}

function clearFlowLines() {
  svg.querySelectorAll(".flow-line, .flow-line-glow").forEach(el => el.remove());
}

function renderFlowLines() {
  clearFlowLines();

  ongoingActions.forEach((action, index) => {
    const d = buildFlowPath(action.originId, action.destinationId, index);
    if (!d) return;

    const color = flowColors[index % flowColors.length];

    const glow = createSVG("path", {
      d,
      class: "flow-line-glow",
      stroke: color,
      opacity: 0.25
    });

    const line = createSVG("path", {
      d,
      class: "flow-line",
      stroke: color
    });

    svg.appendChild(glow);
    svg.appendChild(line);
  });
}

function getEquipmentOptions() {
  return equipments.map(eq => ({ id: eq.id, name: eq.name }));
}

function populateActionSelects() {
  const options = getEquipmentOptions();
  actionOrigin.innerHTML = "";
  actionDestination.innerHTML = "";

  options.forEach(opt => {
    const originOpt = document.createElement("option");
    originOpt.value = opt.id;
    originOpt.textContent = opt.name;
    actionOrigin.appendChild(originOpt);

    const destOpt = document.createElement("option");
    destOpt.value = opt.id;
    destOpt.textContent = opt.name;
    actionDestination.appendChild(destOpt);
  });

  if (options.length > 1) {
    actionDestination.selectedIndex = 1;
  }
}

function formatDateTime(dt) {
  return dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(startIso) {
  const start = new Date(startIso);
  const diffMs = Date.now() - start.getTime();
  const totalMin = Math.max(0, Math.floor(diffMs / 60000));
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}



function formatDateTimeFull(dtIso) {
  if (!dtIso) return "-";
  const dt = new Date(dtIso);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDurationFromRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "00:00";
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const totalMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function renderHistoryTable() {
  if (!historyTableBody) return;

  if (!Array.isArray(actionHistory) || actionHistory.length === 0) {
    historyTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">Nenhuma ação finalizada.</td>
      </tr>
    `;
    return;
  }

  historyTableBody.innerHTML = "";
  actionHistory.forEach(action => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${getEquipmentNameById(action.originId)}</td>
      <td>${getEquipmentNameById(action.destinationId)}</td>
      <td>${formatDateTimeFull(action.startAt)}</td>
      <td>${formatDateTimeFull(action.endAt)}</td>
      <td>${formatDurationFromRange(action.startAt, action.endAt)}</td>
    `;
    historyTableBody.appendChild(tr);
  });
}

function openConfirmActionModal(actionId) {
  pendingFinalizeId = actionId;
  const action = ongoingActions.find(item => item.id === actionId);

  if (action) {
    confirmText.textContent = `Deseja realmente finalizar a ação de ${getEquipmentNameById(action.originId)} para ${getEquipmentNameById(action.destinationId)}?`;
  } else {
    confirmText.textContent = "Deseja realmente finalizar esta ação?";
  }

  confirmModalBackdrop.classList.remove("hidden");
}

function closeConfirmActionModal() {
  confirmModalBackdrop.classList.add("hidden");
  pendingFinalizeId = null;
}

function finalizeActionById(actionId) {
  const idx = ongoingActions.findIndex(item => item.id === actionId);
  if (idx === -1) return;

  const action = ongoingActions[idx];
  ongoingActions.splice(idx, 1);

  const historyItem = {
    ...action,
    endAt: new Date().toISOString()
  };

  actionHistory.unshift(historyItem);

  renderActionsTable();
  renderHistoryTable();
  renderFlowLines();
  saveAllData();
  closeConfirmActionModal();
}

function renderActionsTable() {
  if (!ongoingActions.length) {
    actionsTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">Nenhuma ação em andamento.</td>
      </tr>
    `;
    return;
  }

  actionsTableBody.innerHTML = "";
  ongoingActions.forEach(action => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${getEquipmentNameById(action.originId)}</td>
      <td>${getEquipmentNameById(action.destinationId)}</td>
      <td>${formatDateTime(new Date(action.startAt))}</td>
      <td>${formatDuration(action.startAt)}</td>
      <td>
        <div class="row-actions">
          <button class="btn small danger" data-remove-id="${action.id}">Finalizar</button>
        </div>
      </td>
    `;
    actionsTableBody.appendChild(tr);
  });

  actionsTableBody.querySelectorAll("[data-remove-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-remove-id");
      ongoingActions = ongoingActions.filter(item => item.id !== id);
      renderActionsTable();
  renderHistoryTable();
  renderFlowLines();
      renderFlowLines();
    });
  });
}

function openActionModal() {
  populateActionSelects();
  actionModalBackdrop.classList.remove("hidden");
}

function closeCurrentActionModal() {
  actionModalBackdrop.classList.add("hidden");
}

function addOngoingAction() {
  const originId = actionOrigin.value;
  const destinationId = actionDestination.value;

  if (!originId || !destinationId) return;
  if (originId === destinationId) {
    alert("Origem e destino não podem ser iguais.");
    return;
  }

  ongoingActions.unshift({
    id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    originId,
    destinationId,
    startAt: new Date().toISOString()
  });

  renderActionsTable();
  renderHistoryTable();
  renderFlowLines();
  saveAllData();
  closeCurrentActionModal();
}

function init() {
  loadAllData();
  createDefs();
  drawGround();
  equipments.forEach(buildEquipment);
  populateActionSelects();
  renderActionsTable();

  addActionBtn.addEventListener("click", openActionModal);
  closeActionModal.addEventListener("click", closeCurrentActionModal);
  cancelActionBtn.addEventListener("click", closeCurrentActionModal);
  saveActionBtn.addEventListener("click", addOngoingAction);
  actionModalBackdrop.addEventListener("click", (e) => {
    if (e.target === actionModalBackdrop) closeCurrentActionModal();
  });

  setInterval(renderActionsTable, 60000);
}

init();
