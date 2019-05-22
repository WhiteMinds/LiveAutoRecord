import fs from 'fs-extra'
import request from 'request'
import Vue from 'vue'
import config from '@/modules/config'
import { noticeError } from '@/helper'
import { ChannelStatus } from 'const'

export default new Vue({
  functional: true,
  methods: {
    init () {
      setInterval(this.checkAllChannels, config.record.checkInterval * 1e3)
      this.checkAllChannels()
    },
    async checkAllChannels () {
      for (let channel of this.$store.channels) {
        try {
          await this.checkChannel(channel)
        } catch (err) {
          noticeError(err, '检查频道时发生错误')
        }
      }
    },
    async checkChannel (channel) {
      // 目前来看, 有任何状态时, 都不应该进入检查状态, 所以status不为0时直接return
      if (channel.status) return

      // 检查是否开播
      channel.setStatus(ChannelStatus.Checking, true)
      let result
      try {
        result = await channel.getStream()
      } finally {
        channel.setStatus(ChannelStatus.Checking, false)
      }
      if (!result) return

      // 开始录播
      channel.setStatus(ChannelStatus.Recording, true)
      // todo 通知录播开始
      channel._stopRecord = this.downloadStream(result.stream, channel.genRecordPath(), (err) => {
        channel.setStatus(ChannelStatus.Recording, false)
        if (err) return noticeError(err, '录播过程中发生错误')

        // todo 录播正常结束, 在这里写视频自动处理, 或者直接将录播改成用ffmpeg录制就不用处理
      })
    },
    downloadStream (url, savePath, callback = () => {}) {
      const stream = fs.createWriteStream(savePath)

      const req = request(url)
        .on('response', (response) => {
          if (response.statusCode !== 200) {
            callback(new Error(`Unexpected status code, ${response.statusCode}, ${response.body}`))
            return
          }

          response.pipe(stream)
        })
        .on('error', err => {
          stream.close()
          callback(err)
        })
        .on('end', () => {
          stream.close()
          callback()
        })

      return req.abort.bind(req)
    }
  }
})
