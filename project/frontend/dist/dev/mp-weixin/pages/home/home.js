"use strict";
const common_vendor = require("../../common/vendor.js");
const api_index = require("../../api/index.js");
const store_session = require("../../store/session.js");
if (!Array) {
  const _easycom_u_loading_icon2 = common_vendor.resolveComponent("u-loading-icon");
  _easycom_u_loading_icon2();
}
const _easycom_u_loading_icon = () => "../../node-modules/uview-plus/components/u-loading-icon/u-loading-icon.js";
if (!Math) {
  (JdNav + _easycom_u_loading_icon + JdAvatar + JdRing + JdStatus + JdIcon + JdTabbar)();
}
const JdNav = () => "../../components/JdNav.js";
const JdTabbar = () => "../../components/JdTabbar.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const JdStatus = () => "../../components/JdStatus.js";
const JdRing = () => "../../components/JdRing.js";
const JdIcon = () => "../../components/JdIcon.js";
const _sfc_main = {
  __name: "home",
  setup(__props) {
    const session = store_session.useSession();
    const data = common_vendor.ref(null);
    const loading = common_vendor.ref(true);
    const online = common_vendor.ref(true);
    const isElder = common_vendor.computed(() => session.member && session.member.role === "elder");
    common_vendor.onMounted(() => {
      store_session.requireLogin();
      common_vendor.index.getNetworkType({
        success: (res) => {
          online.value = res.networkType !== "none";
        }
      });
      common_vendor.index.onNetworkStatusChange((res) => {
        online.value = res.isConnected;
        if (res.isConnected)
          refresh();
      });
    });
    common_vendor.onShow(() => {
      if (session.token)
        refresh();
    });
    async function refresh() {
      try {
        const res = await api_index.homeApi.overview();
        data.value = res;
      } catch (e) {
      } finally {
        loading.value = false;
      }
    }
    async function claim(task) {
      try {
        await api_index.taskApi.claim(task.id);
        common_vendor.index.showToast({ title: "已认领，记得去做", icon: "none" });
        refresh();
      } catch (e) {
      }
    }
    function go(url) {
      store_session.go(url);
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => go("/pages/create/create"), "90"),
        b: common_vendor.p({
          title: "家灯",
          action: isElder.value ? "" : "＋"
        }),
        c: loading.value && !data.value
      }, loading.value && !data.value ? {
        d: common_vendor.p({
          mode: "circle",
          color: "#C2410C",
          size: "22"
        })
      } : data.value ? common_vendor.e({
        f: common_vendor.t(data.value.greeting),
        g: common_vendor.t(data.value.userName),
        h: common_vendor.t(data.value.dateLabel),
        i: common_vendor.t(data.value.connectDays),
        j: common_vendor.f(data.value.members, (m, k0, i0) => {
          return {
            a: m.id,
            b: "0cd09a48-2-" + i0,
            c: common_vendor.p({
              text: m.userId === data.value.user.id ? "我" : m.avatarText,
              color: m.avatarColor
            })
          };
        }),
        k: common_vendor.t(online.value ? data.value.sync.label : "离线缓存"),
        l: common_vendor.t(online.value ? data.value.sync.lastSyncLabel : "网络恢复后自动同步"),
        m: common_vendor.t(data.value.sync.tip),
        n: common_vendor.t(data.value.stats.completionRate),
        o: common_vendor.t(data.value.stats.deltaVsLastWeek),
        p: common_vendor.p({
          value: data.value.stats.completionRate,
          label: `${data.value.stats.doneCount}/${data.value.stats.totalCount}`
        }),
        q: common_vendor.f(data.value.stats.bars, (bar, i, i0) => {
          return {
            a: bar.isToday ? 1 : "",
            b: Math.max(6, bar.value) + "%",
            c: i
          };
        }),
        r: common_vendor.f(data.value.stats.bars, (bar, i, i0) => {
          return {
            a: common_vendor.t(bar.weekday),
            b: i
          };
        }),
        s: common_vendor.o(($event) => go("/pages/board/board"), "dc"),
        t: common_vendor.t(data.value.kpi.pendingClaim),
        v: common_vendor.t(data.value.kpi.pendingConfirm),
        w: common_vendor.t(data.value.kpi.nextCheckupDays !== null ? data.value.kpi.nextCheckupDays : "—"),
        x: !isElder.value
      }, !isElder.value ? {
        y: common_vendor.o(($event) => go("/pages/board/board"), "b5")
      } : {}, {
        z: !data.value.todayTasks.length
      }, !data.value.todayTasks.length ? {} : {}, {
        A: common_vendor.f(data.value.todayTasks, (task, k0, i0) => {
          return common_vendor.e({
            a: "0cd09a48-4-" + i0,
            b: common_vendor.p({
              label: task.statusLabel,
              tone: task.tone
            }),
            c: common_vendor.t(task.category),
            d: common_vendor.t(task.time),
            e: common_vendor.t(task.title),
            f: task.assignee
          }, task.assignee ? {
            g: "0cd09a48-5-" + i0,
            h: common_vendor.p({
              text: task.assignee.avatarText,
              color: task.assignee.avatarColor,
              size: "sm"
            }),
            i: common_vendor.t(task.assignee.name)
          } : {
            j: common_vendor.t(2)
          }, {
            k: task.evidenceCount
          }, task.evidenceCount ? {
            l: "0cd09a48-6-" + i0,
            m: common_vendor.p({
              name: "camera",
              size: 13,
              color: "#7A6E63"
            }),
            n: common_vendor.t(task.evidenceCount)
          } : task.status === "pending_claim" && !isElder.value ? {
            p: common_vendor.o(($event) => claim(task), task.id)
          } : {}, {
            o: task.status === "pending_claim" && !isElder.value,
            q: task.id,
            r: common_vendor.o(($event) => go("/pages/detail/detail?id=" + task.id), task.id)
          });
        }),
        B: isElder.value
      }, isElder.value ? {
        C: common_vendor.p({
          name: "sun",
          size: 22,
          color: "#C2410C"
        }),
        D: common_vendor.o(($event) => go("/pages/elder/elder"), "55")
      } : {
        E: common_vendor.f(data.value.quickActions, (action, k0, i0) => {
          return {
            a: "0cd09a48-8-" + i0,
            b: common_vendor.p({
              name: action.icon,
              size: 18,
              color: "#171210"
            }),
            c: common_vendor.t(action.label),
            d: action.key,
            e: common_vendor.o(($event) => go(action.path), action.key)
          };
        })
      }) : {}, {
        e: data.value,
        F: common_vendor.p({
          active: "home",
          badge: data.value && data.value.kpi.pendingClaim > 0
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0cd09a48"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/home.js.map
