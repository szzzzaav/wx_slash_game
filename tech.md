# 技术文档

## 「刷游戏」—— AI 生成游戏微信小程序

---

## 一、需求概述

构建一款微信小程序，实现"刷短视频式"的游戏浏览与游玩体验。核心挑战在于：(1) 在小程序环境中实现纪念碑谷风格的高品质等距视角渲染；(2) 设计一套 AI 驱动、模板+参数混合的游戏生成管线；(3) 保证生成游戏在小程序中的流畅运行。

---

## 二、涉及模块

| 模块 | 路径/描述 | 作用 |
|------|----------|------|
| **Game Runtime Engine** | `packages/game-engine/` | 游戏运行时核心，负责渲染、物理、音频、输入 |
| **Game Feed** | `pages/feed/` | 全屏游戏流，上下滑动交互 |
| **Creative Workshop** | `pages/workshop/` | 创意工坊，prompt 输入与生成管理 |
| **AI Generation Service** | `services/ai-generator/` | AI 生成接口封装，prompt 编排 |
| **Game DSL Parser** | `packages/game-dsl/` | 游戏描述语言解析器，JSON → 游戏对象 |
| **User System** | `pages/profile/` + `services/user/` | 用户中心、记录、成就 |
| **Social Service** | `services/social/` | 点赞、评论、分享 |
| **Backend API** | `server/` | 后端服务，AI 调用代理，数据存储 |

---

## 三、核心技术选型

### 3.1 游戏渲染方案

#### 方案对比

| 方案 | 性能 | 视觉效果 | 包体积 | 开发成本 | 小程序兼容 | 推荐 |
|------|------|---------|--------|---------|-----------|------|
| **Canvas 2D** | ★★★ | ★★☆ | 0KB(原生) | 中 | ✅ 完美 | 兜底方案 |
| **WebGL 原生** | ★★★★★ | ★★★★★ | 0KB(原生) | 高 | ✅ 完美 | ✅ **主力** |
| **Three.js 裁剪版** | ★★★★ | ★★★★★ | ~150KB | 中 | ⚠️ 需适配 | 备选 |
| **PixiJS** | ★★★★ | ★★★★ | ~120KB | 低 | ⚠️ 需适配 | 2D游戏主力 |
| **Unity WebGL** | ★★★ | ★★★★★ | 巨大 | 低 | ❌ 限制多 | 不推荐 |
| **Cocos Creator** | ★★★★ | ★★★★ | 中等 | 低 | ✅ 官方支持 | 可选 |

#### 最终选型：**分层渲染架构**

```
┌──────────────────────────────────────┐
│          Game Rendering Layer        │
│                                      │
│  ┌────────────────────────────────┐  │
│  │    Isometric Renderer (WebGL)  │  │  纪念碑谷风格 3D 等距
│  │    - 等距投影矩阵              │  │
│  │    - 自定义 Shader (描边/阴影) │  │
│  │    - 几何体构建与实例化        │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │    2D Sprite Renderer (PixiJS) │  │  2D 游戏 (消除/跑酷)
│  │    - 精灵动画系统              │  │
│  │    - 粒子效果                  │  │
│  │    - UI 覆盖层                 │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │    Canvas 2D Fallback          │  │  降级方案
│  │    - 简化版等距数学            │  │
│  │    - 基础精灵绘制              │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**选型理由**：

- **WebGL 作为主力**：纪念碑谷风格需要 3D 等距投影、自定义光照、描边效果，这些只能通过 WebGL Shader 实现
- **PixiJS 处理 2D**：2D 类游戏（消除、跑酷）用 PixiJS 开发效率高，且可裁剪到 ~80KB
- **Canvas 2D 兜底**：低端机型或 WebGL 不可用时自动降级
- **不使用 Three.js 完整版**：包体积过大（~500KB+），改为自研轻量等距渲染层（~30KB）

### 3.2 微信小程序技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **框架** | 原生微信小程序 + TypeScript | 最佳性能和兼容性，避免框架额外开销 |
| **渲染** | WebGL + Canvas 2D 混合 | 按游戏类型动态选择渲染后端 |
| **状态管理** | 自研轻量 Store（基于 EventEmitter）| 全局状态（用户、游戏数据、设置），避免引入大体积状态库 |
| **UI 组件** | WeUI 扩展 + 自定义组件 | 小程序原生风格，轻量化 |
| **网络** | wx.request + wx.connectSocket | HTTP 短连接 + WebSocket 长连接（实时生成进度） |
| **存储** | wx.cloud 云开发 或 自建后端 | 云开发降低运维成本，自建后端增加灵活性 |
| **分包** | 原生分包加载 | 主包 < 2MB，游戏引擎分包 < 8MB |
| **AI SDK** | 后端代理（不直连） | 小程序不支持直接调用外部 AI API，需通过后端 |

#### 分包策略

```
主包 (~1.5MB)              游戏引擎分包 (~6MB)
├── pages/feed/             ├── game-engine/
├── pages/workshop/         │   ├── isometric-renderer/
├── pages/profile/          │   ├── physics/
├── components/             │   ├── audio/
├── services/               │   └── game-templates/
├── utils/                  ├── pixi-mini/
└── app.ts                  └── shaders/

