import Taro from '@tarojs/taro'
import { CoverView, Input, Swiper, SwiperItem, Text, View } from '@tarojs/components'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { BottomNav } from '../../components/BottomNav'
import { PsSymbols } from '../../components/PsSymbols'
import { MiniAvatar, Tag, UiButton } from '../../components/UiPrimitives'
import { RenderHost } from '../../renderers/RenderHost'
import type { RenderHostStatusPayload } from '../../renderers/types'
import { createMockGameDsl } from '../../renderers/webgl-canvas/dslParser'
import { FEED_RENDER_RESUME_DELAY_MS } from '../../renderers/webgl-canvas/scheduler'

import './index.scss'

const games = [
  {
    id: 'sky-corridor',
    title: '空中回廊',
    meta: '解谜 · 中等 · 4 分钟',
    creator: '由 Lumen 创建',
    label: '自动演示 01 · 旋转平台',
    likes: '12.8k',
    comments: 486
  },
  {
    id: 'cloud-dodge',
    title: '云端避让',
    meta: '躲避 · 简单 · 2 分钟',
    creator: '由 NeoLan 创建',
    label: '自动演示 02 · 轻量动作',
    likes: '8.6k',
    comments: 233
  },
  {
    id: 'glass-maze',
    title: '玻璃迷宫',
    meta: '迷宫 · 困难 · 6 分钟',
    creator: '由 QuietBot 创建',
    label: '自动演示 03 · 反射路径',
    likes: '21.4k',
    comments: 719
  }
]

const seedComments = [
  ['山间回声', '刚刚', '旋转平台的节奏很舒服，像一局很短的空间谜题。'],
  ['南风试玩', '2 分钟前', '出口藏得克制，不会一眼看到，但也没有故意为难。'],
  ['青灰色', '8 分钟前', '希望下次生成能保留这个等距镜头。']
]

