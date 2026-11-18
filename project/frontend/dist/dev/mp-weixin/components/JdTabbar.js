"use strict";
const common_vendor = require("../common/vendor.js");
const store_session = require("../store/session.js");
if (!Math) {
  JdIcon();
}
const JdIcon = () => "./JdIcon.js";
const _sfc_main = {
  __name: "JdTabbar",
  props: {
    active: { type: String, default: "home" },
    badge: { type: Boolean, default: false }
  },
  setup(__props) {
    const tabs = store_session.TABS;
    function switchTo(tab) {
      common_vendor.index.reLaunch({ url: tab.path });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(common_vendor.unref(tabs), (tab, k0, i0) => {
          return common_vendor.e({
            a: "44731023-0-" + i0,
            b: common_vendor.p({
              name: tab.icon,
              size: 24,
              color: tab.key === __props.active ? "#C2410C" : "#7A6E63"
            }),
            c: common_vendor.t(tab.label),
            d: tab.key === "board" && __props.badge
          }, tab.key === "board" && __props.badge ? {} : {}, {
            e: tab.key,
            f: tab.key === __props.active ? 1 : "",
            g: common_vendor.o(($event) => switchTo(tab), tab.key)
          });
        })
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-44731023"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/JdTabbar.js.map
