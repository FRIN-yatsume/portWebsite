// ==========================================================================
// 作品详情页渲染模块（进入作品）
// —— 由 works 数据表驱动：标题 / 主展示 / 细节框 / 说明 / 下载链接
// —— 说明区 markdown 支持 {{video:N}} / {{image:N}} / {{code:path}} 混排；图片/视频均可 lightbox 放大
// —— 检索标签：可调整-文字（标题/说明）/ 可调整-素材（图片/视频路径）
// ==========================================================================

import { works } from "../data/works.js";
import { closeLightbox } from "./lightbox.js";
import { refreshWorkDescScroll, resetWorkDescScroll } from "./workDescScroll.js";
import { refreshWorkCartUI, syncHoursBar } from "./workCart.js";
import { pauseBackgroundMusic } from "./player.js";

/** @type {string|null} 当前展示的作品 ID */
let currentWorkId = null;

/** @type {(() => void)|null} 主展示区轮播清理函数 */
let mainCarouselCleanup = null;

/** 当前作品主展示视频是否开声 */
let workMainAudioEnabled = false;

// ------------------------------------------------------------------
// 主展示视频音轨切换
// ------------------------------------------------------------------
function getWorkMainVideo() {
  return document.querySelector("#work .work-main video.work-main-media");
}

