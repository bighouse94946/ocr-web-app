# 🔧 n8n Webhook配置修复指南

## 📊 当前状态
✅ **Webhook连接**: 成功 (状态码: 200)  
⏱️ **响应时间**: ~1.7秒  
❌ **响应数据**: 空字符串  

## 🎯 问题原因
n8n workflow中的"Respond to Webhook"节点虽然设置为"First Incoming Item"，但实际需要显式配置返回HTTP Request节点的响应数据。

## 🛠️ 解决方案

### 方案1：配置Respond to Webhook节点返回Gemini响应

在n8n工作流中，编辑"Respond to Webhook"节点：

1. **Response Mode**: 选择 `Using Fields Below`
2. **Status Code**: `200`
3. **Response Body**: 设置为 `{{ $('HTTP Request').json }}`

完整配置：
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{{ $('HTTP Request').json }}"
}
```

### 方案2：返回处理后的文本

如果只需要文本结果：
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "text": "{{ $('HTTP Request').json.candidates[0].content.parts[0].text }}",
    "confidence": "{{ $('HTTP Request').json.candidates[0].avgLogprobs }}",
    "model": "gemini-2.0-flash",
    "tokenCount": "{{ $('HTTP Request').json.usageMetadata.totalTokenCount }}"
  }
}
```

### 方案3：使用表达式编辑器

在"Respond to Webhook"节点中：
1. 切换到 **Expression** 模式
2. 输入: `{{ $('HTTP Request').json }}`

## 🧪 测试验证

配置完成后，运行我们的测试工具验证：
```bash
node test-webhook.js
```

期望看到：
- ✅ 状态码: 200
- ✅ 响应类型: object
- ✅ 包含candidates数组和Gemini响应数据

## 📱 前端适配

我们的代码已经适配了Gemini响应格式，会自动：
- 提取 `candidates[0].content.parts[0].text` 作为识别文本
- 计算置信度基于 `avgLogprobs`
- 显示Token使用量 `usageMetadata.totalTokenCount`
- 显示模型信息

## 🎉 完成后效果

配置正确后，OCR应用将显示：
- 📝 **识别文本**: 从图片中提取的实际文字
- 📊 **置信度**: 基于Gemini计算的准确性评分
- 🔢 **Token使用**: API调用的Token消耗
- 🤖 **模型**: Gemini 2.0 Flash
- ⏱️ **响应时间**: ~1-3秒

---

**💡 提示**: 如果修改后仍然返回空数据，请检查HTTP Request节点是否成功调用Gemini API并返回了完整响应。 