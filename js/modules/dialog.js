// ==========================================================================
// RPG 绿色对话框模块（进入网页）
// —— 打字机逐字显示，节奏偏快（单句 ≤ 1s）
// —— 非阻塞：打字过程中不锁浏览者其他操作
// —— 状态机：typing / done / advancing
// —— skip 规则：未打完点击 → 补全当前句；再点一次 → 下一句
// —— 两行合并为一句（按 <br> 分行后两两成组）
// —— 检索标签：可调整-速度（打字速度）/ 可调整-文字（台词）
// ==========================================================================

// ------------------------------------------------------------------
// 对话框参数
// ------------------------------------------------------------------
export const DIALOG = {
  charInterval: 40, // 可调整-速度：每字间隔（ms）上限，实际会按句长压缩到 ≤1s
  maxLineDuration: 1000, // 可调整-速度：单句最长打字时长（ms）
};

// ------------------------------------------------------------------
// 从 HTML 台词区解析分行，两两合并为一句
// ------------------------------------------------------------------
function parseDialogSteps(textEl) {
  const raw = textEl.innerHTML;
  const lines = raw
    .split(/<br\s*\/?>/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const steps = [];
  for (let i = 0; i < lines.length; i += 2) {
    steps.push(lines.slice(i, i + 2));
  }
  return steps;
}

// ------------------------------------------------------------------
// 打字机 + 推进状态机
// ------------------------------------------------------------------
let steps = [];
let stepIndex = 0;
let charIndex = 0;
let state = "idle"; // idle | typing | done
let timerId = null;

let dialogEl = null;
let textEl = null;
let nextEl = null;

function totalChars(stepLines) {
  return stepLines.reduce((sum, line) => sum + line.length, 0);
}

function charIntervalFor(stepLines) {
  const chars = Math.max(totalChars(stepLines), 1);
  return Math.min(DIALOG.charInterval, Math.floor(DIALOG.maxLineDuration / chars));
}

function renderPartial(stepLines, charsShown) {
  let remaining = charsShown;
  const parts = [];

  for (let i = 0; i < stepLines.length; i++) {
    const line = stepLines[i];
    if (remaining <= 0) break;

    const take = Math.min(remaining, line.length);
    parts.push(line.slice(0, take));
    remaining -= take;

    if (take === line.length && i < stepLines.length - 1) {
      parts.push("<br />");
    }
  }

  return parts.join("");
}

function renderFull(stepLines) {
  return stepLines.join("<br />");
}

function setDialogState(next) {
  state = next;
  if (!dialogEl) return;

  dialogEl.classList.toggle("is-typing", state === "typing");
  dialogEl.classList.toggle("is-ready", state === "done");
}

function clearTimer() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function showStep(index, fromStart = true) {
  if (!textEl || index >= steps.length) return;

  const stepLines = steps[index];
  const chars = totalChars(stepLines);

  if (fromStart) {
    charIndex = 0;
    textEl.innerHTML = "";
  }

  setDialogState("typing");

  const tick = () => {
    charIndex += 1;
    textEl.innerHTML = renderPartial(stepLines, charIndex);

    if (charIndex >= chars) {
      timerId = null;
      textEl.innerHTML = renderFull(stepLines);
      setDialogState("done");
      return;
    }

    timerId = setTimeout(tick, charIntervalFor(stepLines));
  };

  clearTimer();
  tick();
}

function completeCurrentStep() {
  if (!textEl || stepIndex >= steps.length) return;

  clearTimer();
  textEl.innerHTML = renderFull(steps[stepIndex]);
  charIndex = totalChars(steps[stepIndex]);
  setDialogState("done");
}

function advanceStep() {
  stepIndex += 1;

  if (stepIndex >= steps.length) {
    setDialogState("done");
    return;
  }

  showStep(stepIndex, true);
}

function onDialogClick() {
  if (!steps.length) return;

  if (state === "typing") {
    completeCurrentStep();
    return;
  }

  if (state === "done") {
    if (stepIndex < steps.length - 1) {
      advanceStep();
    }
  }
}

function startDialog() {
  if (!textEl || !steps.length) return;

  stepIndex = 0;
  charIndex = 0;
  clearTimer();
  showStep(0, true);
}

function resetDialog() {
  stepIndex = 0;
  charIndex = 0;
  clearTimer();
  setDialogState("idle");

  if (textEl) {
    textEl.innerHTML = "";
  }
}

// ------------------------------------------------------------------
// 初始化：解析台词、绑定点击、进入 landing 时自动开播
// ------------------------------------------------------------------
export function initDialog() {
  dialogEl = document.querySelector(".landing-dialog");
  textEl = dialogEl?.querySelector(".dialog-text");
  nextEl = dialogEl?.querySelector(".dialog-next");
  const landing = document.getElementById("landing");

  if (!dialogEl || !textEl || !landing) return;

  steps = parseDialogSteps(textEl);
  textEl.innerHTML = "";

  dialogEl.addEventListener("click", onDialogClick);
  dialogEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onDialogClick();
    }
  });

  const observer = new MutationObserver(() => {
    if (landing.classList.contains("is-active")) {
      startDialog();
    } else {
      resetDialog();
    }
  });

  observer.observe(landing, { attributes: true, attributeFilter: ["class"] });

  if (landing.classList.contains("is-active")) {
    startDialog();
  }
}
