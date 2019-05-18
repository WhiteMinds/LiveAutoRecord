export default {
  up (query, DataTypes) {
    return query.sequelize.transaction(async t => {
      const addDefaultValue = (name, type, defaultValue) => query.changeColumn('Channels', name, { type, defaultValue }, { transaction: t })

      await addDefaultValue('address', DataTypes.STRING, '')
      await addDefaultValue('alias', DataTypes.STRING, '')
      await addDefaultValue('quality', DataTypes.STRING, '')
      await addDefaultValue('circuit', DataTypes.STRING, '')
      await addDefaultValue('barrage', DataTypes.BOOLEAN, true)
      await addDefaultValue('auto_process', DataTypes.BOOLEAN, true)
    })
  },
  down (query, DataTypes) {
    return query.sequelize.transaction(async t => {
      const delDefaultValue = (name, type) => query.changeColumn('Channels', name, type, { transaction: t })

      await delDefaultValue('address', DataTypes.STRING)
      await delDefaultValue('alias', DataTypes.STRING)
      await delDefaultValue('quality', DataTypes.STRING)
      await delDefaultValue('circuit', DataTypes.STRING)
      await delDefaultValue('barrage', DataTypes.BOOLEAN)
      await delDefaultValue('auto_process', DataTypes.BOOLEAN)
    })
  }
}
