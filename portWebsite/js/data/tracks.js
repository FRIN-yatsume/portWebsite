// ==========================================================================
// 音乐曲目数据表（★ 加曲只改这里）
// —— 往 asset/shared/audio/ 放入音频后，在此登记路径与标题
// —— 静态站点无法自动扫描文件夹，必须手动维护本表
// —— 支持 mp3 / m4a 等浏览器可播格式
// —— 检索标签：可调整-文字（标题）/ 可调整-素材（音频路径）
// ==========================================================================

/**
 * @typedef {Object} Track
 * @property {string} id    唯一 ID
 * @property {string} title 显示名（可调整-文字）
 * @property {string} src   音频路径（可调整-素材，相对站点根目录）
 */

/** @type {Track[]} */
export const tracks = [
  {
    id: "track_chill",
    title: "Chill",
    src: "asset/shared/audio/Chill.m4a",
  },
  {
    id: "track_wishu",
    title: "巫",
    src: "asset/shared/audio/巫.m4a",
  },
  {
    id: "track_radio",
    title: "Radio in Store",
    src: "asset/shared/audio/Radio in Store.m4a",
  },
];
