// ==========================================================================
// 作品数据表（★ 上新只改这里）
// —— 全站作品内容数据驱动：网格 + 详情页由这份表渲染生成
// —— 新增作品 = 往数组加一条记录，不改页面结构、不新建 HTML
// —— schema 字段可增不可少；缺失字段要在渲染层优雅降级
// —— 检索标签：可调整-文字（标题/说明）/ 可调整-素材（图片/视频/帧路径）
// ==========================================================================

/**
 * @typedef {Object} Work
 * @property {string}   id            唯一 ID（过渡动画用它定位网格槽位）
 * @property {string}   projectName   项目名（驼峰截断），用于拼素材文件名
 * @property {"3D"|"2D"} category     决定进哪个网格区
 * @property {number}   order         我安排的顺序（全站一条线），底部「下一个」按此递增
 * @property {string}   title         作品页左上标题
 * @property {string}   [thumb]       缩略图（默认取 Image_(项目名)1.png，可覆盖）
 * @property {string[]} images        编号图片，1 = 主展示
 * @property {string[]} [videos]      编号视频，1 = 主展示（左大白框），2 = 细节（右上橙框）
 * @property {string[]} [turntable]   右下橙框 模型旋转帧序列
 * @property {string}   [descriptionMd] 说明文章（markdown 路径）
 * @property {string}   [downloadUrl] 模型下载链接（无则隐藏链接）
 */

/** @type {Work[]} */
export const works = [
  // ------------------------------------------------------------------
  // 占位样例作品（Sample）—— 复制此对象即可上新一个作品
  // ------------------------------------------------------------------
  {
    id: "work_sample",              // 唯一 ID（可调整-文字）
    projectName: "Sample",          // 项目名（可调整-文字）
    category: "3D",                 // 可调整-文字："3D" | "2D"
    order: 1,                       // 可调整-位置：全站展示顺序（下一个按此递增）
    title: "· (作品名)",             // 可调整-文字：作品页左上标题
    images: [
      // 可调整-素材：编号图片，[0] = 主展示 / 缩略图
      "asset/works/Sample/Image_Sample1.png",
      "asset/works/Sample/Image_Sample2.png",
    ],
    videos: [],                     // 可调整-素材：编号视频（1 主展示 / 2 细节）
    turntable: [],                  // 可调整-素材：模型旋转帧序列
    descriptionMd: "asset/works/Sample/Sample.md", // 可调整-素材：说明文章
    downloadUrl: "",                // 可调整-文字：模型下载链接（空则隐藏）
  },
];
