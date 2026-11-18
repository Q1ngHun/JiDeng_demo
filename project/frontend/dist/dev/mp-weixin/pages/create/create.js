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
  (JdNav + JdAvatar + JdSwitch + _easycom_u_popup)();
}
const JdNav = () => "../../components/JdNav.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const JdSwitch = () => "../../components/JdSwitch.js";
const _sfc_main = {
  __name: "create",
  setup(__props) {
    const session = store_session.useSession();
    const now = /* @__PURE__ */ new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const form = common_vendor.ref({
      title: "",
      date: todayStr,
      time: "09:00",
      category: "复查",
      repeatRule: "none",
      assigneeId: null,
      location: "",
      remindLabel: "提前 1 天 20:00",
      isUrgent: false,
      needConfirm: true
    });
    const members = common_vendor.ref([]);
    const templates = common_vendor.ref([]);
    const categories = common_vendor.ref(["复查", "取药", "测量", "缴费", "用药", "其他"]);
    const repeatOptions = common_vendor.ref([{ key: "none", label: "不重复" }]);
    const remindOptions = common_vendor.ref(["提前 1 天 20:00", "提前 2 小时", "到点提醒"]);
    const remindIndex = common_vendor.ref(0);
    const elderName = common_vendor.ref("王建国");
    const elderCondition = common_vendor.ref("高血压 · 复诊");
    const showTemplates = common_vendor.ref(false);
    const showLocation = common_vendor.ref(false);
    const locationDraft = common_vendor.ref("");
    const submitting = common_vendor.ref(false);
    const locationOptions = ["市一院 3 号楼", "社区医院", "家里", "社区卫生服务中心"];
    const dateLabel = common_vendor.computed(() => {
      const d = /* @__PURE__ */ new Date(form.value.date + "T00:00:00");
      const w = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
      return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} 周${w}`;
    });
    const assigneeLabel = common_vendor.computed(() => {
      if (form.value.assigneeId === null)
        return "待认领";
      const m = members.value.find((x) => x.userId === form.value.assigneeId);
      return m ? m.name : "待认领";
    });
    common_vendor.onLoad(() => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() + 1);
      form.value.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    });
    common_vendor.onMounted(async () => {
      try {
        const meta = await api_index.taskApi.meta();
        members.value = meta.members;
        templates.value = meta.templates;
        if (meta.categories && meta.categories.length)
          categories.value = meta.categories;
        repeatOptions.value = meta.repeatOptions;
        remindOptions.value = meta.remindOptions;
        if (meta.elder)
          form.value.elderId = meta.elder.id;
        if (meta.elder) {
          elderName.value = meta.elder.name;
          elderCondition.value = session.elder && session.elder.conditions || "高血压 · 复诊";
        }
      } catch (e) {
      }
    });
    function onDate(e) {
      form.value.date = e.detail.value;
    }
    function onTime(e) {
      form.value.time = e.detail.value;
    }
    function onRemind(e) {
      remindIndex.value = Number(e.detail.value);
      form.value.remindLabel = remindOptions.value[remindIndex.value];
    }
    function shortName(m) {
      if (m.relation === "爸爸" || m.relation === "妈妈" || m.relation === "妹妹")
        return m.relation;
      return m.name.slice(0, 1);
    }
    function applyTemplate(tpl) {
      form.value.title = tpl.title;
      form.value.category = tpl.category;
      form.value.location = tpl.location;
      showTemplates.value = false;
    }
    function pickLocation(loc) {
      locationDraft.value = loc;
    }
    function saveLocation() {
      form.value.location = locationDraft.value;
      showLocation.value = false;
    }
    async function submit() {
      if (!form.value.title.trim()) {
        common_vendor.index.showToast({ title: "请先写清楚要做什么", icon: "none" });
        return;
      }
      if (submitting.value)
        return;
      submitting.value = true;
      try {
        const res = await api_index.taskApi.create({
          title: form.value.title.trim(),
          category: form.value.category,
          date: form.value.date,
          time: form.value.time,
          durationHours: 3,
          assigneeId: form.value.assigneeId,
          elderId: form.value.elderId || void 0,
          repeatRule: form.value.repeatRule,
          isUrgent: form.value.isUrgent,
          location: form.value.location,
          remindLabel: form.value.remindLabel,
          needConfirm: form.value.needConfirm
        });
        common_vendor.index.showToast({ title: res.msg || "已派发并通知", icon: "none" });
        const task = res.data || {};
        setTimeout(() => {
          common_vendor.index.redirectTo({ url: `/pages/detail/detail?id=${task.id}` });
        }, 500);
      } catch (e) {
      } finally {
        submitting.value = false;
      }
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(($event) => showTemplates.value = true, "1f"),
        b: common_vendor.p({
          title: "派发任务",
          back: true,
          action: "模板"
        }),
        c: form.value.title,
        d: common_vendor.o(($event) => form.value.title = $event.detail.value, "b4"),
        e: common_vendor.t(dateLabel.value),
        f: form.value.date,
        g: common_vendor.o(onDate, "40"),
        h: common_vendor.t(form.value.time),
        i: form.value.time,
        j: common_vendor.o(onTime, "ba"),
        k: common_vendor.f(repeatOptions.value, (opt, k0, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: opt.key,
            c: form.value.repeatRule === opt.key ? 1 : "",
            d: common_vendor.o(($event) => form.value.repeatRule = opt.key, opt.key)
          };
        }),
        l: common_vendor.f(categories.value, (c, k0, i0) => {
          return {
            a: common_vendor.t(c),
            b: c,
            c: form.value.category === c ? 1 : "",
            d: common_vendor.o(($event) => form.value.category = c, c)
          };
        }),
        m: common_vendor.t(assigneeLabel.value),
        n: common_vendor.t(form.value.assigneeId ? "单独通知" : "发到家庭组"),
        o: common_vendor.f(members.value, (m, k0, i0) => {
          return {
            a: "591de917-1-" + i0,
            b: common_vendor.p({
              text: m.avatarText,
              color: m.avatarColor,
              size: "xs"
            }),
            c: common_vendor.t(shortName(m)),
            d: m.userId,
            e: form.value.assigneeId === m.userId ? 1 : "",
            f: common_vendor.o(($event) => form.value.assigneeId = m.userId, m.userId)
          };
        }),
        p: form.value.assigneeId === null ? 1 : "",
        q: common_vendor.o(($event) => form.value.assigneeId = null, "89"),
        r: common_vendor.t(form.value.location || "未填写"),
        s: common_vendor.o(($event) => showLocation.value = true, "ad"),
        t: common_vendor.t(elderName.value),
        v: common_vendor.t(elderCondition.value),
        w: common_vendor.t(form.value.remindLabel),
        x: remindOptions.value,
        y: remindIndex.value,
        z: common_vendor.o(onRemind, "a5"),
        A: common_vendor.o(($event) => form.value.isUrgent = $event, "70"),
        B: common_vendor.p({
          modelValue: form.value.isUrgent
        }),
        C: common_vendor.o(($event) => form.value.needConfirm = $event, "50"),
        D: common_vendor.p({
          modelValue: form.value.needConfirm
        }),
        E: common_vendor.t(submitting.value ? "正在派发…" : "派发并通知"),
        F: submitting.value,
        G: common_vendor.o(submit, "74"),
        H: common_vendor.f(templates.value, (tpl, k0, i0) => {
          return {
            a: common_vendor.t(tpl.title),
            b: common_vendor.t(tpl.hint),
            c: common_vendor.t(tpl.location),
            d: tpl.key,
            e: common_vendor.o(($event) => applyTemplate(tpl), tpl.key)
          };
        }),
        I: common_vendor.o(($event) => showTemplates.value = $event, "00"),
        J: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showTemplates.value
        }),
        K: locationDraft.value,
        L: common_vendor.o(($event) => locationDraft.value = $event.detail.value, "02"),
        M: common_vendor.f(locationOptions, (loc, k0, i0) => {
          return {
            a: common_vendor.t(loc),
            b: loc,
            c: common_vendor.o(($event) => pickLocation(loc), loc)
          };
        }),
        N: common_vendor.o(saveLocation, "f6"),
        O: common_vendor.o(($event) => showLocation.value = $event, "7c"),
        P: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showLocation.value
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-591de917"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/create/create.js.map
