import _ from 'lodash'
import fs from 'fs-extra'
import uuid4 from 'uuid/v4'
import request from 'request'
import ffmpeg from 'fluent-ffmpeg'
import Vue from 'vue'
import db from '@/db'
import DM3 from '@/db-dm3'
import log from '@/modules/log'
import config from '@/modules/config'
import { sleep, noticeError, createNotice } from '@/helper'
import { ChannelStatus, DM3DataType, EmptyFn } from 'const'

export default new Vue({
  functional: true,
  methods: {
    init () {
      this.checkLoop()
    },
    async checkLoop () {
      while (1) {
        if (config.record.autoCheck) await this.checkAllChannels()
        await sleep(config.record.checkInterval * 1e3)
      }
    },
    async checkAllChannels () {
      for (let channel of this.$store.channels) {
        if (config.record.multiCheck) {
          this.checkChannel(channel).catch(err => noticeError(err, '检查频道时发生错误'))
        } else {
          try {
            await this.checkChannel(channel)
          } catch (err) {
            noticeError(err, '检查频道时发生错误')
          }
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

      const savePath = channel.genSavePath(
        _.pick(channelInfo, ['owner', 'title']),
        {
          quality: streamInfo.qualityCN,
          circuit: streamInfo.circuitCN
        }
      )

      // 启动视频录制
      const stopRecord = this.downloadStreamUseFfmpeg(streamInfo.stream, savePath.record, (err) => {
        channel.setStatus(ChannelStatus.Recording, false)
        channel.record.stopDanmaku()
        channel.record.getRecordLog().update({ stoppedAt: new Date() }).catch(noticeError)
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

      // 创建录制记录
      const recordLog = await db.RecordLog.create({
        platform: channel.platform,
        address: channel.address,
        alias: channel.alias,
        owner: channelInfo.owner,
        title: channelInfo.title,
        file: savePath.record,
        quality: streamInfo.qualityCN,
        circuit: streamInfo.circuitCN
      })

      let stopDanmaku = EmptyFn
      if (channel.barrage) {
        // 启动弹幕录制
        const startTime = Date.now()
        try {
          let dm3 = await DM3(savePath.danmaku)
          await dm3.Data.insertInitData(recordLog)

          let client = channel.platformObj.getDanmakuClient(channel.address)
          client.on('message', async msg => {
            try {
              await dm3.Data.create({
                type: DM3DataType.Message,
                value: msg,
                relativeTime: Date.now() - startTime
              })
            } catch (err) {
              log.error('An error occurred while saving message to dm3', err)
            }
          })
          client.start()

          stopDanmaku = () => {
            client.stop()
            dm3.sequelize.close()
          }
        } catch (err) {
          noticeError(err, '弹幕录制启动失败')
        }
      }

      channel.record = {
        streamInfo,
        channelInfo,
        // 不能直接把model给过去, 否则会因为vue的keys检测无限递归
        getRecordLog: () => recordLog,
        stopRecord,
        stopDanmaku
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
      const uuid = uuid4()
      const command = ffmpeg(url)
        .outputOptions(
          '-user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
          '-c', 'copy',
          '-flvflags', 'add_keyframe_index'
        )
        .output(savePath)
        .on('error', callback)
        .on('end', () => callback())
        .on('stderr', stderrLine => log.trace(`FFMPEG [${uuid}]:`, stderrLine))
      command.run()

      return () => command.ffmpegProc && command.ffmpegProc.stdin.write('q')
    }
  }
})
