// ==========================================================================
// 媒体弹出放大模块（说明区视频/图片、主展示图片、turntable 图片）
// —— 左键点击 → 居中放大约 70% + 背景压暗
// —— 点击遮罩空白 / 右键 → 关闭缩回
// —— 图片 lightbox 内滚轮缩放（1x–4x）；放大后左/右键拖动平移
// —— 检索标签：可调整-尺寸（放大比例）/ 可调整-速度（开合时长）
// ==========================================================================

const IMAGE_ZOOM_MIN = 1;
const IMAGE_ZOOM_MAX = 4;
const IMAGE_ZOOM_STEP = 0.12;
const IMAGE_PAN_DRAG_THRESHOLD = 5;

/** @type {HTMLElement|null} */
let lightboxEl = null;
/** @type {HTMLElement|null} */
let stageEl = null;
/** @type {HTMLVideoElement|HTMLImageElement|null} */
let cloneMedia = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let hideTimeout = null;
/** @type {boolean} */
let mediaLightboxBound = false;
/** @type {number} */
let imageZoom = 1;
/** @type {number} */
let imagePanX = 0;
/** @type {number} */
let imagePanY = 0;
/** @type {boolean} */
let suppressContextMenuClose = false;
/** @type {{ pointerId: number, button: number, startX: number, startY: number, panStartX: number, panStartY: number, moved: boolean } | null} */
let dragState = null;

function syncImageZoomClasses() {
  if (!lightboxEl) return;
  const isImage = cloneMedia instanceof HTMLImageElement;
  lightboxEl.classList.toggle("is-image-zoomed", isImage && imageZoom > 1);
}

function resetImageTransform() {
  imageZoom = 1;
  imagePanX = 0;
  imagePanY = 0;
  dragState = null;
  suppressContextMenuClose = false;
  if (lightboxEl) {
    lightboxEl.classList.remove("is-image-zoomed", "is-panning");
  }
  if (cloneMedia instanceof HTMLImageElement) {
    cloneMedia.style.transform = "";
  }
}

function applyImageTransform() {
  if (!(cloneMedia instanceof HTMLImageElement)) return;
  cloneMedia.style.transform = `translate(${imagePanX}px, ${imagePanY}px) scale(${imageZoom})`;
  syncImageZoomClasses();
}

function isPanTarget(target) {
  return Boolean(target?.closest(".lightbox-stage"));
}

function endImagePan(e) {
  if (!dragState || e.pointerId !== dragState.pointerId) return;

  if (dragState.moved && dragState.button === 2) {
    suppressContextMenuClose = true;
  }

  lightboxEl?.releasePointerCapture(e.pointerId);
  lightboxEl?.classList.remove("is-panning");
  dragState = null;
}

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
    if (suppressContextMenuClose) {
      suppressContextMenuClose = false;
      return;
    }
    closeLightbox();
  });
  lightboxEl?.addEventListener(
    "wheel",
    (e) => {
      if (!lightboxEl?.classList.contains("is-open")) return;
      if (!(cloneMedia instanceof HTMLImageElement)) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? IMAGE_ZOOM_STEP : -IMAGE_ZOOM_STEP;
      imageZoom = Math.min(IMAGE_ZOOM_MAX, Math.max(IMAGE_ZOOM_MIN, imageZoom + delta));
      if (imageZoom <= 1) {
        imagePanX = 0;
        imagePanY = 0;
      }
      applyImageTransform();
    },
    { passive: false },
  );
  lightboxEl?.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.button !== 2) return;
    if (!lightboxEl.classList.contains("is-open")) return;
    if (!(cloneMedia instanceof HTMLImageElement)) return;
    if (imageZoom <= 1) return;
    if (!isPanTarget(e.target)) return;

    dragState = {
      pointerId: e.pointerId,
      button: e.button,
      startX: e.clientX,
      startY: e.clientY,
      panStartX: imagePanX,
      panStartY: imagePanY,
      moved: false,
    };
    lightboxEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  lightboxEl?.addEventListener("pointermove", (e) => {
    if (!dragState || e.pointerId !== dragState.pointerId) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (!dragState.moved) {
      if (Math.abs(dx) < IMAGE_PAN_DRAG_THRESHOLD && Math.abs(dy) < IMAGE_PAN_DRAG_THRESHOLD) {
        return;
      }
      dragState.moved = true;
      lightboxEl.classList.add("is-panning");
    }

    imagePanX = dragState.panStartX + dx;
    imagePanY = dragState.panStartY + dy;
    applyImageTransform();
  });
  lightboxEl?.addEventListener("pointerup", (e) => {
    endImagePan(e);
  });
  lightboxEl?.addEventListener("pointercancel", (e) => {
    endImagePan(e);
  });
}

function showLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove("is-hidden");
  lightboxEl.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => lightboxEl.classList.add("is-open"));
}

// ------------------------------------------------------------------
// 打开 lightbox：视频（克隆 src 与播放进度）或图片（克隆 src）
// ------------------------------------------------------------------
export function openLightbox(sourceMedia) {
  ensureLightbox();
  if (!lightboxEl || !stageEl || !sourceMedia?.src) return;

  closeLightbox({ scheduleHide: false });

  if (sourceMedia.tagName === "VIDEO") {
    const video = document.createElement("video");
    video.src = sourceMedia.src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.currentTime = sourceMedia.currentTime || 0;
    stageEl.appendChild(video);
    video.play().catch(() => {});
    cloneMedia = video;
  } else if (sourceMedia.tagName === "IMG") {
    const img = document.createElement("img");
    img.src = sourceMedia.src;
    img.alt = sourceMedia.alt || "";
    stageEl.appendChild(img);
    cloneMedia = img;
    resetImageTransform();
  } else {
    return;
  }

  showLightbox();
}

// ------------------------------------------------------------------
// 关闭 lightbox
// ------------------------------------------------------------------
export function closeLightbox(opts = {}) {
  const { scheduleHide = true } = opts;
  if (!lightboxEl) return;

  lightboxEl.classList.remove("is-open");
  lightboxEl.setAttribute("aria-hidden", "true");

  if (cloneMedia instanceof HTMLVideoElement) {
    cloneMedia.pause();
  }
  resetImageTransform();
  cloneMedia = null;
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
// 从点击目标解析可放大的媒体元素
// ------------------------------------------------------------------
function resolveLightboxMedia(target) {
  const videoFrame = target.closest(".work-desc-video");
  if (videoFrame) {
    return videoFrame.querySelector("video");
  }

  const imageFrame = target.closest(".work-desc-image");
  if (imageFrame) {
    return imageFrame.querySelector("img");
  }

  const mainImg = target.closest(".work-main img.work-main-media");
  if (mainImg) {
    return mainImg;
  }

  const turntableImg = target.closest(".work-turntable img");
  if (turntableImg) {
    return turntableImg;
  }

  return null;
}

// ------------------------------------------------------------------
// 委托绑定：作品页内可点击媒体（一次性绑定 #work）
// ------------------------------------------------------------------
export function bindMediaLightbox(container) {
  ensureLightbox();
  if (!container || mediaLightboxBound) return;

  container.addEventListener("click", (e) => {
    const media = resolveLightboxMedia(e.target);
    if (!media?.src) return;
    e.preventDefault();
    e.stopPropagation();
    openLightbox(media);
  });

  mediaLightboxBound = true;
}

/** @deprecated 使用 bindMediaLightbox */
export function bindVideoLightbox(container) {
  bindMediaLightbox(container);
}

// ------------------------------------------------------------------
// 模块初始化（main.js 入口调用）
// ------------------------------------------------------------------
export function initLightbox() {
  ensureLightbox();
  bindMediaLightbox(document.getElementById("work"));
}
