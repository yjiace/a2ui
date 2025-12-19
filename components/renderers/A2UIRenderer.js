'use client'

import { useState, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import A2UICard from '../a2ui/Card'
import A2UIButton from '../a2ui/Button'
import A2UIList from '../a2ui/List'
import A2UIChart from '../a2ui/Chart'

export default function A2UIRenderer({ content, onAction }) {
    const [blocks, setBlocks] = useState([])

    useEffect(() => {
        if (content) {
            parseContent(content)
        }
    }, [content])

    const parseContent = (text) => {
        const parsedBlocks = []

        // 匹配A2UI代码块: ```a2ui\n{...}\n``` (兼容Windows的\r\n换行)
        const a2uiRegex = /```a2ui\r?\n([\s\S]*?)\r?\n```/g
        let lastIndex = 0
        let match

        while ((match = a2uiRegex.exec(text)) !== null) {
            // 添加A2UI块之前的Markdown内容
            if (match.index > lastIndex) {
                const markdownContent = text.slice(lastIndex, match.index)
                if (markdownContent.trim()) {
                    parsedBlocks.push({
                        type: 'markdown',
                        content: markdownContent
                    })
                }
            }

            // 添加A2UI块
            try {
                const a2uiData = JSON.parse(match[1])
                parsedBlocks.push({
                    type: 'a2ui',
                    data: a2uiData
                })
            } catch (e) {
                console.error('[A2UIRenderer] 解析A2UI JSON失败:', e)
                // 如果解析失败，作为Markdown处理
                parsedBlocks.push({
                    type: 'markdown',
                    content: match[0]
                })
            }

            lastIndex = match.index + match[0].length
        }

        // 添加剩余的Markdown内容
        if (lastIndex < text.length) {
            const remainingContent = text.slice(lastIndex)
            if (remainingContent.trim()) {
                parsedBlocks.push({
                    type: 'markdown',
                    content: remainingContent
                })
            }
        }

        // 如果没有找到A2UI块，整个内容作为Markdown处理
        if (parsedBlocks.length === 0) {
            parsedBlocks.push({
                type: 'markdown',
                content: text
            })
        }
        setBlocks(parsedBlocks)
    }

    const renderA2UIComponent = (data, index) => {
        switch (data.type) {
            case 'card':
                return <A2UICard key={index} {...data} onAction={onAction} />
            case 'button':
                return <A2UIButton key={index} {...data} onAction={onAction} />
            case 'list':
                return <A2UIList key={index} {...data} />
            case 'chart':
                return <A2UIChart key={index} {...data} />
            default:
                return (
                    <div key={index} style={{ color: '#ff8c42', padding: '8px' }}>
                        未知的A2UI组件类型: {data.type}
                    </div>
                )
        }
    }

    return (
        <div>
            {blocks.map((block, index) => {
                if (block.type === 'markdown') {
                    return <MarkdownRenderer key={index} content={block.content} />
                } else if (block.type === 'a2ui') {
                    return renderA2UIComponent(block.data, index)
                }
                return null
            })}
        </div>
    )
}
