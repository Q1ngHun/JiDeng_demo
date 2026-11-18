<template>
  <view class="jd-page">
    <jd-nav title="档案" action="编辑" @action="openEdit" />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <template v-if="detail">
      <view class="card hero mt6">
        <view class="row g12">
          <jd-avatar :text="detail.elder.name.slice(0, 1)" color="dad" size="lg" />
          <view class="f1">
            <text class="t17 b">{{ detail.elder.name }}</text>
            <view class="t12 c2 mt4">
              {{ detail.elder.age ? detail.elder.age + ' 岁' : '' }} · {{ detail.elder.conditions || '档案待补充' }}
            </view>
          </view>
          <view class="tag">完整度 {{ detail.elder.completeness }}%</view>
        </view>
        <view class="row g8 mt12 wrap">
          <view class="tag">{{ detail.badges.nextCheckupLabel }}</view>
          <view class="tag">用药 {{ detail.badges.medCount }} 种</view>
          <view class="tag brand">已授权 {{ detail.badges.authorizedCount }} 人</view>
        </view>
      </view>

      <view class="row g8 mt12">
        <view class="btn btn-ghost grid-btn" @tap="go('/pages/meds/meds')">
          <jd-icon name="clock" :size="18" color="#171210" />
          <text class="t11">用药清单</text>
        </view>
        <view class="btn btn-ghost grid-btn" @tap="go('/pages/report/report')">
          <jd-icon name="doc" :size="18" color="#171210" />
          <text class="t11">化验单</text>
        </view>
        <view class="btn btn-ghost grid-btn" @tap="openFollowUp">
          <jd-icon name="cal" :size="18" color="#171210" />
          <text class="t11">复诊周期</text>
        </view>
      </view>

      <view class="t12 c2 sb mt18 mb8">基础信息</view>
      <view class="list">
        <view v-for="f in detail.fields" :key="f.key" class="li" @tap="openEdit">
          <text class="lb">{{ f.label }}</text>
          <text class="vl el" :class="{ cbad: f.danger }">{{ f.value || '未填写' }}</text>
          <text class="chev">›</text>
        </view>
      </view>

      <view class="t12 c2 sb mt18 mb8">谁看过这份档案</view>
      <view class="list">
        <view v-for="log in detail.accessLogs" :key="log.id" class="li">
          <jd-avatar :text="log.avatarText" :color="avatarColor(log.viewerTag)" size="sm" />
          <view class="f1">
            <text class="lb">{{ log.viewerName }}</text>
            <view class="t11 c3 mt4">
              {{ log.timeLabel }} · {{ log.action === 'export' ? '导出 ' : '' }}{{ log.scope }}
            </view>
          </view>
          <view class="tag">{{ log.viewerTag }}</view>
        </view>
        <view v-if="!detail.accessLogs.length" class="li">
          <text class="t12 c3">还没有人查看过这份档案。</text>
        </view>
      </view>

      <view class="card flat mt12 notice">
        <text class="t11 c2" style="line-height: 18px">{{ detail.notice }}</text>
      </view>
      </template>
    </scroll-view>

    <jd-tabbar active="profile" />

    <!-- 编辑档案 -->
    <u-popup v-model:show="showEdit" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <scroll-view scroll-y class="edit-pop">
        <view class="pop">
          <view class="pop-title">编辑档案</view>
          <view class="t11 c3 mb10">档案默认仅你与长辈本人可见。</view>
          <view v-for="item in editFields" :key="item.key" class="field mt8">
            <view class="lab">{{ item.label }}</view>
            <input v-model="editForm[item.key]" class="input" :placeholder="item.placeholder" placeholder-class="ph" />
          </view>
          <button class="btn btn-primary mt14" :disabled="saving" @tap="saveEdit">保存</button>
        </view>
      </scroll-view>
    </u-popup>

    <!-- 复诊周期 -->
    <u-popup v-model:show="showFollowUp" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">复诊周期</view>
        <view v-if="followUp" class="list mt10">
          <view class="li">
            <text class="lb">复查项目</text>
            <text class="vl">{{ followUp.title }}</text>
          </view>
          <view class="li">
            <text class="lb">周期</text>
            <text class="vl">{{ followUp.cycleLabel }}</text>
          </view>
          <view class="li">
            <text class="lb">上次</text>
            <text class="vl num">{{ followUp.lastDate }}</text>
          </view>
          <view class="li">
            <text class="lb">下次</text>
            <text class="vl num">{{ followUp.nextDate }}</text>
          </view>
        </view>
        <view class="disc mt12">复诊任务生成后会先「待你确认」，避免误排让长辈白跑一趟。</view>
        <button class="btn btn-primary mt14" @tap="generateFollowUpTask">生成复诊任务</button>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import JdNav from '@/components/JdNav.vue'
