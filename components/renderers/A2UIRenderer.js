'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createSurfaceManager, isA2UIFormat } from '@/lib/a2ui'
import { catalog, getComponent } from '@/lib/a2ui/catalog'
import MarkdownRenderer from './MarkdownRenderer'

/**
 * A2UI渲染器组件
 * 解析A2UI JSONL消息并渲染组件树
 * 
 * @prop {string} content - AI返回的内容（可能是JSONL或普通文本）
 * @prop {function} onAction - 用户操作回调
 */
export default function A2UIRenderer({ content, onAction }) {
    const [renderedTree, setRenderedTree] = useState(null)
    const [isA2UI, setIsA2UI] = useState(false)

    // 创建SurfaceManager实例
    const surfaceManager = useMemo(() => createSurfaceManager(), [])

    useEffect(() => {
        if (!content) {
            setRenderedTree(null)
            setIsA2UI(false)
            return
        }

        // 检查是否为A2UI格式
        if (isA2UIFormat(content)) {
            setIsA2UI(true)
            surfaceManager.reset()
            surfaceManager.processContent(content)

            // 渲染组件树
            const tree = renderSurface(surfaceManager.getDefaultSurface())
            setRenderedTree(tree)
        } else {
            // 不是A2UI格式，作为Markdown处理
            setIsA2UI(false)
            setRenderedTree(null)
        }
    }, [content, surfaceManager])

    /**
     * 渲染Surface的组件树
     * @param {object} surface - Surface实例
     * @returns {React.ReactNode} 渲染的组件树
     */
    function renderSurface(surface) {
        if (!surface || !surface.rootId) {
            // 如果没有root，尝试渲染所有组件
            if (surface && surface.components.size > 0) {
                return renderAllComponents(surface)
            }
            return null
        }

        return renderComponent(surface, surface.rootId)
    }

    /**
     * 渲染所有根级组件（用于没有明确root的情况）
     * 只渲染未被其他组件引用的顶级组件，避免子组件重复渲染
     * @param {object} surface - Surface实例
     * @returns {React.ReactNode} 渲染的组件
     */
    function renderAllComponents(surface) {
        // 收集所有被引用的子组件ID
        const referencedIds = new Set()

        for (const [id, compDef] of surface.components) {
            if (!compDef.component) continue

            const componentObj = compDef.component
            const typeName = Object.keys(componentObj)[0]
            const props = componentObj[typeName] || {}

            // 收集child引用
            if (props.child) {
                referencedIds.add(props.child)
            }

            // 收集children引用
            if (props.children && props.children.explicitList) {
                for (const childId of props.children.explicitList) {
                    referencedIds.add(childId)
                }
            }
        }

        // 只渲染未被引用的根级组件
        const components = []

        for (const [id, compDef] of surface.components) {
            // 跳过被其他组件引用的子组件
            if (referencedIds.has(id)) continue

            const rendered = renderComponent(surface, id)
            if (rendered) {
                components.push(
                    <div key={id}>{rendered}</div>
                )
            }
        }

        return components.length > 0 ? <div>{components}</div> : null
    }

    /**
     * 递归渲染单个组件及其子组件
     * @param {object} surface - Surface实例
     * @param {string} componentId - 组件ID
     * @param {Set} visited - 已访问组件ID集合（循环检测）
     * @param {number} depth - 当前递归深度
     * @returns {React.ReactNode} 渲染的组件
     */
    function renderComponent(surface, componentId, visited = new Set(), depth = 0) {
        // 防止无限递归
        const MAX_DEPTH = 50
        if (depth > MAX_DEPTH) {
            console.warn(`[A2UIRenderer] 递归深度超过${MAX_DEPTH}层，停止渲染: ${componentId}`)
            return null
        }

        // 循环引用检测
        if (visited.has(componentId)) {
            console.warn(`[A2UIRenderer] 检测到循环引用: ${componentId}`)
            return null
        }

        const compDef = surface.getComponent(componentId)
        if (!compDef || !compDef.component) return null

        visited.add(componentId)

        try {
            // 获取组件类型（component对象的第一个键）
            const componentObj = compDef.component
            const typeName = Object.keys(componentObj)[0]
            const props = componentObj[typeName] || {}

            // 从Catalog获取React组件
            const Component = getComponent(typeName)
            if (!Component) {
                console.warn(`[A2UIRenderer] 未知组件类型: ${typeName}`)
                return (
                    <div style={{ color: '#ff8c42', padding: '4px' }}>
                        未知A2UI组件: {typeName}
                    </div>
                )
            }

            // 解析属性中的BoundValue
            const resolvedProps = resolveComponentProps(surface, props)

            // 处理子组件
            let children = null

            // 单个子组件 (child属性)
            if (props.child) {
                children = renderComponent(surface, props.child, new Set(visited), depth + 1)
            }

            // 多个子组件 (children属性)
            if (props.children) {
                if (props.children.explicitList && Array.isArray(props.children.explicitList)) {
                    children = props.children.explicitList.map(childId => (
                        <React.Fragment key={childId}>
                            {renderComponent(surface, childId, new Set(visited), depth + 1)}
                        </React.Fragment>
                    ))
                }
                // TODO: 支持template动态列表
            }

            // 处理Button的action
            if (typeName === 'Button' && props.action) {
                resolvedProps.action = props.action
                resolvedProps.onAction = handleAction
            }

            return (
                <Component {...resolvedProps}>
                    {children}
                </Component>
            )
        } catch (error) {
            console.error(`[A2UIRenderer] 渲染组件失败: ${componentId}`, error)
            return (
                <div style={{ color: '#ff6b6b', padding: '4px' }}>
                    组件渲染错误: {componentId}
                </div>
            )
        }
    }

    /**
     * 解析组件属性中的BoundValue
     * @param {object} surface - Surface实例
     * @param {object} props - 原始属性
     * @returns {object} 解析后的属性
     */
    function resolveComponentProps(surface, props) {
        const resolved = {}

        for (const [key, value] of Object.entries(props)) {
            // 跳过子组件相关属性
            if (key === 'child' || key === 'children') continue

            // 解析BoundValue
            if (value && typeof value === 'object') {
                if (value.literalString !== undefined ||
                    value.literalNumber !== undefined ||
                    value.literalBoolean !== undefined ||
                    value.path !== undefined) {
                    resolved[key] = surface.resolveValue(value)
                } else {
                    resolved[key] = value
                }
            } else {
                resolved[key] = value
            }
        }

        return resolved
    }

    /**
     * 处理用户操作事件
     * @param {object} actionEvent - 操作事件对象
     */
    function handleAction(actionEvent) {
        if (onAction && actionEvent) {
            // 构造userAction消息发送给AI
            const message = actionEvent.name || '用户点击了按钮'
            onAction(message)
        }
    }

    // 如果是A2UI格式且成功渲染，显示组件树
    if (isA2UI && renderedTree) {
        return (
            <div className="a2ui-surface">
                {renderedTree}
            </div>
        )
    }

    // 否则使用Markdown渲染
    return <MarkdownRenderer content={content || ''} />
}
