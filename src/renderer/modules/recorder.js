import fs from 'fs-extra'
import request from 'request'
import ffmpeg from 'fluent-ffmpeg'
import Vue from 'vue'
import db from '@/db'
import log from '@/modules/log'
import config from '@/modules/config'
import { noticeError, createNotice } from '@/helper'
import { ChannelStatus, EmptyFn } from 'const'

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
    async checkChannel (channel, force) {
      // 目前来看, 有任何状态时, 都不应该进入检查状态, 所以status不为0时直接return, 除非force
      if (channel.status && !force) return
      if (channel.getStatus(ChannelStatus.Checking)) return

      // 检查开播状态, 如果在直播中则获取流信息
      channel.setStatus(ChannelStatus.Checking, true)
      let channelInfo, streamInfo
      try {
        channelInfo = await channel.getInfo()
        if (!channelInfo.living) return
        streamInfo = await channel.getStream()
        if (!streamInfo) return
      } finally {
        channel.setStatus(ChannelStatus.Checking, false)
      }

      // 发出通知
      if (config.record.notice) createNotice(channel.profile, channelInfo.title)
      // 开始录播
      await this.startRecord(channel, streamInfo, channelInfo)
    },
    async startRecord (channel, streamInfo, channelInfo) {
      if (channel.getStatus(ChannelStatus.Recording)) return
      channel.setStatus(ChannelStatus.Recording, true)

      const stopRecord = this.downloadStreamUseFfmpeg(streamInfo.stream, channel.genRecordPath(), (err) => {
        channel.setStatus(ChannelStatus.Recording, false)
        channel.record.recordLog.update({ stopped_at: new Date() }).catch(noticeError)
        channel.record = null
        if (err) {
          if (err.message.trim().endsWith('Server returned 404 Not Found')) {
            log.warn('ffmpeg error 404', streamInfo)
            return
          }

          return noticeError(err, '录播过程中发生错误')
        }
        // 录播正常结束, 可以在这里做额外处理, 目前暂无
      })

      const recordLog = await db.RecordLog.create({
        platform: channel.platform,
        address: channel.address,
        alias: channel.alias,
        owner: channelInfo.owner,
        title: channelInfo.title,
        quality: channel.qualities[streamInfo.quality],
        circuit: channel.circuits[streamInfo.circuit]
      })

      channel.record = {
        streamInfo,
        channelInfo,
        recordLog,
        stopRecord
      }
    },
    downloadStream (url, savePath, callback = EmptyFn) {
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
    },
    downloadStreamUseFfmpeg (url, savePath, callback = EmptyFn) {
      const command = ffmpeg(url)
        .outputOptions(
          '-user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
          '-c', 'copy'
        )
        .output(savePath)
        .on('error', callback)
        .on('end', () => callback())
        .on('stderr', stderrLine => log.trace('ffmpeg:', stderrLine))
      command.run()

      return () => command.ffmpegProc && command.ffmpegProc.stdin.write('q')
    }
  }
})