import JdTabbar from '@/components/JdTabbar.vue'
import JdAvatar from '@/components/JdAvatar.vue'
import JdIcon from '@/components/JdIcon.vue'
import { elderApi, medApi } from '@/api'
import { useSession } from '@/store/session'

const session = useSession()
const detail = ref(null)
const showEdit = ref(false)
const showFollowUp = ref(false)
const saving = ref(false)
const editForm = ref({})
const accessRecorded = ref(false)
const elderId = computed(() => (detail.value ? detail.value.elder.id : session.elder ? session.elder.id : 1))
const followUp = computed(() => (detail.value && detail.value.followUps.length ? detail.value.followUps[0] : null))

const editFields = [
  { key: 'name', label: '姓名', placeholder: '王建国' },
  { key: 'birthday', label: '生日', placeholder: '1958-03-12' },
  { key: 'conditions', label: '既往史', placeholder: '高血压、轻度脂肪肝' },
  { key: 'allergies', label: '过敏史', placeholder: '青霉素' },
  { key: 'hospital', label: '常去医院', placeholder: '市一院' },
  { key: 'doctor', label: '医生', placeholder: '王志远' },
  { key: 'height', label: '身高', placeholder: '172cm' },
  { key: 'weight', label: '体重', placeholder: '68kg' },
  { key: 'bloodType', label: '血型', placeholder: 'AB' }
]

onMounted(load)
onShow(() => {
  if (session.token) load()
})

async function load() {
  try {
    const res = await elderApi.detail(elderId.value || 1)
    detail.value = res
    // onMounted 与 onShow 可能同时触发；先置位再请求，避免同一次进入写两条访问记录
    if (res && res.elder && !accessRecorded.value) {
      accessRecorded.value = true
      await elderApi.recordAccess(res.elder.id, { scope: '查看档案', action: 'view' })
    }
  } catch (e) {
    /* ignore */
  }
}

function avatarColor(tag) {
  if (tag === '本人') return 'dad'
  if (tag === '导出') return 'owner'
  return 'sis'
}

function openEdit() {
  if (!detail.value) return
  if (!(session.member && session.member.role === 'owner')) {
    uni.showToast({ title: '仅主理子女可编辑档案', icon: 'none' })
    return
  }
  const e = detail.value.elder
  editForm.value = {
    name: e.name,
    birthday: e.birthday,
    conditions: e.conditions,
    allergies: e.allergies,
    hospital: e.hospital,
    doctor: e.doctor,
    height: e.height,
    weight: e.weight,
    bloodType: e.bloodType
  }
  showEdit.value = true
}

async function saveEdit() {
  if (saving.value) return
  saving.value = true
  try {
    await elderApi.update(elderId.value, editForm.value)
    showEdit.value = false
    uni.showToast({ title: '已保存', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  } finally {
    saving.value = false
  }
}

function openFollowUp() {
  if (!followUp.value) {
    uni.showToast({ title: '还没有设置复诊周期', icon: 'none' })
    return
  }
  showFollowUp.value = true
}

async function generateFollowUpTask() {
  if (!followUp.value) return
  if (!(session.member && session.member.role === 'owner')) {
    uni.showToast({ title: '复诊任务需主理子女生成', icon: 'none' })
    return
  }
  try {
    const res = await medApi.generateFollowUpTask(followUp.value.id)
    showFollowUp.value = false
    uni.showToast({ title: res.msg || '已生成待确认的复诊任务', icon: 'none' })
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

.grid-btn {
  height: 56px;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  flex: 1;
  min-height: 56px;
  padding: 0;
}

.notice {
  background: #fbf7f2;
  border-color: #e7ded4;
}

.edit-pop {
  max-height: 76vh;
}

.pop {
  padding: 16px 18px 26px;
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
