<template>
  <view class="jd-page">
    <jd-nav title="导出记录" back />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="row g12 mt6">
        <view class="photo pdf-thumb">
          <view class="pdf-inner">
            <text class="t11">照护记录</text>
            <text class="t11 mt4">{{ pdfMonth }}</text>
            <view class="pdf-line" />
            <text class="t10">共 {{ preview ? preview.eventCount : 0 }} 条</text>
          </view>
        </view>
        <view class="f1">
          <text class="t15 sb">{{ familyName }} · {{ pdfMonth }}照护记录</text>
          <view class="t11 c3 mt6">
            {{ preview ? preview.eventCount : 0 }} 条事件 · {{ preview ? preview.evidenceCount : 0 }} 份凭证
          </view>
          <view class="row g6 mt10 wrap">
            <view class="tag">A4 竖版</view>
            <view class="tag">含时间轴</view>
            <view class="tag">脱敏可选</view>
          </view>
          <view class="t11 c3 mt10" style="line-height: 17px">
            给医生看时建议只保留「就诊与用药」相关记录。
          </view>
        </view>
      </view>

      <view class="t12 c2 sb mt20 mb8">导出范围</view>
      <view class="list">
        <view class="li" @tap="setScope('month')">
          <text class="lb">本月</text>
          <text v-if="scope === 'month'" class="st done ml-auto"><view class="dot" /><text>已选</text></text>
          <text v-else class="chev">›</text>
        </view>
        <view class="li" @tap="setScope('custom')">
          <text class="lb">自定义时间段</text>
          <view class="vl row g6">
            <picker mode="date" :value="start" @change="(e) => onRange('start', e)">
              <text class="num">{{ startLabel }}</text>
            </picker>
            <text>–</text>
            <picker mode="date" :value="end" @change="(e) => onRange('end', e)">
              <text class="num">{{ endLabel }}</text>
            </picker>
          </view>
          <text v-if="scope === 'custom'" class="st done ml6"><view class="dot" /><text>已选</text></text>
        </view>
        <view class="li">
          <view class="f1">
            <text class="lb">只看异常与超时</text>
            <view class="t11 c3 mt4">给医生解释「中间发生了什么」</view>
          </view>
          <jd-switch v-model="onlyAbnormal" @change="refreshPreview" />
        </view>
      </view>

      <view class="t12 c2 sb mt20 mb8">包含内容</view>
      <view class="list">
        <view class="li">
          <text class="lb">任务与完成时间</text>
          <jd-switch v-model="includeTasks" class="ml-auto" disabled />
        </view>
        <view class="li">
          <text class="lb">凭证照片</text>
          <jd-switch v-model="includeEvidence" class="ml-auto" @change="refreshPreview" />
        </view>
        <view class="li">
          <text class="lb">长辈档案摘要</text>
          <jd-switch v-model="includeProfile" class="ml-auto" @change="refreshPreview" />
        </view>
        <view class="li">
          <view class="f1">
            <text class="lb">隐藏家人姓名</text>
            <view class="t11 c3 mt4">给医生看时不必暴露家庭关系</view>
          </view>
          <jd-switch v-model="hideNames" class="ml-auto" @change="refreshPreview" />
        </view>
      </view>

      <view class="disc mt14">
        <text class="b">导出会留下记录。</text>
        文件带「仅用于就医沟通」水印，长辈可在「谁看过我的档案」里看到这次导出。
      </view>

      <view class="t11 c3 mt12">{{ quotaText }}</view>

      <view v-if="!canExport" class="card flat mt12 quota-card">
        <view class="f1">
          <view class="t13 sb">导出 PDF 是家庭会员权益</view>
          <view class="t11 c3 mt4">99 元 / 年，含 30 次导出与短信兜底提醒</view>
        </view>
        <button class="btn btn-2nd btn-sm" @tap="go('/pages/vip/vip')">去开通</button>
      </view>
    </scroll-view>

    <view class="actionbar">
      <button class="btn btn-primary" :disabled="generating || !canExport" @tap="generate">
        {{ generating ? '正在生成 PDF…' : '生成 PDF' }}
      </button>
    </view>

    <u-popup v-model:show="showResult" mode="center" round="18" width="300px">
      <view class="result">
        <view class="ok-icon">
          <jd-icon name="check" :size="26" color="#0F7B4F" />
        </view>
        <view class="t17 b mt10">PDF 已生成</view>
        <view class="t11 c3 mt6 tc" style="line-height: 18px">
          共 {{ result.eventCount }} 条事件 · 带「仅用于就医沟通」水印
        </view>
        <button class="btn btn-primary mt16" @tap="download">保存 / 打开 PDF</button>
        <button class="btn btn-ghost mt8" @tap="copyLink">复制下载链接</button>
        <button class="btn btn-sunk mt8" @tap="showResult = false">先不下载</button>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import JdNav from '@/components/JdNav.vue'
