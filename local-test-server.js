const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB限制
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

// 添加请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '本地测试服务器运行正常',
        timestamp: new Date().toISOString(),
        env: 'local-test'
    });
});

// OCR识别端点 - 与Vercel API完全相同的逻辑
app.post(['/upload', '/api/recognize'], upload.single('image'), async (req, res) => {
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

        // 调用n8n Webhook
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
            timeout: 25000,
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log('Webhook响应状态:', webhookResponse.status);
        console.log('Webhook响应数据:', webhookResponse.data);

        // 处理n8n响应数据 - 与Vercel API相同的解析逻辑
        let ocrResult;
        
        console.log('n8n响应详细分析:');
        console.log('- 数据类型:', typeof webhookResponse.data);
        console.log('- 数据内容:', JSON.stringify(webhookResponse.data, null, 2));
        
        try {
            const responseData = webhookResponse.data;
            
            // 检查是否有candidates数组（标准Gemini API响应格式）
            if (responseData && responseData.candidates && responseData.candidates[0]) {
                const candidate = responseData.candidates[0];
                const content = candidate.content;
                const usageMetadata = responseData.usageMetadata;
                
                // 提取OCR识别文本
                let extractedText = '';
                if (content && content.parts && content.parts[0]) {
                    extractedText = content.parts[0].text || '';
                }
                
                ocrResult = {
                    text: extractedText || '识别完成，但未提取到文本内容',
                    model: 'Google Gemini 2.0 Flash (via n8n) - LOCAL TEST',
                    confidence: 0.95,
                    tokenCount: usageMetadata ? usageMetadata.totalTokenCount : extractedText.length,
                    finishReason: candidate.finishReason || 'STOP',
                    promptTokenCount: usageMetadata ? usageMetadata.promptTokenCount : 0,
                    candidatesTokenCount: usageMetadata ? usageMetadata.candidatesTokenCount : 0
                };
                
                console.log('✅ 本地测试 - 成功解析Gemini API响应');
                console.log('- 识别文本长度:', extractedText.length);
                console.log('- Token使用量:', ocrResult.tokenCount);
                
            } else if (typeof responseData === 'string' && responseData.trim()) {
                // 处理字符串响应
                try {
                    const parsedData = JSON.parse(responseData);
                    if (parsedData.candidates) {
                        const candidate = parsedData.candidates[0];
                        ocrResult = {
                            text: candidate.content.parts[0].text || responseData,
                            model: 'Google Gemini 2.0 Flash - LOCAL TEST',
                            confidence: 0.95,
                            tokenCount: parsedData.usageMetadata?.totalTokenCount || responseData.length
                        };
                    } else {
                        ocrResult = {
                            text: responseData,
                            model: 'Google Gemini 2.0 Flash - LOCAL TEST',
                            confidence: 0.95,
                            tokenCount: responseData.length
                        };
                    }
                } catch {
                    ocrResult = {
                        text: responseData,
                        model: 'Google Gemini 2.0 Flash - LOCAL TEST',
                        confidence: 0.95,
                        tokenCount: responseData.length
                    };
                }
            } else {
                // 空响应或其他格式
                ocrResult = {
                    text: `[本地测试 - 调试信息]\n\nn8n Workflow执行成功，但返回数据格式不符合预期。\n\n返回数据类型: ${typeof responseData}\n返回数据内容: ${JSON.stringify(responseData)}\n\n文件信息：\n- 文件名: ${req.file.originalname}\n- 文件大小: ${(req.file.size / 1024).toFixed(1)} KB\n- 处理状态: 等待正确的响应格式`,
                    model: '本地测试 - n8n调试模式',
                    confidence: 0,
                    tokenCount: 0
                };
            }
        } catch (error) {
            console.error('❌ 本地测试 - 解析n8n响应数据时出错:', error);
            ocrResult = {
                text: `本地测试 - 解析响应数据时出错: ${error.message}\n\n原始数据: ${JSON.stringify(webhookResponse.data)}`,
                model: 'Local Test Error Handler',
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
            filesize: req.file.size,
            environment: 'local-test'
        });

    } catch (error) {
        console.error('本地测试 - OCR处理错误:', error);
        
        if (error.code === 'ECONNABORTED') {
            res.status(408).json({
                success: false,
                error: '处理超时，请使用2MB以下的图片重试',
                environment: 'local-test'
            });
        } else if (error.response) {
            console.error('本地测试 - Webhook错误响应:', error.response.data);
            res.status(error.response.status).json({
                success: false,
                error: `识别服务错误: ${error.response.status}`,
                details: error.response.data,
                environment: 'local-test'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '服务器内部错误，请稍后重试',
                details: error.message,
                environment: 'local-test'
            });
        }
    }
});

// 静态文件服务
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 404处理
app.use((req, res) => {
    console.log('404 - 路由未找到:', req.url);
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method,
        environment: 'local-test'
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('本地测试服务器错误:', error);
    res.status(500).json({
        error: '服务器内部错误',
        message: error.message,
        environment: 'local-test'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🚀 本地测试服务器启动成功!`);
    console.log(`📍 本地地址: http://localhost:${PORT}`);
    console.log(`🔍 OCR测试: http://localhost:${PORT}/api/recognize`);
    console.log(`💚 健康检查: http://localhost:${PORT}/health`);
    console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
    console.log(`🎯 这个服务器使用与Vercel相同的API逻辑`);
    console.log('='.repeat(60));
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 收到关闭信号，正在关闭本地测试服务器...');
    process.exit(0);
}); 