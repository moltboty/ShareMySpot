// ========================================
// ShareMySpot — Web Share API Logic
// ========================================

var Share = (function () {
  'use strict';

  function dataURLtoFile(dataURL, filename) {
    var arr = dataURL.split(',');
    var mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
  }

  function buildMessage(loc) {
    var settings = Storage.getSettings();
    var message = settings.greeting + '\n\n';
    message += '📍 Location / الموقع:\n' + loc.mapsUrl + '\n\n';

    if (loc.doorNumber) {
      message += '🏠 Door/Apt / رقم الباب:\n' + loc.doorNumber + '\n\n';
    }

    if (loc.instructions || loc.instructionsAr) {
      message += 'ℹ️ Instructions / التعليمات:\n';
      if (loc.instructions) message += loc.instructions;
      if (loc.instructions && loc.instructionsAr) message += ' / ';
      if (loc.instructionsAr) message += loc.instructionsAr;
    }

    return message;
  }

  async function shareLocation(locationId) {
    var loc = Storage.getLocationById(locationId);
    if (!loc) return;

    var message = buildMessage(loc);
    var shareData = { text: message };

    // Add image if exists
    if (loc.image) {
      var file = dataURLtoFile(loc.image, loc.imageName || 'location.jpg');
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      }
    }

    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(message);
          App.showToast(I18n.t('copied'));
        } catch (clipErr) {
          App.showToast(I18n.t('shareError'));
        }
      }
    }
  }

  function handleImageUpload(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var canvas = document.createElement('canvas');
          var MAX_WIDTH = 800;
          var width = img.width;
          var height = img.height;
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function copyLocation(locationId) {
    var loc = Storage.getLocationById(locationId);
    if (!loc) return;
    var message = buildMessage(loc);
    try {
      await navigator.clipboard.writeText(message);
      App.showToast(I18n.t('copied'));
    } catch (err) {
      App.showToast(I18n.t('shareError'));
    }
  }

  return {
    shareLocation: shareLocation,
    copyLocation: copyLocation,
    handleImageUpload: handleImageUpload
  };
})();
