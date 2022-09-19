import path from 'path'
import { Sequelize } from 'sequelize'
import { paths } from '../env'
import { defineRecorderModel } from './recorder'

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(paths.data, 'data.sqlite'),
  logging: (body, options) => console.debug(body),
})

type ExtractInstanceType<T> = T extends { new (): infer C } ? C : never
export const Recorder = defineRecorderModel(sequelize)
export type Recorder = ExtractInstanceType<typeof Recorder>

export async function initDB(): Promise<void> {
  // sequelize.sync({ force: true })
  await sequelize.sync({ alter: true })
}
