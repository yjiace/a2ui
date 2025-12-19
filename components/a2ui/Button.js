'use client'

import styles from './Button.module.css'

export default function A2UIButton({ label, action, value, message, variant = 'primary', onAction }) {
    const handleClick = () => {
        if (onAction) {
            // 发送操作信息给大模型继续对话
            const actionMessage = message || value || label || '用户点击了按钮'
            onAction(actionMessage)
        } else if (action === 'link' && value) {
            // 如果没有onAction回调且是链接类型，打开链接
            window.open(value, '_blank')
        }
    }

    return (
        <button
            className={`${styles.button} ${styles[variant]}`}
            onClick={handleClick}
        >
            {label || '按钮'}
        </button>
    )
}
