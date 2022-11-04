import { isPromiseLike } from '../../utils'

async function requestNotifyPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false

  if (Notification.permission !== 'default') {
    return Notification.permission === 'granted'
  }

  const permission = await new Promise((res, rej) => {
    // Safari 的 requestPermission 方法截止到目前（14.0）都不会返回
    // promise，还需要使用 callback
    const ret = Notification.requestPermission(res)
    if (isPromiseLike(ret)) ret.then(res, rej)
  })

  return permission === 'granted'
}

async function notify(opts: {
  title: string
  body?: string
  icon?: string
  image?: string
}) {
  if (!(await requestNotifyPermission())) return

  const { title, ...notifyOpts } = opts

  const notification = new Notification(title, notifyOpts)

  const ctl = {
    close() {
      notification.close()
    },
  }

  return ctl
}

export const NotificationService = {
  requestNotifyPermission,
  notify,
}