内容分包 (~4MB)             AI生成分包 (~2MB)
├── assets/textures/        ├── prompt-templates/
├── assets/audio/           └── generation-pipeline/
└── assets/models/
```

### 3.3 AI 技术栈与接入方案

#### 整体 AI 管线架构

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Generation Pipeline                   │
│                                                              │
│  用户 Prompt                                                 │
│      │                                                       │
│      ▼                                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Prompt 理解与增强 (LLM)                          │   │
│  │     - 意图识别 (游戏类型/风格/难度)                   │   │
│  │     - Prompt 扩展（补充游戏设计细节）                 │   │
│  │     - 与模板库匹配度评分                              │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  2. 模板匹配 & 参数化生成                             │   │
│  │     - 匹配最佳游戏模板 (向量相似度)                   │   │
│  │     - LLM 生成模板参数 JSON                           │   │
│  │     - 关卡数据生成 (布局/谜题/敌人/道具)             │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  3. 视觉素材生成 (可选)                               │   │
│  │     - 风格参考图生成 (DALL·E/Stable Diffusion)       │   │
│  │     - 色彩方案提取                                    │   │
│  │     - 纹理/几何体参数生成                             │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  4. Game DSL 组装与校验                               │   │
│  │     - JSON Schema 校验                                │   │
│  │     - 可玩性自动检测 (A* 路径验证等)                  │   │
│  │     - 难度评分                                        │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  5. 编译为小程序可执行格式                            │   │
│  │     - DSL → 游戏对象图                                │   │
│  │     - 资源打包                                        │   │
│  │     - 云存储上传                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│                Game DSL JSON (返回小程序)                     │
└──────────────────────────────────────────────────────────────┘
```

#### AI 模型选型

| 环节 | 模型 | 调用方式 | 预计延迟 |
|------|------|---------|---------|
| **Prompt 理解与增强** | Claude Sonnet 4.6 / GPT-4o-mini | 后端 API | 1-2s |
| **游戏参数生成** | Claude Sonnet 4.6 (结构化输出) | 后端 API | 2-5s |
| **关卡布局生成** | Claude Sonnet 4.6 + Procedural Algorithm | 后端 API + 本地算法 | 1-3s |
| **视觉参考图** | DALL·E 3 / Stable Diffusion (可选) | 后端 API | 3-10s |
| **可玩性验证** | A* Pathfinding + Rule-based Checker | 本地算法 | < 0.5s |

#### 接入架构

