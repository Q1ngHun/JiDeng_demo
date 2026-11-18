/**
 * 统一请求封装（前后端联调约定）
 * - {code, msg, data} 统一响应；code !== 0 一律按失败处理
 * - H5 同源部署时 BASE_URL 为空；开发时由 vite proxy 转发 /api
 * - App / 小程序等非同源环境用 VITE_API_BASE 指定后端地址
 * - 401 只在「需要登录的接口」上自动回启动页；登录接口的 401 原样提示
 * - GET 并发去重，避免页面 onMounted + onShow 重复打同一接口
 * - withMessage: true 时把服务端 msg 一起返回，页面不用再硬编码提示
 */
import { useSession, clearSession } from '@/store/session'

const RAW_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || ''
export const BASE_URL = String(RAW_BASE).replace(/\/+$/, '')

const pending = new Map()
let redirecting = false

/** 把后端返回的相对地址（/uploads/x.png、/static/x.svg）拼成可访问地址 */
export function assetUrl(url) {
  if (!url) return ''
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  const path = url.startsWith('/') ? url : `/${url}`
  // H5 同源时 BASE_URL 为空，直接使用相对路径即可；
  // App / 小程序请通过 VITE_API_BASE 配置后端域名，否则相对路径无法加载。
  return BASE_URL + path
}

function fullUrl(url) {
  if (!url) return BASE_URL
  if (/^https?:\/\//i.test(url)) return url
  return BASE_URL + (url.startsWith('/') ? url : `/${url}`)
}

function toast(msg, silent) {
  if (silent || !msg) return
  uni.showToast({ title: msg, icon: 'none', duration: 2400 })
}

function redirectToLaunch() {
  if (redirecting) return
  redirecting = true
  uni.reLaunch({
    url: '/pages/launch/launch',
    complete: () => {
      redirecting = false
    }
  })
}

function errorMessage(body, statusCode, fallback) {
  if (body && typeof body === 'object') {
    const msg = body.msg || body.detail || body.message
    if (typeof msg === 'string' && msg) return msg
  }
  if (typeof body === 'string' && body && body.length < 200 && !body.startsWith('<')) return body
  return fallback || `请求失败（${statusCode}）`
}

export function request(options) {
  const {
    url,
    method = 'GET',
    data,
    auth = true,
    silent = false,
    timeout = 20000,
    withMessage = false,
    dedupe = method === 'GET'
  } = options
  const session = useSession()
  const header = { 'Content-Type': 'application/json' }
  if (auth && session.token) {
    header.Authorization = `Bearer ${session.token}`
  }

  const key = `${method} ${url} ${auth ? session.token || '' : 'public'} ${data ? JSON.stringify(data) : ''}`
  if (dedupe && pending.has(key)) return pending.get(key)

  const task = new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl(url),
      method,
      data,
      header,
      timeout,
      success: (res) => {
        const body = res.data
        const okCode = res.statusCode >= 200 && res.statusCode < 300
        if (res.statusCode === 401) {
          const msg = errorMessage(body, 401, '登录已失效，请重新解锁')
          if (auth) {
            clearSession()
            redirectToLaunch()
          } else {
            // 登录 / 面容解锁的 401 是「账号或密码错误」，只提示，不动会话
            toast(msg, silent)
          }
          reject(new Error(msg))
          return
        }
        if (!okCode || !body || body.code !== 0) {
          const msg = errorMessage(body, res.statusCode)
          toast(msg, silent)
          reject(new Error(msg))
          return
        }
        resolve(withMessage ? { data: body.data, msg: body.msg || '' } : body.data)
      },
      fail: (err) => {
        const raw = err && err.errMsg ? err.errMsg : ''
        const msg = /timeout/i.test(raw) ? '请求超时，请稍后重试' : '网络不可用，请检查连接后重试'
        toast(msg, silent)
        reject(new Error(raw || msg))
      }
    })
  })

  if (dedupe) {
    pending.set(key, task)
    const cleanup = () => pending.delete(key)
    task.then(cleanup, cleanup)
  }
  return task
}

/** 文件上传（凭证 / 化验单），与 request 共用 BASE_URL、token 与错误提示 */
export function upload(options) {
  const {
    url = '/api/upload',
    filePath,
    name = 'file',
    formData,
    auth = true,
    silent = false
  } = options
  const session = useSession()
  const header = {}
  if (auth && session.token) header.Authorization = `Bearer ${session.token}`

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: fullUrl(url),
      filePath,
      name,
      formData,
      header,
      success: (res) => {
        let body = res.data
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body)
          } catch (e) {
            body = null
          }
        }
        if (res.statusCode === 401) {
          const msg = errorMessage(body, 401, '登录已失效，请重新解锁')
          if (auth) {
            clearSession()
            redirectToLaunch()
          }
          reject(new Error(msg))
          return
        }
        if (res.statusCode < 200 || res.statusCode >= 300 || !body || body.code !== 0) {
          const msg = errorMessage(body, res.statusCode, '上传失败，请重试')
          toast(msg, silent)
          reject(new Error(msg))
          return
        }
        resolve(body.data)
      },
      fail: () => {
        toast('上传失败，请检查网络后重试', silent)
        reject(new Error('upload failed'))
      }
    })
  })
}

export const http = {
  get: (url, params, opts = {}) => {
    let qs = ''
    if (params) {
      qs = Object.keys(params)
        .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&')
    }
    return request({ url: qs ? `${url}?${qs}` : url, method: 'GET', ...opts })
  },
  post: (url, data, opts = {}) => request({ url, method: 'POST', data, ...opts }),
  patch: (url, data, opts = {}) => request({ url, method: 'PATCH', data, ...opts }),
  put: (url, data, opts = {}) => request({ url, method: 'PUT', data, ...opts })
}
