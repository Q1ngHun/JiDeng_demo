<template>
  <view class="jd-page">
    <jd-nav title="桌面小组件" back />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="t12 c2 sb mb10">预览</view>

      <view class="widget-card" :class="settings.size">
        <view class="between">
          <text class="w-sub">家灯 · {{ widget.familyName || '李家' }}</text>
          <text class="w-sub">{{ widget.dateLabel }}</text>
        </view>

        <view class="row g8 mt10 baseline">
          <text class="w-big">{{ widget.pendingCount }}</text>
          <text class="w-sub">件事等人接</text>
        </view>

        <template v-if="settings.size !== 'small'">
          <view v-for="task in visibleTasks" :key="task.id" class="w-task" :class="{ first: task === visibleTasks[0] }">
            <text class="w-time num">{{ task.time }}</text>
            <text class="w-title">{{ task.title }} · {{ task.assignee ? task.assignee.name : '待认领' }}</text>
          </view>
        </template>

        <view v-if="settings.size === 'large' && settings.showNextCheckup" class="w-foot">
          <text class="w-sub">下次复查 {{ nextCheckupText }}</text>
        </view>
      </view>

      <view class="t12 c2 sb mt20 mb8">尺寸</view>
      <view class="row g8">
        <view class="chip" :class="{ on: settings.size === 'small' }" @tap="setSize('small')">小号 2×2</view>
        <view class="chip" :class="{ on: settings.size === 'medium' }" @tap="setSize('medium')">中号 4×2</view>
        <view class="chip" :class="{ on: settings.size === 'large' }" @tap="setSize('large')">大号 4×4</view>
      </view>

      <view class="t12 c2 sb mt20 mb8">在小组件上显示</view>
      <view class="list">
        <view class="li">
          <text class="lb">今日任务</text>
          <jd-switch v-model="settings.showTasks" style="margin-left: auto" @change="(v) => save({ show_tasks: v })" />
        </view>
        <view class="li">
          <text class="lb">待认领数量</text>
          <jd-switch v-model="settings.showClaimCount" style="margin-left: auto" @change="(v) => save({ show_claim_count: v })" />
        </view>
        <view class="li">
          <text class="lb">下次复查倒计时</text>
          <jd-switch v-model="settings.showNextCheckup" style="margin-left: auto" @change="(v) => save({ show_next_checkup: v })" />
        </view>
        <view class="li">
          <view class="f1">
            <text class="lb">长辈健康数据</text>
            <view class="t11 c3 mt4">仅自己可见</view>
          </view>
          <jd-switch v-model="settings.showHealth" style="margin-left: auto" @change="(v) => save({ show_health: v })" />
        </view>
      </view>

      <view class="t12 c2 sb mt20 mb8">锁屏实时活动</view>
      <view class="card tight">
        <view class="between">
          <text class="t13 sb">任务进行中显示进度</text>
          <jd-switch v-model="settings.liveActivity" @change="(v) => save({ live_activity: v })" />
        </view>
        <view class="t11 c3 mt6">例如「陪爸爸复查 · 已到院 09:12」，结束后自动消失。</view>
      </view>

      <view class="disc mt14">
        <text class="b">小组件不放健康数据。</text>
        手机放在桌上时，别人也能看到屏幕。默认关闭，需要手动开。
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import JdNav from '@/components/JdNav.vue'
import JdSwitch from '@/components/JdSwitch.vue'
import { homeApi, settingApi } from '@/api'

const widget = ref({ familyName: '李家', dateLabel: '', pendingCount: 0, tasks: [] })
const settings = ref({
  size: 'medium',
  showTasks: true,
  showClaimCount: true,
  showNextCheckup: true,
  showHealth: false,
  liveActivity: true
})
const nextCheckupText = ref('11/24')

const visibleTasks = computed(() => {
  if (!settings.value.showTasks) return []
  const limit = settings.value.size === 'large' ? 3 : 2
  return (widget.value.tasks || []).slice(0, limit)
})

onMounted(async () => {
  try {
    widget.value = await homeApi.widget()
  } catch (e) {
    /* ignore */
  }
  try {
    const res = await settingApi.get()
    settings.value = { ...settings.value, ...res.widget }
  } catch (e) {
    /* ignore */
  }
  try {
    // 下次复查来自首页总览的 elder.nextCheckup，而不是同步时间
    const overview = await homeApi.overview()
    nextCheckupText.value = formatCheckup(
      overview.elder ? overview.elder.nextCheckup : '',
      overview.kpi ? overview.kpi.nextCheckupDays : null
    )
  } catch (e) {
    /* ignore */
  }
})

function formatCheckup(iso, days) {
  if (!iso) return '未设置'
  const date = `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`
  if (days === null || days === undefined) return date
  if (days < 0) return `${date} · 已过期`
  if (days === 0) return `${date} · 今天`
  if (days === 1) return `${date} · 明天`
  return `${date} · ${days} 天后`
}

async function setSize(size) {
  settings.value.size = size
  save({ size })
}

async function save(patch) {
  try {
    await settingApi.widget(patch)
  } catch (e) {
    /* ignore */
  }
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.widget-card {
  border-radius: 20px;
  padding: 14px;
  background: linear-gradient(150deg, #2c2320, #4a3427);
  color: #ffffff;
  min-height: 140px;
}

.widget-card.small {
  min-height: 110px;
}

.widget-card.large {
  min-height: 210px;
}

.w-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
}

.w-big {
  font-size: 28px;
  font-weight: 700;
  font-family: 'SF Mono', ui-monospace, monospace;
  color: #ffffff;
}

.baseline {
  align-items: baseline;
}

.w-task {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 8px 10px;
}

.w-task.first {
  background: rgba(255, 255, 255, 0.1);
}

.w-time {
  font-size: 12px;
  font-weight: 700;
  color: #ffc48a;
}

.w-title {
  flex: 1;
  font-size: 12px;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.w-foot {
  margin-top: 10px;
}
</style>
