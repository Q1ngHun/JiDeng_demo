"use strict";
const common_vendor = require("../../common/vendor.js");
const api_index = require("../../api/index.js");
const store_session = require("../../store/session.js");
if (!Array) {
  const _easycom_u_popup2 = common_vendor.resolveComponent("u-popup");
  _easycom_u_popup2();
}
const _easycom_u_popup = () => "../../node-modules/uview-plus/components/u-popup/u-popup.js";
if (!Math) {
  (JdNav + JdStatus + JdAvatar + JdIcon + JdTabbar + _easycom_u_popup)();
}
const JdNav = () => "../../components/JdNav.js";
const JdTabbar = () => "../../components/JdTabbar.js";
const JdStatus = () => "../../components/JdStatus.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const JdIcon = () => "../../components/JdIcon.js";
const _sfc_main = {
  __name: "board",
  setup(__props) {
    const session = store_session.useSession();
    const days = common_vendor.ref([]);
    const weekDays = common_vendor.ref([]);
    const filters = common_vendor.ref([]);
    const statuses = common_vendor.ref([]);
    const filter = common_vendor.ref("all");
    const status = common_vendor.ref("");
    const selectedDate = common_vendor.ref("");
    const showFilter = common_vendor.ref(false);
    const currentUserId = common_vendor.computed(() => session.user ? session.user.id : 0);
    const visibleDays = common_vendor.computed(() => {
      const list = selectedDate.value ? days.value.filter((d) => d.date === selectedDate.value) : days.value;
      return list.filter((d) => d.tasks.length || !selectedDate.value && d.isToday);
    });
    common_vendor.onMounted(() => {
      load();
      api_index.taskApi.meta().then((m) => {
        statuses.value = m.statuses.filter((s) => !["cancelled", "skipped"].includes(s.key));
      }).catch(() => {
      });
    });
    common_vendor.onShow(() => {
      if (session.token)
        load();
    });
    async function load() {
      try {
        const res = await api_index.taskApi.list({ range: "week", filter: filter.value, status: status.value });
        days.value = res.days;
        weekDays.value = res.weekDays;
        filters.value = res.filters;
      } catch (e) {
      }
    }
    function pickDay(d) {
      selectedDate.value = selectedDate.value === d.date ? "" : d.date;
    }
    function setFilter(key) {
      filter.value = key;
      load();
    }
    function setStatus(key) {
      status.value = key;
      showFilter.value = false;
      load();
    }
    function isMine(task) {
      return task.assignee && task.assignee.id === currentUserId.value;
    }
    function periodOf(time) {
      const h = Number((time || "00:00").slice(0, 2));
      if (h < 6)
        return "凌晨";
      if (h < 12)
        return "上午";
      if (h < 18)
        return "下午";
      return "晚上";
    }
    async function claim(task) {
      try {
        await api_index.taskApi.claim(task.id);
        common_vendor.index.showToast({ title: "已认领", icon: "none" });
        load();
      } catch (e) {
      }
    }
    function openTask(task) {
      common_vendor.index.navigateTo({ url: `/pages/detail/detail?id=${task.id}` });
    }
    function go(url) {
      common_vendor.index.navigateTo({ url });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => showFilter.value = true, "ed"),
        b: common_vendor.p({
          title: "本周看板",
          action: "筛选"
        }),
        c: common_vendor.f(weekDays.value, (d, k0, i0) => {
          return {
            a: common_vendor.t(d.weekday),
            b: common_vendor.t(d.dayNumber),
            c: d.hasOpen ? 1 : "",
            d: d.date,
            e: (selectedDate.value ? selectedDate.value === d.date : d.isToday) ? 1 : "",
            f: common_vendor.o(($event) => pickDay(d), d.date)
          };
        }),
        d: common_vendor.f(filters.value, (f, k0, i0) => {
          return {
            a: common_vendor.t(f.label),
            b: common_vendor.t(f.count),
            c: f.key,
            d: filter.value === f.key ? 1 : "",
            e: common_vendor.o(($event) => setFilter(f.key), f.key)
          };
        }),
        e: !visibleDays.value.length
      }, !visibleDays.value.length ? {} : {}, {
        f: common_vendor.f(visibleDays.value, (day, k0, i0) => {
          return {
            a: common_vendor.t(day.label),
            b: common_vendor.t(day.count),
            c: common_vendor.f(day.tasks, (task, k1, i1) => {
              return common_vendor.e({
                a: common_vendor.t(task.time),
                b: common_vendor.t(periodOf(task.time)),
                c: isMine(task) ? 1 : "",
                d: "83031968-1-" + i0 + "-" + i1,
                e: common_vendor.p({
                  label: task.statusLabel,
                  tone: task.tone
                }),
                f: common_vendor.t(task.category),
                g: task.isUrgent
              }, task.isUrgent ? {} : {}, {
                h: common_vendor.t(task.title),
                i: task.assignee
              }, task.assignee ? {
                j: "83031968-2-" + i0 + "-" + i1,
                k: common_vendor.p({
                  text: task.assignee.avatarText,
                  color: task.assignee.avatarColor,
                  size: "sm"
                }),
                l: common_vendor.t(task.assignee.name),
                m: common_vendor.t(task.assignee.id === currentUserId.value ? " · 我负责" : "")
              } : {
                n: common_vendor.o(($event) => claim(task), task.id)
              }, {
                o: task.repeatRule !== "none"
              }, task.repeatRule !== "none" ? {} : {}, {
                p: task.id,
                q: common_vendor.o(($event) => openTask(task), task.id)
              });
            }),
            d: day.date
          };
        }),
        g: common_vendor.p({
          name: "plus",
          size: 26,
          color: "#FFFFFF"
        }),
        h: common_vendor.o(($event) => go("/pages/create/create"), "22"),
        i: common_vendor.p({
          active: "board"
        }),
        j: !status.value
      }, !status.value ? {} : {}, {
        k: common_vendor.o(($event) => setStatus(""), "0c"),
        l: common_vendor.f(statuses.value, (s, k0, i0) => {
          return common_vendor.e({
            a: "83031968-6-" + i0 + ",83031968-5",
            b: common_vendor.p({
              label: s.label,
              tone: s.tone
            }),
            c: status.value === s.key
          }, status.value === s.key ? {} : {}, {
            d: s.key,
            e: common_vendor.o(($event) => setStatus(s.key), s.key)
          });
        }),
        m: common_vendor.o(($event) => showFilter.value = $event, "32"),
        n: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showFilter.value
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-83031968"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/board/board.js.map
