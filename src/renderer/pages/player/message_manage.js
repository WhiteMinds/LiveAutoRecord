import Vue from 'vue'
import platforms from '@/platforms'
import { noticeError } from '@/helper'
import { Platform, DM3DataType } from 'const'

export default new Vue({
  functional: true,
  data () {
    return {
      dp: null,
      loading: false,
      version: null,
      recordInfo: null,
      list: [],
      offset: 0
    }
  },
  methods: {
    init (dp) {
      this.dp = dp
      this.dp.on('seeked', this.seek)
      requestAnimationFrame(this.frame)
    },
    reset () {
      this.version = null
      this.recordInfo = null
      this.list = []
      this.offset = 0
    },
    async load (dm3) {
      this.loading = true
      try {
        this.version = (await dm3.Data.findBy({ type: DM3DataType.Version })).value
        this.recordInfo = (await dm3.Data.findBy({ type: DM3DataType.RecordInfo })).value
        let dataList = await dm3.Data.findAllBy({ type: DM3DataType.Message })
        this.list = dataList.map(data => Object.assign({}, data.value, { time: data.relativeTime }))

        switch (this.recordInfo.platform) {
          case Platform.DouYu:
            this.list.forEach(msg => {
              if (msg.avatar) msg.avatar = `http://apic.douyucdn.cn/upload/${msg.avatar}_small.jpg`
              if (msg.gfid) {
                let gift = platforms[Platform.DouYu].giftMap[msg.gfid]
                if (gift) msg.gift = { name: gift.name, img: gift.himg }
                else msg.gift = { name: '未知礼物' }
              }
            })
            break
        }

        this.seek()
      } catch (err) {
        noticeError(err, 'dm3数据加载失败')
      }
      this.loading = false
    },
    frame () {
      if (!this.loading && !this.dp.video.paused) {
        const time = this.dp.video.currentTime * 1e3
        let item = this.list[this.offset]
        while (item && time > item.time) {
          this.$emit('msg', item)
          item = this.list[++this.offset]
        }
      }

      requestAnimationFrame(this.frame)
    },
    seek () {
      const time = this.dp.video.currentTime * 1e3

      this.offset = 0
      for (let i = 0; i < this.list.length; i++) {
        if (this.list[i].time >= time) {
          this.offset = i
          break
        }
        this.offset = this.list.length
      }
      this.$emit('seek')
    }
  }
})
