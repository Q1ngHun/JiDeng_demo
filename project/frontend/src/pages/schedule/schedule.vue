<template>
  <view class="jd-page">
    <jd-nav title="排班表" :action="canEdit ? '生成任务' : ''" @action="generate" />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="between mt6">
        <text class="t12 c2">{{ data ? data.weekLabel : '本周' }}</text>
        <view class="row g4">
          <view class="chip week-btn" @tap="shiftWeek(-1)">‹</view>
          <view class="chip week-btn" @tap="shiftWeek(1)">›</view>
        </view>
      </view>

      <view v-if="data" class="card flat tight table-card mt10">
        <view class="table-head">
          <view class="member-col head-cell">成员</view>
          <view class="days-row">
            <view
              v-for="d in data.days"
              :key="d.date"
              class="head-cell day-cell"
              :class="{ today: d.isToday, weekend: d.isWeekend }"
            >
              {{ d.weekday }}
            </view>
          </view>
        </view>

        <view v-for="m in data.members" :key="m.id" class="table-row">
          <view class="member-col member-name">
            <jd-avatar :text="m.avatarText" :color="m.avatarColor" size="xs" />
            <text class="t12 sb ml6">{{ shortName(m) }}</text>
          </view>
          <view class="days-row cells">
            <view
              v-for="cell in m.cells"
              :key="cell.date"
              class="cell"
              :class="[cellClass(m, cell), { weekend: isWeekend(cell.date) }]"
              @tap="toggleCell(m, cell)"
            />
          </view>
        </view>
      </view>

      <view v-if="data" class="row g12 mt10 legend">
        <view class="row g4"><view class="sq owner" /><text class="t10 c3">我的班</text></view>
        <view class="row g4"><view class="sq sis" /><text class="t10 c3">妹妹</text></view>
        <view class="row g4"><view class="sq dad" /><text class="t10 c3">爸爸自理</text></view>
        <view class="row g4"><view class="sq mom" /><text class="t10 c3">妈妈</text></view>
      </view>

      <view class="sec">
        <view class="h">本周分工<span class="sub">自动按空闲时间建议</span></view>
        <text class="more" @tap="autoAssign">重排</text>
      </view>

      <view v-if="data && data.duties.length" class="list">
        <view v-for="duty in data.duties" :key="duty.id" class="li">
          <jd-avatar :text="duty.memberName.slice(0, 1)" :color="colorOf(duty.memberId)" size="sm" />
          <view class="f1">
            <text class="lb">{{ duty.dayLabel }}</text>
            <view class="t11 c3 mt4">{{ duty.memberName }} 负责 · 已写入排班</view>
          </view>
          <view class="st done"><view class="dot" /><text>已定</text></view>
        </view>
      </view>
      <view v-else class="card flat tight tc">
        <text class="t12 c3">这周还没有排班，点「重排」让家灯给个建议。</text>
      </view>

      <view class="disc mt14">
        <text class="b">排班只是建议。</text>
        长辈端看到的永远是「今天做什么」，不会看到「谁哪天没排班」。
      </view>
    </scroll-view>

    <jd-tabbar active="board" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import JdNav from '@/components/JdNav.vue'
import JdTabbar from '@/components/JdTabbar.vue'
import JdAvatar from '@/components/JdAvatar.vue'
import { scheduleApi } from '@/api'
import { useSession } from '@/store/session'

const session = useSession()
const data = ref(null)
const weekStart = ref('')
const canEdit = computed(() => Boolean(data.value && data.value.canEdit))

onMounted(load)
onShow(() => {
  if (session.token) load()
})

async function load() {
  try {
    data.value = await scheduleApi.get(weekStart.value)
    weekStart.value = data.value.weekStart
  } catch (e) {
    /* ignore */
  }
}

function shiftWeek(delta) {
  const base = weekStart.value ? new Date(weekStart.value + 'T00:00:00') : new Date()
  base.setDate(base.getDate() + delta * 7)
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, '0')
  const d = String(base.getDate()).padStart(2, '0')
  weekStart.value = `${y}-${m}-${d}`
  load()
}

function shortName(m) {
  if (m.userId === (session.user && session.user.id)) return '我'
  if (m.relation === '爸爸') return '爸爸'
  if (m.relation === '妈妈') return '妈妈'
  if (m.relation === '妹妹') return '妹妹'
  return m.name.slice(0, 1)
}

function isWeekend(date) {
  const d = new Date(date + 'T00:00:00')
  const w = d.getDay()
  return w === 0 || w === 6
}

function cellClass(m, cell) {
  if (!cell.hasDuty) return 'off'
  return m.avatarColor
}

function colorOf(memberId) {
  const m = data.value && data.value.members.find((x) => x.userId === memberId)
  return m ? m.avatarColor : 'owner'
}

async function toggleCell(m, cell) {
  if (!data.value.canEdit) {
    uni.showToast({ title: '仅主理子女可排班', icon: 'none' })
    return
  }
  try {
    await scheduleApi.toggle({ memberId: m.userId, date: cell.date, hasDuty: !cell.hasDuty })
    load()
  } catch (e) {
    /* ignore */
  }
}

async function autoAssign() {
  try {
    await scheduleApi.auto()
    uni.showToast({ title: '已重新分配', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

async function generate() {
  try {
    const res = await scheduleApi.generate(weekStart.value)
    uni.showToast({ title: res.created ? `已生成 ${res.created} 条任务` : '本周任务已存在', icon: 'none' })
  } catch (e) {
    /* ignore */
  }
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.week-btn {
  width: 30px;
  padding: 0;
  justify-content: center;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-head {
  display: flex;
  background: #f6efe6;
  border-bottom: 1px solid #f2ebe2;
}

.member-col {
  width: 76px;
  flex: 0 0 auto;
  padding: 8px 10px;
}

.head-cell {
  font-size: 10px;
  color: #7a6e63;
  font-weight: 600;
  text-align: center;
  padding: 8px 0;
}

.day-cell.today {
  color: #c2410c;
}

.day-cell.weekend {
  opacity: 0.62;
}

.days-row {
  flex: 1;
  display: flex;
}

.days-row .head-cell {
  flex: 1;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #f2ebe2;
  align-items: stretch;
}

.table-row:last-child {
  border-bottom: 0;
}

.member-name {
  display: flex;
  align-items: center;
  padding: 12px 8px;
}

.ml6 {
  margin-left: 6px;
}

.cells {
  gap: 3px;
  padding: 8px 4px;
}

.cell {
  flex: 1;
  height: 30px;
  border-radius: 6px;
  background: #f6efe6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cell.weekend {
  opacity: 0.72;
}

.cell.off {
  background: #f6efe6;
}

.cell.owner {
  background: #fff1e6;
  border: 1px solid #fbd5b8;
}

.cell.sis {
  background: #e8eef8;
  border: 1px solid #c9d6ec;
}

.cell.dad {
  background: #eaf5ee;
  border: 1px solid #cde9db;
}

.cell.mom {
  background: #f9edf3;
  border: 1px solid #eed3e1;
}

.cell-label {
  font-size: 8px;
  line-height: 10px;
  color: #574c42;
  text-align: center;
  padding: 0 1px;
  transform: scale(0.92);
}

.legend {
  flex-wrap: wrap;
}

.sq {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.sq.owner { background: #c2410c; }
.sq.sis { background: #5f7fa8; }
.sq.dad { background: #5e8f62; }
.sq.mom { background: #b4718f; }
</style>
