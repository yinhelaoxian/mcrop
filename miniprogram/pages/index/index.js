// pages/index/index.js
Page({
  data:{
   // 图片路径
   imageSrc: '',
   // 是否显示裁剪组件
   showCropper: false,
   // 裁剪后的图片路径
   croppedImage: '',
   // we-cropper 组件的配置选项
   cropperOpt: {
     id: 'cropper',             // canvas-id
     targetId: 'targetCropper',  // 目标 canvas-id
     pixelRatio: 1,              // 像素比，初始化时会更新
     width: 750,                 // 画布宽度 (px)
     height: 750,                // 画布高度 (px)
     scale: 2.5,                 // 缩放倍数
     zoom: 8,                    // 缩放步长
     cut: {
       x: 150,                   // 裁剪框 x 坐标
       y: 150,                   // 裁剪框 y 坐标
       width: 450,               // 裁剪框宽度
       height: 450               // 裁剪框高度
     }
   }
 },

 // 页面加载时获取设备信息
 onLoad() {
   const { pixelRatio } = wx.getSystemInfoSync();
   // 更新 cropperOpt 中的 pixelRatio
   this.setData({
     'cropperOpt.pixelRatio': pixelRatio
   });
 },

 // 选择图片
 chooseImage() {
   wx.chooseImage({
     count: 1,
     sizeType: ['original', 'compressed'],
     sourceType: ['album', 'camera'],
     success: (res) => {
       // 设置图片路径
       this.setData({
         imageSrc: res.tempFilePaths[0],
         showCropper: true
       }, () => {
         // 数据更新后，初始化 we-cropper
         this.initCropper();
       });
     }
   });
 },

 // 初始化 we-cropper
 initCropper() {
   const { imageSrc, cropperOpt } = this.data;
   if (!this.cropper) {
     const cropper = new WeCropper(cropperOpt)
       .on('ready', (ctx) => {
         console.log(`we-cropper is ready`);
         cropper.updateCanvas(imageSrc);
       })
       .on('beforeDraw', (ctx) => {
         // 绘制前的回调，可以在这里做些处理
       })
       .on('imgLoad', (ctx) => {
         console.log(`图片已加载`);
         // 图片加载完成后可以进行其他操作
       })
       .on('error', (err) => {
         console.error('we-cropper error:', err);
         wx.showToast({ title: '组件初始化失败', icon: 'error' });
       });
     this.cropper = cropper;
   } else {
     // 如果已存在，则更新图片
     this.cropper.updateCanvas(imageSrc);
   }
 },

 // 确定裁剪
 onConfirmCrop() {
   if (!this.cropper) {
     wx.showToast({ title: '请先选择图片', icon: 'none' });
     return;
   }

   // 裁剪并获取图片
   this.cropper.getCropperImage((tempFilePath) => {
     console.log('裁剪成功:', tempFilePath);
     this.setData({
       croppedImage: tempFilePath,
       showCropper: false
     });
     wx.previewImage({
       urls: [tempFilePath]
     });
   }, 'png'); // 可以是 'png' 或 'jpg'
 },

 // 取消裁剪
 onCancelCrop() {
   this.setData({
     showCropper: false,
     croppedImage: ''
   });
 }
});