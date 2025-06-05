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
        
        // 为n8n Extract from File节点发送二进制文件数据
        const FormData = require('form-data');
        const formData = new FormData();
        
        // 将base64转换回Buffer（二进制数据）
        const imageBuffer = Buffer.from(base64Image, 'base64');
        
        // 添加文件数据，字段名为"data"以匹配n8n节点配置
        formData.append('data', imageBuffer, {
            filename: req.file.originalname,
            contentType: mimeType
        });
        
        const webhookResponse = await axios.post(webhookUrl, formData, {
            timeout: 25000, // 增加到25秒，给n8n OCR处理充足时间
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log('Webhook响应状态:', webhookResponse.status);
        console.log('Webhook响应数据:', webhookResponse.data);

        // 处理n8n响应数据
        let ocrResult;
        
        console.log('n8n响应详细分析:');
        console.log('- 数据类型:', typeof webhookResponse.data);
        console.log('- 数据长度:', webhookResponse.data ? webhookResponse.data.length : 'null');
        console.log('- 响应头:', webhookResponse.headers);
        
        if (!webhookResponse.data || webhookResponse.data === '') {
            // n8n workflow执行成功但返回空数据
            ocrResult = {
                text: `[n8n Workflow执行成功 ✅]\n\n所有节点都已正常执行，但"Respond to Webhook"节点返回空数据。\n\n请检查：\n1. "Respond to Webhook"节点是否设置了返回数据\n2. HTTP Request节点是否成功调用了Gemini API\n3. 返回数据的格式是否正确\n\n文件信息：\n- 文件名: ${req.file.originalname}\n- 文件大小: ${(req.file.size / 1024).toFixed(1)} KB\n- 处理状态: workflow完成，等待配置返回数据`,
                model: 'n8n Workflow (执行成功)',
                confidence: 1.0,
                tokenCount: 0
            };
        } else if (typeof webhookResponse.data === 'string' && webhookResponse.data.trim()) {
            // 如果返回非空字符串，可能是OCR文本或JSON字符串
            let parsedData;
            try {
                parsedData = JSON.parse(webhookResponse.data);
                ocrResult = {
                    text: parsedData.text || parsedData.ocrResult?.text || webhookResponse.data,
                    model: parsedData.model || 'Google Gemini 2.0 Flash',
                    confidence: parsedData.confidence || 0.95,
                    tokenCount: parsedData.tokenCount || webhookResponse.data.length
                };
            } catch {
                // 如果不是JSON，当作纯文本处理
                ocrResult = {
                    text: webhookResponse.data,
                    model: 'Google Gemini 2.0 Flash',
                    confidence: 0.95,
                    tokenCount: webhookResponse.data.length
                };
            }
        } else if (typeof webhookResponse.data === 'object') {
            // 如果返回对象，直接解析
            ocrResult = {
                text: webhookResponse.data.text || webhookResponse.data.ocrResult?.text || '识别完成，但未返回文本内容',
                model: webhookResponse.data.model || 'Google Gemini 2.0 Flash',
                confidence: webhookResponse.data.confidence || 0.95,
                tokenCount: webhookResponse.data.tokenCount || 0
            };
        } else {
            ocrResult = {
                text: `未知的返回数据格式: ${typeof webhookResponse.data}`,
                model: 'n8n调试',
                confidence: 0,
                tokenCount: 0
            };
        }

        // 返回成功响应
        res.json({
            success: true,
            data: {
                ocrResult: ocrResult
            },
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