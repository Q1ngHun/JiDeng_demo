<template>
  <view class="jd-page">
    <jd-nav title="报告解读" back action="历史" @action="showHistory = true" />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="card capture mt6">
        <view class="photo-area" @tap="chooseImage">
          <view class="capture-inner">
            <text class="capture-icon">📄</text>
            <text class="t11 c3 mt4">{{ uploading ? '正在识别…' : '拍摄化验单' }}</text>
          </view>
        </view>
        <view class="row g8 capture-actions">
          <button class="btn btn-primary" style="height: 42px; flex: 1" @tap="chooseImage">
            <jd-icon name="camera" :size="16" color="#FFFFFF" />
            <text>拍照</text>
          </button>
          <button class="btn btn-ghost" style="height: 42px; flex: 1" @tap="chooseImage">相册</button>
        </view>
      </view>

      <view class="between mt12">
        <text class="t11 c3">本月 AI 解读额度</text>
        <text class="t11 c2">{{ quotaText }}</text>
      </view>

      <view class="t12 c2 sb mt16 mb8">最近解读</view>
      <view class="list">
        <view
          v-for="item in reports"
          :key="item.id"
          class="li"
          @tap="selectReport(item)"
        >
          <image
            v-if="item.imageUrl"
            class="photo mini"
            :src="assetUrl(item.imageUrl)"
            mode="aspectFill"
          />
          <view v-else class="photo mini" />
          <view class="f1">
            <text class="lb">{{ item.title }}</text>
            <view class="t11 c3 mt4">
              {{ item.dateLabel }} · {{ item.abnormalCount ? item.abnormalCount + ' 项异常' : '全部正常' }} · {{ item.statusLabel }}
            </view>
          </view>
          <view v-if="item.status === 'pending_ask'" class="st wait"><view class="dot" /><text>待问诊</text></view>
          <text v-else class="chev">›</text>
        </view>
        <view v-if="!reports.length" class="li">
          <text class="t12 c3">还没有解读记录，拍一张化验单试试。</text>
        </view>
      </view>

      <view v-if="current" class="card mt16">
        <view class="row between">
          <text class="t13 sb" :style="{ color: current.abnormalCount ? '#8A6A28' : '#0F7B4F' }">
            {{ current.abnormalCount ? current.abnormalCount + ' 项不在参考范围' : '全部指标在参考范围' }}
          </text>
          <text class="t11 c3">置信度 {{ current.confidence }}%</text>
        </view>

        <view class="row g6 mt10 wrap">
          <view
            v-for="ind in current.indicators"
            :key="ind.name"
            class="chip indicator"
            :class="ind.flag"
          >
            {{ ind.name }} {{ ind.value }}{{ ind.unit }} {{ flagText(ind.flag) }}
          </view>
        </view>

        <view class="hr" />
        <view class="t11 c3">这些指标通常和什么有关</view>
        <view class="t13 c2 mt6" style="line-height: 20px">{{ current.summaryMeaning }}</view>

        <view class="hr" />
        <view class="t11 c3">下次看病可以问医生</view>
        <view class="col g6 mt6">
          <text v-for="(q, i) in current.questions" :key="i" class="t13 c2">· {{ q }}</text>
        </view>
      </view>

      <view class="disc mt12">
        <text class="b">免责声明</text>
        <view class="mt4" style="line-height: 18px">{{ disclaimer }}</view>
      </view>

      <view class="t11 c3 mt12" style="line-height: 18px">{{ notice }}</view>
    </scroll-view>

    <view class="actionbar">
      <button class="btn btn-ghost" style="flex: 1" :disabled="!current" @tap="addToAskList">加入问诊清单</button>
      <button class="btn btn-primary" style="flex: 1.2" :disabled="!current" @tap="go('/pages/export/export')">导出给医生</button>
    </view>

    <!-- 选择报告类型后解读 -->
    <u-popup v-model:show="showAnalyze" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">这是哪份报告</view>
        <view class="t11 c3 mb10">选一个最接近的名称，识别会更准。</view>
        <view class="row g6 wrap">
          <view v-for="t in titles" :key="t" class="chip" :class="{ on: title === t }" @tap="title = t">{{ t }}</view>
        </view>
        <view class="field mt12">
          <view class="lab">报告名称</view>
          <input v-model="title" class="input" placeholder="血常规 + 生化 12 项" placeholder-class="ph" />
        </view>
        <button class="btn btn-primary mt14" :disabled="analyzing" @tap="analyze">
          {{ analyzing ? '正在识别…' : '开始解读' }}
        </button>
      </view>
    </u-popup>

    <!-- 历史 -->
    <u-popup v-model:show="showHistory" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">历史解读</view>
        <view class="list mt10">
          <view v-for="item in reports" :key="item.id" class="li" @tap="selectReport(item, true)">
            <view class="f1">
              <text class="lb">{{ item.title }}</text>
              <view class="t11 c3 mt4">{{ item.dateLabel }} · {{ item.abnormalCount }} 项异常</view>
            </view>
            <jd-avatar v-if="item.status === 'pending_ask'" text="问" color="owner" size="xs" />
          </view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import JdNav from '@/components/JdNav.vue'