```
┌─────────────────────────────────────────────────────────┐
│                      小程序 (客户端)                      │
│                                                          │
│  POST /api/generate                                      │
│  { prompt, template?, difficulty, style, duration }      │
│                                                          │
│  WebSocket /ws/generate/{taskId}  ← 流式进度推送         │
│                                                          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS/WSS
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (Node.js/Go)               │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ Prompt      │  │ Template    │  │ Generation     │  │
│  │ Orchestrator│  │ Matcher     │  │ Queue (Redis)  │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────────┘  │
│         │                │                                │
│         ▼                ▼                                │
│  ┌──────────────────────────────────────────────────┐    │
│  │              AI Model Proxy Layer                 │    │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐    │    │
│  │  │ Claude   │ │ GPT-4o   │ │ SD/DALL·E     │    │    │
│  │  │ (文本)   │ │ (文本)   │ │ (图像-可选)   │    │    │
│  │  └──────────┘ └──────────┘ └───────────────┘    │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Validation & Compilation              │    │
│  │  JSON Schema · Playability · Difficulty · Pack    │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     Data Storage                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ 腾讯云COS │  │ 云数据库  │  │  Redis Cache         │  │
│  │ (GameDSL │  │ (用户/   │  │ (热门游戏/排行榜)    │  │
│  │  存储)   │  │  社交)   │  │                      │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 四、纪念碑谷风格等距渲染方案（重点）

### 4.1 纪念碑谷的视觉特征分析

| 特征 | 技术实现映射 |
|------|-------------|
| **等距视角 (Isometric)** | 正交投影矩阵 + 固定相机角度 (俯角约 30°) |
| **几何化建筑** | 简单几何体组合 (Cube, Cylinder, Prism, Arch) |
| **柔和调色板** | 预定义色板 LUT + Shader 色彩映射 |
| **扁平着色 + 细微渐变** | Toon Shading + 环境光遮蔽 (AO) |
| **硬边阴影** | Directional Light + Shadow Mapping 或 Blob Shadow |
| **不可能几何体** | 自定义深度测试策略 (Stencil Buffer) |
| **平滑旋转动画** | Quaternion 插值 + Ease 曲线 |
| **角色简约** | 胶囊体 + 锥形帽 + 简单动画帧 |
| **粒子点缀** | 飘落花瓣/光点粒子系统 |

### 4.2 WebGL 等距渲染器设计

#### 渲染管线

```
┌─────────────────────────────────────────────────────────┐
│                  Isometric Render Pipeline               │
│                                                          │
│  Scene Graph (Game DSL → Render Tree)                    │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  1. Culling (视锥体裁剪)                          │   │
│  │     - 只渲染屏幕可见范围内的物体                   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  2. Geometry Batching (几何合批)                   │   │
│  │     - 相同材质/颜色的几何体合并为一次 Draw Call    │   │
│  │     - 使用 Instance Rendering (ANGLE_instanced)    │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  3. Isometric Projection (等距投影)                │   │
│  │     - View Matrix: 相机位置 (isoX, isoY, isoZ)     │   │
│  │     - Projection: Orthographic                     │   │
│  │     - Model Matrix: 物体变换                        │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  4. Toon Shading Pass (卡通着色)                    │   │
│  │     - Diffuse: 阶梯化光照 (2-3 阶亮度)             │   │
│  │     - Outline: 几何体膨胀法 + 背面渲染             │   │
│  │     - Ambient: 低强度环境光避免纯黑面              │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  5. Shadow Pass (阴影)                              │   │
│  │     - 简化为 Blob Shadow (圆形投影贴图)             │   │
│  │     - 或 Projective Shadow (投影到地面)            │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  6. Post Processing (后处理)                        │   │
│  │     - 轻微 Bloom (高光溢出)                         │   │
│  │     - 色彩分级 (LUT)                                │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│                         ▼                                │
│                   Framebuffer → Canvas                    │
└─────────────────────────────────────────────────────────┘
```

#### 核心代码结构

```
packages/isometric-renderer/
├── index.ts                  # 渲染器入口
├── core/
│   ├── Renderer.ts           # 主渲染循环 (requestAnimationFrame)
│   ├── Scene.ts              # 场景图管理
│   ├── Camera.ts             # 等距相机 (正交投影)
│   └── Material.ts           # 材质系统 (颜色/纹理/Shader)
├── geometry/
│   ├── GeometryBuilder.ts    # 几何体工厂
│   ├── Cube.ts               # 立方体
│   ├── Arch.ts               # 拱门
│   ├── Stairs.ts             # 阶梯
│   ├── Platform.ts           # 平台/地面
│   └── Character.ts          # 角色几何体
├── shaders/
│   ├── toon.vert.glsl        # 卡通着色顶点着色器
│   ├── toon.frag.glsl        # 卡通着色片元着色器
│   ├── outline.vert.glsl     # 描边顶点着色器
│   ├── outline.frag.glsl     # 描边片元着色器
│   └── shadow.frag.glsl      # 阴影着色器
├── effects/
│   ├── BloomPass.ts          # Bloom 后处理
│   ├── ColorGrading.ts       # 色彩分级 (LUT)
│   └── Particles.ts          # 粒子系统
├── interaction/
│   ├── Raycaster.ts          # 屏幕坐标 → 等距空间坐标转换
│   ├── TouchHandler.ts       # 触摸输入处理
│   └── CameraController.ts   # 相机旋转/平移控制
└── utils/
    ├── IsoMath.ts            # 等距坐标转换工具
    ├── ColorPalette.ts       # 纪念碑谷风格色板
    └── Easing.ts             # 缓动函数集合
```

#### 关键算法：等距坐标转换

```typescript
// IsoMath.ts - 等距坐标与屏幕坐标互转
export class IsoMath {
  // 等距角度 (标准 2:1 等距)
  static readonly ANGLE_X = Math.PI / 6;  // 30°
  static readonly ANGLE_Y = Math.PI / 6;  // 30°

