import { ClientAPI } from '@autorecord/shared'

function getClientAPI(): ClientAPI | null {
  const { clientAPI } = globalThis as { clientAPI?: ClientAPI }
  return clientAPI == null ? null : clientAPI
}

function isClientMode(): boolean {
  return getClientAPI() != null
}

export const ClientService = {
  isClientMode,
  getClientAPI,
}
