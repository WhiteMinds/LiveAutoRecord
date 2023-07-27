import axios from 'axios'
import type { API } from '@autorecord/http-server'
import { omit } from '../../utils'
import { getServerMessages } from './server_messages'

// TODO: 暂时用固定值
const baseURL = 'http://localhost:8085/api'

const requester = axios.create({
  baseURL,
})

// 这里是 web 与外部系统（http-server）对接的地方，整体上对应的是 server 的路由部分（而不是 API 的实现部分）。
// 两个系统的这个部分只决定调用哪个 API、参数如何传输（比如一部分参数走 query，一部分走 body）。

async function getRecorders(args: API.getRecorders.Args): Promise<API.getRecorders.Resp> {
  const resp = await requester.get<{ payload: API.getRecorders.Resp }>('/recorders', {
    params: args,
  })
  return resp.data.payload
}

async function getRecorder(args: API.getRecorder.Args): Promise<API.getRecorder.Resp> {
  const resp = await requester.get<{ payload: API.getRecorder.Resp }>(`/recorders/${args.id}`)
  return resp.data.payload
}

async function addRecorder(args: API.addRecorder.Args): Promise<API.addRecorder.Resp> {
  const resp = await requester.post<{ payload: API.addRecorder.Resp }>(`/recorders`, args)
  return resp.data.payload
}

async function updateRecorder(args: API.updateRecorder.Args): Promise<API.updateRecorder.Resp> {
  const resp = await requester.patch<{ payload: API.updateRecorder.Resp }>(`/recorders/${args.id}`, omit(args, 'id'))
  return resp.data.payload
}

async function removeRecorder(args: API.removeRecorder.Args): Promise<API.removeRecorder.Resp> {
  const resp = await requester.delete<{ payload: API.removeRecorder.Resp }>(`/recorders/${args.id}`)
  return resp.data.payload
}

async function startRecord(args: API.startRecord.Args): Promise<API.startRecord.Resp> {
  const resp = await requester.post<{ payload: API.startRecord.Resp }>(`/recorders/${args.id}/start_record`)
  return resp.data.payload
}

async function stopRecord(args: API.stopRecord.Args): Promise<API.stopRecord.Resp> {
  const resp = await requester.post<{ payload: API.stopRecord.Resp }>(`/recorders/${args.id}/stop_record`)
  return resp.data.payload
}

async function getManager(args: API.getManager.Args): Promise<API.getManager.Resp> {
  const resp = await requester.get<{ payload: API.getManager.Resp }>('/manager')
  return resp.data.payload
}

async function updateManager(args: API.updateManager.Args): Promise<API.updateManager.Resp> {
  const resp = await requester.patch<{ payload: API.updateManager.Resp }>('/manager', args)
  return resp.data.payload
}

async function resolveChannel(args: API.resolveChannel.Args): Promise<API.resolveChannel.Resp> {
  const resp = await requester.get<{ payload: API.resolveChannel.Resp }>('/manager/resolve_channel', {
    params: args,
  })
  return resp.data.payload
}

async function getRecords(args: API.getRecords.Args): Promise<API.getRecords.Resp> {
  const resp = await requester.get<{ payload: API.getRecords.Resp }>('/records', {
    params: args,
  })
  return resp.data.payload
}

async function getRecordExtraData(args: API.getRecordExtraData.Args): Promise<API.getRecordExtraData.Resp> {
  const resp = await requester.get<{ payload: API.getRecordExtraData.Resp }>(`/records/${args.id}/extra_data`)
  return resp.data.payload
}

async function createRecordSRT(args: API.createRecordSRT.Args): Promise<API.createRecordSRT.Resp> {
  const resp = await requester.post<{ payload: API.createRecordSRT.Resp }>(`/records/${args.id}/srt`)
  return resp.data.payload
}

async function getRecordVideoURL(args: { id: string }): Promise<string> {
  return `${baseURL}/records/${args.id}/video`
}

async function getSettings(args: API.getSettings.Args): Promise<API.getSettings.Resp> {
  const resp = await requester.get<{ payload: API.getSettings.Resp }>('/settings')
  return resp.data.payload
}

async function setSettings(args: API.setSettings.Args): Promise<API.setSettings.Resp> {
  const resp = await requester.put<{ payload: API.setSettings.Resp }>('/settings', args)
  return resp.data.payload
}

export const LARServerService = {
  getRecorders,
  getRecorder,
  addRecorder,
  updateRecorder,
  removeRecorder,
  startRecord,
  stopRecord,
  getManager,
  updateManager,
  resolveChannel,
  getRecords,
  getRecordExtraData,
  createRecordSRT,
  getRecordVideoURL,
  getSettings,
  setSettings,

  getServerMessages,
}