import JdSwitch from '@/components/JdSwitch.vue'
import JdIcon from '@/components/JdIcon.vue'
import { exportApi } from '@/api'
import { assetUrl } from '@/api/request'
import { useSession } from '@/store/session'

const session = useSession()
const pad = (n) => String(n).padStart(2, '0')
const now = new Date()
const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
const monthEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`

const scope = ref('month')
const start = ref(monthStart)
const end = ref(monthEnd)
const onlyAbnormal = ref(false)
const includeTasks = ref(true)
const includeEvidence = ref(true)
const includeProfile = ref(true)
const hideNames = ref(false)
const preview = ref(null)
const generating = ref(false)
const showResult = ref(false)
const result = ref(null)

const familyName = computed(() => (session.family ? session.family.name : '家'))
const pdfMonth = computed(() => (scope.value === 'month' ? `${now.getFullYear()}.${pad(now.getMonth() + 1)}` : `${start.value.slice(5)}`))
const startLabel = computed(() => start.value.slice(5).replace('-', '/'))
const endLabel = computed(() => end.value.slice(5).replace('-', '/'))
const canExport = computed(() => !preview.value || preview.value.canExport)
const quotaText = computed(() => {
  if (!preview.value) return ''
  const q = preview.value.quota.exports
  if (q.limit < 0) return '家庭会员权益 · 本月导出不限次'
  return `家庭会员权益 · 本月还可导出 ${q.left} 次`
})

onMounted(refreshPreview)

function setScope(value) {
  scope.value = value
  refreshPreview()
}

function onRange(key, e) {
  if (key === 'start') start.value = e.detail.value
  else end.value = e.detail.value
  scope.value = 'custom'
  refreshPreview()
}

let previewSeq = 0

async function refreshPreview() {
  const seq = ++previewSeq
  try {
    const res = await exportApi.preview({
      scope: scope.value,
      start: scope.value === 'custom' ? start.value : '',
      end: scope.value === 'custom' ? end.value : '',
      onlyAbnormal: onlyAbnormal.value
    })
    // 快速切换范围时，只保留最后一次请求的结果，避免旧数据盖回来
    if (seq === previewSeq) preview.value = res
  } catch (e) {
    /* ignore */
  }
}

async function generate() {
  if (generating.value) return
  generating.value = true
  uni.showLoading({ title: '正在生成 PDF…', mask: true })
  try {
    result.value = await exportApi.create({
      scope: scope.value,
      start: scope.value === 'custom' ? start.value : '',
      end: scope.value === 'custom' ? end.value : '',
      onlyAbnormal: onlyAbnormal.value,
      includeEvidence: includeEvidence.value,
      includeProfile: includeProfile.value,
      hideNames: hideNames.value
    })
    showResult.value = true
    refreshPreview()
  } catch (e) {
    /* ignore */
  } finally {
    uni.hideLoading()
    generating.value = false
  }
}

function fullUrl(url) {
  return assetUrl(url)
}

function download() {
  if (!result.value) return
  const url = fullUrl(result.value.url)
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifndef H5
  uni.downloadFile({
    url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({ filePath: res.tempFilePath, fileType: 'pdf', showMenu: true })
      }
    }
  })
  // #endif
}

function copyLink() {
  uni.setClipboardData({
    data: fullUrl(result.value.url),
    success: () => uni.showToast({ title: '链接已复制', icon: 'none' })
  })
}

function go(url) {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.pdf-thumb {
  width: 104px;
  height: 142px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-inner {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #6b6156;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pdf-line {
  width: 52px;
  height: 1px;
  background: #c9beb2;
  margin: 8px auto;
}

.li .lb {
  font-size: 15px;
}

.ml-auto {
  margin-left: auto;
}

.ml6 {
  margin-left: 6px;
}

.quota-card {
  display: flex;
  align-items: center;
  gap: 10px;
}

.result {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ok-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #e6f5ed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result .btn {
  width: 100%;
}
</style>
