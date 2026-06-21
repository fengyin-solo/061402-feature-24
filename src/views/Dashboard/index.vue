<template>
  <div class="camp-dashboard">
    <div class="dashboard-header">
      <div class="header-left">
        <h2 class="dashboard-title">
          <span class="title-icon">🏕️</span>
          营地调度中心
        </h2>
        <p class="dashboard-subtitle">实时监控营地资源状况，及时调度应对危机</p>
      </div>
      <div class="header-right">
        <el-tag :type="campStatus.type" effect="dark" size="large" round>
          {{ campStatus.text }}
        </el-tag>
        <span class="update-time">更新于 {{ lastUpdateTime }}</span>
      </div>
    </div>

    <div class="resource-overview">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="resource in resourceList" :key="resource.key">
          <div
            class="resource-card"
            :class="{ 'low-stock': resource.isLow, 'critical-stock': resource.isCritical, 'selected': selectedResourceKey === resource.key }"
            @click="selectResource(resource)"
          >
            <div class="resource-icon-wrapper" :style="{ background: resource.gradient }">
              <span class="resource-emoji">{{ resource.emoji }}</span>
            </div>
            <div class="resource-info">
              <div class="resource-header">
                <span class="resource-name">{{ resource.name }}</span>
                <el-tag v-if="resource.isCritical" type="danger" size="small" effect="dark">告急</el-tag>
                <el-tag v-else-if="resource.isLow" type="warning" size="small">偏低</el-tag>
              </div>
              <div class="resource-value">
                <span class="current">{{ resource.current }}</span>
                <span class="unit">{{ resource.unit }}</span>
              </div>
              <el-progress
                :percentage="resource.percentage"
                :status="resource.progressStatus"
                :stroke-width="6"
                :show-text="false"
              />
              <div class="resource-meta">
                <span class="daily-consume">日耗: {{ resource.dailyConsume }}{{ resource.unit }}/天</span>
                <span class="days-left">可维持 <b :class="{ 'danger': resource.daysLeft <= 3 }">{{ resource.daysLeft }}</b> 天</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="main-content">
      <el-row :gutter="16">
        <el-col :xs="24" :lg="16">
          <div class="chart-card">
            <div class="card-header">
              <div class="header-info">
                <h3>📊 库存趋势</h3>
                <span class="card-tip">追踪 {{ selectedResource.name }} 变化情况</span>
              </div>
              <el-radio-group v-model="trendPeriod" size="small" @change="fetchInventoryTrend">
                <el-radio-button value="week">近7天</el-radio-button>
                <el-radio-button value="month">近30天</el-radio-button>
                <el-radio-button value="quarter">近90天</el-radio-button>
              </el-radio-group>
            </div>
            <div class="card-body">
              <div ref="trendChartRef" class="trend-chart"></div>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-header">
              <div class="header-info">
                <h3>⚔️ 主要消耗任务</h3>
                <span class="card-tip">资源消耗大户 TOP 5</span>
              </div>
            </div>
            <div class="card-body">
              <div class="task-list">
                <div class="task-item" v-for="(task, index) in consumptionTasks" :key="task.id">
                  <div class="task-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
                  <div class="task-main">
                    <div class="task-header">
                      <span class="task-name">{{ task.name }}</span>
                      <el-tag :type="task.priorityType" size="small">{{ task.priorityText }}</el-tag>
                    </div>
                    <div class="task-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ task.progress }}%</span>
                    </div>
                    <div class="task-consumes">
                      <span class="consume-item" v-for="consume in task.consumes" :key="consume.resource">
                        <span class="consume-emoji">{{ consume.emoji }}</span>
                        {{ consume.resource }}: <b>-{{ consume.amount }}</b>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="chart-card warning-card">
            <div class="card-header warning-header">
              <div class="header-info">
                <h3>⚠️ 断供应急行动</h3>
                <span class="card-tip">即将断供的资源及应对方案</span>
              </div>
              <el-badge :value="warnings.length" :max="99" class="warning-badge" />
            </div>
            <div class="card-body">
              <div v-if="warnings.length === 0" class="empty-state">
                <div class="empty-icon">✅</div>
                <p>暂无断供风险</p>
                <span>所有资源储备充足</span>
              </div>
              <div v-else class="warning-list">
                <div class="warning-item" v-for="warning in warnings" :key="warning.id">
                  <div class="warning-level" :class="warning.level">
                    <span class="warning-emoji">{{ warning.levelEmoji }}</span>
                  </div>
                  <div class="warning-content">
                    <div class="warning-header">
                      <span class="warning-resource">{{ warning.resourceName }}</span>
                      <el-tag :type="warning.tagType" effect="dark" size="small">
                        {{ warning.daysText }}
                      </el-tag>
                    </div>
                    <p class="warning-desc">{{ warning.description }}</p>
                    <div class="warning-action">
                      <el-button type="primary" size="small" @click="executeAction(warning)">
                        立即调度
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-header">
              <div class="header-info">
                <h3>📋 快速操作</h3>
                <span class="card-tip">常用调度指令</span>
              </div>
            </div>
            <div class="card-body">
              <div class="quick-actions">
                <el-button class="action-btn" type="primary" @click="quickAction('gather')">
                  <span class="action-emoji">⛏️</span>
                  <span>派人采集</span>
                </el-button>
                <el-button class="action-btn" type="success" @click="quickAction('trade')">
                  <span class="action-emoji">🤝</span>
                  <span>物资交易</span>
                </el-button>
                <el-button class="action-btn" type="warning" @click="quickAction('ration')">
                  <span class="action-emoji">⚖️</span>
                  <span>调整配给</span>
                </el-button>
                <el-button class="action-btn" type="danger" @click="quickAction('alert')">
                  <span class="action-emoji">🚨</span>
                  <span>紧急预警</span>
                </el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
