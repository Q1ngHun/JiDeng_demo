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
  (JdNav + JdAvatar + JdSwitch + JdTabbar + _easycom_u_popup)();
}
const JdNav = () => "../../components/JdNav.js";
const JdTabbar = () => "../../components/JdTabbar.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const JdSwitch = () => "../../components/JdSwitch.js";
const _sfc_main = {
  __name: "settings",
  setup(__props) {
    const session = store_session.useSession();
    const data = common_vendor.ref(null);
    const quiet = common_vendor.ref({ enabled: true, start: "22:00", end: "08:00", urgentPass: true });
    const showCache = common_vendor.ref(false);
    const showPrivacy = common_vendor.ref(false);
    const isElder = common_vendor.computed(() => session.member && session.member.role === "elder");
    common_vendor.onMounted(load);
    common_vendor.onShow(() => {
      if (session.token)
        load();
    });
    async function load() {
      try {
        const res = await api_index.settingApi.get();
        data.value = res;
        quiet.value = { ...res.quiet };
      } catch (e) {
      }
    }
    async function saveNotify(patch) {
      try {
        const res = await api_index.settingApi.notifications(patch);
        if (data.value) {
          data.value.channels = res.channels;
          data.value.events = res.events;
          quiet.value = { ...res.quiet };
        }
      } catch (e) {
        load();
      }
    }
    async function testNotification() {
      try {
        const logs = await api_index.settingApi.test();
        const first = logs && logs[0];
        if (!first)
          return;
        const label = first.status === "skipped_quiet" ? "当前处于静默时段，非紧急提醒会被挡下" : first.status === "sent" ? `已通过「${first.channelLabel || first.channel}」投递` : "所有渠道都关闭了";
        common_vendor.index.showModal({ title: "测试提醒", content: label, showCancel: false });
        load();
      } catch (e) {
      }
    }
    function clearCache() {
      common_vendor.index.showModal({
        title: "清空缓存",
        content: "离线缓存会重新从云端拉取，不影响任何记录。",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showToast({ title: "缓存已清空", icon: "none" });
            showCache.value = false;
          }
        }
      });
    }
    function logout() {
      common_vendor.index.showModal({
        title: "退出登录",
        content: "退出后需要重新面容解锁。记录不会丢失。",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            await api_index.authApi.logout();
          } catch (e) {
          }
          const { clearSession } = await "../../store/session.js";
          clearSession();
          common_vendor.index.reLaunch({ url: "/pages/launch/launch" });
        }
      });
    }
    function go(url) {
      common_vendor.index.navigateTo({ url });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "我的"
        }),
        b: !isElder.value && data.value
      }, !isElder.value && data.value ? {
        c: common_vendor.p({
          text: data.value.user.avatarText,
          color: data.value.user.avatarColor,
          size: "lg"
        }),
        d: common_vendor.t(data.value.user.name),
        e: common_vendor.t(data.value.family.name),
        f: common_vendor.t(data.value.user.relation),
        g: common_vendor.t(data.value.membership.label),
        h: common_vendor.o(($event) => go("/pages/vip/vip"), "32")
      } : {}, {
        i: common_vendor.f(data.value && data.value.channels, (ch, k0, i0) => {
          return {
            a: common_vendor.t(ch.label),
            b: common_vendor.t(ch.hint),
            c: common_vendor.o((v) => saveNotify({
              [ch.key]: v
            }), ch.key),
            d: "6d719173-2-" + i0,
            e: common_vendor.o(($event) => ch.on = $event, ch.key),
            f: common_vendor.p({
              modelValue: ch.on
            }),
            g: ch.key
          };
        }),
        j: common_vendor.t(data.value ? data.value.degradeChain : ""),
        k: common_vendor.f(data.value && data.value.events, (ev, k0, i0) => {
          return {
            a: common_vendor.t(ev.label),
            b: common_vendor.o((v) => saveNotify({
              [ev.key]: v
            }), ev.key),
            c: "6d719173-3-" + i0,
            d: common_vendor.o(($event) => ev.on = $event, ev.key),
            e: common_vendor.p({
              modelValue: ev.on
            }),
            f: ev.key
          };
        }),
        l: common_vendor.t(quiet.value.start),
        m: quiet.value.start,
        n: common_vendor.o((e) => saveNotify({
          quiet_start: e.detail.value
        }), "7d"),
        o: common_vendor.t(quiet.value.end),
        p: quiet.value.end,
        q: common_vendor.o((e) => saveNotify({
          quiet_end: e.detail.value
        }), "8b"),
        r: common_vendor.o((v) => saveNotify({
          quiet_enabled: v
        }), "56"),
        s: common_vendor.o(($event) => quiet.value.enabled = $event, "ce"),
        t: common_vendor.p({
          modelValue: quiet.value.enabled
        }),
        v: common_vendor.o((v) => saveNotify({
          urgent_pass: v
        }), "ca"),
        w: common_vendor.o(($event) => quiet.value.urgentPass = $event, "bf"),
        x: common_vendor.p({
          modelValue: quiet.value.urgentPass
        }),
        y: common_vendor.o(($event) => go("/pages/widget/widget"), "9f"),
        z: common_vendor.t(data.value ? data.value.system.cache.tasks : 0),
        A: common_vendor.t(data.value ? data.value.system.cache.sizeLabel : ""),
        B: common_vendor.o(($event) => showCache.value = true, "14"),
        C: common_vendor.o(($event) => showPrivacy.value = true, "e5"),
        D: common_vendor.o(($event) => go("/pages/elder/elder"), "bf"),
        E: common_vendor.o(testNotification, "19"),
        F: common_vendor.o(logout, "4e"),
        G: common_vendor.t(data.value ? data.value.system.version : "1.1.0"),
        H: common_vendor.p({
          active: "me"
        }),
        I: common_vendor.t(data.value ? data.value.system.cache.tasks : 0),
        J: common_vendor.t(data.value ? data.value.system.cache.sizeLabel : ""),
        K: common_vendor.t(data.value ? data.value.system.lastSyncAt.replace("T", " ").slice(0, 16) : ""),
        L: common_vendor.o(clearCache, "55"),
        M: common_vendor.o(($event) => showCache.value = $event, "7e"),
        N: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showCache.value
        }),
        O: common_vendor.o(($event) => go("/pages/profile/profile"), "1f"),
        P: common_vendor.o(($event) => showPrivacy.value = $event, "d4"),
        Q: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showPrivacy.value
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6d719173"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/settings/settings.js.map
