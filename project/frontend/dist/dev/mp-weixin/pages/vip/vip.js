"use strict";
const common_vendor = require("../../common/vendor.js");
const api_index = require("../../api/index.js");
if (!Math) {
  (JdNav + JdIcon)();
}
const JdNav = () => "../../components/JdNav.js";
const JdIcon = () => "../../components/JdIcon.js";
const _sfc_main = {
  __name: "vip",
  setup(__props) {
    const data = common_vendor.ref(null);
    const benefits = common_vendor.ref([
      { icon: "doc", label: "记录导出 PDF", hint: "给医生看时不用翻手机", tag: "常用" },
      { icon: "bell", label: "短信提醒", hint: "推送失败时的兜底，长辈也能收到" },
      { icon: "chart", label: "4 位长辈档案", hint: "爸妈各一份，不用来回切换账号" }
    ]);
    const paying = common_vendor.ref(false);
    common_vendor.onMounted(load);
    async function load() {
      try {
        const res = await api_index.vipApi.get();
        data.value = res;
        benefits.value = res.benefits;
      } catch (e) {
      }
    }
    async function buy() {
      if (paying.value)
        return;
      paying.value = true;
      try {
        const order = await api_index.vipApi.order({ channel: "wxpay" });
        common_vendor.index.showLoading({ title: "正在支付…", mask: true });
        await new Promise((resolve) => setTimeout(resolve, 700));
        const res = await api_index.vipApi.pay(order.outTradeNo);
        common_vendor.index.hideLoading();
        common_vendor.index.showModal({
          title: "开通成功",
          content: `家庭会员已生效，到期 ${(res.membership.expiresAt || "").slice(0, 10)}。7 天内可无理由退款。`,
          showCancel: false
        });
        load();
      } catch (e) {
        common_vendor.index.hideLoading();
      } finally {
        paying.value = false;
      }
    }
    function refund() {
      common_vendor.index.showModal({
        title: "申请退款",
        content: "退款后会员权益立即停止，历史数据只读保留，不会删除。",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            await api_index.vipApi.refund();
            common_vendor.index.showToast({ title: "已退款，数据保留只读", icon: "none" });
            load();
          } catch (e) {
          }
        }
      });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "家庭会员",
          back: true
        }),
        b: common_vendor.t(data.value ? data.value.price.label : "99"),
        c: common_vendor.t(data.value ? data.value.price.unit : "元 / 年"),
        d: common_vendor.t(data.value ? data.value.included : ""),
        e: data.value && data.value.active
      }, data.value && data.value.active ? common_vendor.e({
        f: common_vendor.p({
          name: "shield",
          size: 18,
          color: "#0F7B4F"
        }),
        g: common_vendor.t(data.value.membership.expiresAt.slice(0, 10)),
        h: data.value.membership.canRefund
      }, data.value.membership.canRefund ? {
        i: common_vendor.o(refund, "11")
      } : {}) : {}, {
        j: common_vendor.f(benefits.value, (b, k0, i0) => {
          return common_vendor.e({
            a: "6afb8583-2-" + i0,
            b: common_vendor.p({
              name: b.icon,
              size: 20,
              color: "#7A6E63"
            }),
            c: common_vendor.t(b.label),
            d: common_vendor.t(b.hint),
            e: b.tag
          }, b.tag ? {
            f: common_vendor.t(b.tag)
          } : {}, {
            g: b.label
          });
        }),
        k: data.value
      }, data.value ? {
        l: common_vendor.f(data.value.table, (row, k0, i0) => {
          return {
            a: common_vendor.t(row.label),
            b: common_vendor.t(row.free),
            c: common_vendor.t(row.vip),
            d: row.label
          };
        })
      } : {}, {
        m: common_vendor.t(data.value ? data.value.policy : ""),
        n: data.value
      }, data.value ? {
        o: common_vendor.t(data.value.quota.exports.used),
        p: common_vendor.t(data.value.quota.exports.left)
      } : {}, {
        q: !data.value || !data.value.active
      }, !data.value || !data.value.active ? {
        r: common_vendor.t(paying.value ? "正在唤起支付…" : "99 元开通"),
        s: paying.value,
        t: common_vendor.o(buy, "48")
      } : {
        v: paying.value,
        w: common_vendor.o(buy, "63")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6afb8583"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/vip/vip.js.map
