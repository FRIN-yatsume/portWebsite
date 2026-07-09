// ==========================================================================
// SPA 入口
// —— 区块（section）切换：#home / #landing / #work
// —— 装配各功能模块（过渡 / 对话框 / 播放器 / turntable / lightbox / 帧序列）
// —— 由 works 数据表渲染网格与详情页
// —— 检索标签：可调整-速度（帧动画 fps）/ 可调整-素材（帧路径）
// ==========================================================================

import { works } from "./data/works.js";
import {
  playTransitionA,
  playTransitionAReverse,
  isTransitioning,
} from "./modules/transition.js";
import { initDialog } from "./modules/dialog.js";
import "./modules/player.js";
import "./modules/turntable.js";
import { initLightbox } from "./modules/lightbox.js";
import { bindWorkDescScroll } from "./modules/workDescScroll.js";
import { initWorkCart } from "./modules/workCart.js";
import { playFrameSequence } from "./modules/frameSequence.js";
import { renderWork, pauseWorkVideos } from "./modules/workPage.js";

// ------------------------------------------------------------------
// section 切换管理（home ↔ landing 已由 transition.js 过渡 A 接管，
// 其余组合暂用 base.css 简易交叉淡入淡出；过渡 B 后续接管）
// ------------------------------------------------------------------
const sections = new Map();

// 登记页面上所有 section 节点
function registerSections() {
  document.querySelectorAll(".section").forEach((el) => {
    sections.set(el.id, el);
  });
}

// 当前激活 section 的 id
function activeSectionId() {
  for (const [id, el] of sections) {
    if (el.classList.contains("is-active")) return id;
  }
  return null;
}

// 切换到指定 section
// —— home ↔ landing 这对切换委托给过渡 A（点击/滚轮/键盘三种触发统一走动画）
// —— landing → work 时先渲染作品详情再交叉淡入
// —— 离开 work 时暂停详情页视频
function showSection(id, opts = {}) {
  const target = sections.get(id);
  if (!target || isTransitioning()) return;

  const from = activeSectionId();
  if (from === id) {
    // 作品页内切换「下一个」：同 section 但换作品
    if (id === "work" && opts.workId) {
      renderWork(opts.workId);
    }
    return;
  }

  if (from === "home" && id === "landing") {
    playTransitionA();
    return;
  }
  if (from === "landing" && id === "home") {
    playTransitionAReverse();
    return;
  }

  // 离开作品页时暂停所有 video
  if (from === "work") {
    pauseWorkVideos();
  }
  if (from === "landing") {
    pauseLandingMainVideo();
  }

  // 进入作品页前渲染对应作品
  if (id === "work" && opts.workId) {
    renderWork(opts.workId);
  }

  sections.forEach((el) => el.classList.toggle("is-active", el === target));

  if (id === "landing") {
    resumeLandingMainVideo();
  }
}

// ------------------------------------------------------------------
// 全局入口触发：任何带 data-goto 的元素点击后切换到对应 section
// —— 带 data-work-id 的入口会先渲染对应作品再进入 #work
// ------------------------------------------------------------------
function bindNavigation() {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-goto]");
    if (!trigger) return;

    const goto = trigger.dataset.goto;
    const workId = trigger.dataset.workId;

    if (goto === "work" && workId) {
      showSection("work", { workId });
      return;
    }

    showSection(goto);
  });
}

// ------------------------------------------------------------------
// 首页入口补充触发：键盘 ↓ / 鼠标滚轮下滑 = 点击首页向下箭头
// ------------------------------------------------------------------
function bindHomeScrollEntry() {
  const wheelCooldownMs = 800; // 可调整-速度：滚轮触发冷却，避免惯性滚动连续触发
  let lastWheelAt = 0;

  const isHomeActive = () => sections.get("home")?.classList.contains("is-active");
  const enterLanding = () => showSection("landing");

  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" || !isHomeActive()) return;
    e.preventDefault();
    enterLanding();
  });

  document.addEventListener(
    "wheel",
    (e) => {
      if (e.deltaY <= 0 || !isHomeActive()) return;

      const now = Date.now();
      if (now - lastWheelAt < wheelCooldownMs) return;
      lastWheelAt = now;

      e.preventDefault();
      enterLanding();
    },
    { passive: false }
  );
}

