<template>
  <div class="lar-page">
    <Card :dis-hover="true">
      <h3 slot="title">软件设置</h3>
      <Form ref="form" :model="form" :label-width="120">
        <FormItem label="最小化到任务栏">
          <i-switch v-model="form.minimizeToTaskBar" size="large"></i-switch>
        </FormItem>
        <FormItem class="buttons">
          <Button type="success" :loading="saving" :disabled="!changed" @click="confirm">确认</Button>
          <Button :disabled="!changed || saving" @click="cancel">取消</Button>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>

<script>
  import config from '@/modules/config'
  import { noticeError } from '@/helper'

  export default {
    name: 'setting',
    data () {
      return {
        form: Object.assign({}, config.app),
        changed: false,
        saving: false
      }
    },
    watch: {
      form: {
        deep: true,
        handler () {
          this.changed = true
        }
      }
    },
    methods: {
      confirm () {
        this.saving = true
        try {
          Object.assign(config.app, this.form)
          config.save()
        } catch (err) {
          noticeError(err, '保存软件设置失败')
        }
        this.saving = false
        this.changed = false
      },
      cancel () {
        this.form = Object.assign({}, config.app)
        this.$nextTick(() => {
          this.changed = false
        })
      }
    }
  }
</script>

<style scoped>

</style>
