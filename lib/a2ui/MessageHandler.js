'use client'

/**
 * A2UI消息处理器
 * 解析JSONL格式的A2UI消息流
 * 
 * 支持的消息类型：
 * - surfaceUpdate: 更新组件定义
 * - dataModelUpdate: 更新数据模型
 * - beginRendering: 开始渲染
 * - deleteSurface: 删除Surface
 */

/**
 * 解析单行JSONL消息
 * @param {string} line - JSONL行
 * @param {boolean} silent - 是否静默模式（不输出警告）
 * @returns {object|null} 解析后的消息对象
 */
export function parseLine(line, silent = false) {
    const trimmed = line.trim()
    if (!trimmed) return null

    // 快速检查：必须以{开头以}结尾才可能是有效JSON对象
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
        return null  // 静默返回，不是JSON对象格式
    }

    try {
        return JSON.parse(trimmed)
    } catch (e) {
        // 只在非静默模式下且看起来像完整JSON时才警告
        if (!silent && trimmed.includes('surfaceUpdate')) {
            console.warn('[A2UI MessageHandler] JSON解析失败:', e.message)
        }
        return null
    }
}

/**
 * 解析JSONL内容（支持多行格式化JSON）
 * @param {string} content - JSONL内容（可以是单行或多行格式化JSON）
 * @param {boolean} silent - 是否静默模式
 * @returns {object[]} 消息数组
 */
export function parseJSONL(content, silent = true) {
    if (!content) return []

    const messages = []
    let buffer = ''
    let braceCount = 0
    let bracketCount = 0  // 添加数组括号计数
    let inString = false
    let escapeNext = false

    // 逐字符分析，智能检测JSON对象边界
    for (let i = 0; i < content.length; i++) {
        const char = content[i]
        buffer += char

        if (escapeNext) {
            escapeNext = false
            continue
        }

        if (char === '\\' && inString) {
            escapeNext = true
            continue
        }

        if (char === '"' && !escapeNext) {
            inString = !inString
            continue
        }

        if (!inString) {
            if (char === '{') {
                braceCount++
            } else if (char === '}') {
                braceCount--

                // 当括号完全闭合且不在数组内，尝试解析这个JSON对象
                if (braceCount === 0 && bracketCount === 0 && buffer.trim()) {
                    const message = parseLine(buffer.trim(), silent)
                    if (message) {
                        messages.push(message)
                    }
                    buffer = ''
                }
            } else if (char === '[') {
                bracketCount++
            } else if (char === ']') {
                bracketCount--
            }
        }
    }

    // 处理剩余的内容（容错）
    if (buffer.trim() && braceCount === 0) {
        const message = parseLine(buffer.trim(), silent)
        if (message) {
            messages.push(message)
        }
    }

    return messages
}

/**
 * 识别消息类型
 * @param {object} message - A2UI消息对象
 * @returns {string|null} 消息类型
 */
export function getMessageType(message) {
    if (!message || typeof message !== 'object') return null

    if (message.surfaceUpdate) return 'surfaceUpdate'
    if (message.dataModelUpdate) return 'dataModelUpdate'
    if (message.beginRendering) return 'beginRendering'
    if (message.deleteSurface) return 'deleteSurface'

    return null
}

/**
 * 检查内容是否为有效的A2UI消息格式
 * @param {string} content - 需要检查的内容
 * @returns {boolean} 是否为A2UI格式
 */
export function isA2UIFormat(content) {
    if (!content || typeof content !== 'string') return false

    const messages = parseJSONL(content)
    if (messages.length === 0) return false

    // 至少有一条有效的A2UI消息
    return messages.some(msg => getMessageType(msg) !== null)
}

/**
 * SSE流式解析器类
 * 用于处理Server-Sent Events流式传输
 */
export class SSEParser {
    constructor() {
        this.buffer = ''
    }

    /**
     * 处理SSE数据块
     * @param {string} chunk - 数据块
     * @returns {object[]} 解析的消息数组
     */
    processChunk(chunk) {
        this.buffer += chunk
        const messages = []

        // 按行分割，保留未完成的行
        const lines = this.buffer.split('\n')
        this.buffer = lines.pop() || '' // 保留最后一个可能不完整的行

        for (const line of lines) {
            // SSE格式: data: {...}
            const trimmed = line.trim()
            if (trimmed.startsWith('data:')) {
                const data = trimmed.slice(5).trim()
                if (data && data !== '[DONE]') {
                    const message = parseLine(data)
                    if (message) {
                        messages.push(message)
                    }
                }
            } else if (trimmed) {
                // 尝试直接解析为JSON（非SSE格式）
                const message = parseLine(trimmed)
                if (message) {
                    messages.push(message)
                }
            }
        }

        return messages
    }

    /**
     * 处理剩余buffer
     * @returns {object[]} 解析的消息数组
     */
    flush() {
        const messages = []
        if (this.buffer.trim()) {
            const message = parseLine(this.buffer)
            if (message) {
                messages.push(message)
            }
        }
        this.buffer = ''
        return messages
    }

    /**
     * 重置解析器状态
     */
    reset() {
        this.buffer = ''
    }
}
