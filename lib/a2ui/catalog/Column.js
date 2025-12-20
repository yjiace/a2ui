'use client'

import React from 'react'
import styles from './Column.module.css'

/**
 * A2UI Column布局组件
 * 垂直排列子组件
 * 
 * @prop {React.ReactNode} children - 子组件
 * @prop {string} alignment - 对齐方式: start, center, end
 */
export default function Column({ children, alignment = 'start' }) {
    return (
        <div className={`${styles.column} ${styles[alignment] || ''}`}>
            {children}
        </div>
    )
}