import * as echarts from 'echarts';
import * as dashboardApi from '../../api/dashboard';
import { ElMessage } from 'element-plus';

const trendChartRef = ref(null);
let trendChart = null;

const selectedResourceKey = ref('food');
const trendPeriod = ref('week');
const lastUpdateTime = ref('');

const rawResources = [
  {
    key: 'food',
    name: '食物',
    emoji: '🍖',
    unit: '份',
    current: 285,
    max: 1000,
    dailyConsume: 45,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    key: 'water',
    name: '饮水',
    emoji: '💧',
    unit: '升',
    current: 420,
    max: 800,
    dailyConsume: 60,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    key: 'wood',
    name: '木材',
    emoji: '🪵',
    unit: '根',
    current: 156,
    max: 500,
    dailyConsume: 25,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    key: 'stone',
    name: '石料',
    emoji: '🪨',
    unit: '块',
    current: 89,
    max: 400,
    dailyConsume: 18,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
];

const processedResources = rawResources.map(r => {
  const percentage = Math.round((r.current / r.max) * 100);
  const daysLeft = Math.floor(r.current / r.dailyConsume);
  const isCritical = daysLeft <= 2;
  const isLow = daysLeft <= 5 && !isCritical;
  let progressStatus = '';
  if (isCritical) progressStatus = 'exception';
  else if (isLow) progressStatus = 'warning';
  return {
    ...r,
    percentage,
    daysLeft,
    isCritical,
    isLow,
    progressStatus
  };
});

const resourceList = ref(processedResources);

const campStatus = computed(() => {
  const criticalCount = resourceList.value.filter(r => r.isCritical).length;
  if (criticalCount >= 2) {
    return { type: 'danger', text: '危急状态' };
  }
  const lowCount = resourceList.value.filter(r => r.isLow).length;
  if (lowCount >= 2 || criticalCount >= 1) {
    return { type: 'warning', text: '需要关注' };
  }
  return { type: 'success', text: '运行良好' };
});

const selectedResource = computed(() => {
  return resourceList.value.find(r => r.key === selectedResourceKey.value) || resourceList.value[0];
});

const inventoryTrendData = ref([]);

const consumptionTasks = ref([
  {
    id: 1,
    name: '加固防御工事',
    progress: 65,
    priorityType: 'danger',
    priorityText: '高优先级',
    consumes: [
      { resource: '木材', amount: 80, emoji: '🪵' },
      { resource: '石料', amount: 45, emoji: '🪨' },
    ]
  },
  {
    id: 2,
    name: '扩建居住区',
    progress: 40,
    priorityType: 'warning',
    priorityText: '中优先级',
    consumes: [
      { resource: '木材', amount: 120, emoji: '🪵' },
      { resource: '石料', amount: 60, emoji: '🪨' },
    ]
  },
  {
    id: 3,
    name: '制作狩猎陷阱',
    progress: 80,
    priorityType: 'success',
    priorityText: '进行中',
    consumes: [
      { resource: '木材', amount: 30, emoji: '🪵' },
      { resource: '食物', amount: 15, emoji: '🍖' },
    ]
  },
  {
    id: 4,
    name: '净水设备维护',
    progress: 25,
    priorityType: 'info',
    priorityText: '计划中',
    consumes: [
      { resource: '石料', amount: 20, emoji: '🪨' },
      { resource: '饮水', amount: 50, emoji: '💧' },
    ]
  },
  {
    id: 5,
    name: '探索周围区域',
    progress: 55,
    priorityType: 'info',
    priorityText: '进行中',
    consumes: [
      { resource: '食物', amount: 60, emoji: '🍖' },
      { resource: '饮水', amount: 40, emoji: '💧' },
    ]
  },
]);

const warnings = ref([
  {
    id: 1,
    resourceName: '石料',
    level: 'critical',
    levelEmoji: '🚨',
    daysText: '仅剩1天',
    tagType: 'danger',
    description: '当前库存仅 89 块，日耗 18 块，防御工事施工将被迫停工。',
    action: '派2人去采石场采集石料',
  },
  {
    id: 2,
    resourceName: '木材',
    level: 'warning',
    levelEmoji: '⚠️',
    daysText: '仅剩4天',
    tagType: 'warning',
    description: '当前库存 156 根，多项工程同时消耗，储备告急。',
    action: '组织集体伐木任务',
  },
]);

const selectResource = (resource) => {
  selectedResourceKey.value = resource.key;
  nextTick(() => {
    renderTrendChart();
  });
};

const mockTrendData = () => {
  const days = trendPeriod.value === 'week' ? 7 : trendPeriod.value === 'month' ? 30 : 90;
  const labels = [];
  const data = [];
  const resource = selectedResource.value;
  let val = resource.current;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    labels.push(`${month}/${day}`);
    const variation = Math.floor(Math.random() * resource.dailyConsume * 2) - resource.dailyConsume / 2;
    val = Math.max(0, val - resource.dailyConsume + variation);
    if (i === 0) val = resource.current;
    data.push(Math.round(val));
  }
  inventoryTrendData.value = { labels, data };
};

