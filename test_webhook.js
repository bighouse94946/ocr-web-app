const axios = require('axios');
const fs = require('fs');

async function testWebhook() {
    const webhookUrl = "https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6";
    
    console.log('测试webhook连接:', webhookUrl);
    
    try {
        // 测试: 发送完整的图片数据
        console.log('\n--- 测试: 发送完整图片数据 ---');
        const testImagePath = '/System/Library/Desktop Pictures/Solid Colors/Red Orange.png';
        const imageBuffer = fs.readFileSync(testImagePath);
        const imageBase64 = imageBuffer.toString('base64');
        
        console.log('图片大小:', imageBuffer.length, 'bytes');
        console.log('Base64长度:', imageBase64.length);
        
        // 测试不同的数据格式
        const testCases = [
            {
                name: "格式1: 标准OCR格式",
                data: {
                    imageUrl: "http://localhost:3000/test.png",
                    imagePath: testImagePath,
                    imageBase64: imageBase64,
                    fileName: "test.png",
                    mimeType: "image/png"
                }
            },
            {
                name: "格式2: 简化格式",
                data: {
                    image: imageBase64,
                    filename: "test.png"
                }
            },
            {
                name: "格式3: 只有base64",
                data: {
                    imageBase64: imageBase64
                }
            },
            {
                name: "格式4: data URL格式",
                data: {
                    image: `data:image/png;base64,${imageBase64}`
                }
            }
        ];
        
        for (const testCase of testCases) {
            try {
                console.log(`\n--- ${testCase.name} ---`);
                const response = await axios.post(webhookUrl, testCase.data, {
                    timeout: 30000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log('响应状态:', response.status);
                console.log('响应头:', response.headers);
                console.log('响应数据类型:', typeof response.data);
                console.log('响应数据长度:', JSON.stringify(response.data).length);
                console.log('响应数据:', response.data);
                
                // 如果有响应数据，说明成功了
                if (response.data && (typeof response.data === 'object' || response.data.length > 0)) {
                    console.log('✅ 成功！找到了正确的数据格式');
                    break;
                }
                
            } catch (error) {
                console.log('失败:', error.message);
                if (error.response) {
                    console.log('响应状态:', error.response.status);
                    console.log('响应数据:', error.response.data);
                }
            }
        }
        
    } catch (error) {
        console.log('测试失败:', error.message);
    }
}

testWebhook().catch(console.error); 