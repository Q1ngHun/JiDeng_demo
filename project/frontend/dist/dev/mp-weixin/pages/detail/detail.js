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
  (JdNav + JdStatus + JdAvatar + JdIcon + _easycom_u_popup)();
}
const JdNav = () => "../../components/JdNav.js";
const JdStatus = () => "../../components/JdStatus.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const JdIcon = () => "../../components/JdIcon.js";
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const session = store_session.useSession();
    const taskId = common_vendor.ref(0);
    const task = common_vendor.ref(null);
    const members = common_vendor.ref([]);
    const showReassign = common_vendor.ref(false);
    const showComplete = common_vendor.ref(false);
    const showReason = common_vendor.ref(false);
    const reasonMode = common_vendor.ref("cancel");
    const reason = common_vendor.ref("");
    const completeNote = common_vendor.ref("");
    const completeImages = common_vendor.ref([]);
    const submitting = common_vendor.ref(false);
    const ACTIVE = ["pending_claim", "claimed", "in_progress", "pending_confirm", "overdue", "question"];
    const isActive = common_vendor.computed(() => task.value && ACTIVE.includes(task.value.status));
    const dueClock = common_vendor.computed(() => task.value && task.value.dueAt ? task.value.dueAt.slice(11, 16) : "");
    const prettyTime = common_vendor.computed(() => {
      if (!task.value)
        return "";
      return `${task.value.dayLabel} ${task.value.time}`;
    });
    const createdLabel = common_vendor.computed(() => {
      if (!task.value || !task.value.createdAt)
        return "";
      const d = new Date(task.value.createdAt.replace("T", " ").replace(/-/g, "/"));
      const now = /* @__PURE__ */ new Date();
      const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diff = Math.max(0, Math.round((n0 - d0) / 864e5));
      if (diff === 0)
        return "今天";
      if (diff === 1)
        return "昨天";
      return `${diff} 天前`;
    });
    const stateText = common_vendor.computed(() => {
      if (!task.value)
        return "";
      const last = [...task.value.events || []].reverse().find((e) => e.action !== "create");
      if (!last)
        return "等待认领";
      return `${last.note || last.title} · ${last.relative}`;
    });
    const nextStepLabel = common_vendor.computed(() => {
      if (!task.value)
        return "";
      const map = {
        pending_claim: "等待有人认领",
        claimed: "等待开始",
        in_progress: "完成并上传凭证",
        pending_confirm: "等我确认",
        question: "等待回复疑问",
        overdue: "等待补救：改派或取消"
      };
      return map[task.value.status] || "等待中";
    });
    const primaryLabel = common_vendor.computed(() => {
      if (!task.value)
        return "";
      const p = task.value.permissions;
      if (task.value.status === "pending_confirm" && p.canConfirm)
        return "确认完成";
      if (task.value.status === "in_progress" && p.canComplete)
        return "我已完成";
      if ((task.value.status === "claimed" || task.value.status === "overdue") && p.canStart)
        return "开始";
      if (p.canClaim)
        return "认领";
      return "看流水";
    });
    common_vendor.onLoad((query) => {
      taskId.value = Number(query.id || 0);
    });
    common_vendor.onMounted(async () => {
      await load();
      try {
        const meta = await api_index.taskApi.meta();
        members.value = meta.members;
      } catch (e) {
      }
    });
    common_vendor.onShow(() => {
      if (taskId.value && session.token)
        load();
    });
    async function load() {
      try {
        task.value = await api_index.taskApi.detail(taskId.value);
      } catch (e) {
      }
    }
    function primaryTap() {
      if (!task.value)
        return;
      const status = task.value.status;
      const p = task.value.permissions || {};
      if (status === "pending_confirm" && p.canConfirm)
        return confirm();
      if (status === "in_progress" && p.canComplete)
        return openComplete();
      if ((status === "claimed" || status === "overdue") && p.canStart)
        return start();
      if (p.canClaim)
        return claim();
      common_vendor.index.navigateTo({ url: "/pages/timeline/timeline" });
    }
    async function claim() {
      try {
        await api_index.taskApi.claim(taskId.value);
        common_vendor.index.showToast({ title: "已认领，记得去做", icon: "none" });
        load();
      } catch (e) {
      }
    }
    async function start() {
      try {
        await api_index.taskApi.start(taskId.value);
        common_vendor.index.showToast({ title: "已开始，安心去做", icon: "none" });
        load();
      } catch (e) {
      }
    }
    function openComplete() {
      completeNote.value = "";
      completeImages.value = [];
      showComplete.value = true;
    }
    async function complete() {
      if (submitting.value)
        return;
      submitting.value = true;
      try {
        const uploaded = [];
        for (const img of completeImages.value) {
          const url = await uploadEvidence(img);
          if (url)
            uploaded.push({ kind: "image", url });
        }
        if (completeImages.value.length && uploaded.length !== completeImages.value.length) {
          common_vendor.index.showToast({ title: "凭证上传失败，请重试", icon: "none" });
          return;
        }
        const res = await api_index.taskApi.complete(taskId.value, {
          note: completeNote.value || "已完成",
          attachments: uploaded
        });
        showComplete.value = false;
        common_vendor.index.showToast({ title: res.msg || "已提交，等待确认", icon: "none" });
        load();
      } catch (e) {
      } finally {
        submitting.value = false;
      }
    }
    async function confirm() {
      try {
        const res = await api_index.taskApi.confirm(taskId.value, { note: "主理已确认" });
        common_vendor.index.showToast({ title: res.msg || "已确认完成", icon: "none" });
        load();
      } catch (e) {
      }
    }
    async function remind() {
      try {
        await api_index.taskApi.remind(taskId.value);
        common_vendor.index.showToast({ title: "已提醒责任人", icon: "none" });
        load();
      } catch (e) {
      }
    }
    async function reassign(member) {
      try {
        await api_index.taskApi.reassign(taskId.value, { assigneeId: member.userId, reason: `改派给${member.name}` });
        showReassign.value = false;
        common_vendor.index.showToast({ title: `已改派给${member.name}`, icon: "none" });
        load();
      } catch (e) {
      }
    }
    function openMore() {
      const p = task.value ? task.value.permissions : {};
      const items = ["看照护流水"];
      if (p.canCancel)
        items.push("取消并说明");
      if (p.canSkip)
        items.push("跳过本次");
      if (p.canAsk)
        items.push("对这件事有疑问");
      common_vendor.index.showActionSheet({
        itemList: items,
        success: ({ tapIndex }) => {
          const label = items[tapIndex];
          if (label === "看照护流水") {
            common_vendor.index.navigateTo({ url: "/pages/timeline/timeline" });
          } else if (label === "取消并说明") {
            reasonMode.value = "cancel";
            reason.value = "";
            showReason.value = true;
          } else if (label === "跳过本次") {
            skip();
          } else if (label === "对这件事有疑问") {
            reasonMode.value = "question";
            reason.value = "";
            showReason.value = true;
          }
        }
      });
    }
    async function skip() {
      try {
        await api_index.taskApi.skip(taskId.value, { note: "跳过本次（重复任务，不影响其它次）" });
        common_vendor.index.showToast({ title: "已跳过本次", icon: "none" });
        load();
      } catch (e) {
      }
    }
    async function submitReason() {
      if (!reason.value.trim()) {
        common_vendor.index.showToast({ title: "请写一句原因", icon: "none" });
        return;
      }
      try {
        if (reasonMode.value === "cancel") {
          await api_index.taskApi.cancel(taskId.value, { reason: reason.value.trim() });
        } else {
          await api_index.taskApi.question(taskId.value, { note: reason.value.trim() });
        }
        showReason.value = false;
        common_vendor.index.showToast({ title: "已记录", icon: "none" });
        load();
      } catch (e) {
      }
    }
    function chooseCompleteImage() {
      common_vendor.index.chooseImage({
        count: 3,
        success: (res) => {
          completeImages.value = completeImages.value.concat(res.tempFilePaths).slice(0, 3);
        }
      });
    }
    function chooseEvidence() {
      common_vendor.index.chooseImage({
        count: 3,
        success: async (res) => {
          for (const path of res.tempFilePaths) {
            const url = await uploadEvidence(path);
            if (url)
              common_vendor.index.showToast({ title: "凭证已上传", icon: "none" });
          }
          load();
        }
      });
    }
    async function uploadEvidence(filePath) {
      try {
        const data = await api_request.upload({
          url: `/api/tasks/${taskId.value}/attachments`,
          filePath,
          formData: { kind: "image" }
        });
        return data && data.url ? data.url : "";
      } catch (e) {
        return "";
      }
    }
    function previewImage(url) {
      common_vendor.index.previewImage({ urls: [api_request.assetUrl(url)] });
    }
    function previewLocal(path) {
      common_vendor.index.previewImage({ urls: [path] });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(openMore, "e8"),
        b: common_vendor.p({
          title: "任务详情",
          back: true,
          action: "···"
        }),
        c: task.value
      }, task.value ? common_vendor.e({
        d: common_vendor.p({
          label: task.value.statusLabel,
          tone: task.value.tone
        }),
        e: common_vendor.t(task.value.category),
        f: common_vendor.t(createdLabel.value),
        g: common_vendor.t(task.value.title),
        h: common_vendor.t(prettyTime.value),
        i: task.value.assignee
      }, task.value.assignee ? {
        j: common_vendor.p({
          text: task.value.assignee.avatarText,
          color: task.value.assignee.avatarColor,
          size: "sm"
        }),
        k: common_vendor.t(task.value.assignee.name)
      } : {}, {
        l: common_vendor.t(stateText.value),
        m: task.value.location
      }, task.value.location ? {
        n: common_vendor.t(task.value.location)
      } : {}, {
        o: isActive.value
      }, isActive.value ? {
        p: common_vendor.t(dueClock.value),
        q: common_vendor.t(task.value.remaining),
        r: Math.max(2, task.value.progress) + "%",
        s: task.value.progress <= 50 ? 1 : "",
        t: common_vendor.t(task.value.reminderPlan)
      } : {}, {
        v: common_vendor.f(task.value.events, (e, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(e.title),
            b: common_vendor.t(e.relative),
            c: e.note
          }, e.note ? {
            d: common_vendor.t(e.note)
          } : {}, {
            e: e.id,
            f: common_vendor.n(e.tone)
          });
        }),
        w: isActive.value
      }, isActive.value ? {
        x: common_vendor.t(nextStepLabel.value)
      } : {}, {
        y: common_vendor.f(task.value.attachments, (att, k0, i0) => {
          return {
            a: att.id,
            b: common_vendor.unref(api_request.assetUrl)(att.url),
            c: common_vendor.o(($event) => previewImage(att.url), att.id)
          };
        }),
        z: task.value.permissions.canUpload
      }, task.value.permissions.canUpload ? {
        A: common_vendor.p({
          name: "plus",
          size: 18,
          color: "#A99D91"
        }),
        B: common_vendor.o(chooseEvidence, "34")
      } : {}, {
        C: !task.value.attachments.length && !task.value.permissions.canUpload
      }, !task.value.attachments.length && !task.value.permissions.canUpload ? {} : {}, {
        D: task.value.description
      }, task.value.description ? {
        E: common_vendor.t(task.value.description)
      } : {}) : {}, {
        F: task.value
      }, task.value ? common_vendor.e({
        G: task.value.permissions.canReassign
      }, task.value.permissions.canReassign ? {
        H: common_vendor.o(($event) => showReassign.value = true, "38")
      } : {}, {
        I: task.value.permissions.canRemind
      }, task.value.permissions.canRemind ? {
        J: common_vendor.o(remind, "21")
      } : {}, {
        K: common_vendor.t(primaryLabel.value),
        L: common_vendor.o(primaryTap, "43")
      }) : {}, {
        M: common_vendor.f(members.value, (m, k0, i0) => {
          return {
            a: "9cb6f745-5-" + i0 + ",9cb6f745-4",
            b: common_vendor.p({
              text: m.avatarText,
              color: m.avatarColor,
              size: "sm"
            }),
            c: common_vendor.t(m.name),
            d: common_vendor.t(m.relation),
            e: m.userId,
            f: common_vendor.o(($event) => reassign(m), m.userId)
          };
        }),
        N: common_vendor.o(($event) => showReassign.value = $event, "ba"),
        O: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showReassign.value
        }),
        P: completeNote.value,
        Q: common_vendor.o(($event) => completeNote.value = $event.detail.value, "9f"),
        R: common_vendor.f(completeImages.value, (img, i, i0) => {
          return {
            a: img,
            b: i,
            c: common_vendor.o(($event) => previewLocal(img), i)
          };
        }),
        S: common_vendor.p({
          name: "plus",
          size: 18,
          color: "#A99D91"
        }),
        T: common_vendor.o(chooseCompleteImage, "09"),
        U: submitting.value,
        V: common_vendor.o(complete, "e5"),
        W: common_vendor.o(($event) => showComplete.value = $event, "0b"),
        X: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showComplete.value
        }),
        Y: common_vendor.t(reasonMode.value === "cancel" ? "取消并说明" : "有什么疑问"),
        Z: common_vendor.t(reasonMode.value === "cancel" ? "取消不会删除记录，原因会留在流水里。" : "疑问会通知创建人，记录同样保留。"),
        aa: reason.value,
        ab: common_vendor.o(($event) => reason.value = $event.detail.value, "4c"),
        ac: common_vendor.o(submitReason, "25"),
        ad: common_vendor.o(($event) => showReason.value = $event, "b2"),
        ae: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showReason.value
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9cb6f745"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/detail/detail.js.map
