<template>
  <view class="jd-page">
    <jd-nav title="家灯" :action="isElder ? '' : '＋'" @action="go('/pages/create/create')" />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view v-if="loading && !data" class="loading">
        <u-loading-icon mode="circle" color="#C2410C" size="22" />
        <text class="t12 c3 mt10">正在同步今天的安排…</text>
      </view>

      <template v-else-if="data">
        <view class="between mt6">
          <view class="f1">
            <text class="t22 b">{{ data.greeting }}，{{ data.userName }}</text>
            <view class="t12 c3 mt4">{{ data.dateLabel }} · 已协作 {{ data.connectDays }} 天</view>
          </view>
          <view class="stack">
            <jd-avatar
              v-for="m in data.members"
              :key="m.id"
              :text="m.userId === data.user.id ? '我' : m.avatarText"
              :color="m.avatarColor"
            />
          </view>
        </view>

        <view class="sync-bar mt12">
          <view class="row g8 f1">
            <text class="t11 cok sb">● {{ online ? data.sync.label : '离线缓存' }}</text>
            <text class="t11 c2">{{ online ? data.sync.lastSyncLabel : '网络恢复后自动同步' }} · {{ data.sync.tip }}</text>
          </view>
        </view>

        <view class="card hero mt12" @tap="go('/pages/board/board')">
          <view class="between">
            <view>
              <view class="t12 c2 sb">本周完成率</view>
              <view class="row g4 mt2 rate-row">
                <text class="t36 b cbrand num">{{ data.stats.completionRate }}</text>
                <text class="t14 c2 b">%</text>
                <text class="t11 c3 ml4">+{{ data.stats.deltaVsLastWeek }} / 上周</text>
              </view>
            </view>
            <jd-ring :value="data.stats.completionRate" :label="`${data.stats.doneCount}/${data.stats.totalCount}`" />
          </view>

          <view class="chart mt14">
            <view v-for="(bar, i) in data.stats.bars" :key="i" class="chart-col">
              <view
                class="chart-bar"
                :class="{ today: bar.isToday }"
                :style="{ height: Math.max(6, bar.value) + '%' }"
              />
            </view>
          </view>
          <view class="row between mt6 chart-labels">
            <text v-for="(bar, i) in data.stats.bars" :key="i" class="t10 c3">{{ bar.weekday }}</text>
          </view>
        </view>

        <view class="row g8 mt12">
          <view class="kpi f1">
            <view class="k">{{ data.kpi.pendingClaim }}</view>
            <view class="l">待认领</view>
          </view>
          <view class="kpi f1">
            <view class="k">{{ data.kpi.pendingConfirm }}</view>
            <view class="l">待确认</view>
          </view>
          <view class="kpi f1">
            <view class="k">
              {{ data.kpi.nextCheckupDays !== null ? data.kpi.nextCheckupDays : '—' }}<text class="t11">天</text>
            </view>
            <view class="l">下次复查</view>
          </view>
        </view>

        <view class="sec">
          <view class="h">今天</view>
          <text v-if="!isElder" class="more" @tap="go('/pages/board/board')">看板 ›</text>
        </view>

        <view v-if="!data.todayTasks.length" class="card flat empty-card">
          <text class="t13 c3">今天还没有安排，也是一件好事。</text>
        </view>

        <view
          v-for="task in data.todayTasks"
          :key="task.id"
          class="card tight task-card"
          @tap="go('/pages/detail/detail?id=' + task.id)"
        >
          <view class="between">
            <view class="row g6">
              <jd-status :label="task.statusLabel" :tone="task.tone" />
              <view class="tag">{{ task.category }}</view>
            </view>
            <text class="t12 c3 num">{{ task.time }}</text>
          </view>
          <view class="t15 sb mt8 task-title">{{ task.title }}</view>
          <view class="between mt10">
            <view class="row g6">
              <template v-if="task.assignee">
                <jd-avatar :text="task.assignee.avatarText" :color="task.assignee.avatarColor" size="sm" />
                <text class="t12 c2">{{ task.assignee.name }}</text>
              </template>
              <text v-else class="t11 c3">已提醒 {{ 2 }} 人 · 无人接</text>
            </view>
            <view v-if="task.evidenceCount" class="row g4 t11 c3">
              <jd-icon name="camera" :size="13" color="#7A6E63" />
              <text>已传 {{ task.evidenceCount }} 张</text>
            </view>
            <button
              v-else-if="task.status === 'pending_claim' && !isElder"
              class="btn btn-2nd btn-sm"
              @tap.stop="claim(task)"
            >
              我来
            </button>
          </view>
        </view>

        <view class="sec">
          <view class="h">常用</view>
        </view>
        <view v-if="isElder" class="card elder-entry" @tap="go('/pages/elder/elder')">
          <view class="row g10">
            <view class="elder-icon">
              <jd-icon name="sun" :size="22" color="#C2410C" />
            </view>
            <view class="f1">
              <text class="t15 sb">关怀版</text>
              <view class="t11 c3 mt4">字更大、一屏一件事，按一下就算做完</view>
            </view>
            <text class="chev">›</text>
          </view>
        </view>
        <view v-else class="row g8 quick">
          <view
            v-for="action in data.quickActions"
            :key="action.key"
            class="btn btn-ghost quick-btn"
            @tap="go(action.path)"
          >
            <jd-icon :name="action.icon" :size="18" color="#171210" />
            <text class="t11">{{ action.label }}</text>
          </view>
        </view>
      </template>
    </scroll-view>

    <jd-tabbar active="home" :badge="data && data.kpi.pendingClaim > 0" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import JdNav from '@/components/JdNav.vue'
