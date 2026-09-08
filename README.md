# 壁纸 API

基于 Cloudflare Workers 和 Supabase 构建的 Bing 每日壁纸 API 服务。

## 功能特性

- 从 Bing 获取每日壁纸数据
- 使用 Supabase 存储壁纸信息
- 提供搜索、详情查询、浏览量统计等 API
- 支持 GET 和 POST 请求方式
- 跨域支持（CORS）

## 环境变量

需要在 Cloudflare Workers 中配置以下环境变量：

- `SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `SUPABASE_TABLE_NAME` - 存储壁纸数据的表名

## API 接口

### 1. 搜索壁纸
- **路径**: `/wallpaper/search` 或 `/api/search`
- **方法**: GET / POST
- **参数**:
  - `search` - 搜索关键词（可选）
  - `page` - 页码（默认：1）
  - `limit` - 每页数量（默认：30，最大：100）

### 2. 获取壁纸详情
- **路径**: `/wallpaper/detail` 或 `/api/detail`
- **方法**: GET / POST
- **参数**:
  - `enddate` - 壁纸结束日期

### 3. 更新浏览量
- **路径**: `/wallpaper/view` 或 `/api/view`
- **方法**: GET / POST
- **参数**:
  - `enddate` - 壁纸结束日期

### 4. 更新壁纸数据
- **路径**: `/wallpaper/update` 或 `/api/update`
- **方法**: GET / POST
- **说明**: 从 Bing 获取最新壁纸并更新到数据库

## 数据库表结构

Supabase 表需要包含以下字段：
- `enddate` - 结束日期（主键）
- `url` - 壁纸 URL
- `copyright` - 版权信息
- `title` - 标题
- `views` - 浏览量

## 安装依赖

```bash
npm install @supabase/supabase-js && echo '{"name":"wallpaper-api","compatibility_date":"2026-09-08","main":"worker.js","vars":{"SUPABASE_URL":"https://.supabase.co","SUPABASE_TABLE_NAME":"bing_wallpaper_data"},"observability":{"logs":{"enabled":true,"head_sampling_rate":1,"invocation_logs":true,"persist":true},"traces":{"enabled":false,"head_sampling_rate":1,"persist":true}}}' > wrangler.jsonc
```

## 部署

使用 Wrangler 部署到 Cloudflare Workers：

```bash
wrangler deploy
```

## 技术栈

- Cloudflare Workers
- Supabase
- @supabase/supabase-js

## 开源协议

MIT License

