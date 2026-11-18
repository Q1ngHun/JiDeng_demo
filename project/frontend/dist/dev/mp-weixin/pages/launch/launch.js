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
  (JdIcon + JdAvatar + _easycom_u_popup)();
}
const JdIcon = () => "../../components/JdIcon.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const _sfc_main = {
  __name: "launch",
  setup(__props) {
    const session = store_session.useSession();
    const unlocking = common_vendor.ref(false);
    const showAccounts = common_vendor.ref(false);
    const showLogin = common_vendor.ref(false);
    const syncLabel = common_vendor.ref("尚未同步");
    const cachedTasks = common_vendor.ref(0);
    const user = common_vendor.computed(() => session.user);
    const family = common_vendor.computed(() => session.family);
    const member = common_vendor.computed(() => session.member);
    const unlockLabel = common_vendor.computed(() => {
      if (unlocking.value)
        return "正在验证面容…";
      return session.token ? "继续进入家灯" : "用面容解锁";
    });
    const form = common_vendor.ref({ username: "13800000001", password: "123456" });
    const accounts = [
      { username: "13800000001", name: "王芳", role: "李家 · 主理子女", text: "芳", color: "owner" },
      { username: "13800000002", name: "王丽", role: "李家 · 妹妹", text: "丽", color: "sis" },
      { username: "13800000003", name: "王建国", role: "李家 · 爸爸（关怀版）", text: "爸", color: "dad" },
      { username: "13800000004", name: "李秀兰", role: "李家 · 妈妈", text: "妈", color: "mom" }
    ];
    function applySync(data) {
      if (data && data.sync) {
        if (data.sync.lastSyncAt) {
          syncLabel.value = data.sync.lastSyncAt.slice(11, 16) || "今天";
        }
        if (typeof data.sync.cachedTasks === "number") {
          cachedTasks.value = data.sync.cachedTasks;
        }
      }
    }
    common_vendor.onMounted(() => {
      if (session.token) {
        api_index.authApi.me().then((data) => {
          store_session.setSession(data);
          applySync(data);
        }).catch(() => {
        });
      }
    });
    async function unlock() {
      if (unlocking.value)
        return;
      unlocking.value = true;
      try {
        const data = await api_index.authApi.face();
        store_session.setSession(data);
        applySync(data);
        setTimeout(() => {
          unlocking.value = false;
          common_vendor.index.reLaunch({ url: "/pages/home/home" });
        }, 620);
      } catch (e) {
        unlocking.value = false;
      }
    }
    async function loginByPassword() {
      if (!form.value.username || !form.value.password) {
        common_vendor.index.showToast({ title: "请填写手机号和密码", icon: "none" });
        return;
      }
      unlocking.value = true;
      try {
        const data = await api_index.authApi.login(form.value);
        store_session.setSession(data);
        applySync(data);
        showLogin.value = false;
        common_vendor.index.reLaunch({ url: "/pages/home/home" });
      } catch (e) {
      } finally {
        unlocking.value = false;
      }
    }
    async function loginAs(username) {
      unlocking.value = true;
      try {
        const data = await api_index.authApi.face({ username });
        store_session.setSession(data);
        applySync(data);
        showAccounts.value = false;
        common_vendor.index.reLaunch({ url: "/pages/home/home" });
      } catch (e) {
      } finally {
        unlocking.value = false;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          name: "lamp",
          size: 52,
          color: "#FFFFFF",
          stroke: 1.4
        }),
        b: common_vendor.p({
          text: user.value ? user.value.avatarText : "芳",
          color: user.value ? user.value.avatarColor : "owner"
        }),
        c: common_vendor.t(user.value ? user.value.name : "王芳"),
        d: common_vendor.t(family.value ? family.value.name : "李家"),
        e: common_vendor.t(member.value ? member.value.relation : "主理子女"),
        f: common_vendor.p({
          name: "shield",
          size: 18,
          color: "#FFFFFF"
        }),
        g: common_vendor.t(unlockLabel.value),
        h: unlocking.value,
        i: common_vendor.o(unlock, "de"),
        j: common_vendor.t(syncLabel.value),
        k: common_vendor.t(cachedTasks.value ? `可用 · ${cachedTasks.value} 条任务` : "登录后可离线查看"),
        l: common_vendor.o(($event) => showAccounts.value = true, "43"),
        m: common_vendor.o(($event) => showLogin.value = true, "74"),
        n: unlocking.value
      }, unlocking.value ? {
        o: common_vendor.p({
          name: "shield",
          size: 34,
          color: "#FFC48A"
        })
      } : {}, {
        p: common_vendor.f(accounts, (acc, k0, i0) => {
          return {
            a: "31c5669d-5-" + i0 + ",31c5669d-4",
            b: common_vendor.p({
              text: acc.text,
              color: acc.color,
              size: "sm"
            }),
            c: common_vendor.t(acc.name),
            d: common_vendor.t(acc.role),
            e: common_vendor.t(acc.username),
            f: acc.username,
            g: common_vendor.o(($event) => loginAs(acc.username), acc.username)
          };
        }),
        q: common_vendor.o(($event) => showAccounts.value = $event, "25"),
        r: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showAccounts.value
        }),
        s: form.value.username,
        t: common_vendor.o(($event) => form.value.username = $event.detail.value, "47"),
        v: form.value.password,
        w: common_vendor.o(($event) => form.value.password = $event.detail.value, "3a"),
        x: unlocking.value,
        y: common_vendor.o(loginByPassword, "69"),
        z: common_vendor.o(($event) => showLogin.value = $event, "fb"),
        A: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showLogin.value
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-31c5669d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/launch/launch.js.map
