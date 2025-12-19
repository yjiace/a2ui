// 新的简化 callAPI 函数
const callAPI = async (message, mode, setMessages) => {
    const { provider, apiKey, model } = modelConfig

    console.log(`[callAPI] 开始调用 - mode: ${mode}, provider: ${provider}`)

    const systemPrompt = mode === 'standard'
        ? '你是一个有帮助的AI助手。请用清晰、简洁的方式回答用户的问题。'
        : `你是一个支持A2UI协议的助手。返回格式化UI组件：\n\`\`\`a2ui\n{ "type": "card", ... }\n\`\`\`\n支持：card, button, list, chart。`

    try {
        let responseText = ''

        if (provider === 'openai') {
            // OpenAI 非流式调用
            const apiUrl = 'https://api.openai.com/v1/chat/completions'
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
                throw new Error(`OpenAI API 错误: ${response.status}`)
            }

            const data = await response.json()
            responseText = data.choices[0]?.message?.content || ''
            console.log(`[callAPI-OpenAI] 响应内容长度: ${responseText.length}`)

        } else if (provider === 'gemini') {
            // Gemini 非流式调用
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`
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
                throw new Error(`Gemini API 错误: ${response.status}`)
            }

            const data = await response.json()
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
            console.log(`[callAPI-Gemini] 响应内容长度: ${responseText.length}`)
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