import JdTabbar from '@/components/JdTabbar.vue'
import JdAvatar from '@/components/JdAvatar.vue'
import JdStatus from '@/components/JdStatus.vue'
import JdRing from '@/components/JdRing.vue'
import JdIcon from '@/components/JdIcon.vue'
import { homeApi, taskApi } from '@/api'
import { useSession, requireLogin, go as nav } from '@/store/session'

const session = useSession()
const data = ref(null)
const loading = ref(true)
const online = ref(true)
const isElder = computed(() => session.member && session.member.role === 'elder')

onMounted(() => {
  requireLogin()
  // 首次进入由 onShow 负责拉取，避免 onMounted + onShow 重复请求
  uni.getNetworkType({
    success: (res) => {
      online.value = res.networkType !== 'none'
    }
  })
  uni.onNetworkStatusChange((res) => {
    online.value = res.isConnected
    if (res.isConnected) refresh()
  })
})

onShow(() => {
  if (session.token) refresh()
})

async function refresh() {
  try {
    const res = await homeApi.overview()
    data.value = res
  } catch (e) {
    /* 错误已由 request 统一提示 */
  } finally {
    loading.value = false
  }
}

async function claim(task) {
  try {
    await taskApi.claim(task.id)
    uni.showToast({ title: '已认领，记得去做', icon: 'none' })
    refresh()
  } catch (e) {
    /* ignore */
  }
}

function go(url) {
  nav(url)
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.loading {
  padding-top: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rate-row {
  align-items: baseline;
}

.ml4 {
  margin-left: 4px;
}

.chart {
  height: 56px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.62);
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 8px 10px;
}

.chart-col {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.chart-bar {
  width: 100%;
  max-width: 16px;
  border-radius: 3px;
  background: #f5c9a6;
  transition: height 0.4s ease;
}

.chart-bar.today {
  background: #ea580c;
}

.chart-labels {
  font-size: 10px;
}

.chart-labels text {
  flex: 1;
  text-align: center;
}

.task-card {
  margin-top: 8px;
}

.task-card:first-of-type {
  margin-top: 0;
}

.task-title {
  line-height: 22px;
}

.quick {
  display: flex;
}

.quick-btn {
  height: 64px;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  flex: 1;
  min-height: 64px;
  padding: 0;
}

.empty-card {
  text-align: center;
  padding: 22px;
}

.elder-entry {
  padding: 14px;
}

.elder-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #fff1e6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.elder-entry .chev {
  color: #a99d91;
  font-size: 16px;
}
</style>
