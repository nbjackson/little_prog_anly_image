const app = getApp();

Page({
  data: {
    selectedImage: '',
    analysisResult: '',
    generatedImage: ''
  },
  
  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        this.setData({ selectedImage: tempFilePaths[0] });
      }
    });
  },
  
  analyzeImage() {
    if (!this.data.selectedImage) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '分析中...' });

    // 读取图片文件
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
  
  generateSimilarImage() {
    if (!this.data.analysisResult) {
      wx.showToast({ title: '请先分析图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    app.callZhipuAPI('cogview-3', {
      model: 'cogview-3',
      prompt: this.data.analysisResult,
      n: 1,
      size: "1024x1024",
      steps: 30
    })
    .then(result => {
      this.setData({ generatedImage: result.data[0].url });
      wx.hideLoading();
      wx.showToast({ title: '生成完成', icon: 'success' });
    })
    .catch(error => {
      console.error('生成图片失败:', error);
      wx.hideLoading();
      let errorMessage = '生成失败';
      if (error.message) {
        errorMessage += ': ' + error.message;
      }
      wx.showModal({
        title: '错误',
        content: errorMessage,
        showCancel: false
      });
    });
  },
  
  generateCartoonImage() {
    // 实现生成卡通图片逻辑，类似于generateSimilarImage
  },
  
  downloadImage() {
    if (!this.data.generatedImage) {
      wx.showToast({ title: '没有可下载的图片', icon: 'none' });
      return;
    }

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

  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: 'https://your-server.com/upload', // 替换为你的图片上传服务器地址
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