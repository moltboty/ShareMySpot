// ========================================
// ShareMySpot — Internationalization
// ========================================

var I18n = (function () {
  'use strict';

  var translations = {
    en: {
      appName: 'ShareMySpot',
      appNameAr: 'شارك موقعي',
      addLocation: 'Add Location',
      editLocation: 'Edit Location',
      emptyState: 'Tap + to add your first location',
      shareWhatsApp: 'Share to WhatsApp',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      locationName: 'Location Name (English)',
      locationNameAr: 'Location Name (Arabic)',
      useMyLocation: 'Use My Location',
      latitude: 'Latitude',
      longitude: 'Longitude',
      mapsPreview: 'Will open',
      doorPhoto: 'Door/Building Photo',
      changePhoto: 'Change Photo',
      removePhoto: 'Remove',
      apartment: 'Apartment/Door Number (English)',
      apartmentAr: 'Apartment/Door Number (Arabic)',
      instructions: 'Instructions (English)',
      instructionsAr: 'Instructions (Arabic)',
      settings: 'Settings',
      language: 'Language',
      greeting: 'Custom Greeting',
      greetingDefault: 'مرحباً! Hello! 👋',
      about: 'About',
      aboutText: 'ShareMySpot lets you save and share your locations to WhatsApp with one tap.',
      deleteConfirm: 'Delete this location?',
      locating: 'Getting your location...',
      locationError: 'Could not get your location. Please enter manually.',
      copied: 'Message copied to clipboard!',
      shareError: 'Could not share. Message copied to clipboard instead.',
      required: 'Please fill in the required fields.',
      gpsRequired: 'Please set GPS coordinates.',
      optional: 'Optional',
      locationInfo: 'Location Info',
      gpsSection: 'GPS Coordinates',
      photoSection: 'Photo',
      detailsSection: 'Details',
      tapToAddPhoto: 'Tap to add photo',
      mapLocation: 'Map Location',
      doorSection: 'Door / Apartment / Villa',
      locationSaved: 'Location saved'
    },
    ar: {
      appName: 'شارك موقعي',
      appNameAr: 'ShareMySpot',
      addLocation: 'إضافة موقع',
      editLocation: 'تعديل الموقع',
      emptyState: 'اضغط + لإضافة أول موقع',
      shareWhatsApp: 'مشاركة عبر واتساب',
      edit: 'تعديل',
      delete: 'حذف',
      save: 'حفظ',
      cancel: 'إلغاء',
      locationName: 'اسم الموقع (إنجليزي)',
      locationNameAr: 'اسم الموقع (عربي)',
      useMyLocation: 'استخدم موقعي',
      latitude: 'خط العرض',
      longitude: 'خط الطول',
      mapsPreview: 'سيفتح',
      doorPhoto: 'صورة الباب/المبنى',
      changePhoto: 'تغيير الصورة',
      removePhoto: 'إزالة',
      apartment: 'رقم الشقة/الباب (إنجليزي)',
      apartmentAr: 'رقم الشقة/الباب (عربي)',
      instructions: 'التعليمات (إنجليزي)',
      instructionsAr: 'التعليمات (عربي)',
      settings: 'الإعدادات',
      language: 'اللغة',
      greeting: 'رسالة الترحيب',
      greetingDefault: 'مرحباً! Hello! 👋',
      about: 'حول التطبيق',
      aboutText: 'شارك موقعي يتيح لك حفظ ومشاركة مواقعك عبر واتساب بنقرة واحدة.',
      deleteConfirm: 'هل تريد حذف هذا الموقع؟',
      locating: 'جاري تحديد موقعك...',
      locationError: 'تعذر تحديد موقعك. يرجى الإدخال يدوياً.',
      copied: 'تم نسخ الرسالة!',
      shareError: 'تعذرت المشاركة. تم نسخ الرسالة بدلاً من ذلك.',
      required: 'يرجى تعبئة الحقول المطلوبة.',
      gpsRequired: 'يرجى تحديد إحداثيات GPS.',
      optional: 'اختياري',
      locationInfo: 'معلومات الموقع',
      gpsSection: 'إحداثيات GPS',
      photoSection: 'الصورة',
      detailsSection: 'التفاصيل',
      tapToAddPhoto: 'اضغط لإضافة صورة',
      mapLocation: 'موقع الخريطة',
      doorSection: 'رقم الباب / الشقة / الفيلا',
      locationSaved: 'تم حفظ الموقع'
    }
  };

  var currentLang = 'en';

  function setLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || key;
  }

  function getLang() {
    return currentLang;
  }

  return { setLang: setLang, t: t, getLang: getLang };
})();
