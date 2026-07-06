// ==========================================================================
// 通用帧序列播放器模块
// —— 复用于：首页照片微动循环、NEW!! 缩放动画、过渡中头像继续播 等
// —— 当前实现：<img> src 逐帧切换（帧数少、体积小的场景足够）
// —— fps / 帧数 / 是否循环 由调用方传入
// —— 检索标签：可调整-速度（fps）—— 调用处传参，本文件为通用逻辑
// ==========================================================================

/**
 * 在 <img> 上循环播放一组帧
 * @param {HTMLImageElement} imgEl 目标 img 元素
 * @param {string[]} frames 帧图片路径数组（按顺序）
 * @param {{fps?: number, loop?: boolean}} [opts] fps 帧率 / loop 是否循环
 * @returns {() => void} 停止函数（清除定时器）
 */
export function playFrameSequence(imgEl, frames, opts = {}) {
  // 默认参数（可调整-速度：默认 fps；由调用处覆盖）
  const { fps = 4, loop = true } = opts;

  // —— 无效参数直接返回空停止函数 ——
  if (!imgEl || !Array.isArray(frames) || frames.length === 0) {
    return () => {};
  }

  // —— 单帧无需定时器 ——
  if (frames.length === 1) {
    imgEl.src = frames[0];
    return () => {};
  }

  // —— 预加载所有帧，避免切换时闪烁 ——
  frames.forEach((src) => {
    const pre = new Image();
    pre.src = src;
  });

  // —— 逐帧循环定时器 ——
  let index = 0;
  imgEl.src = frames[0];

  const timer = setInterval(() => {
    index += 1;
    // 到末尾：循环则回到 0，否则停在最后一帧并结束
    if (index >= frames.length) {
      if (!loop) {
        clearInterval(timer);
        return;
      }
      index = 0;
    }
    imgEl.src = frames[index];
  }, 1000 / fps);

  // —— 返回停止函数 ——
  return () => clearInterval(timer);
}
