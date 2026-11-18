<template>
  <view class="jd-page">
    <jd-nav title="我的" />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view v-if="!isElder && data" class="card mt6" @tap="go('/pages/vip/vip')">
        <view class="row g12">
          <jd-avatar :text="data.user.avatarText" :color="data.user.avatarColor" size="lg" />
          <view class="f1">
            <text class="t17 b">{{ data.user.name }}</text>
            <view class="t11 c3 mt4">
              {{ data.family.name }} · {{ data.user.relation }} · {{ data.membership.label }}
            </view>
          </view>
          <text class="chev">›</text>
        </view>
      </view>

      <view class="t12 c2 sb mt18 mb8">提醒渠道</view>
      <view class="list">
        <view v-for="ch in data && data.channels" :key="ch.key" class="li">
          <view class="f1">
            <text class="lb">{{ ch.label }}</text>
            <view class="t11 c3 mt4">{{ ch.hint }}</view>
          </view>
          <jd-switch v-model="ch.on" style="margin-left: auto" @change="(v) => saveNotify({ [ch.key]: v })" />
        </view>
      </view>

      <view class="card flat tight mt8 notice">
        <text class="t11 c2" style="line-height: 17px">{{ data ? data.degradeChain : '' }}</text>
      </view>

      <view class="t12 c2 sb mt18 mb8">什么情况提醒我</view>
      <view class="list">
        <view v-for="ev in data && data.events" :key="ev.key" class="li">
          <text class="lb">{{ ev.label }}</text>
          <jd-switch v-model="ev.on" style="margin-left: auto" @change="(v) => saveNotify({ [ev.key]: v })" />
        </view>
      </view>

      <view class="t12 c2 sb mt18 mb8">静默时段</view>
      <view class="list">
        <view class="li">
          <text class="lb">开启静默</text>
          <view class="vl row g6">
            <picker mode="time" :value="quiet.start" @change="(e) => saveNotify({ quiet_start: e.detail.value })">
              <text class="num">{{ quiet.start }}</text>
            </picker>
            <text>–</text>
            <picker mode="time" :value="quiet.end" @change="(e) => saveNotify({ quiet_end: e.detail.value })">
              <text class="num">{{ quiet.end }}</text>
            </picker>
          </view>
          <jd-switch v-model="quiet.enabled" style="margin-left: 10px" @change="(v) => saveNotify({ quiet_enabled: v })" />
        </view>
        <view class="li">
          <view class="f1">
            <text class="lb">紧急任务可穿透</text>
            <view class="t11 c3 mt4">需主理手动标记</view>
          </view>
          <jd-switch v-model="quiet.urgentPass" style="margin-left: auto" @change="(v) => saveNotify({ urgent_pass: v })" />
        </view>
      </view>

      <view class="t12 c2 sb mt18 mb8">系统</view>
      <view class="list">
        <view class="li" @tap="go('/pages/widget/widget')">
          <text class="lb">桌面小组件</text>
          <text class="chev">›</text>
        </view>
        <view class="li" @tap="showCache = true">
          <text class="lb">离线缓存</text>
          <text class="vl">{{ data ? data.system.cache.tasks : 0 }} 条 · {{ data ? data.system.cache.sizeLabel : '' }}</text>
          <text class="chev">›</text>
        </view>
        <view class="li" @tap="showPrivacy = true">
          <text class="lb">隐私与数据</text>
          <text class="chev">›</text>
        </view>
        <view class="li" @tap="go('/pages/elder/elder')">
          <view class="f1">
            <text class="lb">关怀版模式</text>
            <view class="t11 c3 mt4">正文 26sp · 一屏一卡 · 关闭非必要动效</view>
          </view>
          <text class="chev">›</text>
        </view>
      </view>

      <view class="row g8 mt14">
        <button class="btn btn-ghost" style="flex: 1" @tap="testNotification">测试提醒链路</button>
        <button class="btn btn-sunk" style="flex: 1" @tap="logout">退出登录</button>
      </view>

      <view class="t11 c4 tc mt18">家灯 v{{ data ? data.system.version : '0.1.0' }} · 爱，让家成为世间最美好的地方</view>
    </scroll-view>

    <jd-tabbar active="me" />

    <u-popup v-model:show="showCache" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">离线缓存</view>
        <view class="t11 c3 mb10">没有网络也能看任务与打卡，联网后自动补传。</view>
        <view class="list">
          <view class="li">
            <text class="lb">缓存任务</text>
            <text class="vl">{{ data ? data.system.cache.tasks : 0 }} 条</text>
          </view>
          <view class="li">
            <text class="lb">占用空间</text>
            <text class="vl">{{ data ? data.system.cache.sizeLabel : '' }}</text>
          </view>
          <view class="li">
            <text class="lb">最近同步</text>
            <text class="vl num">{{ data ? data.system.lastSyncAt.replace('T', ' ').slice(0, 16) : '' }}</text>
          </view>
        </view>
        <button class="btn btn-ghost mt14" @tap="clearCache">清空缓存</button>
      </view>
    </u-popup>

    <u-popup v-model:show="showPrivacy" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">隐私与数据</view>
        <view class="list mt10">
          <view class="li">
            <view class="f1">
              <text class="lb">健康档案加密</text>
              <view class="t11 c3 mt4">解锁后才能查看</view>
            </view>
            <text class="t11 cok">已开启</text>
          </view>
          <view class="li" @tap="go('/pages/profile/profile')">
            <text class="lb">谁看过我的档案</text>
            <text class="chev">›</text>
          </view>
          <view class="li">
            <view class="f1">
              <text class="lb">定位与轨迹</text>
              <view class="t11 c3 mt4">家灯明确不做</view>
            </view>
            <text class="t11 c3">不采集</text>
          </view>
        </view>
        <view class="disc mt12">导出、导出给医生、查看档案都会留痕，长辈本人可见。</view>
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
import JdSwitch from '@/components/JdSwitch.vue'
import { settingApi, authApi } from '@/api'
import { useSession, setSession } from '@/store/session'

