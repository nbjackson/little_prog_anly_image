import { API_BASE_URL, API_KEY, IMAGE_GENERATION_ENDPOINT } from '../../config.js';

const app = getApp();

Page({
  data: {
    selectedImage: '',  // 存储用户选择的图片路径
    analysisResult: '', // 存储图片分析结果
    generatedImage: ''  // 存储生成的图片URL
  },
  
  // 选择图片方法
  chooseImage() {
    wx.chooseImage({
      count: 1, // 限制只能选择一张图片
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        // 更新页面数据，设置选中的图片路径
        this.setData({ selectedImage: tempFilePaths[0] });
      }
    });
  },
  
  // 分析图片方法
  analyzeImage() {
    // 检查是否已选择图片
    if (!this.data.selectedImage) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '分析中...' });

    // 读取图片文件并转换为base64格式
    wx.getFileSystemManager().readFile({
      filePath: this.data.selectedImage,
      encoding: 'base64',
      success: (res) => {
        const base64Image = res.data;
        // 调用GLM-4V API分析图片
        app.callZhipuAPI('chat/completions', {
          model: "glm-4v",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "请分析这张图片"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ]
        })
        .then(result => {
          console.log('API响应:', result);
          // 更新页面数据，设置分析结果
          this.setData({ analysisResult: result.choices[0].message.content });
          wx.hideLoading();
          wx.showToast({ title: '分析完成', icon: 'success' });
        })
        .catch(error => {
          console.error('分析图片失败:', error);
          wx.hideLoading();
          wx.showModal({
            title: '错误',
            content: '分析失败: ' + error.message,
            showCancel: false
          });
        });
      },
      fail: (error) => {
        console.error('读取图片文件失败:', error);
        wx.hideLoading();
        wx.showModal({
          title: '错误',
          content: '读取图片文件失败: ' + error.errMsg,
          showCancel: false
        });
      }
    });
  },
  
  // 生成相似图片方法
  generateSimilarImage() {
    // 检查是否已有分析结果
    if (!this.data.analysisResult) {
      wx.showToast({ title: '请先分析图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    // 调用图像生成API
    wx.request({
      url: `${API_BASE_URL}${IMAGE_GENERATION_ENDPOINT}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: {
        model: 'cogview-3-plus',
        prompt: this.data.analysisResult,
        n: 1,
        size: "1024x1024",
        steps: 30
      },
      success: (res) => {
        console.log('API响应:', res.data);
        if (res.data && res.data.data && res.data.data[0] && res.data.data[0].url) {
          // 更新页面数据，设置生成的图片URL
          this.setData({ generatedImage: res.data.data[0].url });
          wx.hideLoading();
          wx.showToast({ title: '生成完成', icon: 'success' });
        } else {
          throw new Error('API返回的数据格式不正确');
        }
      },
      fail: (error) => {
        console.error('生成图片失败:', error);
        if (error.statusCode) {
          console.error('状态码:', error.statusCode);
        }
        if (error.data) {
          console.error('响应体:', error.data);
        }
        wx.hideLoading();
        let errorMessage = '生成失败';
        if (error.errMsg) {
          errorMessage += ': ' + error.errMsg;
        }
        wx.showModal({
          title: '错误',
          content: errorMessage,
          showCancel: false
        });
      }
    });
  },
  
  // 生成卡通图片方法
  generateCartoonImage() {
    // 检查是否已有分析结果
    if (!this.data.analysisResult) {
      wx.showToast({ title: '请先分析图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    // 调用图像生成API，生成卡通风格图片
    wx.request({
      url: `${API_BASE_URL}${IMAGE_GENERATION_ENDPOINT}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: {
        model: 'cogview-3-plus',
        prompt: `将以下描述转换为卡通风格图片：${this.data.analysisResult}`,
        n: 1,
        size: "1024x1024",
        steps: 30
      },
      success: (res) => {
        console.log('API响应:', res.data);
        if (res.data && res.data.data && res.data.data[0] && res.data.data[0].url) {
          // 更新页面数据，设置生成的卡通图片URL
          this.setData({ generatedImage: res.data.data[0].url });
          wx.hideLoading();
          wx.showToast({ title: '生成完成', icon: 'success' });
        } else {
          throw new Error('API返回的数据格式不正确');
        }
      },
      fail: (error) => {
        console.error('生成卡通图片失败:', error);
        // ... 错误处理逻辑 ...
      }
    });
  },
  
  // 下载图片方法
  downloadImage() {
    // 检查是否有可下载的图片
    if (!this.data.generatedImage) {
      wx.showToast({ title: '没有可下载的图片', icon: 'none' });
      return;
    }

    // 下载图片并保存到相册
    wx.downloadFile({
      url: this.data.generatedImage,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({ title: '图片已保存到相册', icon: 'success' });
          },
          fail: () => {
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  },

  // 上传图片方法（未完全实现）
  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: 'https://your-server.com/upload', // 替换为实际的上传服务器地址
        filePath: filePath,
        name: 'image',
        success: (res) => {
          console.log('Upload response:', res);
          try {
            let data;
            if (typeof res.data === 'string') {
              data = JSON.parse(res.data);
            } else {
              data = res.data;
            }
            if (data && data.url) {
              resolve(data.url);
            } else {
              reject(new Error('上传成功但未返回有效的图片URL'));
            }
          } catch (e) {
            console.error('解析上传响应失败:', e, 'Response:', res.data);
            reject(new Error('解析上传响应失败: ' + e.message));
          }
        },
        fail: (error) => {
          console.error('上传图片失败:', error);
          reject(new Error('上传图片失败: ' + error.errMsg));
        }
      });
    });
  }
});