# LinkHub - 个人极速网址导航

一个基于 Svelte 5 和 Tailwind CSS 构建的个人网址导航工具，支持多分类结构、搜索、主题切换与收藏功能。

## 功能特性

- 🚀 **极速加载** - 基于 Svelte 5，运行时性能优异
- 🎨 **现代化 UI** - 使用 Tailwind CSS 构建，支持明亮/暗黑主题
- 📱 **响应式设计** - 完美适配 PC 端和移动端
- 🔍 **实时搜索** - 支持网站名称和描述搜索，200ms 防抖优化
- ⭐ **收藏功能** - 支持收藏网站，数据存储在 LocalStorage，支持导出/导入 JSON
- 📂 **多分类管理** - 支持一级和二级分类结构，可展开/收起子分类
- 🎯 **返回顶部** - 向上滚动时显示返回顶部按钮
- 💾 **数据持久化** - 主题和收藏数据存储在 LocalStorage
- 🖼️ **智能图标** - 优先使用本地图标，其次使用 Favicon.im API，最后使用默认图标

## 技术栈

- **框架**: Svelte 5
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **图标**: Font Awesome
- **数据格式**: JSON

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist` 目录，可直接部署到任意静态主机。

### 预览生产版本

```bash
npm run preview
```

## 部署

构建后的静态文件可以部署到：

- GitHub Pages
- Vercel
- Netlify
- 任意静态文件服务器

## 项目结构

```
LinkHub/
├── public/                  # 静态资源
│   ├── data/               # 数据文件目录
│   │   ├── data.json       # 一级分类数据
│   │   ├── dev-tools.json  # 开发工具分类数据
│   │   └── ...             # 更多
│   ├── icons/              # 本地图标资源
│   └── fontawesome/        # Font Awesome 图标库
├── src/
│   ├── lib/                # 组件库
│   │   ├── Sidebar.svelte      # 侧边栏组件
│   │   ├── Navbar.svelte       # 顶部导航栏
│   │   ├── Search.svelte       # 搜索组件
│   │   ├── Category.svelte     # 分类展示组件
│   │   ├── LinkCard.svelte     # 网站卡片组件
│   │   ├── ThemeToggle.svelte  # 主题切换组件
│   │   ├── Favorites.svelte    # 收藏管理组件
│   │   ├── ScrollToTop.svelte  # 返回顶部组件
│   │   └── utils.js            # 工具函数
│   ├── App.svelte          # 主应用组件
│   ├── main.js             # 入口文件
│   └── app.css             # 全局样式
├── index.html              # HTML 模板
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
└── postcss.config.js       # PostCSS 配置
```

## 数据格式

### 一级分类数据 (data.json)

```json
[
  {
    "id": "dev-tools",
    "category": "开发工具",
    "icon": "fas fa-code",
    "file": "dev-tools.json"
  }
]
```

### 二级分类数据 (dev-tools.json)

```json
[
  {
    "subcategory": "代码托管",
    "sites": [
      {
        "name": "GitHub",
        "url": "https://github.com/",
        "favicon": "/icons/github.svg",
        "description": "全球最大的代码托管平台"
      }
    ]
  }
]
```

### 网站数据字段说明

- `name`: 网站名称（必填）
- `url`: 网站链接（必填）
- `description`: 网站描述（可选）
- `favicon`: 本地图标路径（可选，优先级最高）

## 图标加载逻辑

1. **本地图标** - 如果数据中提供了 `favicon` 字段，优先使用本地图标
2. **Favicon.im API** - 如果未提供本地图标，使用 `https://favicon.im/{domain}` 获取图标
3. **默认图标** - 如果以上都失败，使用默认图标 `/icons/default.svg`


## 主要功能说明

### 搜索功能

- 实时搜索网站名称和描述
- 200ms 防抖优化，提升性能
- 搜索结果高亮显示

### 收藏功能

- 点击网站卡片上的星标图标即可收藏/取消收藏
- 收藏数据存储在浏览器 LocalStorage
- 支持导出/导入 JSON 文件，方便多设备同步
- 收藏页面显示所有收藏的网站，按分类组织

### 主题切换

- 支持明亮/暗黑两种主题
- 主题偏好存储在 LocalStorage

### 响应式设计

- **PC 端**: 左侧固定导航栏 + 右侧多列卡片展示, 支持手动显示/隐藏侧边栏
- **移动端**: 左侧导航收起为顶部菜单按钮，单列卡片展示

## 开发规范

- 文件编码：UTF-8
- 行尾符：LF
- 代码风格：遵循 Svelte 和 Tailwind CSS 最佳实践
- 组件化：功能模块拆分清晰，提高代码复用性

## 许可证

MIT
