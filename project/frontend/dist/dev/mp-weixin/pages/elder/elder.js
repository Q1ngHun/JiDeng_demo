"use strict";
const common_vendor = require("../../common/vendor.js");
const api_index = require("../../api/index.js");
const store_session = require("../../store/session.js");
if (!Math) {
  (JdNav + JdIcon)();
}
const JdNav = () => "../../components/JdNav.js";
const JdIcon = () => "../../components/JdIcon.js";
const _sfc_main = {
  __name: "elder",
  setup(__props) {
    const session = store_session.useSession();
    const tasks = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    const bigger = common_vendor.ref(false);
    const firstOpenId = common_vendor.computed(() => {
      const open = tasks.value.find((t) => !["done", "pending_confirm"].includes(t.status));
      return open ? open.id : 0;
    });
    const compare = [
      ["正文", "15sp", "24–26sp"],
      ["主按钮高", "48", "120"],
      ["一屏卡片", "2–3 张", "1 张"],
      ["导航", "5 tab", "无 tab，单页流"],
      ["动效", "有", "关闭非必要动效"]
    ];
    common_vendor.onMounted(load);
    async function load() {
      try {
        const res = await api_index.homeApi.overview();
        tasks.value = res.todayTasks.filter((t) => t.status !== "cancelled" && t.status !== "skipped");
      } catch (e) {
      } finally {
        loading.value = false;
      }
    }
    function periodOf(time) {
      const h = Number((time || "00:00").slice(0, 2));
      if (h < 12)
        return "上午";
      if (h < 18)
        return "下午";
      return "晚上";
    }
    function isNow(task) {
      return task.id === firstOpenId.value;
    }
    async function finish(task) {
      if (!isNow(task)) {
        common_vendor.index.showToast({ title: "这一件还没到时间，到点再按", icon: "none" });
        return;
      }
      try {
        await api_index.taskApi.start(task.id);
        const res = await api_index.taskApi.complete(task.id, { note: "长辈一键确认 · 无凭证（长辈端豁免）", attachments: [] });
        common_vendor.index.showToast({ title: res.msg || "记下了，家人都能看到", icon: "none" });
        load();
      } catch (e) {
      }
    }
    function talk() {
      common_vendor.index.showToast({ title: "正在录音…（演示）", icon: "none" });
    }
    async function backToStandard() {
      try {
        await api_index.settingApi.preferences({ careMode: "standard" });
        store_session.patchSession({ preferences: { ...session.preferences || {}, careMode: "standard" } });
      } catch (e) {
        return;
      }
      if (session.member && session.member.role === "elder") {
        common_vendor.index.reLaunch({ url: "/pages/home/home" });
      } else {
        common_vendor.index.reLaunch({ url: "/pages/settings/settings" });
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "关怀版",
          back: true
        }),
        b: loading.value
      }, loading.value ? {} : {}, {
        c: common_vendor.f(tasks.value, (task, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(task.time),
            b: common_vendor.t(periodOf(task.time)),
            c: common_vendor.t(task.title),
            d: task.status === "done"
          }, task.status === "done" ? {
            e: "04271ed2-1-" + i0,
            f: common_vendor.p({
              name: "check",
              size: 30,
              color: "#FFFFFF"
            })
          } : task.status === "pending_confirm" ? {
            h: "04271ed2-2-" + i0,
            i: common_vendor.p({
              name: "clock",
              size: 26,
              color: "#0F7B4F"
            })
          } : {
            j: common_vendor.t(task.id === firstOpenId.value ? "按一下，我做完了" : "还没到时间"),
            k: common_vendor.n(task.id === firstOpenId.value ? "btn-primary" : "btn-ghost"),
            l: common_vendor.o(($event) => finish(task), task.id)
          }, {
            g: task.status === "pending_confirm",
            m: task.id
          });
        }),
        d: !loading.value && !tasks.value.length
      }, !loading.value && !tasks.value.length ? {} : {}, {
        e: common_vendor.p({
          name: "mic",
          size: 28,
          color: "#171210"
        }),
        f: common_vendor.o(talk, "28"),
        g: common_vendor.p({
          name: "sun",
          size: 28,
          color: "#171210"
        }),
        h: common_vendor.t(bigger.value ? "字已更大" : "字更大"),
        i: common_vendor.o(($event) => bigger.value = !bigger.value, "76"),
        j: bigger.value ? 1 : "",
        k: common_vendor.f(compare, (row, k0, i0) => {
          return {
            a: common_vendor.t(row[0]),
            b: common_vendor.t(row[1]),
            c: common_vendor.t(row[2]),
            d: row[0]
          };
        }),
        l: common_vendor.o(backToStandard, "ad")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-04271ed2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/elder/elder.js.map
