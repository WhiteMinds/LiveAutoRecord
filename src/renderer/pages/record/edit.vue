<template>
  <div class="lar-page">
    <Card :dis-hover="true">
      <h3 slot="title">{{ isNew ? '添加' : '设置' }}录播</h3>
      <Form ref="form" :model="form" :rules="isNew ? rules : null" :label-width="100">
        <FormItem label="平台">
          <i-select v-model="form.platform" @on-change="onPlatformChange" :disabled="!isNew">
            <Option v-for="(val, key) in PlatformList" :value="val" :key="key">{{ Platform[val] }}</Option>
          </i-select>
        </FormItem>
        <FormItem label="直播间" prop="address">
          <i-input v-model="form.address" placeholder="直播间ID (复制直播间地址到此处将自动解析)" :disabled="!isNew"></i-input>
        </FormItem>
        <FormItem label="画质">
          <i-select v-model="form.quality">
            <Option v-for="(val, key) in platformObj.qualities" :value="key" :key="key">{{ val }}</Option>
          </i-select>
        </FormItem>
        <FormItem label="线路">
          <i-select v-model="form.circuit">
            <Option v-for="(val, key) in platformObj.circuits" :value="key" :key="key">{{ val }}</Option>
          </i-select>
        </FormItem>
        <FormItem label="录制弹幕">
          <i-switch v-model="form.barrage" size="large"></i-switch>
        </FormItem>
        <FormItem label="录播后自动处理">
          <i-switch v-model="form.auto_process" size="large"></i-switch>
        </FormItem>
        <FormItem class="buttons">
          <Button type="success" :loading="saving" @click="confirm">确认</Button>
          <Button :disabled="saving" @click="$router.back()">取消</Button>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>

<script>
  import _ from 'lodash'
  import db from '@/db'
  import platforms from '@/platforms'
  import { noticeError } from '@/helper'
  import { Route, Platform, PlatformList } from 'const'

  export default {
    name: 'record-edit',
    data () {
      return {
        Platform,
        PlatformList,

        model: null,
        form: {},
        rules: {
          address: [ { required: true, message: '直播间不能为空', trigger: 'blur' } ]
        },
        saving: false
      }
    },
    computed: {
      isNew () {
        return this.$route.name === Route.RecordAdd
      },
      platformObj () {
        return platforms[this.form.platform || Platform.DouYu]
      }
    },
    async mounted () {
      try {
        await this.initModel()
      } catch (err) {
        noticeError(err, '初始化模型失败')
      }
    },
    methods: {
      async initModel () {
        if (this.isNew) {
          this.model = await db.Channel.build()
          this.onPlatformChange()
          this.form = this.model
        } else {
          this.model = this.$store.channels.find(channel => channel.id === Number(this.$route.params.id))
          if (!this.model) throw new Error('Cant find target channel')
          // 不直接使用model.toJSON, 因为后面会直接将form给assign到model上, 使用pick防止status等属性的覆盖
          this.form = _.pick(this.model, ['platform', 'address', 'quality', 'circuit', 'barrage', 'auto_process'])
        }
      },

      // Event listeners
      // =============================================================================

      async onPlatformChange () {
        this.model.quality = this.platformObj.preferred.quality
        this.model.circuit = this.platformObj.preferred.circuit
      },

      // Actions
      // =============================================================================

      async confirm () {
        this.saving = true
        let valid = await this.$refs.form.validate()
        if (!valid) {
          this.saving = false
          return
        }

        if (this.isNew) {
          await this.model.save()
          this.$store.channels.push(this.model)
          this.$Message.success('保存成功')
        } else {
          Object.assign(this.model, this.form)
          await this.model.save()
          // todo 这里可以考虑改成自动终止当前录制重新开始
          this.$Message.success('设置成功, 改动将于下一次录制时生效')
        }

        this.saving = false
        this.$router.back()
      }
    }
  }
</script>

<style scoped>
  .ivu-select {
    width: 200px;
  }
</style>
