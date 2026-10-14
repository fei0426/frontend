<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟数据，接口就绪后替换为 GET /api/card/account 和 GET /api/card/transactions
const account = ref({
  cardNo: '6221 **** **** 3087',
  balance: 128.5,
  status: '正常',
  updatedAt: '2026-10-14 08:00'
})

const transactions = ref([
  { id: 1, time: '2026-10-14 12:10', merchant: '第二食堂', amount: -12.5, type: '消费' },
  { id: 2, time: '2026-10-13 18:22', merchant: '一食堂二层', amount: -15.0, type: '消费' },
  { id: 3, time: '2026-10-13 07:45', merchant: '教工超市', amount: -6.5, type: '消费' },
  { id: 4, time: '2026-10-12 20:05', merchant: '自助充值机', amount: 100.0, type: '充值' },
  { id: 5, time: '2026-10-12 12:30', merchant: '第二食堂', amount: -11.0, type: '消费' }
])

const range = ref([])

const filtered = computed(() => {
  if (!range.value || range.value.length !== 2) return transactions.value
  return transactions.value.filter((t) => {
    const day = t.time.slice(0, 10)
    return day >= range.value[0] && day <= range.value[1]
  })
})

async function handleLost() {
  try {
    await ElMessageBox.confirm('挂失后卡片将立即停用，确定挂失吗？', '挂失确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  account.value.status = '已挂失'
  ElMessage.success('已提交挂失，请到卡务中心办理解挂')
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">一卡通</h2>
        <p class="page-desc">
          余额和消费记录来自一卡通系统，数据更新至 {{ account.updatedAt }}。
        </p>
      </div>
    </div>

    <div class="overview">
      <div class="panel balance-card">
        <div class="stat-label">账户余额</div>
        <div class="balance-value">¥ {{ account.balance.toFixed(2) }}</div>
        <div class="muted">{{ account.cardNo }}</div>
        <div class="balance-actions">
          <el-button type="primary" @click="ElMessage.info('充值由一卡通系统完成，正在跳转')">
            去充值
          </el-button>
          <el-button :disabled="account.status !== '正常'" @click="handleLost">挂失</el-button>
        </div>
      </div>

      <div class="panel">
        <div class="stat-label">卡片状态</div>
        <div class="stat-value">
          <el-tag :type="account.status === '正常' ? 'success' : 'danger'" effect="plain">
            {{ account.status }}
          </el-tag>
        </div>
        <p class="muted status-tip">
          挂失与解挂由一卡通系统办理，本系统只做入口跳转。
        </p>
      </div>
    </div>

    <div class="panel">
      <h3 class="panel-title">消费明细</h3>
      <div class="toolbar">
        <el-date-picker
          v-model="range"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
        <span class="muted toolbar-right">共 {{ filtered.length }} 条记录</span>
      </div>

      <el-table :data="filtered" border>
        <el-table-column prop="time" label="交易时间" width="180" />
        <el-table-column prop="merchant" label="商户 / 地点" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.amount > 0 ? 'amount-in' : 'amount-out'">
              {{ row.amount > 0 ? '+' : '' }}{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.overview .panel + .panel {
  margin-top: 0;
}

.balance-value {
  margin: 8px 0 6px;
  font-size: 30px;
  font-weight: 500;
  line-height: 1.2;
}

.balance-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.status-tip {
  margin: 12px 0 0;
  line-height: 1.6;
}

.amount-in {
  color: #67c23a;
}

.amount-out {
  color: #303133;
}
</style>
