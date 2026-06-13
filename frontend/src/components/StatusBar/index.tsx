import { View, Text } from '@tarojs/components'

import './index.scss'

export function StatusBar() {
  return (
    <View className='status-bar'>
      <Text>20:28</Text>
      <View className='status-bar__icons'>
        <Text className='status-bar__dot' />
        <Text className='status-bar__dot' />
        <Text className='status-bar__dot' />
        <Text>86%</Text>
      </View>
    </View>
  )
}
