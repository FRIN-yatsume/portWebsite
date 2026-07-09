// ==========================================================================
// 音乐播放器模块（左下角 L 形线框，跨页面常驻彩蛋）
// —— 常驻 <audio>，挂在 #player（section 外），过渡时不卸载、不中断
// —— 默认不自动播；用户点击播放后才开始
// —— 列表循环（LOOP）/ 随机（RND）、上一首/下一首、播放进度拖动、音量符号展开调节
// —— 检索标签：可调整-素材（曲目 tracks.js）/ 可调整-速度（音量默认值）
// ==========================================================================

import { tracks } from "../data/tracks.js";

// ------------------------------------------------------------------
// 本地持久化键名
// ------------------------------------------------------------------
const STORAGE_VOLUME = "anan-player-volume";
const STORAGE_MODE = "anan-player-mode";

// ------------------------------------------------------------------
// 播放器状态
// ------------------------------------------------------------------
/** @type {"list"|"random"} */
let playMode = "list";
let currentIndex = 0;
/** @type {HTMLAudioElement|null} */
let audio = null;

// ------------------------------------------------------------------
// DOM 引用（init 后赋值）
// ------------------------------------------------------------------
/** @type {HTMLElement|null} */
let playerRoot = null;
/** @type {HTMLButtonElement|null} */
let btnPlay = null;
/** @type {HTMLButtonElement|null} */
let btnPrev = null;
/** @type {HTMLButtonElement|null} */
let btnNext = null;
/** @type {HTMLButtonElement|null} */
let btnMode = null;
/** @type {HTMLButtonElement|null} */
let btnVolume = null;
/** @type {HTMLInputElement|null} */
let inputProgress = null;
/** @type {HTMLInputElement|null} */
let inputVolume = null;
/** @type {HTMLElement|null} */
let volumePanel = null;
/** @type {HTMLElement|null} */
let titleEl = null;
/** @type {HTMLElement|null} */
let shellEl = null;
/** 用户拖动进度条时不被 timeupdate 覆盖 */
let isSeeking = false;

// ------------------------------------------------------------------
// 读取持久化的音量 / 模式
// ------------------------------------------------------------------
function loadStoredVolume() {
  const raw = localStorage.getItem(STORAGE_VOLUME);
  const v = raw !== null ? parseFloat(raw) : 0.8;
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.8;
}

function loadStoredMode() {
  const raw = localStorage.getItem(STORAGE_MODE);
  return raw === "random" ? "random" : "list";
}

// ------------------------------------------------------------------
// 更新 UI：播放键符号、模式按钮文案、曲名、disabled 态
// ------------------------------------------------------------------
function updatePlayButton() {
  if (!btnPlay || !audio) return;
  const playing = !audio.paused && !audio.ended;
  btnPlay.textContent = playing ? "\u23F8" : "\u25B6"; // ⏸ / ▶
  btnPlay.setAttribute("aria-label", playing ? "暂停" : "播放");
}

function updateModeButton() {
  if (!btnMode) return;
  btnMode.textContent = playMode === "random" ? "RND" : "LOOP";
  btnMode.setAttribute("aria-label", playMode === "random" ? "随机播放" : "列表循环");
  btnMode.classList.toggle("is-active", true);
}

function updateTrackTitle() {
  if (!titleEl || !shellEl) return;
  const hasTracks = tracks.length > 0;
  shellEl.classList.toggle("is-empty", !hasTracks);

  if (!hasTracks) {
    titleEl.textContent = "NO TRACK";
    return;
  }

  titleEl.textContent = tracks[currentIndex]?.title || "—";
}

function updateVolumeIcon() {
  if (!btnVolume || !audio) return;
  const muted = audio.volume <= 0;
  btnVolume.textContent = muted ? "\u{1F507}" : "\u{1F50A}"; // 🔇 / 🔊
  btnVolume.setAttribute("aria-label", muted ? "音量（静音）" : "音量");
}

