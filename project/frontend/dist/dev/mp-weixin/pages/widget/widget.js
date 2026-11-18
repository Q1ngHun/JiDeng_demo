"use strict";
const common_vendor = require("../../common/vendor.js");
const api_index = require("../../api/index.js");
if (!Math) {
  (JdNav + JdSwitch)();
}
const JdNav = () => "../../components/JdNav.js";
const JdSwitch = () => "../../components/JdSwitch.js";
const _sfc_main = {
  __name: "widget",
  setup(__props) {
    const widget = common_vendor.ref({ familyName: "李家", dateLabel: "", pendingCount: 0, tasks: [] });
    const settings = common_vendor.ref({
      size: "medium",
      showTasks: true,
      showClaimCount: true,
      showNextCheckup: true,
      showHealth: false,
      liveActivity: true
    });
    const nextCheckupText = common_vendor.ref("11/24");
    const visibleTasks = common_vendor.computed(() => {
      if (!settings.value.showTasks)
        return [];
      const limit = settings.value.size === "large" ? 3 : 2;
      return (widget.value.tasks || []).slice(0, limit);
    });
    common_vendor.onMounted(async () => {
      try {
        widget.value = await api_index.homeApi.widget();
      } catch (e) {
      }
      try {
        const res = await api_index.settingApi.get();
        settings.value = { ...settings.value, ...res.widget };
      } catch (e) {
      }
      try {
        const overview = await api_index.homeApi.overview();
        nextCheckupText.value = formatCheckup(
          overview.elder ? overview.elder.nextCheckup : "",
          overview.kpi ? overview.kpi.nextCheckupDays : null
        );
      } catch (e) {
      }
    });
    function formatCheckup(iso, days) {
      if (!iso)
        return "未设置";
      const date = `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
      if (days === null || days === void 0)
        return date;
      if (days < 0)
        return `${date} · 已过期`;
      if (days === 0)
        return `${date} · 今天`;
      if (days === 1)
        return `${date} · 明天`;
      return `${date} · ${days} 天后`;
    }
    async function setSize(size) {
      settings.value.size = size;
      save({ size });
    }
    async function save(patch) {
      try {
        await api_index.settingApi.widget(patch);
      } catch (e) {
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "桌面小组件",
          back: true
        }),
        b: common_vendor.t(widget.value.familyName || "李家"),
        c: common_vendor.t(widget.value.dateLabel),
        d: common_vendor.t(widget.value.pendingCount),
        e: settings.value.size !== "small"
      }, settings.value.size !== "small" ? {
        f: common_vendor.f(visibleTasks.value, (task, k0, i0) => {
          return {
            a: common_vendor.t(task.time),
            b: common_vendor.t(task.title),
            c: common_vendor.t(task.assignee ? task.assignee.name : "待认领"),
            d: task.id,
            e: task === visibleTasks.value[0] ? 1 : ""
          };
        })
      } : {}, {
        g: settings.value.size === "large" && settings.value.showNextCheckup
      }, settings.value.size === "large" && settings.value.showNextCheckup ? {
        h: common_vendor.t(nextCheckupText.value)
      } : {}, {
        i: common_vendor.n(settings.value.size),
        j: settings.value.size === "small" ? 1 : "",
        k: common_vendor.o(($event) => setSize("small"), "fd"),
        l: settings.value.size === "medium" ? 1 : "",
        m: common_vendor.o(($event) => setSize("medium"), "f4"),
        n: settings.value.size === "large" ? 1 : "",
        o: common_vendor.o(($event) => setSize("large"), "73"),
        p: common_vendor.o((v) => save({
          show_tasks: v
        }), "fe"),
        q: common_vendor.o(($event) => settings.value.showTasks = $event, "60"),
        r: common_vendor.p({
          modelValue: settings.value.showTasks
        }),
        s: common_vendor.o((v) => save({
          show_claim_count: v
        }), "d7"),
        t: common_vendor.o(($event) => settings.value.showClaimCount = $event, "b0"),
        v: common_vendor.p({
          modelValue: settings.value.showClaimCount
        }),
        w: common_vendor.o((v) => save({
          show_next_checkup: v
        }), "0d"),
        x: common_vendor.o(($event) => settings.value.showNextCheckup = $event, "0e"),
        y: common_vendor.p({
          modelValue: settings.value.showNextCheckup
        }),
        z: common_vendor.o((v) => save({
          show_health: v
        }), "5c"),
        A: common_vendor.o(($event) => settings.value.showHealth = $event, "55"),
        B: common_vendor.p({
          modelValue: settings.value.showHealth
        }),
        C: common_vendor.o((v) => save({
          live_activity: v
        }), "ba"),
        D: common_vendor.o(($event) => settings.value.liveActivity = $event, "4b"),
        E: common_vendor.p({
          modelValue: settings.value.liveActivity
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f54cac00"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/widget/widget.js.map
