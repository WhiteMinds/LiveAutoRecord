import { Platform } from 'const'

export default {
  up (query, DataTypes) {
    return query.changeColumn('Channels', 'platform', {
      type: DataTypes.INTEGER,
      defaultValue: Platform.DouYu
    })
  },
  down (query, DataTypes) {
    return query.changeColumn('Channels', 'platform', DataTypes.INTEGER)
  }
}
