const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testWebhook() {
    const webhookUrl = 'https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6';
    
    console.log('🧪 测试n8n webhook连接...');
    console.log('📍 Webhook URL:', webhookUrl);
    
    try {
        // 创建一个简单的测试图片数据 (1x1像素的PNG)
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x01, 0xF6, 0x04, 0xF8, 0x4A, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        const formData = new FormData();
        formData.append('data', testImageBuffer, {
            filename: 'test-image.png',
            contentType: 'image/png'
        });
        formData.append('fileName', 'test-image.png');
        formData.append('mimeType', 'image/png');
        formData.append('imageUrl', 'data:image/png;base64,' + testImageBuffer.toString('base64'));
        
        console.log('📤 发送测试图片到webhook...');
        
        const startTime = Date.now();
        const response = await axios.post(webhookUrl, formData, {
            timeout: 30000,
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'OCR-Test-Tool/1.0'
            }
        });
        const endTime = Date.now();
        
        console.log('✅ Webhook响应成功!');
        console.log('📊 响应信息:');
        console.log('   - 状态码:', response.status);
        console.log('   - 响应时间:', (endTime - startTime) + 'ms');
        console.log('   - 响应大小:', JSON.stringify(response.data).length + ' 字符');
        console.log('   - 响应类型:', typeof response.data);
        
        console.log('\n📋 响应数据:');
        if (typeof response.data === 'string') {
            if (response.data.trim() === '') {
                console.log('   ⚠️  空字符串响应 - n8n可能需要配置"Respond to Webhook"节点');
            } else {
                console.log('   📝 文本响应:', response.data);
            }
        } else if (typeof response.data === 'object') {
            console.log('   📦 JSON响应:', JSON.stringify(response.data, null, 2));
            
            // 检查Gemini格式
            if (response.data.candidates && response.data.candidates.length > 0) {
                const candidate = response.data.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    console.log('\n🎯 检测到Gemini格式响应!');
                    console.log('   📝 识别文本:', candidate.content.parts[0].text);
                    console.log('   📊 置信度分数:', candidate.avgLogprobs);
                    if (response.data.usageMetadata) {
                        console.log('   🔢 Token使用:', response.data.usageMetadata.totalTokenCount);
                    }
                }
            }
        }
        
        return {
            success: true,
            status: response.status,
            responseTime: endTime - startTime,
            data: response.data
        };
        
    } catch (error) {
        console.log('❌ Webhook测试失败!');
        console.log('📊 错误信息:');
        console.log('   - 错误类型:', error.name);
        console.log('   - 错误消息:', error.message);
        
        if (error.response) {
            console.log('   - HTTP状态:', error.response.status);
            console.log('   - 状态文本:', error.response.statusText);
            console.log('   - 响应数据:', error.response.data);
        } else if (error.request) {
            console.log('   - 网络错误: 无法连接到webhook');
        }
        
        return {
            success: false,
            error: error.message,
            status: error.response?.status || 'network_error'
        };
    }
}

// 如果直接运行此文件
if (require.main === module) {
    console.log('🚀 开始n8n webhook测试...\n');
    
    testWebhook()
        .then(result => {
            console.log('\n🏁 测试完成!');
            if (result.success) {
                console.log('✅ 测试结果: 成功');
                console.log(`⏱️  响应时间: ${result.responseTime}ms`);
            } else {
                console.log('❌ 测试结果: 失败');
                console.log('💡 建议: 检查n8n工作流是否正常运行');
            }
        })
        .catch(err => {
            console.log('\n💥 测试过程出现异常:', err.message);
        });
}

module.exports = { testWebhook }; 