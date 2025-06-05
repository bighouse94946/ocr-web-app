const axios = require('axios');
const fs = require('fs');

async function testRealImage() {
    console.log('🔍 测试真实图片OCR...');
    
    try {
        const webhookUrl = 'https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6';
        
        // 创建一个简单的文字图片的base64（包含"Hello World"文字）
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAA5UlEQVR42o2Sy0rDQRSFT8MmjaGJRRJMoZha1KW1i25c+gS6dO1j+gI+gGtX7n0AN/oALtwIgoJbQTdCF4IKFhpasbWxNjGNuYyTmf+fm5nMv3GIM8xc3wNjhKqqEkWRrFgsyoZhyPF4nCWTSVZVlej3+3K73ZZardY7n8+fNxqNr8Vi8d1ms/nF5XLJuVzuZaFQ+DQYDDyapmHFSqXyu9vtPh6Px18ymcw/FXKS7u/v/+wAI6qqRB6PB4FA4LdtMBjAbrdjsViEbdsoFotYr9cYjUaw2+2YzWYIhUKYTqfY7/dYr9ey/XQCkiShXq9jt9thtVrher2G1+vFdDpFKpXCZrOBpmkYj8cIhUIolUqQZRmGYfw8RNM0ptMpXC4X9vs9NpsNhBAYDodwOBxYLBaw2WzodruQZRnL5RL/AHYBQ9yvSL3dAAAAAElFTkSuQmCC';
        
        console.log('📤 发送真实图片测试...');
        const startTime = Date.now();
        
        // 发送二进制文件数据以匹配n8n Extract from File节点
        const FormData = require('form-data');
        const formData = new FormData();
        
        const testImageBase64 = testImage.replace('data:image/png;base64,', '');
        const imageBuffer = Buffer.from(testImageBase64, 'base64');
        
        // 添加二进制文件数据，字段名为"data"
        formData.append('data', imageBuffer, {
            filename: 'test-text.png',
            contentType: 'image/png'
        });
        
        const response = await axios.post(webhookUrl, formData, {
            timeout: 15000,
            headers: {
                ...formData.getHeaders()
            }
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ OCR测试成功!');
        console.log(`⏱️  响应时间: ${duration}ms`);
        console.log('📊 响应状态:', response.status);
        console.log('📋 完整响应数据:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // 分析数据结构
        console.log('\n📝 数据结构分析:');
        if (typeof response.data === 'string') {
            console.log('   - 返回类型: 字符串');
            console.log('   - 内容:', response.data);
        } else if (typeof response.data === 'object') {
            console.log('   - 返回类型: 对象');
            console.log('   - 键值:', Object.keys(response.data));
        }
        
    } catch (error) {
        console.error('❌ OCR测试失败:');
        
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
testRealImage(); 