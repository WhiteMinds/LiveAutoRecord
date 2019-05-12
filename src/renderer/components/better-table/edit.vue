<template>
  <div class="tables-edit-outer">
    <div v-if="!editing" class="tables-edit-con">
      <span class="value-con">{{ value }}</span>
      <Button @click="startEdit" class="tables-edit-btn" style="padding: 2px 4px;" type="text"><Icon type="md-create" /></Button>
    </div>
    <div v-else class="tables-editing-con">
      <i-input :value="value" @input="handleInput" class="tables-edit-input" />
      <Button @click="saveEdit" style="padding: 6px 4px;" type="text"><Icon type="md-checkmark" /></Button>
      <Button @click="cancelEdit" style="padding: 6px 4px;" type="text"><Icon type="md-close" /></Button>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'better-table-edit',
    props: {
      params: Object,
      value: [String, Number],
      editing: Boolean
    },
    methods: {
      handleInput (val) {
        this.$emit('input', val)
      },
      startEdit () {
        this.$emit('on-start-edit', this.params)
      },
      saveEdit () {
        this.$emit('on-save-edit', this.params)
      },
      cancelEdit () {
        this.$emit('on-cancel-edit', this.params)
      }
    }
  }
</script>

<style lang="scss">
  .tables-edit-outer{
    height: 100%;

    .tables-edit-con{
      display: flex;
      align-items: center;
      position: relative;
      height: 100%;
      min-height: 25px;

      .value-con{
        vertical-align: middle;
      }

      .tables-edit-btn{
        display: none;
        position: absolute;
        right: 10px;
        top: 0;
      }

      &:hover{
        .tables-edit-btn{
          display: inline-block;
        }
      }
    }

    .tables-editing-con{
      .tables-edit-input{
        width: calc(100% - 60px);
      }
    }
  }
</style>
