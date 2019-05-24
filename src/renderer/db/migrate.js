import path from 'path'
import Umzug from 'umzug'
import Migration from 'umzug/lib/migration'
import log from '@/modules/log'
import { UserDataPath } from 'const'

export function run (sequelize) {

  // 通过hack类Migration来支持编译后的自动迁移 (不然动态require会导致错误, 这里主要目的就是改为静态require)

  const DefaultOptions = {
    upName: 'up',
    downName: 'down',
    migrations: {
      params: [sequelize.getQueryInterface(), sequelize.constructor],
      traverseDirectories: false,
      wrap: fun => function (args) {
        return fun.apply(this, args || DefaultOptions.migrations.params)
      }
    },
    logging: (...args) => log.debug(...args)
  }

  class MigrationHack extends Migration {
    constructor (uniqueName, module, options = {}) {
      super(uniqueName + '.js', Object.assign({}, DefaultOptions, options))
      this.module = module
    }

    migration () {
      if (typeof this.options.migrations.customResolver === 'function') {
        return this.options.migrations.customResolver(this.path)
      }

      return this.module.default
    }
  }

  const umzug = new Umzug({
    storage: 'json',
    storageOptions: {
      path: path.join(UserDataPath, 'lar_umzug.json')
    },
    migrations: [
      new MigrationHack('00_Initial', require('./migrations/00_Initial')),
      new MigrationHack('01_ChangeColumn_Platform', require('./migrations/01_ChangeColumn_Platform')),
      new MigrationHack('02_ChangeColumns', require('./migrations/02_ChangeColumns'))
    ]
  })

  const logUmzugEvent = eventName => {
    return (name, migration) => {
      log.info(`${name} ${eventName}`)
    }
  }
  umzug.on('migrating', logUmzugEvent('migrating'))
  umzug.on('migrated', logUmzugEvent('migrated'))
  umzug.on('reverting', logUmzugEvent('reverting'))
  umzug.on('reverted', logUmzugEvent('reverted'))

  return umzug.up()
}
