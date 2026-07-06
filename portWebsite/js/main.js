// ==========================================================================
// SPA 入口
// —— 区块（section）切换：#home / #landing / #work
// —— 装配各功能模块（过渡 / 对话框 / 播放器 / turntable / lightbox / 帧序列）
// —— 由 works 数据表渲染网格与详情页
// —— 检索标签：可调整-速度（帧动画 fps）/ 可调整-素材（帧路径）
// ==========================================================================

import { works } from "./data/works.js";
import "./modules/transition.js";
import "./modules/dialog.js";
import "./modules/player.js";
import "./modules/turntable.js";
import "./modules/lightbox.js";
import { playFrameSequence } from "./modules/frameSequence.js";

// ------------------------------------------------------------------
// 简易 section 切换管理（正式过渡 A/B 后续在 transition.js 接管）
// ------------------------------------------------------------------
const sections = new Map();

// 登记页面上所有 section 节点
function registerSections() {
  document.querySelectorAll(".section").forEach((el) => {
    sections.set(el.id, el);
  });
}

// 切换到指定 section（仅它加 is-active，其余移除）
function showSection(id) {
  const target = sections.get(id);
  if (!target) return;
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
  startHomeSelfie();
  void works; // TODO: 渲染作品网格 / 装配常驻播放器
}

init();
