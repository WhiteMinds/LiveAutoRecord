// 这里手动暴露一个 dplayer 未声明类型导出的属性
declare module 'dplayer' {
  import OriginDPlayer from '@types/dplayer'

  export default class DPlayer extends OriginDPlayer {
    focus: boolean
  }
}