function syncAudioToggleUI(on) {
  document.querySelectorAll(".work-desc-audio-toggle").forEach((btn) => {
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function setWorkMainAudioEnabled(on) {
  const video = getWorkMainVideo();
  if (!video) return;

  workMainAudioEnabled = on;
  video.muted = !on;
  if (on) pauseBackgroundMusic();
  syncAudioToggleUI(on);
}

function bindWorkAudioToggle() {
  const descEl = document.querySelector(".work-desc");
  if (!descEl || descEl.dataset.audioToggleBound) return;
  descEl.dataset.audioToggleBound = "1";
  descEl.addEventListener("click", (e) => {
    const toggle = e.target.closest(".work-desc-audio-toggle");
    if (!toggle || !getWorkMainVideo()) return;
    setWorkMainAudioEnabled(!workMainAudioEnabled);
  });
}

bindWorkAudioToggle();

// ------------------------------------------------------------------
// 工具：清空容器子节点
// ------------------------------------------------------------------
function clearEl(el) {
  if (!el) return;
  el.replaceChildren();
}

// ------------------------------------------------------------------
// 工具：在容器内创建静音 video
// ------------------------------------------------------------------
function createMutedVideo(src, className, loop = true) {
  const video = document.createElement("video");
  video.className = className;
  video.src = src;
  video.muted = true;
  video.loop = loop;
  video.playsInline = true;
  video.autoplay = true;
  return video;
}

// ------------------------------------------------------------------
// 工具：在容器内创建 img
// ------------------------------------------------------------------
function createImg(src, className, alt = "") {
  const img = document.createElement("img");
  img.className = className;
  img.src = src;
  img.alt = alt;
  return img;
}

// ------------------------------------------------------------------
// 工具：创建说明区橙框图片（与视频橙框同款）
// ------------------------------------------------------------------
function createDescImageFrame(src, alt = "") {
  const frame = document.createElement("div");
  frame.className = "work-desc-image frame-orange";
  frame.appendChild(createImg(src, "work-desc-image-media", alt));
  return frame;
}

// ------------------------------------------------------------------
// 工具：创建说明区橙框小视频（可点击 lightbox 放大）
// ------------------------------------------------------------------
function createDescVideoFrame(src) {
  const frame = document.createElement("div");
  frame.className = "work-desc-video frame-orange";
  frame.appendChild(createMutedVideo(src, "work-desc-video-media"));
  return frame;
}

// ------------------------------------------------------------------
// 说明区：可折叠代码块（默认收起，点击展开）
// ------------------------------------------------------------------
async function createDescCodeBlock(src, label = "シェーダーコード") {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const code = await res.text();
    if (!code.trim()) return null;

    const details = document.createElement("details");
    details.className = "work-desc-code";

    const summary = document.createElement("summary");
    summary.className = "work-desc-code-summary";
    summary.textContent = label;

    const pre = document.createElement("pre");
    pre.className = "work-desc-code-pre";
    const codeEl = document.createElement("code");
    codeEl.className = "work-desc-code-body";
    codeEl.textContent = code;
    pre.appendChild(codeEl);

    details.appendChild(summary);
    details.appendChild(pre);
    details.addEventListener("toggle", () => refreshWorkDescScroll());

    return details;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// 左大白框轮播素材：优先 mainVideos，缺省回退 videos
// ------------------------------------------------------------------
function getMainVideos(work) {
  const main = work.mainVideos?.filter(Boolean);
  if (main?.length) return main;
  return work.videos?.filter(Boolean) ?? [];
}

// ------------------------------------------------------------------
// 主展示区：多视频时按 ended 轮播，单视频/图片则静态展示
// ------------------------------------------------------------------
function stopMainCarousel() {
  mainCarouselCleanup?.();
  mainCarouselCleanup = null;
}

function setupMainDisplay(container, work) {
  stopMainCarousel();
  clearEl(container);

  const videos = getMainVideos(work);
  if (videos.length > 1) {
    const video = document.createElement("video");
    video.className = "work-main-media";
    video.muted = true;
    video.playsInline = true;

    let index = 0;
    const playCurrent = () => {
      video.src = videos[index];
      video.currentTime = 0;
      video.play().catch(() => {});
    };
    const onEnded = () => {
      index = (index + 1) % videos.length;
      playCurrent();
    };

    video.addEventListener("ended", onEnded);
    container.appendChild(video);
    playCurrent();

    mainCarouselCleanup = () => {
      video.removeEventListener("ended", onEnded);
      video.pause();
    };
    return;
  }

  if (videos.length === 1) {
    container.appendChild(createMutedVideo(videos[0], "work-main-media"));
    return;
  }

  if (work.images?.[0]) {
    container.appendChild(createImg(work.images[0], "work-main-media", work.title));
  }
}

// ------------------------------------------------------------------
// 说明区段落：支持 __下划线__ 内联标记
// ------------------------------------------------------------------
function appendDescParagraphText(p, text) {
  const parts = text.split(/(__[^_]+__)/g);
  for (const part of parts) {
    if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "work-desc-audio-toggle";
      btn.textContent = part.slice(2, -2);
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "動画の音声を切り替え");
      p.appendChild(btn);
    } else if (part) {
      p.appendChild(document.createTextNode(part));
    }
  }
}

// ------------------------------------------------------------------
// 说明区混排渲染：段落 / {{image:N}} / {{video:N}} / {{code:path}}（N 为 1-based）
// @returns {Promise<boolean>} 是否渲染出任何内容块
// ------------------------------------------------------------------
async function renderDescriptionContent(work, container) {
  if (!container) return false;

  const mdPath = work.descriptionMd;
  const videos = work.videos?.filter(Boolean) ?? [];
  const images = work.images?.filter(Boolean) ?? [];

  if (!mdPath) return false;

  try {
    const res = await fetch(mdPath);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    let text = await res.text();

    // 去掉 HTML 注释
    text = text.replace(/<!--[\s\S]*?-->/g, "").trim();
    if (!text) return false;

    const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());
    let rendered = false;

    for (const block of blocks) {
      const trimmed = block.trim();

      // 视频块：{{video:N}}
      const videoMatch = trimmed.match(/^\{\{video:(\d+)\}\}$/);
      if (videoMatch) {
        const idx = parseInt(videoMatch[1], 10) - 1;
        const src = videos[idx];
        if (src) {
          container.appendChild(createDescVideoFrame(src));
          rendered = true;
        }
        continue;
      }

      // 并排图片行：{{row:8,9}}
      const rowMatch = trimmed.match(/^\{\{row:([\d,\s]+)\}\}$/);
      if (rowMatch) {
        const indices = rowMatch[1]
          .split(",")
          .map((s) => parseInt(s.trim(), 10) - 1)
          .filter((idx) => !Number.isNaN(idx) && images[idx]);

        if (indices.length) {
          const row = document.createElement("div");
          row.className = "work-desc-image-row";
          for (const idx of indices) {
            row.appendChild(createDescImageFrame(images[idx], work.title));
          }
          container.appendChild(row);
          rendered = true;
        }
        continue;
      }

      // 图片块：{{image:N}}
      const imageMatch = trimmed.match(/^\{\{image:(\d+)\}\}$/);
      if (imageMatch) {
        const idx = parseInt(imageMatch[1], 10) - 1;
        const src = images[idx];
        if (src) {
          container.appendChild(createDescImageFrame(src, work.title));
          rendered = true;
        }
        continue;
      }

      // 代码块：{{code:路径}} 或 {{code:路径|展开标签}}
      const codeMatch = trimmed.match(/^\{\{code:([^|}]+)(?:\|([^}]+))?\}\}$/);
      if (codeMatch) {
        const src = codeMatch[1].trim();
        const label = codeMatch[2]?.trim() || "コードを見る";
        const codeBlock = await createDescCodeBlock(src, label);
        if (codeBlock) {
          container.appendChild(codeBlock);
          rendered = true;
        }
        continue;
      }

      // 普通段落
      const p = document.createElement("p");
      p.className = "work-desc-p";
      appendDescParagraphText(p, trimmed);
      container.appendChild(p);
      rendered = true;
    }

    return rendered;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------
// 按 order 取下一个作品
// ------------------------------------------------------------------
function getNextWork(work) {
  const sorted = [...works].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((w) => w.id === work.id);
  if (idx < 0 || idx >= sorted.length - 1) return null;
  return sorted[idx + 1];
}

// ------------------------------------------------------------------
// 暂停作品页内所有 video
// ------------------------------------------------------------------
export function pauseWorkVideos() {
  stopMainCarousel();
  closeLightbox();
  workMainAudioEnabled = false;
  syncAudioToggleUI(false);
  document.querySelectorAll("#work video").forEach((v) => {
    v.pause();
    v.currentTime = 0;
    v.muted = true;
  });
}

// ------------------------------------------------------------------
// 渲染作品详情页
// ------------------------------------------------------------------
export async function renderWork(workId) {
  const work = works.find((w) => w.id === workId);
  if (!work) return;

  currentWorkId = workId;
  document.getElementById("work")?.setAttribute("data-current-work-id", workId);
  pauseWorkVideos();

  const titleEl = document.querySelector(".work-title");
  const mainEl = document.querySelector(".work-main");
  const detailEl = document.querySelector(".work-detail");
  const turntableEl = document.querySelector(".work-turntable");
  const descEl = document.querySelector(".work-desc");
  const descViewport = document.querySelector(".work-desc-viewport");
  const descScrollbar = document.querySelector(".work-scrollbar");
  const downloadEl = document.querySelector(".work-download");
  const nextBtn = document.querySelector(".work-next");

  // —— 标题 ——
  if (titleEl) titleEl.textContent = work.title;

  const videos = work.videos?.filter(Boolean) ?? [];
  const hasTurntable = Boolean(work.turntable?.length);
  const videosInDesc = videos.length > 0 && !hasTurntable;

  // —— 左大白框：多视频轮播 / 单视频 / 图片 ——
  setupMainDisplay(mainEl, work);

  // —— 右上橙框：有 turntable 时播 videos[1]，否则视频改放说明区 ——
  clearEl(detailEl);
  if (!videosInDesc && work.videos?.[1]) {
    detailEl?.classList.remove("is-hidden");
    detailEl?.appendChild(createMutedVideo(work.videos[1], "work-detail-media"));
  } else {
    detailEl?.classList.add("is-hidden");
  }

  // —— 右下橙框：turntable 帧序列 ——
  clearEl(turntableEl);
  if (hasTurntable) {
    turntableEl?.classList.remove("is-hidden");
    const img = createImg(work.turntable[0], "work-turntable-media", work.title);
    turntableEl?.appendChild(img);
    // turntable.js 后续接管帧序列拖拽
  } else {
    turntableEl?.classList.add("is-hidden");
  }

  // —— 说明区：md 混排（文字 / {{image:N}} / {{video:N}}）——
  clearEl(descEl);
  resetWorkDescScroll();
  if (work.descriptionMd) {
    const hasContent = await renderDescriptionContent(work, descEl);
    if (hasContent) {
      descEl?.classList.remove("is-hidden");
      descViewport?.classList.remove("is-hidden");
      descScrollbar?.classList.remove("is-hidden");
      refreshWorkDescScroll();
    } else {
      descEl?.classList.add("is-hidden");
      descViewport?.classList.add("is-hidden");
      descScrollbar?.classList.add("is-hidden");
    }
  } else {
    descEl?.classList.add("is-hidden");
    descViewport?.classList.add("is-hidden");
    descScrollbar?.classList.add("is-hidden");
  }

  // —— 下载链接 ——
  if (downloadEl) {
    if (work.downloadUrl) {
      downloadEl.href = work.downloadUrl;
      downloadEl.classList.remove("is-hidden");
    } else {
      downloadEl.classList.add("is-hidden");
    }
  }

  // —— 下一个作品按钮 ——
  const nextWork = getNextWork(work);
  if (nextBtn) {
    if (nextWork) {
      nextBtn.classList.remove("is-hidden");
      nextBtn.dataset.workId = nextWork.id;
      nextBtn.textContent = `↓ ${nextWork.title}`;
    } else {
      nextBtn.classList.add("is-hidden");
      delete nextBtn.dataset.workId;
    }
  }

  syncHoursBar(work);
  refreshWorkCartUI(work.id);
}

// ------------------------------------------------------------------
// 获取当前作品 ID（导航层读取）
// ------------------------------------------------------------------
export function getCurrentWorkId() {
  return currentWorkId;
}
