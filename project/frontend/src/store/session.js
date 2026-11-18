import { reactive } from 'vue'

const TOKEN_KEY = 'jd_token'
const SESSION_KEY = 'jd_session'

function readSession() {
  try {
    const raw = uni.getStorageSync(SESSION_KEY)
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
  } catch (e) {
    return null
  }
}

const cached = readSession() || {}

export const state = reactive({
  token: uni.getStorageSync(TOKEN_KEY) || '',
  user: cached.user || null,
  family: cached.family || null,
  member: cached.member || null,
  members: cached.members || [],
  elder: cached.elder || null,
  preferences: cached.preferences || { careMode: 'standard', fontScale: 1, biometric: true },
  greeting: '',
  dateLabel: '',
  ready: false
})

export function useSession() {
  return state
}

export function setSession(payload) {
  if (!payload) return
  if (payload.token) {
    state.token = payload.token
    uni.setStorageSync(TOKEN_KEY, payload.token)
  }
  if (payload.user) state.user = payload.user
  if (payload.family) state.family = payload.family
  if (payload.member) state.member = payload.member
  if (payload.members) state.members = payload.members
  if (payload.elder) state.elder = payload.elder
  if (payload.preferences) state.preferences = payload.preferences
  if (payload.greeting) state.greeting = payload.greeting
  if (payload.dateLabel) state.dateLabel = payload.dateLabel
  state.ready = true
  persist()
}

export function patchSession(patch) {
  Object.assign(state, patch)
  persist()
}

function persist() {
  try {
    uni.setStorageSync(
      SESSION_KEY,
      JSON.stringify({
        user: state.user,
        family: state.family,
        member: state.member,
        members: state.members,
        elder: state.elder,
        preferences: state.preferences
      })
    )
  } catch (e) {
    /* 忽略存储失败 */
  }
}

export function clearSession() {
  state.token = ''
  state.user = null
  state.family = null
  state.member = null
  state.members = []
  state.elder = null
  state.ready = false
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(SESSION_KEY)
}

export function isOwner() {
  return state.member && state.member.role === 'owner'
}

export function isElder() {
  return state.member && state.member.role === 'elder'
}

export function go(url, options = {}) {
  if (options.reLaunch) {
    uni.reLaunch({ url })
  } else if (options.redirect) {
    uni.redirectTo({ url })
  } else {
    uni.navigateTo({ url })
  }
}

export function back(fallback = '/pages/home/home') {
  const pages = getCurrentPages()
  if (pages && pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: fallback })
  }
}

export function requireLogin() {
  if (!state.token) {
    uni.reLaunch({ url: '/pages/launch/launch' })
    return false
  }
  return true
}

export const TABS = [
  { key: 'home', label: '首页', icon: 'home', path: '/pages/home/home' },
  { key: 'board', label: '看板', icon: 'cal', path: '/pages/board/board' },
  { key: 'timeline', label: '流水', icon: 'clock', path: '/pages/timeline/timeline' },
  { key: 'profile', label: '档案', icon: 'doc', path: '/pages/profile/profile' },
  { key: 'me', label: '我的', icon: 'me', path: '/pages/settings/settings' }
]
