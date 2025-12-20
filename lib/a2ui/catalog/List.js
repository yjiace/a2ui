'use client'

import React from 'react'
import styles from './List.module.css'

/**
 * A2UI List列表组件
 * 垂直列表容器
 * 
 * @prop {React.ReactNode} children - 子组件
 */
export default function List({ children }) {
    return (
        <div className={styles.list}>
            {children}
        </div>
    )
}
