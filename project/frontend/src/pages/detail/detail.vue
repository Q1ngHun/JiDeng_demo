<template>
  <view class="jd-page">
    <jd-nav title="任务详情" back action="···" @action="openMore" />

    <scroll-view v-if="task" class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="row g6 mt6">
        <jd-status :label="task.statusLabel" :tone="task.tone" />
        <view class="tag">{{ task.category }}</view>
        <text class="t11 c3">创建 {{ createdLabel }}</text>
      </view>

      <text class="t20 b mt10 title">{{ task.title }}</text>

      <view class="card tight mt12">
        <view class="row g12 info-row">
          <text class="t12 c3 info-label">时间</text>
          <text class="t13 sb num">{{ prettyTime }}</text>
        </view>
        <view class="row g12 info-row">
          <text class="t12 c3 info-label">谁去</text>
          <view v-if="task.assignee" class="row g6">
            <jd-avatar :text="task.assignee.avatarText" :color="task.assignee.avatarColor" size="sm" />
            <text class="t13">{{ task.assignee.name }}</text>
          </view>
          <text v-else class="t13 c2">待认领 · 已发到家庭组</text>
        </view>
        <view class="row g12 info-row">
          <text class="t12 c3 info-label">状态</text>
          <text class="t13 c2">{{ stateText }}</text>
        </view>
        <view v-if="task.location" class="row g12 info-row">
          <text class="t12 c3 info-label">地点</text>
          <text class="t13 c2">{{ task.location }}</text>
        </view>
      </view>

      <!-- 倒计时 + 超时兜底 -->
      <view v-if="isActive" class="card flat tight mt8 countdown">
        <view class="between">
          <text class="t12 sb cbrand">截止 {{ dueClock }} 前完成</text>
          <text class="t12 c2 num">{{ task.remaining }}</text>
        </view>
        <view class="bar mt8" :class="{ danger: task.progress <= 50 }">
          <i :style="{ width: Math.max(2, task.progress) + '%' }" />
        </view>
        <view class="t11 c3 mt8" style="line-height: 17px">{{ task.reminderPlan }}</view>
      </view>

      <view class="t12 c2 sb mt16 mb8">进度</view>
      <view class="tl">
        <view v-for="e in task.events" :key="e.id" class="tl-i" :class="e.tone">
          <view class="between">
            <text class="t13 sb">{{ e.title }}</text>
            <text class="t11 c3 num">{{ e.relative }}</text>
          </view>
          <view v-if="e.note" class="t11 c3 mt4">{{ e.note }}</view>
        </view>
        <view v-if="isActive" class="tl-i on">
          <view class="between">
            <text class="t13 sb">{{ nextStepLabel }}</text>
            <text class="t11 c3">等待中</text>
          </view>
        </view>
      </view>

      <view class="t12 c2 sb mt14 mb8">凭证</view>
      <view class="row g8 wrap">
        <image
          v-for="att in task.attachments"
          :key="att.id"
          class="thumb"
          :src="assetUrl(att.url)"
          mode="aspectFill"
          @tap="previewImage(att.url)"
        />
        <view v-if="task.permissions.canUpload" class="thumb add" @tap="chooseEvidence">
          <jd-icon name="plus" :size="18" color="#A99D91" />
        </view>
        <view v-if="!task.attachments.length && !task.permissions.canUpload" class="t11 c3">
          暂无凭证（长辈端豁免）
        </view>
      </view>

      <view v-if="task.description" class="card flat tight mt12">
        <view class="t11 c3">备注</view>
        <view class="t13 c2 mt4">{{ task.description }}</view>
      </view>

      <view class="disc mt14">
        凭证只读展示，上传由责任人完成，主理不能代传——这样记录才可信。
      </view>
    </scroll-view>

    <view v-if="task" class="actionbar">
      <button v-if="task.permissions.canReassign" class="btn btn-ghost flex-btn" @tap="showReassign = true">改派</button>
      <button v-if="task.permissions.canRemind" class="btn btn-sunk flex-btn" @tap="remind">提醒</button>
      <button class="btn btn-primary flex-primary" @tap="primaryTap">{{ primaryLabel }}</button>
    </view>

    <!-- 改派 -->
    <u-popup v-model:show="showReassign" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">改派给谁</view>
        <view class="t11 c3 mb10">改派会通知新责任人，并写进照护流水。</view>
        <view class="list">
          <view v-for="m in members" :key="m.userId" class="li" @tap="reassign(m)">
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

    <!-- 完成 -->
    <u-popup v-model:show="showComplete" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">完成并提交</view>
        <view class="field mt8">
          <view class="lab">说明（可选）</view>
          <textarea v-model="completeNote" class="textarea" placeholder="例如：血压 138/86，已记录" placeholder-class="ph" />
        </view>
        <view class="row g8 mt10">
          <view v-for="(img, i) in completeImages" :key="i" class="thumb" @tap="previewLocal(img)">
            <image :src="img" mode="aspectFill" class="thumb-img" />
          </view>
          <view class="thumb add" @tap="chooseCompleteImage">
            <jd-icon name="plus" :size="18" color="#A99D91" />
          </view>
        </view>
        <button class="btn btn-primary mt14" :disabled="submitting" @tap="complete">提交完成</button>
      </view>
    </u-popup>

    <!-- 取消 / 有疑问 -->
    <u-popup v-model:show="showReason" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">{{ reasonMode === 'cancel' ? '取消并说明' : '有什么疑问' }}</view>
        <view class="t11 c3 mb10">
          {{ reasonMode === 'cancel' ? '取消不会删除记录，原因会留在流水里。' : '疑问会通知创建人，记录同样保留。' }}
        </view>
        <view class="field">
          <textarea v-model="reason" class="textarea" placeholder="写一句原因，让对方知道发生了什么" placeholder-class="ph" />
        </view>
        <button class="btn btn-primary mt14" @tap="submitReason">提交</button>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import JdNav from '@/components/JdNav.vue'