  /**
   * 等距世界坐标 → 屏幕坐标
   * 纪念碑谷使用正交投影 + 固定视角旋转
   */
  static worldToScreen(wx: number, wy: number, wz: number): [number, number] {
    const cosX = Math.cos(this.ANGLE_X);
    const sinX = Math.sin(this.ANGLE_X);
    const cosY = Math.cos(this.ANGLE_Y);
    const sinY = Math.sin(this.ANGLE_Y);

    // 先绕 Y 轴旋转 (45°)，再绕 X 轴倾斜 (~35.264°)
    const sx = (wx - wy) * cosY;
    const sy = (wx + wy) * sinY * sinX - wz * cosX;

    return [sx, sy];
  }

  /**
   * 屏幕坐标 → 等距世界坐标 (用于点击检测)
   * 假设点击在地面平面 (wz = 0)
   */
  static screenToWorld(sx: number, sy: number, wz: number = 0): [number, number] {
    const cosX = Math.cos(this.ANGLE_X);
    const sinX = Math.sin(this.ANGLE_X);
    const cosY = Math.cos(this.ANGLE_Y);
    const sinY = Math.sin(this.ANGLE_Y);

    const sy2 = sy + wz * cosX;
    const wx = sx / (2 * cosY) + sy2 / (2 * sinY * sinX);
    const wy = sy2 / (2 * sinY * sinX) - sx / (2 * cosY);

    return [wx, wy];
  }
}
```

#### 纪念碑谷风格色彩方案

```typescript
// ColorPalette.ts - 预设色板
export const MonumentValleyPalettes = {
  // 原作经典 - 暖粉/蓝绿
  classic: {
    primary:   [0.98, 0.75, 0.65],  // 暖粉 #FABFA6
    secondary: [0.45, 0.71, 0.73],  // 蓝绿 #73B5BA
    accent:    [0.18, 0.24, 0.35],  // 深蓝 #2E3D59
    floor:     [0.95, 0.87, 0.80],  // 米白 #F2DECC
    shadow:    [0.13, 0.18, 0.28],  // 暗影 #222E47
    highlight: [0.99, 0.92, 0.85],  // 高光 #FDEBD9
  },
  // 森林秘境
  forest: {
    primary:   [0.42, 0.65, 0.51],  // 森林绿
    secondary: [0.82, 0.73, 0.55],  // 金褐色
    accent:    [0.22, 0.29, 0.22],  // 深绿
    floor:     [0.89, 0.85, 0.76],  // 象牙白
    shadow:    [0.15, 0.22, 0.17],
    highlight: [0.93, 0.89, 0.80],
  },
  // 黄昏沙漠
  desert: { /* ... */ },
  // 冰霜城堡
  ice: { /* ... */ },
  // AI 自主配色
  aiGenerated: { /* 由 AI 根据 prompt 动态生成 */ }
};
```

### 4.3 小程序中的 WebGL 适配要点

| 挑战 | 解决方案 |
|------|---------|
| **微信 WebGL 上下文获取** | 使用 `wx.createOffscreenCanvas` + `canvas.getContext('webgl')` |
| **不支持 `<canvas>` 标签** | 使用小程序 `<canvas>` 组件，type="webgl" |
| **Shader 预编译** | Shader 编译为二进制文件，首次加载时缓存 |
| **低端机性能** | 简化几何体面数（< 5000 tri/frame），降低分辨率 |
| **内存限制 (iOS ~200MB)** | 纹理压缩 (ETC2/ASTC)，及时释放不用的 Framebuffer |
| **微信 7.0+ WebGL 2.0 支持** | 使用 WebGL 2.0 特性（UBO, VAO, Instancing），降级到 WebGL 1.0 |

---

## 五、Game DSL 设计（游戏描述语言）

### 5.1 设计目标

AI 生成的是 **JSON 格式的 Game DSL**，而非原始代码。引擎解析 DSL 渲染游戏。

| 优势 | 说明 |
|------|------|
| **安全性** | 不执行任意代码，小程序审核可过 |
| **可验证** | JSON Schema 校验保证数据合法性 |
| **跨平台** | 同一份 DSL 可在多个渲染后端运行 |
| **体积小** | 通常 5-50KB，加载快 |

### 5.2 DSL Schema（精简版）

```typescript
// game-dsl.schema.ts
interface GameDSL {
  meta: {
    id: string;
    title: string;
    author: string;
    type: 'puzzle' | 'platformer' | 'runner' | 'collector' | 'sokoban' | 'maze' | 'custom';
    style: 'monument_valley' | 'low_poly' | 'flat' | 'pixel' | 'neon';
    difficulty: 1 | 2 | 3 | 4 | 5;
    estimatedDuration: number;  // 秒
    palette: ColorPalette;
  };

