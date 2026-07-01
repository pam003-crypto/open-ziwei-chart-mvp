const modules = {
  base: {
    title: "基础增强",
    target: "denoise, sharpen portrait details, repair compression artifacts",
    status: "保真增强",
  },
  skin: {
    title: "皮肤精修",
    target: "clean skin, remove blemishes, preserve natural skin texture",
    status: "柔肤处理中",
  },
  face: {
    title: "二次元修容",
    target: "bright eyes, enhance pupil highlights, refine makeup, keep identity",
    status: "角色感增强",
  },
  hair: {
    title: "假发修复",
    target: "smooth wig fibers, remove flyaways, enhance anime hair highlights",
    status: "发丝优化",
  },
  costume: {
    title: "服装道具",
    target: "enhance fabric, lace, metal, leather, prop edges and game-like detail",
    status: "材质增强",
  },
  background: {
    title: "背景优化",
    target: "clean studio backdrop, improve atmosphere, preserve subject edges",
    status: "背景精修",
  },
};

const presets = {
  natural: {
    title: "自然正片",
    look: "natural cosplay portrait retouching, clean editorial finish",
    filter: { brightness: 1.03, contrast: 1.04, saturate: 1.08, sepia: 0 },
  },
  cg: {
    title: "游戏 CG",
    look: "official game key art feeling, glossy highlights, detailed materials",
    filter: { brightness: 1.06, contrast: 1.13, saturate: 1.2, sepia: 0.02 },
  },
  painterly: {
    title: "厚涂海报",
    look: "painterly poster finish, soft skin, rich shadow transitions",
    filter: { brightness: 1.04, contrast: 1.09, saturate: 1.16, sepia: 0.07 },
  },
  figure: {
    title: "手办质感",
    look: "collectible figure texture, crisp edges, cool studio specular light",
    filter: { brightness: 1.08, contrast: 1.16, saturate: 0.98, sepia: 0 },
  },
};

const state = {
  module: "base",
  preset: "natural",
  strength: 52,
  compare: 52,
  view: "compare",
  imageName: "sample",
  masks: new Set(["face", "skin", "hair"]),
};

const beforeImage = document.querySelector("#beforeImage");
const afterImage = document.querySelector("#afterImage");
const compareSlider = document.querySelector("#compareSlider");
const compareHandle = document.querySelector("#compareHandle");
const comparison = document.querySelector("#comparison");
const strengthRange = document.querySelector("#strengthRange");
const strengthValue = document.querySelector("#strengthValue");
const activeModuleTitle = document.querySelector("#activeModuleTitle");
const statusPill = document.querySelector("#statusPill");
const promptPreview = document.querySelector("#promptPreview");
const photoInput = document.querySelector("#photoInput");
const generateButton = document.querySelector("#generateButton");
const exportButton = document.querySelector("#exportButton");

function createSampleImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#2b2525");
  bg.addColorStop(0.42, "#161b19");
  bg.addColorStop(1, "#35242d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(216, 170, 84, 0.12)";
  for (let i = 0; i < 18; i += 1) {
    ctx.fillRect(90 + i * 86, 80, 8, 840);
  }

  const aura = ctx.createRadialGradient(820, 450, 80, 820, 450, 520);
  aura.addColorStop(0, "rgba(54, 199, 161, 0.34)");
  aura.addColorStop(0.5, "rgba(240, 109, 85, 0.16)");
  aura.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = aura;
  ctx.fillRect(250, 0, 1120, 1000);

  ctx.save();
  ctx.translate(800, 536);

  ctx.fillStyle = "#171717";
  ctx.beginPath();
  ctx.ellipse(0, 374, 332, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#211f25";
  ctx.beginPath();
  ctx.moveTo(-236, 340);
  ctx.bezierCurveTo(-210, 130, -146, 40, 0, 40);
  ctx.bezierCurveTo(146, 40, 210, 130, 236, 340);
  ctx.lineTo(-236, 340);
  ctx.fill();

  ctx.fillStyle = "#f4dcc7";
  ctx.beginPath();
  ctx.ellipse(0, -78, 112, 142, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2d2b36";
  ctx.beginPath();
  ctx.ellipse(0, -124, 148, 92, 0, Math.PI, Math.PI * 2);
  ctx.bezierCurveTo(176, -88, 108, 62, 64, 36);
  ctx.bezierCurveTo(20, 14, -20, 14, -64, 36);
  ctx.bezierCurveTo(-108, 62, -176, -88, -148, -124);
  ctx.fill();

  ctx.strokeStyle = "rgba(54, 199, 161, 0.72)";
  ctx.lineWidth = 7;
  for (let i = -5; i <= 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 24, -202);
    ctx.bezierCurveTo(i * 32, -86, i * 24, 22, i * 12, 128);
    ctx.stroke();
  }

  ctx.fillStyle = "#121212";
  ctx.beginPath();
  ctx.moveTo(-118, 76);
  ctx.lineTo(118, 76);
  ctx.lineTo(228, 340);
  ctx.lineTo(-228, 340);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#d8aa54";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-70, 96);
  ctx.lineTo(0, 292);
  ctx.lineTo(70, 96);
  ctx.stroke();

  ctx.fillStyle = "#36c7a1";
  ctx.beginPath();
  ctx.ellipse(-42, -76, 16, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(42, -76, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(240, 109, 85, 0.86)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(204, 80);
  ctx.lineTo(318, -164);
  ctx.lineTo(370, -132);
  ctx.lineTo(252, 130);
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = "rgba(246, 242, 235, 0.88)";
  ctx.font = "700 34px Arial";
  ctx.fillText("CosAI Studio Sample", 56, 906);
  ctx.font = "24px Arial";
  ctx.fillStyle = "rgba(246, 242, 235, 0.58)";
  ctx.fillText("identity-safe cosplay retouch preview", 56, 944);

  return canvas.toDataURL("image/png");
}

function getFilter() {
  const preset = presets[state.preset].filter;
  const ratio = state.strength / 100;
  const brightness = 1 + (preset.brightness - 1) * ratio;
  const contrast = 1 + (preset.contrast - 1) * ratio;
  const saturate = 1 + (preset.saturate - 1) * ratio;
  const sepia = preset.sepia * ratio;
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) sepia(${sepia})`;
}

function updateComparison() {
  const clip = state.view === "before" ? 0 : state.view === "after" ? 100 : state.compare;
  afterImage.style.clipPath = `inset(0 ${100 - clip}% 0 0)`;
  compareHandle.style.left = `${clip}%`;
  compareHandle.style.display = state.view === "compare" ? "block" : "none";
  compareSlider.disabled = state.view !== "compare";
}

function updatePrompt() {
  const module = modules[state.module];
  const preset = presets[state.preset];
  const masks = Array.from(state.masks).join(", ") || "full portrait";
  const identityLock = document.querySelector("#identityLock").checked;
  const costumeLock = document.querySelector("#costumeLock").checked;

  promptPreview.textContent = [
    "preserve original identity, preserve body pose",
    costumeLock ? "preserve costume design and prop structure" : "allow subtle costume material polish",
    identityLock ? "no face swap, no changed face structure" : "soft beauty retouching only",
    module.target,
    preset.look,
    `retouch strength: ${state.strength}%`,
    `active masks: ${masks}`,
    "no extra fingers, no watermark, no text, no overexposure",
  ].join("\n");
}

function render() {
  const module = modules[state.module];
  activeModuleTitle.textContent = module.title;
  statusPill.textContent = module.status;
  strengthValue.textContent = `${state.strength}%`;
  strengthRange.value = state.strength;
  afterImage.style.filter = getFilter();
  updateComparison();
  updatePrompt();
}

function setImageSource(src, name = "uploaded") {
  beforeImage.src = src;
  afterImage.src = src;
  state.imageName = name;
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    setImageSource(reader.result, file.name.replace(/\.[^.]+$/, "") || "cos-photo");
    statusPill.textContent = "已导入照片";
  });
  reader.readAsDataURL(file);
}

document.querySelectorAll(".module-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".module-tab.active")?.classList.remove("active");
    button.classList.add("active");
    state.module = button.dataset.module;
    render();
  });
});

document.querySelectorAll(".preset-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".preset-card.active")?.classList.remove("active");
    button.classList.add("active");
    state.preset = button.dataset.preset;
    render();
  });
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("[data-view].active")?.classList.remove("active");
    button.classList.add("active");
    state.view = button.dataset.view;
    render();
  });
});

document.querySelectorAll("[data-strength]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("[data-strength].active")?.classList.remove("active");
    button.classList.add("active");
    state.strength = Number(button.dataset.strength);
    render();
  });
});

document.querySelectorAll("[data-mask]").forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      state.masks.add(checkbox.dataset.mask);
    } else {
      state.masks.delete(checkbox.dataset.mask);
    }
    render();
  });
});

document.querySelectorAll(".history-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".history-item.active")?.classList.remove("active");
    button.classList.add("active");
    statusPill.textContent = button.dataset.history;
  });
});

strengthRange.addEventListener("input", (event) => {
  state.strength = Number(event.target.value);
  document.querySelector("[data-strength].active")?.classList.remove("active");
  render();
});

compareSlider.addEventListener("input", (event) => {
  state.compare = Number(event.target.value);
  render();
});

photoInput.addEventListener("change", (event) => {
  loadFile(event.target.files?.[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  comparison.addEventListener(eventName, (event) => {
    event.preventDefault();
    comparison.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  comparison.addEventListener(eventName, (event) => {
    event.preventDefault();
    comparison.classList.remove("dragging");
  });
});

comparison.addEventListener("drop", (event) => {
  loadFile(event.dataTransfer.files?.[0]);
});

document.querySelectorAll("#identityLock, #costumeLock").forEach((checkbox) => {
  checkbox.addEventListener("change", render);
});

generateButton.addEventListener("click", () => {
  document.body.classList.add("generating");
  generateButton.disabled = true;
  generateButton.textContent = "生成中...";
  statusPill.textContent = "AI 精修队列";

  window.setTimeout(() => {
    document.body.classList.remove("generating");
    generateButton.disabled = false;
    generateButton.textContent = "生成精修版本";
    statusPill.textContent = `${presets[state.preset].title} 已生成`;
    state.view = "compare";
    compareSlider.value = 52;
    state.compare = 52;
    document.querySelector("[data-view].active")?.classList.remove("active");
    document.querySelector('[data-view="compare"]').classList.add("active");
    render();
  }, 720);
});

exportButton.addEventListener("click", () => {
  const image = new Image();
  image.addEventListener("load", () => {
    const canvas = document.createElement("canvas");
    const maxWidth = 1600;
    const scale = Math.min(1, maxWidth / image.naturalWidth);
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    ctx.filter = getFilter();
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const link = document.createElement("a");
    link.download = `${state.imageName || "cosai"}-${state.preset}-${state.strength}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
  image.src = afterImage.src;
});

setImageSource(createSampleImage());
render();
