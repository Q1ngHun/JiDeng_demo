"use strict";
const common_vendor = require("../common/vendor.js");
const store_session = require("../store/session.js");
var define_import_meta_env_default = { VITE_CJS_IGNORE_WARNING: "true", VITE_ROOT_DIR: "D:\\workZone\\APP\\frontend", VITE_USER_NODE_ENV: "development", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
const RAW_BASE = define_import_meta_env_default && define_import_meta_env_default.VITE_API_BASE || "";
const BASE_URL = String(RAW_BASE).replace(/\/+$/, "");
const pending = /* @__PURE__ */ new Map();
let redirecting = false;
function assetUrl(url) {
  if (!url)
    return "";
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:"))
    return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return BASE_URL + path;
}
function fullUrl(url) {
  if (!url)
    return BASE_URL;
  if (/^https?:\/\//i.test(url))
    return url;
  return BASE_URL + (url.startsWith("/") ? url : `/${url}`);
}
function toast(msg, silent) {
  if (silent || !msg)
    return;
  common_vendor.index.showToast({ title: msg, icon: "none", duration: 2400 });
}
function redirectToLaunch() {
  if (redirecting)
    return;
  redirecting = true;
  common_vendor.index.reLaunch({
    url: "/pages/launch/launch",
    complete: () => {
      redirecting = false;
    }
  });
}
function errorMessage(body, statusCode, fallback) {
  if (body && typeof body === "object") {
    const msg = body.msg || body.detail || body.message;
    if (typeof msg === "string" && msg)
      return msg;
  }
  if (typeof body === "string" && body && body.length < 200 && !body.startsWith("<"))
    return body;
  return fallback || `请求失败（${statusCode}）`;
}
function request(options) {
  const {
    url,
    method = "GET",
    data,
    auth = true,
    silent = false,
    timeout = 2e4,
    withMessage = false,
    dedupe = method === "GET"
  } = options;
  const session = store_session.useSession();
  const header = { "Content-Type": "application/json" };
  if (auth && session.token) {
    header.Authorization = `Bearer ${session.token}`;
  }
  const key = `${method} ${url} ${auth ? session.token || "" : "public"} ${data ? JSON.stringify(data) : ""}`;
  if (dedupe && pending.has(key))
    return pending.get(key);
  const task = new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: fullUrl(url),
      method,
      data,
      header,
      timeout,
      success: (res) => {
        const body = res.data;
        const okCode = res.statusCode >= 200 && res.statusCode < 300;
        if (res.statusCode === 401) {
          const msg = errorMessage(body, 401, "登录已失效，请重新解锁");
          if (auth) {
            store_session.clearSession();
            redirectToLaunch();
          } else {
            toast(msg, silent);
          }
          reject(new Error(msg));
          return;
        }
        if (!okCode || !body || body.code !== 0) {
          const msg = errorMessage(body, res.statusCode);
          toast(msg, silent);
          reject(new Error(msg));
          return;
        }
        resolve(withMessage ? { data: body.data, msg: body.msg || "" } : body.data);
      },
      fail: (err) => {
        const raw = err && err.errMsg ? err.errMsg : "";
        const msg = /timeout/i.test(raw) ? "请求超时，请稍后重试" : "网络不可用，请检查连接后重试";
        toast(msg, silent);
        reject(new Error(raw || msg));
      }
    });
  });
  if (dedupe) {
    pending.set(key, task);
    const cleanup = () => pending.delete(key);
    task.then(cleanup, cleanup);
  }
  return task;
}
function upload(options) {
  const {
    url = "/api/upload",
    filePath,
    name = "file",
    formData,
    auth = true,
    silent = false
  } = options;
  const session = store_session.useSession();
  const header = {};
  if (auth && session.token)
    header.Authorization = `Bearer ${session.token}`;
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url: fullUrl(url),
      filePath,
      name,
      formData,
      header,
      success: (res) => {
        let body = res.data;
        if (typeof body === "string") {
          try {
            body = JSON.parse(body);
          } catch (e) {
            body = null;
          }
        }
        if (res.statusCode === 401) {
          const msg = errorMessage(body, 401, "登录已失效，请重新解锁");
          if (auth) {
            store_session.clearSession();
            redirectToLaunch();
          }
          reject(new Error(msg));
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300 || !body || body.code !== 0) {
          const msg = errorMessage(body, res.statusCode, "上传失败，请重试");
          toast(msg, silent);
          reject(new Error(msg));
          return;
        }
        resolve(body.data);
      },
      fail: () => {
        toast("上传失败，请检查网络后重试", silent);
        reject(new Error("upload failed"));
      }
    });
  });
}
const http = {
  get: (url, params, opts = {}) => {
    let qs = "";
    if (params) {
      qs = Object.keys(params).filter((k) => params[k] !== void 0 && params[k] !== null && params[k] !== "").map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
    }
    return request({ url: qs ? `${url}?${qs}` : url, method: "GET", ...opts });
  },
  post: (url, data, opts = {}) => request({ url, method: "POST", data, ...opts }),
  patch: (url, data, opts = {}) => request({ url, method: "PATCH", data, ...opts }),
  put: (url, data, opts = {}) => request({ url, method: "PUT", data, ...opts })
};
exports.assetUrl = assetUrl;
exports.http = http;
exports.upload = upload;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/request.js.map
