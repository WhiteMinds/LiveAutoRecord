<template>
  <div class="better-table">
    <TableTransfer />
    <div v-if="pageable" class="better-table-page" :style="{ 'margin-top': pagerExtMargin + 16 + 'px' }">
      <Page :total="data.length" :page-size="pageSize" :current="page" show-elevator @on-change="changePage"></Page>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { Table } from 'iview'
  import Edit from './edit'

  export default {
    name: 'BetterTable',
    components: {
      // 传输处理过后的props到Table组件中
      TableTransfer: {
        functional: true,
        render (h, content) {
          return h(Table, {
            ref: 'table',
            props: content.parent.processedTableProps,
            on: content.parent.$listeners
          })
        }
      }
    },
    // 继承Table的props, 新增props
    props: Object.assign({}, Table.props, {
      actions: Array,
      // 分页
      pageable: {
        type: Boolean,
        default: true
      },
      // 响应式, 根据容器大小自动改变pageSize和tableHeight等
      responsive: {
        type: Boolean,
        default: true
      }
    }),
    data () {
      return {
        tableHeight: 480,
        editingCellId: '',
        editingText: '',
        page: 1,
        pageSize: 10,
        pagerExtMargin: 0,
        sortData: null
      }
    },
    computed: {
      tableColumns () {
        let columns = this.columns.map(column => {
          // 浅拷贝一次, 因为可能要修改render
          column = _.clone(column)

          if (column.editable && !column.render) {
            column.render = (h, params) => {
              const cellId = `${params.index}-${params.column.key}`

              return h(Edit, {
                props: {
                  params: params,
                  value: this.tableData[params.index][params.column.key],
                  editing: this.editingCellId === cellId
                },
                on: {
                  'input': val => {
                    this.editingText = val
                  },
                  'on-start-edit': params => {
                    this.editingCellId = cellId
                  },
                  'on-cancel-edit': params => {
                    this.editingCellId = ''
                  },
                  'on-save-edit': params => {
                    this.editingCellId = ''
                    let args = [params, this.editingText, params.row[params.column.key]]
                    this.$emit('on-save-edit', ...args)
                    if (typeof column.onSaveEdit === 'function') column.onSaveEdit(...args)
                  }
                }
              })
            }
          }

          return column
        })

        if (this.actions) {
          let columnActions = {
            title: '操作',
            key: 'actions',
            render: (h, params) => {
              let btnTemplates = this.actions
                .filter(action => {
                  // 实现action.show的过滤
                  if (!action.hasOwnProperty('show')) return true
                  if (typeof action.show === 'function') return action.show(params)
                  return action.show
                })
                .map(action => {
                  // 实现loading
                  let loading = false
                  if (action.hasOwnProperty('loading')) {
                    loading = typeof action.loading === 'function' ? action.loading(params) : action.loading
                  }

                  // 实现props, style等的附加
                  let btnClass = []
                  if (action.text === '') btnClass.push('ivu-btn-only-icon')
                  let btnOptions = {
                    props: { type: 'primary', size: 'small', loading },
                    style: { marginRight: '8px' },
                    class: btnClass,
                    on: {
                      click: () => action.click(params)
                    }
                  }
                  _.merge(btnOptions, _.pick(action, ['props', 'style', 'class', 'on']))

                  return h('Button', btnOptions, action.text)
                })

              return h('div', btnTemplates)
            }
          }

          // 替换或新增actions列
          let columnOriginIdx = columns.findIndex(column => column.key === 'actions')
          if (columnOriginIdx >= 0) {
            columns[columnOriginIdx] = Object.assign({}, columnActions, columns[columnOriginIdx])
          } else {
            columns.push(columnActions)
          }
        }

        return columns
      },
      tableData () {
        let data = this.data.slice(0)

        // 实现sort
        if (this.sortData) {
          let { key, order } = this.sortData
          data.sort((a, b) => {
            if (order === 'asc') {
              return a[key] > b[key] ? 1 : -1
            } else if (order === 'desc') {
              return a[key] < b[key] ? 1 : -1
            }
          })
        }

        if (!this.pageable) return data

        // 实现分页
        let start = (this.page - 1) * this.pageSize
        return data.slice(start, start + this.pageSize)
      },
      processedTableProps () {
        let processed = {
          columns: this.tableColumns,
          data: this.tableData
        }
        if (this.responsive) processed.height = this.tableHeight

        return Object.assign({}, this.$props, processed)
      }
    },
    watch: {
      data () {
        let maxPage = Math.ceil(this.data.length / this.pageSize)
        if (maxPage < 1) maxPage = 1
        if (this.page > maxPage) this.page = maxPage
      }
    },
    mounted () {
      window.addEventListener('resize', this.onWindowResize)
      this.$refs.table.$on('on-sort-change', this.onSortChange)
      if (this.responsive) this.handleResponsive()

      // 滚动条样式改了, 所以这里也要改
      this.$refs.table.scrollBarWidth = 8
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.onWindowResize)
      this.$refs.table.$off('on-sort-change', this.onSortChange)
    },
    methods: {

      // Event listeners
      // =============================================================================

      onWindowResize () {
        if (this.responsive) this.handleResponsive()
      },
      onSortChange (data) {
        if (data.order === 'normal') data = null
        this.sortData = data
      },

      // Actions
      // =============================================================================

      handleResponsive () {
        const headHeight = 40
        const rowHeight = 48
        const pagerHeight = 48
        let height = this.$el.clientHeight
        if (this.pageable) height -= pagerHeight
        this.pageSize = Math.floor((height - headHeight) / rowHeight)
        this.tableHeight = headHeight + this.pageSize * rowHeight
        this.pagerExtMargin = (this.$el.clientHeight - this.tableHeight - pagerHeight) / 2
      },
      changePage (page) {
        this.page = page
      }
    }
  }
</script>

<style lang="scss" scoped>
  @import "~@/styles/global";

  .better-table {
    &-page {
      margin-top: 16px;
      text-align: right;
    }

    /deep/ .ivu-table-body {
      @extend .scrollbar;
    }
  }
</style>
