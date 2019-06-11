import _ from 'lodash'
import Vue from 'vue'
import Router from 'vue-router'
import { Route, Layout } from 'const'

Vue.use(Router)

const routes = []

// 路由util函数
// =============================================================================

function createRoute (name, component, options = {}) {
  if (component && component.hasOwnProperty('default')) component = component.default

  if (options.layout) {
    _.merge(options, {
      meta: {
        layout: options.layout
      }
    })
    delete options.layout
  }

  return _.merge({
    name,
    path: '/' + name,
    component,
    meta: {
      layout: Layout.Sider
    }
  }, options)
}

function createAndAddRoute (...args) {
  let route = createRoute(...args)
  routes.push(route)
  return route
}

// 添加路由
// =============================================================================

createAndAddRoute(Route.Record, require('@/pages/record'))
createAndAddRoute(Route.RecordEdit, require('@/pages/record/edit'), { path: `/${Route.RecordEdit}/:id` })
createAndAddRoute(Route.RecordAdd, require('@/pages/record/edit'))
createAndAddRoute(Route.RecordSetting, require('@/pages/record/setting'))
createAndAddRoute(Route.RecordHistory, require('@/pages/record/history'), { path: `/${Route.RecordHistory}/:platform/:address` })
createAndAddRoute(Route.VideoDownload, require('@/pages/video-download'))
createAndAddRoute(Route.VideoProcess, require('@/pages/video-process'))
createAndAddRoute(Route.Setting, require('@/pages/setting'))
createAndAddRoute(Route.About, require('@/pages/about'))
createAndAddRoute(Route.Player, require('@/pages/player'), { layout: Layout.Plain })
routes.push({
  path: '*',
  redirect: { name: Route.Record }
})

export default new Router({ routes })