import JdIcon from '@/components/JdIcon.vue'
import JdAvatar from '@/components/JdAvatar.vue'
import { reportApi } from '@/api'
import { assetUrl, upload } from '@/api/request'

const reports = ref([])
const current = ref(null)
const quota = ref(null)
const disclaimer = ref('')
const notice = ref('')
const showAnalyze = ref(false)
const showHistory = ref(false)
const analyzing = ref(false)
const uploading = ref(false)
const imageUrl = ref('')
const title = ref('血常规 + 生化 12 项')
const titles = ['血常规 + 生化 12 项', '尿常规', '肝功能', '肾功能', '血脂四项']

const quotaText = computed(() => {
  if (!quota.value) return '—'
  if (quota.value.limit < 0) return '不限次'
  return `${quota.value.used} / ${quota.value.limit} 次`
})

onMounted(load)

async function load() {
  try {
    const res = await reportApi.list()
    reports.value = res.reports
    quota.value = res.quota
    disclaimer.value = res.disclaimer
    notice.value = res.notice
    current.value = res.latest || null
  } catch (e) {
    /* ignore */
  }
}

function selectReport(item, closeSheet = false) {
  current.value = item
  if (closeSheet) showHistory.value = false
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths[0]
      uploading.value = true
      try {
        const data = await upload({ url: '/api/upload', filePath: path })
        if (!data || !data.url) return
        imageUrl.value = data.url
        title.value = '血常规 + 生化 12 项'
        showAnalyze.value = true
      } catch (e) {
        /* 错误已由 request 统一提示 */
      } finally {
        uploading.value = false
      }
    }
  })
}

async function analyze() {
  if (analyzing.value) return
  if (!imageUrl.value) {
    uni.showToast({ title: '请先上传化验单照片', icon: 'none' })
    return
  }
  analyzing.value = true
  try {
    const res = await reportApi.analyze({ title: title.value, imageUrl: imageUrl.value })
    showAnalyze.value = false
    current.value = res.report
    quota.value = res.quota
    uni.showToast({ title: '解读完成，已归档', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  } finally {
    analyzing.value = false
  }
}

async function addToAskList() {
  if (!current.value) return
  try {
    const res = await reportApi.askList(current.value.id)
    uni.showToast({ title: res.msg || '已加入问诊清单', icon: 'none' })
    load()
  } catch (e) {
    /* ignore */
  }
}

function flagText(flag) {
  if (flag === 'high') return '↑'
  if (flag === 'low') return '↓'
  return ''
}

function go(url) {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.capture {
  padding: 0;
  overflow: hidden;
}

.photo-area {
  height: 150px;
  background: #f6efe6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capture-inner {
  width: 200px;
  height: 112px;
  border: 2px dashed #cfc4b6;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #7a6e63;
}

.capture-icon {
  font-size: 22px;
}

.capture-actions {
  padding: 12px 14px;
  border-top: 1px solid #f2ebe2;
}

.mini {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
}

.indicator {
  height: auto;
  padding: 4px 10px;
  font-size: 12px;
  line-height: 16px;
  white-space: normal;
}

.indicator.high,
.indicator.low {
  background: #fdf1df;
  border-color: #f0dcbc;
  color: #8a5a1a;
}

.indicator.normal {
  background: #ffffff;
  border-color: #e7ded4;
  color: #574c42;
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
