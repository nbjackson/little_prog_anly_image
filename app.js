import { API_KEY } from './config.js';

App({
  onLaunch() {
    // 小程序启动时执行的逻辑
  },
  globalData: {
    // 全局数据
  },
  callZhipuAPI(endpoint, data) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://open.bigmodel.cn/api/paas/v4/${endpoint}`,  // 注意这里改成了 v4
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        data: data,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            console.error('API请求失败:', res);
            reject(new Error(`API请求失败: ${res.statusCode}, ${JSON.stringify(res.data)}`));
          }
        },
        fail: (error) => {
          console.error('网络请求失败:', error);
          reject(new Error(`网络请求失败: ${error.errMsg}`));
        }
      });
    });
  }
  // 移除 getAuthToken 方法，因为我们直接使用 API_KEY
});