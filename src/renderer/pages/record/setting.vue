<template>
  <div class="lar-page">
    <Card :dis-hover="true">
      <h3 slot="title">录播设置</h3>
      <!-- todo 可以考虑这里制作一些提示 (左侧label给问号, 或者右上角给问号弹窗) -->
      <Form ref="form" :model="form" :rules="rules" :label-width="120">
        <FormItem label="录播时通知">
          <i-switch v-model="form.notice" size="large"></i-switch>
        </FormItem>
        <FormItem label="开播检查间隔 (秒)" prop="checkInterval">
          <InputNumber v-model="form.checkInterval"></InputNumber>
        </FormItem>
        <FormItem label="自动分段 (分钟)" prop="segment">
          <InputNumber v-model="form.segment"></InputNumber>
        </FormItem>
        <FormItem label="录像保存路径" prop="saveFolder">
          <i-input v-model="form.saveFolder"></i-input>
        </FormItem>
        <FormItem label="录像文件名" prop="saveName">
          <i-input v-model="form.saveName"></i-input>
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
  import config from '@/modules/config'
  import { noticeError } from '@/helper'

  export default {
    name: 'record-setting',
    data () {
      return {
        form: Object.assign({}, config.record),
        rules: {
          checkInterval: [ { required: true, type: 'number', message: '开播检查间隔不能为空', trigger: 'blur' } ],
          segment: [ { required: true, type: 'number', message: '自动分段不能为空', trigger: 'blur' } ],
          saveFolder: [ { required: true, message: '录像保存路径不能为空', trigger: 'blur' } ],
          saveName: [ { required: true, message: '录像文件名不能为空', trigger: 'blur' } ]
        },
        saving: false
      }
    },
    methods: {
      async confirm () {
        this.saving = true
        let valid = await this.$refs.form.validate()
        if (!valid) {
          this.saving = false
          return
        }

        try {
          Object.assign(config.record, this.form)
          config.save()
          this.$router.back()
        } catch (err) {
          noticeError(err, '保存录播设置失败')
        }
      }
    }
  }
</script>

<style scoped>

</style>
