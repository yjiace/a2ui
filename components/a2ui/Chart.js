'use client'

import { useEffect, useRef } from 'react'
import styles from './Chart.module.css'

export default function A2UIChart({ title, chartType = 'bar', data = [] }) {
    const canvasRef = useRef(null)

    // 确保data是数组且包含有效数据
    const safeData = Array.isArray(data) ? data.filter(d => d && typeof d.value === 'number') : []

    useEffect(() => {
        if (canvasRef.current && safeData.length > 0) {
            drawChart()
        }
    }, [safeData, chartType])

    const drawChart = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const width = canvas.width
        const height = canvas.height

        // 清空画布
        ctx.clearRect(0, 0, width, height)

        if (chartType === 'bar') {
            drawBarChart(ctx, width, height)
        }
    }

    const drawBarChart = (ctx, width, height) => {
        const maxValue = Math.max(...safeData.map(d => d.value))
        const barWidth = (width - 40) / safeData.length - 10
        const padding = 40

        safeData.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * (height - padding - 20)
            const x = padding + index * (barWidth + 10)
            const y = height - padding - barHeight

            // 绘制渐变柱子
            const gradient = ctx.createLinearGradient(x, y, x, height - padding)
            gradient.addColorStop(0, '#00d4ff')
            gradient.addColorStop(1, '#9d4edd')

            ctx.fillStyle = gradient
            ctx.fillRect(x, y, barWidth, barHeight)

            // 添加发光效果
            ctx.shadowBlur = 10
            ctx.shadowColor = '#00d4ff'

            // 绘制标签
            ctx.fillStyle = '#ffffff'
            ctx.font = '12px Inter'
            ctx.textAlign = 'center'
            ctx.fillText(item.label, x + barWidth / 2, height - padding + 15)

            // 绘制数值
            ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5)
        })

        ctx.shadowBlur = 0
    }

    return (
        <div className={`${styles.chart} glass-card fade-in`}>
            {title && <h3 className={styles.title}>{title}</h3>}
            <canvas
                ref={canvasRef}
                width={600}
                height={300}
                className={styles.canvas}
            />
        </div>
    )
}
