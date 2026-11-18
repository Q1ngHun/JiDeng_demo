"use strict";
const common_vendor = require("../../common/vendor.js");
const api_index = require("../../api/index.js");
const api_request = require("../../api/request.js");
const store_session = require("../../store/session.js");
if (!Array) {
  const _easycom_u_popup2 = common_vendor.resolveComponent("u-popup");
  _easycom_u_popup2();
}
const _easycom_u_popup = () => "../../node-modules/uview-plus/components/u-popup/u-popup.js";
if (!Math) {
  (JdNav + JdSwitch + JdIcon + _easycom_u_popup)();
}
const JdNav = () => "../../components/JdNav.js";
const JdSwitch = () => "../../components/JdSwitch.js";
const JdIcon = () => "../../components/JdIcon.js";
const _sfc_main = {
  __name: "export",
  setup(__props) {
    const session = store_session.useSession();
    const pad = (n) => String(n).padStart(2, "0");
    const now = /* @__PURE__ */ new Date();
    const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const monthEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;
    const scope = common_vendor.ref("month");
    const start = common_vendor.ref(monthStart);
    const end = common_vendor.ref(monthEnd);
    const onlyAbnormal = common_vendor.ref(false);
    const includeTasks = common_vendor.ref(true);
    const includeEvidence = common_vendor.ref(true);
    const includeProfile = common_vendor.ref(true);
    const hideNames = common_vendor.ref(false);
    const preview = common_vendor.ref(null);
    const generating = common_vendor.ref(false);
    const showResult = common_vendor.ref(false);
    const result = common_vendor.ref(null);
    const familyName = common_vendor.computed(() => session.family ? session.family.name : "家");
    const pdfMonth = common_vendor.computed(() => scope.value === "month" ? `${now.getFullYear()}.${pad(now.getMonth() + 1)}` : `${start.value.slice(5)}`);
    const startLabel = common_vendor.computed(() => start.value.slice(5).replace("-", "/"));
    const endLabel = common_vendor.computed(() => end.value.slice(5).replace("-", "/"));
    const canExport = common_vendor.computed(() => !preview.value || preview.value.canExport);
    const quotaText = common_vendor.computed(() => {
      if (!preview.value)
        return "";
      const q = preview.value.quota.exports;
      if (q.limit < 0)
        return "家庭会员权益 · 本月导出不限次";
      return `家庭会员权益 · 本月还可导出 ${q.left} 次`;
    });
    common_vendor.onMounted(refreshPreview);
    function setScope(value) {
      scope.value = value;
      refreshPreview();
    }
    function onRange(key, e) {
      if (key === "start")
        start.value = e.detail.value;
      else
        end.value = e.detail.value;
      scope.value = "custom";
      refreshPreview();
    }
    let previewSeq = 0;
    async function refreshPreview() {
      const seq = ++previewSeq;
      try {
        const res = await api_index.exportApi.preview({
          scope: scope.value,
          start: scope.value === "custom" ? start.value : "",
          end: scope.value === "custom" ? end.value : "",
          onlyAbnormal: onlyAbnormal.value
        });
        if (seq === previewSeq)
          preview.value = res;
      } catch (e) {
      }
    }
    async function generate() {
      if (generating.value)
        return;
      generating.value = true;
      common_vendor.index.showLoading({ title: "正在生成 PDF…", mask: true });
      try {
        result.value = await api_index.exportApi.create({
          scope: scope.value,
          start: scope.value === "custom" ? start.value : "",
          end: scope.value === "custom" ? end.value : "",
          onlyAbnormal: onlyAbnormal.value,
          includeEvidence: includeEvidence.value,
          includeProfile: includeProfile.value,
          hideNames: hideNames.value
        });
        showResult.value = true;
        refreshPreview();
      } catch (e) {
      } finally {
        common_vendor.index.hideLoading();
        generating.value = false;
      }
    }
    function fullUrl(url) {
      return api_request.assetUrl(url);
    }
    function download() {
      if (!result.value)
        return;
      const url = fullUrl(result.value.url);
      common_vendor.index.downloadFile({
        url,
        success: (res) => {
          if (res.statusCode === 200) {
            common_vendor.index.openDocument({ filePath: res.tempFilePath, fileType: "pdf", showMenu: true });
          }
        }
      });
    }
    function copyLink() {
      common_vendor.index.setClipboardData({
        data: fullUrl(result.value.url),
        success: () => common_vendor.index.showToast({ title: "链接已复制", icon: "none" })
      });
    }
    function go(url) {
      common_vendor.index.navigateTo({ url });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "导出记录",
          back: true
        }),
        b: common_vendor.t(pdfMonth.value),
        c: common_vendor.t(preview.value ? preview.value.eventCount : 0),
        d: common_vendor.t(familyName.value),
        e: common_vendor.t(pdfMonth.value),
        f: common_vendor.t(preview.value ? preview.value.eventCount : 0),
        g: common_vendor.t(preview.value ? preview.value.evidenceCount : 0),
        h: scope.value === "month"
      }, scope.value === "month" ? {} : {}, {
        i: common_vendor.o(($event) => setScope("month"), "55"),
        j: common_vendor.t(startLabel.value),
        k: start.value,
        l: common_vendor.o((e) => onRange("start", e), "4a"),
        m: common_vendor.t(endLabel.value),
        n: end.value,
        o: common_vendor.o((e) => onRange("end", e), "bf"),
        p: scope.value === "custom"
      }, scope.value === "custom" ? {} : {}, {
        q: common_vendor.o(($event) => setScope("custom"), "92"),
        r: common_vendor.o(refreshPreview, "88"),
        s: common_vendor.o(($event) => onlyAbnormal.value = $event, "86"),
        t: common_vendor.p({
          modelValue: onlyAbnormal.value
        }),
        v: common_vendor.o(($event) => includeTasks.value = $event, "6d"),
        w: common_vendor.p({
          disabled: true,
          modelValue: includeTasks.value
        }),
        x: common_vendor.o(refreshPreview, "7d"),
        y: common_vendor.o(($event) => includeEvidence.value = $event, "1e"),
        z: common_vendor.p({
          modelValue: includeEvidence.value
        }),
        A: common_vendor.o(refreshPreview, "26"),
        B: common_vendor.o(($event) => includeProfile.value = $event, "b8"),
        C: common_vendor.p({
          modelValue: includeProfile.value
        }),
        D: common_vendor.o(refreshPreview, "8b"),
        E: common_vendor.o(($event) => hideNames.value = $event, "02"),
        F: common_vendor.p({
          modelValue: hideNames.value
        }),
        G: common_vendor.t(quotaText.value),
        H: !canExport.value
      }, !canExport.value ? {
        I: common_vendor.o(($event) => go("/pages/vip/vip"), "43")
      } : {}, {
        J: common_vendor.t(generating.value ? "正在生成 PDF…" : "生成 PDF"),
        K: generating.value || !canExport.value,
        L: common_vendor.o(generate, "b3"),
        M: common_vendor.p({
          name: "check",
          size: 26,
          color: "#0F7B4F"
        }),
        N: common_vendor.t(result.value.eventCount),
        O: common_vendor.o(download, "a4"),
        P: common_vendor.o(copyLink, "f5"),
        Q: common_vendor.o(($event) => showResult.value = false, "ff"),
        R: common_vendor.o(($event) => showResult.value = $event, "e8"),
        S: common_vendor.p({
          mode: "center",
          round: "18",
          width: "300px",
          show: showResult.value
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3d357165"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/export/export.js.map
