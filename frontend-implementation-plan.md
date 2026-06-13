# 刷游戏 Taro 前端执行计划

## 目标

基于已生成的设计稿，分阶段搭建「刷游戏」微信小程序前端。执行顺序固定为：

1. 先搭建前端页面和交互骨架
2. 再接入 mock 数据与本地生成流程
3. 最后接入真实 AI 生成、社交、用户服务

首期最高优先级是「刷游戏」Feed 的滑动流畅度，其次是游戏渲染能力的双方案验证：

- 方案 A：Cocos Creator
- 方案 B：WebGL + Canvas 2D 混合渲染

## 基础约定

- 前端工程目录：`frontend/`
- 本地 UI 设计稿目录：`designs/`
- 技术栈：Taro + React + TypeScript + SCSS
- 目标端：微信小程序
- 页面布局：参考 Spotify 的移动端沉浸式媒体布局
- 视觉策略：黑色为主色，少量克制的紫色渐变用于关键操作按钮，虹彩晶体元素只作为边缘点缀
- 执行方式：每个阶段完成后更新 `frontend-execution-log.md`，用于中断后恢复

## 设计稿评估记录

- `designs/` 已提供可渲染 HTML 设计稿与共享样式，阶段 1 以后以该目录为 UI 事实源。
- 设计稿包含 5 个移动端 screen：Feed、游戏详情覆盖层、创意工坊、AI 生成页、我的。
- 设计稿共享 CSS 中仍保留 Spotify 绿色变量，但实际落地按产品决策改为克制紫色渐变 CTA 与蓝紫高光。
- 不直接复制 HTML/CSS 到 Taro；提炼为 Taro 共享组件、主题 token 和页面结构。

## QFE Harness 借鉴

如果安装 qfe，前端项目按含 UI 设计稿处理：

```bash
qfe install --include-ui true
```

执行规则：

- 设计稿物料以 manifest 为唯一事实源，不根据口头描述猜页面细节。
- 如果使用朱雀设计稿流程，编码前必须读取 `.zhuque/{pmo}/zhuque-manifest.json`、目标 board 完整 md、以及 Taro 对应 prompt。
- 实现前先写清本阶段的 write set，避免多个 agent 同时改同一批文件。
- 每个阶段完成后记录验证证据，包括构建命令、预览结果、性能观测和遗留问题。

## 目录规划

```text
frontend/
├── src/
│   ├── app.tsx
│   ├── app.config.ts
│   ├── app.scss
│   ├── theme/
│   │   ├── tokens.ts
│   │   └── theme.scss
│   ├── data/
│   │   ├── mockGames.ts
│   │   └── mockGeneration.ts
│   ├── services/
│   │   ├── gameFeed.ts
│   │   ├── generation.ts
│   │   ├── social.ts
│   │   └── user.ts
│   ├── renderers/
│   │   ├── types.ts
│   │   ├── RenderHost/
│   │   ├── webgl-canvas/
│   │   └── cocos/
│   ├── components/
│   │   ├── SymbolButton/
│   │   ├── GradientActionButton/
│   │   ├── GameMetaTags/
│   │   ├── CrystalDecor/
│   │   ├── GamePreview/
│   │   └── BottomNav/
│   └── pages/
│       ├── feed/
│       ├── workshop/
│       ├── generating/
│       └── profile/
```

## 阶段 0：工程初始化

### 目标

创建 Taro 前端工程，跑通微信小程序构建，不实现业务功能。

### 主要任务

- 初始化 `frontend/` Taro React TypeScript 工程。
- 配置 `build:weapp`、类型检查、基础 lint 或格式化命令。
- 建立页面路由：`feed`、`workshop`、`generating`、`profile`。
- 建立主题 token 和全局样式入口。

### 验收

- `npm run build:weapp` 通过。
- 微信开发者工具能打开生成的 `dist/`。
- `frontend-execution-log.md` 记录初始化命令、Node 版本、Taro 版本、下一步。

## 阶段 1：前端页面骨架

### 目标

不依赖后端、不接真实游戏引擎，先完成主要页面 UI 和交互骨架。

### 页面范围

- `pages/feed`：全屏竖向刷游戏首页
- `pages/game`：当前游戏详情与试玩覆盖层
- `pages/workshop`：Prompt 创意工坊
- `pages/generating`：AI 生成进度页
- `pages/profile`：我的、历史、成就

### Feed 性能优先策略

