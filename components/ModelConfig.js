'use client'

import { useState, useEffect } from 'react'
import styles from './ModelConfig.module.css'

export default function ModelConfig({ config, onSave, onClose }) {
    const [provider, setProvider] = useState(config?.provider || 'openai')
    const [apiKey, setApiKey] = useState(config?.apiKey || '')
    const [model, setModel] = useState(config?.model || '')
    const [useCustomModel, setUseCustomModel] = useState(false)
    const [customModel, setCustomModel] = useState('')
    const [useCustomUrl, setUseCustomUrl] = useState(false)
    const [customUrl, setCustomUrl] = useState(config?.customUrl || '')

    const models = {
        openai: [
            'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo',
            'o1-preview', 'o1-mini', 'o3-mini'
        ],
        gemini: [
            'gemini-2.5-flash', 'gemini-2.5-pro',
            'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'
        ]
    }

    const defaultUrls = {
        openai: 'https://api.openai.com/v1/chat/completions',
        gemini: 'https://generativelanguage.googleapis.com/v1beta'
    }

    const handleSave = () => {
        if (!apiKey.trim()) {
            alert('请输入API密钥')
            return
        }

        const finalModel = useCustomModel && customModel.trim()
            ? customModel.trim()
            : (model || models[provider][0])

        const finalUrl = useCustomUrl && customUrl.trim()
            ? customUrl.trim()
            : null

        onSave({
            provider,
            apiKey: apiKey.trim(),
            model: finalModel,
            customUrl: finalUrl
        })
    }

    useEffect(() => {
        // 检查当前模型是否在预设列表中
        if (config?.model && !models[provider].includes(config.model)) {
            setUseCustomModel(true)
            setCustomModel(config.model)
        } else if (!model || !models[provider].includes(model)) {
            setModel(models[provider][0])
            setUseCustomModel(false)
        }

        // 检查是否使用自定义URL
        if (config?.customUrl) {
            setUseCustomUrl(true)
            setCustomUrl(config.customUrl)
        }
    }, [provider])

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.modal} glass-card`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className="neon-text">模型配置</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    <div className={styles.formGroup}>
                        <label>选择提供商</label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className={styles.select}
                        >
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Google Gemini</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>
                            API地址
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={useCustomUrl}
                                    onChange={(e) => setUseCustomUrl(e.target.checked)}
                                />
                                自定义
                            </label>
                        </label>

                        {useCustomUrl ? (
                            <input
                                type="text"
                                value={customUrl}
                                onChange={(e) => setCustomUrl(e.target.value)}
                                placeholder="输入自定义API地址"
                                className={styles.input}
                            />
                        ) : (
                            <input
                                type="text"
                                value={defaultUrls[provider]}
                                disabled
                                className={`${styles.input} ${styles.disabled}`}
                            />
                        )}

                        <small className={styles.hint}>
                            {useCustomUrl
                                ? '支持代理地址或第三方API，OpenAI兼容格式需以/v1/chat/completions结尾'
                                : '使用官方默认地址'}
                        </small>
                    </div>

                    <div className={styles.formGroup}>
                        <label>API密钥</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="输入API密钥"
                            className={styles.input}
                        />
                        <small className={styles.hint}>
                            {provider === 'openai' && '从 platform.openai.com 获取'}
                            {provider === 'gemini' && '从 aistudio.google.com 获取'}
                        </small>
                    </div>

                    <div className={styles.formGroup}>
                        <label>
                            模型
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={useCustomModel}
                                    onChange={(e) => setUseCustomModel(e.target.checked)}
                                />
                                自定义
                            </label>
                        </label>

                        {useCustomModel ? (
                            <input
                                type="text"
                                value={customModel}
                                onChange={(e) => setCustomModel(e.target.value)}
                                placeholder="输入自定义模型名称"
                                className={styles.input}
                            />
                        ) : (
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className={styles.select}
                            >
                                {models[provider].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        )}

                        <small className={styles.hint}>
                            {useCustomModel
                                ? '输入任意模型名称'
                                : '选择预设模型或勾选"自定义"'}
                        </small>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className="neon-button" onClick={handleSave}>
                        保存配置
                    </button>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        取消
                    </button>
                </div>
            </div>
        </div>
    )
}
