import request from '../utils/request';

/**
 * 获取仪表盘统计数据
 * @returns {Promise<Object>} 统计数据
 */
export const getDashboardStats = async () => {
  const response = await request.get('/dashboard/stats');
  return response.data;
};

/**
 * 获取最近订单
 * @param {number} limit - 数量限制
 * @returns {Promise<Array<Object>>} 最近订单
 */
export const getRecentOrders = async (limit = 5) => {
  const response = await request.get('/dashboard/recent-orders', { limit });
  return response.data;
};

/**
 * 获取热门产品
 * @param {number} limit - 数量限制
 * @returns {Promise<Array<Object>>} 热门产品
 */
export const getTopProducts = async (limit = 5) => {
  const response = await request.get('/dashboard/top-products', { limit });
  return response.data;
};

/**
 * 获取销售趋势
 * @param {string} period - 时间周期 (day, week, month, year)
 * @returns {Promise<Array<Object>>} 销售趋势数据
 */
export const getSalesTrend = async (period = 'month') => {
  const response = await request.get('/dashboard/sales-trend', { period });
  return response.data;
};

/**
 * 获取用户增长趋势
 * @param {string} period - 时间周期 (day, week, month, year)
 * @returns {Promise<Array<Object>>} 用户增长数据
 */
export const getUserGrowth = async (period = 'month') => {
  const response = await request.get('/dashboard/user-growth', { period });
  return response.data;
};

/**
 * 获取营地资源总览
 * @returns {Promise<Object>} 营地资源数据
 */
export const getCampResources = async () => {
  const response = await request.get('/camp/resources');
  return response.data;
};

/**
 * 获取资源库存趋势
 * @param {string} period - 时间周期 (week, month, quarter)
 * @returns {Promise<Array<Object>>} 库存趋势数据
 */
export const getInventoryTrend = async (period = 'week') => {
  const response = await request.get('/camp/inventory-trend', { period });
  return response.data;
};

/**
 * 获取主要消耗任务
 * @param {number} limit - 数量限制
 * @returns {Promise<Array<Object>>} 消耗任务列表
 */
export const getConsumptionTasks = async (limit = 5) => {
  const response = await request.get('/camp/consumption-tasks', { limit });
  return response.data;
};

/**
 * 获取即将断供预警
 * @returns {Promise<Array<Object>>} 断供预警列表
 */
export const getSupplyWarnings = async () => {
  const response = await request.get('/camp/supply-warnings');
  return response.data;
};