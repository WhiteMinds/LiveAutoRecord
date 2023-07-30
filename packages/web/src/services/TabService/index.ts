/**
 * 通过 storage 来确认多个同域 tab 中的 leader，用于解决多个 tab 发出相同通知之类的问题。
 */
import { v4 as uuid } from 'uuid'

const leaderInfoInStorageKey = 'tabs_leader_info'
const leaderHeartbeatTimeout = 10e3

const id = uuid()

export interface LeaderInfo {
  id: string
  expire: number
}

export type Role = 'leader' | 'follower'

function getLeaderInfo(): LeaderInfo | null {
  const data = localStorage.getItem(leaderInfoInStorageKey)
  if (data == null) return null

  const leader = JSON.parse(data) as LeaderInfo
  if (Date.now() > leader.expire) return null

  return leader
}

function setLeaderInfo(info: LeaderInfo) {
  localStorage.setItem(leaderInfoInStorageKey, JSON.stringify(info))
}

function cleanLeaderInfo() {
  localStorage.removeItem(leaderInfoInStorageKey)
}

let updateTenureTimer: number | null = null
function startElection() {
  if (getLeaderInfo() != null) return

  const updateTenure = () =>
    setLeaderInfo({
      id,
      expire: Date.now() + leaderHeartbeatTimeout,
    })
  updateTenure()

  if (updateTenureTimer != null) return
  updateTenureTimer = window.setInterval(updateTenure, leaderHeartbeatTimeout / 10)
}

function quitElection() {
  if (updateTenureTimer != null) {
    clearInterval(updateTenureTimer)
    updateTenureTimer = null
  }

  if (getSelfRole() == 'leader') {
    cleanLeaderInfo()
  }
}

function getSelfRole(): Role {
  let leader = getLeaderInfo()
  while (leader === null) {
    startElection()
    leader = getLeaderInfo()
  }
  return leader.id === id ? 'leader' : 'follower'
}

window.addEventListener('beforeunload', quitElection)

export const TabService = { getSelfRole }
