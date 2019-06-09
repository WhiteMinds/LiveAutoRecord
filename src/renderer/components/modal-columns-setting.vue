<template>
  <Modal v-model="visible"
         title="表头配置"
         @on-ok="confirm">
    <Transfer
      :titles="['展示的表头', '隐藏的表头']"
      :data="transferData"
      :target-keys="selected"
      @on-change="handleChange"></Transfer>
  </Modal>
</template>

<script>
  import config from '@/modules/config'

  export default {
    name: 'ModalColumnsSetting',
    props: ['value', 'columns', 'uniqueId'],
    data () {
      return {
        visible: this.value,
        selected: []
      }
    },
    computed: {
      transferData () {
        return this.columns.map(column => ({
          key: column.key,
          label: column.title
        }))
      }
    },
    watch: {
      value () {
        this.visible = this.value
        if (this.visible) this.onShow()
      },
      visible () {
        this.$emit('input', this.visible)
      }
    },
    methods: {
      onShow () {
        this.selected = config.hiddenColumns[this.uniqueId].slice(0)
      },
      confirm () {
        config.hiddenColumns[this.uniqueId] = this.selected
        config.save()
      },
      handleChange (newTargetKeys) {
        this.selected = newTargetKeys
      }
    }
  }
</script>

<style lang="scss" scoped>
  @import "~@/styles/global";

  /deep/ {
    .ivu-transfer {
      display: flex;
      align-items: center;
    }

    .ivu-transfer-list-content {
      @extend .scrollbar;
    }

    .ivu-transfer-list {
      height: 300px;
      flex-grow: 1;
    }
  }
</style>
