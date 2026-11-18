<template>
  <view class="jd-page">
    <jd-nav title="流水" action="导出" @action="go('/pages/export/export')" />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="row g8 wrap mt6">
        <view
          v-for="f in filters"
          :key="f.key"
          class="chip"
          :class="{ on: filter === f.key }"
          @tap="setFilter(f.key)"
        >
          {{ f.label }} {{ f.count }}
        </view>
      </view>

      <view class="notice-bar mt10">
        <jd-icon name="lock" :size="14" color="#7A6E63" />
        <text>只增不改 · 不可删除 · 支持导出 PDF 给医生</text>
      </view>

      <view v-if="!loading && !groups.length" class="empty">
        <view class="ic">📜</view>
        <view class="t13">还没有这类记录</view>
      </view>

      <view v-for="group in groups" :key="group.date">
        <view class="between mt16 mb6">
          <text class="t12 c2 sb">{{ group.dateLabel }}</text>
          <text class="t11 c3">{{ group.count }} 条</text>
        </view>
        <view class="tl">
          <view v-for="item in group.items" :key="item.id" class="tl-i" :class="item.tone">
            <view class="between">
              <text class="t13 sb">{{ item.title }}</text>
              <text class="t11 c3 num">{{ item.time }}</text>
            </view>
            <view v-if="item.note" class="t11 c3 mt4">{{ item.note }}</view>

            <view v-if="item.attachments && item.attachments.length" class="row g6 mt8">
              <image
                v-for="att in item.attachments.slice(0, 3)"
                :key="att.id"
                class="mini-thumb"
                :src="assetUrl(att.url)"
                mode="aspectFill"
                @tap="preview(att.url)"
              />
            </view>

            <view v-if="item.canReassign || item.canCancel" class="row g8 mt8">
              <button v-if="item.canReassign" class="btn btn-ghost btn-sm" @tap="openReassign(item)">改派</button>
              <button v-if="item.canCancel" class="btn btn-ghost btn-sm" @tap="openCancel(item)">取消并说明</button>
            </view>
          </view>
        </view>
      </view>

      <view v-if="hasMore" class="tc mt16">
        <button class="btn btn-ghost btn-auto" @tap="loadMore">加载更多</button>
      </view>

      <view class="disc mt18">
        异常条目保留补救动作，但不允许删除记录本身。导出会把这次行为也写进流水。
      </view>
    </scroll-view>

    <jd-tabbar active="timeline" />

    <u-popup v-model:show="showReassign" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">改派给谁</view>
        <view class="list mt10">
          <view v-for="m in members" :key="m.userId" class="li" @tap="doReassign(m)">
            <jd-avatar :text="m.avatarText" :color="m.avatarColor" size="sm" />
            <view class="f1">
              <text class="lb">{{ m.name }}</text>
              <view class="t11 c3 mt2">{{ m.relation }}</view>
            </view>
            <text class="chev">›</text>
          </view>
        </view>
      </view>
    </u-popup>

    <u-popup v-model:show="showCancel" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">取消并说明</view>
        <view class="t11 c3 mb10">记录不会删除，原因会保留在流水里。</view>
        <view class="field">
          <textarea v-model="cancelReason" class="textarea" placeholder="例如：已经改由社区代取，这次不需要了" placeholder-class="ph" />
        </view>
        <button class="btn btn-primary mt14" @tap="doCancel">提交</button>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import JdNav from '@/components/JdNav.vue'
import JdTabbar from '@/components/JdTabbar.vue'
import JdAvatar from '@/components/JdAvatar.vue'
import JdIcon from '@/components/JdIcon.vue'
import { taskApi, timelineApi } from '@/api'
import { assetUrl } from '@/api/request'
import { useSession } from '@/store/session'

const session = useSession()
const groups = ref([])
const filters = ref([])
const filter = ref('all')
const page = ref(1)
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const members = ref([])
const showReassign = ref(false)
const showCancel = ref(false)
const activeTaskId = ref(0)
const cancelReason = ref('')

onMounted(async () => {
  await load(true)
  try {
    const meta = await taskApi.meta()
    members.value = meta.members
  } catch (e) {
    /* ignore */
  }
})

onShow(() => {
  if (session.token) load(true)
})

/** 按日期合并分页结果：同一天跨页时不会出现两个日期分组 */
function mergeGroups(prev, next) {
  const map = new Map()
  prev.forEach((g) => map.set(g.date, { ...g, items: [...g.items] }))
  next.forEach((g) => {
    const hit = map.get(g.date)
    if (hit) {
      hit.items = hit.items.concat(g.items)
      hit.count = hit.items.length
    } else {
      map.set(g.date, { ...g, items: [...g.items] })
    }
  })
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
}

async function load(reset = false) {
  if (reset) {
    page.value = 1
    loading.value = true
    loadingMore.value = false
  }
  try {
    const res = await timelineApi.list({ filter: filter.value, page: page.value, pageSize: 20 })
    filters.value = res.filters
    hasMore.value = res.hasMore
    groups.value = reset ? res.groups : mergeGroups(groups.value, res.groups)
  } catch (e) {
    if (!reset) page.value = Math.max(1, page.value - 1)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function setFilter(key) {
  filter.value = key
  load(true)
}

function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value += 1
  load(false)
}

function preview(url) {
  uni.previewImage({ urls: [assetUrl(url)] })
}

function openReassign(item) {
  if (!item.taskId) return
  activeTaskId.value = item.taskId
  showReassign.value = true
}

function openCancel(item) {
  if (!item.taskId) return
  activeTaskId.value = item.taskId
  cancelReason.value = ''
  showCancel.value = true
}

async function doReassign(member) {
  try {
    await taskApi.reassign(activeTaskId.value, { assigneeId: member.userId, reason: `超时后改派给${member.name}` })
    showReassign.value = false
    uni.showToast({ title: `已改派给${member.name}`, icon: 'none' })
    load(true)
  } catch (e) {
    /* ignore */
  }
}

async function doCancel() {
  if (!cancelReason.value.trim()) {
    uni.showToast({ title: '请写一句原因', icon: 'none' })
    return
  }
  try {
    await taskApi.cancel(activeTaskId.value, { reason: cancelReason.value.trim() })
    showCancel.value = false
    uni.showToast({ title: '已取消并说明', icon: 'none' })
    load(true)
  } catch (e) {
    /* ignore */
  }
}

function go(url) {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.mini-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.pop {
  padding: 16px 18px 26px;
}

.pop-title {
  font-size: 17px;
  font-weight: 600;
}

.textarea {
  width: 100%;
  height: 72px;
  font-size: 15px;
  line-height: 22px;
}

:deep(.ph) {
  color: #a99d91;
}
</style>
