import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { useState } from 'react'

import { BottomNav } from '../../components/BottomNav'
import { PsSymbols } from '../../components/PsSymbols'
import { StatusBar } from '../../components/StatusBar'
import { SectionTitle } from '../../components/UiPrimitives'

import './index.scss'

const tabs = ['记录', '成就', '生成']
const recent = [
  ['空中回廊', '进度 42% · 01:18'],
  ['镜面庭院', '已通关 · A 评分']
]
const achievements = [
  ['首发', '发布首个游戏'],
  ['连刷', '7 天活跃'],
  ['解构', '完成 5 个谜题']
]
const generations = [
  ['玻璃迷宫', '草稿 · 待验证可玩性'],
  ['云端避让', '已生成 · 可发布']
]

export default function ProfilePage() {
  const [tab, setTab] = useState('记录')

  return (
    <View className='profile-page screen'>
      <StatusBar />
      <PsSymbols compact />
      <View className='page-top'>
        <View>
          <Text className='title-block__title'>我的</Text>
          <Text className='title-block__meta'>游玩与创作资产</Text>
        </View>
        <Text className='icon-shell' onClick={() => Taro.showToast({ title: '设置已打开', icon: 'none' })}>⌾</Text>
      </View>

      <View className='panel-scroll'>
        <View className='profile-head'>
          <PsSymbols compact />
          <View className='profile-row'>
            <Text className='profile-avatar' />
            <View>
              <Text className='profile-row__name'>夜航玩家</Text>
              <Text className='profile-row__desc'>偏好：解谜、等距、短局</Text>
            </View>
          </View>
          <View className='profile-stats'>
            <View className='stat-card'><Text className='stat-card__value'>128</Text><Text className='stat-card__label'>游玩局数</Text></View>
            <View className='stat-card'><Text className='stat-card__value'>16</Text><Text className='stat-card__label'>已生成</Text></View>
            <View className='stat-card'><Text className='stat-card__value'>9</Text><Text className='stat-card__label'>成就</Text></View>
          </View>
        </View>

        <SectionTitle title='资产' meta='快速切换' />
        <View className='segmented'>
          {tabs.map(item => (
            <Text key={item} className={tab === item ? 'segmented__item segmented__item--active' : 'segmented__item'} onClick={() => setTab(item)}>{item}</Text>
          ))}
        </View>

        <SectionTitle title='最近游玩' meta='继续' />
        <View className='history-list'>
          {recent.map(item => (
            <View key={item[0]} className='history-item' onClick={() => Taro.navigateTo({ url: '/pages/game/index' })}>
              <Text className='history-thumb' />
              <View className='history-copy'><Text className='history-copy__title'>{item[0]}</Text><Text className='history-copy__meta'>{item[1]}</Text></View>
              <Text>△</Text>
            </View>
          ))}
        </View>

        <SectionTitle title='成就' meta='本周' />
        <View className='stat-grid'>
          {achievements.map(item => (
            <View key={item[0]} className='stat-card'><Text className='stat-card__value'>{item[0]}</Text><Text className='stat-card__label'>{item[1]}</Text></View>
          ))}
        </View>

        <SectionTitle title='生成历史' meta='草稿可继续' />
        <View className='history-list'>
          {generations.map((item, index) => (
            <View key={item[0]} className='history-item' onClick={() => Taro.redirectTo({ url: index === 0 ? '/pages/workshop/index' : '/pages/generating/index' })}>
              <Text className='history-thumb' />
              <View className='history-copy'><Text className='history-copy__title'>{item[0]}</Text><Text className='history-copy__meta'>{item[1]}</Text></View>
              <Text>›</Text>
            </View>
          ))}
        </View>
      </View>
      <BottomNav active='profile' />
    </View>
  )
}
