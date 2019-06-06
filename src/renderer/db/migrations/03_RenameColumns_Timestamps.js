export default {
  up (query, DataTypes) {
    return query.sequelize.transaction(async t => {
      const rename = (oldName, newName) => query.renameColumn('Channels', oldName, newName, { transaction: t })

      await rename('createdAt', 'created_at')
      await rename('updatedAt', 'updated_at')
    })
  },
  down (query, DataTypes) {
    return query.sequelize.transaction(async t => {
      const rename = (oldName, newName) => query.renameColumn('Channels', oldName, newName, { transaction: t })

      await rename('created_at', 'createdAt')
      await rename('updated_at', 'updatedAt')
    })
  }
}
