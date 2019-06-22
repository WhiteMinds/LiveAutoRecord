import Vue from 'vue'
import { DM3DataType } from 'const'
import { noticeError } from '@/helper'

export default new Vue({
  functional: true,
  data () {
    return {
      dp: null,
      loading: false,
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
    async load (dm3) {
      this.loading = true
      try {
        let dataList = await dm3.Data.findAllBy({ type: DM3DataType.Message })
        this.list = dataList.map(data => Object.assign({}, data.value, { time: data.relativeTime }))
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
    }
  }
})