import JdStatus from '@/components/JdStatus.vue'
import JdAvatar from '@/components/JdAvatar.vue'
import JdIcon from '@/components/JdIcon.vue'
import { taskApi } from '@/api'
import { assetUrl, upload } from '@/api/request'
import { useSession } from '@/store/session'

const session = useSession()
const taskId = ref(0)
const task = ref(null)
const members = ref([])
const showReassign = ref(false)
const showComplete = ref(false)
const showReason = ref(false)
const reasonMode = ref('cancel')
const reason = ref('')
const completeNote = ref('')
const completeImages = ref([])
const submitting = ref(false)

const ACTIVE = ['pending_claim', 'claimed', 'in_progress', 'pending_confirm', 'overdue', 'question']

const isActive = computed(() => task.value && ACTIVE.includes(task.value.status))
const dueClock = computed(() => (task.value && task.value.dueAt ? task.value.dueAt.slice(11, 16) : ''))

const prettyTime = computed(() => {
  if (!task.value) return ''
  return `${task.value.dayLabel} ${task.value.time}`
})

const createdLabel = computed(() => {
  if (!task.value || !task.value.createdAt) return ''
  const d = new Date(task.value.createdAt.replace('T', ' ').replace(/-/g, '/'))
  const now = new Date()
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.max(0, Math.round((n0 - d0) / 86400000))
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  return `${diff} 天前`
})

const stateText = computed(() => {
  if (!task.value) return ''
  const last = [...(task.value.events || [])].reverse().find((e) => e.action !== 'create')
  if (!last) return '等待认领'
  return `${last.note || last.title} · ${last.relative}`
})

const nextStepLabel = computed(() => {
  if (!task.value) return ''
  const map = {
    pending_claim: '等待有人认领',
    claimed: '等待开始',
    in_progress: '完成并上传凭证',
    pending_confirm: '等我确认',
    question: '等待回复疑问',
    overdue: '等待补救：改派或取消'
  }
  return map[task.value.status] || '等待中'
})

const primaryLabel = computed(() => {
  if (!task.value) return ''
  const p = task.value.permissions
  if (task.value.status === 'pending_confirm' && p.canConfirm) return '确认完成'
  if (task.value.status === 'in_progress' && p.canComplete) return '我已完成'
  if ((task.value.status === 'claimed' || task.value.status === 'overdue') && p.canStart) return '开始'
  if (p.canClaim) return '认领'
  return '看流水'
})

onLoad((query) => {
  taskId.value = Number(query.id || 0)
})

onMounted(async () => {
  await load()
  try {
    const meta = await taskApi.meta()
    members.value = meta.members
  } catch (e) {
    /* ignore */
  }
})

onShow(() => {
  if (taskId.value && session.token) load()
})

async function load() {
  try {
    task.value = await taskApi.detail(taskId.value)
  } catch (e) {
    /* ignore */
  }
}

function primaryTap() {
  if (!task.value) return
  const status = task.value.status
  const p = task.value.permissions || {}
  // 以服务端 permissions 为准：不满足条件时退回流水，避免点了才报 403
  if (status === 'pending_confirm' && p.canConfirm) return confirm()
  if (status === 'in_progress' && p.canComplete) return openComplete()
  if ((status === 'claimed' || status === 'overdue') && p.canStart) return start()
  if (p.canClaim) return claim()
  uni.navigateTo({ url: '/pages/timeline/timeline' })
}

