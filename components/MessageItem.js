'use client'

import MarkdownRenderer from './renderers/MarkdownRenderer'
import A2UIRenderer from './renderers/A2UIRenderer'
import styles from './MessageItem.module.css'

export default function MessageItem({ message, mode, onAction }) {
    const { role, content, loading } = message

    return (
        <div className={`${styles.messageItem} ${styles[role]} fade-in`}>
            <div className={styles.avatar}>
                {role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.loadingDot}></div>
                        <div className={styles.loadingDot}></div>
                        <div className={styles.loadingDot}></div>
                    </div>
                ) : (
                    <div className={styles.messageContent}>
                        {mode === 'a2ui' ? (
                            <A2UIRenderer content={content} onAction={onAction} />
                        ) : (
                            <MarkdownRenderer content={content} />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
