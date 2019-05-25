import uuid4 from 'uuid/v4'
import MD5 from 'crypto-js/md5'
import * as queryString from 'query-string'
import requester from '@/modules/requester'

// Variables
// =============================================================================

const signCaches = {}

// Exports
// =============================================================================

/* eslint-disable no-useless-computed-key */
export const qualities = {
  // Data: Chinese (这里一致是因为数据和中文就是一样的)
  ['流畅']: '流畅',
  ['高清']: '高清',
  ['超清']: '超清',
  ['蓝光']: '蓝光',
  ['蓝光4M']: '蓝光4M',
  ['蓝光8M']: '蓝光8M',
  ['蓝光10M']: '蓝光10M'
}
/* eslint-enable no-useless-computed-key */

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
  quality: '超清',
  circuit: 'ws-h5'
}

export function getUrl (address) {
  let base = 'https://www.douyu.com/'
  return new URL(base + address)
}

export async function getStream (address, quality, circuit, opts = {}) {
  let sign = await getSignFn(address, opts.rejectCache)
  let did = uuid4().replace(/-/g, '')
  let time = Math.ceil(Date.now() / 1000)
  let signed = sign(address, did, time)
  signed = queryString.parse(signed)

  let response = await requester.post(`https://www.douyu.com/lapi/live/getH5Play/${address}`, {
    resolveWithFullResponse: true,
    simple: false,
    json: true,
    form: Object.assign({}, signed, {
      cdn: circuit,
      rate: opts.rate || 0,
      iar: 0,
      ive: 0
    })
  })

  if (response.statusCode !== 200) {
    if (response.statusCode === 403 && response.body === '鉴权失败' && !opts.rejectCache) {
      // 使用非缓存的sign函数再次签名
      return getStream(address, quality, circuit, Object.assign({}, opts, { rejectCache: true }))
    }

    throw new Error(`Unexpected status code, ${response.statusCode}, ${response.body}`)
  }

  let json = response.body
  // 不存在的房间, 已被封禁, 未开播
  if ([-3, -4, -5].includes(json.error)) return
  // 其他
  if (json.error !== 0) throw new Error('Unexpected error code, ' + json.error)

  // 检测是否支持指定的画质
  let target = json.data.multirates.find(obj => obj.name === quality)
  if (target && json.data.rate !== target.rate) {
    // 切换到目标画质
    return getStream(address, quality, circuit, Object.assign({}, opts, { rate: target.rate }))
  }

  // 实际使用的画质
  if (!target) quality = json.data.multirates.find(obj => obj.rate === json.data.rate).name
  // 实际使用的线路
  circuit = json.data.rtmp_cdn

  return {
    stream: `${json.data.rtmp_url}/${json.data.rtmp_live}`,
    quality,
    circuit
  }
}

export function getDanmakuClient (address) {
  // todo 返回一个具有start/stop接口, 实现了event的弹幕client
}

// Utils
// =============================================================================

/* eslint-disable no-new-func */
async function getSignFn (address, rejectCache) {
  if (!rejectCache && signCaches.hasOwnProperty(address)) {
    // 有缓存, 直接使用
    return signCaches[address]
  }

  let json = await requester.get('https://www.douyu.com/swf_api/homeH5Enc?rids=' + address, { json: true })
  if (json.error !== 0) throw new Error('Unexpected error code, ' + json.error)
  let code = json.data && json.data['room' + address]
  if (!code) throw new Error('Unexpected result with homeH5Enc, ' + JSON.stringify(json))

  let genSign = new Function('CryptoJS', code + 'return ub98484234')
  let sign = genSign({ MD5 })
  signCaches[address] = sign

  return sign
}
/* eslint-enable no-new-func */
