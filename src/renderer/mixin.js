import Vue from 'vue'
import * as CONST from '@/const'

Vue.mixin({
  methods: {
  },
  data () {
    return {
      ...CONST,
      package: require('../../package.json')
    }
  }
})
