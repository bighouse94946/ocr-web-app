const axios = require('axios');

async function simpleTest() {
    const webhookUrl = "https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6";
    
    console.log('🧪 简单Webhook测试');
    console.log('=' .repeat(40));
    
    try {
        // 测试1: 最简单的数据
        console.log('\n📤 发送简单测试数据...');
        const response1 = await axios.post(webhookUrl, {
            test: "简单测试",
            message: "Hello from OCR app"
        }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ 响应1:');
        console.log('- 状态:', response1.status);
        console.log('- 数据:', JSON.stringify(response1.data));
        console.log('- 数据长度:', JSON.stringify(response1.data).length);
        
        // 测试2: 模拟OCR数据但不包含大图片
        console.log('\n📤 发送模拟OCR数据...');
        const response2 = await axios.post(webhookUrl, {
            fileName: "test.png",
            mimeType: "image/png",
            imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGBBcARLyZBAAAAAElFTkSuQmCC", // 1x1像素图片
            testMode: true
        }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ 响应2:');
        console.log('- 状态:', response2.status);
        console.log('- 数据:', JSON.stringify(response2.data));
        console.log('- 数据长度:', JSON.stringify(response2.data).length);
        
        // 判断结果
        if (response1.data || response2.data) {
            console.log('\n🎉 成功！Webhook开始返回数据了！');
        } else {
            console.log('\n⚠️  Webhook仍然返回空数据');
            console.log('建议检查n8n工作流中的"Respond to Webhook"节点配置');
        }
        
    } catch (error) {
        console.log('\n❌ 测试失败:', error.message);
        if (error.response) {
            console.log('- 状态:', error.response.status);
            console.log('- 数据:', error.response.data);
        }
    }
    
    console.log('\n' + '='.repeat(40));
}

simpleTest().catch(console.error); 