- 使用竖向 `Swiper` 或等价原生能力实现上下滑动。
- 首期只挂载当前页和相邻 1 页的重内容。
- 非当前游戏只显示静态 preview，不启动 WebGL/Cocos 运行时。
- 当前游戏进入视口后再延迟初始化渲染器。
- 滑动过程中暂停真实渲染，显示上一帧 snapshot。
- 滑动停止 150-300ms 后再恢复当前游戏运行时。
- 滑动中暂停粒子、阴影、复杂滤镜和非必要动画。
- 离开当前页后立即释放渲染资源或切回静态缩略图。
- 右侧操作栏和底部信息层使用轻量组件，不触发大面积重排。
- 首期性能目标定为稳定 30fps，不追求一开始达到 60fps。

### 验收

- Feed 首屏直接进入刷游戏体验，没有营销页。
- 快速上下滑动时不出现明显掉帧、白屏或重复重建。
- 关键按钮可点：开始、点赞、评论、分享、跳过。
- 视觉上黑色占主导，紫色渐变只出现在关键 CTA。

## 阶段 2：渲染适配层

### 目标

先定义统一渲染入口，再分别验证 Cocos Creator 与 WebGL + Canvas 2D 两种方案。

### 统一接口

`RenderHost` 负责页面与游戏渲染器之间的边界：

- 输入：`gameId`、`dsl`、`previewMode`、`active`、`quality`
- 输出：`ready`、`loading`、`error`、`fps`、`snapshot`
- 生命周期：`init`、`play`、`pause`、`destroy`、`captureSnapshot`

### 方案 A：Cocos Creator

实施边界：

- 首期作为独立 POC 或独立渲染适配器，不进入 Feed MVP 主链路。
- 优先验证 Cocos 导出的微信小游戏/小程序可用形态、包体积、启动耗时、canvas 占用和销毁能力。
- Cocos Creator 更适合作为独立 `wechatgame` 产物验证，不能假设可以像普通 Taro 组件一样嵌入页面。
- 如果无法稳定嵌入 Taro 页面，首期只保留 Cocos adapter 协议和实验入口，不阻塞 Feed。

风险：

- Cocos Creator 更偏完整游戏运行时，和 Taro 页面生命周期可能耦合较重。
- 包体积、首启时间、内存释放和多实例切换风险较高。
- Feed 中连续滑动不适合同时存在多个 Cocos 实例。
- 触摸事件、主循环、GL 上下文和 Taro `Swiper` 生命周期可能互相影响。
- AI 生成 DSL 到 Cocos 场景/Prefab 的映射成本高于轻量 runtime。

首期验收：

- 能在实验页启动一个 Cocos demo。
- 能在离开页面时释放或暂停运行时。
- 输出启动耗时、包体积、内存和嵌入限制结论。

### 方案 B：WebGL + Canvas 2D 混合

模块拆分：

- `renderers/types.ts`：统一 DSL、渲染状态、质量等级类型。
- `renderers/RenderHost`：Taro 组件容器，处理 active/pause/destroy。
- `renderers/webgl-canvas/gameRuntime.ts`：统一 `init/load/play/pause/snapshot/dispose` 生命周期。
- `renderers/webgl-canvas/dslParser.ts`：mock DSL / AI DSL 到场景树的解析。
- `renderers/webgl-canvas/webglRenderer.ts`：等距 WebGL 渲染器。
- `renderers/webgl-canvas/canvas2dRenderer.ts`：低端兜底和静态预览。
- `renderers/webgl-canvas/scheduler.ts`：按 Feed active 状态调度帧循环。
- `renderers/webgl-canvas/inputBridge.ts`：区分 Feed 上下滑和游戏内点击/拖拽。
- `renderers/webgl-canvas/assetManager.ts`：纹理、shader、图片资源缓存与释放。
- `renderers/webgl-canvas/perfMonitor.ts`：FPS、帧耗时、加载耗时、降级原因。
- `renderers/webgl-canvas/snapshot.ts`：生成 Feed 非当前页缩略图。

首期策略：

- 优先实现 Canvas 2D 静态等距预览和简单动画。
- WebGL 只在当前 active 游戏上运行。
- WebGL 不可用时自动切换 Canvas 2D。
- 先服务 Feed 流畅度，不追求完整游戏物理和复杂 shader。
- 下一条游戏只预加载 DSL 和轻资源，不提前创建 WebGL 上下文。
- 低端机默认 Canvas 2D 或静态试玩封面。
- 首期关闭高成本效果：后处理、粒子、实时阴影、高 DPR。

验收：

- 当前页渲染，邻近页静态缩略图。
- 切换游戏时旧渲染器释放，新渲染器延迟启动。
- 提供 `fps` 或帧耗时的调试输出。

## 阶段 3：Mock 数据和本地流程

### 目标

在没有真实服务的情况下跑通完整产品体验。

### 主要任务

