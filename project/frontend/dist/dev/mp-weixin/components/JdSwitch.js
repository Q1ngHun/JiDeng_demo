"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  __name: "JdSwitch",
  props: {
    modelValue: { type: Boolean, default: false },
    size: { type: String, default: "md" },
    disabled: { type: Boolean, default: false }
  },
  emits: ["update:modelValue", "change"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    function toggle() {
      if (props.disabled)
        return;
      emit("update:modelValue", !props.modelValue);
      emit("change", !props.modelValue);
    }
    return (_ctx, _cache) => {
      return {
        a: __props.modelValue ? 1 : "",
        b: __props.size === "sm" ? 1 : "",
        c: common_vendor.o(toggle, "1c")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b6df9711"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/JdSwitch.js.map
