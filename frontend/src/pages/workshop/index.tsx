import Taro from '@tarojs/taro'
import { Slider, Text, Textarea, View } from '@tarojs/components'
import { useState } from 'react'

import { BottomNav } from '../../components/BottomNav'
import { PsSymbols } from '../../components/PsSymbols'
import { StatusBar } from '../../components/StatusBar'
import { GlassCard, SectionTitle, UiButton } from '../../components/UiPrimitives'

import './index.scss'

const templates = ['解谜', '平台跳跃', '躲避', '收集', '推箱子', '迷宫']
const difficultyLabels = ['入门', '轻度', '标准', '进阶', '高压']
const toggles = ['旋转平台', '隐藏出口', '限时星尘']

export default function WorkshopPage() {
  const [template, setTemplate] = useState('解谜')
  const [difficulty, setDifficulty] = useState(3)
  const [duration, setDuration] = useState('4 分钟')
  const [theme, setTheme] = useState('天空城')
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    旋转平台: true,
    隐藏出口: true,
    限时星尘: false
  })

  return (
    <View className='workshop-page screen'>
      <StatusBar />
      <PsSymbols compact />
      <View className='page-top'>
        <View>
          <Text className='title-block__title'>创意工坊</Text>
          <Text className='title-block__meta'>Prompt 即游戏</Text>
        </View>
        <Text className='icon-shell' onClick={() => Taro.showToast({ title: '草稿已保存', icon: 'none' })}>□</Text>
      </View>

      <View className='panel-scroll'>
        <GlassCard className='prompt-box'>
          <Textarea
            className='prompt-box__input'
            value='我想要一个天空城堡风格的解谜游戏，玩法是旋转平台找到出口'
            maxlength={240}
            autoHeight={false}
          />
          <View className='prompt-actions'>
            <Text>自然语言描述即可</Text>
            <UiButton onClick={() => Taro.showToast({ title: '已整理 prompt', icon: 'none' })}>优化</UiButton>
          </View>
        </GlassCard>

        <SectionTitle title='模板' meta='选择一个基础玩法' />
        <View className='chip-grid'>
          {templates.map(item => (
            <Text key={item} className={`chip${template === item ? ' chip--active' : ''}`} onClick={() => setTemplate(item)}>{item}</Text>
          ))}
        </View>

        <SectionTitle title='难度' meta={difficultyLabels[difficulty - 1]} />
        <View className='slider-row'>
          <Slider
            min={1}
            max={5}
            step={1}
            value={difficulty}
            activeColor='#a64dff'
            backgroundColor='#4d4d4d'
            blockColor='#ffffff'
            onChanging={event => setDifficulty(event.detail.value)}
            onChange={event => setDifficulty(event.detail.value)}
          />
          <View className='difficulty-tags'><Text>入门</Text><Text>进阶</Text><Text>高压</Text></View>
        </View>

        <SectionTitle title='时长' meta='单局节奏' />
        <View className='segmented'>
          {['2 分钟', '4 分钟', '6 分钟'].map(item => (
            <Text key={item} className={duration === item ? 'segmented__item segmented__item--active' : 'segmented__item'} onClick={() => setDuration(item)}>{item}</Text>
          ))}
        </View>

        <SectionTitle title='颜色主题' meta='抽象封面感' />
        <View className='segmented'>
          {['天空城', '冷白', '蓝光'].map(item => (
            <Text key={item} className={theme === item ? 'segmented__item segmented__item--active' : 'segmented__item'} onClick={() => setTheme(item)}>{item}</Text>
          ))}
        </View>

        <SectionTitle title='特殊元素' meta='可开关' />
        <View className='toggle-row'>
          {toggles.map(item => (
            <View key={item} className='toggle-item' onClick={() => setEnabled(prev => ({ ...prev, [item]: !prev[item] }))}>
              <Text>{item}</Text>
              <Text className={`switch${enabled[item] ? ' switch--active' : ''}`}><Text className='switch__knob' /></Text>
            </View>
          ))}
        </View>

        <UiButton block variant='primary' className='workshop-page__generate' onClick={() => Taro.redirectTo({ url: '/pages/generating/index' })}>
          生成游戏
        </UiButton>
      </View>
      <BottomNav active='workshop' />
    </View>
  )
}