  camera: {
    projection: 'orthographic' | 'perspective';
    isoAngle: number;           // 等距角度 (默认 30°)
    initialPosition: Vec3;
    initialTarget: Vec3;
    controls: 'fixed' | 'rotatable' | 'follow';
  };

  scene: {
    bounds: { width: number; height: number; depth: number; };
    ground: GroundConfig;
    geometry: GeometryObject[];  // 建筑、平台、装饰
    props: PropObject[];         // 交互物件
    lighting: LightingConfig;
    particles: ParticleConfig[];
  };

  gameplay: {
    winCondition: WinCondition;
    loseCondition?: LoseCondition;
    mechanics: GameMechanic[];
    checkpoints?: Checkpoint[];
  };

  player: {
    type: 'capsule' | 'cube' | 'custom';
    startPosition: Vec3;
    abilities: Ability[];
  };

  levels?: Level[];  // 多关卡游戏

  audio?: {
    bgm?: string;     // 云端音频 URL
    sfx: Record<string, string>;
  };
}
```

### 5.3 DSL 示例：AI 生成的简单解谜游戏

```json
{
  "meta": {
    "title": "天空之桥",
    "type": "puzzle",
    "style": "monument_valley",
    "difficulty": 2,
    "estimatedDuration": 120,
    "palette": "classic"
  },
  "camera": {
    "projection": "orthographic",
    "isoAngle": 30,
    "initialPosition": [8, 8, 12],
    "initialTarget": [4, 4, 0],
    "controls": "rotatable"
  },
  "scene": {
    "bounds": { "width": 10, "height": 10, "depth": 6 },
    "ground": { "color": "#F2DECC", "gridSize": 1 },
    "geometry": [
      { "type": "cube", "position": [3, 3, 0], "size": [2, 2, 3], "color": "#FABFA6" },
      { "type": "arch", "position": [5, 3, 0], "width": 2, "height": 3, "color": "#73B5BA" },
      { "type": "stairs", "position": [2, 5, 0], "steps": 5, "direction": "x", "color": "#FABFA6" },
      { "type": "platform", "position": [6, 6, 2], "size": [3, 3, 0.3], "color": "#E8D5C4" }
    ],
    "lighting": { "ambient": 0.3, "directional": { "direction": [-1, -1, -2], "intensity": 0.8 } }
  },
  "gameplay": {
    "winCondition": { "type": "reach_position", "position": [7, 7, 2] },
    "mechanics": [
      { "type": "rotate_camera", "axis": "y", "angle": 90, "trigger": "button" },
      { "type": "move_platform", "path": [[6,6,2], [8,6,2], [6,6,2]], "duration": 3 }
    ]
  },
  "player": {
    "type": "capsule",
    "startPosition": [0, 0, 0],
    "abilities": ["move", "interact"]
  }
}
```

---

## 六、系统架构

### 6.1 总体架构图

```
┌───────────────────────────────────────────────────────────────────┐
│                         WeChat Mini Program (Client)                │
│                                                                     │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Game Feed   │ │ Workshop     │ │ Profile     │ │ Settings    │ │
│  │ (Swipable)  │ │ (Prompt UI)  │ │ (Records)   │ │             │ │
│  └──────┬──────┘ └──────┬───────┘ └──────┬──────┘ └──────┬──────┘ │
│         │               │                │                │        │
│  ┌──────┴───────────────┴────────────────┴────────────────┴──────┐ │
│  │                      Service Layer                             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────────┐  │ │
│  │  │ API      │ │ Cache    │ │ Auth    │ │ Analytics        │  │ │
│  │  │ Client   │ │ Manager  │ │ Manager │ │ Tracker          │  │ │
│  │  └──────────┘ └──────────┘ └─────────┘ └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Game Runtime (分包)                          │ │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │ Isometric  │ │ 2D Sprite  │ │ Physics  │ │ Audio        │ │ │
│  │  │ Renderer   │ │ Renderer   │ │ (Light)  │ │ Manager      │ │ │
│  │  │ (WebGL)    │ │ (PixiJS)   │ │          │ │              │ │ │
│  │  └─────┬──────┘ └─────┬──────┘ └────┬─────┘ └──────┬───────┘ │ │
│  │        └──────────────┴─────────────┴──────────────┘          │ │
│  │                          │                                     │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │                Game DSL Parser & Interpreter              │ │ │
│  │  │    JSON → Scene Graph → Render Tree → Animation Graph     │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬────────────────────────────────────┘
                               │ HTTPS / WSS
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        API Gateway (Nginx/Kong)                    │
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Game Gen    │  │ User        │  │ Social     │  │ Analytics │ │
│  │ Service     │  │ Service     │  │ Service    │  │ Service   │ │
│  │ (Node.js)   │  │ (Go/Node)   │  │ (Node.js)  │  │ (Node.js) │ │
│  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  └─────┬─────┘ │
│         │                │               │               │        │
│  ┌──────┴────────────────┴───────────────┴───────────────┴──────┐ │
│  │                      Message Queue (Redis/Kafka)              │ │
│  │              异步任务: 图片生成 / 复杂关卡 / 评分计算         │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬───────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐
   │ AI API      │    │ 腾讯云 COS  │    │ 数据库           │
   │ (Claude/GPT)│    │ (Game DSL   │    │ (MongoDB/MySQL   │
   │             │    │  静态资源)  │    │  + Redis Cache)  │
   └─────────────┘    └─────────────┘    └──────────────────┘
