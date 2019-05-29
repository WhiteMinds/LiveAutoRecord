import Vue from 'vue'
import { ChannelStatus } from 'const'

export default new Vue({
  functional: true,
  data: {
    channels: []
  },
  computed: {
    recordingChannels () {
      return this.channels.filter(channel => channel.getStatus(ChannelStatus.Recording))
    }
  }
})
