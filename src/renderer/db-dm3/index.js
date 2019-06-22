import { Sequelize } from 'sequelize'
import log from '@/modules/log'
import * as migrate from './migrate'

export default async function loadOrCreate (file) {
  const db = {}

  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: file,
    logging: (body, options) => log.debug(body)
  })

  // 导入数据模型
  // =============================================================================
  db.Data = require('./models/data').default(sequelize, Sequelize.DataTypes)

  // 执行迁移
  await migrate.run(sequelize)

  // 导出接口
  // =============================================================================
  db.sequelize = sequelize

  return db
}
