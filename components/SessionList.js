'use client'

import styles from './SessionList.module.css'

export default function SessionList({ sessions, currentSessionId, onSelectSession, onDeleteSession, onNewSession, onClose }) {
    const formatDate = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now - date

        if (diff < 86400000) { // 小于24小时
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        } else if (diff < 604800000) { // 小于7天
            const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
            return days[date.getDay()]
        } else {
            return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
        }
    }

    const getPreview = (session) => {
        if (session.messagesA && session.messagesA.length > 0) {
            const firstUserMessage = session.messagesA.find(m => m.role === 'user')
            if (firstUserMessage) {
                return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
            }
        }
        return '新对话'
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.sidebar} glass-card`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className="neon-text">会话历史</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.newSessionBtn}>
                    <button className="neon-button" onClick={onNewSession} style={{ width: '100%' }}>
                        + 新建会话
                    </button>
                </div>

                <div className={styles.sessions}>
                    {sessions.length === 0 ? (
                        <div className={styles.empty}>
                            <p>暂无会话记录</p>
                        </div>
                    ) : (
                        sessions
                            .sort((a, b) => b.updatedAt - a.updatedAt)
                            .map(session => (
                                <div
                                    key={session.id}
                                    className={`${styles.sessionItem} ${session.id === currentSessionId ? styles.active : ''}`}
                                    onClick={() => onSelectSession(session.id)}
                                >
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionPreview}>
                                            {getPreview(session)}
                                        </div>
                                        <div className={styles.sessionTime}>
                                            {formatDate(session.updatedAt || session.createdAt)}
                                        </div>
                                    </div>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => onDeleteSession(session.id, e)}
                                        title="删除会话"
                                    >
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19V4M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    )
}
