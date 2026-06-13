import { View, Text } from '@tarojs/components'
import type { PropsWithChildren } from 'react'

import './index.scss'

interface ButtonLikeProps extends PropsWithChildren {
  variant?: 'primary' | 'ghost' | 'outline'
  block?: boolean
  className?: string
  onClick?: () => void
}

export function UiButton({ variant = 'ghost', block = false, className = '', onClick, children }: ButtonLikeProps) {
  return (
    <View
      className={`ui-button ui-button--${variant}${block ? ' ui-button--block' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
    >
      {children}
    </View>
  )
}

interface TagProps extends PropsWithChildren {
  tone?: 'default' | 'ai' | 'ps'
}

export function Tag({ tone = 'default', children }: TagProps) {
  return <Text className={`ui-tag ui-tag--${tone}`}>{children}</Text>
}

export function MiniAvatar() {
  return <Text className='mini-avatar' />
}

export function SectionTitle({ title, meta }: { title: string; meta: string }) {
  return (
    <View className='section-title'>
      <Text className='section-title__heading'>{title}</Text>
      <Text className='section-title__meta'>{meta}</Text>
    </View>
  )
}

export function GlassCard({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <View className={`glass-card${className ? ` ${className}` : ''}`}>{children}</View>
}