- `mockGames.ts`：游戏流数据、标题、标签、难度、作者、DSL 摘要。
- `mockGeneration.ts`：AI 生成步骤、进度、耗时、生成结果。
- `services/*.ts`：先提供 mock 实现，保留真实 API 接口形状。
- Feed 行为：点赞、收藏、跳过、开始玩、本地状态更新。
- Workshop 行为：输入 prompt、选模板、调参数、跳转生成页。
- Generating 行为：模拟进度，完成后插入 Feed。

### 验收

- 离线状态可完整体验：刷游戏、生成、发布到本地 Feed、查看历史。
- 服务接口类型稳定，后续真实服务只替换实现，不重写页面。

## 阶段 4：真实服务接入

### 目标

在页面和 mock 契约稳定后，接入真实后端。

### 服务范围

- 游戏流推荐：`GET /api/feed`
- AI 生成任务：`POST /api/generate`
- 生成进度：`WebSocket /ws/generate/{taskId}` 或轮询降级
- 社交行为：点赞、评论、分享、收藏
- 用户系统：历史、成就、等级

### 接入策略

- 保留 mock adapter，真实服务通过 feature flag 切换。
- 先接只读 Feed，再接生成流程，最后接社交与用户。
- 所有 API 返回都映射到前端稳定类型，不让页面直接消费后端原始字段。

### 验收

- 真实服务失败时能降级到错误态或 mock fallback。
- 生成超时、审核失败、网络失败都有明确 UI 状态。

## 多 Agent 执行策略

可以开启多 agent，但只在 write set 不重叠时并行。

### 推荐并行分工

| Agent | 负责范围 | Write Set | 是否可并行 |
|------|----------|-----------|------------|
| 主 agent | 工程初始化、集成、最终验证 | 全局协调 | 必须串行 |
| UI agent | 主题 token、基础组件、页面静态 UI | `src/theme/`, `src/components/`, 页面样式 | 可并行 |
| Feed agent | `pages/feed` 滑动性能和生命周期 | `src/pages/feed/`, `RenderHost` 调用层 | 可并行，但需等接口定稿 |
| Render agent B | WebGL + Canvas 2D adapter | `src/renderers/webgl-canvas/` | 可并行 |
| Render agent A | Cocos Creator POC | `src/renderers/cocos/` 或独立 demo | 可并行 |
| Mock agent | mock 数据和 service adapter | `src/data/`, `src/services/` | 可并行 |
| DSL agent | DSL schema、mock 游戏模板、validator | `src/renderers/types.ts`, `src/data/` | 接口定稿后可并行 |
| Perf agent | 性能埋点、设备分档、降级策略 | `src/renderers/webgl-canvas/perfMonitor.ts`, `src/renderers/webgl-canvas/scheduler.ts` | 与 renderer 接口定稿后可并行 |
| Service agent | 真实服务接入 | `src/services/` | 阶段 4 才开启 |

### 必须串行的节点

- Taro 工程初始化。
- 统一类型和 `RenderHost` 接口定稿。
- `GameRuntime` 生命周期接口定稿。
- DSL schema 定稿。
- Feed 与渲染器生命周期联调。
- mock 契约切换到真实服务。
- 最终构建、预览、性能验收。

### 多 agent 规则

- 每个 agent 启动前必须写清楚自己的 write set。
- 不允许两个 agent 同时修改同一个页面或同一个 service 文件。
- 子 agent 不得回滚他人改动。
- 主 agent 负责合并、冲突处理和最终验证。

## 恢复记录协议

每完成一个关键节点，更新 `frontend-execution-log.md`：

- 当前阶段
- 已完成事项
- 最近一次验证命令和结果
- 当前 write set
- 下一步唯一推荐动作
- 关键决策
- 阻塞问题
- 变更文件列表

中断恢复时，先读：

1. `frontend-execution-log.md`
2. 本计划文件
3. `frontend/package.json`
4. 最近阶段涉及的 `.spec.mod.md` 或模块说明

恢复后先做状态确认，不直接继续写代码。

## 阶段验收清单

- 阶段 0：Taro 微信小程序构建通过。
- 阶段 1：主要页面可操作，Feed 滑动流畅。
- 阶段 2：两种渲染方案都有明确结论，WebGL + Canvas 2D 能服务主链路。
- 阶段 3：mock 下完整产品闭环可用。
- 阶段 4：真实服务可切换，异常状态完整。

## 当前执行建议

下一步先执行阶段 0 和阶段 1：

1. 创建 `frontend/` Taro 工程。
2. 建立主题 token 和基础组件。
3. 完成 Feed 静态页面与竖向滑动。
4. 用静态 Canvas/图片占位游戏渲染，不立即接 Cocos。
5. 记录第一条恢复日志。
