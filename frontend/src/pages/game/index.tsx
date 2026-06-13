import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import { BottomNav } from '../../components/BottomNav'
import { PsSymbols } from '../../components/PsSymbols'
import { StatusBar } from '../../components/StatusBar'
import { GlassCard, MiniAvatar, SectionTitle, Tag, UiButton } from '../../components/UiPrimitives'
import { GameCoverScene } from '../../components/GameCoverScene'

import './index.scss'

export default function GamePage() {
  return (
    <View className='game-page screen'>
      <StatusBar />
      <PsSymbols compact />
      <View className='page-top'>
        <Text className='icon-shell' onClick={() => Taro.navigateBack()}>‹</Text>
        <Text className='icon-shell' onClick={() => Taro.showToast({ title: '已加入收藏', icon: 'none' })}>◇</Text>
      </View>
      <View className='panel-scroll'>
        <View className='detail-hero'>
          <GameCoverScene variant={0} />
          <PsSymbols compact />
          <View className='detail-hero__controls'>
            <UiButton variant='primary' className='detail-hero__play' onClick={() => Taro.showToast({ title: '试玩已开始', icon: 'none' })}>
              <Text>△</Text>
              <Text>试玩 45 秒</Text>
            </UiButton>
            <UiButton onClick={() => Taro.showToast({ title: '分享卡已生成', icon: 'none' })}>分享</UiButton>
          </View>
        </View>

        <GlassCard>
          <View className='creator-row'><MiniAvatar /><Text>由 Lumen 创建 · prompt 生成</Text></View>
          <Text className='game-title'>空中回廊</Text>
          <Text className='detail-copy'>旋转悬浮平台，给小小旅人铺出通往出口的角度。每次滑动都会改变路径，而不是改变视角。</Text>
          <View className='detail-meta-row'>
            <Tag>解谜</Tag>
            <Text className='detail-meta-row__copy'>中等 · 4 分钟</Text>
          </View>
        </GlassCard>

        <SectionTitle title='试玩状态' meta='轻量覆盖层' />
        <View className='stat-grid'>
          <View className='stat-card'><Text className='stat-card__value'>3/7</Text><Text className='stat-card__label'>已解机关</Text></View>
          <View className='stat-card'><Text className='stat-card__value'>01:18</Text><Text className='stat-card__label'>当前用时</Text></View>
          <View className='stat-card'><Text className='stat-card__value'>A-</Text><Text className='stat-card__label'>可玩性评分</Text></View>
        </View>

        <SectionTitle title='相似玩法' meta='继续刷' />
        <View className='history-list'>
          {['镜面庭院', '雾塔归路'].map((name, index) => (
            <View key={name} className='history-item' onClick={() => Taro.redirectTo({ url: '/pages/feed/index' })}>
              <Text className='history-thumb' />
              <View className='history-copy'>
                <Text className='history-copy__title'>{name}</Text>
                <Text className='history-copy__meta'>{index === 0 ? '反射路径 · 3 分钟' : '平台跳跃 · 5 分钟'}</Text>
              </View>
              <Text>›</Text>
            </View>
          ))}
        </View>
      </View>
      <BottomNav active='feed' />
    </View>
  )
}
