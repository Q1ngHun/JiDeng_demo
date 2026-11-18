"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("../common/vendor.js");
const TOKEN_KEY = "jd_token";
const SESSION_KEY = "jd_session";
function readSession() {
  try {
    const raw = common_vendor.index.getStorageSync(SESSION_KEY);
    return raw ? typeof raw === "string" ? JSON.parse(raw) : raw : null;
  } catch (e) {
    return null;
  }
}
const cached = readSession() || {};
const state = common_vendor.reactive({
  token: common_vendor.index.getStorageSync(TOKEN_KEY) || "",
  user: cached.user || null,
  family: cached.family || null,
  member: cached.member || null,
  members: cached.members || [],
  elder: cached.elder || null,
  preferences: cached.preferences || { careMode: "standard", fontScale: 1, biometric: true },
  greeting: "",
  dateLabel: "",
  ready: false
});
function useSession() {
  return state;
}
function setSession(payload) {
  if (!payload)
    return;
  if (payload.token) {
    state.token = payload.token;
    common_vendor.index.setStorageSync(TOKEN_KEY, payload.token);
  }
  if (payload.user)
    state.user = payload.user;
  if (payload.family)
    state.family = payload.family;
  if (payload.member)
    state.member = payload.member;
  if (payload.members)
    state.members = payload.members;
  if (payload.elder)
    state.elder = payload.elder;
  if (payload.preferences)
    state.preferences = payload.preferences;
  if (payload.greeting)
    state.greeting = payload.greeting;
  if (payload.dateLabel)
    state.dateLabel = payload.dateLabel;
  state.ready = true;
  persist();
}
function patchSession(patch) {
  Object.assign(state, patch);
  persist();
}
function persist() {
  try {
    common_vendor.index.setStorageSync(
      SESSION_KEY,
      JSON.stringify({
        user: state.user,
        family: state.family,
        member: state.member,
        members: state.members,
        elder: state.elder,
        preferences: state.preferences
      })
    );
  } catch (e) {
  }
}
function clearSession() {
  state.token = "";
  state.user = null;
  state.family = null;
  state.member = null;
  state.members = [];
  state.elder = null;
  state.ready = false;
  common_vendor.index.removeStorageSync(TOKEN_KEY);
  common_vendor.index.removeStorageSync(SESSION_KEY);
}
function go(url, options = {}) {
  if (options.reLaunch) {
    common_vendor.index.reLaunch({ url });
  } else if (options.redirect) {
    common_vendor.index.redirectTo({ url });
  } else {
    common_vendor.index.navigateTo({ url });
  }
}
function back(fallback = "/pages/home/home") {
  const pages = getCurrentPages();
  if (pages && pages.length > 1) {
    common_vendor.index.navigateBack();
  } else {
    common_vendor.index.reLaunch({ url: fallback });
  }
}
function requireLogin() {
  if (!state.token) {
    common_vendor.index.reLaunch({ url: "/pages/launch/launch" });
    return false;
  }
  return true;
}
const TABS = [
  { key: "home", label: "首页", icon: "home", path: "/pages/home/home" },
  { key: "board", label: "看板", icon: "cal", path: "/pages/board/board" },
  { key: "timeline", label: "流水", icon: "clock", path: "/pages/timeline/timeline" },
  { key: "profile", label: "档案", icon: "doc", path: "/pages/profile/profile" },
  { key: "me", label: "我的", icon: "me", path: "/pages/settings/settings" }
];
exports.TABS = TABS;
exports.back = back;
exports.clearSession = clearSession;
exports.go = go;
exports.patchSession = patchSession;
exports.requireLogin = requireLogin;
exports.setSession = setSession;
exports.state = state;
exports.useSession = useSession;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/session.js.map
