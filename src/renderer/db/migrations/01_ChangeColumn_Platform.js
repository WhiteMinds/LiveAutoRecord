import { Platform } from 'const'

export default {
  up (query, DataTypes) {
    return query.changeColumn('channels', 'platform', {
      type: DataTypes.INTEGER,
      defaultValue: Platform.DouYu
    })
  },
  down (query, DataTypes) {
    return query.changeColumn('channels', 'platform', DataTypes.INTEGER)
  }
}
