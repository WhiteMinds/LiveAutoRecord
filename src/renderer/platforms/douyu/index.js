export const qualities = {
  'SD': '流畅',
  'HD': '高清',
  'TD': '超清',
  'BD': '蓝光',
  'BD4M': '蓝光4M',
  'BD8M': '蓝光8M',
  'BD10M': '蓝光10M'
}

export const circuits = {
  'ws': '主线 (网宿)',
  'ws-h5': '主线-H5 (网宿)',
  'tct': '备用线路5 (腾讯云)',
  'tct-h5': '备用线路5-H5 (腾讯云)',
  'ali-h5': '备用线路6 (阿里云)',
  'ws2': '备用线路2 (网宿2)',
  'dl': '备用线路3 (帝联)'
}

export const preferred = {
  quality: 'TD',
  circuit: 'ws-h5'
}

export function getUrl (channel) {
  let base = 'https://www.douyu.com/'
  return new URL(base + channel)
}

export async function getStream (channel, quality, circuit) {
  // todo 返回stream地址
}

export function getDanmakuClient (channel) {
  // todo 返回一个具有start/stop接口, 实现了event的弹幕client
}
