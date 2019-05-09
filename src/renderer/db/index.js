import path from 'path'
import { Sequelize } from 'sequelize'
import log from '@/modules/log'
import * as migrate from './migrate'
import { UserDataPath } from 'const'

const db = {}

db.init = async () => {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(UserDataPath, 'lar.data'),
    logging: (body, options) => log.debug(body)
  })

  // 导入数据模型
  // =============================================================================
  db.Channel = require('./models/channel').default(sequelize, Sequelize.DataTypes)

  // 执行迁移
  await migrate.run(sequelize)

  // 导出接口
  // =============================================================================
  db.sequelize = sequelize
}

export default db