```

### 6.2 数据流设计

#### 游戏生成流程

```
用户 Prompt → [客户端] POST /api/games/generate
                              │
                              ▼
              [API Gateway] → [Game Gen Service]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            [Prompt Orchestrator]  [Template Matcher]
                    │                   │
                    └─────────┬─────────┘
                              ▼
                      [LLM API Call]
                      {
                        model: "claude-sonnet-4-6",
                        messages: [...enhancedPrompt],
                        response_format: GameDSLSchema
                      }
                              │
                              ▼
                      [DSL Validator]
                      - JSON Schema check
                      - Playability test
                      - Difficulty scoring
                              │
                              ▼
                      [Game DSL JSON]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            [COS Upload]         [DB Insert]
            store: game_{id}.json  record: {id, author, prompt, ...}
                    │                   │
                    └─────────┬─────────┘
                              ▼
                      [Response to Client]
                      {
                        gameId, dsl_url, preview_url,
                        meta: { title, type, difficulty, ... }
                      }
                              │
                              ▼
              [客户端] Game DSL Parser → Scene Graph → Render
```

#### 游戏流加载流程

```
[客户端] 进入 Feed 页面
     │
     ▼
POST /api/feed/recommend
  { cursor, limit: 5, preferences }
     │
     ▼
[推荐服务]
  - 协同过滤 + 内容推荐
  - 返回游戏列表 (含 DSL URL + 预览图)
     │
     ▼
[客户端] 预加载策略
  - 当前游戏: 立即加载 DSL + 初始化引擎
  - 下一个游戏: 预下载 DSL (不初始化渲染)
  - 下下个游戏: 仅加载 meta 信息
     │
     ▼
[当前游戏] 渲染完毕 → 用户滑动 → 下一个游戏切入
  - 旧游戏引擎 pause + 回收 GL 资源
  - 新游戏引擎 resume + 渲染