async function claim() {
  try {
    await taskApi.claim(taskId.value)
    uni.showToast({ title: '已认领，记得去做', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

async function start() {
  try {
    await taskApi.start(taskId.value)
    uni.showToast({ title: '已开始，安心去做', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

function openComplete() {
  completeNote.value = ''
  completeImages.value = []
  showComplete.value = true
}

async function complete() {
  if (submitting.value) return
  submitting.value = true
  try {
    const uploaded = []
    for (const img of completeImages.value) {
      const url = await uploadEvidence(img)
      if (url) uploaded.push({ kind: 'image', url })
    }
    if (completeImages.value.length && uploaded.length !== completeImages.value.length) {
      uni.showToast({ title: '凭证上传失败，请重试', icon: 'none' })
      return
    }
    // 后端会按 URL 去重，上传过的凭证不会重复入库
    const res = await taskApi.complete(taskId.value, {
      note: completeNote.value || '已完成',
      attachments: uploaded
    })
    showComplete.value = false
    uni.showToast({ title: res.msg || '已提交，等待确认', icon: 'none' })
    load()
  } catch (e) {
    /* 错误已由 request 统一提示 */
  } finally {
    submitting.value = false
  }
}

async function confirm() {
  try {
    const res = await taskApi.confirm(taskId.value, { note: '主理已确认' })
    uni.showToast({ title: res.msg || '已确认完成', icon: 'none' })
    load()
  } catch (e) {
    /* 错误已由 request 统一提示 */
  }
}

async function remind() {
  try {
    await taskApi.remind(taskId.value)
    uni.showToast({ title: '已提醒责任人', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

async function reassign(member) {
  try {
    await taskApi.reassign(taskId.value, { assigneeId: member.userId, reason: `改派给${member.name}` })
    showReassign.value = false
    uni.showToast({ title: `已改派给${member.name}`, icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

function openMore() {
  const p = task.value ? task.value.permissions : {}
  const items = ['看照护流水']
  if (p.canCancel) items.push('取消并说明')
  if (p.canSkip) items.push('跳过本次')
  if (p.canAsk) items.push('对这件事有疑问')
  uni.showActionSheet({
    itemList: items,
    success: ({ tapIndex }) => {
      const label = items[tapIndex]
      if (label === '看照护流水') {
        uni.navigateTo({ url: '/pages/timeline/timeline' })
      } else if (label === '取消并说明') {
        reasonMode.value = 'cancel'
        reason.value = ''
        showReason.value = true
      } else if (label === '跳过本次') {
        skip()
      } else if (label === '对这件事有疑问') {
        reasonMode.value = 'question'
        reason.value = ''
        showReason.value = true
      }
    }
  })
}

async function skip() {
  try {
    await taskApi.skip(taskId.value, { note: '跳过本次（重复任务，不影响其它次）' })
    uni.showToast({ title: '已跳过本次', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

async function submitReason() {
  if (!reason.value.trim()) {
    uni.showToast({ title: '请写一句原因', icon: 'none' })
    return
  }
  try {
    if (reasonMode.value === 'cancel') {
      await taskApi.cancel(taskId.value, { reason: reason.value.trim() })
    } else {
      await taskApi.question(taskId.value, { note: reason.value.trim() })
    }
    showReason.value = false
    uni.showToast({ title: '已记录', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

function chooseCompleteImage() {
  uni.chooseImage({
    count: 3,
    success: (res) => {
      completeImages.value = completeImages.value.concat(res.tempFilePaths).slice(0, 3)
    }
  })
}

function chooseEvidence() {
  uni.chooseImage({
    count: 3,
    success: async (res) => {
      for (const path of res.tempFilePaths) {
        const url = await uploadEvidence(path)
        if (url) uni.showToast({ title: '凭证已上传', icon: 'none' })
      }
      load()
    }
  })
}

async function uploadEvidence(filePath) {
  try {
    const data = await upload({
      url: `/api/tasks/${taskId.value}/attachments`,
      filePath,
      formData: { kind: 'image' }
    })
    return data && data.url ? data.url : ''
  } catch (e) {
    return ''
  }
}

function previewImage(url) {
  uni.previewImage({ urls: [assetUrl(url)] })
}

function previewLocal(path) {
  uni.previewImage({ urls: [path] })
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.title {
  line-height: 29px;
}

.info-row {
  margin-bottom: 10px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 34px;
  flex: 0 0 auto;
}

.countdown {
  background: #fff7f0;
  border-color: #fbd5b8;
}

.countdown .bar {
  background: #ffe9d6;
}

.thumb {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(150deg, #ede3d7, #dacdbc);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb.add {
  background: #f6efe6;
}

.thumb-img {
  width: 100%;
  height: 100%;
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
  color: #171210;
}

.flex-btn {
  flex: 1;
  padding: 0 10px;
}

.flex-primary {
  flex: 1.2;
}

:deep(.ph) {
  color: #a99d91;
}
</style>