const renderTrendChart = () => {
  if (!trendChart) {
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value);
    }
  }
  if (!trendChart) return;

  mockTrendData();

  const resource = selectedResource.value;
  const gradientColorStart = resource.isCritical ? '#f56c6c' : resource.isLow ? '#e6a23c' : '#67c23a';

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
      formatter: (params) => {
        const p = params[0];
        return `${p.axisValue}<br/>${resource.name}: <b>${p.value}</b> ${resource.unit}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: inventoryTrendData.value.labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#ebeef5' } },
      axisLabel: { color: '#909399', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#909399', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f5f7fa' } }
    },
    series: [
      {
        name: resource.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: gradientColorStart },
        itemStyle: { color: gradientColorStart, borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: gradientColorStart + '60' },
            { offset: 1, color: gradientColorStart + '05' }
          ])
        },
        data: inventoryTrendData.value.data
      }
    ]
  };

  trendChart.setOption(option, true);
};

const fetchCampResources = async () => {
  try {
    await dashboardApi.getCampResources();
  } catch (error) {
  }
  lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit', minute: '2-digit'
  });
};

const fetchInventoryTrend = async () => {
  try {
    await dashboardApi.getInventoryTrend(trendPeriod.value);
  } catch (error) {
  }
  nextTick(() => renderTrendChart());
};

const fetchConsumptionTasks = async () => {
  try {
    await dashboardApi.getConsumptionTasks(5);
  } catch (error) {
  }
};

const fetchSupplyWarnings = async () => {
  try {
    await dashboardApi.getSupplyWarnings();
  } catch (error) {
  }
};

const executeAction = (warning) => {
  ElMessage({
    message: `已启动应急调度：${warning.action}`,
    type: 'success'
  });
};

const quickAction = (type) => {
  const messages = {
    gather: '已派遣采集队出发',
    trade: '已打开交易面板',
    ration: '已调整资源配给方案',
    alert: '已发布全营预警通知'
  };
  ElMessage({
    message: messages[type],
    type: 'success'
  });
};

const handleResize = () => {
  if (trendChart) {
    trendChart.resize();
  }
};

onMounted(() => {
  fetchCampResources();
  fetchInventoryTrend();
  fetchConsumptionTasks();
  fetchSupplyWarnings();
  nextTick(() => {
    renderTrendChart();
    window.addEventListener('resize', handleResize);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (trendChart) {
    trendChart.dispose();
    trendChart = null;
  }
});
</script>

<style scoped>
.camp-dashboard {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left .dashboard-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 26px;
}

.dashboard-subtitle {
  margin: 6px 0 0 0;
  color: #909399;
  font-size: 13px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

.resource-overview {
  margin-bottom: 16px;
}

.resource-card {
  display: flex;
  align-items: flex-start;
  padding: 18px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  margin-bottom: 16px;
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.resource-card.selected {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.resource-card.low-stock {
  border-color: rgba(230, 162, 60, 0.25);
  background: linear-gradient(135deg, #fff 0%, #fdf6ec 100%);
}

.resource-card.critical-stock {
  border-color: rgba(245, 108, 108, 0.4);
  background: linear-gradient(135deg, #fff 0%, #fef0f0 100%);
}

.resource-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.resource-emoji {
  font-size: 26px;
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.resource-name {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.resource-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 10px;
}

.resource-value .current {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.resource-value .unit {
  font-size: 12px;
  color: #909399;
}

.resource-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.days-left b {
  color: #67c23a;
  font-weight: 600;
}

.days-left b.danger {
  color: #f56c6c;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.card-header.warning-header {
  background: linear-gradient(135deg, #fff 0%, #fef0f0 100%);
}

.warning-card {
  border: 1px solid #fde2e2;
}

.header-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: inline;
}

.card-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.warning-badge :deep(.el-badge__content) {
  background: #f56c6c;
}

.card-body {
  padding: 20px;
}

.trend-chart {
  width: 100%;
  height: 320px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  background: #fafbfc;
  border-radius: 10px;
  transition: background 0.2s;
}

.task-item:hover {
  background: #f5f7fa;
}

.task-rank {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #f0f2f5;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.task-rank.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  color: #fff;
}

.task-rank.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
  color: #fff;
}

.task-rank.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
  color: #fff;
}

.task-main {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #ebeef5;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  min-width: 38px;
  text-align: right;
}

.task-consumes {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12px;
  color: #909399;
}

.consume-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.consume-emoji {
  font-size: 14px;
}

.consume-item b {
  color: #f56c6c;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #67c23a;
}

.empty-state span {
  font-size: 12px;
  color: #909399;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.warning-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: 10px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.warning-level {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.warning-level.critical {
  background: linear-gradient(135deg, #f56c6c 0%, #c45656 100%);
}

.warning-level.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #cf9236 100%);
}

.warning-emoji {
  font-size: 20px;
}

.warning-content {
  flex: 1;
  min-width: 0;
}

.warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.warning-resource {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.warning-desc {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.warning-action {
  display: flex;
  justify-content: flex-end;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  height: 72px !important;
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 10px !important;
}

.action-emoji {
  font-size: 20px;
}

.action-btn span {
  font-size: 13px;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .resource-card {
    margin-bottom: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .trend-chart {
    height: 260px;
  }
}
</style>
