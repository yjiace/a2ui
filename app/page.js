'use client'

import { useState, useEffect } from 'react'
import ChatBox from '@/components/ChatBox'
import UnifiedInput from '@/components/UnifiedInput'
import ModelConfig from '@/components/ModelConfig'
import SessionList from '@/components/SessionList'
import styles from './page.module.css'

export default function Home() {
    const [sessions, setSessions] = useState([])
    const [currentSessionId, setCurrentSessionId] = useState(null)
    const [messagesA, setMessagesA] = useState([]) // 标准模式消息
    const [messagesB, setMessagesB] = useState([]) // A2UI模式消息
    const [modelConfig, setModelConfig] = useState(null)
    const [showConfig, setShowConfig] = useState(false)
    const [showSessions, setShowSessions] = useState(false)

    // 从localStorage加载数据
    useEffect(() => {
        const savedConfig = localStorage.getItem('modelConfig')
        if (savedConfig) {
            setModelConfig(JSON.parse(savedConfig))
        }

        const savedSessions = localStorage.getItem('sessions')
        if (savedSessions) {
            const parsedSessions = JSON.parse(savedSessions)
            setSessions(parsedSessions)

            // 加载最后一个会话
            if (parsedSessions.length > 0) {
                const lastSession = parsedSessions[parsedSessions.length - 1]
                setCurrentSessionId(lastSession.id)
                setMessagesA(lastSession.messagesA || [])
                setMessagesB(lastSession.messagesB || [])
            } else {
                createNewSession()
            }
        } else {
            createNewSession()
        }
    }, [])

    // 保存会话到localStorage
    useEffect(() => {
        if (currentSessionId && messagesA.length > 0) {
            const updatedSessions = sessions.map(session =>
                session.id === currentSessionId
                    ? { ...session, messagesA, messagesB, updatedAt: Date.now() }
                    : session
            )

            if (!sessions.find(s => s.id === currentSessionId)) {
                updatedSessions.push({
                    id: currentSessionId,
                    messagesA,
                    messagesB,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                })
            }

            setSessions(updatedSessions)
            localStorage.setItem('sessions', JSON.stringify(updatedSessions))
        }
    }, [messagesA, messagesB, currentSessionId])

    const createNewSession = () => {
        const newSessionId = Date.now().toString()
        setCurrentSessionId(newSessionId)
        setMessagesA([])
        setMessagesB([])
    }

    const switchSession = (sessionId) => {
        const session = sessions.find(s => s.id === sessionId)
        if (session) {
            setCurrentSessionId(session.id)
            setMessagesA(session.messagesA || [])
            setMessagesB(session.messagesB || [])
            setShowSessions(false)
        }
    }

    const handleDeleteSession = (sessionId, e) => {
        e.stopPropagation()
        const updatedSessions = sessions.filter(s => s.id !== sessionId)
        setSessions(updatedSessions)
        localStorage.setItem('sessions', JSON.stringify(updatedSessions))

        if (sessionId === currentSessionId) {
            if (updatedSessions.length > 0) {
                switchSession(updatedSessions[0].id)
            } else {
                createNewSession()
            }
        }
    }

    const handleSendMessage = async (message, target = 'both') => {
        if (!modelConfig) {
            alert('请先配置大模型')
            setShowConfig(true)
            return
        }

        // 添加用户消息和loading状态的助手消息
        if (target === 'both' || target === 'A') {
            setMessagesA(prev => [
                ...prev,
                { role: 'user', content: message },
                { role: 'assistant', content: '', loading: true }
            ])
        }
        if (target === 'both' || target === 'B') {
            setMessagesB(prev => [
                ...prev,
                { role: 'user', content: message },
                { role: 'assistant', content: '', loading: true }
            ])
        }

        try {
            const tasks = []
            if (target === 'both' || target === 'A') {
                tasks.push(callAPI(message, 'standard', setMessagesA))
            }
            if (target === 'both' || target === 'B') {
                tasks.push(callAPI(message, 'a2ui', setMessagesB))
            }
            await Promise.all(tasks)
        } catch (error) {
            console.error('API调用失败:', error)
            const errorMsg = { role: 'assistant', content: `错误: ${error.message}`, loading: false }
            if (target === 'both' || target === 'A') {
                setMessagesA(prev => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = errorMsg
                    return newMessages
                })
            }
            if (target === 'both' || target === 'B') {
                setMessagesB(prev => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = errorMsg
                    return newMessages
                })
            }
        }
    }

    const callAPI = async (message, mode, setMessages) => {
        const { provider, apiKey, model } = modelConfig

        console.log(`[callAPI] 开始调用 - mode: ${mode}, provider: ${provider}`)

        const systemPrompt = mode === 'standard'
            ? '你是一个有帮助的AI助手。请用清晰、简洁的方式回答用户的问题。支持Markdown格式。'
            : `你是一个支持A2UI协议的AI助手。除了普通文本回复，你可以返回结构化UI组件。

使用A2UI组件时，请用以下格式包裹JSON：
\`\`\`a2ui
{JSON对象}
\`\`\`

支持的组件类型：

1. **card** - 卡片组件
{
  "type": "card",
  "title": "标题",
  "description": "描述文字",
  "content": "主要内容",
  "actions": [{"label": "按钮文字", "message": "用户点击后发送给你的消息"}]
}

2. **button** - 按钮组件
{
  "type": "button",
  "label": "按钮文字",
  "message": "点击后发送给你的消息",
  "variant": "primary|secondary"
}

3. **list** - 列表组件
{
  "type": "list",
  "title": "列表标题",
  "items": ["项目1", "项目2", "项目3"]
}

4. **chart** - 图表组件
{
  "type": "chart",
  "title": "图表标题",
  "chartType": "bar",
  "data": [{"label": "A", "value": 100}, {"label": "B", "value": 200}]
}

**重要**: 按钮的message属性定义了用户点击按钮后会发送给你的消息，你收到这个消息后应该继续对话。这样可以实现多轮交互。

你可以在普通Markdown文本中穿插使用这些组件。请根据用户需求选择合适的组件展示信息。`

        try {
            let responseText = ''
            const { customUrl } = modelConfig

            if (provider === 'openai') {
                // OpenAI 非流式调用（支持自定义URL）
                // 自动补全路径：如果customUrl不以/chat/completions结尾，则补全
                let apiUrl = customUrl || 'https://api.openai.com/v1/chat/completions'
                if (customUrl && !customUrl.endsWith('/chat/completions')) {
                    apiUrl = customUrl.replace(/\/+$/, '') + '/chat/completions'
                }
                console.log(`[callAPI-OpenAI] 使用URL: ${apiUrl}`)

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model || 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: message }
                        ],
                        stream: false
                    })
                })

                if (!response.ok) {
                    const errorText = await response.text().catch(() => '')
                    throw new Error(`OpenAI API 错误: ${response.status} ${errorText}`)
                }

                const data = await response.json()
                responseText = data.choices[0]?.message?.content || ''
                console.log(`[callAPI-OpenAI] 响应内容长度: ${responseText.length}`)

            } else if (provider === 'gemini') {
                // Gemini 非流式调用（支持自定义URL）
                const baseUrl = customUrl || 'https://generativelanguage.googleapis.com/v1beta'
                const apiUrl = `${baseUrl}/models/${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: systemPrompt + '\n\n用户: ' + message }]
                        }]
                    })
                })

                if (!response.ok) {
                    const errorText = await response.text().catch(() => '')
                    throw new Error(`Gemini API 错误: ${response.status} ${errorText}`)
                }

                const data = await response.json()
                responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
                console.log(`[callAPI-Gemini] 响应内容长度: ${responseText.length}`)
            } else {
                throw new Error(`不支持的提供商: ${provider}`)
            }

            // 更新消息状态
            setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: responseText,
                    loading: false
                }
                console.log(`[callAPI] 更新消息完成，消息数量: ${newMessages.length}`)
                return newMessages
            })

        } catch (error) {
            console.error('[callAPI] 错误:', error)
            setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: `错误: ${error.message}`,
                    loading: false
                }
                return newMessages
            })
        }
    }

    return (
        <div className={styles.container}>
            {/* 顶部工具栏 */}
            <header className={styles.header}>
                <div className={styles.logo}>
                    <h1 className="neon-text">A2UI协议演示</h1>
                    <p className={styles.subtitle}>AI增强UI对比展示</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className="neon-button"
                        onClick={() => setShowSessions(!showSessions)}
                    >
                        历史会话
                    </button>
                    <button
                        className="neon-button"
                        onClick={() => setShowConfig(!showConfig)}
                    >
                        模型配置
                    </button>
                </div>
            </header>

            {/* 模型配置面板 */}
            {showConfig && (
                <ModelConfig
                    config={modelConfig}
                    onSave={(config) => {
                        setModelConfig(config)
                        localStorage.setItem('modelConfig', JSON.stringify(config))
                        setShowConfig(false)
                    }}
                    onClose={() => setShowConfig(false)}
                />
            )}

            {/* 会话列表面板 */}
            {showSessions && (
                <SessionList
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    onSelectSession={switchSession}
                    onDeleteSession={handleDeleteSession}
                    onNewSession={createNewSession}
                    onClose={() => setShowSessions(false)}
                />
            )}

            {/* 双聊天框布局 */}
            <main className={styles.main}>
                <div className={styles.chatContainer}>
                    <ChatBox
                        title="标准模式"
                        subtitle="纯Markdown渲染"
                        messages={messagesA}
                        mode="standard"
                        onSend={(msg) => handleSendMessage(msg, 'A')}
                    />
                    <ChatBox
                        title="A2UI协议模式"
                        subtitle="Markdown + A2UI组件"
                        messages={messagesB}
                        mode="a2ui"
                        onSend={(msg) => handleSendMessage(msg, 'B')}
                    />
                </div>

                {/* 统一输入框 */}
                <UnifiedInput onSend={handleSendMessage} />
            </main>
        </div>
    )
}
