const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 减少到2MB限制，确保快速处理
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
});

// 健康检查路由
app.get('/health', (req, res) => {
    console.log('收到健康检查请求');
    const healthResponse = {
        status: 'ok',
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'production',
        platform: 'vercel'
    };
    console.log('返回健康检查响应:', healthResponse);
    res.json(healthResponse);
});

// OCR上传路由
app.post('/upload', upload.single('image'), async (req, res) => {
    console.log('收到OCR请求');
    
    try {
        if (!req.file) {
            console.log('错误: 没有文件上传');
            return res.status(400).json({
                success: false,
                error: '没有文件上传'
            });
        }

        console.log('文件信息:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // 将文件转换为base64
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        // 调用n8n Webhook进行真实OCR处理
        const webhookUrl = 'https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6';
        
        console.log('调用n8n Webhook...');
        
        const webhookResponse = await axios.post(webhookUrl, {
            image: `data:${mimeType};base64,${base64Image}`,
            filename: req.file.originalname
        }, {
            timeout: 8000, // 8秒超时，给OCR处理充足时间
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Webhook响应状态:', webhookResponse.status);
        console.log('Webhook响应数据:', webhookResponse.data);

        // 返回成功响应
        res.json({
            success: true,
            data: webhookResponse.data,
            filename: req.file.originalname,
            filesize: req.file.size
        });

    } catch (error) {
        console.error('OCR处理错误:', error);
        
        if (error.code === 'ECONNABORTED') {
            res.status(408).json({
                success: false,
                error: '处理超时，请使用2MB以下的图片重试'
            });
        } else if (error.response) {
            console.error('Webhook错误响应:', error.response.data);
            res.status(error.response.status).json({
                success: false,
                error: `识别服务错误: ${error.response.status}`,
                details: error.response.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: '服务器内部错误，请稍后重试',
                details: error.message
            });
        }
    }
});

// API专用路由，静态文件由Vercel直接处理

// 404处理
app.use((req, res) => {
    console.log('404请求:', req.method, req.path);
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        error: '服务器内部错误',
        message: error.message
    });
});

// 导出给Vercel
module.exports = app; 