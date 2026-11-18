"use strict";
const common_vendor = require("../../common/vendor.js");
const api_index = require("../../api/index.js");
const api_request = require("../../api/request.js");
if (!Array) {
  const _easycom_u_popup2 = common_vendor.resolveComponent("u-popup");
  _easycom_u_popup2();
}
const _easycom_u_popup = () => "../../node-modules/uview-plus/components/u-popup/u-popup.js";
if (!Math) {
  (JdNav + JdIcon + _easycom_u_popup + JdAvatar)();
}
const JdNav = () => "../../components/JdNav.js";
const JdIcon = () => "../../components/JdIcon.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const _sfc_main = {
  __name: "report",
  setup(__props) {
    const reports = common_vendor.ref([]);
    const current = common_vendor.ref(null);
    const quota = common_vendor.ref(null);
    const disclaimer = common_vendor.ref("");
    const notice = common_vendor.ref("");
    const showAnalyze = common_vendor.ref(false);
    const showHistory = common_vendor.ref(false);
    const analyzing = common_vendor.ref(false);
    const uploading = common_vendor.ref(false);
    const imageUrl = common_vendor.ref("");
    const title = common_vendor.ref("血常规 + 生化 12 项");
    const titles = ["血常规 + 生化 12 项", "尿常规", "肝功能", "肾功能", "血脂四项"];
    const quotaText = common_vendor.computed(() => {
      if (!quota.value)
        return "—";
      if (quota.value.limit < 0)
        return "不限次";
      return `${quota.value.used} / ${quota.value.limit} 次`;
    });
    common_vendor.onMounted(load);
    async function load() {
      try {
        const res = await api_index.reportApi.list();
        reports.value = res.reports;
        quota.value = res.quota;
        disclaimer.value = res.disclaimer;
        notice.value = res.notice;
        current.value = res.latest || null;
      } catch (e) {
      }
    }
    function selectReport(item, closeSheet = false) {
      current.value = item;
      if (closeSheet)
        showHistory.value = false;
    }
    function chooseImage() {
      common_vendor.index.chooseImage({
        count: 1,
        success: async (res) => {
          const path = res.tempFilePaths[0];
          uploading.value = true;
          try {
            const data = await api_request.upload({ url: "/api/upload", filePath: path });
            if (!data || !data.url)
              return;
            imageUrl.value = data.url;
            title.value = "血常规 + 生化 12 项";
            showAnalyze.value = true;
          } catch (e) {
          } finally {
            uploading.value = false;
          }
        }
      });
    }
    async function analyze() {
      if (analyzing.value)
        return;
      if (!imageUrl.value) {
        common_vendor.index.showToast({ title: "请先上传化验单照片", icon: "none" });
        return;
      }
      analyzing.value = true;
      try {
        const res = await api_index.reportApi.analyze({ title: title.value, imageUrl: imageUrl.value });
        showAnalyze.value = false;
        current.value = res.report;
        quota.value = res.quota;
        common_vendor.index.showToast({ title: "解读完成，已归档", icon: "none" });
        load();
      } catch (e) {
      } finally {
        analyzing.value = false;
      }
    }
    async function addToAskList() {
      if (!current.value)
        return;
      try {
        const res = await api_index.reportApi.askList(current.value.id);
        common_vendor.index.showToast({ title: res.msg || "已加入问诊清单", icon: "none" });
        load();
      } catch (e) {
      }
    }
    function flagText(flag) {
      if (flag === "high")
        return "↑";
      if (flag === "low")
        return "↓";
      return "";
    }
    function go(url) {
      common_vendor.index.navigateTo({ url });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => showHistory.value = true, "b0"),
        b: common_vendor.p({
          title: "报告解读",
          back: true,
          action: "历史"
        }),
        c: common_vendor.t(uploading.value ? "正在识别…" : "拍摄化验单"),
        d: common_vendor.o(chooseImage, "15"),
        e: common_vendor.p({
          name: "camera",
          size: 16,
          color: "#FFFFFF"
        }),
        f: common_vendor.o(chooseImage, "6e"),
        g: common_vendor.o(chooseImage, "4d"),
        h: common_vendor.t(quotaText.value),
        i: common_vendor.f(reports.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl
          }, item.imageUrl ? {
            b: common_vendor.unref(api_request.assetUrl)(item.imageUrl)
          } : {}, {
            c: common_vendor.t(item.title),
            d: common_vendor.t(item.dateLabel),
            e: common_vendor.t(item.abnormalCount ? item.abnormalCount + " 项异常" : "全部正常"),
            f: common_vendor.t(item.statusLabel),
            g: item.status === "pending_ask"
          }, item.status === "pending_ask" ? {} : {}, {
            h: item.id,
            i: common_vendor.o(($event) => selectReport(item), item.id)
          });
        }),
        j: !reports.value.length
      }, !reports.value.length ? {} : {}, {
        k: current.value
      }, current.value ? {
        l: common_vendor.t(current.value.abnormalCount ? current.value.abnormalCount + " 项不在参考范围" : "全部指标在参考范围"),
        m: current.value.abnormalCount ? "#8A6A28" : "#0F7B4F",
        n: common_vendor.t(current.value.confidence),
        o: common_vendor.f(current.value.indicators, (ind, k0, i0) => {
          return {
            a: common_vendor.t(ind.name),
            b: common_vendor.t(ind.value),
            c: common_vendor.t(ind.unit),
            d: common_vendor.t(flagText(ind.flag)),
            e: ind.name,
            f: common_vendor.n(ind.flag)
          };
        }),
        p: common_vendor.t(current.value.summaryMeaning),
        q: common_vendor.f(current.value.questions, (q, i, i0) => {
          return {
            a: common_vendor.t(q),
            b: i
          };
        })
      } : {}, {
        r: common_vendor.t(disclaimer.value),
        s: common_vendor.t(notice.value),
        t: !current.value,
        v: common_vendor.o(addToAskList, "a4"),
        w: !current.value,
        x: common_vendor.o(($event) => go("/pages/export/export"), "44"),
        y: common_vendor.f(titles, (t, k0, i0) => {
          return {
            a: common_vendor.t(t),
            b: t,
            c: title.value === t ? 1 : "",
            d: common_vendor.o(($event) => title.value = t, t)
          };
        }),
        z: title.value,
        A: common_vendor.o(($event) => title.value = $event.detail.value, "36"),
        B: common_vendor.t(analyzing.value ? "正在识别…" : "开始解读"),
        C: analyzing.value,
        D: common_vendor.o(analyze, "90"),
        E: common_vendor.o(($event) => showAnalyze.value = $event, "66"),
        F: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showAnalyze.value
        }),
        G: common_vendor.f(reports.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.title),
            b: common_vendor.t(item.dateLabel),
            c: common_vendor.t(item.abnormalCount),
            d: item.status === "pending_ask"
          }, item.status === "pending_ask" ? {
            e: "e12457dc-4-" + i0 + ",e12457dc-3",
            f: common_vendor.p({
              text: "问",
              color: "owner",
              size: "xs"
            })
          } : {}, {
            g: item.id,
            h: common_vendor.o(($event) => selectReport(item, true), item.id)
          });
        }),
        H: common_vendor.o(($event) => showHistory.value = $event, "2f"),
        I: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showHistory.value
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e12457dc"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/report/report.js.map
