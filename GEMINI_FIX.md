# Gemini 流式响应修复方案

## 问题
Gemini API 返回的是格式化的 JSON（带换行和缩进），每一行都不是完整的 JSON 对象，无法逐行解析。

## 解决方案
需要累积所有数据后再解析完整的 JSON 数组。

## 修改位置
`app/page.js` 的 `callAPI` 函数中，第211-350行左右。

## 修改内容

将 Gemini 的处理逻辑改为：
1. 添加 `geminiBuffer` 变量累积所有chunk数据
2. 每次接收chunk时累积到buffer
3. 尝试解析完整的JSON数组
4. 如果解析成功，提取text内容并更新UI
5. 如果解析失败，继续累积

关键代码：
```javascript
let geminiBuffer = '' // 在 while 循环前添加

// 在 while 循环中，Gemini 部分改为：
else if (provider === 'gemini') {
    geminiBuffer += chunk
    try {
        const parsed = JSON.parse(geminiBuffer)
        // 提取内容并更新UI
    } catch (e) {
        // 继续累积
    }
}
```
