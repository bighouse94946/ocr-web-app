const axios = require('axios');
const fs = require('fs');

async function fixWebhookTest() {
    const webhookUrl = "https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6";
    
    console.log('🔧 修复Webhook测试 - 针对Extract from File节点');
    console.log('='.repeat(50));
    
    try {
        const testImagePath = '/System/Library/Desktop Pictures/Solid Colors/Red Orange.png';
        const imageBuffer = fs.readFileSync(testImagePath);
        const imageBase64 = imageBuffer.toString('base64');
        
        console.log('\n📷 图片信息:');
        console.log('- 文件大小:', imageBuffer.length, 'bytes');
        console.log('- Base64长度:', imageBase64.length);
        
        // 测试不同的数据格式来匹配Extract from File节点
        const testCases = [
            {
                name: "格式1: 标准二进制字段格式",
                data: {
                    data: {
                        data: imageBase64,
                        mimeType: "image/png",
                        fileName: "test.png"
                    }
                }
            },
            {
                name: "格式2: 直接data字段",
                data: {
                    data: imageBase64
                }
            },
            {
                name: "格式3: 文件信息格式",
                data: {
                    file: {
                        data: imageBase64,
                        mimetype: "image/png",
                        filename: "test.png"
                    }
                }
            },
            {
                name: "格式4: FormData模拟格式",
                data: {
                    files: {
                        data: imageBase64,
                        type: "image/png",
                        name: "test.png"
                    }
                }
            },
            {
                name: "格式5: 简单字段映射",
                data: {
                    imageData: imageBase64,
                    fileName: "test.png",
                    mimeType: "image/png"
                }
            }
        ];
        
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n📤 测试 ${testCase.name}...`);
            
            try {
                const response = await axios.post(webhookUrl, testCase.data, {
                    timeout: 15000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ 响应:');
                console.log('- 状态:', response.status);
                console.log('- 数据长度:', JSON.stringify(response.data).length);
                console.log('- 响应内容:', JSON.stringify(response.data));
                
                if (response.data && JSON.stringify(response.data).length > 2) {
                    console.log('🎉 成功！这个格式有效！');
                    break;
                } else {
                    console.log('⚠️ 仍然返回空数据');
                }
                
                // 等待一秒再测试下一个格式
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log('❌ 测试失败:', error.message);
            }
        }
        
        // 最后尝试 multipart/form-data 格式
        console.log('\n📤 测试 multipart/form-data 格式...');
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('data', imageBuffer, {
            filename: 'test.png',
            contentType: 'image/png'
        });
        
        try {
            const response = await axios.post(webhookUrl, formData, {
                timeout: 15000,
                headers: {
                    ...formData.getHeaders()
                }
            });
            
            console.log('✅ FormData响应:');
            console.log('- 状态:', response.status);
            console.log('- 数据:', JSON.stringify(response.data));
            
        } catch (error) {
            console.log('❌ FormData测试失败:', error.message);
        }
        
    } catch (error) {
        console.log('\n❌ 整体测试失败:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('建议检查n8n中Extract from File节点的"Input Binary Field"配置');
    console.log('确保字段名与我们发送的数据结构匹配');
}

fixWebhookTest().catch(console.error); 