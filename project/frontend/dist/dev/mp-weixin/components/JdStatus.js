"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  __name: "JdStatus",
  props: {
    label: { type: String, default: "" },
    tone: { type: String, default: "mute" }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(__props.label),
        b: common_vendor.n(__props.tone)
      };
    };
  }
};
wx.createComponent(_sfc_main);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/JdStatus.js.map
