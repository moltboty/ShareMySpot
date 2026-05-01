// ========================================
// ShareMySpot — Pure utility helpers
// ========================================

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Utils = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function onlyDigits(value) {
    return String(value || '').replace(/[^0-9]/g, '');
  }

  function normalizePhoneForWhatsApp(value) {
    var digits = onlyDigits(value);
    if (!digits) return '';

    // Saudi local format: 05xxxxxxxx -> 9665xxxxxxxx
    if (digits.length === 10 && digits.indexOf('05') === 0) {
      return '966' + digits.slice(1);
    }

    // Saudi without leading zero: 5xxxxxxxx -> 9665xxxxxxxx
    if (digits.length === 9 && digits.indexOf('5') === 0) {
      return '966' + digits;
    }

    // Some users paste 00966...
    if (digits.indexOf('00') === 0) {
      return digits.slice(2);
    }

    return digits;
  }

  function buildWhatsAppUrl(phone, message) {
    var normalized = normalizePhoneForWhatsApp(phone);
    if (!normalized) return '';
    var url = 'https://wa.me/' + normalized;
    if (message) url += '?text=' + encodeURIComponent(message);
    return url;
  }

  function extractMapsUrl(text) {
    var input = String(text || '').trim();
    if (!input) return '';

    var match = input.match(/https?:\/\/(?:www\.)?(?:maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[^\s]+|google\.[^\s]+\/maps)[^\s]*/i);
    if (match) return match[0].replace(/[),.]+$/, '');

    var coords = input.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
    if (coords) return 'https://maps.google.com/?q=' + coords[1] + ',' + coords[2];

    return input.indexOf('http') === 0 ? input : '';
  }

  function buildQuickMessage(data) {
    data = data || {};
    var greeting = (data.greeting || 'السلام عليكم 👋').trim();
    var mapsUrl = extractMapsUrl(data.mapsText || data.mapsUrl || '');
    var door = String(data.door || '').trim();
    var note = String(data.note || '').trim();

    var message = greeting + '\n\n';
    if (mapsUrl) message += '📍 الموقع:\n' + mapsUrl + '\n\n';
    if (door) message += '🏠 رقم الباب / الشقة / الفيلا:\n' + door + '\n\n';
    if (note) message += 'ℹ️ ملاحظة:\n' + note;
    return message.trim();
  }

  return {
    normalizePhoneForWhatsApp: normalizePhoneForWhatsApp,
    buildWhatsAppUrl: buildWhatsAppUrl,
    extractMapsUrl: extractMapsUrl,
    buildQuickMessage: buildQuickMessage
  };
});
