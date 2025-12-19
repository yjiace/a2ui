'use client'

import styles from './List.module.css'

export default function A2UIList({ title, items = [] }) {
    // 确保items是数组
    const safeItems = Array.isArray(items) ? items : []

    return (
        <div className={`${styles.list} glass-card fade-in`}>
            {title && <h3 className={styles.title}>{String(title)}</h3>}
            {safeItems.length > 0 ? (
                <ul className={styles.items}>
                    {safeItems.map((item, index) => (
                        <li key={index} className={styles.item}>
                            <span className={styles.bullet}>▹</span>
                            <span className={styles.text}>{String(item)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.empty}>暂无列表项</p>
            )}
        </div>
    )
}
