// ==========================================================================
// 作品页说明区拖拽滑块（与 landing 作品棚滚动同款逻辑）
// —— 自定义圆角轨道 + 白色 thumb；内容 translateY 滚动
// —— 检索标签：可调整-速度（滚轮冷却）/ 可调整-尺寸（滑块比例）
// ==========================================================================

let workDescScrollY = 0;
let workDescDrag = null;

function getWorkDescViewport() {
  return document.querySelector("#work .work-desc-viewport");
}

function getWorkDescContent() {
  return document.querySelector("#work .work-desc");
}

function getWorkDescTrack() {
  return document.querySelector("#work .work-scrollbar");
}

function getWorkDescThumb() {
  return document.querySelector("#work .work-scrollbar-thumb");
}

// 读取轨道内可用高度（扣除 padding）
function getWorkDescTrackInner() {
  const track = getWorkDescTrack();
  if (!track) return { padTop: 0, innerH: 0 };

  const trackStyle = getComputedStyle(track);
  const padTop = parseFloat(trackStyle.paddingTop) || 0;
  const padBottom = parseFloat(trackStyle.paddingBottom) || 0;
  return {
    padTop,
    innerH: Math.max(track.clientHeight - padTop - padBottom, 0),
  };
}

// 说明区内容高度 vs 视口高度
function getWorkDescScrollMetrics() {
  const viewport = getWorkDescViewport();
  const content = getWorkDescContent();
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

function getWorkDescScrollMax() {
  return getWorkDescScrollMetrics().maxScroll;
}

// 滑块高度 = 视口占比 × 轨道高度
function calcWorkDescThumbHeight(viewportH, contentH, trackInnerH) {
  if (contentH <= 0 || trackInnerH <= 0) return trackInnerH;

  const track = getWorkDescTrack();
  const minPx =
    parseFloat(
      getComputedStyle(track || document.documentElement).getPropertyValue(
        "--work-scrollbar-thumb-min"
      )
    ) || 12;
  const ratio = Math.min(viewportH / contentH, 1);
  return Math.min(trackInnerH, Math.max(ratio * trackInnerH, minPx));
}

// 同步滑块尺寸与位置、说明区 translateY
export function refreshWorkDescScroll() {
  const viewport = getWorkDescViewport();
  const content = getWorkDescContent();
  const track = getWorkDescTrack();
  const thumb = getWorkDescThumb();
  if (!viewport || !content || !track || !thumb) return;

  const { contentH, viewportH, maxScroll, canScroll } = getWorkDescScrollMetrics();
  const { padTop, innerH: trackInnerH } = getWorkDescTrackInner();

  workDescScrollY = Math.min(workDescScrollY, maxScroll);

  if (!canScroll) {
    track.classList.add("is-idle");
    workDescScrollY = 0;
    content.style.transform = "";
    thumb.style.height = `${trackInnerH}px`;
    thumb.style.top = `${padTop}px`;
    return;
  }

  track.classList.remove("is-idle");

  const thumbH = calcWorkDescThumbHeight(viewportH, contentH, trackInnerH);
  const maxThumbTop = Math.max(trackInnerH - thumbH, 0);
  const thumbTop = (workDescScrollY / maxScroll) * maxThumbTop;

  thumb.style.height = `${thumbH}px`;
  thumb.style.top = `${padTop + thumbTop}px`;
  content.style.transform = `translateY(-${workDescScrollY}px)`;
}

function setWorkDescScroll(y) {
  workDescScrollY = Math.max(0, Math.min(y, getWorkDescScrollMax()));
  refreshWorkDescScroll();
}

// 绑定拖拽滑块 + 滚轮（仅 work 页激活时）
export function bindWorkDescScroll() {
  const viewport = getWorkDescViewport();
  const track = getWorkDescTrack();
  const thumb = getWorkDescThumb();
  const content = getWorkDescContent();
  if (!viewport || !track || !thumb) return;

  thumb.addEventListener("pointerdown", (e) => {
    if (track.classList.contains("is-idle")) return;
    e.preventDefault();
    workDescDrag = {
      startY: e.clientY,
      startScroll: workDescScrollY,
      trackInnerH:
        track.clientHeight -
        (parseFloat(getComputedStyle(track).paddingTop) || 0) -
        (parseFloat(getComputedStyle(track).paddingBottom) || 0),
      thumbH: thumb.offsetHeight,
    };
    thumb.setPointerCapture(e.pointerId);
  });

  thumb.addEventListener("pointermove", (e) => {
    if (!workDescDrag) return;
    const maxScroll = getWorkDescScrollMax();
    const maxThumbTop = workDescDrag.trackInnerH - workDescDrag.thumbH;
    if (maxThumbTop <= 0 || maxScroll <= 0) return;
    const dy = e.clientY - workDescDrag.startY;
    const scrollDelta = (dy / maxThumbTop) * maxScroll;
    setWorkDescScroll(workDescDrag.startScroll + scrollDelta);
  });

  const endDrag = (e) => {
    if (!workDescDrag) return;
    workDescDrag = null;
    try {
      thumb.releasePointerCapture(e.pointerId);
    } catch {
      /* 已释放则忽略 */
    }
  };
  thumb.addEventListener("pointerup", endDrag);
  thumb.addEventListener("pointercancel", endDrag);

  viewport.addEventListener(
    "wheel",
    (e) => {
      if (!document.getElementById("work")?.classList.contains("is-active")) return;
      if (track.classList.contains("is-idle")) return;

      e.preventDefault();
      e.stopPropagation();
      setWorkDescScroll(workDescScrollY + e.deltaY);
    },
    { passive: false }
  );

  window.addEventListener("resize", refreshWorkDescScroll);

  if (content && typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => refreshWorkDescScroll());
    observer.observe(content);
  }

  refreshWorkDescScroll();
}

// 切换作品时重置滚动位置
export function resetWorkDescScroll() {
  workDescScrollY = 0;
  refreshWorkDescScroll();
}
