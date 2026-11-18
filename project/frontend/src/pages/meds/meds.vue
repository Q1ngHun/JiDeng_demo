<template>
  <view class="jd-page">
    <jd-nav title="用药清单" back action="＋" @action="openAdd" />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="card flat tight notice-card mt6">
        <text class="t11" style="color: #6b5b3e; line-height: 18px">{{ data ? data.notice : '' }}</text>
      </view>

      <view v-if="data">
        <view
          v-for="med in data.medications"
          :key="med.id"
          class="card mt12"
          :class="{ stopped: med.status === 'stopped' }"
        >
          <view class="between">
            <text class="t15 sb">{{ med.name }}</text>
            <view :class="['tag', med.needBuy ? 'brand' : '']">
              {{ med.status === 'stopped' ? '已停用' : '剩 ' + med.remainingDays + ' 天' }}
            </view>
          </view>
          <view class="t12 c3 mt6">{{ med.dosage }} · {{ med.frequency }} · {{ med.timing }}</view>

          <template v-if="med.status === 'active'">
            <view class="bar mt10" :class="{ ok: !med.needBuy }">
              <i :style="{ width: Math.max(2, med.percent) + '%' }" />
            </view>
            <view class="between mt8">
              <text class="t11 c3">{{ med.startDate }} 开始 · 剩 {{ med.remainingQty }} 片</text>
              <view class="row g10">
                <text v-if="med.needBuy" class="t11 cbrand sb" @tap="refill(med)">该买药了 ›</text>
                <text v-else class="t11 c3">无需处理</text>
                <text class="t11 cbrand" @tap="take(med)">打卡</text>
              </view>
            </view>
          </template>
          <view v-else class="t11 c3 mt8">
            {{ med.startDate }} 开始 · {{ med.endDate }} 停用 · 记录保留
          </view>
        </view>

        <view class="sec">
          <view class="h">复诊周期</view>
          <text class="more" @tap="openFollowUp">调整</text>
        </view>

        <view v-for="fu in data.followUps" :key="fu.id" class="card tight">
          <view class="between">
            <text class="t13 sb">{{ fu.title }}</text>
            <text class="t12 c3">{{ fu.cycleLabel }}</text>
          </view>
          <view class="t11 c3 mt6">
            上次 {{ fu.lastDate }} · 下次 {{ fu.nextDate }} · {{ fu.note }}
          </view>
          <button class="btn btn-2nd btn-sm mt10" style="width: auto" @tap="generateFollowUpTask(fu)">
            生成复诊任务
          </button>
        </view>

        <view class="disc mt14">
          <text class="b">关于自动生成：</text>
          {{ data.followUpNotice }}
        </view>
      </view>
    </scroll-view>

    <!-- 添加用药 -->
    <u-popup v-model:show="showAdd" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <scroll-view scroll-y class="pop-scroll">
        <view class="pop">
          <view class="pop-title">添加用药</view>
          <view class="t11 c3 mb10">只记录「吃什么、怎么吃、还剩多少」。</view>
          <view class="field mt8">
            <view class="lab">药品名</view>
            <input v-model="form.name" class="input" placeholder="例如：苯磺酸氨氯地平" placeholder-class="ph" />
          </view>
          <view class="row g8 mt8">
            <view class="field f1">
              <view class="lab">剂量</view>
              <input v-model="form.dosage" class="input" placeholder="5mg" placeholder-class="ph" />
            </view>
            <view class="field f1">
              <view class="lab">频次</view>
              <input v-model="form.frequency" class="input" placeholder="每日 1 次" placeholder-class="ph" />
            </view>
          </view>
          <view class="row g8 mt8">
            <view class="field f1">
              <view class="lab">服用时间</view>
              <input v-model="form.timing" class="input" placeholder="早饭后" placeholder-class="ph" />
            </view>
            <view class="field f1">
              <view class="lab">剩余天数</view>
              <input v-model="form.remainingDays" class="input num" type="number" placeholder="30" placeholder-class="ph" />
            </view>
          </view>
          <button class="btn btn-primary mt14" @tap="saveMed">保存</button>
        </view>
      </scroll-view>
    </u-popup>

    <!-- 调整复诊周期 -->
    <u-popup v-model:show="showFollowUp" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">调整复诊周期</view>
        <view class="field mt10">
          <view class="lab">复查项目</view>
          <input v-model="fuForm.title" class="input" placeholder="心内科复查" placeholder-class="ph" />
        </view>
        <view class="field mt8">
          <view class="lab">周期（天）</view>
          <input v-model="fuForm.cycleDays" class="input num" type="number" placeholder="90" placeholder-class="ph" />
        </view>
        <view class="row g8 mt8">
          <picker mode="date" :value="fuForm.lastDate" class="f1" @change="(e) => (fuForm.lastDate = e.detail.value)">
            <view class="field">
              <view class="lab">上次复查</view>
              <view class="val num">{{ fuForm.lastDate }}</view>
            </view>
          </picker>
          <picker mode="date" :value="fuForm.nextDate" class="f1" @change="(e) => (fuForm.nextDate = e.detail.value)">
            <view class="field">
              <view class="lab">下次复查</view>
              <view class="val num">{{ fuForm.nextDate }}</view>
            </view>
          </picker>
        </view>
        <button class="btn btn-primary mt14" @tap="saveFollowUp">保存</button>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import JdNav from '@/components/JdNav.vue'
