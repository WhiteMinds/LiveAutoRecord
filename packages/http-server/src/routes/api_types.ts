import {
  Recorder,
  RecorderCreateOpts,
  RecorderManagerCreateOpts,
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

  export namespace getRecorder {
    export interface Args {
      id: Recorder['id']
    }

    export type Resp = ClientRecorder
  }

  export namespace addRecorder {
    export type Args = Omit<RecorderCreateOpts, 'id'>

    export type Resp = ClientRecorder
  }

  export namespace updateRecorder {
    export type Args = Pick<
      RecorderCreateOpts,
      | 'id'
      | 'remarks'
      | 'autoCheckLiveStatusAndRecord'
      | 'quality'
      | 'streamPriorities'
      | 'sourcePriorities'
    >

    export type Resp = ClientRecorder
  }

  export namespace removeRecorder {
    export interface Args {
      id: Recorder['id']
    }

    export type Resp = null
  }

  export namespace stopRecord {
    export interface Args {
      id: Recorder['id']
    }

    export type Resp = ClientRecorder
  }

  export namespace getManager {
    export interface Args {}

    export type Resp = RecorderManagerCreateOpts
  }

  export namespace updateManager {
    export type Args = RecorderManagerCreateOpts

    export type Resp = RecorderManagerCreateOpts
  }
}
