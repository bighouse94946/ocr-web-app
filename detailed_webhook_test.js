const axios = require('axios');
const fs = require('fs');

async function detailedWebhookTest() {
    const webhookUrl = "https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6";
    
    console.log('='.repeat(60));
    console.log('详细Webhook测试');
    console.log('='.repeat(60));
    console.log('Webhook URL:', webhookUrl);
    
    try {
        // 准备测试图片
        const testImagePath = '/System/Library/Desktop Pictures/Solid Colors/Red Orange.png';
        const imageBuffer = fs.readFileSync(testImagePath);
        const imageBase64 = imageBuffer.toString('base64');
        
        console.log('\n图片信息:');
        console.log('- 文件路径:', testImagePath);
        console.log('- 文件大小:', imageBuffer.length, 'bytes');
        console.log('- Base64长度:', imageBase64.length);
        console.log('- Base64前50字符:', imageBase64.substring(0, 50));
        
        // 准备请求数据
        const requestData = {
            imageUrl: "http://localhost:3000/test.png",
            imagePath: testImagePath,
            imageBase64: imageBase64,
            fileName: "test.png",
            mimeType: "image/png",
            timestamp: new Date().toISOString(),
            testId: Math.random().toString(36).substring(7)
        };
        
        console.log('\n发送的请求数据:');
        console.log('- imageUrl:', requestData.imageUrl);
        console.log('- imagePath:', requestData.imagePath);
        console.log('- fileName:', requestData.fileName);
        console.log('- mimeType:', requestData.mimeType);
        console.log('- timestamp:', requestData.timestamp);
        console.log('- testId:', requestData.testId);
        console.log('- imageBase64长度:', requestData.imageBase64.length);
        
        const startTime = Date.now();
        console.log('\n发送请求...');
        
        const response = await axios.post(webhookUrl, requestData, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'OCR-Test-Client/1.0'
            },
            validateStatus: function (status) {
                return status < 500; // 接受所有小于500的状态码
            }
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('\n响应信息:');
        console.log('- 响应时间:', duration, 'ms');
        console.log('- 状态码:', response.status);
        console.log('- 状态文本:', response.statusText);
        
        console.log('\n响应头:');
        Object.entries(response.headers).forEach(([key, value]) => {
            console.log(`- ${key}:`, value);
        });
        
        console.log('\n响应数据分析:');
        console.log('- 数据类型:', typeof response.data);
        console.log('- 数据长度:', JSON.stringify(response.data).length);
        console.log('- 原始数据:', JSON.stringify(response.data));
        console.log('- 数据内容:');
        
        if (typeof response.data === 'string') {
            console.log('  * 字符串长度:', response.data.length);
            console.log('  * 是否为空:', response.data === '');
            console.log('  * 去空格后长度:', response.data.trim().length);
            console.log('  * 字符编码测试:', Buffer.from(response.data).toString('hex'));
            
            if (response.data.trim()) {
                try {
                    const parsed = JSON.parse(response.data);
                    console.log('  * JSON解析成功:', parsed);
                } catch (e) {
                    console.log('  * JSON解析失败:', e.message);
                }
            }
        } else if (typeof response.data === 'object') {
            console.log('  * 对象键:', Object.keys(response.data));
            console.log('  * 对象内容:', response.data);
        }
        
        // 检查是否有异步响应机制
        console.log('\n等待可能的延迟响应...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 再次尝试不同的请求方式
        console.log('\n尝试简化请求...');
        const simpleResponse = await axios.post(webhookUrl, {
            test: true,
            message: "ping"
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('简化请求响应:');
        console.log('- 状态码:', simpleResponse.status);
        console.log('- 数据:', JSON.stringify(simpleResponse.data));
        
    } catch (error) {
        console.log('\n❌ 测试失败:');
        console.log('- 错误类型:', error.constructor.name);
        console.log('- 错误消息:', error.message);
        
        if (error.response) {
            console.log('- 响应状态:', error.response.status);
            console.log('- 响应头:', error.response.headers);
            console.log('- 响应数据:', error.response.data);
        } else if (error.request) {
            console.log('- 请求已发送但无响应');
            console.log('- 请求详情:', error.request);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('测试完成');
    console.log('='.repeat(60));
}

detailedWebhookTest().catch(console.error); 