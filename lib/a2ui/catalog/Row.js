'use client'

import React from 'react'
import styles from './Row.module.css'

/**
 * A2UI Row布局组件
 * 水平排列子组件
 * 
 * @prop {React.ReactNode} children - 子组件
 * @prop {string} alignment - 对齐方式: start, center, end, spaceBetween
 */
export default function Row({ children, alignment = 'start' }) {
    return (
        <div className={`${styles.row} ${styles[alignment] || ''}`}>
            {children}
        </div>
    )
}
