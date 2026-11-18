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
  (JdNav + _easycom_u_popup)();
}
const JdNav = () => "../../components/JdNav.js";
const _sfc_main = {
  __name: "meds",
  setup(__props) {
    const session = store_session.useSession();
    const data = common_vendor.ref(null);
    const elderIdParam = common_vendor.ref(0);
    const showAdd = common_vendor.ref(false);
    const showFollowUp = common_vendor.ref(false);
    const takingId = common_vendor.ref(0);
    const refillingId = common_vendor.ref(0);
    const form = common_vendor.ref({ name: "", dosage: "", frequency: "每日 1 次", timing: "早饭后", remainingDays: "30" });
    const fuForm = common_vendor.ref({ id: 0, title: "", cycleDays: 90, lastDate: "", nextDate: "" });
    const elderId = common_vendor.computed(() => elderIdParam.value || (session.elder ? session.elder.id : 1));
    const isOwner = common_vendor.computed(() => Boolean(session.member && session.member.role === "owner"));
    common_vendor.onLoad((query) => {
      elderIdParam.value = Number(query.elderId || 0);
    });
    common_vendor.onMounted(load);
    common_vendor.onShow(() => {
      if (session.token)
        load();
    });
    async function load() {
      try {
        data.value = await api_index.medApi.list(elderId.value);
      } catch (e) {
      }
    }
    function openAdd() {
      form.value = { name: "", dosage: "", frequency: "每日 1 次", timing: "早饭后", remainingDays: "30" };
      showAdd.value = true;
    }
    async function saveMed() {
      if (!form.value.name.trim()) {
        common_vendor.index.showToast({ title: "请填写药品名", icon: "none" });
        return;
      }
      try {
        const remaining = Math.max(1, Number(form.value.remainingDays || 30));
        await api_index.medApi.create(elderId.value, {
          name: form.value.name.trim(),
          dosage: form.value.dosage,
          frequency: form.value.frequency,
          timing: form.value.timing,
          totalDays: Math.max(30, remaining),
          remainingDays: remaining,
          remainingQty: remaining
        });
        showAdd.value = false;
        common_vendor.index.showToast({ title: "已添加", icon: "none" });
        load();
      } catch (e) {
      }
    }
    async function take(med) {
      if (takingId.value)
        return;
      takingId.value = med.id;
      try {
        const res = await api_index.medApi.take(med.id);
        common_vendor.index.showToast({ title: res.msg || "已打卡", icon: "none" });
        await load();
      } catch (e) {
      } finally {
        takingId.value = 0;
      }
    }
    async function refill(med) {
      if (refillingId.value)
        return;
      refillingId.value = med.id;
      try {
        const res = await api_index.medApi.refill(med.id);
        common_vendor.index.showToast({ title: res.msg || "已生成「该买药了」任务", icon: "none" });
      } catch (e) {
      } finally {
        refillingId.value = 0;
      }
    }
    function openFollowUp() {
      if (!isOwner.value) {
        common_vendor.index.showToast({ title: "复诊周期需主理子女调整", icon: "none" });
        return;
      }
      const fu = data.value && data.value.followUps[0];
      if (fu) {
        fuForm.value = { id: fu.id, title: fu.title, cycleDays: fu.cycleDays, lastDate: fu.lastDate, nextDate: fu.nextDate };
      } else {
        fuForm.value = { id: 0, title: "心内科复查", cycleDays: 90, lastDate: "", nextDate: "" };
      }
      showFollowUp.value = true;
    }
    async function saveFollowUp() {
      if (!isOwner.value) {
        common_vendor.index.showToast({ title: "复诊周期需主理子女确认", icon: "none" });
        return;
      }
      try {
        const payload = {
          title: fuForm.value.title,
          cycleDays: Number(fuForm.value.cycleDays),
          lastDate: fuForm.value.lastDate,
          nextDate: fuForm.value.nextDate
        };
        const res = fuForm.value.id ? await api_index.medApi.updateFollowUp(fuForm.value.id, payload) : await api_index.medApi.createFollowUp(elderId.value, payload);
        showFollowUp.value = false;
        common_vendor.index.showToast({ title: res.msg || "已保存", icon: "none" });
        load();
      } catch (e) {
      }
    }
    async function generateFollowUpTask(fu) {
      if (!isOwner.value) {
        common_vendor.index.showToast({ title: "复诊任务需主理子女生成", icon: "none" });
        return;
      }
      try {
        const res = await api_index.medApi.generateFollowUpTask(fu.id);
        common_vendor.index.showToast({ title: res.msg || "已生成待确认的复诊任务", icon: "none" });
      } catch (e) {
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(openAdd, "b4"),
        b: common_vendor.p({
          title: "用药清单",
          back: true,
          action: "＋"
        }),
        c: common_vendor.t(data.value ? data.value.notice : ""),
        d: data.value
      }, data.value ? {
        e: common_vendor.f(data.value.medications, (med, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(med.name),
            b: common_vendor.t(med.status === "stopped" ? "已停用" : "剩 " + med.remainingDays + " 天"),
            c: common_vendor.n(med.needBuy ? "brand" : ""),
            d: common_vendor.t(med.dosage),
            e: common_vendor.t(med.frequency),
            f: common_vendor.t(med.timing),
            g: med.status === "active"
          }, med.status === "active" ? common_vendor.e({
            h: Math.max(2, med.percent) + "%",
            i: !med.needBuy ? 1 : "",
            j: common_vendor.t(med.startDate),
            k: common_vendor.t(med.remainingQty),
            l: med.needBuy
          }, med.needBuy ? {
            m: common_vendor.o(($event) => refill(med), med.id)
          } : {}, {
            n: common_vendor.o(($event) => take(med), med.id)
          }) : {
            o: common_vendor.t(med.startDate),
            p: common_vendor.t(med.endDate)
          }, {
            q: med.id,
            r: med.status === "stopped" ? 1 : ""
          });
        }),
        f: common_vendor.o(openFollowUp, "8a"),
        g: common_vendor.f(data.value.followUps, (fu, k0, i0) => {
          return {
            a: common_vendor.t(fu.title),
            b: common_vendor.t(fu.cycleLabel),
            c: common_vendor.t(fu.lastDate),
            d: common_vendor.t(fu.nextDate),
            e: common_vendor.t(fu.note),
            f: common_vendor.o(($event) => generateFollowUpTask(fu), fu.id),
            g: fu.id
          };
        }),
        h: common_vendor.t(data.value.followUpNotice)
      } : {}, {
        i: form.value.name,
        j: common_vendor.o(($event) => form.value.name = $event.detail.value, "98"),
        k: form.value.dosage,
        l: common_vendor.o(($event) => form.value.dosage = $event.detail.value, "c4"),
        m: form.value.frequency,
        n: common_vendor.o(($event) => form.value.frequency = $event.detail.value, "5c"),
        o: form.value.timing,
        p: common_vendor.o(($event) => form.value.timing = $event.detail.value, "f3"),
        q: form.value.remainingDays,
        r: common_vendor.o(($event) => form.value.remainingDays = $event.detail.value, "da"),
        s: common_vendor.o(saveMed, "0c"),
        t: common_vendor.o(($event) => showAdd.value = $event, "c5"),
        v: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showAdd.value
        }),
        w: fuForm.value.title,
        x: common_vendor.o(($event) => fuForm.value.title = $event.detail.value, "af"),
        y: fuForm.value.cycleDays,
        z: common_vendor.o(($event) => fuForm.value.cycleDays = $event.detail.value, "8d"),
        A: common_vendor.t(fuForm.value.lastDate),
        B: fuForm.value.lastDate,
        C: common_vendor.o((e) => fuForm.value.lastDate = e.detail.value, "9d"),
        D: common_vendor.t(fuForm.value.nextDate),
        E: fuForm.value.nextDate,
        F: common_vendor.o((e) => fuForm.value.nextDate = e.detail.value, "89"),
        G: common_vendor.o(saveFollowUp, "4a"),
        H: common_vendor.o(($event) => showFollowUp.value = $event, "e0"),
        I: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showFollowUp.value
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3a9d5555"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/meds/meds.js.map
