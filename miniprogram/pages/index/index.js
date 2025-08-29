Page({
  data:{
   imageSrc: '',
   showCropper: false,
   croppedImage: ''
 },

 chooseImage() {
   wx.chooseImage({
     count: 1,
     success: (res) => {
       this.setData({
         imageSrc: res.tempFilePaths[0],
         showCropper: true
       });
     }
   });
 },

 onConfirmCrop() {
   const cropper = this.selectComponent('#cropper');
   if (cropper) {
     cropper.getCropperImage();
   } else {
     console.error('未找到裁剪组件');
     wx.showToast({ title: '组件未找到', icon: 'error' });
   }
 },

 onCancelCrop() {
   this.setData({ showCropper: false });
 },

 onCropConfirm(e) {
   const tempFilePath = e.detail.tempFilePath;
   this.setData({
     croppedImage: tempFilePath,
     showCropper: false
   });
   wx.showToast({ title: '裁剪成功' });
 },

 onCropCancel() {
   this.setData({ showCropper: false });
   wx.showToast({ title: '已取消', icon: 'none' });
 }
});