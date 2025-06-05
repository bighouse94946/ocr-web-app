const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());

// 配置multer用于文件上传 - 适配Vercel使用内存存储
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    },
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件！'), false);
        }
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'OCR服务运行正常',
        timestamp: new Date().toISOString(),
        env: 'vercel-v1-adapted'
    });
});

// 主页路由（为了兼容性）
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>OCR服务</title></head>
        <body>
            <h1>OCR服务运行中</h1>
            <p>请访问主页面使用OCR功能</p>
            <p><a href="/public/index.html">前往OCR应用</a></p>
        </body>
        </html>
    `);
});

// 文件上传和OCR处理路由
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的图片文件' });
        }

        const imageBuffer = req.file.buffer;
        const imageUrl = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
        
        console.log('图片上传成功:', req.file.originalname);
        console.log('图片大小:', req.file.size);
        
        // 调用OCR webhook
        const webhookUrl = process.env.OCR_WEBHOOK_URL || 'https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6';
        
        let ocrResult;
        if (webhookUrl && webhookUrl !== 'demo') {
            try {
                console.log('正在调用webhook...');
                
                const FormData = require('form-data');
                const formData = new FormData();
                
                formData.append('data', imageBuffer, {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                });
                
                formData.append('fileName', req.file.originalname);
                formData.append('mimeType', req.file.mimetype);
                formData.append('imageUrl', imageUrl);
                
                const response = await axios.post(webhookUrl, formData, {
                    timeout: 25000,
                    headers: {
                        ...formData.getHeaders()
                    }
                });
                
                console.log('Webhook响应状态:', response.status);
                
                let webhookData = response.data;
                
                if (typeof webhookData === 'string' && webhookData.trim() === '') {
                    ocrResult = {
                        success: true,
                        text: '✅ Webhook连接成功，但返回了空结果。请检查n8n工作流配置。',
                        confidence: 0,
                        language: 'unknown',
                        webhookStatus: 'connected_empty'
                    };
                } else if (typeof webhookData === 'object' && webhookData !== null) {
                    let extractedText = '';
                    let confidence = 0.8;
                    
                    if (webhookData.candidates && webhookData.candidates.length > 0) {
                        const candidate = webhookData.candidates[0];
                        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                            extractedText = candidate.content.parts[0].text || '';
                            if (candidate.avgLogprobs) {
                                confidence = Math.max(0.1, Math.min(1.0, 1 + candidate.avgLogprobs));
                            }
                        }
                    }
                    
                    if (!extractedText) {
                        extractedText = webhookData.text || webhookData.result || webhookData.content || '未能提取到文本内容';
                    }
                    
                    ocrResult = {
                        success: true,
                        text: extractedText,
                        confidence: confidence,
                        language: webhookData.language || 'auto-detected',
                        webhookStatus: 'gemini_response',
                        model: webhookData.modelVersion || 'gemini-2.0-flash',
                        tokenCount: webhookData.usageMetadata?.totalTokenCount || 0
                    };
                } else {
                    ocrResult = {
                        success: true,
                        text: String(webhookData) || 'OCR处理完成',
                        confidence: 0.8,
                        language: 'unknown',
                        webhookStatus: 'text_response'
                    };
                }
                
            } catch (webhookError) {
                console.error('Webhook调用失败:', webhookError.message);
                ocrResult = {
                    success: false,
                    error: 'OCR服务调用失败: ' + webhookError.message,
                    text: '',
                    webhookStatus: 'failed'
                };
            }
        } else {
            // 模拟OCR结果
            ocrResult = {
                success: true,
                text: `🎯 Vercel适配版本测试成功！\n\n基于第一个版本适配的OCR识别结果。\n\n上传的图片信息：\n- 文件名: ${req.file.originalname}\n- 文件大小: ${(req.file.size / 1024).toFixed(1)} KB\n- 文件类型: ${req.file.mimetype}\n\n✅ 架构适配完成，可以正常处理图片上传和OCR识别！`,
                confidence: 0.95,
                language: 'zh-CN',
                webhookStatus: 'simulation',
                model: 'Vercel适配测试模式',
                tokenCount: 0
            };
        }

        res.json({
            success: true,
            filename: 'vercel-' + Date.now() + '-' + req.file.originalname,
            originalName: req.file.originalname,
            imageUrl: imageUrl,
            ocrResult: ocrResult
        });

    } catch (error) {
        console.error('处理上传文件时出错:', error);
        res.status(500).json({ 
            error: '服务器内部错误: ' + error.message 
        });
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小超过限制（最大10MB）' });
        }
    }
    res.status(500).json({ error: error.message });
});

// 404处理
app.use((req, res) => {
    console.log('404 - 路由未找到:', req.url);
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method,
        message: '请访问正确的API端点'
    });
});

// 导出给Vercel
module.exports = app;

// 如果直接运行（本地开发）
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Vercel适配版OCR服务已启动，访问地址: http://localhost:${PORT}`);
        console.log(`环境变量 OCR_WEBHOOK_URL: ${process.env.OCR_WEBHOOK_URL || '未设置（使用模拟数据）'}`);
    });
} 