// ------------------------------------------------------------------
// 进入网页返回触发：键盘 ↑ / 鼠标滚轮上滑 = 点击顶部向上箭头
// ------------------------------------------------------------------
function bindLandingScrollBack() {
  const wheelCooldownMs = 800; // 可调整-速度：滚轮触发冷却，避免惯性滚动连续触发
  let lastWheelAt = 0;

  const isLandingActive = () => sections.get("landing")?.classList.contains("is-active");
  const backHome = () => showSection("home");

  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowUp" || !isLandingActive()) return;
    e.preventDefault();
    backHome();
  });

  document.addEventListener(
    "wheel",
    (e) => {
      if (e.deltaY >= 0 || !isLandingActive()) return;

      const now = Date.now();
      if (now - lastWheelAt < wheelCooldownMs) return;
      lastWheelAt = now;

      e.preventDefault();
      backHome();
    },
    { passive: false }
  );
}

// ------------------------------------------------------------------
// 进入网页渲染：由 works 数据表填充 Main 区 + 3D / MS / 2D 缩略图网格
// —— 数据驱动：上新只改 works.js，此处按 category/order 自动摆放
// ------------------------------------------------------------------

// 缩略图取值：优先 thumb 字段，缺省回退第一张编号图片
function workThumbSrc(work) {
  return work.thumb || work.images?.[0] || "";
}

// 主推区视频：优先 mainVideos，缺省回退 videos
function getMainDisplayVideos(work) {
  const main = work.mainVideos?.filter(Boolean);
  if (main?.length) return main;
  return work.videos?.filter(Boolean) ?? [];
}

/** @type {HTMLVideoElement|null} */
let landingMainVideo = null;

function pauseLandingMainVideo() {
  landingMainVideo?.pause();
}

function resumeLandingMainVideo() {
  if (!sections.get("landing")?.classList.contains("is-active")) return;
  landingMainVideo?.play().catch(() => {});
}

// Landing 左侧 Main 大展示：有视频则自动静音循环播放，否则回退首图
function setupLandingMainDisplay(mainWork) {
  const mainBtn = document.querySelector(".landing-main");
  const mainImg = document.querySelector(".landing-main-img");
  if (!mainWork || !mainBtn) return;

  mainBtn.dataset.workId = mainWork.id;

  const videos = getMainDisplayVideos(mainWork);
  if (videos.length) {
    if (!landingMainVideo) {
      landingMainVideo = document.createElement("video");
      landingMainVideo.className = "landing-main-video";
      landingMainVideo.muted = true;
      landingMainVideo.playsInline = true;
      landingMainVideo.loop = true;
      landingMainVideo.autoplay = true;
      mainBtn.appendChild(landingMainVideo);
    }

    landingMainVideo.src = videos[0];
    mainBtn.classList.add("has-video");
    if (mainImg) {
      mainImg.alt = mainWork.title;
    }
    resumeLandingMainVideo();
    return;
  }

  mainBtn.classList.remove("has-video");
  landingMainVideo?.pause();
  if (landingMainVideo) {
    landingMainVideo.removeAttribute("src");
    landingMainVideo.load();
  }
  if (mainImg) {
    mainImg.src = workThumbSrc(mainWork);
    mainImg.alt = mainWork.title;
  }
}

// ------------------------------------------------------------------
// 缩略图 hover 视频轮播 + 项目名叠层 + 暗色背景
// ------------------------------------------------------------------
function bindThumbPreview(btn, work) {
  const videos = work.videos?.filter(Boolean);
  if (!videos?.length) return;

  const video = document.createElement("video");
  video.className = "landing-thumb-preview";
  video.muted = true;
  video.playsInline = true;

  const dim = document.createElement("div");
  dim.className = "landing-thumb-dim";
  dim.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "landing-thumb-label";
  label.textContent = work.projectName;

  btn.appendChild(video);
  btn.appendChild(dim);
  btn.appendChild(label);

  let videoIndex = 0;

  const playCurrent = () => {
    video.src = videos[videoIndex];
    video.currentTime = 0;
    video.play().catch(() => {});
  };

  const onEnded = () => {
    videoIndex = (videoIndex + 1) % videos.length;
    playCurrent();
  };

  btn.addEventListener("mouseenter", () => {
    btn.classList.add("is-previewing");
    videoIndex = 0;
    video.addEventListener("ended", onEnded);
    playCurrent();
  });

  btn.addEventListener("mouseleave", () => {
    btn.classList.remove("is-previewing");
    video.removeEventListener("ended", onEnded);
    video.pause();
    video.removeAttribute("src");
    video.load();
  });
}

