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
  (JdNav + JdIcon + JdTabbar + JdAvatar + _easycom_u_popup)();
}
const JdNav = () => "../../components/JdNav.js";
const JdTabbar = () => "../../components/JdTabbar.js";
const JdAvatar = () => "../../components/JdAvatar.js";
const JdIcon = () => "../../components/JdIcon.js";
const _sfc_main = {
  __name: "timeline",
  setup(__props) {
    const session = store_session.useSession();
    const groups = common_vendor.ref([]);
    const filters = common_vendor.ref([]);
    const filter = common_vendor.ref("all");
    const page = common_vendor.ref(1);
    const hasMore = common_vendor.ref(false);
    const loading = common_vendor.ref(true);
    const loadingMore = common_vendor.ref(false);
    const members = common_vendor.ref([]);
    const showReassign = common_vendor.ref(false);
    const showCancel = common_vendor.ref(false);
    const activeTaskId = common_vendor.ref(0);
    const cancelReason = common_vendor.ref("");
    common_vendor.onMounted(async () => {
      await load(true);
      try {
        const meta = await api_index.taskApi.meta();
        members.value = meta.members;
      } catch (e) {
      }
    });
    common_vendor.onShow(() => {
      if (session.token)
        load(true);
    });
    function mergeGroups(prev, next) {
      const map = /* @__PURE__ */ new Map();
      prev.forEach((g) => map.set(g.date, { ...g, items: [...g.items] }));
      next.forEach((g) => {
        const hit = map.get(g.date);
        if (hit) {
          hit.items = hit.items.concat(g.items);
          hit.count = hit.items.length;
        } else {
          map.set(g.date, { ...g, items: [...g.items] });
        }
      });
      return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    }
    async function load(reset = false) {
      if (reset) {
        page.value = 1;
        loading.value = true;
        loadingMore.value = false;
      }
      try {
        const res = await api_index.timelineApi.list({ filter: filter.value, page: page.value, pageSize: 20 });
        filters.value = res.filters;
        hasMore.value = res.hasMore;
        groups.value = reset ? res.groups : mergeGroups(groups.value, res.groups);
      } catch (e) {
        if (!reset)
          page.value = Math.max(1, page.value - 1);
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    }
    function setFilter(key) {
      filter.value = key;
      load(true);
    }
    function loadMore() {
      if (loadingMore.value || !hasMore.value)
        return;
      loadingMore.value = true;
      page.value += 1;
      load(false);
    }
    function preview(url) {
      common_vendor.index.previewImage({ urls: [api_request.assetUrl(url)] });
    }
    function openReassign(item) {
      if (!item.taskId)
        return;
      activeTaskId.value = item.taskId;
      showReassign.value = true;
    }
    function openCancel(item) {
      if (!item.taskId)
        return;
      activeTaskId.value = item.taskId;
      cancelReason.value = "";
      showCancel.value = true;
    }
    async function doReassign(member) {
      try {
        await api_index.taskApi.reassign(activeTaskId.value, { assigneeId: member.userId, reason: `超时后改派给${member.name}` });
        showReassign.value = false;
        common_vendor.index.showToast({ title: `已改派给${member.name}`, icon: "none" });
        load(true);
      } catch (e) {
      }
    }
    async function doCancel() {
      if (!cancelReason.value.trim()) {
        common_vendor.index.showToast({ title: "请写一句原因", icon: "none" });
        return;
      }
      try {
        await api_index.taskApi.cancel(activeTaskId.value, { reason: cancelReason.value.trim() });
        showCancel.value = false;
        common_vendor.index.showToast({ title: "已取消并说明", icon: "none" });
        load(true);
      } catch (e) {
      }
    }
    function go(url) {
      common_vendor.index.navigateTo({ url });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => go("/pages/export/export"), "96"),
        b: common_vendor.p({
          title: "流水",
          action: "导出"
        }),
        c: common_vendor.f(filters.value, (f, k0, i0) => {
          return {
            a: common_vendor.t(f.label),
            b: common_vendor.t(f.count),
            c: f.key,
            d: filter.value === f.key ? 1 : "",
            e: common_vendor.o(($event) => setFilter(f.key), f.key)
          };
        }),
        d: common_vendor.p({
          name: "lock",
          size: 14,
          color: "#7A6E63"
        }),
        e: !loading.value && !groups.value.length
      }, !loading.value && !groups.value.length ? {} : {}, {
        f: common_vendor.f(groups.value, (group, k0, i0) => {
          return {
            a: common_vendor.t(group.dateLabel),
            b: common_vendor.t(group.count),
            c: common_vendor.f(group.items, (item, k1, i1) => {
              return common_vendor.e({
                a: common_vendor.t(item.title),
                b: common_vendor.t(item.time),
                c: item.note
              }, item.note ? {
                d: common_vendor.t(item.note)
              } : {}, {
                e: item.attachments && item.attachments.length
              }, item.attachments && item.attachments.length ? {
                f: common_vendor.f(item.attachments.slice(0, 3), (att, k2, i2) => {
                  return {
                    a: att.id,
                    b: common_vendor.unref(api_request.assetUrl)(att.url),
                    c: common_vendor.o(($event) => preview(att.url), att.id)
                  };
                })
              } : {}, {
                g: item.canReassign || item.canCancel
              }, item.canReassign || item.canCancel ? common_vendor.e({
                h: item.canReassign
              }, item.canReassign ? {
                i: common_vendor.o(($event) => openReassign(item), item.id)
              } : {}, {
                j: item.canCancel
              }, item.canCancel ? {
                k: common_vendor.o(($event) => openCancel(item), item.id)
              } : {}) : {}, {
                l: item.id,
                m: common_vendor.n(item.tone)
              });
            }),
            d: group.date
          };
        }),
        g: hasMore.value
      }, hasMore.value ? {
        h: common_vendor.o(loadMore, "4c")
      } : {}, {
        i: common_vendor.p({
          active: "timeline"
        }),
        j: common_vendor.f(members.value, (m, k0, i0) => {
          return {
            a: "7895ef6e-4-" + i0 + ",7895ef6e-3",
            b: common_vendor.p({
              text: m.avatarText,
              color: m.avatarColor,
              size: "sm"
            }),
            c: common_vendor.t(m.name),
            d: common_vendor.t(m.relation),
            e: m.userId,
            f: common_vendor.o(($event) => doReassign(m), m.userId)
          };
        }),
        k: common_vendor.o(($event) => showReassign.value = $event, "3d"),
        l: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showReassign.value
        }),
        m: cancelReason.value,
        n: common_vendor.o(($event) => cancelReason.value = $event.detail.value, "9e"),
        o: common_vendor.o(doCancel, "48"),
        p: common_vendor.o(($event) => showCancel.value = $event, "1d"),
        q: common_vendor.p({
          mode: "bottom",
          round: "20",
          safeAreaInsetBottom: true,
          show: showCancel.value
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-7895ef6e"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/timeline/timeline.js.map
