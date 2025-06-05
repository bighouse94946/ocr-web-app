# n8n Webhook返回配置指南

## 问题诊断

您的n8n workflow已经正确执行了所有节点，但是"Respond to Webhook"节点没有返回数据。

## 解决方案

### 1. 配置"Respond to Webhook"节点

在您的n8n workflow的最后一个节点（Respond to Webhook）中：

**方法一：返回HTTP Request的响应**
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{{ $('HTTP Request').json }}"
}
```

**方法二：手动构造返回数据**
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "text": "{{ $('HTTP Request').json.text }}",
    "model": "Google Gemini 2.0 Flash",
    "confidence": 0.95,
    "tokenCount": "{{ $('HTTP Request').json.text.length }}"
  }
}
```

**方法三：简单返回文本**
```json
{
  "statusCode": 200,
  "body": "{{ $('HTTP Request').json.text }}"
}
```

### 2. 检查HTTP Request节点

确保您的HTTP Request节点正确调用了Gemini API：

- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- **Method**: POST
- **Headers**: 
  ```json
  {
    "Content-Type": "application/json",
    "x-goog-api-key": "您的API密钥"
  }
  ```
- **Body**: 
  ```json
  {
    "contents": [{
      "parts": [{
        "text": "请识别这张图片中的文字，直接返回识别结果："
      }, {
        "inline_data": {
          "mime_type": "{{ $('Extract from File').json.mimeType }}",
          "data": "{{ $('Extract from File').json.data }}"
        }
      }]
    }]
  }
  ```

### 3. 数据流检查

1. **Webhook节点** → 接收文件 ✅
2. **Extract from File节点** → 提取base64数据 ✅
3. **HTTP Request节点** → 调用Gemini API ❓
4. **Google Sheets节点** → 记录日志 ✅
5. **Respond to Webhook节点** → 返回结果 ❌

### 4. 调试步骤

1. 检查HTTP Request节点的响应数据
2. 确保API密钥有效
3. 验证请求格式正确
4. 配置正确的返回数据结构

### 5. 推荐配置

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "text": "{{ $('HTTP Request').json.candidates[0].content.parts[0].text }}",
    "model": "Google Gemini 2.0 Flash",
    "confidence": 0.95,
    "tokenCount": "{{ $('HTTP Request').json.usageMetadata.totalTokenCount }}"
  }
}
```

这个配置会从Gemini API的标准响应格式中提取正确的数据。 