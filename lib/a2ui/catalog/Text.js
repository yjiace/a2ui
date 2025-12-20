'use client'

import React from 'react'
import styles from './Text.module.css'

/**
 * A2UI Text组件
 * 显示文本内容，支持不同的语义提示
 * 
 * @prop {string} text - 文本内容（已解析的值）
 * @prop {string} usageHint - 语义提示: h1, h2, h3, body, caption
 */
export default function Text({ text, usageHint = 'body' }) {
    const content = text || ''

    // 根据usageHint选择HTML元素
    switch (usageHint) {
        case 'h1':
            return <h1 className={`${styles.text} ${styles.h1}`}>{content}</h1>
        case 'h2':
            return <h2 className={`${styles.text} ${styles.h2}`}>{content}</h2>
        case 'h3':
            return <h3 className={`${styles.text} ${styles.h3}`}>{content}</h3>
        case 'caption':
            return <span className={`${styles.text} ${styles.caption}`}>{content}</span>
        case 'body':
        default:
            return <p className={`${styles.text} ${styles.body}`}>{content}</p>
    }
}
