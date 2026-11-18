<template>
  <view class="jd-page">
    <jd-nav title="派发任务" back action="模板" @action="showTemplates = true" />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="field focus">
        <view class="lab">做什么 <text class="req">*</text></view>
        <input
          v-model="form.title"
          class="input t16"
          placeholder="例如：陪爸爸去市一院心内科复查"
          placeholder-class="ph"
          maxlength="40"
        />
      </view>

      <view class="row g8 mt8">
        <picker mode="date" :value="form.date" class="f1" @change="onDate">
          <view class="field">
            <view class="lab">日期 <text class="req">*</text></view>
            <view class="val num">{{ dateLabel }} <text class="caret">▾</text></view>
          </view>
        </picker>
        <picker mode="time" :value="form.time" class="f1" @change="onTime">
          <view class="field">
            <view class="lab">时间 <text class="req">*</text></view>
            <view class="val num">{{ form.time }} <text class="caret">▾</text></view>
          </view>
        </picker>
      </view>

      <view class="row g6 mt8 wrap">
        <view
          v-for="opt in repeatOptions"
          :key="opt.key"
          class="chip"
          :class="{ on: form.repeatRule === opt.key }"
          @tap="form.repeatRule = opt.key"
        >
          {{ opt.label }}
        </view>
      </view>

      <view class="field mt12">
        <view class="lab">类型</view>
        <view class="row g6 mt8 wrap">
          <view
            v-for="c in categories"
            :key="c"
            class="chip"
            :class="{ on: form.category === c }"
            @tap="form.category = c"
          >
            {{ c }}
          </view>
        </view>
      </view>

      <view class="field mt12">
        <view class="lab">谁去 <text class="req">*</text></view>
        <view class="val">
          {{ assigneeLabel }}
          <text class="t11 c3 assignee-hint">{{ form.assigneeId ? '单独通知' : '发到家庭组' }}</text>
        </view>
      </view>
      <view class="row g6 mt8 wrap">
        <view
          v-for="m in members"
          :key="m.userId"
          class="chip member-chip"
          :class="{ on: form.assigneeId === m.userId }"
          @tap="form.assigneeId = m.userId"
        >
          <jd-avatar :text="m.avatarText" :color="m.avatarColor" size="xs" />
          <text>{{ shortName(m) }}</text>
        </view>
        <view class="chip" :class="{ on: form.assigneeId === null }" @tap="form.assigneeId = null">
          待认领
        </view>
      </view>

      <view class="list mt16">
        <view class="li" @tap="showLocation = true">
          <text class="lb">地点</text>
          <text class="vl el">{{ form.location || '未填写' }}</text>
          <text class="chev">›</text>
        </view>
        <view class="li">
          <text class="lb">关联档案项</text>
          <text class="vl">{{ elderName }} · {{ elderCondition }}</text>
        </view>
        <picker mode="selector" :range="remindOptions" :value="remindIndex" @change="onRemind">
          <view class="li">
            <text class="lb">提醒</text>
            <text class="vl">{{ form.remindLabel }}</text>
            <text class="chev">›</text>
          </view>
        </picker>
        <view class="li">
          <view class="f1">
            <text class="lb">标记为紧急</text>
            <view class="t11 c3 mt4">可穿透静默时段</view>
          </view>
          <jd-switch v-model="form.isUrgent" />
        </view>
        <view class="li">
          <view class="f1">
            <text class="lb">需要我确认</text>
            <view class="t11 c3 mt4">责任人提交后由主理确认</view>
          </view>
          <jd-switch v-model="form.needConfirm" />
        </view>
      </view>

      <view class="card flat mt12 notice">
        <text class="t11 c2" style="line-height: 18px">
          重复任务会生成独立实例，某一次可以单独跳过或改时间，不影响其它次。
        </text>
      </view>

      <view class="t11 c3 mt14" style="line-height: 18px">
        参考模板：复查带化验单 · 取药带医保卡 · 体检需空腹
      </view>
    </scroll-view>

    <view class="actionbar">
      <button class="btn btn-primary" :disabled="submitting" @tap="submit">
        {{ submitting ? '正在派发…' : '派发并通知' }}
      </button>
    </view>

    <!-- 模板 -->
    <u-popup v-model:show="showTemplates" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">任务模板</view>
        <view class="t11 c3 mb10">模板只是把常做的事填好，具体时间地点还可以改。</view>
        <view class="list">
          <view v-for="tpl in templates" :key="tpl.key" class="li" @tap="applyTemplate(tpl)">
            <view class="f1">
              <text class="lb">{{ tpl.title }}</text>
              <view class="t11 c3 mt4">{{ tpl.hint }} · {{ tpl.location }}</view>
            </view>
            <text class="chev">›</text>
          </view>
        </view>
      </view>
    </u-popup>

    <!-- 地点 -->
    <u-popup v-model:show="showLocation" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">地点</view>
        <view class="field mt10">
          <input v-model="locationDraft" class="input t15" placeholder="例如：市一院 3 号楼" placeholder-class="ph" />
        </view>
        <view class="row g6 mt10 wrap">
          <view v-for="loc in locationOptions" :key="loc" class="chip" @tap="pickLocation(loc)">{{ loc }}</view>
        </view>
        <button class="btn btn-primary mt14" @tap="saveLocation">确定</button>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import JdNav from '@/components/JdNav.vue'
