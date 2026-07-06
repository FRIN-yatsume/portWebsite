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
import "./modules/dialog.js";
import "./modules/player.js";
import "./modules/turntable.js";
import "./modules/lightbox.js";
import { playFrameSequence } from "./modules/frameSequence.js";

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
// —— 其余组合暂用 base.css 的简易交叉淡入淡出
function showSection(id) {
  const target = sections.get(id);
  if (!target || isTransitioning()) return;

  const from = activeSectionId();
  if (from === id) return;

  if (from === "home" && id === "landing") {
    playTransitionA();
    return;
  }
  if (from === "landing" && id === "home") {
    playTransitionAReverse();
    return;
  }

  sections.forEach((el) => el.classList.toggle("is-active", el === target));
}

// ------------------------------------------------------------------
// 全局入口触发：任何带 data-goto 的元素点击后切换到对应 section
// ------------------------------------------------------------------
function bindNavigation() {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-goto]");
    if (!trigger) return;
    showSection(trigger.dataset.goto);
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
// 进入网页渲染：由 works 数据表填充 Main 区 + 3D/2D 缩略图网格
// —— 数据驱动：上新只改 works.js，此处按 category/order 自动摆放
// ------------------------------------------------------------------
const GRID_MIN_SLOTS = 3; // 可调整-尺寸：每类网格至少显示的橙框数（视觉基准一排三个）

// 缩略图取值：优先 thumb 字段，缺省回退第一张编号图片
function workThumbSrc(work) {
  return work.thumb || work.images?.[0] || "";
}

// 渲染单个分类网格（作品缩略图 + 不足基准格数时空橙框补齐）
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
    btn.appendChild(img);
    gridEl.appendChild(btn);
  });

  // 空位橙框（纯视觉占位，不可点；格数不写死，只补到视觉基准）
  for (let i = list.length; i < GRID_MIN_SLOTS; i += 1) {
    const empty = document.createElement("div");
    empty.className = "landing-thumb is-empty";
    gridEl.appendChild(empty);
  }
}

// 渲染整个进入网页：两类网格 + Main 主推作品
function renderLanding() {
  renderLandingGrid("3D", document.querySelector(".landing-grid--3d"));
  renderLandingGrid("2D", document.querySelector(".landing-grid--2d"));

  // Main 区 = 全站 order 最小的主推作品首图
  const mainWork = [...works].sort((a, b) => a.order - b.order)[0];
  const mainImg = document.querySelector(".landing-main-img");
  if (mainWork && mainImg) {
    mainImg.src = workThumbSrc(mainWork);
    mainImg.alt = mainWork.title;
  }
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
  // TODO: 装配常驻播放器
}

init();