import { medApi } from '@/api'
import { useSession } from '@/store/session'

const session = useSession()
const data = ref(null)
const elderIdParam = ref(0)
const showAdd = ref(false)
const showFollowUp = ref(false)
const takingId = ref(0)
const refillingId = ref(0)
const form = ref({ name: '', dosage: '', frequency: '每日 1 次', timing: '早饭后', remainingDays: '30' })
const fuForm = ref({ id: 0, title: '', cycleDays: 90, lastDate: '', nextDate: '' })

const elderId = computed(() => elderIdParam.value || (session.elder ? session.elder.id : 1))
const isOwner = computed(() => Boolean(session.member && session.member.role === 'owner'))

onLoad((query) => {
  elderIdParam.value = Number(query.elderId || 0)
})

onMounted(load)
onShow(() => {
  if (session.token) load()
})

async function load() {
  try {
    data.value = await medApi.list(elderId.value)
  } catch (e) {
    /* ignore */
  }
}

function openAdd() {
  form.value = { name: '', dosage: '', frequency: '每日 1 次', timing: '早饭后', remainingDays: '30' }
  showAdd.value = true
}

async function saveMed() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请填写药品名', icon: 'none' })
    return
  }
  try {
    const remaining = Math.max(1, Number(form.value.remainingDays || 30))
    await medApi.create(elderId.value, {
      name: form.value.name.trim(),
      dosage: form.value.dosage,
      frequency: form.value.frequency,
      timing: form.value.timing,
      totalDays: Math.max(30, remaining),
      remainingDays: remaining,
      remainingQty: remaining
    })
    showAdd.value = false
    uni.showToast({ title: '已添加', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

async function take(med) {
  if (takingId.value) return
  takingId.value = med.id
  try {
    const res = await medApi.take(med.id)
    // 提示语以服务端为准（是否快用完由后端按剩余量判断）
    uni.showToast({ title: res.msg || '已打卡', icon: 'none' })
    await load()
  } catch (e) {
    /* ignore */
  } finally {
    takingId.value = 0
  }
}

async function refill(med) {
  if (refillingId.value) return
  refillingId.value = med.id
  try {
    const res = await medApi.refill(med.id)
    uni.showToast({ title: res.msg || '已生成「该买药了」任务', icon: 'none' })
  } catch (e) {
    /* ignore */
  } finally {
    refillingId.value = 0
  }
}

function openFollowUp() {
  if (!isOwner.value) {
    uni.showToast({ title: '复诊周期需主理子女调整', icon: 'none' })
    return
  }
  const fu = data.value && data.value.followUps[0]
  if (fu) {
    fuForm.value = { id: fu.id, title: fu.title, cycleDays: fu.cycleDays, lastDate: fu.lastDate, nextDate: fu.nextDate }
  } else {
    fuForm.value = { id: 0, title: '心内科复查', cycleDays: 90, lastDate: '', nextDate: '' }
  }
  showFollowUp.value = true
}

async function saveFollowUp() {
  if (!isOwner.value) {
    uni.showToast({ title: '复诊周期需主理子女确认', icon: 'none' })
    return
  }
  try {
    const payload = {
      title: fuForm.value.title,
      cycleDays: Number(fuForm.value.cycleDays),
      lastDate: fuForm.value.lastDate,
      nextDate: fuForm.value.nextDate
    }
    const res = fuForm.value.id
      ? await medApi.updateFollowUp(fuForm.value.id, payload)
      : await medApi.createFollowUp(elderId.value, payload)
    showFollowUp.value = false
    uni.showToast({ title: res.msg || '已保存', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

async function generateFollowUpTask(fu) {
  if (!isOwner.value) {
    uni.showToast({ title: '复诊任务需主理子女生成', icon: 'none' })
    return
  }
  try {
    const res = await medApi.generateFollowUpTask(fu.id)
    uni.showToast({ title: res.msg || '已生成待确认的复诊任务', icon: 'none' })
  } catch (e) {
    /* ignore */
  }
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.notice-card {
  background: #fffdf7;
  border-color: #f0e3c8;
}

.stopped {
  opacity: 0.85;
}

.pop {
  padding: 16px 18px 26px;
}

.pop-scroll {
  max-height: 74vh;
}

.pop-title {
  font-size: 17px;
  font-weight: 600;
}

.input {
  font-size: 15px;
  min-height: 24px;
}

:deep(.ph) {
  color: #a99d91;
}
</style>
