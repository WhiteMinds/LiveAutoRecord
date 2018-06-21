import storage from 'electron-json-storage'
import * as CONST from '../const'

let cache = {}

async function storageHas (key) {
  return new Promise((resolve, reject) => {
    storage.has(key, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
}

async function storageGet (key, def) {
  if (cache.hasOwnProperty(key)) return cache[key]
  if (!await storageHas(key)) {
    if (def === undefined) return {}
    cache[key] = def
    return def
  }

  return new Promise((resolve, reject) => {
    storage.get(key, (err, res) => {
      if (err) return reject(err)
      cache[key] = res
      resolve(res)
    })
  })
}

async function storageSet (key, val) {
  return new Promise((resolve, reject) => {
    storage.set(key, val, (err, res) => {
      if (err) return reject(err)
      cache[key] = val
      resolve(res)
    })
  })
}

export default {
  getDataPath: storage.getDataPath,
  async getLARConfig () {
    return storageGet(CONST.LARConfigFileName)
  },
  async setLARConfig (val) {
    return storageSet(CONST.LARConfigFileName, val)
  }
}
