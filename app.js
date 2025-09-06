(() => {
  const EMOJI_SET = ["⭐","💼","📁","🧩","🗂️","📦","📝","🖼️","🛠️","🧪","🧠","💡","🔧","🗃️","📊","🧾","🔒","🚀"];
  const ICONS = [
    { name: "Upload", path: "M128 176a8 8 0 1 1 0 16h-64a40 40 0 1 1 0-80h6.9a72 72 0 1 1 138.2 0H216a32 32 0 1 1 0 64h-40a8 8 0 0 1 0-16h40a16 16 0 1 0 0-32h-11.9a8 8 0 0 1-7.9-6.7A56 56 0 0 0 70.8 96.8 8 8 0 0 1 64 104H64a24 24 0 1 0 0 48h64zm16-104a8 8 0 0 1 8 8v60.7l18.3-18.4a8 8 0 1 1 11.4 11.4l-32 32a8 8 0 0 1-11.4 0l-32-32a8 8 0 0 1 11.4-11.4L120 140.7V80a8 8 0 0 1 8-8z" },
    { name: "Users", path: "M160 88a32 32 0 1 1 32 32 32 32 0 0 1-32-32zm-96 8a32 32 0 1 1 32 32 32 32 0 0 1-32-32zm176 88a40 40 0 0 0-40-40h-20a4 4 0 0 0-4 4v20a44 44 0 0 0 44 44h28a4 4 0 0 0 4-4zm-96 36a60 60 0 0 0-60-60H60a44 44 0 0 0-44 44v12a4 4 0 0 0 4 4h144a4 4 0 0 0 4-4z" },
    { name: "Sync", path: "M200 128a72 72 0 1 1-21.1-51l10.1-10.1a8 8 0 0 1 13.7 5.7v40a8 8 0 0 1-8 8h-40a8 8 0 0 1-5.7-13.7l10.5-10.5A56 56 0 1 0 184 128a8 8 0 0 1 16 0z" }
  ];
  function svgDataURL(path, color, size=256) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256" fill="${color}"><path d="${path}"/></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  const state = {
    canvasSize: 384,
    bodyColor: "#FFD980",
    tabColor: "#F3B432",
    corner: 24,
    shadow: 6,
    strokeWidth: 0,
    strokeColor: "#000000",
    gradient: true,
    gradientDarken: 0.22,
    transparentBG: false,
    overlays: [], // {id, type:'emoji'|'text'|'image', value, x,y, scale, rotation, color?}
    activeId: null,
  };

  // Elements
  const $ = (sel) => document.querySelector(sel);
  const canvas = $("#preview");
  const ctx = canvas.getContext("2d");
  const previewSize = $("#previewSize");
  const previewSizeLabel = $("#previewSizeLabel");
  const transparentBG = $("#transparentBG");

  const bodyColor = $("#bodyColor");
  const tabColor = $("#tabColor");
  const corner = $("#corner");
  const cornerLabel = $("#cornerLabel");
  const shadow = $("#shadow");
  const shadowLabel = $("#shadowLabel");
  const strokeWidth = $("#strokeWidth");
  const strokeWidthLabel = $("#strokeWidthLabel");
  const strokeColor = $("#strokeColor");
  const gradient = $("#gradient");
  const gradientDarken = $("#gradientDarken");
  const gradientDarkenLabel = $("#gradientDarkenLabel");

  const emojiGrid = $("#emojiGrid");
  const addText = $("#addText");
  const imageInput = $("#imageInput");
  const objectsList = $("#objectsList");
  const editor = $("#objectEditor");
  const objX = $("#objX");
  const objY = $("#objY");
  const objScale = $("#objScale");
  const objRot = $("#objRot");
  const objText = $("#objText");
  const objColor = $("#objColor");
  const textControls = $("#textControls");
  const iconColorInput = document.createElement("input"); iconColorInput.type="color"; iconColorInput.value="#38bdf8"; iconColorInput.title="Barva piktogramu";
  const deleteObj = $("#deleteObj");
  const doneObj = $("#doneObj");

  const exportICOBtn = $("#exportICO");
  const shareBtn = $("#shareBtn");

  // Footer year
  $("#year").textContent = new Date().getFullYear();

  // Inject emojis
  
  // Icons grid
  const iconGrid = $("#iconGrid");
  ICONS.forEach(ic => {
    const b = document.createElement("button");
    b.title = ic.name;
    b.textContent = "⬤"; // simple dot preview; color set later
    b.addEventListener("click", () => addIcon(ic, "#38bdf8")); // default cyan-ish
    iconGrid.appendChild(b);
  });

  EMOJI_SET.forEach(e => {
    const b = document.createElement("button");
    b.textContent = e;
    b.addEventListener("click", () => addEmoji(e));
    emojiGrid.appendChild(b);
  });

  // Presets
  document.querySelectorAll(".presets .btn").forEach(b => {
    b.addEventListener("click", () => {
      const p = JSON.parse(b.dataset.preset);
      state.bodyColor = p.body; state.tabColor = p.tab;
      syncInputsFromState(); render();
    });
  });

  // Load from URL hash
  try {
    const hash = location.hash.replace(/^#/, "");
    if (hash) {
      const json = JSON.parse(atob(decodeURIComponent(hash)));
      if (json && json.__fis) Object.assign(state, json);
    }
  } catch {}

  // Input bindings
  previewSize.addEventListener("input", () => { 
    state.canvasSize = parseInt(previewSize.value, 10); 
    previewSizeLabel.textContent = `${state.canvasSize} px`;
    canvas.width = canvas.height = state.canvasSize;
    render();
  });
  transparentBG.addEventListener("change", () => { state.transparentBG = transparentBG.checked; render(); });

  bodyColor.addEventListener("input", () => { state.bodyColor = bodyColor.value; render(); });
  tabColor.addEventListener("input", () => { state.tabColor = tabColor.value; render(); });
  corner.addEventListener("input", () => { state.corner = parseInt(corner.value,10); cornerLabel.textContent = `${state.corner} px`; render(); });
  shadow.addEventListener("input", () => { state.shadow = parseInt(shadow.value,10); shadowLabel.textContent = `${state.shadow} px`; render(); });
  strokeWidth.addEventListener("input", () => { state.strokeWidth = parseInt(strokeWidth.value,10); strokeWidthLabel.textContent = `${state.strokeWidth} px`; render(); });
  strokeColor.addEventListener("input", () => { state.strokeColor = strokeColor.value; render(); });
  gradient.addEventListener("change", () => { state.gradient = gradient.checked; render(); });
  gradientDarken.addEventListener("input", () => { state.gradientDarken = parseFloat(gradientDarken.value); gradientDarkenLabel.textContent = state.gradientDarken.toFixed(2); render(); });

  addText.addEventListener("click", () => {
    const id = crypto.randomUUID();
    state.overlays.push({ id, type: "text", value: "ABC", x: .5, y: .5, scale: 1, rotation: 0, color: "#222222" });
    state.activeId = id;
    refreshObjects(); render(); openEditor();
  });

  imageInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const id = crypto.randomUUID();
      state.overlays.push({ id, type: "image", value: reader.result, x: .5, y: .6, scale: 1, rotation: 0 });
      state.activeId = id;
      refreshObjects(); render(); openEditor();
    };
    reader.readAsDataURL(file);
    imageInput.value = "";
  });

  // Object editor controls
  [objX, objY, objScale, objRot].forEach(inp => {
    inp.addEventListener("input", () => {
      const o = activeOverlay(); if (!o) return;
      if (inp === objX) o.x = clamp(parseFloat(objX.value), 0, 1);
      if (inp === objY) o.y = clamp(parseFloat(objY.value), 0, 1);
      if (inp === objScale) o.scale = clamp(parseFloat(objScale.value), .3, 2);
      if (inp === objRot) o.rotation = clamp(parseFloat(objRot.value), -45, 45);
      render();
    });
  });
  objText.addEventListener("input", () => { const o = activeOverlay(); if (!o) return; o.value = objText.value; render(); });
  objColor.addEventListener("input", () => { const o = activeOverlay(); if (!o) return; o.color = objColor.value; render(); });

  deleteObj.addEventListener("click", () => {
    if (!state.activeId) return;
    state.overlays = state.overlays.filter(o => o.id !== state.activeId);
    state.activeId = null;
    refreshObjects(); closeEditor(); render();
  });
  doneObj.addEventListener("click", () => { closeEditor(); });

  // Export buttons
  document.querySelectorAll("[data-png]").forEach(b => {
    b.addEventListener("click", () => exportPNG(parseInt(b.dataset.png,10)));
  });
  exportICOBtn.addEventListener("click", exportICO);
  shareBtn.addEventListener("click", copyShareLink);

  // Canvas interactions (drag)
  let drag = { id: null, dx: 0, dy: 0 };
  function canvasToIconXY(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left) / rect.width;
    const y = (evt.clientY - rect.top) / rect.height;
    return { x, y };
  }
  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = canvasToIconXY(e);
    for (let i = state.overlays.length - 1; i >= 0; i--) {
      const o = state.overlays[i];
      const hx = o.x, hy = o.y, r = 0.08 * o.scale;
      if (Math.hypot(x - hx, y - hy) < r) {
        state.activeId = o.id;
        drag = { id: o.id, dx: x - o.x, dy: y - o.y };
        refreshObjects(); openEditor(); render();
        return;
      }
    }
    state.activeId = null; refreshObjects(); closeEditor();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag.id) return;
    const { x, y } = canvasToIconXY(e);
    state.overlays = state.overlays.map(o => o.id === drag.id ? { ...o, x: clamp(x - drag.dx, 0, 1), y: clamp(y - drag.dy, 0, 1) } : o);
    syncEditorFromActive(); render();
  });
  window.addEventListener("pointerup", () => { drag = { id:null, dx:0, dy:0 }; });

  
  function addIcon(icon, color) {
    const id = crypto.randomUUID();
    const data = svgDataURL(icon.path, color);
    state.overlays.push({ id, type: "icon", iconPath: icon.path, color, value: data, x: .5, y: .5, scale: 1, rotation: 0 });
    state.activeId = id;
    refreshObjects(); render(); openEditor();
  }

  function addEmoji(emoji) {
    const id = crypto.randomUUID();
    state.overlays.push({ id, type: "emoji", value: emoji, x: .7, y: .7, scale: 1, rotation: 0, color: "#000000" });
    state.activeId = id;
    refreshObjects(); render(); openEditor();
  }
  function activeOverlay() { return state.overlays.find(o => o.id === state.activeId) || null; }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function syncInputsFromState() {
    previewSize.value = state.canvasSize; previewSizeLabel.textContent = `${state.canvasSize} px`;
    transparentBG.checked = state.transparentBG;
    bodyColor.value = state.bodyColor; tabColor.value = state.tabColor;
    corner.value = state.corner; cornerLabel.textContent = `${state.corner} px`;
    shadow.value = state.shadow; shadowLabel.textContent = `${state.shadow} px`;
    strokeWidth.value = state.strokeWidth; strokeWidthLabel.textContent = `${state.strokeWidth} px`;
    strokeColor.value = state.strokeColor;
    gradient.checked = state.gradient;
    gradientDarken.value = state.gradientDarken; gradientDarkenLabel.textContent = state.gradientDarken.toFixed(2);
  }

  function refreshObjects() {
    objectsList.innerHTML = "";
    if (state.overlays.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Zatím žádné objekty. Přidejte emoji, text nebo obrázek.";
      p.style.color = "#64748b";
      p.style.fontSize = ".95rem";
      objectsList.appendChild(p);
      return;
    }
    state.overlays.forEach(o => {
      const row = document.createElement("div");
      row.className = "obj" + (o.id === state.activeId ? " active" : "");
      const left = document.createElement("div");
      left.style.display = "flex"; left.style.alignItems = "center"; left.style.gap = "10px";
      const icon = document.createElement("span");
      icon.textContent = o.type === "emoji" ? o.value : (o.type === "text" ? "🔤" : "🖼️");
      icon.style.fontSize = "20px";
      const label = document.createElement("span");
      label.textContent = o.type === "text" ? (o.value || "Text") : (o.type === "emoji" ? "Emoji" : (o.type === "icon" ? "Piktogram" : "Obrázek"));
      label.style.color = "#475569"; label.style.fontSize = ".95rem";
      left.appendChild(icon); left.appendChild(label);
      const right = document.createElement("div");
      const selBtn = document.createElement("button"); selBtn.className = "btn btn-outline"; selBtn.textContent = "Vybrat";
      const delBtn = document.createElement("button"); delBtn.className = "btn btn-danger"; delBtn.textContent = "Smazat";
      selBtn.addEventListener("click", () => { state.activeId = o.id; refreshObjects(); openEditor(); render(); });
      delBtn.addEventListener("click", () => { state.overlays = state.overlays.filter(x => x.id !== o.id); if (state.activeId === o.id) state.activeId = null; refreshObjects(); closeEditor(); render(); });
      right.style.display="flex"; right.style.gap="8px";
      right.appendChild(selBtn); right.appendChild(delBtn);
      row.appendChild(left); row.appendChild(right);
      objectsList.appendChild(row);
    });
  }

  function openEditor() {
    if (!state.activeId) return;
    editor.classList.remove("hidden");
    syncEditorFromActive();
  }
  function closeEditor() { editor.classList.add("hidden"); }
  function syncEditorFromActive() {
    const o = activeOverlay(); if (!o) return;
    objX.value = o.x; objY.value = o.y; objScale.value = o.scale; objRot.value = o.rotation || 0;
  
    // Show icon color picker when type is icon
    editor.querySelectorAll(".icon-color-row")?.forEach?.(n=>n.remove());
    const o2 = activeOverlay();
    if (!o2) return;
    if (o2.type === "icon") {
      const row = document.createElement("div");
      row.className = "row icon-color-row";
      const lab = document.createElement("label"); lab.textContent = "Barva piktogramu"; lab.className = "label";
      const input = document.createElement("input"); input.type = "color"; input.value = o2.color || "#38bdf8";
      input.addEventListener("input", () => {
        const color = input.value;
        // regenerate SVG data
        const data = svgDataURL(o2.iconPath, color);
        o2.color = color; o2.value = data;
        render();
      });
      row.appendChild(lab); row.appendChild(input);
      editor.insertBefore(row, editor.querySelector(".row") || editor.firstChild);
    }

    if (o.type === "text") {
      textControls.classList.remove("hidden");
      objText.value = o.value || "";
      objColor.value = o.color || "#222222";
    } else {
      textControls.classList.add("hidden");
    }
  }

  function shadeColor(hex, percent) {
    const f = parseInt(hex.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = Math.abs(percent);
    const R = f >> 16, G = (f >> 8) & 0xFF, B = f & 0xFF;
    const r = Math.round((t - R) * p) + R;
    const g = Math.round((t - G) * p) + G;
    const b = Math.round((t - B) * p) + B;
    return `#${(0x1000000 + (r<<16) + (g<<8) + b).toString(16).slice(1)}`;
  }

  function roundedRectPath(path, x, y, w, h, r1, r2, r3, r4) {
    path.moveTo(x + r1, y);
    path.lineTo(x + w - r2, y);
    path.quadraticCurveTo(x + w, y, x + w, y + r2);
    path.lineTo(x + w, y + h - r3);
    path.quadraticCurveTo(x + w, y + h, x + w - r3, y + h);
    path.lineTo(x + r4, y + h);
    path.quadraticCurveTo(x, y + h, x, y + h - r4);
    path.lineTo(x, y + r1);
    path.quadraticCurveTo(x, y, x + r1, y);
  }

  function drawFolder(ctx, size, opts) {
    const s = size;
    ctx.clearRect(0, 0, s, s);
    ctx.save();
    ctx.scale(s/512, s/512);

    const { bodyColor, tabColor, corner, shadow, strokeColor, strokeWidth, gradient, gradientDarken } = opts;

    // Background checker if needed
    if (!state.transparentBG) {
      ctx.save();
      const cell = 16;
      for (let y=0;y<s;y+=cell) for (let x=0;x<s;x+=cell) {
        const odd = ((x/cell)+(y/cell)) % 2 === 1;
        ctx.fillStyle = odd ? "#e9ecef" : "#f8f9fa";
        ctx.fillRect(x, y, cell, cell);
      }
      ctx.restore();
    }

    // Shadow
    if (shadow > 0) {
      ctx.save();
      ctx.filter = `blur(${shadow*2}px)`;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      const p = new Path2D();
      roundedRectPath(p, 32, 128, 448, 320, corner+6,corner+6,corner+6,corner+6);
      ctx.fill(p);
      ctx.restore();
    }

    // Tab
    const tab = new Path2D();
    roundedRectPath(tab, 72, 96, 184, 72, corner*.8, corner*.8, corner*.3, corner*.3);
    if (gradient) {
      const g = ctx.createLinearGradient(72,96,72,168);
      g.addColorStop(0, tabColor);
      g.addColorStop(1, shadeColor(tabColor, -gradientDarken));
      ctx.fillStyle = g;
    } else ctx.fillStyle = tabColor;
    ctx.fill(tab);

    // Body
    const body = new Path2D();
    roundedRectPath(body, 48,136,416,288, corner,corner,corner,corner);
    if (gradient) {
      const g2 = ctx.createLinearGradient(48,136,48,424);
      g2.addColorStop(0, bodyColor);
      g2.addColorStop(1, shadeColor(bodyColor, -gradientDarken));
      ctx.fillStyle = g2;
    } else ctx.fillStyle = bodyColor;
    ctx.fill(body);

    if (strokeWidth > 0) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;
      ctx.stroke(body);
    }

    ctx.restore();
  }

  function drawOverlay(ctx, size, o) {
    const x = o.x * size;
    const y = o.y * size;
    const base = size * 0.25 * (o.scale || 1);
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(((o.rotation||0) * Math.PI)/180);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";

    if (o.type === "emoji") {
      ctx.font = `${base}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
      ctx.fillText(o.value, 0, 0);
    } else if (o.type === "text") {
      ctx.font = `bold ${base*0.6}px system-ui, Segoe UI, Roboto`;
      ctx.fillStyle = o.color || "#222";
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = base * 0.05;
      ctx.strokeText(o.value, 0, 0);
      ctx.fillText(o.value, 0, 0);
    } else if (o.type === "icon" && o.value) {
      const img = new Image();
      img.src = o.value;
      const sz = base * 1.1;
      if (img.complete) ctx.drawImage(img, -sz/2, -sz/2, sz, sz);
      else img.onload = () => { render(); };
    } else if (o.type === "image" && o.value) {
      const img = new Image();
      img.src = o.value;
      const sz = base * 1.2;
      // Some browsers need onload; we optimistically draw (will redraw next frame if not ready)
      if (img.complete) ctx.drawImage(img, -sz/2, -sz/2, sz, sz);
      else img.onload = () => { render(); };
    }

    if (o.id === state.activeId) {
      ctx.strokeStyle = "#4F46E5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, base * 0.55, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }

  
  // --- Win11-style body with notch helper ---
  function folderBodyPathWithNotch(x, y, w, h, r, notchX, notchDepth){
    const p = new Path2D();
    const right = x + w, bottom = y + h, top = y, left = x;
    p.moveTo(left + r, top);
    p.lineTo(x + notchX - 12, top);
    p.quadraticCurveTo(x + notchX, top + 2, x + notchX + 8, top + notchDepth);
    p.quadraticCurveTo(x + notchX + 22, top + notchDepth + 8, x + notchX + 32, top);
    p.lineTo(right - r, top);
    p.quadraticCurveTo(right, top, right, top + r);
    p.lineTo(right, bottom - r);
    p.quadraticCurveTo(right, bottom, right - r, bottom);
    p.lineTo(left + r, bottom);
    p.quadraticCurveTo(left, bottom, left, bottom - r);
    p.lineTo(left, top + r);
    p.quadraticCurveTo(left, top, left + r, top);
    return p;
  }

  // --- Replacement drawFolder matching Windows 11 style ---
  function drawFolder(ctx, size, opts) {
    const s = size;
    ctx.clearRect(0, 0, s, s);
    ctx.save();
    ctx.scale(s/512, s/512);

    const { bodyColor, tabColor, corner, shadow, strokeColor, strokeWidth, gradient, gradientDarken } = opts;

    // Background checker if needed
    if (!state.transparentBG) {
      ctx.save();
      const cell = 16;
      for (let y=0;y<s;y+=cell) for (let x=0;x<s;x+=cell) {
        const odd = ((x/cell)+(y/cell)) % 2 === 1;
        ctx.fillStyle = odd ? "#e9ecef" : "#f8f9fa";
        ctx.fillRect(x, y, cell, cell);
      }
      ctx.restore();
    }

    // soft shadow
    if (shadow > 0) {
      ctx.save();
      ctx.filter = `blur(${shadow*2}px)`;
      ctx.fillStyle = "rgba(0,0,0,0.20)";
      const p = new Path2D();
      roundedRectPath(p, 40, 156, 360, 280, corner+4,corner+4,corner+4,corner+4);
      ctx.fill(p);
      ctx.restore();
    }

    // Tab behind body
    const tab = new Path2D();
    roundedRectPath(tab, 56, 92, 170, 110, corner, corner*0.6, corner*0.6, corner*0.9);
    if (gradient) {
      const gt = ctx.createLinearGradient(56,92,56,202);
      gt.addColorStop(0, tabColor);
      gt.addColorStop(1, shadeColor(tabColor, -Math.max(0.18, gradientDarken)));
      ctx.fillStyle = gt;
    } else ctx.fillStyle = tabColor;
    ctx.fill(tab);

    // small top gloss on tab
    ctx.save();
    ctx.clip(tab);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 102);
    ctx.lineTo(200, 102);
    ctx.stroke();
    ctx.restore();

    // Body with notch (front panel)
    const notchX = 140;
    const notchDepth = 12;
    const body = folderBodyPathWithNotch(44, 128, 420, 300, corner, notchX, notchDepth);

    if (gradient) {
      const g2 = ctx.createLinearGradient(44,128,44,428);
      g2.addColorStop(0, bodyColor);
      g2.addColorStop(1, shadeColor(bodyColor, -Math.max(0.22, gradientDarken)));
      ctx.fillStyle = g2;
    } else ctx.fillStyle = bodyColor;
    ctx.fill(body);

    // inner lighter panel
    ctx.save();
    ctx.clip(body);
    const inset = new Path2D();
    roundedRectPath(inset, 58, 168, 392, 248, Math.max(8, corner*0.6), Math.max(8, corner*0.6), corner, corner);
    const gp = ctx.createLinearGradient(58,168,58,416);
    gp.addColorStop(0, shadeColor(bodyColor, 0.14));
    gp.addColorStop(1, shadeColor(bodyColor, -0.02));
    ctx.fillStyle = gp;
    ctx.fill(inset);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.stroke(inset);
    ctx.restore();

    if (strokeWidth > 0) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;
      ctx.stroke(body);
    }

    // universal subtle outline & highlight
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.stroke(body);
    ctx.save();
    ctx.clip(body);
    ctx.strokeStyle = "rgba(255,255,255,0.60)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 148);
    ctx.lineTo(380, 148);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
function render() {
    canvas.width = canvas.height = state.canvasSize;
    drawFolder(ctx, state.canvasSize, state);
    state.overlays.forEach(o => drawOverlay(ctx, state.canvasSize, o));
  }

  function exportPNG(px) {
    const tmp = document.createElement("canvas");
    tmp.width = tmp.height = px; const tctx = tmp.getContext("2d");
    if (!state.transparentBG) {
      const cell = Math.max(8, Math.round(px/24));
      for (let y=0;y<px;y+=cell) for (let x=0;x<px;x+=cell) {
        const odd = ((x/cell)+(y/cell)) % 2 === 1;
        tctx.fillStyle = odd ? "#e9ecef" : "#f8f9fa";
        tctx.fillRect(x,y,cell,cell);
      }
    } else tctx.clearRect(0,0,px,px);
    drawFolder(tctx, px, state);
    state.overlays.forEach(o => drawOverlay(tctx, px, o));
    const url = tmp.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `folder-icon-${px}.png`; a.click();
  }

  function dataURLToUint8(dataURL) {
    const base64 = dataURL.split(",")[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i=0; i<len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  function makeICOFromPNGs(pngUint8ArrayList) {
    const count = pngUint8ArrayList.length;
    let offset = 6 + 16*count;
    const totalSize = pngUint8ArrayList.reduce((acc, png) => acc + png.length, offset);
    const buf = new ArrayBuffer(totalSize);
    const view = new DataView(buf);
    let p = 0;
    view.setUint16(p,0,true); p+=2; // reserved
    view.setUint16(p,1,true); p+=2; // type=icon
    view.setUint16(p,count,true); p+=2; // count
    const entries = [];
    for (let i=0;i<count;i++) {
      const png = pngUint8ArrayList[i];
      let w=0,h=0;
      try {
        const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);
        w = dv.getUint32(16,false); h = dv.getUint32(20,false);
      } catch { w=h=256; }
      entries.push({ w, h, size: png.length, png });
      // width
      view.setUint8(p++, w===256?0:w);
      view.setUint8(p++, h===256?0:h);
      view.setUint8(p++, 0); // colors
      view.setUint8(p++, 0); // reserved
      view.setUint16(p,1,true); p+=2; // planes
      view.setUint16(p,32,true); p+=2; // bit count
      view.setUint32(p, png.length, true); p+=4; // size
      view.setUint32(p, 0, true); p+=4; // offset placeholder
    }
    // write image data and offsets
    let dataPtr = 6 + 16*count;
    for (let i=0;i<count;i++) {
      const e = entries[i];
      new Uint8Array(buf, dataPtr, e.size).set(e.png);
      new DataView(buf).setUint32(6 + i*16 + 12, dataPtr, true);
      dataPtr += e.size;
    }
    return new Blob([buf], { type: "image/vnd.microsoft.icon" });
  }
  function exportICO() {
    const sizes = [16,24,32,48,64,128,256];
    const pngs = [];
    for (const s of sizes) {
      const tmp = document.createElement("canvas");
      tmp.width = tmp.height = s;
      const tctx = tmp.getContext("2d");
      tctx.clearRect(0,0,s,s);
      drawFolder(tctx, s, state);
      state.overlays.forEach(o => drawOverlay(tctx, s, o));
      const dataURL = tmp.toDataURL("image/png");
      pngs.push(dataURLToUint8(dataURL));
    }
    const blob = makeICOFromPNGs(pngs);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "folder-icon.ico"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function copyShareLink() {
    const payload = {
      __fis: 1,
      canvasSize: state.canvasSize,
      bodyColor: state.bodyColor,
      tabColor: state.tabColor,
      corner: state.corner,
      shadow: state.shadow,
      strokeWidth: state.strokeWidth,
      strokeColor: state.strokeColor,
      gradient: state.gradient,
      gradientDarken: state.gradientDarken,
      transparentBG: state.transparentBG,
      overlays: state.overlays,
    };
    const encoded = encodeURIComponent(btoa(JSON.stringify(payload)));
    const url = `${location.origin}${location.pathname}#${encoded}`;
    navigator.clipboard.writeText(url).then(() => alert("Odkaz zkopírován do schránky."));
  }

  function drawAll() {
    syncInputsFromState();
    refreshObjects();
    render();
  }

  drawAll();

})();