"use strict";
const common_vendor = require("../common/vendor.js");
const store_session = require("../store/session.js");
if (!Math) {
  JdIcon();
}
const JdIcon = () => "./JdIcon.js";
const _sfc_main = {
  __name: "JdNav",
  props: {
    title: { type: String, default: "" },
    back: { type: Boolean, default: false },
    action: { type: String, default: "" },
    tint: { type: Boolean, default: false },
    fallback: { type: String, default: "/pages/home/home" }
  },
  emits: ["action"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    function onBack() {
      emit("back");
      store_session.back(props.fallback);
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.back
      }, __props.back ? {
        b: common_vendor.p({
          name: "chevron-left",
          size: 22,
          color: "#171210"
        }),
        c: common_vendor.o(onBack, "48")
      } : {}, {
        d: common_vendor.t(__props.title),
        e: __props.action
      }, __props.action ? {
        f: common_vendor.t(__props.action),
        g: common_vendor.o(($event) => _ctx.$emit("action"), "be")
      } : {}, {
        h: __props.tint ? 1 : ""
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1630e7dd"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/JdNav.js.map
