const axios = require('axios');

async function testWebhook() {
    console.log('🔍 开始测试Webhook...');
    
    try {
        const webhookUrl = 'https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6';
        
        // 创建一个小的测试图片（1x1像素的PNG base64）
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        
        console.log('📤 发送测试请求...');
        const startTime = Date.now();
        
        const response = await axios.post(webhookUrl, {
            image: testImage,
            filename: 'test.png'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ Webhook测试成功!');
        console.log(`⏱️  响应时间: ${duration}ms`);
        console.log('📊 响应状态:', response.status);
        console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Webhook测试失败:');
        
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ 请求超时');
        } else if (error.response) {
            console.error('📊 响应状态:', error.response.status);
            console.error('📋 错误数据:', error.response.data);
        } else {
            console.error('🔧 网络错误:', error.message);
        }
    }
}

// 运行测试
testWebhook(); 