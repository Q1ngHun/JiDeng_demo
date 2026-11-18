"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  __name: "JdRing",
  props: {
    value: { type: Number, default: 0 },
    label: { type: String, default: "" },
    size: { type: Number, default: 84 }
  },
  setup(__props) {
    const props = __props;
    const ringStyle = common_vendor.computed(() => {
      const v = Math.max(0, Math.min(100, props.value));
      return {
        width: props.size + "px",
        height: props.size + "px",
        background: `conic-gradient(#EA580C ${v * 3.6}deg, #F6EFE6 0deg)`
      };
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(__props.label),
        b: common_vendor.s(ringStyle.value)
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-497a632a"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/JdRing.js.map
