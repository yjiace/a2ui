import './globals.css'
import ParticleBackground from '@/components/effects/ParticleBackground'

export const metadata = {
    title: 'A2UI协议演示 - AI增强UI对比',
    description: '展示A2UI协议相比传统对话模式的UI增强效果',
}

export default function RootLayout({ children }) {
    return (
        <html lang="zh-CN">
            <body>
                <ParticleBackground />
                {children}
            </body>
        </html>
    )
}
