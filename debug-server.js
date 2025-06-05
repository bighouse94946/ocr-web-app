const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 添加请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('请求头:', JSON.stringify(req.headers, null, 2));
    next();
});

// 健康检查接口
app.get('/health', (req, res) => {
    console.log('收到健康检查请求');
    const response = {
        status: 'ok',
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        port: PORT
    };
    console.log('返回健康检查响应:', response);
    res.json(response);
});

// 简单的上传测试接口
app.post('/upload', (req, res) => {
    console.log('收到上传请求');
    console.log('Content-Type:', req.headers['content-type']);
    
    const response = {
        success: true,
        message: '上传接口可以访问',
        timestamp: new Date().toISOString(),
        receivedHeaders: req.headers
    };
    
    console.log('返回上传响应:', response);
    res.json(response);
});

// 主页
app.get('/', (req, res) => {
    console.log('收到主页请求');
    res.sendFile(__dirname + '/public/index.html');
});

// 测试页面
app.get('/test', (req, res) => {
    console.log('收到测试页面请求');
    res.sendFile(__dirname + '/public/test.html');
});

// 404处理
app.use((req, res) => {
    console.log('404 - 路由未找到:', req.url);
    res.status(404).json({ 
        error: '请求的资源未找到',
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// 错误处理
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({ 
        error: '服务器内部错误',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 调试服务器启动成功!`);
    console.log(`📍 本地地址: http://localhost:${PORT}`);
    console.log(`🔍 测试页面: http://localhost:${PORT}/test.html`);
    console.log(`💚 健康检查: http://localhost:${PORT}/health`);
    console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
    console.log('='.repeat(50));
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 收到关闭信号，正在关闭服务器...');
    process.exit(0);
}); 