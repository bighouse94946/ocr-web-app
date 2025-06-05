const multer = require('multer');
const axios = require('axios');

// 配置multer使用内存存储（适配Vercel）
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件！'), false);
        }
    }
});

module.exports = async (req, res) => {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持POST请求' });
    }

    // 使用multer处理文件上传
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('文件上传错误:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: '文件大小超过限制（最大10MB）' });
                }
            }
            return res.status(400).json({ error: err.message });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ error: '请选择要上传的图片文件' });
            }

            const imageBuffer = req.file.buffer;
            const imageUrl = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
            
            console.log('图片上传成功:', req.file.originalname);
            console.log('图片大小:', req.file.size);
            console.log('图片类型:', req.file.mimetype);
            
            // 调用OCR webhook - 使用与第一个版本相同的逻辑
            const webhookUrl = process.env.OCR_WEBHOOK_URL || 'https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6';
            console.log('使用webhook URL:', webhookUrl);
            
            let ocrResult;
            
            try {
                console.log('正在调用webhook...');
                
                // 使用multipart/form-data发送文件Buffer
                const FormData = require('form-data');
                const formData = new FormData();
                
                // 添加文件数据
                formData.append('data', imageBuffer, {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                });
                
                // 添加其他元数据
                formData.append('fileName', req.file.originalname);
                formData.append('mimeType', req.file.mimetype);
                formData.append('imageUrl', imageUrl);
                
                console.log('使用multipart/form-data格式发送文件...');
                
                const response = await axios.post(webhookUrl, formData, {
                    timeout: 25000, // 适配Vercel的30秒限制
                    headers: {
                        ...formData.getHeaders()
                    }
                });
                
                console.log('Webhook响应状态:', response.status);
                console.log('Webhook原始响应数据:', JSON.stringify(response.data));
                
                // 处理不同类型的响应 - 使用第一个版本的逻辑
                let webhookData = response.data;
                
                // 如果响应是空字符串
                if (typeof webhookData === 'string' && webhookData.trim() === '') {
                    console.log('Webhook返回空字符串');
                    ocrResult = {
                        success: true,
                        text: '✅ Webhook连接成功，但返回了空结果。\n\n请检查n8n工作流中Respond to Webhook节点的配置。\n\n建议设置响应体为: {{ $("HTTP Request").json }}',
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
                        } else {
                            // 如果不是Gemini格式，直接作为文本处理
                            ocrResult = {
                                success: true,
                                text: webhookData,
                                confidence: 0.8,
                                language: 'unknown',
                                webhookStatus: 'text_response'
                            };
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

            console.log('最终OCR结果:', JSON.stringify(ocrResult, null, 2));

            // 返回结果 - 使用与第一个版本相同的格式
            res.json({
                success: true,
                filename: 'vercel-' + Date.now() + '-' + req.file.originalname,
                originalName: req.file.originalname,
                imageUrl: imageUrl, // 使用data URL，因为Vercel无法存储文件
                ocrResult: ocrResult
            });

        } catch (error) {
            console.error('处理上传文件时出错:', error);
            res.status(500).json({ 
                error: '服务器内部错误: ' + error.message 
            });
        }
    });
}; 