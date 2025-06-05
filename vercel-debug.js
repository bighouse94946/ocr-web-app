// Vercel环境调试工具
const axios = require('axios');
const FormData = require('form-data');

async function debugVercelEnvironment() {
    console.log('🔍 Vercel环境调试工具');
    console.log('='.repeat(50));
    
    // 1. 检查环境变量
    console.log('\n📋 环境信息:');
    console.log('- Node版本:', process.version);
    console.log('- 平台:', process.platform);
    console.log('- Vercel环境:', process.env.VERCEL ? 'Yes' : 'No');
    console.log('- Vercel URL:', process.env.VERCEL_URL || 'Not set');
    console.log('- 部署环境:', process.env.VERCEL_ENV || 'Unknown');
    
    // 2. 测试网络连接
    console.log('\n🌐 网络连接测试:');
    try {
        const testResponse = await axios.get('https://httpbin.org/get', { timeout: 5000 });
        console.log('✅ 外部网络连接正常');
    } catch (error) {
        console.log('❌ 外部网络连接失败:', error.message);
    }
    
    // 3. 测试n8n连接
    console.log('\n🔗 n8n连接测试:');
    const webhookUrl = 'https://n8n.bighouse94946.fun/webhook/56fa0dd0-c4ce-4a3a-b5e3-53e7469547e6';
    
    try {
        // 创建一个最小的测试图片
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA8tSKhwAAAABJRU5ErkJggg==';
        const testImageBuffer = Buffer.from(testImageBase64, 'base64');
        
        const formData = new FormData();
        formData.append('data', testImageBuffer, {
            filename: 'vercel-test.png',
            contentType: 'image/png'
        });
        
        console.log('- 发送测试请求到n8n...');
        const webhookResponse = await axios.post(webhookUrl, formData, {
            timeout: 30000,
            headers: {
                ...formData.getHeaders()
            }
        });
        
        console.log('✅ n8n连接成功');
        console.log('- 响应状态:', webhookResponse.status);
        console.log('- 响应数据类型:', typeof webhookResponse.data);
        console.log('- 响应数据长度:', webhookResponse.data ? webhookResponse.data.length : 'null');
        console.log('- 响应内容预览:', JSON.stringify(webhookResponse.data).substring(0, 200));
        
    } catch (error) {
        console.log('❌ n8n连接失败');
        console.log('- 错误类型:', error.code || 'Unknown');
        console.log('- 错误消息:', error.message);
        if (error.response) {
            console.log('- 响应状态:', error.response.status);
            console.log('- 响应数据:', error.response.data);
        }
    }
    
    // 4. 检查Vercel特有的限制
    console.log('\n⚙️  Vercel限制检查:');
    console.log('- 函数超时限制: 30秒 (我们设置25秒)');
    console.log('- 请求体大小限制: 4.5MB (我们限制2MB)');
    console.log('- 内存限制: 1024MB');
    console.log('- 并发限制: 1000个');
    
    // 5. 比较本地和Vercel差异
    console.log('\n🔄 本地vs Vercel差异分析:');
    console.log('- 网络环境: Vercel使用云端网络，可能有防火墙');
    console.log('- 超时处理: Vercel有严格的超时限制');
    console.log('- 错误处理: Vercel可能截断某些错误信息');
    console.log('- 依赖版本: Vercel可能使用不同的依赖版本');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 调试建议:');
    console.log('1. 检查n8n webhook是否配置正确返回数据');
    console.log('2. 检查Vercel函数日志获取更多信息');
    console.log('3. 尝试使用更小的测试图片');
    console.log('4. 验证网络连接和DNS解析');
}

// 导出函数供Vercel使用
module.exports = { debugVercelEnvironment };

// 如果直接运行，执行调试
if (require.main === module) {
    debugVercelEnvironment().catch(console.error);
} 