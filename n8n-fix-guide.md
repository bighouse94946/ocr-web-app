# 🔧 n8n Webhook返回配置修复指南

## 🔍 问题诊断

**现状分析**：
- ✅ API端点工作正常 (`/api/recognize`)
- ✅ n8n Workflow执行成功 (9.384秒完成)
- ✅ 所有n8n节点都正常执行
- ✅ HTTP Request节点成功调用Gemini API
- ❌ "Respond to Webhook"节点返回空字符串 (`""`)

**根本原因**：
"Respond to Webhook"节点虽然设置为"First Incoming Item"，但没有正确配置返回HTTP Request节点的响应数据。

## 🚀 解决方案

### 方法1：配置返回HTTP Request的完整响应

1. 点击"Respond to Webhook"节点
2. 在"Parameters"标签页中：
   - **Respond With**: 选择 `Using 'Respond to Webhook' Node`
   - **Status Code**: `200`
   - **Headers**: 
     ```json
     {
       "Content-Type": "application/json"
     }
     ```
   - **Response Body**: 
     ```
     {{ $('HTTP Request').json }}
     ```

### 方法2：返回特定的文本内容

如果你想只返回识别的文本内容：

- **Response Body**: 
  ```
  {{ $('HTTP Request').json.candidates[0].content.parts[0].text }}
  ```

### 方法3：返回结构化的JSON数据

如果你想返回格式化的响应：

- **Response Body**: 
  ```json
  {
    "text": "{{ $('HTTP Request').json.candidates[0].content.parts[0].text }}",
    "model": "Google Gemini 2.0 Flash",
    "tokenCount": {{ $('HTTP Request').json.usageMetadata.totalTokenCount }},
    "confidence": 0.95
  }
  ```

## 🎯 推荐配置

**最佳实践配置**：

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{{ $('HTTP Request').json }}"
}
```

这个配置会：
- 返回HTTP状态码200
- 设置正确的Content-Type
- 返回完整的Gemini API响应数据

## 📊 预期结果

配置完成后，前端应该显示：

```
识别模型: Google Gemini 2.0 Flash (via n8n)
置信度: 95%
Token使用量: 2618
识别时间: 9.4秒

识别文本:
[这里会显示实际的OCR识别结果]
```

## ✅ 验证步骤

1. 保存n8n workflow配置
2. 访问 https://ocr.bighouse94946.fun/
3. 上传一张包含文字的图片
4. 应该看到完整的OCR识别结果

## 🐛 如果还有问题

如果配置后仍然有问题，请检查：

1. n8n workflow是否正确保存
2. HTTP Request节点是否成功调用Gemini API
3. API密钥是否有效
4. 图片格式是否支持（JPG、PNG、GIF、WebP）

---

**一旦完成n8n配置，您的OCR应用就会完美工作！** 🎉 