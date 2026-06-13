import { View } from '@tarojs/components'

import './index.scss'

interface GameCoverSceneProps {
  compact?: boolean
  variant?: number
}

export function GameCoverScene({ compact = false, variant = 0 }: GameCoverSceneProps) {
  return (
    <View className={`cover-scene cover-scene--variant-${variant % 3}${compact ? ' cover-scene--compact' : ''}`}>
      <View className='cover-scene__island'>
        <View className='cover-scene__tile cover-scene__tile--a' />
        <View className='cover-scene__tile cover-scene__tile--b' />
        <View className='cover-scene__tile cover-scene__tile--c' />
        <View className='cover-scene__tile cover-scene__tile--d' />
        <View className='cover-scene__bridge' />
        <View className='cover-scene__tower' />
        <View className='cover-scene__portal' />
        <View className='cover-scene__character' />
      </View>
    </View>
  )
}
