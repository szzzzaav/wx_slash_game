import { View } from '@tarojs/components'

import './index.scss'

interface PsSymbolsProps {
  compact?: boolean
}

export function PsSymbols({ compact = false }: PsSymbolsProps) {
  return (
    <View className={`ps-symbols${compact ? ' ps-symbols--compact' : ''}`}>
      <View className='ps-symbols__tri' />
      <View className='ps-symbols__circle' />
      <View className='ps-symbols__cross' />
      <View className='ps-symbols__square' />
    </View>
  )
}
