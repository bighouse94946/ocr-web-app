# OCR 图片识别 Web 应用

一个美观简洁的蓝白色主题OCR图片识别Web应用，支持图片上传和文字识别功能。

## 功能特性

- 🖼️ **图片上传**: 支持点击上传和拖拽上传
- 🔍 **OCR识别**: 调用webhook进行图片文字识别
- 📱 **响应式设计**: 适配桌面和移动设备
- 🎨 **美观界面**: 蓝白色主题，简洁现代
- 📋 **文本复制**: 一键复制识别结果
- ⌨️ **快捷键支持**: Ctrl+V粘贴图片，ESC重置
- 🔄 **错误处理**: 完善的错误提示和重试机制

## 技术栈

- **后端**: Node.js + Express
- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **文件上传**: Multer
- **HTTP客户端**: Axios
- **样式**: 原生CSS，渐变背景，毛玻璃效果

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动应用

```bash
# 生产环境
npm start

# 开发环境（需要安装nodemon）
npm run dev
```

### 3. 访问应用

打开浏览器访问: http://localhost:3000

## 配置OCR Webhook

### 环境变量配置

设置环境变量 `OCR_WEBHOOK_URL` 来连接您的OCR服务：

```bash
# Linux/Mac
export OCR_WEBHOOK_URL="https://your-ocr-service.com/api/ocr"

# Windows
set OCR_WEBHOOK_URL=https://your-ocr-service.com/api/ocr
```

### Webhook接口规范

您的OCR webhook应该接受以下格式的POST请求：

**请求格式:**
```json
{
  "imageUrl": "http://localhost:3000/uploads/image-123456789.jpg",
  "imagePath": "uploads/image-123456789.jpg"
}
```

**响应格式:**
```json
{
  "success": true,
  "text": "识别到的文字内容",
  "confidence": 0.95,
  "language": "zh-CN"
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "识别失败的原因",
  "text": ""
}
```

## 部署说明

### 本地部署

1. 确保已安装 Node.js (版本 >= 14)
2. 克隆或下载项目代码
3. 运行 `npm install` 安装依赖
4. 运行 `npm start` 启动服务
5. 访问 http://localhost:3000

### 云服务器部署

1. 将代码上传到服务器
2. 安装Node.js和npm
3. 运行 `npm install --production`
4. 设置环境变量（可选）
5. 使用PM2或其他进程管理器启动：

```bash
# 使用PM2
npm install -g pm2
pm2 start server.js --name "ocr-app"

# 或直接启动
npm start
```

### Docker部署

创建 `Dockerfile`:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

构建和运行：

```bash
docker build -t ocr-app .
docker run -p 3000:3000 -e OCR_WEBHOOK_URL="your-webhook-url" ocr-app
```

## 文件结构

```
ocr-web-app/
├── server.js              # Express服务器
├── package.json           # 项目配置和依赖
├── README.md             # 说明文档
├── public/               # 前端静态文件
│   ├── index.html        # 主页面
│   ├── style.css         # 样式文件
│   └── script.js         # 前端JavaScript
└── uploads/              # 上传文件存储目录（自动创建）
```

## 使用说明

1. **上传图片**: 点击上传区域或拖拽图片文件到页面
2. **等待识别**: 系统会自动调用OCR服务识别图片中的文字
3. **查看结果**: 识别完成后会显示原图片和识别出的文字内容
4. **复制文本**: 点击"复制文本"按钮将结果复制到剪贴板
5. **重新上传**: 点击"重新上传"按钮上传新的图片

## 支持的图片格式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- 其他浏览器支持的图片格式

## 限制说明

- 单个文件最大 10MB
- 只支持图片文件
- 需要现代浏览器支持（支持ES6+）

## 故障排除

### 常见问题

1. **上传失败**: 检查文件格式和大小是否符合要求
2. **识别失败**: 检查OCR webhook配置是否正确
3. **页面无法访问**: 检查端口是否被占用，防火墙设置
4. **样式异常**: 检查网络连接，确保能访问CDN资源

### 日志查看

服务器日志会显示：
- 文件上传状态
- OCR webhook调用结果
- 错误信息

## 开发说明

### 修改端口

在 `server.js` 中修改或设置环境变量：

```javascript
const PORT = process.env.PORT || 3000;
```

### 自定义样式

修改 `public/style.css` 文件来自定义界面样式。

### 添加功能

- 修改 `server.js` 添加后端功能
- 修改 `public/script.js` 添加前端功能
- 修改 `public/index.html` 调整页面结构

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！ 