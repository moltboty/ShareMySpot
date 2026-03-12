// ========================================
// ShareMySpot — Main App Logic
// ========================================

var App = (function () {
  'use strict';

  var currentView = 'list';
  var editingId = null;
  var currentImageData = null;
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  // --- Init ---

  function init() {
    var settings = Storage.getSettings();
    I18n.setLang(settings.lang);
    if (settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    renderCurrentView();
  }

  // --- Toast ---

  function showToast(msg) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
  }

  // --- Theme ---

  function toggleTheme() {
    var settings = Storage.getSettings();
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      settings.theme = 'light';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      settings.theme = 'dark';
    }
    Storage.saveSettings(settings);
    renderCurrentView();
  }

  function getThemeIcon() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  }

  // --- Views ---

  function showView(view, id) {
    currentView = view;
    editingId = id || null;
    renderCurrentView();
  }

  function renderCurrentView() {
    var app = document.getElementById('app');
    switch (currentView) {
      case 'list': app.innerHTML = renderList(); bindListEvents(); break;
      case 'form': app.innerHTML = renderForm(); bindFormEvents(); break;
      case 'settings': app.innerHTML = renderSettings(); bindSettingsEvents(); break;
    }
  }

  // --- List View ---

  function renderList() {
    var t = I18n.t;
    var lang = I18n.getLang();
    var locations = Storage.getLocations();

    var html = '<div class="view-list">';
    html += '<header class="app-header"><div class="header-top">';
    html += '<h1 class="app-title">' + t('appName') + ' <span class="app-title-sub">/ ' + t('appNameAr') + '</span></h1>';
    html += '<div class="header-actions">';
    html += '<button class="theme-toggle" id="btn-theme">' + getThemeIcon() + '</button>';
    html += '<button class="btn-icon" id="btn-lang">' + (lang === 'en' ? 'عر' : 'EN') + '</button>';
    html += '<button class="btn-icon" id="btn-settings">⚙️</button>';
    html += '</div></div></header>';

    if (locations.length === 0) {
      html += '<div class="empty-state"><div class="empty-icon">📍</div>';
      html += '<p>' + t('emptyState') + '</p></div>';
    } else {
      html += '<div class="location-cards">';
      for (var i = 0; i < locations.length; i++) {
        var loc = locations[i];
        var name = loc.name;

        html += '<div class="location-card">';
        if (loc.image) {
          html += '<div class="card-thumb"><img src="' + loc.image + '" alt=""></div>';
        }
        html += '<div class="card-body">';
        html += '<div class="card-header"><div>';
        html += '<h3 class="card-name">' + escapeHtml(name) + '</h3>';
        if (loc.doorNumber) {
          html += '<span class="card-coords">🏠 ' + escapeHtml(loc.doorNumber) + '</span>';
        }
        html += '</div>';
        html += '<div class="card-actions">';
        html += '<button class="btn-sm btn-edit" data-id="' + loc.id + '">✏️</button>';
        html += '<button class="btn-sm btn-delete" data-id="' + loc.id + '">🗑️</button>';
        html += '</div></div>';
        html += '</div>';
        html += '<button class="btn-share" data-id="' + loc.id + '">📤 ' + t('shareWhatsApp') + '</button>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Install app button
    html += '<div class="install-section">';
    html += '<button class="btn-install" id="btn-install">📲 ' + t('installApp') + '</button>';
    html += '</div>';

    // Privacy notice
    html += '<div class="privacy-notice">';
    html += '<p>🔒 ' + t('privacyNotice') + '</p>';
    html += '</div>';

    html += '<button class="fab" id="btn-add">+</button>';
    html += '</div>';
    return html;
  }

  function bindListEvents() {
    document.getElementById('btn-add').addEventListener('click', function () { showView('form'); });
    document.getElementById('btn-settings').addEventListener('click', function () { showView('settings'); });
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);

    document.getElementById('btn-install').addEventListener('click', function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
      } else {
        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          showToast(I18n.t('installIOS'));
        } else {
          showToast(I18n.t('installAndroid'));
        }
      }
    });

    document.getElementById('btn-lang').addEventListener('click', function () {
      var settings = Storage.getSettings();
      settings.lang = settings.lang === 'en' ? 'ar' : 'en';
      Storage.saveSettings(settings);
      I18n.setLang(settings.lang);
      renderCurrentView();
    });

    var shareBtns = document.querySelectorAll('.btn-share');
    for (var i = 0; i < shareBtns.length; i++) {
      shareBtns[i].addEventListener('click', function () {
        Share.shareLocation(this.getAttribute('data-id'));
      });
    }

    var editBtns = document.querySelectorAll('.btn-edit');
    for (var j = 0; j < editBtns.length; j++) {
      editBtns[j].addEventListener('click', function () {
        showView('form', this.getAttribute('data-id'));
      });
    }

    var delBtns = document.querySelectorAll('.btn-delete');
    for (var k = 0; k < delBtns.length; k++) {
      delBtns[k].addEventListener('click', function () {
        if (confirm(I18n.t('deleteConfirm'))) {
          Storage.deleteLocation(this.getAttribute('data-id'));
          renderCurrentView();
        }
      });
    }
  }

  // --- Form View ---

  function renderForm() {
    var t = I18n.t;
    var isEdit = !!editingId;
    var loc = isEdit ? Storage.getLocationById(editingId) : {};
    currentImageData = (loc && loc.image) || null;

    var html = '<div class="view-form">';
    html += '<header class="app-header">';
    html += '<button class="btn-back" id="btn-back">←</button>';
    html += '<h1 class="app-title">' + (isEdit ? t('editLocation') : t('addLocation')) + '</h1>';
    html += '</header>';

    html += '<form id="location-form" class="form">';

    // Location name
    html += '<div class="form-section">';
    html += '<div class="form-section-title">' + t('locationInfo') + '</div>';
    html += '<div class="form-group">';
    html += bilingualLabel('Location Name', 'اسم الموقع', true);
    html += '<input type="text" id="f-name" placeholder="e.g. Home / البيت" value="' + escapeAttr(loc.name || '') + '" required>';
    html += '</div>';
    html += '</div>';

    // Map location
    html += '<div class="form-section">';
    html += '<div class="form-section-title">' + t('mapLocation') + '</div>';
    html += '<div class="form-group">';
    html += '<button type="button" class="btn-gps" id="btn-gps">📍 ' + t('useMyLocation') + '</button>';
    html += '<input type="hidden" id="f-lat" value="' + (loc.lat || '') + '">';
    html += '<input type="hidden" id="f-lng" value="' + (loc.lng || '') + '">';
    html += '<p class="gps-preview" id="gps-preview"></p>';
    html += '</div>';
    html += '</div>';

    // Door photo
    html += '<div class="form-section">';
    html += '<div class="form-section-title">' + t('photoSection') + '</div>';
    html += '<div class="form-group">';
    html += '<input type="file" id="f-image" accept="image/*" style="display:none">';
    if (currentImageData) {
      html += '<div class="image-preview" id="image-preview">';
      html += '<img src="' + currentImageData + '" alt="">';
      html += '<div class="image-actions">';
      html += '<button type="button" class="btn-sm" id="btn-change-photo">' + t('changePhoto') + '</button>';
      html += '<button type="button" class="btn-sm btn-danger" id="btn-remove-photo">' + t('removePhoto') + '</button>';
      html += '</div></div>';
    } else {
      html += '<div class="image-upload" id="image-upload">';
      html += '<button type="button" class="btn-upload" id="btn-upload">📷 ' + t('tapToAddPhoto') + '</button>';
      html += '</div>';
      html += '<div class="image-preview" id="image-preview" style="display:none">';
      html += '<img src="" alt="">';
      html += '<div class="image-actions">';
      html += '<button type="button" class="btn-sm" id="btn-change-photo">' + t('changePhoto') + '</button>';
      html += '<button type="button" class="btn-sm btn-danger" id="btn-remove-photo">' + t('removePhoto') + '</button>';
      html += '</div></div>';
    }
    html += '</div>';
    html += '</div>';

    // Door/apartment number
    html += '<div class="form-section">';
    html += '<div class="form-section-title">' + t('doorSection') + '</div>';
    html += '<div class="form-group">';
    html += bilingualLabel('Door / Apartment / Villa No.', 'رقم الباب / الشقة / الفيلا', false);
    html += '<input type="text" id="f-doorNumber" placeholder="e.g. Villa 12 / فيلا 12" value="' + escapeAttr(loc.doorNumber || '') + '">';
    html += '</div>';
    html += '</div>';

    // Buttons
    html += '<div class="form-buttons">';
    html += '<button type="submit" class="btn-save">💾 ' + t('save') + '</button>';
    html += '<button type="button" class="btn-cancel" id="btn-cancel">' + t('cancel') + '</button>';
    html += '</div>';

    html += '</form></div>';
    return html;
  }

  function bilingualLabel(en, ar, required) {
    var html = '<div class="form-label">';
    html += '<span class="label-en">' + en;
    if (required) html += ' <span class="required">*</span>';
    html += '</span>';
    html += '<span class="label-ar">' + ar + '</span>';
    html += '</div>';
    return html;
  }

  function bindFormEvents() {
    var form = document.getElementById('location-form');
    var btnBack = document.getElementById('btn-back');
    var btnCancel = document.getElementById('btn-cancel');
    var btnGps = document.getElementById('btn-gps');
    var fLat = document.getElementById('f-lat');
    var fLng = document.getElementById('f-lng');
    var fImage = document.getElementById('f-image');

    updateGpsPreview();

    btnBack.addEventListener('click', function () { showView('list'); });
    btnCancel.addEventListener('click', function () { showView('list'); });

    // GPS
    btnGps.addEventListener('click', function () {
      if (!navigator.geolocation) {
        showToast(I18n.t('locationError'));
        return;
      }
      btnGps.textContent = '⏳ ' + I18n.t('locating');
      btnGps.disabled = true;
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          fLat.value = pos.coords.latitude.toFixed(6);
          fLng.value = pos.coords.longitude.toFixed(6);
          updateGpsPreview();
          btnGps.textContent = '✅ ' + I18n.t('locationSaved');
          btnGps.disabled = false;
        },
        function () {
          showToast(I18n.t('locationError'));
          btnGps.textContent = '📍 ' + I18n.t('useMyLocation');
          btnGps.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    // Image
    var btnUpload = document.getElementById('btn-upload');
    var btnChange = document.getElementById('btn-change-photo');
    var btnRemove = document.getElementById('btn-remove-photo');
    var imagePreview = document.getElementById('image-preview');
    var imageUpload = document.getElementById('image-upload');

    function triggerUpload() { fImage.click(); }
    if (btnUpload) btnUpload.addEventListener('click', triggerUpload);
    if (btnChange) btnChange.addEventListener('click', triggerUpload);
    if (btnRemove) {
      btnRemove.addEventListener('click', function () {
        currentImageData = null;
        fImage.value = '';
        imagePreview.style.display = 'none';
        if (imageUpload) imageUpload.style.display = '';
      });
    }

    fImage.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        Share.handleImageUpload(this.files[0]).then(function (dataUrl) {
          currentImageData = dataUrl;
          imagePreview.querySelector('img').src = dataUrl;
          imagePreview.style.display = '';
          if (imageUpload) imageUpload.style.display = 'none';
        });
      }
    });

    // Save
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var lat = parseFloat(fLat.value);
      var lng = parseFloat(fLng.value);

      if (!name) { showToast(I18n.t('required')); return; }
      if (isNaN(lat) || isNaN(lng)) { showToast(I18n.t('gpsRequired')); return; }

      var data = {
        name: name,
        nameAr: name,
        lat: lat,
        lng: lng,
        mapsUrl: 'https://maps.google.com/?q=' + lat + ',' + lng,
        doorNumber: document.getElementById('f-doorNumber').value.trim(),
        instructions: '',
        instructionsAr: '',
        image: currentImageData,
        imageName: currentImageData ? 'location.jpg' : null
      };

      if (editingId) {
        Storage.updateLocation(editingId, data);
      } else {
        Storage.addLocation(data);
      }

      showView('list');
    });
  }

  function updateGpsPreview() {
    var lat = document.getElementById('f-lat').value;
    var lng = document.getElementById('f-lng').value;
    var preview = document.getElementById('gps-preview');
    if (lat && lng) {
      preview.textContent = '✅ ' + I18n.t('locationSaved') + ' — ' + parseFloat(lat).toFixed(4) + ', ' + parseFloat(lng).toFixed(4);
    } else {
      preview.textContent = '';
    }
  }

  // --- Settings View ---

  function renderSettings() {
    var t = I18n.t;
    var settings = Storage.getSettings();

    var html = '<div class="view-settings">';
    html += '<header class="app-header">';
    html += '<button class="btn-back" id="btn-back">←</button>';
    html += '<h1 class="app-title">' + t('settings') + '</h1>';
    html += '</header>';

    html += '<div class="settings-list">';
    html += '<div class="settings-card">';

    html += '<div class="setting-item">';
    html += '<label>' + t('language') + '</label>';
    html += '<select id="s-lang">';
    html += '<option value="en"' + (settings.lang === 'en' ? ' selected' : '') + '>English</option>';
    html += '<option value="ar"' + (settings.lang === 'ar' ? ' selected' : '') + '>العربية</option>';
    html += '</select></div>';

    html += '<div class="setting-item">';
    html += '<label>' + t('greeting') + '</label>';
    html += '<input type="text" id="s-greeting" value="' + escapeAttr(settings.greeting) + '">';
    html += '</div>';

    html += '</div>';

    html += '<div class="settings-card">';
    html += '<div class="setting-item about">';
    html += '<label>' + t('about') + '</label>';
    html += '<p>' + t('aboutText') + '</p>';
    html += '</div></div>';

    html += '</div></div>';
    return html;
  }

  function bindSettingsEvents() {
    document.getElementById('btn-back').addEventListener('click', function () { showView('list'); });

    document.getElementById('s-lang').addEventListener('change', function () {
      var settings = Storage.getSettings();
      settings.lang = this.value;
      Storage.saveSettings(settings);
      I18n.setLang(this.value);
      renderCurrentView();
    });

    document.getElementById('s-greeting').addEventListener('input', function () {
      var settings = Storage.getSettings();
      settings.greeting = this.value;
      Storage.saveSettings(settings);
    });
  }

  // --- Helpers ---

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return { init: init, showToast: showToast };
})();

document.addEventListener('DOMContentLoaded', App.init);