// 渲染单个分类网格（仅渲染数据中的真实作品，不补空框）
function renderLandingGrid(category, gridEl) {
  if (!gridEl) return;

  const list = works
    .filter((w) => w.category === category)
    .sort((a, b) => a.order - b.order);

  gridEl.innerHTML = "";

  list.forEach((work) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "landing-thumb";
    btn.dataset.goto = "work";     // TODO: 过渡 B 接管后以被点缩略图为锚点飞入
    btn.dataset.workId = work.id;  // 过渡动画用它定位网格槽位
    const img = document.createElement("img");
    img.src = workThumbSrc(work);
    img.alt = work.title;
    img.addEventListener("load", refreshLandingShelfScroll, { once: true });
    btn.appendChild(img);
    bindThumbPreview(btn, work);
    gridEl.appendChild(btn);
  });
}

// 渲染整个进入网页：三类网格 + Main 主推作品
function renderLanding() {
  renderLandingGrid("3D", document.querySelector(".landing-grid--3d"));
  renderLandingGrid("MS", document.querySelector(".landing-grid--ms"));
  renderLandingGrid("2D", document.querySelector(".landing-grid--2d"));

  // Main 区 = 全站 order 最小的主推作品（视频优先，否则首图）
  const mainWork = [...works].sort((a, b) => a.order - b.order)[0];
  setupLandingMainDisplay(mainWork);

  refreshLandingShelfScroll();
}

// ------------------------------------------------------------------
// 作品棚拖拽滑块：按列表总高度比例计算滑块长度；不足滚动时灰色满轨
// ------------------------------------------------------------------
let landingShelfScrollY = 0;
let landingShelfDrag = null;

// 读取轨道内可用高度（扣除 padding）
function getLandingShelfTrackInner() {
  const track = document.querySelector(".landing-scrollbar");
  if (!track) return { padTop: 0, innerH: 0 };

  const trackStyle = getComputedStyle(track);
  const padTop = parseFloat(trackStyle.paddingTop) || 0;
  const padBottom = parseFloat(trackStyle.paddingBottom) || 0;
  return {
    padTop,
    innerH: Math.max(track.clientHeight - padTop - padBottom, 0),
  };
}

// 作品棚内容高度 vs 视口高度 → 是否可滚动、最大 scrollY
function getLandingShelfScrollMetrics() {
  const viewport = document.querySelector(".landing-shelf-viewport");
  const content = document.querySelector(".landing-shelf-content");
  if (!viewport || !content) {
    return { contentH: 0, viewportH: 0, maxScroll: 0, canScroll: false };
  }

  const viewportH = viewport.clientHeight;
  const contentH = content.offsetHeight;
  const maxScroll = Math.max(0, contentH - viewportH);

  return {
    contentH,
    viewportH,
    maxScroll,
    canScroll: maxScroll > 0,
  };
}

function getLandingShelfScrollMax() {
  return getLandingShelfScrollMetrics().maxScroll;
}

// 滑块高度 = 视口占比 × 轨道高度（内容越长滑块越短）
function calcLandingShelfThumbHeight(viewportH, contentH, trackInnerH) {
  if (contentH <= 0 || trackInnerH <= 0) return trackInnerH;

  const track = document.querySelector(".landing-scrollbar");
  const minPx = parseFloat(getComputedStyle(track || document.documentElement).getPropertyValue("--landing-scrollbar-thumb-min")) || 12;
  const ratio = Math.min(viewportH / contentH, 1);
  return Math.min(trackInnerH, Math.max(ratio * trackInnerH, minPx));
}

// 同步滑块尺寸与位置、棚区 translateY
function refreshLandingShelfScroll() {
  const viewport = document.querySelector(".landing-shelf-viewport");
  const content = document.querySelector(".landing-shelf-content");
  const track = document.querySelector(".landing-scrollbar");
  const thumb = document.querySelector(".scrollbar-thumb");
  if (!viewport || !content || !track || !thumb) return;

  const { contentH, viewportH, maxScroll, canScroll } = getLandingShelfScrollMetrics();
  const { padTop, innerH: trackInnerH } = getLandingShelfTrackInner();

  landingShelfScrollY = Math.min(landingShelfScrollY, maxScroll);

  if (!canScroll) {
    track.classList.add("is-idle");
    landingShelfScrollY = 0;
    content.style.transform = "";
    thumb.style.height = `${trackInnerH}px`;
    thumb.style.top = `${padTop}px`;
    return;
  }

  track.classList.remove("is-idle");

  const thumbH = calcLandingShelfThumbHeight(viewportH, contentH, trackInnerH);
  const maxThumbTop = Math.max(trackInnerH - thumbH, 0);
  const thumbTop = (landingShelfScrollY / maxScroll) * maxThumbTop;

  thumb.style.height = `${thumbH}px`;
  thumb.style.top = `${padTop + thumbTop}px`;
  content.style.transform = `translateY(-${landingShelfScrollY}px)`;
}

