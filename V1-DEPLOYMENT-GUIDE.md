# 🚀 OCR Web应用 - V1版本部署指南

## 📋 项目概述

基于第一个成功版本，适配Vercel Serverless架构的OCR图片识别Web应用。

### 🔧 技术栈
- **后端**: Node.js + Express + Multer + Axios
- **前端**: HTML5 + CSS3 + 原生JavaScript (蓝白渐变主题)
- **OCR服务**: Google Gemini 2.0 Flash模型 (通过n8n webhook)
- **部署**: Vercel Serverless Functions
- **存储**: 内存存储 (适配Serverless)

## 📂 项目结构

```
ocr/
├── api/
│   └── server.js           # Vercel Serverless API
├── public/
│   ├── index.html          # 主页面
│   ├── style.css           # 样式文件
│   └── script.js           # 前端逻辑
├── server.js               # 本地开发服务器
├── vercel.json             # Vercel配置
├── test-webhook.js         # Webhook测试工具
├── test-v1-adapted.html    # 测试页面
├── n8n-webhook-fix.md      # n8n配置指南
└── package.json
```

## 🛠️ 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 启动本地服务器
```bash
# 原始版本 (3000端口)
node server.js

# Vercel适配版本 (3001端口)
cd api && node server.js
```

### 3. 访问应用
- **主应用**: http://localhost:3000
- **健康检查**: http://localhost:3000/health
- **测试页面**: 打开 `test-v1-adapted.html`

## 🔗 Webhook配置

### n8n Webhook URL
```
https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6
```

### 测试Webhook连接
```bash
node test-webhook.js
```

### 修复n8n配置 (如果返回空数据)
参考 `n8n-webhook-fix.md` 中的详细说明。

## 🚀 Vercel部署

### 1. 推送代码到GitHub
```bash
git add .
git commit -m "准备Vercel部署"
git push origin v1-original
```

### 2. 在Vercel中部署
1. 登录 [Vercel控制台](https://vercel.com)
2. 导入GitHub仓库
3. 选择 `v1-original` 分支
4. 部署配置自动检测 (`vercel.json`)

### 3. 环境变量 (可选)
如果需要覆盖默认webhook URL：
```
OCR_WEBHOOK_URL=https://your-custom-webhook-url
```

### 4. 自定义域名
在Vercel项目设置中添加：
```
ocr.bighouse94946.fun
```

## 🧪 测试部署

### 1. 健康检查
```bash
curl https://ocr.bighouse94946.fun/health
```

### 2. 使用测试页面
访问部署后的 `test-v1-adapted.html` 或主应用页面

### 3. OCR功能测试
1. 上传包含文字的图片
2. 查看识别结果
3. 检查响应时间 (预期1-3秒)

## 📊 性能指标

- **文件大小限制**: 10MB
- **响应超时**: 25秒
- **Vercel函数超时**: 30秒
- **预期响应时间**: 1-3秒
- **支持格式**: JPG, PNG, GIF

## 🐛 故障排除

### 1. Webhook连接失败
```bash
# 测试webhook连接
node test-webhook.js

# 检查n8n工作流状态
# 访问 https://n8n.bighouse94946.fun
```

### 2. 返回空数据
- 参考 `n8n-webhook-fix.md`
- 检查"Respond to Webhook"节点配置
- 确保HTTP Request节点正常工作

### 3. 404错误
- 检查 `vercel.json` 路由配置
- 确保文件路径正确
- 查看Vercel部署日志

### 4. 超时错误
- 检查图片文件大小 (< 10MB)
- 验证n8n工作流响应时间
- 查看Vercel函数日志

## 🔄 版本对比

| 特性 | 本地版本 | Vercel版本 |
|------|----------|------------|
| 存储方式 | 磁盘存储 | 内存存储 |
| 文件处理 | 文件流 | Buffer |
| 端口 | 3000 | Serverless |
| 静态文件 | Express | Vercel Static |
| 环境 | local-original | vercel-v1-adapted |

## 📝 更新日志

### v1.0 (原始版本)
- ✅ 基础OCR功能
- ✅ 图片上传和预览
- ✅ 蓝白渐变UI主题
- ✅ 本地磁盘存储

### v1.1 (Vercel适配)
- ✅ Serverless架构适配
- ✅ 内存存储替代磁盘存储
- ✅ Vercel路由配置
- ✅ 健康检查端点
- ✅ Webhook测试工具
- ✅ 部署指南和故障排除

## 🎯 下一步计划

- [ ] 添加更多图片格式支持
- [ ] 实现图片压缩优化
- [ ] 添加批量处理功能
- [ ] 优化响应时间
- [ ] 添加用户认证

---

**🚀 快速开始**: `npm install && node server.js`  
**📱 在线访问**: https://ocr.bighouse94946.fun  
**🧪 测试工具**: `node test-webhook.js` 