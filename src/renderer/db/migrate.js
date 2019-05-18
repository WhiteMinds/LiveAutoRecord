import path from 'path'
import Umzug from 'umzug'
import log from '@/modules/log'
import { UserDataPath } from 'const'

export function run (sequelize) {
  const umzug = new Umzug({
    storage: 'json',
    storageOptions: {
      path: path.join(UserDataPath, 'lar_umzug.json')
    },
    migrations: {
      params: [
        sequelize.getQueryInterface(), // queryInterface
        sequelize.constructor, // DataTypes
        function () {
          throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.')
        }
      ],
      path: path.join(path.dirname(__filename), 'migrations'),
      pattern: /\.js$/,
      customResolver: migrationFile => require(`./migrations/${path.basename(migrationFile, '.js')}`).default
    },
    logging: (...args) => log.debug(...args)
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
