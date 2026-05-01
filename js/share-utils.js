// ========================================
// ShareMySpot — Pure share helpers
// ========================================

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ShareMySpotShareUtils = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function getShareImages(loc) {
    if (!loc) return [];
    if (Array.isArray(loc.images) && loc.images.length) {
      return loc.images
        .filter(function (img) { return img && (img.dataUrl || typeof img === 'string'); })
        .slice(0, 2)
        .map(function (img, index) {
          if (typeof img === 'string') return { dataUrl: img, name: 'location-' + (index + 1) + '.jpg' };
          return { dataUrl: img.dataUrl, name: img.name || ('location-' + (index + 1) + '.jpg') };
        });
    }
    return loc.image ? [{ dataUrl: loc.image, name: loc.imageName || 'location.jpg' }] : [];
  }

  function buildCardText(options) {
    options = options || {};
    var loc = options.loc || {};
    var greeting = options.greeting || 'مرحباً! Hello! 👋';
    var message = greeting + '\n\n';
    if (loc.name) message += '🏠 Card / البطاقة:\n' + loc.name + '\n\n';
    message += '📍 Location / الموقع:\n' + (loc.mapsUrl || '') + '\n\n';
    if (loc.doorNumber) message += '🚪 Door/Home details / تفاصيل الباب:\n' + loc.doorNumber + '\n\n';
    if (loc.instructions || loc.instructionsAr) {
      message += 'ℹ️ Instructions / التعليمات:\n';
      if (loc.instructions) message += loc.instructions;
      if (loc.instructions && loc.instructionsAr) message += ' / ';
      if (loc.instructionsAr) message += loc.instructionsAr;
    }
    return message.trim();
  }

  return {
    getShareImages: getShareImages,
    buildCardText: buildCardText
  };
});
