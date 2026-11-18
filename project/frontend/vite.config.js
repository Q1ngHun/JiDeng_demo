import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'

// H5 开发时把 /api、/static、/uploads 代理到 Python 后端；
// 生产构建后由 Python 直接托管 dist/build/h5，同源无跨域。
// 后端端口可通过 JIADENG_PORT 或 JIADENG_API_TARGET 覆盖。
const apiPort = Number(process.env.JIADENG_PORT || 8000)
const apiTarget = process.env.JIADENG_API_TARGET || `http://127.0.0.1:${apiPort}`
const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'backend')

function log(message) {
  console.log(`\x1b[33m[家灯]\x1b[0m ${message}`)
}

function getJson(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let raw = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        raw += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw))
        } catch {
          resolve(null)
        }
      })
    })
    req.setTimeout(timeoutMs, () => {
      req.destroy()
      resolve(null)
    })
    req.on('error', () => resolve(null))
  })
}

async function backendReady(port) {
  const body = await getJson(`http://127.0.0.1:${port}/api/health`)
  return Boolean(body && body.code === 0 && String(body.data && body.data.app).includes('JiaDeng'))
}

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    const done = (value) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(value)
    }
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
    socket.setTimeout(1200, () => done(false))
  })
}

function resolvePython() {
  const candidates = [
    { cmd: process.env.JIADENG_PYTHON, prefix: [] },
    { cmd: process.env.PYTHON, prefix: [] },
    { cmd: 'python', prefix: [] },
    { cmd: 'python3', prefix: [] },
    { cmd: 'py', prefix: ['-3'] }
  ].filter((item) => item.cmd)

  for (const item of candidates) {
    try {
      // 不只检查版本，也检查后端依赖，避免选中一个没装 fastapi 的 Python。
      const out = execFileSync(
        item.cmd,
        [...item.prefix, '-c', 'import sys, fastapi, uvicorn; print(sys.version_info[0])'],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 5000,
          windowsHide: true
        }
      )
      if (String(out).trim() === '3') return item
    } catch {
      /* 尝试下一个候选 */
    }
  }
  return null
}

function spawnBackend(python) {
  return spawn(
    python.cmd,
    [...python.prefix, 'main.py', '--no-browser', '--port', String(apiPort)],
    {
      cwd: backendDir,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    }
  )
}

function waitReady(port, timeoutMs, isDead) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs
    const tick = async () => {
      if (await backendReady(port)) return resolve(true)
      if (isDead && isDead()) return resolve(false)
      if (Date.now() > deadline) return resolve(false)
      setTimeout(tick, 400)
    }
    tick()
  })
}

function jiaDengBackendPlugin() {
  let child = null

  function stopChild() {
    if (child && child.exitCode === null) {
      log('正在停止由预览自动启动的后端…')
      child.kill()
    }
    child = null
  }

  return {
    name: 'jiadeng-backend',
    apply: 'serve',
    async configureServer(server) {
      if (process.env.JIADENG_SKIP_BACKEND === '1') {
        log('已跳过自动启动后端（JIADENG_SKIP_BACKEND=1）')
      } else if (process.env.JIADENG_API_TARGET) {
        log(`使用外部后端：${apiTarget}`)
      } else if (await backendReady(apiPort)) {
        log(`后端已运行：${apiTarget}`)
      } else if (await portInUse(apiPort)) {
        log(`端口 ${apiPort} 已被其他程序占用，无法自动启动后端。`)
        log('请关闭占用程序，或设置 JIADENG_PORT 后重新预览。')
      } else {
        const python = resolvePython()
        if (!python) {
          log('未找到 Python 3.9+，无法自动启动后端。请安装 Python 后重新预览。')
        } else {
          log(`正在启动后端：${apiTarget}`)
          child = spawnBackend(python)
          let failed = false
          child.stdout.on('data', (chunk) => process.stdout.write(chunk))
          child.stderr.on('data', (chunk) => process.stderr.write(chunk))
          child.on('error', (error) => {
            failed = true
            log(`后端启动失败：${error.message}`)
          })
          child.on('exit', (code) => {
            failed = true
            if (code !== null && code !== 0) log(`后端进程退出（code=${code}）`)
            child = null
          })
          const ready = await waitReady(apiPort, 20000, () => failed)
          if (ready) {
            log(`后端已就绪：${apiTarget}`)
          } else {
            log('后端在 20 秒内没有就绪，请查看上方后端日志。')
          }
        }
      }

      if (server.httpServer) {
        server.httpServer.once('close', stopChild)
      }
    }
  }
}

function proxyOptions() {
  return {
    target: apiTarget,
    changeOrigin: true,
    configure(proxy) {
      proxy.on('error', (error, req, res) => {
        log(`代理 ${apiTarget} 失败：${error.message}`)
        if (res && typeof res.writeHead === 'function' && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ code: 502, msg: '后端服务未启动或已退出，请查看预览终端日志' }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [uni(), jiaDengBackendPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': proxyOptions(),
      '/static': proxyOptions(),
      '/uploads': proxyOptions()
    }
  }
})