function setLandingShelfScroll(y) {
  landingShelfScrollY = Math.max(0, Math.min(y, getLandingShelfScrollMax()));
  refreshLandingShelfScroll();
}

function bindLandingShelfScroll() {
  const viewport = document.querySelector(".landing-shelf-viewport");
  const track = document.querySelector(".landing-scrollbar");
  const thumb = document.querySelector(".scrollbar-thumb");
  if (!viewport || !track || !thumb) return;

  // —— 滑块拖拽 ——
  thumb.addEventListener("pointerdown", (e) => {
    if (track.classList.contains("is-idle")) return;
    e.preventDefault();
    landingShelfDrag = {
      startY: e.clientY,
      startScroll: landingShelfScrollY,
      trackInnerH:
        track.clientHeight -
        (parseFloat(getComputedStyle(track).paddingTop) || 0) -
        (parseFloat(getComputedStyle(track).paddingBottom) || 0),
      thumbH: thumb.offsetHeight,
    };
    thumb.setPointerCapture(e.pointerId);
  });

  thumb.addEventListener("pointermove", (e) => {
    if (!landingShelfDrag) return;
    const maxScroll = getLandingShelfScrollMax();
    const maxThumbTop = landingShelfDrag.trackInnerH - landingShelfDrag.thumbH;
    if (maxThumbTop <= 0 || maxScroll <= 0) return;
    const dy = e.clientY - landingShelfDrag.startY;
    const scrollDelta = (dy / maxThumbTop) * maxScroll;
    setLandingShelfScroll(landingShelfDrag.startScroll + scrollDelta);
  });

  const endDrag = (e) => {
    if (!landingShelfDrag) return;
    landingShelfDrag = null;
    try {
      thumb.releasePointerCapture(e.pointerId);
    } catch {
      /* 已释放则忽略 */
    }
  };
  thumb.addEventListener("pointerup", endDrag);
  thumb.addEventListener("pointercancel", endDrag);

  // —— 棚区滚轮滚动（landing 激活时；顶栏向上滚仍留给返回首页）——
  viewport.addEventListener(
    "wheel",
    (e) => {
      if (!document.getElementById("landing")?.classList.contains("is-active")) return;
      if (track.classList.contains("is-idle")) return;

      const maxScroll = getLandingShelfScrollMax();
      const next = landingShelfScrollY + e.deltaY;

      // 已在顶部且继续上滑 → 不拦截，交给返回首页的滚轮逻辑
      if (next <= 0 && e.deltaY < 0) return;

      e.preventDefault();
      e.stopPropagation();
      setLandingShelfScroll(next);
    },
    { passive: false }
  );

  window.addEventListener("resize", refreshLandingShelfScroll);

  // 作品列表高度变化时重算滑块比例（上新 / 缩略图加载 / 窗口变化）
  const content = document.querySelector(".landing-shelf-content");
  if (content && typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => refreshLandingShelfScroll());
    observer.observe(content);
  }

  refreshLandingShelfScroll();
}

// ------------------------------------------------------------------
// 进入网页头像：与首页自拍同源的帧序列循环微动
// ------------------------------------------------------------------
function startLandingAvatar() {
  const avatar = document.querySelector(".landing-avatar");
  playFrameSequence(
    avatar,
    [
      // 可调整-素材：landing 头像帧序列（与首页自拍同源缩小版）
      "asset/shared/sticker/selfie/1.png",
      "asset/shared/sticker/selfie/2.png",
    ],
    { fps: 2, loop: true } // 可调整-速度：头像微动帧率 fps
  );
}

// ------------------------------------------------------------------
// 首页自拍：爆炸贴纸帧序列循环微动
// ------------------------------------------------------------------
function startHomeSelfie() {
  const selfie = document.querySelector(".home-selfie");
  playFrameSequence(
    selfie,
    [
      // 可调整-素材：自拍帧序列路径（增删帧即可加长动画）
      "asset/shared/sticker/selfie/1.png",
      "asset/shared/sticker/selfie/2.png",
    ],
    { fps: 2, loop: true } // 可调整-速度：自拍微动帧率 fps
  );
}

// ------------------------------------------------------------------
// 初始化入口
// ------------------------------------------------------------------
function init() {
  registerSections();
  bindNavigation();
  bindHomeScrollEntry();
  bindLandingScrollBack();
  startHomeSelfie();
  renderLanding();
  startLandingAvatar();
  bindLandingShelfScroll();
  bindWorkDescScroll();
  initWorkCart();
  initLightbox();
  initDialog();
  document.addEventListener("landing:activate", resumeLandingMainVideo);
  document.addEventListener("landing:deactivate", pauseLandingMainVideo);
  // TODO: 装配常驻播放器
}

init();