```

---

## 七、AI 生成游戏的可行技术路径

### 7.1 路径对比

| 路径 | 灵活性 | 安全性 | 生成质量 | 开发成本 | 推荐度 |
|------|-------|--------|---------|---------|--------|
| **A. 模板+参数化** | ★★ | ★★★★★ | ★★★★ | ★★★ | ⭐⭐⭐⭐⭐ MVP首选 |
| **B. 完整代码生成** | ★★★★★ | ★ | ★★★ | ★★★★ | ⭐⭐ 暂不推荐 |
| **C. 关卡+素材生成** | ★★★ | ★★★★ | ★★★★ | ★★★★ | ⭐⭐⭐⭐ 中期加入 |
| **D. 程序化生成+AI** | ★★★★ | ★★★★★ | ★★★★ | ★★★★★ | ⭐⭐⭐ 长期演进 |

### 7.2 推荐路径：阶段式推进

#### Phase 1 (MVP) — 模板+参数化

```
用户 Prompt → LLM选择模板 + 生成参数 → 引擎渲染
```

**实施细节**：

1. **预定义 8-10 个游戏模板**，每个模板是一个参数化的游戏引擎：

| 模板 | 核心玩法 | 渲染器 |
|------|---------|--------|
| 等距解谜 | Monument Valley 式路径连接、旋转平台、传送门 | Isometric WebGL |
| 推箱子变体 | 经典推箱子 + 传送门、按钮机关 | Isometric WebGL |
| 平台跳跃 | 2D 横向/纵向跳跃、移动平台、收集 | 2D PixiJS |
| 躲避障碍 | 跑酷式闪避、加速、道具 | 2D PixiJS |
| 收集游戏 | 限时收集目标物品、避开敌人 | 2D PixiJS/Isometric |
| 迷宫探索 | 俯视/等距迷宫、迷雾、钥匙门 | Isometric WebGL |
| 匹配消除 | 三消/连线消除 + 特殊块 | 2D Canvas |
| 塔防简化版 | 固定路线塔防、升级炮塔 | 2D Canvas |

2. **每个模板暴露 15-30 个可调参数**

   以「等距解谜」模板为例：

   ```
   关卡尺寸: 8x8 ~ 16x16
   建筑数量: 5 ~ 20
   谜题类型: [路径连接, 旋转平台, 传送门, 按钮开关, 移动方块]
   难度曲线: 线性 | 阶梯 | 随机
   色彩主题: classic | forest | desert | ice | ai_dynamic
   胜利条件: 到达终点 | 收集 N 个 | 触发机关
   ```

3. **LLM 的角色**：
   - 理解用户 prompt → 选择最合适的模板
   - 填充模板参数 → 生成关卡布局 → 输出 Game DSL JSON

4. **优势**：可玩性有保证（模板经过预先验证），生成速度快（2-5s），质量可控

#### Phase 2 — 关卡多样化 + 视觉素材 AI 生成

在 Phase 1 基础上增加：

- **关卡布局 AI 生成**：用 procedural generation 算法 + LLM 约束生成独特关卡
- **视觉素材 AI 生成**：根据 prompt 用 SD/DALL·E 生成纹理、背景、装饰元素
- **叙事注入**：LLM 生成关卡间的迷你剧情文本

#### Phase 3 — 玩法组合 + 社区模板

- **玩法混搭**：LLM 组合多个基础机制创造新玩法（推箱子+传送门、平台跳跃+收集）
- **社区模板市场**：高级创作者可上传自定义模板参数 schema
- **AI 调优**：基于玩家行为数据，LLM 优化关卡难度曲线和留存率

### 7.3 Prompt Engineering 设计

#### 系统 Prompt 模板（后端使用）

```markdown
你是一个游戏设计 AI。你的任务是根据用户的描述，生成一个可玩的游戏的配置数据。

## 可用的游戏模板
{% for template in templates %}
- **{{ template.name }}** ({{ template.type }}): {{ template.description }}
  参数: {{ template.params | json }}
{% endfor %}

## 输出要求
你必须输出符合以下 JSON Schema 的 Game DSL：
{game_dsl_schema}

## 设计原则
1. 纪念碑谷风格：等距视角、几何建筑、柔和色彩、不可能空间
2. 难度递进：从简单引入机制，逐步增加复杂度
3. 可完成性：确保胜利条件可达
4. 趣味性：每个关卡有独特的"顿悟时刻"

## 用户需求
{user_prompt}

