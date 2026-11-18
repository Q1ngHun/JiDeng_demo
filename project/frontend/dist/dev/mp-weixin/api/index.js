"use strict";
const api_request = require("./request.js");
const authApi = {
  login: (data) => api_request.http.post("/api/auth/login", data, { auth: false }),
  face: (data = {}) => api_request.http.post("/api/auth/face", data, { auth: false }),
  register: (data) => api_request.http.post("/api/auth/register", data, { auth: false }),
  me: () => api_request.http.get("/api/auth/me"),
  logout: () => api_request.http.post("/api/auth/logout", {})
};
const homeApi = {
  overview: () => api_request.http.get("/api/home"),
  widget: () => api_request.http.get("/api/home/widget")
};
const taskApi = {
  meta: () => api_request.http.get("/api/tasks/meta"),
  list: (params) => api_request.http.get("/api/tasks", params),
  detail: (id) => api_request.http.get(`/api/tasks/${id}`),
  create: (data) => api_request.http.post("/api/tasks", data, { withMessage: true }),
  claim: (id) => api_request.http.post(`/api/tasks/${id}/claim`, {}),
  start: (id) => api_request.http.post(`/api/tasks/${id}/start`, {}),
  complete: (id, data) => api_request.http.post(`/api/tasks/${id}/complete`, data, { withMessage: true }),
  confirm: (id, data = {}) => api_request.http.post(`/api/tasks/${id}/confirm`, data, { withMessage: true }),
  remind: (id) => api_request.http.post(`/api/tasks/${id}/remind`, {}),
  reassign: (id, data) => api_request.http.post(`/api/tasks/${id}/reassign`, data),
  cancel: (id, data) => api_request.http.post(`/api/tasks/${id}/cancel`, data),
  skip: (id, data = {}) => api_request.http.post(`/api/tasks/${id}/skip`, data),
  question: (id, data) => api_request.http.post(`/api/tasks/${id}/question`, data)
};
const scheduleApi = {
  get: (weekStart) => api_request.http.get("/api/schedule", { weekStart }),
  toggle: (data) => api_request.http.post("/api/schedule/slot", data),
  auto: () => api_request.http.post("/api/schedule/auto", {}),
  generate: (weekStart) => api_request.http.post("/api/schedule/generate-tasks", { weekStart })
};
const timelineApi = {
  list: (params) => api_request.http.get("/api/timeline", params)
};
const elderApi = {
  detail: (id) => api_request.http.get(`/api/elders/${id}`),
  update: (id, data) => api_request.http.patch(`/api/elders/${id}`, data),
  accessLogs: (id) => api_request.http.get(`/api/elders/${id}/access-logs`),
  recordAccess: (id, data) => api_request.http.post(`/api/elders/${id}/access-log`, data)
};
const medApi = {
  list: (elderId) => api_request.http.get(`/api/elders/${elderId}/meds`),
  create: (elderId, data) => api_request.http.post(`/api/elders/${elderId}/meds`, data),
  take: (id) => api_request.http.post(`/api/meds/${id}/take`, {}, { withMessage: true }),
  refill: (id) => api_request.http.post(`/api/meds/${id}/refill-task`, {}, { withMessage: true }),
  stop: (id) => api_request.http.post(`/api/meds/${id}/stop`, {}, { withMessage: true }),
  createFollowUp: (elderId, data) => api_request.http.post(`/api/elders/${elderId}/follow-ups`, data, { withMessage: true }),
  updateFollowUp: (id, data) => api_request.http.patch(`/api/follow-ups/${id}`, data, { withMessage: true }),
  generateFollowUpTask: (id) => api_request.http.post(`/api/follow-ups/${id}/generate-task`, {}, { withMessage: true })
};
const reportApi = {
  list: (elderId) => api_request.http.get("/api/reports", { elderId }),
  detail: (id) => api_request.http.get(`/api/reports/${id}`),
  analyze: (data) => api_request.http.post("/api/reports/analyze", data),
  askList: (id) => api_request.http.post(`/api/reports/${id}/ask-list`, {}, { withMessage: true }),
  archive: (id) => api_request.http.post(`/api/reports/${id}/archive`, {}, { withMessage: true })
};
const settingApi = {
  get: () => api_request.http.get("/api/settings"),
  notifications: (data) => api_request.http.patch("/api/settings/notifications", data),
  widget: (data) => api_request.http.patch("/api/settings/widget", data),
  preferences: (data) => api_request.http.patch("/api/settings/preferences", data),
  logs: () => api_request.http.get("/api/settings/notification-logs"),
  test: () => api_request.http.post("/api/settings/test-notification", {})
};
const vipApi = {
  get: () => api_request.http.get("/api/membership"),
  order: (data) => api_request.http.post("/api/membership/orders", data),
  pay: (outTradeNo) => api_request.http.post(`/api/membership/orders/${outTradeNo}/pay`, {}),
  refund: () => api_request.http.post("/api/membership/refund", {})
};
const exportApi = {
  preview: (params) => api_request.http.get("/api/export/preview", params),
  create: (data) => api_request.http.post("/api/export", data),
  records: () => api_request.http.get("/api/export/records")
};
exports.authApi = authApi;
exports.elderApi = elderApi;
exports.exportApi = exportApi;
exports.homeApi = homeApi;
exports.medApi = medApi;
exports.reportApi = reportApi;
exports.scheduleApi = scheduleApi;
exports.settingApi = settingApi;
exports.taskApi = taskApi;
exports.timelineApi = timelineApi;
exports.vipApi = vipApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/index.js.map
