// ==========================================================================
// 作品详情页渲染模块（进入作品）
// —— 由 works 数据表驱动：标题 / 主展示 / 细节框 / 说明 / 下载链接
// —— 说明区 markdown 支持 {{video:N}} 混排文字/图片/视频
// —— 检索标签：可调整-文字（标题/说明）/ 可调整-素材（图片/视频路径）
// ==========================================================================

import { works } from "../data/works.js";
import { bindVideoLightbox, closeLightbox } from "./lightbox.js";
import { refreshWorkDescScroll, resetWorkDescScroll } from "./workDescScroll.js";

/** @type {string|null} 当前展示的作品 ID */
let currentWorkId = null;

/** @type {(() => void)|null} 主展示区轮播清理函数 */
let mainCarouselCleanup = null;

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
// 工具：创建说明区橙框小视频（可点击 lightbox 放大）
// ------------------------------------------------------------------
function createDescVideoFrame(src) {
  const frame = document.createElement("div");
  frame.className = "work-desc-video frame-orange";
  frame.appendChild(createMutedVideo(src, "work-desc-video-media"));
  return frame;
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
// 说明区混排渲染：段落 / 图片 / {{video:N}}（N 为 1-based）
// @returns {Promise<boolean>} 是否渲染出任何内容块
// ------------------------------------------------------------------
async function renderDescriptionContent(work, container) {
  if (!container) return false;

  const mdPath = work.descriptionMd;
  const videos = work.videos?.filter(Boolean) ?? [];

  if (!mdPath) return false;

  try {
    const res = await fetch(mdPath);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    let text = await res.text();

    // 去掉 HTML 注释
    text = text.replace(/<!--[\s\S]*?-->/g, "").trim();
    if (!text) return false;

    const mdDir = mdPath.replace(/\/[^/]+$/, "/");
    const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());
    let rendered = false;

    blocks.forEach((block) => {
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
        return;
      }

      // 图片块：![alt](path)
      const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const [, alt, relPath] = imgMatch;
        const src = relPath.startsWith("asset/") ? relPath : mdDir + relPath;
        container.appendChild(createImg(src, "work-desc-img", alt));
        rendered = true;
        return;
      }

      // 普通段落
      const p = document.createElement("p");
      p.className = "work-desc-p";
      p.textContent = trimmed;
      container.appendChild(p);
      rendered = true;
    });

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
  document.querySelectorAll("#work video").forEach((v) => {
    v.pause();
    v.currentTime = 0;
  });
}

// ------------------------------------------------------------------
// 渲染作品详情页
// ------------------------------------------------------------------
export async function renderWork(workId) {
  const work = works.find((w) => w.id === workId);
  if (!work) return;

  currentWorkId = workId;
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

  // —— 说明区：md 混排（文字 / 图片 / {{video:N}}）——
  clearEl(descEl);
  resetWorkDescScroll();
  if (work.descriptionMd) {
    const hasContent = await renderDescriptionContent(work, descEl);
    if (hasContent) {
      descEl?.classList.remove("is-hidden");
      descViewport?.classList.remove("is-hidden");
      descScrollbar?.classList.remove("is-hidden");
      bindVideoLightbox(descEl);
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
      nextBtn.textContent = `下一个：${nextWork.title}`;
    } else {
      nextBtn.classList.add("is-hidden");
      delete nextBtn.dataset.workId;
    }
  }
}

// ------------------------------------------------------------------
// 获取当前作品 ID（导航层读取）
// ------------------------------------------------------------------
export function getCurrentWorkId() {
  return currentWorkId;
}
