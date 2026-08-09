# 冒险清单 - 个人效率冒险 PWA

一款集「计划清单 + 看板 + 知识库 + 游戏化冒险故事」的个人效率应用。通过管理任务、记录知识，获得积分、升级等级、解锁徽章，在混沌大陆上推进冒险剧情。

## 功能概览

### 任务管理
- 新增、编辑、删除任务
- 标记完成 / 取消完成
- 任务字段：标题、描述、状态（待办/进行中/已完成）、优先级（高/中/低）、分类、截止日期
- 列表视图：按分类筛选、关键词搜索、今日任务高亮
- 看板视图：三列拖拽切换状态（支持触摸操作）

### 知识库
- 新增、编辑、删除知识条目
- 按分类浏览、搜索标题和内容
- 支持简单 Markdown 文本

### 游戏化系统
- **积分**：完成普通任务 +10，高优先级 +20，连续打卡奖励 +5×N（上限 N=7），创建知识 +5
- **等级**：6 级体系（新手 → 学徒 → 熟练 → 能手 → 专家 → 大师）
- **徽章**：8 枚成就徽章（初出茅庐、小有成就、任务达人、连续三天、一周连胜、知识播种、知识积累、屠龙者）

### 冒险故事
- 5 章剧情：觉醒 → 初探森林 → 沼泽迷途 → 遗迹密语 → 最终决战
- Boss 战系统：完成任务 = 攻击 Boss，伤害 = 任务积分
- 故事日志：自动记录剧情进展

### 数据管理
- Excel 导出任务列表
- JSON 完整备份与恢复
- 所有数据本地存储（localStorage）

## 技术栈

| 技术 | 用途 |
|---|---|
| React 18 | UI 框架 |
| Vite 5 | 构建工具 |
| TypeScript | 类型安全 |
| Zustand | 状态管理 + localStorage 持久化 |
| @dnd-kit | 拖拽交互（看板拖拽） |
| xlsx (SheetJS) | Excel 导出 |
| react-router-dom | 路由管理 |
| vite-plugin-pwa | PWA 支持 |
| Vitest | 单元测试 |

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装与运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm test
```

### PWA 安装

1. 使用 `npm run preview` 启动服务
2. 在手机浏览器或桌面 Chrome 中打开
3. 选择「添加到主屏幕」即可作为原生应用使用

## 项目结构

```
quest-planner/
├── src/
│   ├── types/index.ts          # 类型定义
│   ├── data/
│   │   ├── badges.ts           # 徽章定义
│   │   └── chapters.ts         # 冒险章节定义
│   ├── store/useStore.ts       # Zustand 状态管理
│   ├── utils/
│   │   ├── gamification.ts     # 游戏化核心逻辑
│   │   ├── export.ts           # Excel/JSON 导出
│   │   ├── taskHelpers.ts      # 任务辅助函数
│   │   └── id.ts               # ID 和日期工具
│   ├── components/
│   │   ├── layout/             # 底部导航
│   │   └── common/             # Modal、Toast 等通用组件
│   ├── pages/                  # 页面组件
│   │   ├── HomePage.tsx        # 首页
│   │   ├── KanbanPage.tsx      # 看板
│   │   ├── KnowledgePage.tsx   # 知识库
│   │   ├── ProfilePage.tsx     # 我的
│   │   ├── TaskDetailPage.tsx  # 任务编辑
│   │   ├── KnowledgeDetailPage.tsx  # 知识编辑
│   │   ├── AdventurePage.tsx   # 冒险故事
│   │   ├── CategoryManagePage.tsx   # 分类管理
│   │   └── DataManagePage.tsx  # 数据管理
│   ├── App.tsx                 # 路由配置
│   ├── main.tsx                # 入口
│   └── index.css               # 全局样式
├── tests/
│   ├── setup.ts                # 测试配置
│   └── gamification.test.ts    # 核心逻辑单元测试（53 项）
├── public/
│   ├── icon-192.png            # PWA 图标
│   └── icon-512.png            # PWA 图标
├── vite.config.ts              # Vite + PWA 配置
├── vitest.config.ts            # 测试配置
├── tsconfig.json               # TypeScript 配置
└── package.json
```

## 游戏化规则

### 积分获取

| 行为 | 积分 |
|---|---|
| 完成普通任务 | +10 |
| 完成高优先级任务 | +20 |
| 连续第 N 天完成任务 | +5×N（上限 N=7） |
| 创建知识条目 | +5 |

### 等级体系

| 等级 | 所需积分 | 名称 |
|---|---|---|
| Lv.1 | 0 | 新手 |
| Lv.2 | 100 | 学徒 |
| Lv.3 | 300 | 熟练 |
| Lv.4 | 600 | 能手 |
| Lv.5 | 1000 | 专家 |
| Lv.6 | 2000 | 大师 |

### 冒险章节

| 章节 | 标题 | 推进条件 | Boss |
|---|---|---|---|
| 第1章 | 觉醒 | 完成首个任务 | 无 |
| 第2章 | 初探森林 | 连续 3 天完成任务 | 森林木灵 HP:50 |
| 第3章 | 沼泽迷途 | 累计完成 10 个任务 | 沼泽巫女 HP:100 |
| 第4章 | 遗迹密语 | 创建 5 条知识条目 | 遗迹守卫 HP:150 |
| 第5章 | 最终决战 | 连续 30 天完成任务 | 拖延之龙 HP:500 |

## 测试

运行 53 项单元测试，覆盖：
- 积分计算（基础分、优先级加成、连续天数奖励、上限）
- 等级判定（6 级边界值、进度计算）
- 徽章获取（8 枚徽章条件判定）
- 连续打卡天数（首次、连续、中断、重置）
- 章节推进条件（3 种条件类型）
- Boss 战伤害（普通攻击、致命一击、过度伤害、多次攻击）
- 每日记录更新

```bash
npm test
```

## 数据说明

- 所有数据存储在浏览器 localStorage 中，key 为 `quest-planner-storage`
- 支持导出 JSON 完整备份和 Excel 任务列表
- 支持从 JSON 文件恢复数据
- 可随时在「我的 → 数据管理」中重置所有数据
