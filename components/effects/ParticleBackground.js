'use client'

import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        let animationFrameId
        let particles = []
        let mouse = { x: null, y: null }

        // 设置canvas尺寸
        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        // 粒子类
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width
                this.y = Math.random() * canvas.height
                this.size = Math.random() * 2 + 0.5
                this.speedX = Math.random() * 0.5 - 0.25
                this.speedY = Math.random() * 0.5 - 0.25
                this.color = this.getRandomColor()
                this.opacity = Math.random() * 0.5 + 0.2
            }

            getRandomColor() {
                const colors = [
                    'rgba(0, 212, 255, ',    // 霓虹蓝
                    'rgba(157, 78, 221, ',   // 亮紫色
                    'rgba(255, 140, 66, ',   // 橙金色
                    'rgba(0, 255, 255, ',    // 青色
                ]
                return colors[Math.floor(Math.random() * colors.length)]
            }

            update() {
                this.x += this.speedX
                this.y += this.speedY

                // 边界检测
                if (this.x > canvas.width || this.x < 0) {
                    this.speedX = -this.speedX
                }
                if (this.y > canvas.height || this.y < 0) {
                    this.speedY = -this.speedY
                }

                // 鼠标交互
                if (mouse.x && mouse.y) {
                    const dx = mouse.x - this.x
                    const dy = mouse.y - this.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < 100) {
                        const force = (100 - distance) / 100
                        this.x -= (dx / distance) * force * 2
                        this.y -= (dy / distance) * force * 2
                    }
                }
            }

            draw() {
                ctx.fillStyle = this.color + this.opacity + ')'
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fill()

                // 添加发光效果
                ctx.shadowBlur = 10
                ctx.shadowColor = this.color + '0.8)'
            }
        }

        // 初始化粒子
        const initParticles = () => {
            particles = []
            const numberOfParticles = Math.floor((canvas.width * canvas.height) / 15000)
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle())
            }
        }
        initParticles()

        // 连接粒子
        const connectParticles = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < 120) {
                        const opacity = (120 - distance) / 120 * 0.2
                        ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`
                        ctx.lineWidth = 0.5
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.stroke()
                    }
                }
            }
        }

        // 动画循环
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.forEach(particle => {
                particle.update()
                particle.draw()
            })

            connectParticles()

            animationFrameId = requestAnimationFrame(animate)
        }
        animate()

        // 鼠标移动事件
        const handleMouseMove = (e) => {
            mouse.x = e.clientX
            mouse.y = e.clientY
        }

        const handleMouseLeave = () => {
            mouse.x = null
            mouse.y = null
        }

        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mouseleave', handleMouseLeave)

        // 清理函数
        return () => {
            window.removeEventListener('resize', resizeCanvas)
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('mouseleave', handleMouseLeave)
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
            }}
        />
    )
}
