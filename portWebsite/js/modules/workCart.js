// ==========================================================================
// 购物车侧栏（跨 landing / work，#cart-chrome 常驻层）
// —— 红框1（仅 work）：hoursH + 加购；dock + 列表全站公用
// —— 禁止重复加入；localStorage 持久化
// ==========================================================================

import { works } from "../data/works.js";

const STORAGE_KEY = "portWebsite:workCart";

/** @type {string[]} */
let cartIds = [];

let sheetOpen = false;

const chromeRoot = () => document.getElementById("cart-chrome");
const hoursValueEl = () => document.querySelector(".work-hours-value");
const addBtnEl = () => document.querySelector(".work-cart-add");
const dockEl = () => document.querySelector("#cart-chrome .cart-dock");
const badgeEl = () => document.querySelector("#cart-chrome .cart-badge");
const toggleEl = () => document.querySelector("#cart-chrome .cart-toggle");
const sheetEl = () => document.querySelector("#cart-chrome .cart-sheet");
const listEl = () => document.querySelector("#cart-chrome .cart-list");

// ------------------------------------------------------------------
// 持久化
// ------------------------------------------------------------------
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cartIds = [];
      return;
    }
    const parsed = JSON.parse(raw);
    cartIds = Array.isArray(parsed)
      ? parsed.filter((id) => works.some((w) => w.id === id))
      : [];
  } catch {
    cartIds = [];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cartIds));
}

function getWork(workId) {
  return works.find((w) => w.id === workId) ?? null;
}

function getCurrentWorkId() {
  return document.getElementById("work")?.dataset.currentWorkId ?? null;
}

function activePageId() {
  for (const id of ["home", "landing", "work"]) {
    if (document.getElementById(id)?.classList.contains("is-active")) return id;
  }
  return null;
}

function formatHours(hours) {
  return `${hours}H`;
}

function sumHours() {
  return cartIds.reduce((sum, id) => {
    const work = getWork(id);
    return sum + (work?.hours ?? 0);
  }, 0);
}

// ------------------------------------------------------------------
// 页面可见性（首页隐藏 chrome 层，landing / work 显示）
// ------------------------------------------------------------------
function syncCartChromePage() {
  const root = chromeRoot();
  if (!root) return;

  const page = activePageId();
  root.dataset.page = page === "landing" || page === "work" ? page : "";
  root.classList.toggle("is-page-hidden", page === "home" || !page);
}

function bindCartChromePageObserver() {
  document.querySelectorAll(".section").forEach((section) => {
    const observer = new MutationObserver(syncCartChromePage);
    observer.observe(section, { attributes: true, attributeFilter: ["class"] });
  });
  syncCartChromePage();
}

// ------------------------------------------------------------------
// 公开 API
// ------------------------------------------------------------------
export function isInCart(workId) {
  return cartIds.includes(workId);
}

export function addToCart(workId) {
  if (!workId || isInCart(workId)) return false;
  if (!getWork(workId)) return false;
  cartIds.push(workId);
  saveCart();
  refreshWorkCartUI(workId);
  return true;
}

export function removeFromCart(workId) {
  const idx = cartIds.indexOf(workId);
  if (idx === -1) return false;
  cartIds.splice(idx, 1);
  saveCart();
  refreshWorkCartUI(getCurrentWorkId());
  return true;
}

export function syncHoursBar(work) {
  const valueEl = hoursValueEl();
  const addBtn = addBtnEl();
  if (!valueEl || !addBtn) return;

  const hours = work?.hours ?? 0;
  valueEl.textContent = formatHours(hours);

  addBtn.classList.toggle("is-in-cart", isInCart(work?.id));
  addBtn.disabled = isInCart(work?.id);
}

function renderList() {
  const list = listEl();
  if (!list) return;

  list.replaceChildren();

  if (cartIds.length > 0) {
    const totalRow = document.createElement("li");
    totalRow.className = "ui-side-sheet__total-row";
    totalRow.setAttribute("aria-label", "总用时");
    totalRow.textContent = formatHours(sumHours());
    list.appendChild(totalRow);
  }

  cartIds.forEach((id) => {
    const work = getWork(id);
    if (!work) return;

    const li = document.createElement("li");
    li.className = "ui-side-sheet__item";
    li.dataset.workId = id;

    const body = document.createElement("div");
    body.className = "ui-side-sheet__item-body";

    const title = document.createElement("span");
    title.className = "ui-side-sheet__item-title";
    title.textContent = work.title;

    const hours = document.createElement("span");
    hours.className = "ui-side-sheet__item-hours";
    hours.textContent = formatHours(work.hours ?? 0);

    body.append(title, hours);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "ui-side-sheet__item-remove";
    removeBtn.setAttribute("aria-label", "移除");
    removeBtn.textContent = "\u00D7";

    li.append(body, removeBtn);
    list.appendChild(li);
  });
}

function renderDock() {
  const dock = dockEl();
  const badge = badgeEl();
  if (!dock || !badge) return;

  const count = cartIds.length;

  if (count === 0) {
    dock.classList.add("is-hidden");
    closeSheet();
    return;
  }

  dock.classList.remove("is-hidden");
  badge.textContent = String(count);
}

export function refreshWorkCartUI(workId) {
  renderDock();
  renderList();

  const currentId = workId ?? getCurrentWorkId();
  if (currentId) {
    const work = getWork(currentId);
    if (work) syncHoursBar(work);
  }
}

function openSheet() {
  const sheet = sheetEl();
  if (!sheet || cartIds.length === 0) return;

  renderDock();
  renderList();

  sheetOpen = true;
  sheet.classList.remove("is-hidden");
  sheet.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => sheet.classList.add("is-open"));
}

function closeSheet() {
  const sheet = sheetEl();
  if (!sheet) return;
  sheetOpen = false;
  sheet.classList.remove("is-open");
  sheet.setAttribute("aria-hidden", "true");
  const onEnd = () => {
    if (!sheetOpen) sheet.classList.add("is-hidden");
    sheet.removeEventListener("transitionend", onEnd);
  };
  sheet.addEventListener("transitionend", onEnd);
}

function toggleSheet() {
  if (sheetOpen) closeSheet();
  else openSheet();
}

// ------------------------------------------------------------------
// 事件绑定
// ------------------------------------------------------------------
export function initWorkCart() {
  loadCart();
  bindCartChromePageObserver();

  const addBtn = addBtnEl();
  addBtn?.addEventListener("click", () => {
    const workId = getCurrentWorkId();
    if (workId) addToCart(workId);
  });

  toggleEl()?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSheet();
  });

  listEl()?.addEventListener("click", (e) => {
    if (e.target.closest(".ui-side-sheet__total-row")) return;
    const removeBtn = e.target.closest(".ui-side-sheet__item-remove");
    if (!removeBtn) return;
    const item = removeBtn.closest(".ui-side-sheet__item");
    const workId = item?.dataset.workId;
    if (workId) removeFromCart(workId);
  });

  document.addEventListener("click", (e) => {
    if (!sheetOpen) return;
    const sheet = sheetEl();
    const toggle = toggleEl();
    if (sheet?.contains(e.target) || toggle?.contains(e.target)) return;
    closeSheet();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheetOpen) closeSheet();
  });

  refreshWorkCartUI();
}
