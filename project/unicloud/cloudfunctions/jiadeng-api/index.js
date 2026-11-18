'use strict'

/**
 * 家灯 JiaDeng · 统一云函数入口
 *
 * 作用：把前端请求转发给 Python 后端（或任意自建网关），统一包装 {code, msg, data}。
 * 这样前端可以继续用 uniCloud.callFunction，也可以 URL 化后直接 fetch。
 *
 * 环境变量：
 *   JIADENG_API_BASE   例如 https://api.example.com（必填）
 *   JIADENG_API_TOKEN  服务间调用令牌（可选）
 */
const http = require('http')
const https = require('https')

const BASE = process.env.JIADENG_API_BASE || 'http://127.0.0.1:8000'
const SERVICE_TOKEN = process.env.JIADENG_API_TOKEN || ''

function requestJson({ method = 'GET', path = '/', data, headers = {} }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE)
    const payload = data ? Buffer.from(JSON.stringify(data)) : null
    const client = url.protocol === 'https:' ? https : http
    const req = client.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': payload.length } : {}),
          ...(SERVICE_TOKEN ? { 'X-Service-Token': SERVICE_TOKEN } : {}),
          ...headers
        }
      },
      (res) => {
        let raw = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (raw += chunk))
        res.on('end', () => {
          try {
            const body = JSON.parse(raw || '{}')
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(body)
            else reject(Object.assign(new Error(body.msg || '请求失败'), { statusCode: res.statusCode, body }))
          } catch (e) {
            reject(new Error('返回内容不是 JSON'))
          }
        })
      }
    )
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

exports.main = async (event, context) => {
  const { action = 'call', path, method = 'GET', data, token } = event || {}

  try {
    if (action === 'health') {
      // 与其余 action 保持一致：后端返回什么信封就原样透传，避免出现 code/msg/data 再套一层
      const health = await requestJson({ path: '/api/health' })
      return health && typeof health.code === 'number'
        ? health
        : { code: 0, msg: 'ok', data: health }
    }

    if (!path || !path.startsWith('/api/')) {
      return { code: 400, msg: 'path 必须以 /api/ 开头', data: null }
    }

    const result = await requestJson({
      method,
      path,
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    return result
  } catch (err) {
    return {
      code: err.statusCode || 500,
      msg: err.message || '云函数转发失败',
      data: null
    }
  }
}
