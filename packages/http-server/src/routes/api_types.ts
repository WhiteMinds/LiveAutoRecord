import {
  Recorder,
  RecorderCreateOpts,
  RecorderProvider,
  RecordHandle,
} from '@autorecord/manager'

export interface PagedArgs {
  page: number
  pageSize: number
}
export interface PagedResp extends PagedArgs {
  totalPage: number
}

export type ClientRecorder = Omit<
  Recorder,
  // TODO: 可以改成排除所有方法 & EmitterProps
  | 'all'
  | 'getChannelURL'
  | 'checkLiveStatusAndRecord'
  | 'recordHandle'
  | 'toJSON'
> & {
  providerName: RecorderProvider['name']
  channelURL: string
  recordHandle?: Omit<RecordHandle, 'stop'>
}

export namespace API {
  export namespace getRecorders {
    export interface Args extends PagedArgs {}

    export interface Resp extends PagedResp {
      items: ClientRecorder[]
    }
  }

  export namespace addRecorder {
    export interface Args {
      createOpts: RecorderCreateOpts
    }

    export type Resp = ClientRecorder
  }
}
