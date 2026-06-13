import Taro from '@tarojs/taro'
import { CoverView } from '@tarojs/components'

import './index.scss'

type NavKey = 'feed' | 'workshop' | 'generating' | 'profile'

const navItems: Array<{ key: NavKey; label: string; mark: string; path: string }> = [
  { key: 'feed', label: '刷', mark: '+', path: '/pages/feed/index' },
  { key: 'workshop', label: '创作', mark: '↗', path: '/pages/workshop/index' },
  { key: 'generating', label: '生成', mark: '○', path: '/pages/generating/index' },
  { key: 'profile', label: '我的', mark: '⌾', path: '/pages/profile/index' }
]

interface BottomNavProps {
  active: NavKey
}

export function BottomNav({ active }: BottomNavProps) {
  return (
    <CoverView className='bottom-nav'>
      {navItems.map(item => (
        <CoverView
          key={item.key}
          className={`bottom-nav__item${active === item.key ? ' bottom-nav__item--active' : ''}`}
          onClick={() => active !== item.key && Taro.redirectTo({ url: item.path })}
        >
          <CoverView className='bottom-nav__icon'>{item.mark}</CoverView>
          <CoverView className='bottom-nav__label'>{item.label}</CoverView>
        </CoverView>
      ))}
    </CoverView>
  )
}
