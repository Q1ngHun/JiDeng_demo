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
  (JdNav + JdAvatar + JdIcon + JdTabbar + _easycom_u_popup)();
}
const JdNav = () => "../../components/JdNav.js";
const JdTabbar = () => "../../components/JdTabbar.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const JdIcon = () => "../../components/JdIcon.js";
const _sfc_main = {
  __name: "profile",
  setup(__props) {
    const session = store_session.useSession();
    const detail = common_vendor.ref(null);
    const showEdit = common_vendor.ref(false);
    const showFollowUp = common_vendor.ref(false);
    const saving = common_vendor.ref(false);
    const editForm = common_vendor.ref({});
    const accessRecorded = common_vendor.ref(false);
    const elderId = common_vendor.computed(() => detail.value ? detail.value.elder.id : session.elder ? session.elder.id : 1);
    const followUp = common_vendor.computed(() => detail.value && detail.value.followUps.length ? detail.value.followUps[0] : null);
    const editFields = [
      { key: "name", label: "姓名", placeholder: "王建国" },
      { key: "birthday", label: "生日", placeholder: "1958-03-12" },
      { key: "conditions", label: "既往史", placeholder: "高血压、轻度脂肪肝" },
      { key: "allergies", label: "过敏史", placeholder: "青霉素" },
      { key: "hospital", label: "常去医院", placeholder: "市一院" },
      { key: "doctor", label: "医生", placeholder: "王志远" },
      { key: "height", label: "身高", placeholder: "172cm" },
      { key: "weight", label: "体重", placeholder: "68kg" },
      { key: "bloodType", label: "血型", placeholder: "AB" }
    ];
    common_vendor.onMounted(load);
    common_vendor.onShow(() => {
      if (session.token)
        load();
    });
    async function load() {
      try {
        const res = await api_index.elderApi.detail(elderId.value || 1);
        detail.value = res;
        if (res && res.elder && !accessRecorded.value) {
          accessRecorded.value = true;
          await api_index.elderApi.recordAccess(res.elder.id, { scope: "查看档案", action: "view" });
        }
      } catch (e) {
      }
    }
    function avatarColor(tag) {
      if (tag === "本人")
        return "dad";
      if (tag === "导出")
        return "owner";
      return "sis";
    }
    function openEdit() {
      if (!detail.value)
        return;
      if (!(session.member && session.member.role === "owner")) {
        common_vendor.index.showToast({ title: "仅主理子女可编辑档案", icon: "none" });
        return;
      }
      const e = detail.value.elder;
      editForm.value = {
        name: e.name,
        birthday: e.birthday,
        conditions: e.conditions,
        allergies: e.allergies,
        hospital: e.hospital,
        doctor: e.doctor,
        height: e.height,
        weight: e.weight,
        bloodType: e.bloodType
      };
      showEdit.value = true;
    }
    async function saveEdit() {
      if (saving.value)
        return;
      saving.value = true;
      try {
        await api_index.elderApi.update(elderId.value, editForm.value);
        showEdit.value = false;
        common_vendor.index.showToast({ title: "已保存", icon: "none" });
        load();
      } catch (e) {
      } finally {
        saving.value = false;
      }
    }
    function openFollowUp() {
      if (!followUp.value) {
        common_vendor.index.showToast({ title: "还没有设置复诊周期", icon: "none" });
        return;
      }
      showFollowUp.value = true;
    }
    async function generateFollowUpTask() {
      if (!followUp.value)
        return;
      if (!(session.member && session.member.role === "owner")) {
        common_vendor.index.showToast({ title: "复诊任务需主理子女生成", icon: "none" });
        return;
      }
      try {
        const res = await api_index.medApi.generateFollowUpTask(followUp.value.id);
        showFollowUp.value = false;
        common_vendor.index.showToast({ title: res.msg || "已生成待确认的复诊任务", icon: "none" });
      } catch (e) {
      }
    }
    function go(url) {
      common_vendor.index.navigateTo({ url });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(openEdit, "78"),
        b: common_vendor.p({
          title: "档案",
          action: "编辑"
        }),
        c: detail.value
      }, detail.value ? common_vendor.e({
        d: common_vendor.p({
          text: detail.value.elder.name.slice(0, 1),
          color: "dad",
          size: "lg"
        }),
        e: common_vendor.t(detail.value.elder.name),
        f: common_vendor.t(detail.value.elder.age ? detail.value.elder.age + " 岁" : ""),
        g: common_vendor.t(detail.value.elder.conditions || "档案待补充"),
        h: common_vendor.t(detail.value.elder.completeness),
        i: common_vendor.t(detail.value.badges.nextCheckupLabel),
        j: common_vendor.t(detail.value.badges.medCount),
        k: common_vendor.t(detail.value.badges.authorizedCount),
        l: common_vendor.p({
          name: "clock",
          size: 18,
          color: "#171210"
        }),
        m: common_vendor.o(($event) => go("/pages/meds/meds"), "3f"),
        n: common_vendor.p({
          name: "doc",
          size: 18,
          color: "#171210"
        }),
        o: common_vendor.o(($event) => go("/pages/report/report"), "5a"),
        p: common_vendor.p({
          name: "cal",
          size: 18,
          color: "#171210"
        }),
        q: common_vendor.o(openFollowUp, "ce"),
        r: common_vendor.f(detail.value.fields, (f, k0, i0) => {
          return {
            a: common_vendor.t(f.label),
            b: common_vendor.t(f.value || "未填写"),
            c: f.danger ? 1 : "",
            d: f.key,
            e: common_vendor.o(openEdit, f.key)
          };
        }),
        s: common_vendor.f(detail.value.accessLogs, (log, k0, i0) => {
          return {
            a: "04d37cba-5-" + i0,
            b: common_vendor.p({
              text: log.avatarText,
              color: avatarColor(log.viewerTag),
              size: "sm"
            }),
            c: common_vendor.t(log.viewerName),
            d: common_vendor.t(log.timeLabel),
            e: common_vendor.t(log.action === "export" ? "导出 " : ""),
            f: common_vendor.t(log.scope),
            g: common_vendor.t(log.viewerTag),
            h: log.id
          };
        }),
        t: !detail.value.accessLogs.length
      }, !detail.value.accessLogs.length ? {} : {}, {
        v: common_vendor.t(detail.value.notice)
      }) : {}, {
        w: common_vendor.p({
          active: "profile"
        }),
        x: common_vendor.f(editFields, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.label),
            b: item.placeholder,
            c: editForm.value[item.key],
            d: common_vendor.o(($event) => editForm.value[item.key] = $event.detail.value, item.key),
            e: item.key
          };
        }),
        y: saving.value,
        z: common_vendor.o(saveEdit, "29"),
        A: common_vendor.o(($event) => showEdit.value = $event, "88"),
        B: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showEdit.value
        }),
        C: followUp.value
      }, followUp.value ? {
        D: common_vendor.t(followUp.value.title),
        E: common_vendor.t(followUp.value.cycleLabel),
        F: common_vendor.t(followUp.value.lastDate),
        G: common_vendor.t(followUp.value.nextDate)
      } : {}, {
        H: common_vendor.o(generateFollowUpTask, "f4"),
        I: common_vendor.o(($event) => showFollowUp.value = $event, "86"),
        J: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showFollowUp.value
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-04d37cba"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profile.js.map
