'use client'

import React from 'react'
import styles from './Image.module.css'

/**
 * A2UI Image图片组件
 * 
 * @prop {string} url - 图片URL（已解析的值）
 * @prop {string} alt - 替代文本
 */
export default function Image({ url, alt = '' }) {
    if (!url) return null

    return (
        <img
            className={styles.image}
            src={url}
            alt={alt}
            loading="lazy"
        />
    )
}
