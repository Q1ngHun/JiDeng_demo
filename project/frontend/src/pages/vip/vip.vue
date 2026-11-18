<template>
  <view class="jd-page">
    <jd-nav title="家庭会员" back />

    <scroll-view class="jd-body scroll" scroll-y :show-scrollbar="false">
      <view class="card dark price-card mt6">
        <view class="between">
          <view>
            <text class="t11" style="opacity: 0.72">家庭会员</text>
            <view class="row g8 mt6 baseline">
              <text class="t32 b">{{ data ? data.price.label : '99' }}</text>
              <text class="t14">{{ data ? data.price.unit : '元 / 年' }}</text>
            </view>
          </view>
          <view class="tag light">≈8.3 元/月</view>
        </view>
        <view class="t12 mt8 muted">{{ data ? data.included : '' }}</view>
      </view>

      <view v-if="data && data.active" class="card flat tight mt10 active-card">
        <view class="row g8">
          <jd-icon name="shield" :size="18" color="#0F7B4F" />
          <view class="f1">
            <text class="t13 sb cok">会员生效中</text>
            <view class="t11 c3 mt2">到期 {{ data.membership.expiresAt.slice(0, 10) }} · 不自动续费</view>
          </view>
          <text v-if="data.membership.canRefund" class="t11 c3" @tap="refund">申请退款</text>
        </view>
      </view>

      <view class="t12 c2 sb mt18 mb8">升级后对你最有用</view>
      <view class="list">
        <view v-for="b in benefits" :key="b.label" class="li">
          <jd-icon :name="b.icon" :size="20" color="#7A6E63" />
          <view class="f1">
            <text class="lb">{{ b.label }}</text>
            <view class="t11 c3 mt4">{{ b.hint }}</view>
          </view>
          <view v-if="b.tag" class="tag brand">{{ b.tag }}</view>
        </view>
      </view>

      <view v-if="data" class="table mt16">
        <view class="tr head">
          <text class="td">权益</text>
          <text class="td">免费</text>
          <text class="td">会员</text>
        </view>
        <view v-for="row in data.table" :key="row.label" class="tr">
          <text class="td">{{ row.label }}</text>
          <text class="td">{{ row.free }}</text>
          <text class="td">{{ row.vip }}</text>
        </view>
      </view>

      <view class="card flat mt14 policy">
        <text class="t11 c2" style="line-height: 18px">{{ data ? data.policy : '' }}</text>
      </view>

      <view v-if="data" class="quota-row mt12">
        <text class="t11 c3">本月已导出 {{ data.quota.exports.used }} 次 · 还可导出 {{ data.quota.exports.left }} 次</text>
      </view>

      <view class="t11 c3 mt12" style="line-height: 18px">
        会员入口在长辈端不可见；App 也没有长辈付费入口。
      </view>
    </scroll-view>

    <view class="actionbar">
      <button v-if="!data || !data.active" class="btn btn-primary" :disabled="paying" @tap="buy">
        {{ paying ? '正在唤起支付…' : '99 元开通' }}
      </button>
      <button v-else class="btn btn-ghost" :disabled="paying" @tap="buy">续费一年（99 元）</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import JdNav from '@/components/JdNav.vue'
import JdIcon from '@/components/JdIcon.vue'
import { vipApi } from '@/api'

const data = ref(null)
const benefits = ref([
  { icon: 'doc', label: '记录导出 PDF', hint: '给医生看时不用翻手机', tag: '常用' },
  { icon: 'bell', label: '短信提醒', hint: '推送失败时的兜底，长辈也能收到' },
  { icon: 'chart', label: '4 位长辈档案', hint: '爸妈各一份，不用来回切换账号' }
])
const paying = ref(false)

onMounted(load)

async function load() {
  try {
    const res = await vipApi.get()
    data.value = res
    benefits.value = res.benefits
  } catch (e) {
    /* ignore */
  }
}

async function buy() {
  if (paying.value) return
  paying.value = true
  try {
    const order = await vipApi.order({ channel: 'wxpay' })
    // 真实项目：此处调用 uni.requestPayment 唤起微信支付，回调后服务端验签
    uni.showLoading({ title: '正在支付…', mask: true })
    await new Promise((resolve) => setTimeout(resolve, 700))
    const res = await vipApi.pay(order.outTradeNo)
    uni.hideLoading()
    uni.showModal({
      title: '开通成功',
      content: `家庭会员已生效，到期 ${(res.membership.expiresAt || '').slice(0, 10)}。7 天内可无理由退款。`,
      showCancel: false
    })
    load()
  } catch (e) {
    uni.hideLoading()
  } finally {
    paying.value = false
  }
}

function refund() {
  uni.showModal({
    title: '申请退款',
    content: '退款后会员权益立即停止，历史数据只读保留，不会删除。',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await vipApi.refund()
        uni.showToast({ title: '已退款，数据保留只读', icon: 'none' })
        load()
      } catch (e) {
        /* ignore */
      }
    }
  })
}
</script>

<style scoped>
.scroll {
  padding-bottom: 24px;
}

.price-card {
  border-radius: 18px;
  padding: 16px;
}

.muted {
  color: rgba(255, 255, 255, 0.72);
}

.baseline {
  align-items: baseline;
}

.tag.light {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.active-card {
  background: #f2fbf6;
  border-color: #cde9db;
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
  flex: 1.4;
  font-weight: 600;
  color: #171210;
}

.tr.head .td {
  font-size: 11px;
  color: #6e665c;
  font-weight: 700;
}

.policy {
  background: #fbf7f2;
  border-color: #e7ded4;
}
</style>
