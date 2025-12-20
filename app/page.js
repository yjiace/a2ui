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


        // 标准模式使用Markdown，A2UI模式使用官方协议格式
        const systemPrompt = mode === 'standard'
            ? '你是一个有帮助的AI助手。请用清晰、详细的方式回答用户的问题。使用丰富的Markdown格式来组织内容，包括标题、列表、代码块、表格等。'
            : `你是一个遵循A2UI协议v0.8的AI助手。请根据用户需求生成丰富、详细的UI界面。

## 输出格式
使用JSONL格式（每行一个JSON对象），消息类型：
- surfaceUpdate: 定义UI组件
- beginRendering: 开始渲染（最后发送）

## 可用组件
- Text: 文本 {"text": {"literalString": "内容"},"usageHint": "h1|h2|h3|body|caption"}
- Button: 按钮 {"label": {"literalString": "文字"},"action": {"name": "动作名"}}
- Card: 卡片容器 {"child": "子组件ID"}
- Row: 水平布局 {"children": {"explicitList": ["id1","id2"]}}
- Column: 垂直布局 {"children": {"explicitList": ["id1","id2"]}}
- List: 列表 {"children": {"explicitList": ["id1","id2"]}}

## 规则
1. 组件通过ID引用（邻接表），每个组件需要id和component
2. 根组件ID必须为"root"
3. 最后发送 {"beginRendering":{"root":"root"}}
4. **重要：内容要详细丰富**，将长文本分成多个Text组件，使用h1/h2/h3层级
5. 可以创建多个Card卡片来组织不同章节

## 示例
{"surfaceUpdate":{"components":[{"id":"root","component":{"Column":{"children":{"explicitList":["card1","card2"]}}}}]}}
{"surfaceUpdate":{"components":[{"id":"card1","component":{"Card":{"child":"c1"}}}]}}
{"surfaceUpdate":{"components":[{"id":"c1","component":{"Column":{"children":{"explicitList":["t1","t2"]}}}}]}}
{"surfaceUpdate":{"components":[{"id":"t1","component":{"Text":{"text":{"literalString":"标题"},"usageHint":"h1"}}}]}}
{"surfaceUpdate":{"components":[{"id":"t2","component":{"Text":{"text":{"literalString":"详细内容描述..."},"usageHint":"body"}}}]}}
{"surfaceUpdate":{"components":[{"id":"card2","component":{"Card":{"child":"c2"}}}]}}
{"surfaceUpdate":{"components":[{"id":"c2","component":{"Column":{"children":{"explicitList":["t3","t4"]}}}}]}}
{"surfaceUpdate":{"components":[{"id":"t3","component":{"Text":{"text":{"literalString":"第二部分"},"usageHint":"h2"}}}]}}
{"surfaceUpdate":{"components":[{"id":"t4","component":{"Text":{"text":{"literalString":"更多详细内容..."},"usageHint":"body"}}}]}}
{"beginRendering":{"root":"root"}}

请生成尽可能丰富和详细的UI内容，回复时只输出JSONL消息。`

        try {
            let responseText = ''
            const { customUrl } = modelConfig

            if (provider === 'openai') {
                // OpenAI 流式调用
                let apiUrl = customUrl || 'https://api.openai.com/v1/chat/completions'
                if (customUrl && !customUrl.endsWith('/chat/completions')) {
                    apiUrl = customUrl.replace(/\/+$/, '') + '/chat/completions'
                }

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
                            // 添加历史消息（排除loading状态的消息）
                            ...(mode === 'standard' ? messagesA : messagesB)
                                .filter(m => !m.loading && m.content)
                                .slice(-10) // 保留最近10条消息
                                .map(m => ({ role: m.role, content: m.content })),
                            { role: 'user', content: message }
                        ],
                        stream: true
                    })
                })

                if (!response.ok) {
                    const errorText = await response.text().catch(() => '')
                    throw new Error(`OpenAI API 错误: ${response.status} ${errorText}`)
                }

                // SSE流式读取
                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        const trimmed = line.trim()
                        if (trimmed.startsWith('data:')) {
                            const data = trimmed.slice(5).trim()
                            if (data && data !== '[DONE]') {
                                try {
                                    const parsed = JSON.parse(data)
                                    const content = parsed.choices?.[0]?.delta?.content || ''
                                    if (content) {
                                        responseText += content
                                        // 实时更新UI
                                        setMessages(prev => {
                                            const newMessages = [...prev]
                                            newMessages[newMessages.length - 1] = {
                                                role: 'assistant',
                                                content: responseText,
                                                loading: true
                                            }
                                            return newMessages
                                        })
                                    }
                                } catch (e) {
                                    // 忽略解析错误
                                }
                            }
                        }
                    }
                }

            } else if (provider === 'gemini') {
                // Gemini 流式调用
                const baseUrl = customUrl || 'https://generativelanguage.googleapis.com/v1beta'
                const apiUrl = `${baseUrl}/models/${model || 'gemini-2.0-flash'}:streamGenerateContent?key=${apiKey}&alt=sse`

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [
                            // 系统提示
                            { role: 'user', parts: [{ text: systemPrompt }] },
                            { role: 'model', parts: [{ text: '好的，我会遵循这些规则。' }] },
                            // 添加历史消息
                            ...(mode === 'standard' ? messagesA : messagesB)
                                .filter(m => !m.loading && m.content)
                                .slice(-10)
                                .map(m => ({
                                    role: m.role === 'user' ? 'user' : 'model',
                                    parts: [{ text: m.content }]
                                })),
                            // 当前消息
                            { role: 'user', parts: [{ text: message }] }
                        ]
                    })
                })

                if (!response.ok) {
                    const errorText = await response.text().catch(() => '')
                    throw new Error(`Gemini API 错误: ${response.status} ${errorText}`)
                }

                // SSE流式读取
                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        const trimmed = line.trim()
                        if (trimmed.startsWith('data:')) {
                            const data = trimmed.slice(5).trim()
                            if (data) {
                                try {
                                    const parsed = JSON.parse(data)
                                    const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
                                    if (content) {
                                        responseText += content
                                        // 实时更新UI
                                        setMessages(prev => {
                                            const newMessages = [...prev]
                                            newMessages[newMessages.length - 1] = {
                                                role: 'assistant',
                                                content: responseText,
                                                loading: true
                                            }
                                            return newMessages
                                        })
                                    }
                                } catch (e) {
                                    // 忽略解析错误
                                }
                            }
                        }
                    }
                }
            } else {
                throw new Error(`不支持的提供商: ${provider}`)
            }

            // 完成后更新状态
            setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: responseText,
                    loading: false
                }
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
