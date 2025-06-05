const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

// 模拟n8n返回的标准Gemini API响应格式（基于您的截图）
const mockGeminiResponse = {
    candidates: [
        {
            content: {
                parts: [
                    {
                        text: "这是一个测试识别结果：\n\n根据图片内容，我可以看到以下文字：\n- 一些中文文字内容\n- 数字和符号\n- 表格数据等\n\n这是完整的OCR识别结果。",
                        role: "model"
                    }
                ]
            },
            finishReason: "STOP",
            avgLogprobs: -0.022979018393527256
        }
    ],
    usageMetadata: {
        promptTokenCount: 1906,
        candidatesTokenCount: 712,
        totalTokenCount: 2618
    }
};

async function testGeminiFormatParsing() {
    console.log('🧪 测试Gemini API格式解析...\n');
    
    try {
        // 读取测试图片
        const imagePath = './test.png';
        if (!fs.existsSync(imagePath)) {
            console.log('❌ 测试图片不存在，创建一个模拟测试...');
            // 创建一个1x1像素的PNG
            const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA8tSKhwAAAABJRU5ErkJggg==', 'base64');
            fs.writeFileSync(imagePath, testImage);
            console.log('✅ 创建测试图片成功');
        }
        
        // 准备表单数据
        const form = new FormData();
        const fileBuffer = fs.readFileSync(imagePath);
        form.append('image', fileBuffer, {
            filename: 'test.png',
            contentType: 'image/png'
        });
        
        console.log('📤 发送测试请求到API...');
        
        // 发送到本地测试服务器（如果运行）或生产环境
        const testUrl = 'https://ocr.bighouse94946.fun/api/recognize';
        
        const response = await axios.post(testUrl, form, {
            headers: {
                ...form.getHeaders(),
                'Accept': 'application/json'
            },
            timeout: 30000
        });
        
        console.log('✅ API响应成功!');
        console.log('📊 响应状态:', response.status);
        console.log('📋 响应数据:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.text) {
            console.log('\n🎯 OCR文本提取成功:');
            console.log(response.data.text);
            console.log(`\n📈 统计信息:`);
            console.log(`- 模型: ${response.data.model}`);
            console.log(`- 置信度: ${response.data.confidence}`);
            console.log(`- Token数量: ${response.data.tokenCount}`);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('- 响应状态:', error.response.status);
            console.error('- 响应数据:', error.response.data);
        }
    }
}

async function testMockGeminiFormat() {
    console.log('\n🔬 测试模拟Gemini格式解析...\n');
    
    // 模拟API解析逻辑
    try {
        const responseData = mockGeminiResponse;
        
        if (responseData && responseData.candidates && responseData.candidates[0]) {
            const candidate = responseData.candidates[0];
            const content = candidate.content;
            const usageMetadata = responseData.usageMetadata;
            
            let extractedText = '';
            if (content && content.parts && content.parts[0]) {
                extractedText = content.parts[0].text || '';
            }
            
            const ocrResult = {
                text: extractedText || '识别完成，但未提取到文本内容',
                model: 'Google Gemini 2.0 Flash (via n8n)',
                confidence: 0.95,
                tokenCount: usageMetadata ? usageMetadata.totalTokenCount : extractedText.length,
                finishReason: candidate.finishReason || 'STOP',
                promptTokenCount: usageMetadata ? usageMetadata.promptTokenCount : 0,
                candidatesTokenCount: usageMetadata ? usageMetadata.candidatesTokenCount : 0
            };
            
            console.log('✅ 模拟解析成功!');
            console.log('📋 解析结果:');
            console.log(JSON.stringify(ocrResult, null, 2));
            
            console.log('\n🎯 提取的文本内容:');
            console.log(ocrResult.text);
            
        } else {
            console.log('❌ 模拟数据格式不正确');
        }
        
    } catch (error) {
        console.error('❌ 模拟解析失败:', error.message);
    }
}

// 运行测试
async function runTests() {
    console.log('🚀 开始API格式解析测试\n');
    console.log('=' * 50);
    
    await testMockGeminiFormat();
    
    console.log('\n' + '=' * 50);
    
    await testGeminiFormatParsing();
    
    console.log('\n✨ 测试完成!');
}

runTests(); 