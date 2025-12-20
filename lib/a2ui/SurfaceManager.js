'use client'

import { parseJSONL, getMessageType, SSEParser } from './MessageHandler'

/**
 * A2UI Surface管理器
 * 管理多个Surface的状态、组件和数据模型
 */

/**
 * 解析BoundValue获取实际值
 * @param {object} boundValue - 绑定值对象
 * @param {object} dataModel - 数据模型
 * @returns {any} 解析后的值
 */
export function resolveBoundValue(boundValue, dataModel = {}) {
    if (!boundValue || typeof boundValue !== 'object') {
        return boundValue
    }

    // literalString: 直接字符串值
    if (boundValue.literalString !== undefined) {
        return boundValue.literalString
    }

    // literalNumber: 直接数字值
    if (boundValue.literalNumber !== undefined) {
        return boundValue.literalNumber
    }

    // literalBoolean: 直接布尔值
    if (boundValue.literalBoolean !== undefined) {
        return boundValue.literalBoolean
    }

    // path: 从数据模型中获取值
    if (boundValue.path) {
        return getValueByPath(dataModel, boundValue.path)
    }

    return boundValue
}

/**
 * 根据路径从数据模型中获取值
 * @param {object} dataModel - 数据模型
 * @param {string} path - 路径 (如 "/user/name")
 * @returns {any} 路径对应的值
 */
function getValueByPath(dataModel, path) {
    if (!path || !dataModel) return undefined

    // 移除开头的斜杠并分割路径
    const parts = path.replace(/^\//, '').split('/')

    let current = dataModel
    for (const part of parts) {
        if (current === undefined || current === null) return undefined
        current = current[part]
    }

    return current
}

/**
 * 设置数据模型中指定路径的值
 * @param {object} dataModel - 数据模型
 * @param {string} path - 路径
 * @param {any} value - 要设置的值
 */
function setValueByPath(dataModel, path, value) {
    if (!path) {
        Object.assign(dataModel, value)
        return
    }

    const parts = path.replace(/^\//, '').split('/')
    let current = dataModel

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!(part in current)) {
            current[part] = {}
        }
        current = current[part]
    }

    current[parts[parts.length - 1]] = value
}

/**
 * 解析dataModelUpdate的contents为对象
 * @param {array} contents - contents数组（邻接表格式）
 * @returns {object} 解析后的对象
 */
function parseDataModelContents(contents) {
    if (!Array.isArray(contents)) return contents

    const result = {}
    for (const item of contents) {
        if (!item.key) continue

        if (item.valueString !== undefined) {
            result[item.key] = item.valueString
        } else if (item.valueNumber !== undefined) {
            result[item.key] = item.valueNumber
        } else if (item.valueBoolean !== undefined) {
            result[item.key] = item.valueBoolean
        } else if (item.valueMap !== undefined) {
            result[item.key] = parseDataModelContents(item.valueMap)
        } else if (item.valueList !== undefined) {
            result[item.key] = item.valueList.map(v => parseDataModelContents([v]))
        }
    }

    return result
}

/**
 * Surface类 - 表示一个独立的UI区域
 */
class Surface {
    constructor(surfaceId) {
        this.surfaceId = surfaceId
        this.components = new Map()  // id -> component定义
        this.dataModel = {}
        this.rootId = null
        this.isReady = false
    }

    /**
     * 处理surfaceUpdate消息
     * @param {object} update - surfaceUpdate内容
     */
    handleSurfaceUpdate(update) {
        if (!update.components || !Array.isArray(update.components)) return

        for (const comp of update.components) {
            if (comp.id) {
                this.components.set(comp.id, comp)
            }
        }
    }

    /**
     * 处理dataModelUpdate消息
     * @param {object} update - dataModelUpdate内容
     */
    handleDataModelUpdate(update) {
        const path = update.path || ''
        const contents = update.contents

        if (contents) {
            const parsed = parseDataModelContents(contents)
            setValueByPath(this.dataModel, path, parsed)
        }
    }

    /**
     * 处理beginRendering消息
     * @param {object} rendering - beginRendering内容
     */
    handleBeginRendering(rendering) {
        if (rendering.root) {
            this.rootId = rendering.root
        }
        this.isReady = true
    }

    /**
     * 获取组件定义
     * @param {string} id - 组件ID
     * @returns {object|null} 组件定义
     */
    getComponent(id) {
        return this.components.get(id) || null
    }

    /**
     * 解析组件的BoundValue属性
     * @param {any} value - 属性值
     * @returns {any} 解析后的值
     */
    resolveValue(value) {
        return resolveBoundValue(value, this.dataModel)
    }
}

/**
 * SurfaceManager类 - 管理多个Surface
 */
export class SurfaceManager {
    constructor() {
        this.surfaces = new Map()  // surfaceId -> Surface
        this.defaultSurfaceId = 'default'
    }

    /**
     * 获取或创建Surface
     * @param {string} surfaceId - Surface ID
     * @returns {Surface} Surface实例
     */
    getOrCreateSurface(surfaceId = this.defaultSurfaceId) {
        if (!this.surfaces.has(surfaceId)) {
            this.surfaces.set(surfaceId, new Surface(surfaceId))
        }
        return this.surfaces.get(surfaceId)
    }

    /**
     * 处理单条A2UI消息
     * @param {object} message - A2UI消息对象
     */
    processMessage(message) {
        const type = getMessageType(message)
        if (!type) return

        switch (type) {
            case 'surfaceUpdate': {
                const surfaceId = message.surfaceUpdate.surfaceId || this.defaultSurfaceId
                const surface = this.getOrCreateSurface(surfaceId)
                surface.handleSurfaceUpdate(message.surfaceUpdate)
                break
            }

            case 'dataModelUpdate': {
                const surfaceId = message.dataModelUpdate.surfaceId || this.defaultSurfaceId
                const surface = this.getOrCreateSurface(surfaceId)
                surface.handleDataModelUpdate(message.dataModelUpdate)
                break
            }

            case 'beginRendering': {
                const surfaceId = message.beginRendering.surfaceId || this.defaultSurfaceId
                const surface = this.getOrCreateSurface(surfaceId)
                surface.handleBeginRendering(message.beginRendering)
                break
            }

            case 'deleteSurface': {
                const surfaceId = message.deleteSurface.surfaceId
                if (surfaceId) {
                    this.surfaces.delete(surfaceId)
                }
                break
            }
        }
    }

    /**
     * 处理JSONL内容
     * @param {string} content - JSONL内容
     */
    processContent(content) {
        const messages = parseJSONL(content)
        for (const message of messages) {
            this.processMessage(message)
        }
    }

    /**
     * 获取默认Surface
     * @returns {Surface|null} 默认Surface
     */
    getDefaultSurface() {
        return this.surfaces.get(this.defaultSurfaceId) || null
    }

    /**
     * 获取所有就绪的Surface
     * @returns {Surface[]} 就绪的Surface数组
     */
    getReadySurfaces() {
        return Array.from(this.surfaces.values()).filter(s => s.isReady)
    }

    /**
     * 重置所有Surface
     */
    reset() {
        this.surfaces.clear()
    }

    /**
     * 检查是否有可渲染的内容
     * @returns {boolean} 是否有内容
     */
    hasContent() {
        const defaultSurface = this.getDefaultSurface()
        return defaultSurface && defaultSurface.components.size > 0
    }
}

/**
 * 创建新的SurfaceManager实例
 * @returns {SurfaceManager} 管理器实例
 */
export function createSurfaceManager() {
    return new SurfaceManager()
}
