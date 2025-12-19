# A2UI协议演示Demo

基于A2UI协议的演示应用，通过双聊天框对比展示标准模式和A2UI协议增强模式的效果差异。

## 功能特点

### 核心功能
- **双聊天框对比**：并排展示标准模式和A2UI协议模式
- **统一输入**：一次输入同时发送到两个聊天框
- **多模型支持**：支持OpenAI和Google Gemini
- **会话管理**：历史记录保存、会话切换、新建会话
- **流式响应**：实时显示AI回复内容

### A2UI协议支持
A2UI模式支持在Markdown基础上使用特殊的组件标记：

```markdown
这是普通的Markdown文本

\`\`\`a2ui
{
  "type": "card",
  "title": "卡片标题",
  "content": "卡片内容",
  "actions": [
    {"label": "按钮", "action": "alert", "value": "点击了按钮"}
  ]
}
\`\`\`

继续使用Markdown
```

支持的A2UI组件：
- `card` - 卡片组件
- `button` - 按钮组件
- `list` - 列表组件
- `chart` - 图表组件

### 视觉特效
- 深蓝到紫色渐变背景
- 粒子和星空动画效果
- 玻璃拟态设计
- 霓虹发光效果
- 流畅的交互动画

## 开发指南

### 安装依赖
```bash
npm install
```

### 本地开发
```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建
```bash
npm run build
npm start
```

## 部署到EdgeOne

1. 构建生产版本：
```bash
npm run build
```

2. 部署到Tencent Cloud EdgeOne平台

## 技术栈

- **框架**: Next.js 14
- **UI**: React + CSS Modules
- **Markdown**: marked.js
- **代码高亮**: highlight.js
- **安全**: DOMPurify (XSS防护)

## 项目结构

```
a2ui/
├── app/
│   ├── layout.js          # 根布局
│   ├── page.js            # 主页面
│   ├── globals.css        # 全局样式
│   └── page.module.css    # 页面样式
├── components/
│   ├── ChatBox.js         # 聊天框组件
│   ├── MessageItem.js     # 消息项组件
│   ├── UnifiedInput.js    # 统一输入框
│   ├── ModelConfig.js     # 模型配置
│   ├── SessionList.js     # 会话列表
│   ├── renderers/
│   │   ├── MarkdownRenderer.js  # Markdown渲染器
│   │   └── A2UIRenderer.js      # A2UI渲染器
│   ├── a2ui/
│   │   ├── Card.js        # 卡片组件
│   │   ├── Button.js      # 按钮组件
│   │   ├── List.js        # 列表组件
│   │   └── Chart.js       # 图表组件
│   └── effects/
│       └── ParticleBackground.js  # 粒子背景
├── package.json
└── next.config.js
```

## 使用说明

1. **配置模型**：点击"模型配置"，选择提供商（OpenAI或Gemini），输入API密钥
2. **开始对话**：在底部输入框输入消息，按Enter发送
3. **对比效果**：观察左右两个聊天框的不同渲染效果
4. **管理会话**：点击"历史会话"查看或切换会话，点击"新建会话"开始新对话

## 许可证

MIT
