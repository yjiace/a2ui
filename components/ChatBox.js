'use client'

import { useRef, useEffect } from 'react'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import styles from './ChatBox.module.css'

export default function ChatBox({ title, subtitle, messages, mode, onSend }) {
    const messagesEndRef = useRef(null)

    // 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className={`${styles.chatBox} glass-card fade-in`}>
            {/* 聊天框头部 */}
            <div className={styles.header}>
                <h2 className={mode === 'a2ui' ? 'neon-text-purple' : 'neon-text'}>{title}</h2>
                <p className={styles.subtitle}>{subtitle}</p>
            </div>

            {/* 消息列表 */}
            <div className={styles.messages}>
                {messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>💬</div>
                        <p>开始对话，看看{mode === 'a2ui' ? 'A2UI协议' : '标准模式'}的效果吧</p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <MessageItem
                            key={index}
                            message={message}
                            mode={mode}
                            onAction={(actionMessage) => onSend(actionMessage)}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 独立输入框 */}
            <ChatInput onSend={onSend} />
        </div>
    )
}
