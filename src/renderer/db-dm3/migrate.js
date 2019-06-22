import Umzug from 'umzug'
import Migration from 'umzug/lib/migration'
import log from '@/modules/log'

export function run (sequelize) {
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
    storage: 'sequelize',
    storageOptions: { sequelize },
    migrations: [
      new MigrationHack('00_Initial', require('./migrations/00_Initial'))
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
