// ==========================================================================
// 视频弹出放大模块（橙框细节视频，非原生全屏）
// —— 左键点击 .work-desc-video → 居中放大约 70% + 背景压暗
// —— 点击遮罩空白 / 右键 → 关闭缩回
// —— 检索标签：可调整-尺寸（放大比例）/ 可调整-速度（开合时长）
// ==========================================================================

/** @type {HTMLElement|null} */
let lightboxEl = null;
/** @type {HTMLElement|null} */
let stageEl = null;
/** @type {HTMLVideoElement|null} */
let cloneVideo = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let hideTimeout = null;

// ------------------------------------------------------------------
// 初始化 lightbox DOM 引用
// ------------------------------------------------------------------
function ensureLightbox() {
  if (lightboxEl) return;
  lightboxEl = document.getElementById("lightbox");
  stageEl = lightboxEl?.querySelector(".lightbox-stage");
  const backdrop = lightboxEl?.querySelector(".lightbox-backdrop");

  backdrop?.addEventListener("click", () => closeLightbox());
  lightboxEl?.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    closeLightbox();
  });
}

// ------------------------------------------------------------------
// 打开 lightbox：克隆源 video 的 src 与播放进度
// ------------------------------------------------------------------
export function openLightbox(sourceVideo) {
  ensureLightbox();
  if (!lightboxEl || !stageEl || !sourceVideo?.src) return;

  // 预清理：不调度 hideTimeout，避免打开后被延迟定时器关掉
  closeLightbox({ scheduleHide: false });

  cloneVideo = document.createElement("video");
  cloneVideo.src = sourceVideo.src;
  cloneVideo.muted = true;
  cloneVideo.loop = true;
  cloneVideo.playsInline = true;
  cloneVideo.currentTime = sourceVideo.currentTime || 0;
  stageEl.appendChild(cloneVideo);
  cloneVideo.play().catch(() => {});

  lightboxEl.classList.remove("is-hidden");
  lightboxEl.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => lightboxEl.classList.add("is-open"));
}

// ------------------------------------------------------------------
// 关闭 lightbox
// ------------------------------------------------------------------
export function closeLightbox(opts = {}) {
  const { scheduleHide = true } = opts;
  if (!lightboxEl) return;

  lightboxEl.classList.remove("is-open");
  lightboxEl.setAttribute("aria-hidden", "true");

  if (cloneVideo) {
    cloneVideo.pause();
    cloneVideo.remove();
    cloneVideo = null;
  }
  stageEl?.replaceChildren();

  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = null;

  if (!scheduleHide) return;

  hideTimeout = setTimeout(() => {
    lightboxEl?.classList.add("is-hidden");
    hideTimeout = null;
  }, 300);
}

// ------------------------------------------------------------------
// 委托绑定：说明区内 .work-desc-video 左键点击放大
// ------------------------------------------------------------------
export function bindVideoLightbox(container) {
  ensureLightbox();
  if (!container) return;

  container.addEventListener("click", (e) => {
    const frame = e.target.closest(".work-desc-video");
    if (!frame) return;
    const video = frame.querySelector("video");
    if (!video) return;
    e.preventDefault();
    e.stopPropagation();
    openLightbox(video);
  });
}

// ------------------------------------------------------------------
// 模块初始化（main.js 入口调用）
// ------------------------------------------------------------------
export function initLightbox() {
  ensureLightbox();
}
