import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

import { SvgIcon, ICON_NAV_FEED, ICON_NAV_WORKSHOP, ICON_NAV_GENERATE, ICON_NAV_PROFILE } from '../Icons'

import './index.scss'

type NavKey = 'feed' | 'workshop' | 'generating' | 'profile'

const navItems: Array<{ key: NavKey; label: string; iconSrc: string; path: string }> = [
  { key: 'feed', label: '刷', iconSrc: ICON_NAV_FEED, path: '/pages/feed/index' },
  { key: 'workshop', label: '创作', iconSrc: ICON_NAV_WORKSHOP, path: '/pages/workshop/index' },
  { key: 'generating', label: '生成', iconSrc: ICON_NAV_GENERATE, path: '/pages/generating/index' },
  { key: 'profile', label: '我的', iconSrc: ICON_NAV_PROFILE, path: '/pages/profile/index' }
]

interface BottomNavProps {
  active: NavKey
}

export function BottomNav({ active }: BottomNavProps) {
  return (
    <View className='bottom-nav'>
      {navItems.map(item => (
        <View
          key={item.key}
          className={`bottom-nav__item${active === item.key ? ' bottom-nav__item--active' : ''}`}
          onClick={() => active !== item.key && Taro.redirectTo({ url: item.path })}
        >
          <SvgIcon src={item.iconSrc} size={48} />
          <Text className='bottom-nav__label'>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}
