const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 创建uploads目录
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// 提供uploads目录的静态文件服务
app.use('/uploads', express.static('uploads'));

// 添加调试中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康检查路由
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// 文件上传和OCR处理路由
app.post('/upload', upload.single('image'), async (req, res) => {
    console.log('收到上传请求');
    console.log('请求头:', req.headers);
    console.log('文件信息:', req.file);
    
    try {
        if (!req.file) {
            console.log('没有接收到文件');
            return res.status(400).json({ error: '请选择要上传的图片文件' });
        }

        const imagePath = req.file.path;
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        console.log('图片上传成功:', req.file.filename);
        console.log('图片URL:', imageUrl);
        console.log('图片本地路径:', imagePath);
        
        // 调用OCR webhook
        const webhookUrl = process.env.OCR_WEBHOOK_URL || 'https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6';
        console.log('Webhook URL:', webhookUrl);
        
        let ocrResult;
        if (webhookUrl && !webhookUrl.includes('模拟')) {
            try {
                console.log('正在调用webhook...');
                
                // 使用multipart/form-data发送真实文件
                const FormData = require('form-data');
                const formData = new FormData();
                
                // 添加文件数据
                formData.append('data', fs.createReadStream(imagePath), {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                });
                
                // 添加其他元数据
                formData.append('fileName', req.file.originalname);
                formData.append('mimeType', req.file.mimetype);
                formData.append('imageUrl', imageUrl);
                
                console.log('使用multipart/form-data格式发送文件...');
                
                const response = await axios.post(webhookUrl, formData, {
                    timeout: 30000,
                    headers: {
                        ...formData.getHeaders()
                    }
                });
                
                console.log('Webhook响应状态:', response.status);
                console.log('Webhook原始响应数据:', JSON.stringify(response.data));
                
                // 处理不同类型的响应
                let webhookData = response.data;
                
                // 如果响应是空字符串
                if (typeof webhookData === 'string' && webhookData.trim() === '') {
                    console.log('Webhook返回空字符串');
                    ocrResult = {
                        success: true,
                        text: '✅ Webhook连接成功，但返回了空结果。\n\n请检查n8n工作流中Extract from File节点的配置。',
                        confidence: 0,
                        language: 'unknown',
                        webhookStatus: 'connected_empty'
                    };
                }
                // 如果webhookData是对象，处理Google Gemini格式的响应
                else if (typeof webhookData === 'object' && webhookData !== null) {
                    let extractedText = '';
                    let confidence = 0.8;
                    
                    // 处理Google Gemini格式的响应
                    if (webhookData.candidates && webhookData.candidates.length > 0) {
                        const candidate = webhookData.candidates[0];
                        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                            extractedText = candidate.content.parts[0].text || '';
                            // 计算置信度（基于avgLogprobs）
                            if (candidate.avgLogprobs) {
                                confidence = Math.max(0.1, Math.min(1.0, 1 + candidate.avgLogprobs));
                            }
                        }
                    }
                    
                    // 如果没有提取到文字，尝试其他字段
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
                        tokenCount: webhookData.usageMetadata?.totalTokenCount || 0,
                        originalResponse: webhookData
                    };
                }
                // 如果是字符串但不为空
                else if (typeof webhookData === 'string') {
                    try {
                        const parsedData = JSON.parse(webhookData);
                        // 递归处理解析后的数据
                        webhookData = parsedData;
                        // 重新处理
                        if (webhookData.candidates && webhookData.candidates.length > 0) {
                            const candidate = webhookData.candidates[0];
                            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                                ocrResult = {
                                    success: true,
                                    text: candidate.content.parts[0].text || '',
                                    confidence: Math.max(0.1, Math.min(1.0, 1 + (candidate.avgLogprobs || -0.2))),
                                    language: 'auto-detected',
                                    webhookStatus: 'gemini_response',
                                    model: webhookData.modelVersion || 'gemini-2.0-flash',
                                    tokenCount: webhookData.usageMetadata?.totalTokenCount || 0
                                };
                            }
                        }
                    } catch (e) {
                        // 如果不是JSON，直接作为文本处理
                        ocrResult = {
                            success: true,
                            text: webhookData,
                            confidence: 0.8,
                            language: 'unknown',
                            webhookStatus: 'text_response'
                        };
                    }
                }
                
                // 如果仍然没有设置ocrResult，设置默认值
                if (!ocrResult) {
                    ocrResult = {
                        success: true,
                        text: '✅ Webhook连接成功！\n\n收到响应：' + JSON.stringify(webhookData),
                        confidence: 0.8,
                        language: 'unknown',
                        webhookStatus: 'unknown_format'
                    };
                }
                
            } catch (webhookError) {
                console.error('Webhook调用失败:');
                console.error('错误消息:', webhookError.message);
                if (webhookError.response) {
                    console.error('响应状态:', webhookError.response.status);
                    console.error('响应数据:', webhookError.response.data);
                }
                ocrResult = {
                    success: false,
                    error: 'OCR服务调用失败: ' + webhookError.message,
                    text: '',
                    webhookStatus: 'failed'
                };
            }
        } else {
            // 模拟OCR结果（当webhook URL为空时）
            console.log('使用模拟OCR结果');
            ocrResult = {
                success: true,
                text: '这是模拟的OCR识别结果。\n\n请在环境变量中设置 OCR_WEBHOOK_URL 来连接真实的OCR服务。\n\n当前上传的图片: ' + req.file.originalname,
                confidence: 0.95,
                language: 'zh-CN',
                webhookStatus: 'simulation'
            };
        }

        console.log('最终OCR结果:', JSON.stringify(ocrResult, null, 2));

        // 返回结果
        res.json({
            success: true,
            filename: req.file.filename,
            originalName: req.file.originalname,
            imageUrl: imageUrl,
            ocrResult: ocrResult
        });

        // 清理上传的文件（可选）
        setTimeout(() => {
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('已清理临时文件:', imagePath);
                }
            } catch (cleanupError) {
                console.log('清理文件失败:', cleanupError.message);
            }
        }, 30000); // 30秒后清理

    } catch (error) {
        console.error('处理上传文件时出错:', error);
        res.status(500).json({ 
            error: '服务器内部错误: ' + error.message 
        });
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('应用错误:', error);
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小超过10MB限制' });
        }
    }
    res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
    console.log('404 - 未找到路由:', req.url);
    res.status(404).json({ error: '请求的资源未找到' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`OCR Web应用已启动，访问地址: http://localhost:${PORT}`);
    console.log(`环境变量 OCR_WEBHOOK_URL: ${process.env.OCR_WEBHOOK_URL || '未设置（使用默认webhook）'}`);
}); 