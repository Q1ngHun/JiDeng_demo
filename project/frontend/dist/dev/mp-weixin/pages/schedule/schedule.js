"use strict";
const common_vendor = require("../../common/vendor.js");
const api_index = require("../../api/index.js");
const store_session = require("../../store/session.js");
if (!Math) {
  (JdNav + JdAvatar + JdTabbar)();
}
const JdNav = () => "../../components/JdNav.js";
const JdTabbar = () => "../../components/JdTabbar.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const _sfc_main = {
  __name: "schedule",
  setup(__props) {
    const session = store_session.useSession();
    const data = common_vendor.ref(null);
    const weekStart = common_vendor.ref("");
    const canEdit = common_vendor.computed(() => Boolean(data.value && data.value.canEdit));
    common_vendor.onMounted(load);
    common_vendor.onShow(() => {
      if (session.token)
        load();
    });
    async function load() {
      try {
        data.value = await api_index.scheduleApi.get(weekStart.value);
        weekStart.value = data.value.weekStart;
      } catch (e) {
      }
    }
    function shiftWeek(delta) {
      const base = weekStart.value ? /* @__PURE__ */ new Date(weekStart.value + "T00:00:00") : /* @__PURE__ */ new Date();
      base.setDate(base.getDate() + delta * 7);
      const y = base.getFullYear();
      const m = String(base.getMonth() + 1).padStart(2, "0");
      const d = String(base.getDate()).padStart(2, "0");
      weekStart.value = `${y}-${m}-${d}`;
      load();
    }
    function shortName(m) {
      if (m.userId === (session.user && session.user.id))
        return "我";
      if (m.relation === "爸爸")
        return "爸爸";
      if (m.relation === "妈妈")
        return "妈妈";
      if (m.relation === "妹妹")
        return "妹妹";
      return m.name.slice(0, 1);
    }
    function isWeekend(date) {
      const d = /* @__PURE__ */ new Date(date + "T00:00:00");
      const w = d.getDay();
      return w === 0 || w === 6;
    }
    function cellClass(m, cell) {
      if (!cell.hasDuty)
        return "off";
      return m.avatarColor;
    }
    function colorOf(memberId) {
      const m = data.value && data.value.members.find((x) => x.userId === memberId);
      return m ? m.avatarColor : "owner";
    }
    async function toggleCell(m, cell) {
      if (!data.value.canEdit) {
        common_vendor.index.showToast({ title: "仅主理子女可排班", icon: "none" });
        return;
      }
      try {
        await api_index.scheduleApi.toggle({ memberId: m.userId, date: cell.date, hasDuty: !cell.hasDuty });
        load();
      } catch (e) {
      }
    }
    async function autoAssign() {
      try {
        await api_index.scheduleApi.auto();
        common_vendor.index.showToast({ title: "已重新分配", icon: "none" });
        load();
      } catch (e) {
      }
    }
    async function generate() {
      try {
        const res = await api_index.scheduleApi.generate(weekStart.value);
        common_vendor.index.showToast({ title: res.created ? `已生成 ${res.created} 条任务` : "本周任务已存在", icon: "none" });
      } catch (e) {
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(generate, "ea"),
        b: common_vendor.p({
          title: "排班表",
          action: canEdit.value ? "生成任务" : ""
        }),
        c: common_vendor.t(data.value ? data.value.weekLabel : "本周"),
        d: common_vendor.o(($event) => shiftWeek(-1), "e7"),
        e: common_vendor.o(($event) => shiftWeek(1), "61"),
        f: data.value
      }, data.value ? {
        g: common_vendor.f(data.value.days, (d, k0, i0) => {
          return {
            a: common_vendor.t(d.weekday),
            b: d.date,
            c: d.isToday ? 1 : "",
            d: d.isWeekend ? 1 : ""
          };
        }),
        h: common_vendor.f(data.value.members, (m, k0, i0) => {
          return {
            a: "67381f1f-1-" + i0,
            b: common_vendor.p({
              text: m.avatarText,
              color: m.avatarColor,
              size: "xs"
            }),
            c: common_vendor.t(shortName(m)),
            d: common_vendor.f(m.cells, (cell, k1, i1) => {
              return {
                a: cell.date,
                b: common_vendor.n(cellClass(m, cell)),
                c: common_vendor.n({
                  weekend: isWeekend(cell.date)
                }),
                d: common_vendor.o(($event) => toggleCell(m, cell), cell.date)
              };
            }),
            e: m.id
          };
        })
      } : {}, {
        i: data.value
      }, data.value ? {} : {}, {
        j: common_vendor.o(autoAssign, "c4"),
        k: data.value && data.value.duties.length
      }, data.value && data.value.duties.length ? {
        l: common_vendor.f(data.value.duties, (duty, k0, i0) => {
          return {
            a: "67381f1f-2-" + i0,
            b: common_vendor.p({
              text: duty.memberName.slice(0, 1),
              color: colorOf(duty.memberId),
              size: "sm"
            }),
            c: common_vendor.t(duty.dayLabel),
            d: common_vendor.t(duty.memberName),
            e: duty.id
          };
        })
      } : {}, {
        m: common_vendor.p({
          active: "board"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-67381f1f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/schedule/schedule.js.map