function updateProgressBar() {
  if (!inputProgress || !audio || isSeeking) return;
  if (!audio.duration || !Number.isFinite(audio.duration)) {
    inputProgress.value = "0";
    return;
  }
  inputProgress.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
}

function updateControlsDisabled() {
  const disabled = tracks.length === 0;
  btnPlay?.toggleAttribute("disabled", disabled);
  btnPrev?.toggleAttribute("disabled", disabled);
  btnNext?.toggleAttribute("disabled", disabled);
  btnMode?.toggleAttribute("disabled", disabled);
  btnVolume?.toggleAttribute("disabled", disabled);
  inputProgress?.toggleAttribute("disabled", disabled);
  inputVolume?.toggleAttribute("disabled", disabled);
}

function setVolumePanelOpen(open) {
  if (!volumePanel || !btnVolume) return;
  volumePanel.hidden = !open;
  volumePanel.classList.toggle("is-open", open);
  btnVolume.setAttribute("aria-expanded", open ? "true" : "false");
}

// ------------------------------------------------------------------
// 曲目路径编码（文件名含中文、空格时需 encodeURIComponent）
// ------------------------------------------------------------------
function resolveTrackSrc(src) {
  return src
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

// ------------------------------------------------------------------
// 加载并播放指定曲目
// ------------------------------------------------------------------
function loadTrack(index, autoplay = false) {
  if (!audio || tracks.length === 0) return;

  currentIndex = ((index % tracks.length) + tracks.length) % tracks.length;
  const track = tracks[currentIndex];
  audio.src = resolveTrackSrc(track.src);
  updateTrackTitle();
  if (inputProgress) inputProgress.value = "0";

  if (autoplay) {
    audio.play().catch((err) => {
      console.warn("[player] 播放失败:", track.src, err);
    });
  }
}

// ------------------------------------------------------------------
// 上一首 / 下一首
// —— 手动切歌：上一首按列表顺序；下一首遵循 LOOP / RND 模式
// ------------------------------------------------------------------
function playPrevious() {
  if (tracks.length === 0) return;
  loadTrack((currentIndex - 1 + tracks.length) % tracks.length, true);
}

// ------------------------------------------------------------------
// 下一首（手动切歌 / 曲目结束自动切歌）：LIST 顺序循环 / RND 随机
// ------------------------------------------------------------------
function playNext() {
  if (tracks.length === 0) return;

  if (playMode === "random") {
    if (tracks.length === 1) {
      loadTrack(0, true);
      return;
    }
    let next = currentIndex;
    while (next === currentIndex) {
      next = Math.floor(Math.random() * tracks.length);
    }
    loadTrack(next, true);
    return;
  }

  loadTrack((currentIndex + 1) % tracks.length, true);
}

// ------------------------------------------------------------------
// 播放 / 暂停切换
// ------------------------------------------------------------------
function togglePlayPause() {
  if (!audio || tracks.length === 0) return;

  if (!audio.src) {
    loadTrack(0, true);
    return;
  }

  if (audio.paused) {
    audio.play().catch((err) => {
      console.warn("[player] 播放失败:", err);
    });
  } else {
    audio.pause();
  }
}

// ------------------------------------------------------------------
// 音量：0–1 同步 audio.volume 并持久化
// ------------------------------------------------------------------
function setVolume(normalized) {
  if (!audio || !inputVolume) return;
  const v = Math.max(0, Math.min(1, normalized));
  audio.volume = v;
  inputVolume.value = String(Math.round(v * 100));
  localStorage.setItem(STORAGE_VOLUME, String(v));
  updateVolumeIcon();
}

// ------------------------------------------------------------------
// 进度条：拖动 seek 到指定位置
// ------------------------------------------------------------------
function seekToRatio(ratio) {
  if (!audio?.duration || !Number.isFinite(audio.duration)) return;
  audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
  updateProgressBar();
}

// ------------------------------------------------------------------
// 循环模式切换：LIST ↔ RND
// ------------------------------------------------------------------
function toggleMode() {
  playMode = playMode === "list" ? "random" : "list";
  localStorage.setItem(STORAGE_MODE, playMode);
  updateModeButton();
}

// ------------------------------------------------------------------
// 首页隐藏播放器，landing / work 显示（内页彩蛋）
// ------------------------------------------------------------------
function updatePlayerVisibility() {
  if (!playerRoot) return;
  const homeActive = document.getElementById("home")?.classList.contains("is-active");
  playerRoot.classList.toggle("is-hidden", Boolean(homeActive));
}

function bindSectionVisibilityObserver() {
  document.querySelectorAll(".section").forEach((section) => {
    const observer = new MutationObserver(updatePlayerVisibility);
    observer.observe(section, { attributes: true, attributeFilter: ["class"] });
  });
  updatePlayerVisibility();
}

// ------------------------------------------------------------------
// 绑定 UI 与 audio 事件
// ------------------------------------------------------------------
function bindPlayerEvents() {
  btnPlay?.addEventListener("click", togglePlayPause);
  btnPrev?.addEventListener("click", playPrevious);
  btnNext?.addEventListener("click", playNext);
  btnMode?.addEventListener("click", toggleMode);

  btnVolume?.addEventListener("click", (e) => {
    e.stopPropagation();
    setVolumePanelOpen(Boolean(volumePanel?.hidden));
  });

  inputVolume?.addEventListener("input", () => {
    setVolume(Number(inputVolume.value) / 100);
  });

  inputProgress?.addEventListener("pointerdown", () => {
    isSeeking = true;
  });

  inputProgress?.addEventListener("input", () => {
    seekToRatio(Number(inputProgress.value) / 1000);
  });

  inputProgress?.addEventListener("pointerup", () => {
    isSeeking = false;
    updateProgressBar();
  });

  inputProgress?.addEventListener("pointercancel", () => {
    isSeeking = false;
    updateProgressBar();
  });

  audio?.addEventListener("play", updatePlayButton);
  audio?.addEventListener("pause", updatePlayButton);
  audio?.addEventListener("timeupdate", updateProgressBar);
  audio?.addEventListener("loadedmetadata", updateProgressBar);
  audio?.addEventListener("ended", () => {
    updatePlayButton();
    updateProgressBar();
    playNext();
  });

  document.addEventListener("click", (e) => {
    if (!volumePanel || volumePanel.hidden) return;
    const target = e.target;
    if (target instanceof Node && volumePanel.contains(target)) return;
    if (target === btnVolume) return;
    setVolumePanelOpen(false);
  });
}

// ------------------------------------------------------------------
// 初始化：挂载 DOM 引用、创建 audio、恢复持久化状态
// ------------------------------------------------------------------
function initPlayer() {
  playerRoot = document.getElementById("player");
  if (!playerRoot) return;

  audio = playerRoot.querySelector(".player-audio");
  btnPlay = playerRoot.querySelector(".player-btn--play");
  btnPrev = playerRoot.querySelector(".player-btn--prev");
  btnNext = playerRoot.querySelector(".player-btn--next");
  btnMode = playerRoot.querySelector(".player-btn--mode");
  btnVolume = playerRoot.querySelector(".player-btn--volume");
  inputProgress = playerRoot.querySelector(".player-progress");
  inputVolume = playerRoot.querySelector(".player-volume");
  volumePanel = playerRoot.querySelector(".player-volume-panel");
  titleEl = playerRoot.querySelector(".player-track-title");
  shellEl = playerRoot.querySelector(".player-shell");

  if (!audio) return;

  playMode = loadStoredMode();
  setVolume(loadStoredVolume());
  setVolumePanelOpen(false);

  updateModeButton();
  updateTrackTitle();
  updateControlsDisabled();
  updatePlayButton();
  updateVolumeIcon();
  updateProgressBar();

  if (tracks.length > 0) {
    loadTrack(0, false);
  }

  bindPlayerEvents();
  bindSectionVisibilityObserver();
}

initPlayer();