## 输出格式
仅输出有效的 JSON，不要包含其他文字。
```

---

## 八、Todo List（MVP 开发计划）

### Sprint 1: 渲染引擎核心（2 周）

- [ ] **S1.1** 搭建小程序项目骨架（TypeScript + 分包结构）—— 验收：项目可编译运行
- [ ] **S1.2** 实现 WebGL 上下文封装（小程序 canvas WebGL 适配）—— 验收：屏幕显示纯色三角形
- [ ] **S1.3** 实现等距投影矩阵 + 相机系统 —— 验收：渲染一个旋转的 3D 立方体等距视角
- [ ] **S1.4** 实现基本几何体渲染（Cube, Platform, Stairs）—— 验收：场景中渲染 5 个不同几何体
- [ ] **S1.5** 实现 Toon Shading + 描边效果 —— 验收：渲染效果接近纪念碑谷
- [ ] **S1.6** 实现触摸交互 + 等距坐标点击检测 —— 验收：点击几何体变色
- [ ] **S1.7** 实现 Game DSL Parser（JSON → Scene Graph）—— 验收：加载 DSL 文件渲染完整场景

### Sprint 2: AI 生成管道（2 周）

- [ ] **S2.1** 设计并实现 5 个游戏模板（解谜、平台跳跃、推箱子、收集、迷宫）—— 验收：每个模板 DSL 手动创建可玩
- [ ] **S2.2** 搭建后端 API 服务（Node.js + Express/Fastify）—— 验收：接口调通
- [ ] **S2.3** 实现 LLM Prompt Orchestrator + Template Matcher —— 验收：输入 prompt 返回模板选择 + 参数
- [ ] **S2.4** 实现 Game DSL Validator（Schema + 可玩性检测）—— 验收：非法 DSL 被拒绝并返回错误信息
- [ ] **S2.5** 实现 AI 生成 API 端到端串联 —— 验收：输入"一个粉色天空之城的解谜游戏"→ 返回可玩 Game DSL
- [ ] **S2.6** 实现生成进度 WebSocket 推送 —— 验收：客户端实时展示生成步骤

### Sprint 3: 游戏流 + 创意工坊（2 周）

- [ ] **S3.1** 实现全屏游戏流页面（Swiper 组件 + 游戏引擎集成）—— 验收：滑动切换游戏
- [ ] **S3.2** 实现游戏预加载策略（当前+下一个）—— 验收：滑动无白屏
- [ ] **S3.3** 实现创意工坊页面（模板选择 + Prompt 输入 + 生成按钮）—— 验收：基本流程走通
- [ ] **S3.4** 实现预设 Prompt 模板（精选 20 个一键生成 prompt）—— 验收：点击即生成
- [ ] **S3.5** 实现游戏预览卡片组件（缩略图+标签+难度）—— 验收：Feed 中正确展示
- [ ] **S3.6** 实现生成历史列表 —— 验收：查看/重试历史生成

### Sprint 4: 社交 + 上架准备（1 周）

- [ ] **S4.1** 实现点赞/收藏功能 —— 验收：数据持久化
- [ ] **S4.2** 实现微信分享卡片（Canvas 截图 → 分享图片）—— 验收：分享到聊天/朋友圈
- [ ] **S4.3** 实现推荐算法初版（热门+随机+标签匹配）—— 验收：Feed 内容多样性
- [ ] **S4.4** 性能优化（首屏 < 2s，滑动帧率 > 30fps，低端机适配）—— 验收：性能数据达标
- [ ] **S4.5** 小程序审核合规检查（无违规内容过滤）—— 验收：内容安全接口接入

---

## 九、风险点与应对方案

| 风险点 | 影响程度 | 发生概率 | 应对方案 |
|-------|---------|---------|---------|
| **WebGL 在部分安卓机型不兼容** | 高 | 中 | 多机型测试矩阵，Canvas 2D 降级方案，最低支持标准定在微信 8.0+ |
| **AI 生成质量不稳定** | 高 | 高 | 模板化约束降低自由度，多层次校验（Schema→可玩性→人工审核），用户反馈机制 |
| **AI API 成本过高** | 中 | 中 | 使用小模型做简单生成，缓存相似 prompt 结果，按用户等级限制模型选择 |
| **小程序审核不通过（AI 生成内容）** | 高 | 中 | 接入微信内容安全 API，敏感词库，用户生成内容先审后发 |
| **性能不达标（低端机卡顿）** | 中 | 高 | 分档渲染质量，动态 LOD，纹理压缩，模型面数预算 |
| **用户留存低** | 高 | 中 | AI 生成质量持续优化，社区内容填充，每日推荐个性化算法 |
| **苹果支付政策风险** | 中 | 低 | 区分安卓/iOS 支付策略，优先走微信支付（安卓），iOS 使用 IAP |

---

## 十、边界问题与注意事项

| 边界情况 | 处理方式 |
|---------|---------|
| AI 生成失败（超时/格式错误） | 自动重试 2 次，失败后提示用户修改 prompt，提供"换一个"快捷按钮 |
| AI 生成内容不安全 | 前端+后端双层敏感词过滤，AI prompt 注入安全指令，人工审核高风险内容 |
| WebGL 不可用（极低端机） | 自动降级到 Canvas 2D 简化版渲染，放弃描边/Shader 效果，保留核心玩法 |
| 网络异常 | 本地缓存已加载游戏，离线模式可游玩历史游戏；生成功能提示网络错误 |
| 小程序主包超 2MB | 所有游戏引擎代码放分包，主包只含 Feed/Workshop UI 壳 |
| 内存不足 | 单游戏内存预算 < 80MB，切换游戏时强制释放旧游戏 GL 资源 |
| 低端机帧率过低 | 动态降低几何体面数、关闭粒子效果、降低分辨率至 0.75x |
| 用户生成大量游戏 | 每人每日限额（免费 5 次），会员不限；COS 按时间淘汰 30 天未游玩游戏 |
| 苹果 IAP 限制 | 虚拟商品（会员/次数）必须走苹果 IAP，微信小游戏支付需额外审核 |
