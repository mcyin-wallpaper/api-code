# Wallpaper时光机 - 壁纸API服务

一个基于Cloudflare Workers构建的高性能壁纸API服务，提供壁纸搜索、详情查询和浏览量统计功能。

## 项目概述

本项目是一个轻量级的壁纸API服务，部署在Cloudflare Workers平台上，具有以下特点：

- 🚀 全球低延迟访问
- 🔒 安全的API密钥管理
- 📦 零服务器运维成本
- ⚡ 自动弹性扩展
- 📊 实时流量分析

## 核心功能

### 1. 壁纸搜索
- 支持关键词搜索
- 可自定义返回结果数量（1-100条）
- 分页查询功能

### 2. 壁纸详情
- 根据壁纸ID获取详细信息
- 支持多种数据格式返回

### 3. 浏览量统计
- 自动记录壁纸浏览次数
- 实时更新浏览量数据

## 技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| Cloudflare Workers | 服务部署平台 | 2026-01-20 |
| JavaScript | 开发语言 | ES6+ |
| Coze API | 数据来源 | v1 |
| Wrangler | 开发工具 | 最新 |

## 安装与配置

### 环境要求

- Node.js 最新版本（LTS）+ 
- Wrangler CLI 最新版本

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/mcyin-wallpaper/api-code.git
cd api-code
```

2. **安装依赖**
```bash
npm install -g wrangler
```

3. **配置环境变量**

编辑 `wrangler.jsonc` 文件，替换以下配置：

```json
{
    "name": "your-worker-name",
    "vars": {
        "WORKFLOW_ID": "your-coze-workflow-id"
    }
}
```

### 本地开发

```bash
wrangler dev
```

### 部署到生产环境

```bash
wrangler publish
```

## 使用指南

### API端点

#### 搜索壁纸

**GET /api/search**

参数：
- `search`: 搜索关键词（可选，默认为空返回所有壁纸）
- `limit`: 返回结果数量（可选，默认1，范围1-100）
- ``: 页码（可选，默认1）

示例：
```bash
curl "https://your-worker-url/api/search?search=2026&limit=10&=1"
```

#### 获取壁纸详情

**GET /api/detail**

参数：
- `enddate`: 壁纸ID（必填，格式：yyyyMMdd）

示例：
```bash
curl "https://your-worker-url/api/detail?enddate=20260120"
```

#### 增加浏览量

**GET /api/view**

参数：
- `enddate`: 壁纸ID（必填，格式：yyyyMMdd）

示例：
```bash
curl "https://your-worker-url/api/view?enddate=20260120"
```

### 响应格式

所有API返回JSON格式数据：

```json
{
    "Next_Page": 1,
    "Page": 1,
    "Previous_Page": 1,
    "output": [
        {
            "copyright": "XXXX",
            "enddate": "XXXX",
            "title": "XXXX",
            "url": "XXXX",
            "views": 0
        }
    ]
}
```

## API文档

### 错误处理

| 状态码 | 错误信息 | 描述 |
|--------|----------|------|
| 400 | Missing enddate parameter | 缺少enddate参数 |
| 400 | Invalid enddate format. Must be yyyyMMdd | enddate格式错误 |
| 500 | Internal server error | 服务器内部错误 |

### CORS支持

服务支持跨域请求，允许所有来源访问：

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## 许可证信息

本项目采用MIT许可证，详见 [LICENSE](LICENSE) 文件。

## 联系方式

- 项目维护者：mcyin
- 邮箱：724651441@qq.com

---

**注意**: 本项目仅用于学习和研究目的，请遵守相关法律法规。