export default function FeedPage() {
  const [current, setCurrent] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState(seedComments)
  const [renderStatusByGame, setRenderStatusByGame] = useState<Record<string, RenderHostStatusPayload>>({})
  const swipeResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentGame = games[current]
  const gameDsls = useMemo(() => games.map((game, index) => createMockGameDsl({
    id: game.id,
    title: game.title,
    variant: index,
    type: index === 1 ? 'runner' : index === 2 ? 'maze' : 'puzzle',
    difficulty: index === 2 ? 4 : index === 1 ? 2 : 3,
    estimatedDuration: index === 1 ? 120 : index === 2 ? 360 : 240
  })), [])
  const commentCount = currentGame.comments + comments.length - seedComments.length

  const runtimeState = useMemo(() => ({
    activeGameId: currentGame.title,
    activeIndex: current,
    renderMode: 'current-active-neighbors-snapshot',
    renderStatus: renderStatusByGame[currentGame.id]?.status || 'idle',
    renderBackend: renderStatusByGame[currentGame.id]?.backend || 'canvas2d',
    renderSuspended: isSwiping || drawerOpen
  }), [current, currentGame.id, currentGame.title, drawerOpen, isSwiping, renderStatusByGame])

  useEffect(() => () => {
    if (swipeResumeTimerRef.current) {
      clearTimeout(swipeResumeTimerRef.current)
    }
  }, [])

  const handleRenderStatusChange = useCallback((payload: RenderHostStatusPayload) => {
    setRenderStatusByGame(prev => ({
      ...prev,
      [payload.gameId]: payload
    }))
  }, [])

  const suspendRenderDuringSwipe = useCallback(() => {
    setIsSwiping(true)
    if (swipeResumeTimerRef.current) {
      clearTimeout(swipeResumeTimerRef.current)
    }
    swipeResumeTimerRef.current = setTimeout(() => {
      setIsSwiping(false)
      swipeResumeTimerRef.current = null
    }, FEED_RENDER_RESUME_DELAY_MS)
  }, [])

  const handleFeedChange = useCallback((event: { detail: { current: number } }) => {
    setCurrent(event.detail.current)
    suspendRenderDuringSwipe()
  }, [suspendRenderDuringSwipe])

  const submitComment = () => {
    const text = commentText.trim()
    if (!text) {
      Taro.showToast({ title: '先写一句评论', icon: 'none' })
      return
    }
    setComments(prev => [['我', '刚刚', text], ...prev])
    setCommentText('')
    Taro.showToast({ title: '评论已发送', icon: 'none' })
  }

  return (
    <View
      className='feed-page screen'
      data-render-backend={runtimeState.renderBackend}
      data-render-status={runtimeState.renderStatus}
      data-runtime={runtimeState.renderMode}
    >
      <Swiper
        className='feed-page__swiper'
        vertical
        circular
        current={current}
        duration={220}
        onChange={handleFeedChange}
        onTransition={suspendRenderDuringSwipe}
        onAnimationFinish={() => setIsSwiping(false)}
      >
        {games.map((game, index) => {
          const isActive = index === current
          const isNeighbor = Math.abs(index - current) === 1 || Math.abs(index - current) === games.length - 1
          return (
            <SwiperItem key={game.title} className='feed-page__item'>
              <View className={`feed-card${isActive ? ' feed-card--active' : ''}${isNeighbor ? ' feed-card--neighbor' : ' feed-card--snapshot'}`}>
                <RenderHost
                  gameId={game.id}
                  dsl={gameDsls[index]}
                  active={isActive && !runtimeState.renderSuspended}
                  backend='canvas2d'
                  onStatusChange={handleRenderStatusChange}
                  previewMode={runtimeState.renderSuspended ? 'snapshot' : isActive ? 'active' : isNeighbor ? 'neighbor' : 'snapshot'}
                  quality={isActive ? 'medium' : isNeighbor ? 'low' : 'snapshot'}
                  variant={index}
                />
                <PsSymbols />
                <CoverView className='feed-card__scene-label'>{game.label}</CoverView>
                <View className='feed-card__caption'>
                  <View className='creator-row'><MiniAvatar /><Text>{game.creator}</Text></View>
                  <Text className='game-title'>{game.title}</Text>
                  <View className='feed-card__meta-row'>
                    <Tag>{game.meta.split(' · ')[0]}</Tag>
                    <Text className='feed-card__meta-text'>{game.meta.split(' · ').slice(1).join(' · ')}</Text>
                  </View>
                  <UiButton variant='primary' onClick={() => Taro.navigateTo({ url: '/pages/game/index' })}>
                    <Text className='feed-card__play-symbol'>△</Text>
                    <Text>开始玩</Text>
                  </UiButton>
                </View>
              </View>
            </SwiperItem>
          )
        })}
      </Swiper>

      <CoverView className='feed-page__top'>
        <CoverView>
          <CoverView className='title-block__title'>刷游戏</CoverView>
          <CoverView className='title-block__meta'>左滑可减少此类游戏</CoverView>
        </CoverView>
        <CoverView className='mini-avatar feed-page__avatar' />
      </CoverView>

      <CoverView className='side-actions'>
        <CoverView className={`side-action${liked ? ' side-action--active' : ''}`} onClick={() => setLiked(prev => !prev)}>
          <CoverView className='side-action__icon'><CoverView className='side-action__glyph'>○</CoverView></CoverView>
          <CoverView className='side-action__label'>{currentGame.likes}</CoverView>
        </CoverView>
        <CoverView className='side-action' onClick={() => setDrawerOpen(true)}>
          <CoverView className='side-action__icon'><CoverView className='side-action__glyph'>□</CoverView></CoverView>
          <CoverView className='side-action__label'>{commentCount}</CoverView>
        </CoverView>
        <CoverView className={`side-action${saved ? ' side-action--active' : ''}`} onClick={() => setSaved(prev => !prev)}>
          <CoverView className='side-action__icon'><CoverView className='side-action__glyph'>◇</CoverView></CoverView>
          <CoverView className='side-action__label'>收藏</CoverView>
        </CoverView>
        <CoverView className='side-action' onClick={() => Taro.showToast({ title: '分享卡片已生成', icon: 'none' })}>
          <CoverView className='side-action__icon'><CoverView className='side-action__glyph side-action__glyph--share'>↗</CoverView></CoverView>
          <CoverView className='side-action__label'>分享</CoverView>
        </CoverView>
      </CoverView>

      <View className={`drawer-backdrop${drawerOpen ? ' drawer-backdrop--open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <View className={`comment-drawer${drawerOpen ? ' comment-drawer--open' : ''}`}>
        <View className='comment-drawer__handle' />
        <View className='comment-drawer__head'>
          <View>
            <Text className='comment-drawer__title'>评论</Text>
            <Text className='comment-drawer__meta'>{commentCount} 条讨论 · 按热度排序</Text>
          </View>
          <Text className='icon-shell comment-drawer__close' onClick={() => setDrawerOpen(false)}>×</Text>
        </View>
        <View className='comment-list'>
          {comments.map(comment => (
            <View key={`${comment[0]}-${comment[2]}`} className='comment-item'>
              <Text className='comment-avatar' />
              <View>
                <View className='comment-item__row'><Text className='comment-item__name'>{comment[0]}</Text><Text>{comment[1]}</Text></View>
                <Text className='comment-item__copy'>{comment[2]}</Text>
              </View>
            </View>
          ))}
        </View>
        <View className='comment-compose'>
          <Input
            className='comment-compose__input'
            value={commentText}
            placeholder='写下试玩感受'
            onInput={event => setCommentText(String(event.detail.value))}
          />
          <Text className='comment-compose__send' onClick={submitComment}>发送</Text>
        </View>
      </View>

      <BottomNav active='feed' />
    </View>
  )
}
