import axios from 'axios'
import type { API } from '@autorecord/http-server'

const requester = axios.create({
  // TODO: 暂时用固定值
  baseURL: 'http://localhost:8085/api',
})

// 这里是 web 与外部系统（http-server）对接的地方，整体上对应的是 server 的路由部分（而不是 API 的实现部分）。
// 两个系统的这个部分只决定调用哪个 API、参数如何传输（比如一部分参数走 query，一部分走 body）。

async function getRecorders(
  args: API.getRecorders.Args
): Promise<API.getRecorders.Resp> {
  const resp = await requester.get<{ payload: API.getRecorders.Resp }>(
    '/recorders',
    {
      params: args,
    }
  )
  return resp.data.payload
}

export const LARServerService = {
  getRecorders,
}
