<template>
  <view class="jd-page elder-page">
    <jd-nav title="关怀版" back />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="card flat tight elder-tip">
        <text class="t12 c2" style="line-height: 19px">
          <text class="b cbrand">关怀版</text>
          自动跟随系统字号，最大可到 32sp；主按钮固定 120 高，一屏只放一张卡。
        </text>
      </view>

      <view class="elder" :class="{ xl: bigger }">
        <view class="t32 b mt12">今天</view>

        <view v-if="loading" class="t17 c3 mt20">正在看看今天要做什么…</view>

        <view
          v-for="task in tasks"
          :key="task.id"
          class="card elder-card mt12"
        >
          <view class="between">
            <text class="t26 b num">{{ task.time }}</text>
            <view class="tag brand big-tag">{{ periodOf(task.time) }}</view>
          </view>
          <view class="t26 b mt8 elder-title">{{ task.title }}</view>

          <view v-if="task.status === 'done'" class="btn btn-ok elder-btn done-btn">
            <jd-icon name="check" :size="30" color="#FFFFFF" />
            <text>今天已经做完了</text>
          </view>
          <view v-else-if="task.status === 'pending_confirm'" class="btn elder-btn pending-btn">
            <jd-icon name="clock" :size="26" color="#0F7B4F" />
            <text>已提交，等家人确认</text>
          </view>
          <button
            v-else
            class="btn elder-btn"
            :class="task.id === firstOpenId ? 'btn-primary' : 'btn-ghost'"
            @tap="finish(task)"
          >
            {{ task.id === firstOpenId ? '按一下，我做完了' : '还没到时间' }}
          </button>
        </view>

        <view v-if="!loading && !tasks.length" class="card mt12 tc">
          <view class="t26 b">今天没有安排</view>
          <view class="t17 c3 mt8">可以歇一会儿</view>
        </view>

        <view class="row g8 mt12">
          <button class="btn btn-ghost elder-small" @tap="talk">
            <jd-icon name="mic" :size="28" color="#171210" />
            <text>说话</text>
          </button>
          <button class="btn btn-ghost elder-small" @tap="bigger = !bigger">
            <jd-icon name="sun" :size="28" color="#171210" />
            <text>{{ bigger ? '字已更大' : '字更大' }}</text>
          </button>
        </view>
      </view>

      <view class="t12 c2 sb mt20 mb8">与标准版差异</view>
      <view class="table">
        <view class="tr head">
          <text class="td">项</text>
          <text class="td">标准</text>
          <text class="td">关怀版</text>
        </view>
        <view v-for="row in compare" :key="row[0]" class="tr">
          <text class="td">{{ row[0] }}</text>
          <text class="td">{{ row[1] }}</text>
          <text class="td">{{ row[2] }}</text>
        </view>
      </view>

      <view class="disc mt14">
        关怀版不是「老年模式」的降级，而是把同一件事说得更清楚：一屏一件事，一次一个字。
      </view>

      <button class="btn btn-ghost mt14" @tap="backToStandard">回到标准版</button>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import JdNav from '@/components/JdNav.vue'
import JdIcon from '@/components/JdIcon.vue'
import { homeApi, taskApi, settingApi } from '@/api'
import { useSession, patchSession } from '@/store/session'

const session = useSession()
const tasks = ref([])
const loading = ref(true)
const bigger = ref(false)
const firstOpenId = computed(() => {
  const open = tasks.value.find((t) => !['done', 'pending_confirm'].includes(t.status))
  return open ? open.id : 0
})
const compare = [
  ['正文', '15sp', '24–26sp'],
  ['主按钮高', '48', '120'],
  ['一屏卡片', '2–3 张', '1 张'],
  ['导航', '5 tab', '无 tab，单页流'],
  ['动效', '有', '关闭非必要动效']
]

onMounted(load)

async function load() {
  try {
    const res = await homeApi.overview()
    tasks.value = res.todayTasks.filter((t) => t.status !== 'cancelled' && t.status !== 'skipped')
  } catch (e) {
    /* ignore */
  } finally {
    loading.value = false
  }
}

function periodOf(time) {
  const h = Number((time || '00:00').slice(0, 2))
  if (h < 12) return '上午'
  if (h < 18) return '下午'
  return '晚上'
}

function isNow(task) {
  return task.id === firstOpenId.value
}

async function finish(task) {
  if (!isNow(task)) {
    uni.showToast({ title: '这一件还没到时间，到点再按', icon: 'none' })
    return
  }
  try {
    await taskApi.start(task.id)
    const res = await taskApi.complete(task.id, { note: '长辈一键确认 · 无凭证（长辈端豁免）', attachments: [] })
    uni.showToast({ title: res.msg || '记下了，家人都能看到', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

function talk() {
  uni.showToast({ title: '正在录音…（演示）', icon: 'none' })
}

async function backToStandard() {
  try {
    await settingApi.preferences({ careMode: 'standard' })
    patchSession({ preferences: { ...(session.preferences || {}), careMode: 'standard' } })
  } catch (e) {
    return
  }
  if (session.member && session.member.role === 'elder') {
    uni.reLaunch({ url: '/pages/home/home' })
  } else {
    uni.reLaunch({ url: '/pages/settings/settings' })
  }
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.elder-page {
  background: #fbf7f2;
}

.elder-tip {
  background: #fff1e6;
  border-color: #fbd5b8;
}

.elder-card {
  border: 2px solid #efd8c2;
  border-radius: 22px;
  padding: 18px;
}

.big-tag {
  font-size: 13px;
  padding: 3px 8px;
}

.elder-title {
  line-height: 36px;
}

.elder-btn {
  height: 120px;
  border-radius: 22px;
  font-size: 30px;
  margin-top: 14px;
  min-height: 120px;
}

.elder-small {
  height: 88px;
  border-radius: 20px;
  font-size: 24px;
  flex: 1;
  min-height: 88px;
}

.done-btn {
  opacity: 1;
  background: #0f7b4f;
  color: #ffffff;
}

.pending-btn {
  background: #e6f5ed;
  border: 2px solid #cde9db;
  color: #0f7b4f;
}

.xl .elder-title {
  font-size: 32px;
  line-height: 42px;
}

.table {
  background: #ffffff;
  border: 1px solid #e7ded4;
  border-radius: 12px;
  overflow: hidden;
}

.tr {
  display: flex;
  border-bottom: 1px solid #f2ebe2;
}

.tr:last-child {
  border-bottom: 0;
}

.tr.head {
  background: #f6f1ea;
}

.td {
  flex: 1;
  padding: 10px 12px;
  font-size: 12px;
  color: #574c42;
}

.td:first-child {
  font-weight: 600;
  color: #171210;
}
</style>
