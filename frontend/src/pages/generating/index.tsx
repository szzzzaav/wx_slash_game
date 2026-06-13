import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { useEffect, useMemo, useState } from 'react'

import { BottomNav } from '../../components/BottomNav'
import { PsSymbols } from '../../components/PsSymbols'
import { StatusBar } from '../../components/StatusBar'
import { GlassCard, SectionTitle, Tag, UiButton } from '../../components/UiPrimitives'
import { GameCoverScene } from '../../components/GameCoverScene'

import './index.scss'

const steps = [
  ['理解创意', '提取天空城堡、解谜、旋转平台'],
  ['匹配模板', '选择正交等距关卡骨架'],
  ['生成关卡', '铺设平台、机关与出口'],
  ['验证可玩性', '检查路径闭环与卡死点'],
  ['渲染预览', '输出封面与首屏试玩']
]

export default function GeneratingPage() {
  const [active, setActive] = useState(2)
  const progress = useMemo(() => Math.round((active / steps.length) * 100), [active])

  useEffect(() => {
    if (active >= steps.length) return undefined
    const timer = setTimeout(() => setActive(prev => Math.min(prev + 1, steps.length)), 900)
    return () => clearTimeout(timer)
  }, [active])

  const restart = () => {
    setActive(1)
    Taro.showToast({ title: '重新生成中', icon: 'none' })
  }

  return (
    <View className='generating-page screen'>
      <StatusBar />
      <PsSymbols compact />
      <View className='page-top'>
        <View>
          <Text className='title-block__title'>正在生成</Text>
          <Text className='title-block__meta'>{active === steps.length ? '预览已可试玩' : steps[active - 1][0]}</Text>
        </View>
        <Text className='icon-shell' onClick={restart}>↻</Text>
      </View>

      <View className='panel-scroll'>
        <View
          className='progress-orb'
          style={{ background: `conic-gradient(#a64dff ${progress}%, rgba(255,255,255,0.1) 0), #1f1f1f` }}
        >
          <View className='progress-orb__inner'>
            <Text className='progress-orb__percent'>{progress}%</Text>
            <Text className='progress-orb__meta'>3-10 秒预估</Text>
          </View>
        </View>

        <GlassCard>
          <View className='preview-mini'>
            <GameCoverScene compact variant={0} />
            <PsSymbols compact />
          </View>
          <View className='generating-page__summary'>
            <Text className='game-title generating-page__game-title'>天空城堡 · 旋转平台</Text>
            <Text className='generating-page__copy'>已生成第一段可玩路径，正在验证出口可达性与节奏。</Text>
          </View>
        </GlassCard>

        <SectionTitle title='生成流程' meta='轻量状态' />
        <View className='steps'>
          {steps.map((step, index) => {
            const stepNo = index + 1
            const done = stepNo < active
            const isActive = stepNo === active
            return (
              <View key={step[0]} className={`step${done ? ' step--done' : ''}${isActive ? ' step--active' : ''}`}>
                <Text className='step__index'>{stepNo}</Text>
                <View>
                  <Text className='step__title'>{step[0]}</Text>
                  <Text className='step__desc'>{step[1]}</Text>
                </View>
                <Tag>{done ? '完成' : isActive ? '进行中' : '等待'}</Tag>
              </View>
            )
          })}
        </View>

        <View className='generating-page__actions'>
          <UiButton variant='outline' onClick={() => Taro.redirectTo({ url: '/pages/workshop/index' })}>调整 Prompt</UiButton>
          <UiButton variant='primary' onClick={() => Taro.navigateTo({ url: '/pages/game/index' })}>预览试玩</UiButton>
        </View>
      </View>
      <BottomNav active='generating' />
    </View>
  )
}
