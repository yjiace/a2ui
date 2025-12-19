'use client'

import { useState } from 'react'
import styles from './UnifiedInput.module.css'

export default function UnifiedInput({ onSend }) {
    const [message, setMessage] = useState('')

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSend = () => {
        if (message.trim()) {
            onSend(message, 'both')
            setMessage('')
        }
    }

    return (
        <div className={`${styles.inputContainer} glass-card`}>
            <div className={styles.inputWrapper}>
                <input
                    className={styles.input}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="同步发送给两个聊天框..."
                />
                <div className={styles.actions}>
                    <button
                        className="neon-button"
                        onClick={handleSend}
                        disabled={!message.trim()}
                    >
                        同步发送
                    </button>
                </div>
            </div>
        </div>
    )
}
