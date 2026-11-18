import { http } from './request'

/* 登录 / 会话（uni-id 等价接口） */
export const authApi = {
  login: (data) => http.post('/api/auth/login', data, { auth: false }),
  face: (data = {}) => http.post('/api/auth/face', data, { auth: false }),
  register: (data) => http.post('/api/auth/register', data, { auth: false }),
  me: () => http.get('/api/auth/me'),
  logout: () => http.post('/api/auth/logout', {})
}

/* 首页 · 今日总览 */
export const homeApi = {
  overview: () => http.get('/api/home'),
  widget: () => http.get('/api/home/widget')
}

/* 任务 */
export const taskApi = {
  meta: () => http.get('/api/tasks/meta'),
  list: (params) => http.get('/api/tasks', params),
  detail: (id) => http.get(`/api/tasks/${id}`),
  create: (data) => http.post('/api/tasks', data, { withMessage: true }),
  claim: (id) => http.post(`/api/tasks/${id}/claim`, {}),
  start: (id) => http.post(`/api/tasks/${id}/start`, {}),
  complete: (id, data) => http.post(`/api/tasks/${id}/complete`, data, { withMessage: true }),
  confirm: (id, data = {}) => http.post(`/api/tasks/${id}/confirm`, data, { withMessage: true }),
  remind: (id) => http.post(`/api/tasks/${id}/remind`, {}),
  reassign: (id, data) => http.post(`/api/tasks/${id}/reassign`, data),
  cancel: (id, data) => http.post(`/api/tasks/${id}/cancel`, data),
  skip: (id, data = {}) => http.post(`/api/tasks/${id}/skip`, data),
  question: (id, data) => http.post(`/api/tasks/${id}/question`, data)
}

/* 排班 */
export const scheduleApi = {
  get: (weekStart) => http.get('/api/schedule', { weekStart }),
  toggle: (data) => http.post('/api/schedule/slot', data),
  auto: () => http.post('/api/schedule/auto', {}),
  generate: (weekStart) => http.post('/api/schedule/generate-tasks', { weekStart })
}

/* 照护流水 */
export const timelineApi = {
  list: (params) => http.get('/api/timeline', params)
}

/* 长辈档案 */
export const elderApi = {
  detail: (id) => http.get(`/api/elders/${id}`),
  update: (id, data) => http.patch(`/api/elders/${id}`, data),
  accessLogs: (id) => http.get(`/api/elders/${id}/access-logs`),
  recordAccess: (id, data) => http.post(`/api/elders/${id}/access-log`, data)
}

/* 用药与复诊 */
export const medApi = {
  list: (elderId) => http.get(`/api/elders/${elderId}/meds`),
  create: (elderId, data) => http.post(`/api/elders/${elderId}/meds`, data),
  take: (id) => http.post(`/api/meds/${id}/take`, {}, { withMessage: true }),
  refill: (id) => http.post(`/api/meds/${id}/refill-task`, {}, { withMessage: true }),
  stop: (id) => http.post(`/api/meds/${id}/stop`, {}, { withMessage: true }),
  createFollowUp: (elderId, data) => http.post(`/api/elders/${elderId}/follow-ups`, data, { withMessage: true }),
  updateFollowUp: (id, data) => http.patch(`/api/follow-ups/${id}`, data, { withMessage: true }),
  generateFollowUpTask: (id) => http.post(`/api/follow-ups/${id}/generate-task`, {}, { withMessage: true })
}

/* 报告解读 */
export const reportApi = {
  list: (elderId) => http.get('/api/reports', { elderId }),
  detail: (id) => http.get(`/api/reports/${id}`),
  analyze: (data) => http.post('/api/reports/analyze', data),
  askList: (id) => http.post(`/api/reports/${id}/ask-list`, {}, { withMessage: true }),
  archive: (id) => http.post(`/api/reports/${id}/archive`, {}, { withMessage: true })
}

/* 设置 / 通知 / 小组件 */
export const settingApi = {
  get: () => http.get('/api/settings'),
  notifications: (data) => http.patch('/api/settings/notifications', data),
  widget: (data) => http.patch('/api/settings/widget', data),
  preferences: (data) => http.patch('/api/settings/preferences', data),
  logs: () => http.get('/api/settings/notification-logs'),
  test: () => http.post('/api/settings/test-notification', {})
}

/* 会员（uni-pay） */
export const vipApi = {
  get: () => http.get('/api/membership'),
  order: (data) => http.post('/api/membership/orders', data),
  pay: (outTradeNo) => http.post(`/api/membership/orders/${outTradeNo}/pay`, {}),
  refund: () => http.post('/api/membership/refund', {})
}

/* 导出 PDF */
export const exportApi = {
  preview: (params) => http.get('/api/export/preview', params),
  create: (data) => http.post('/api/export', data),
  records: () => http.get('/api/export/records')
}
