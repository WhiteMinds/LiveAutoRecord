import Vue from 'vue'

Vue.mixin({
  methods: {
  },
  data () {
    return {
      package: require('../../package.json')
    }
  }
})
