'use client'

import React from 'react'
import styles from './Card.module.css'

/**
 * A2UI Card容器组件
 * 卡片容器，包裹子组件
 * 
 * @prop {React.ReactNode} children - 子组件内容
 */
export default function Card({ children }) {
    return (
        <div className={`${styles.card} glass-card fade-in`}>
            {children}
        </div>
    )
}
