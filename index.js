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

    // 上传图片到服务器并获取URL
    this.uploadImage(this.data.selectedImage)
      .then(imageUrl => {
        // 调用GLM-4V API分析图片
        return app.callZhipuAPI('glm-4v/analysis', {
          model: 'glm-4v',
          prompt: '请分析这张图片',
          image: imageUrl
        });
      })
      .then(result => {
        this.setData({ analysisResult: result.response });
        wx.hideLoading();
      })
      .catch(error => {
        console.error('分析图片失败:', error);
        wx.hideLoading();
        wx.showToast({ title: '分析失败', icon: 'none' });
      });
  },
  
  generateSimilarImage() {
    if (!this.data.analysisResult) {
      wx.showToast({ title: '请先分析图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    app.callZhipuAPI('cogview3/generate', {
      model: 'cogview-3-plus',
      prompt: this.data.analysisResult
    })
    .then(result => {
      this.setData({ generatedImage: result.image_url });
      wx.hideLoading();
    })
    .catch(error => {
      console.error('生成图片失败:', error);
      wx.hideLoading();
      wx.showToast({ title: '生成失败', icon: 'none' });
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
          const data = JSON.parse(res.data);
          resolve(data.url);
        },
        fail: reject
      });
    });
  }
});