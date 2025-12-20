'use client'

// A2UI标准组件目录（Catalog）
// 映射组件类型名称到React组件实现

import Text from './Text'
import Button from './Button'
import Card from './Card'
import Row from './Row'
import Column from './Column'
import List from './List'
import Image from './Image'

/**
 * 组件目录
 * 键为组件类型名（与A2UI协议中的组件名对应）
 * 值为对应的React组件
 */
export const catalog = {
    // 显示组件
    Text,
    Image,

    // 交互组件
    Button,

    // 容器组件
    Card,

    // 布局组件
    Row,
    Column,
    List,
}

/**
 * 获取组件
 * @param {string} typeName - 组件类型名
 * @returns {React.Component|null} 组件或null
 */
export function getComponent(typeName) {
    return catalog[typeName] || null
}

/**
 * 检查组件类型是否支持
 * @param {string} typeName - 组件类型名
 * @returns {boolean} 是否支持
 */
export function isComponentSupported(typeName) {
    return typeName in catalog
}

/**
 * 获取所有支持的组件类型名
 * @returns {string[]} 组件类型名数组
 */
export function getSupportedComponents() {
    return Object.keys(catalog)
}

export default catalog