import JdAvatar from '@/components/JdAvatar.vue'
import JdSwitch from '@/components/JdSwitch.vue'
import { taskApi } from '@/api'
import { useSession } from '@/store/session'

const session = useSession()
const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

const form = ref({
  title: '',
  date: todayStr,
  time: '09:00',
  category: '复查',
  repeatRule: 'none',
  assigneeId: null,
  location: '',
  remindLabel: '提前 1 天 20:00',
  isUrgent: false,
  needConfirm: true
})

const members = ref([])
const templates = ref([])
const categories = ref(['复查', '取药', '测量', '缴费', '用药', '其他'])
const repeatOptions = ref([{ key: 'none', label: '不重复' }])
const remindOptions = ref(['提前 1 天 20:00', '提前 2 小时', '到点提醒'])
const remindIndex = ref(0)
const elderName = ref('王建国')
const elderCondition = ref('高血压 · 复诊')
const showTemplates = ref(false)
const showLocation = ref(false)
const locationDraft = ref('')
const submitting = ref(false)
const locationOptions = ['市一院 3 号楼', '社区医院', '家里', '社区卫生服务中心']

const dateLabel = computed(() => {
  const d = new Date(form.value.date + 'T00:00:00')
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} 周${w}`
})

const assigneeLabel = computed(() => {
  if (form.value.assigneeId === null) return '待认领'
  const m = members.value.find((x) => x.userId === form.value.assigneeId)
  return m ? m.name : '待认领'
})

onLoad(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  form.value.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})

onMounted(async () => {
  try {
    const meta = await taskApi.meta()
    members.value = meta.members
    templates.value = meta.templates
    if (meta.categories && meta.categories.length) categories.value = meta.categories
    repeatOptions.value = meta.repeatOptions
    remindOptions.value = meta.remindOptions
    if (meta.elder) form.value.elderId = meta.elder.id
    if (meta.elder) {
      elderName.value = meta.elder.name
      elderCondition.value = (session.elder && session.elder.conditions) || '高血压 · 复诊'
    }
  } catch (e) {
    /* ignore */
  }
})

function onDate(e) {
  form.value.date = e.detail.value
}

function onTime(e) {
  form.value.time = e.detail.value
}

function onRemind(e) {
  remindIndex.value = Number(e.detail.value)
  form.value.remindLabel = remindOptions.value[remindIndex.value]
}

function shortName(m) {
  if (m.relation === '爸爸' || m.relation === '妈妈' || m.relation === '妹妹') return m.relation
  return m.name.slice(0, 1)
}

function applyTemplate(tpl) {
  form.value.title = tpl.title
  form.value.category = tpl.category
  form.value.location = tpl.location
  showTemplates.value = false
}

function pickLocation(loc) {
  locationDraft.value = loc
}

function saveLocation() {
  form.value.location = locationDraft.value
  showLocation.value = false
}

async function submit() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请先写清楚要做什么', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await taskApi.create({
      title: form.value.title.trim(),
      category: form.value.category,
      date: form.value.date,
      time: form.value.time,
      durationHours: 3,
      assigneeId: form.value.assigneeId,
      elderId: form.value.elderId || undefined,
      repeatRule: form.value.repeatRule,
      isUrgent: form.value.isUrgent,
      location: form.value.location,
      remindLabel: form.value.remindLabel,
      needConfirm: form.value.needConfirm
    })
    uni.showToast({ title: res.msg || '已派发并通知', icon: 'none' })
    const task = res.data || {}
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/detail/detail?id=${task.id}` })
    }, 500)
  } catch (e) {
    /* 错误已由 request 统一提示 */
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.input {
  font-size: 16px;
  font-weight: 500;
  min-height: 24px;
  color: #171210;
}

.caret {
  margin-left: auto;
  color: #a99d91;
  font-size: 12px;
}

.assignee-hint {
  margin-left: auto;
}

.member-chip {
  padding-left: 6px;
}

.notice {
  background: #f6efe6;
  border-color: #e7ded4;
}

.pop {
  padding: 16px 18px 26px;
}

.pop-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 4px;
}

:deep(.ph) {
  color: #a99d91;
  font-weight: 400;
}
</style>
