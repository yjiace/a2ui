'use client'

import React from 'react'
import styles from './Button.module.css'

/**
 * A2UI Button组件
 * 可点击按钮，触发action事件
 * 
 * @prop {string} label - 按钮文本（已解析的值）
 * @prop {React.ReactNode} children - 子组件内容（优先级最高）
 * @prop {object} action - { name: string, context?: object }
 * @prop {function} onAction - 点击回调
 */
export default function Button({ label, children, action, onAction }) {
    const handleClick = () => {
        if (onAction && action) {
            onAction({
                type: 'userAction',
                name: action.name || 'click',
                context: action.context || {},
                timestamp: new Date().toISOString()
            })
        }
    }

    // 优先使用children，其次label，最后默认文本
    const content = children || label || '按钮'

    return (
        <button className={styles.button} onClick={handleClick}>
            {content}
        </button>
    )
}