const session = useSession()
const data = ref(null)
const quiet = ref({ enabled: true, start: '22:00', end: '08:00', urgentPass: true })
const showCache = ref(false)
const showPrivacy = ref(false)
const isElder = computed(() => session.member && session.member.role === 'elder')

onMounted(load)
onShow(() => {
  if (session.token) load()
})

async function load() {
  try {
    const res = await settingApi.get()
    data.value = res
    quiet.value = { ...res.quiet }
  } catch (e) {
    /* ignore */
  }
}

async function saveNotify(patch) {
  try {
    const res = await settingApi.notifications(patch)
    if (data.value) {
      data.value.channels = res.channels
      data.value.events = res.events
      quiet.value = { ...res.quiet }
    }
  } catch (e) {
    load()
  }
}

async function testNotification() {
  try {
    const logs = await settingApi.test()
    const first = logs && logs[0]
    if (!first) return
    const label =
      first.status === 'skipped_quiet'
        ? '当前处于静默时段，非紧急提醒会被挡下'
        : first.status === 'sent'
        ? `已通过「${first.channelLabel || first.channel}」投递`
        : '所有渠道都关闭了'
    uni.showModal({ title: '测试提醒', content: label, showCancel: false })
    load()
  } catch (e) {
    /* ignore */
  }
}

function clearCache() {
  uni.showModal({
    title: '清空缓存',
    content: '离线缓存会重新从云端拉取，不影响任何记录。',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '缓存已清空', icon: 'none' })
        showCache.value = false
      }
    }
  })
}

function logout() {
  uni.showModal({
    title: '退出登录',
    content: '退出后需要重新面容解锁。记录不会丢失。',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await authApi.logout()
      } catch (e) {
        /* ignore */
      }
      const { clearSession } = await import('@/store/session')
      clearSession()
      uni.reLaunch({ url: '/pages/launch/launch' })
    }
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
}
</style>
