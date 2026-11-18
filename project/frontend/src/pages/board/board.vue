<template>
  <view class="jd-page">
    <jd-nav title="本周看板" action="筛选" @action="showFilter = true" />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <!-- 日期条 -->
      <view class="card flat tight date-strip">
        <view class="row g4">
          <view
            v-for="d in weekDays"
            :key="d.date"
            class="day"
            :class="{ on: selectedDate ? selectedDate === d.date : d.isToday }"
            @tap="pickDay(d)"
          >
            <text class="w">{{ d.weekday }}</text>
            <text class="d num">{{ d.dayNumber }}</text>
            <view class="dot" :class="{ show: d.hasOpen }" />
          </view>
        </view>
      </view>

      <view class="row g6 mt12 chips-row">
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

      <view v-if="!visibleDays.length" class="empty">
        <view class="ic">🕯️</view>
        <view class="t13">这一周还没有安排</view>
        <view class="t11 c3 mt6">点右下角 ＋ 派一件事</view>
      </view>

      <view v-for="day in visibleDays" :key="day.date" class="day-group">
        <view class="between mt16 mb8">
          <text class="t12 c2 sb">{{ day.label }}</text>
          <text class="t11 c3">{{ day.count }} 件事</text>
        </view>

        <view
          v-for="task in day.tasks"
          :key="task.id"
          class="card tight task-card"
          @tap="openTask(task)"
        >
          <view class="row g10">
            <view class="time-col">
              <text class="t14 b num">{{ task.time }}</text>
              <text class="t10 c3 mt2">{{ periodOf(task.time) }}</text>
            </view>
            <view class="axis" :class="{ mine: isMine(task) }" />
            <view class="f1">
              <view class="row g6">
                <jd-status :label="task.statusLabel" :tone="task.tone" />
                <view class="tag">{{ task.category }}</view>
                <view v-if="task.isUrgent" class="tag brand">紧急</view>
              </view>
              <view class="t15 sb mt6 title">{{ task.title }}</view>
              <view class="row g6 mt8">
                <template v-if="task.assignee">
                  <jd-avatar :text="task.assignee.avatarText" :color="task.assignee.avatarColor" size="sm" />
                  <text class="t11 c3">{{ task.assignee.name }}{{ task.assignee.id === currentUserId ? ' · 我负责' : '' }}</text>
                </template>
                <template v-else>
                  <text class="t11 c3">待认领 · 已提醒 2 人</text>
                  <button class="btn btn-2nd btn-sm" @tap.stop="claim(task)">认领</button>
                </template>
                <text v-if="task.repeatRule !== 'none'" class="t11 c3">· 重复</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="fab" @tap="go('/pages/create/create')">
      <jd-icon name="plus" :size="26" color="#FFFFFF" />
    </view>

    <jd-tabbar active="board" />

    <!-- 状态筛选 -->
    <u-popup v-model:show="showFilter" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">按状态筛选</view>
        <view class="list mt10">
          <view class="li" @tap="setStatus('')">
            <text class="lb">全部状态</text>
            <text v-if="!status" class="t11 cbrand" style="margin-left: auto">已选</text>
          </view>
          <view v-for="s in statuses" :key="s.key" class="li" @tap="setStatus(s.key)">
            <jd-status :label="s.label" :tone="s.tone" />
            <text v-if="status === s.key" class="t11 cbrand" style="margin-left: auto">已选</text>
          </view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import JdNav from '@/components/JdNav.vue'
import JdTabbar from '@/components/JdTabbar.vue'
import JdStatus from '@/components/JdStatus.vue'
import JdAvatar from '@/components/JdAvatar.vue'
import JdIcon from '@/components/JdIcon.vue'
import { taskApi } from '@/api'
import { useSession } from '@/store/session'

const session = useSession()
const days = ref([])
const weekDays = ref([])
const filters = ref([])
const statuses = ref([])
const filter = ref('all')
const status = ref('')
const selectedDate = ref('')
const showFilter = ref(false)

const currentUserId = computed(() => (session.user ? session.user.id : 0))

const visibleDays = computed(() => {
  const list = selectedDate.value
    ? days.value.filter((d) => d.date === selectedDate.value)
    : days.value
  return list.filter((d) => d.tasks.length || (!selectedDate.value && d.isToday))
})

onMounted(() => {
  load()
  taskApi
    .meta()
    .then((m) => {
      statuses.value = m.statuses.filter((s) => !['cancelled', 'skipped'].includes(s.key))
    })
    .catch(() => {})
})

onShow(() => {
  if (session.token) load()
})

async function load() {
  try {
    const res = await taskApi.list({ range: 'week', filter: filter.value, status: status.value })
    days.value = res.days
    weekDays.value = res.weekDays
    filters.value = res.filters
  } catch (e) {
    /* ignore */
  }
}

function pickDay(d) {
  selectedDate.value = selectedDate.value === d.date ? '' : d.date
}

function setFilter(key) {
  filter.value = key
  load()
}

function setStatus(key) {
  status.value = key
  showFilter.value = false
  load()
}

function isMine(task) {
  return task.assignee && task.assignee.id === currentUserId.value
}

function periodOf(time) {
  const h = Number((time || '00:00').slice(0, 2))
  if (h < 6) return '凌晨'
  if (h < 12) return '上午'
  if (h < 18) return '下午'
  return '晚上'
}

async function claim(task) {
  try {
    await taskApi.claim(task.id)
    uni.showToast({ title: '已认领', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

function openTask(task) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${task.id}` })
}

function go(url) {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.scroll {
  padding-bottom: 90px;
}

.date-strip {
  padding: 6px;
}

.day {
  flex: 1;
  text-align: center;
  padding: 8px 0 6px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.day.on {
  background: #171210;
  color: #ffffff;
}

.day .w {
  font-size: 10px;
  opacity: 0.6;
}

.day .d {
  font-size: 15px;
  font-weight: 700;
  margin-top: 2px;
}

.day .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: transparent;
  margin: 4px auto 0;
}

.day .dot.show {
  background: #ea580c;
}

.day.on .dot.show {
  background: #ffffff;
}

.chips-row {
  overflow-x: auto;
}

.time-col {
  width: 44px;
  text-align: center;
  flex: 0 0 auto;
}

.axis {
  width: 2px;
  align-self: stretch;
  background: #e7ded4;
  border-radius: 2px;
  flex: 0 0 auto;
}

.axis.mine {
  background: #ea580c;
}

.title {
  line-height: 22px;
}

.task-card {
  margin-bottom: 8px;
  min-height: 84px;
}

.fab {
  position: absolute;
  right: 16px;
  bottom: 96px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #c2410c;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 35;
  box-shadow: 0 8px 20px rgba(194, 65, 12, 0.38);
}

.pop {
  padding: 16px 18px 26px;
}

.pop-title {
  font-size: 17px;
  font-weight: 600;
}
</style>
