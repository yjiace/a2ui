'use client'

import { useEffect, useState } from 'react'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

// 配置marked
marked.setOptions({
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value
            } catch (err) {
                console.error('高亮错误:', err)
            }
        }
        return hljs.highlightAuto(code).value
    },
    breaks: true,
    gfm: true
})

export default function MarkdownRenderer({ content }) {
    const [html, setHtml] = useState('')

    useEffect(() => {
        if (content) {
            // 使用DOMPurify清理HTML(防XSS)
            const rawHtml = marked(content)

            // 在浏览器环境中使用DOMPurify
            if (typeof window !== 'undefined') {
                import('dompurify').then(({ default: DOMPurify }) => {
                    const cleanHtml = DOMPurify.sanitize(rawHtml)
                    setHtml(cleanHtml)
                })
            } else {
                setHtml(rawHtml)
            }
        }
    }, [content])

    return (
        <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}
