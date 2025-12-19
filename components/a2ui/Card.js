'use client'

import styles from './Card.module.css'

export default function A2UICard({ title, content, description, actions = [], onAction }) {
    const handleAction = (action) => {
        if (onAction) {
            // 发送操作信息给大模型继续对话
            const message = action.message || action.value || action.label || '用户点击了按钮'
            onAction(message)
        } else if (action.action === 'link' && action.value) {
            // 如果没有onAction回调且是链接类型，打开链接
            window.open(action.value, '_blank')
        }
    }

    return (
        <div className={`${styles.card} glass-card fade-in`}>
            {title && <h3 className={styles.title}>{String(title)}</h3>}
            {description && <p className={styles.description}>{String(description)}</p>}
            {content && <div className={styles.content}>{String(content)}</div>}
            {Array.isArray(actions) && actions.length > 0 && (
                <div className={styles.actions}>
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            className="neon-button"
                            onClick={() => handleAction(action)}
                        >
                            {action.label || '操作'}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
