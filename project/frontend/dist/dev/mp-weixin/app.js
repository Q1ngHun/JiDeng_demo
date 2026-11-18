"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/launch/launch.js";
  "./pages/home/home.js";
  "./pages/board/board.js";
  "./pages/schedule/schedule.js";
  "./pages/create/create.js";
  "./pages/detail/detail.js";
  "./pages/timeline/timeline.js";
  "./pages/export/export.js";
  "./pages/profile/profile.js";
  "./pages/meds/meds.js";
  "./pages/report/report.js";
  "./pages/widget/widget.js";
  "./pages/settings/settings.js";
  "./pages/vip/vip.js";
  "./pages/elder/elder.js";
}
const _sfc_main = {
  onLaunch() {
    common_vendor.index.__f__("log", "at App.vue:4", "[家灯] v1.1.0 · 只做协作，不做诊断");
  },
  onShow() {
  },
  onHide() {
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.use(common_vendor.uviewPlus);
  return { app };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
