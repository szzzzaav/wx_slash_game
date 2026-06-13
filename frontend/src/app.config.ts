export default defineAppConfig({
  pages: [
    'pages/feed/index',
    'pages/game/index',
    'pages/workshop/index',
    'pages/generating/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#03040c',
    navigationBarTitleText: '刷游戏',
    navigationBarTextStyle: 'white',
    backgroundColor: '#03040c'
  },
  lazyCodeLoading: 'requiredComponents'
})
