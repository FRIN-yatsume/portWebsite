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
 * @property {"3D"|"CODE"|"2D"|"INDIE"} category  决定进哪个网格区（CODE = コーディングしたもの，INDIE = 協力したインディーゲーム）
 * @property {number}   order         按货架浏览顺序（全站一条线），底部 ↓ 下一作品按此递增
 * @property {string}   title         作品页左上标题
 * @property {string}   [thumb]       缩略图（默认取 Image_(项目名)1.png，可覆盖）
 * @property {string[]} images        编号图片；说明区 {{image:N}}；[0] = 封面/缩略图
 * @property {string[]} [videos]      编号视频；说明区 {{video:N}} + 书架 hover 轮播
 * @property {string[]} [mainVideos] 左大白框轮播（独立配置；缺省回退 videos）
 * @property {string[]} [turntable]   右下橙框 模型旋转帧序列
 * @property {string}   [descriptionMd] 说明文章（markdown 路径；支持 {{video:N}} / {{image:N}} 混排）
 * @property {string}   [downloadUrl] 模型下载链接（无则隐藏链接）
 * @property {number}   hours         制作用时（小时，展示为 48H）
 */

/** @type {Work[]} */
export const works = [
  // ------------------------------------------------------------------
  // Main —— 主推作品（Landing 左侧大展示位）
  // ------------------------------------------------------------------
  {
    id: "work_main",
    projectName: "your trip",
    category: "3D",
    order: 1,
    title: "· your trip",
    thumb: "asset/works/1MAIN/main_1image.JPG",
    images: [
      "asset/works/1MAIN/main_1image.JPG",
      "asset/works/1MAIN/main_2image.JPG",
      "asset/works/1MAIN/main_3image.JPG",
      "asset/works/1MAIN/main_4image.JPG",
      "asset/works/1MAIN/main_5image.JPG",
      "asset/works/1MAIN/main_6image.JPG",
      "asset/works/1MAIN/main_7image.png",
      "asset/works/1MAIN/main_8image.JPG",
    ],
    videos: [
      "asset/works/1MAIN/main_1videp.mp4",
    ],
    mainVideos: [
      "asset/works/1MAIN/main_1videp.mp4",
    ],
    turntable: [],
    descriptionMd: "asset/works/1MAIN/main.md",
    downloadUrl: "",
    hours: 300,
  },
  // ------------------------------------------------------------------
  // School —— Back Room Maze（3D 作品）
  // ------------------------------------------------------------------
  {
    id: "work_school",
    projectName: "school",
    category: "3D",
    order: 2,
    title: "· Back Room Maze",
    thumb: "asset/works/school/school_1image.png",
    images: ["asset/works/school/school_1image.png"],
    videos: [
      "asset/works/school/school_1video.mp4",
      "asset/works/school/school_2video.mp4",
      "asset/works/school/school_3video.mp4",
      "asset/works/school/school_4video.mp4",
    ],
    mainVideos: [
      // 可调整-素材：左大白框轮播（仅 1–3；与 videos / 说明区可分开配置）
      "asset/works/school/school_1video.mp4",
      "asset/works/school/school_2video.mp4",
      "asset/works/school/school_3video.mp4",
    ],
    turntable: [],
    descriptionMd: "asset/works/school/school.md",
    downloadUrl: "",
    hours: 48,
  },
  // ------------------------------------------------------------------
  // 2D Concept Art
  // ------------------------------------------------------------------
  {
    id: "work_2d_concept_art",
    projectName: "2DConceptArt",
    category: "2D",
    order: 6,
    title: "· (作品名)",
    thumb: "asset/works/2D/2DConceptArt/concept_1image.jpg",
    images: [
      "asset/works/2D/2DConceptArt/concept_1image.jpg",
      "asset/works/2D/2DConceptArt/concept_2image.png",
      "asset/works/2D/2DConceptArt/concept_3image.png",
      "asset/works/2D/2DConceptArt/concept_4image.png",
      "asset/works/2D/2DConceptArt/concept_5image.png",
      "asset/works/2D/2DConceptArt/concept_7image.png",
      "asset/works/2D/2DConceptArt/concept_8image .jpg",
      "asset/works/2D/2DConceptArt/concept_9image.jpg",
      "asset/works/2D/2DConceptArt/concept_10image.png",
    ],
    videos: [],
    turntable: [],
    descriptionMd: "asset/works/2D/2DConceptArt/2DConceptArt.md",
    downloadUrl: "",
    hours: 24,
  },
  // ------------------------------------------------------------------
  // 2D Character Design
  // ------------------------------------------------------------------
  {
    id: "work_2d_character_design",
    projectName: "2DcharacterDesign",
    category: "2D",
    order: 7,
    title: "· (作品名)",
    thumb: "asset/works/2D/2DcharacterDesign/2dcharacter_1image .png",
    images: [
      "asset/works/2D/2DcharacterDesign/2dcharacter_1image .png",
      "asset/works/2D/2DcharacterDesign/2dcharacter_2image.PNG",
      "asset/works/2D/2DcharacterDesign/2dcharacter_３image .PNG",
      "asset/works/2D/2DcharacterDesign/2dcharacter_4image .PNG",
      "asset/works/2D/2DcharacterDesign/2dcharacter_5image .png",
      "asset/works/2D/2DcharacterDesign/2dcharacter_6image .PNG",
      "asset/works/2D/2DcharacterDesign/2dcharacter_7image .PNG",
      "asset/works/2D/2DcharacterDesign/2dcharacter_8image .PNG",
    ],
    videos: [],
    turntable: [],
    descriptionMd: "asset/works/2D/2DcharacterDesign/2DcharacterDesign.md",
    downloadUrl: "",
    hours: 24,
  },
  // ------------------------------------------------------------------
  // 2D イラスト
  // ------------------------------------------------------------------
  {
    id: "work_2d_illus",
    projectName: "2Dイラスト",
    category: "2D",
    order: 8,
    title: "· (作品名)",
    thumb: "asset/works/2D/2Dイラスト/illus1.png",
    images: [
      "asset/works/2D/2Dイラスト/illus1.png",
      "asset/works/2D/2Dイラスト/illus2.png",
      "asset/works/2D/2Dイラスト/illus3.png",
    ],
    videos: [],
    turntable: [],
    descriptionMd: "asset/works/2D/2Dイラスト/2Dイラスト.md",
    downloadUrl: "",
    hours: 24,
  },
  // ------------------------------------------------------------------
  // Practice —— 2D (ほか)
  // ------------------------------------------------------------------
  {
    id: "work_2d_practice",
    projectName: "practice",
    category: "2D",
    order: 9,
    title: "· practice",
    thumb: "asset/works/2D/デッサンを含むほか/practice_1image.png",
    images: [
      "asset/works/2D/デッサンを含むほか/practice_1image.png",
      "asset/works/2D/デッサンを含むほか/practice_2image.png",
    ],
    videos: [],
    turntable: [],
    descriptionMd: "asset/works/2D/デッサンを含むほか/practice.md",
    downloadUrl: "",
    hours: 24,
  },
  // ------------------------------------------------------------------
  // Printed —— コーディングしたもの
  // ------------------------------------------------------------------
  {
    id: "work_2d_web",
    projectName: "printed",
    category: "CODE",
    order: 3,
    title: "· printed",
    thumb: "asset/works/コーディングしたもの/web/scriptMine_1image.png",
    images: [
      "asset/works/コーディングしたもの/web/scriptMine_1image.png",
      "asset/works/コーディングしたもの/web/scriptMine_2image.png",
      "asset/works/コーディングしたもの/web/scriptMine_3image.png",
      "asset/works/コーディングしたもの/web/scriptMine_4image.png",
      "asset/works/コーディングしたもの/web/scriptMine_5image.png",
    ],
    videos: [
      "asset/works/コーディングしたもの/web/scriptMine_1video.mp4",
    ],
    mainVideos: [
      "asset/works/コーディングしたもの/web/scriptMine_1video.mp4",
    ],
    turntable: [],
    descriptionMd: "asset/works/コーディングしたもの/web/web.md",
    downloadUrl: "",
    hours: 24,
  },
  // ------------------------------------------------------------------
  // マテリアル＆シェーダー —— コーディングしたもの
  // ------------------------------------------------------------------
  {
    id: "work_shader_crt",
    projectName: "crt shader",
    category: "CODE",
    order: 4,
    title: "· crt shader",
    thumb: "asset/works/コーディングしたもの/マテリアル＆シェーダー/material_1image.png",
    images: [
      "asset/works/コーディングしたもの/マテリアル＆シェーダー/material_1image.png",
      "asset/works/コーディングしたもの/マテリアル＆シェーダー/material_2image.png",
      "asset/works/コーディングしたもの/マテリアル＆シェーダー/material_3image.png",
    ],
    videos: [
      "asset/works/コーディングしたもの/マテリアル＆シェーダー/material_1video.mp4",
    ],
    mainVideos: [
      "asset/works/コーディングしたもの/マテリアル＆シェーダー/material_1video.mp4",
    ],
    turntable: [],
    descriptionMd: "asset/works/コーディングしたもの/マテリアル＆シェーダー/マテリアル＆シェーダー.md",
    downloadUrl: "",
    hours: 24,
  },
  // ------------------------------------------------------------------
  // 協力したインディーゲーム
  // ------------------------------------------------------------------
  {
    id: "work_indie",
    projectName: "indie game group work",
    category: "INDIE",
    order: 5,
    title: "· indie game group work",
    thumb: "asset/works/協力したインディーゲーム/indie_1image.png",
    images: [
      "asset/works/協力したインディーゲーム/indie_1image.png",
      "asset/works/協力したインディーゲーム/indie_2image.png",
      "asset/works/協力したインディーゲーム/indie_3image.png",
      "asset/works/協力したインディーゲーム/indie_4image.png",
      "asset/works/協力したインディーゲーム/indie_5image.png",
      "asset/works/協力したインディーゲーム/indie_6image.png",
      "asset/works/協力したインディーゲーム/indie_7image.png",
      "asset/works/協力したインディーゲーム/indie_8image.png",
      "asset/works/協力したインディーゲーム/indie_9image.png",
      "asset/works/協力したインディーゲーム/indie_10image.png",
      "asset/works/協力したインディーゲーム/indie_11image.png",
      "asset/works/協力したインディーゲーム/indie_12image.png",
      "asset/works/協力したインディーゲーム/indie_13image.png",
      "asset/works/協力したインディーゲーム/indie_14image.png",
      "asset/works/協力したインディーゲーム/indie_15image.png",
      "asset/works/協力したインディーゲーム/indie_16image.png",
    ],
    videos: [],
    turntable: [],
    descriptionMd: "asset/works/協力したインディーゲーム/協力したインディーゲーム.md",
    downloadUrl: "",
    hours: 48,
  },
];
