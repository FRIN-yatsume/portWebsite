// ==========================================================================
// 页面间过渡模块
// —— 过渡 A（首页 ↔ 进入网页）：本文件已实现（正放 + 倒放）
//    · 除头像外所有首页元素：一边 fade out 一边向上滑动消失（home.css .is-leaving）
//    · 白色手绘边框：不上滑，放大 + fade out（镜头向中间聚焦推进）
//    · 头像 = 锚点：FLIP 直线飞到 landing 左上落位，飞行全程帧序列不停
//    · landing 渐显略慢于首页淡出，交叉重叠更丝滑
// —— 检索标签：可调整-速度（--transition-a-out-dur 淡出 / --transition-a-in-dur 淡入）
// ==========================================================================

// ------------------------------------------------------------------
// 过渡 A 过渡锁时长：读取 --transition-a-dur（= 淡入时长，与最长动画同步）
// ------------------------------------------------------------------
function getTransitionADurationMs() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--transition-a-dur")
    .trim();
  if (raw.endsWith("ms")) return parseFloat(raw);
  if (raw.endsWith("s")) return parseFloat(raw) * 1000;
  return 900;
}

// ------------------------------------------------------------------
// 过渡锁：过渡进行中屏蔽滚轮 / 按键 / 点击的连续触发
// ------------------------------------------------------------------
let transitioning = false;

export function isTransitioning() {
  return transitioning;
}

// ------------------------------------------------------------------
// 工具：强制回流（让 is-snapping 下摆好的姿势先生效，再开始 transition）
// ------------------------------------------------------------------
function forceReflow(el) {
  void el.offsetWidth;
}

// ------------------------------------------------------------------
// 工具：计算首页自拍 → landing 头像落位的 FLIP transform
// （两者同源同比例图片，transform-origin 取左上角 0 0）
// ------------------------------------------------------------------
function computeFlightTransform(selfie, avatar) {
  const from = selfie.getBoundingClientRect();
  const to = avatar.getBoundingClientRect();
  const scale = to.height / from.height;
  const dx = to.left - from.left;
  const dy = to.top - from.top;
  return `translate(${dx}px, ${dy}px) scale(${scale})`;
}

// ------------------------------------------------------------------
// 过渡 A 正放：首页 → 进入网页
// ------------------------------------------------------------------
export function playTransitionA() {
  if (transitioning) return;

  const home = document.getElementById("home");
  const landing = document.getElementById("landing");
  const selfie = home?.querySelector(".home-selfie");
  const avatar = landing?.querySelector(".landing-avatar");
  if (!home || !landing || !selfie || !avatar) return;

  transitioning = true;
  const durMs = getTransitionADurationMs();

  // —— 头像 FLIP：先量落位（landing 尚在 visibility:hidden 但已有布局）——
  const flightTransform = computeFlightTransform(selfie, avatar);

  // —— 退场 + 进场同时开始（交叉重叠）——
  avatar.classList.add("is-hidden");        // 落位头像先藏，由飞行的自拍顶替
  home.classList.add("is-leaving");         // 除头像外：上滑淡出；边框：放大淡出
  landing.classList.add("slow-fade");       // landing 用过渡 A 时长渐显
  landing.classList.add("is-active");

  // —— 头像起飞（帧序列 src 切换不受 transform 影响，飞行中继续播）——
  selfie.classList.add("is-flying");
  selfie.style.transform = flightTransform;

  // —— 过渡结束：落位交接 + 清理状态 ——
  setTimeout(() => {
    avatar.classList.remove("is-hidden");   // 落位头像接管显示
    selfie.classList.add("is-hidden");      // 首页自拍隐藏（元素保留，倒放要用）

    // 首页收尾一律瞬时处理，避免二次动画闪烁
    home.classList.add("is-snapping");
    home.classList.remove("is-active");
    home.classList.remove("is-leaving");
    selfie.classList.remove("is-flying");
    selfie.style.transform = "";
    forceReflow(home);
    home.classList.remove("is-snapping");

    landing.classList.remove("slow-fade");
    transitioning = false;
  }, durMs);
}

// ------------------------------------------------------------------
// 过渡 A 倒放：进入网页 → 首页（true reverse，含位移方向）
// ------------------------------------------------------------------
export function playTransitionAReverse() {
  if (transitioning) return;

  const home = document.getElementById("home");
  const landing = document.getElementById("landing");
  const selfie = home?.querySelector(".home-selfie");
  const avatar = landing?.querySelector(".landing-avatar");
  if (!home || !landing || !selfie || !avatar) return;

  transitioning = true;
  const durMs = getTransitionADurationMs();

  // —— 第一步（瞬时摆姿势）：首页以「离场终点姿势」无动画上台 ——
  // is-snapping 屏蔽全部 transition；is-flying 先挂上让 transform-origin 定在左上角
  home.classList.add("is-snapping", "is-leaving");
  home.classList.add("is-active");
  selfie.classList.add("is-flying");
  // 自拍瞬移到 landing 头像位（飞回的起点），顶替落位头像
  selfie.classList.remove("is-hidden");
  selfie.style.transform = computeFlightTransform(selfie, avatar);
  avatar.classList.add("is-hidden");
  forceReflow(home);
  home.classList.remove("is-snapping");

  // —— 第二步（同帧启动反向动画，交叉重叠）——
  requestAnimationFrame(() => {
    home.classList.remove("is-leaving");    // 元素从上方降回 + 淡入；边框缩回 + 淡入
    selfie.style.transform = "";            // 头像沿直线飞回首页原位
    landing.classList.add("slow-fade");     // landing 用过渡 A 时长淡出
    landing.classList.remove("is-active");

    // —— 过渡结束：清理状态 ——
    setTimeout(() => {
      selfie.classList.remove("is-flying");
      avatar.classList.remove("is-hidden"); // 恢复默认，供下次正放起手
      landing.classList.remove("slow-fade");
      transitioning = false;
    }, durMs);
  });
}
