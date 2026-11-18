"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  __name: "JdAvatar",
  props: {
    text: { type: String, default: "我" },
    color: { type: String, default: "owner" },
    size: { type: String, default: "md" }
  },
  setup(__props) {
    const props = __props;
    const sizeClass = common_vendor.computed(() => props.size === "md" ? "" : props.size);
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(__props.text),
        b: common_vendor.n(__props.color),
        c: common_vendor.n(sizeClass.value)
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a6b2f3b3"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/JdAvatar.js.map
