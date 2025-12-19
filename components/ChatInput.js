'use client'

import { useState, useRef } from 'react'
import styles from './ChatInput.module.css'

export default function ChatInput({ onSend }) {
    const [message, setMessage] = useState('')
    const textareaRef = useRef(null)

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSend = () => {
        if (message.trim()) {
            onSend(message)
            setMessage('')
        }
    }

    return (
        <div className={styles.inputContainer}>
            <input
                type="text"
                className={styles.input}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="发送独立消息..."
            />
            <button
                className={styles.sendIcon}
                onClick={handleSend}
                disabled={!message.trim()}
                title="发送"
            >
                ▲
            </button>
        </div>
    )
}
