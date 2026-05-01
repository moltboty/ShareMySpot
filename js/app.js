// ========================================
// ShareMySpot — Main App Logic
// ========================================

var App = (function () {
  'use strict';

  var currentView = 'list';
  var editingId = null;
  var currentImageData = null;
  var currentImagesData = [];
  var deferredPrompt = null;
  var wizardStep = 0;
  var wizardData = {};

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button if hidden
    var installBtn = document.getElementById('btn-install');
    if (installBtn) installBtn.style.display = '';
  });

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }

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
      case 'wizard': app.innerHTML = renderWizard(); bindWizardEvents(); break;
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
    html += '<img src="icons/icon-192.png" class="header-logo" alt="">';
    html += '<h1 class="app-title">' + t('appName') + ' <span class="app-title-sub">/ ' + t('appNameAr') + '</span><span class="release-badge">FULL CARD v16</span></h1>';
    html += '<div class="header-actions">';
    html += '<button class="theme-toggle" id="btn-theme">' + getThemeIcon() + '</button>';
    html += '<button class="btn-icon" id="btn-lang">' + (lang === 'en' ? 'عر' : 'EN') + '</button>';
    html += '<button class="btn-icon" id="btn-settings">⚙️</button>';
    html += '</div></div></header>';

    if (locations.length === 0) {
      html += renderAddHomeCard();
    }
    html += renderQuickActions();

    if (locations.length === 0) {
      html += '<div class="empty-state"><img src="icons/icon-192.png" class="empty-logo" alt="">';
      html += '<p>ابدأ بإضافة موقعك أو افتح واتساب برقم بدون حفظه</p>';
      html += '<p class="empty-sub">Add a saved place, or start a WhatsApp chat without saving the number.</p></div>';
    } else {
      html += '<div class="location-cards">';
      for (var i = 0; i < locations.length; i++) {
        var loc = locations[i];
        var name = loc.name;

        html += '<div class="location-card">';
        // Map preview
        if (loc.lat && loc.lng) {
          html += '<div class="card-map" id="card-map-' + loc.id + '" data-lat="' + loc.lat + '" data-lng="' + loc.lng + '"></div>';
        }
        var locImages = getStoredImages(loc);
        if (locImages.length) {
          html += '<div class="card-thumbs">';
          for (var imgIdx = 0; imgIdx < locImages.length; imgIdx++) {
            html += '<div class="card-thumb"><img src="' + (locImages[imgIdx].dataUrl || locImages[imgIdx]) + '" alt=""></div>';
          }
          html += '</div>';
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
        html += '<div class="card-buttons">';
        html += '<button class="btn-share" data-id="' + loc.id + '">📤 Share full card + photos</button>';
        html += '<button class="btn-copy" data-id="' + loc.id + '">📋 Backup copy/download</button>';
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';
    }

    if (!isStandalone()) {
      // Show install button only in browser
      html += '<div class="install-section">';
      html += '<button class="btn-install" id="btn-install">📲 ' + t('installApp') + '</button>';
      html += '</div>';
    }

    // Privacy notice
    html += '<div class="privacy-notice">';
    html += '<p>🔒 ' + t('privacyNotice') + '</p>';
    html += '</div>';

    // Primary + button should always be visible. Browser users must be able to start without installing first.
    html += '<button class="fab" id="btn-add" aria-label="Add location">+</button>';
    html += '</div>';
    return html;
  }

  function renderAddHomeCard() {
    var html = '<section class="add-home-card">';
    html += '<div class="add-home-icon">🏠</div>';
    html += '<h2>Create your Home card / أضف بطاقة البيت</h2>';
    html += '<p><b>Working flow:</b> search/pin your home, add 2 photos, save, then tap <b>Share full card + photos</b>. It shares an image card + original photos + map text.</p>';
    html += '<button class="btn-save add-home-btn" id="btn-add-home">+ Add Home Card</button>';
    html += '</section>';
    return html;
  }

  function renderQuickActions() {
    var html = '<section class="quick-card" aria-label="Quick WhatsApp tools">';
    html += '<div class="quick-header"><div><span class="quick-kicker">Quick send</span><h2>واتساب بدون حفظ الرقم</h2><p>Paste a number, optional map link and door details, then open WhatsApp.</p></div></div>';
    html += '<label class="quick-label" for="quick-phone">رقم الجوال / WhatsApp number</label>';
    html += '<input class="quick-input" id="quick-phone" inputmode="tel" autocomplete="tel" placeholder="مثال 0501234567">';
    html += '<label class="quick-label" for="quick-map">رابط Google Maps أو الإحداثيات</label>';
    html += '<textarea class="quick-input quick-area" id="quick-map" rows="2" placeholder="Paste Google Maps link or 24.7136,46.6753"></textarea>';
    html += '<label class="quick-label" for="quick-door">رقم الباب / الشقة / الفيلا</label>';
    html += '<input class="quick-input" id="quick-door" placeholder="مثال Villa 12 / فيلا 12">';
    html += '<label class="quick-label" for="quick-note">ملاحظة اختيارية</label>';
    html += '<input class="quick-input" id="quick-note" placeholder="مثال اتصل إذا وصلت">';
    html += '<div class="quick-actions">';
    html += '<button class="quick-primary" id="quick-open">فتح واتساب</button>';
    html += '<button class="btn-copy quick-secondary" id="quick-copy">نسخ الرسالة</button>';
    html += '</div>';
    html += '<p class="quick-hint">الرقم لا ينحفظ. البيانات تبقى على جهازك.</p>';
    html += '</section>';
    return html;
  }

  function initCardMaps() {
    var mapEls = document.querySelectorAll('.card-map');
    for (var i = 0; i < mapEls.length; i++) {
      var el = mapEls[i];
      var lat = parseFloat(el.getAttribute('data-lat'));
      var lng = parseFloat(el.getAttribute('data-lng'));
      if (!isNaN(lat) && !isNaN(lng)) {
        var map = L.map(el, {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false
        }).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([lat, lng]).addTo(map);
      }
    }
  }

  function bindListEvents() {
    initCardMaps();
    bindQuickActions();
    function startWizard() {
      wizardStep = 0;
      wizardData = {};
      currentImageData = null;
      currentImagesData = [];
      currentView = 'wizard';
      renderCurrentView();
    }
    var btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.addEventListener('click', startWizard);
    var btnAddHome = document.getElementById('btn-add-home');
    if (btnAddHome) btnAddHome.addEventListener('click', startWizard);
    document.getElementById('btn-settings').addEventListener('click', function () { showView('settings'); });
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);

    var btnInstall = document.getElementById('btn-install');
    if (btnInstall) btnInstall.addEventListener('click', handleInstallClick);

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

    var copyBtns = document.querySelectorAll('.btn-copy');
    for (var c = 0; c < copyBtns.length; c++) {
      copyBtns[c].addEventListener('click', function () {
        Share.copyLocation(this.getAttribute('data-id'));
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

  function bindQuickActions() {
    var phone = document.getElementById('quick-phone');
    var map = document.getElementById('quick-map');
    var door = document.getElementById('quick-door');
    var note = document.getElementById('quick-note');
    var open = document.getElementById('quick-open');
    var copy = document.getElementById('quick-copy');
    if (!phone || !open || !copy) return;

    function getMessage() {
      return Utils.buildQuickMessage({
        greeting: Storage.getSettings().greeting,
        mapsText: map.value,
        door: door.value,
        note: note.value
      });
    }

    open.addEventListener('click', function () {
      var url = Utils.buildWhatsAppUrl(phone.value, getMessage());
      if (!url) {
        showToast('أدخل رقم واتساب أولاً');
        phone.focus();
        return;
      }
      window.open(url, '_blank', 'noopener');
    });

    copy.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText(getMessage());
        showToast(I18n.t('copied'));
      } catch (err) {
        showToast(I18n.t('shareError'));
      }
    });
  }

  // --- Install Handling ---

  function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
    } else {
      showInstallModal();
    }
  }

  function showInstallModal() {
    var existing = document.querySelector('.install-modal-overlay');
    if (existing) existing.remove();

    var t = I18n.t;
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var overlay = document.createElement('div');
    overlay.className = 'install-modal-overlay';

    var html = '<div class="install-modal">';
    html += '<div class="install-modal-header">';
    html += '<span class="install-modal-icon">📲</span>';
    html += '<h2>' + t('installApp') + '</h2>';
    html += '</div>';
    html += '<div class="install-modal-body">';

    if (isIOS) {
      html += '<div class="install-step"><span class="step-num">1</span><p>' + t('installIOSStep1') + '</p></div>';
      html += '<div class="install-step"><span class="step-num">2</span><p>' + t('installIOSStep2') + '</p></div>';
      html += '<div class="install-step"><span class="step-num">3</span><p>' + t('installIOSStep3') + '</p></div>';
    } else {
      html += '<div class="install-step"><span class="step-num">1</span><p>' + t('installAndroidStep1') + '</p></div>';
      html += '<div class="install-step"><span class="step-num">2</span><p>' + t('installAndroidStep2') + '</p></div>';
    }

    html += '</div>';
    html += '<button class="install-modal-close" id="install-modal-close">' + t('gotIt') + '</button>';
    html += '</div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    setTimeout(function () { overlay.classList.add('show'); }, 10);

    document.getElementById('install-modal-close').addEventListener('click', function () {
      overlay.classList.remove('show');
      setTimeout(function () { overlay.remove(); }, 300);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 300);
      }
    });
  }

  // --- Wizard View ---

  var WIZARD_STEPS = ['name', 'gps', 'photo', 'door'];

  function renderWizard() {
    var t = I18n.t;
    var step = WIZARD_STEPS[wizardStep];
    var totalSteps = WIZARD_STEPS.length;

    var html = '<div class="view-wizard">';
    html += '<header class="app-header">';
    html += '<button class="btn-back" id="wiz-back">←</button>';
    html += '<h1 class="app-title">' + t('addLocation') + '</h1>';
    html += '</header>';

    // Step dots
    html += '<div class="wiz-dots">';
    for (var d = 0; d < totalSteps; d++) {
      var dotClass = 'wiz-dot';
      if (d < wizardStep) dotClass += ' wiz-dot-done';
      if (d === wizardStep) dotClass += ' wiz-dot-active';
      html += '<div class="' + dotClass + '"><span>' + (d + 1) + '</span></div>';
      if (d < totalSteps - 1) html += '<div class="wiz-dot-line' + (d < wizardStep ? ' wiz-dot-line-done' : '') + '"></div>';
    }
    html += '</div>';

    html += '<div class="wiz-content">';

    if (step === 'name') {
      html += '<div class="wiz-step">';
      html += '<div class="wiz-icon">📝</div>';
      html += '<h2 class="wiz-title">' + t('wizNameTitle') + '</h2>';
      html += '<p class="wiz-subtitle">' + t('wizNameSub') + '</p>';
      html += '<div class="form-group">';
      html += bilingualLabel('Location Name', 'اسم الموقع', true);
      html += '<input type="text" id="wiz-name" placeholder="e.g. Home / البيت" value="' + escapeAttr(wizardData.name || '') + '" autofocus>';
      html += '</div>';
      html += '</div>';
    }

    if (step === 'gps') {
      html += '<div class="wiz-step">';
      html += '<div class="wiz-icon">📍</div>';
      html += '<h2 class="wiz-title">' + t('wizGpsTitle') + '</h2>';
      html += '<p class="wiz-subtitle">' + t('wizGpsSub') + '</p>';
      html += '<div class="map-search-row">';
      html += '<input type="search" class="map-search-input" id="wiz-map-search" placeholder="Search your home, building, compound...">';
      html += '<button type="button" class="map-search-btn" id="wiz-map-search-btn">🔎 Find</button>';
      html += '</div>';
      html += '<button type="button" class="btn-gps wiz-gps-btn" id="wiz-gps">📍 ' + t('useMyLocation') + '</button>';
      html += '<input type="hidden" id="wiz-lat" value="' + (wizardData.lat || '') + '">';
      html += '<input type="hidden" id="wiz-lng" value="' + (wizardData.lng || '') + '">';
      html += '<div class="wiz-map" id="wiz-map"></div>';
      html += '<p class="gps-preview" id="wiz-gps-preview">' + t('wizMapDrag') + '</p>';
      html += '</div>';
    }

    if (step === 'photo') {
      html += '<div class="wiz-step">';
      html += '<div class="wiz-icon">📷</div>';
      html += '<h2 class="wiz-title">' + t('wizPhotoTitle') + '</h2>';
      html += '<p class="wiz-subtitle">' + t('wizPhotoSub') + '</p>';
      html += '<input type="file" id="wiz-image-input" accept="image/*" multiple style="display:none">';
      html += '<button type="button" class="btn-upload wiz-upload-btn" id="wiz-upload">📷 Add up to 2 photos / أضف صورتين</button>';
      html += renderImagePreviewHtml('wiz-image-preview', currentImagesData);
      html += '</div>';
    }

    if (step === 'door') {
      html += '<div class="wiz-step">';
      html += '<div class="wiz-icon">🏠</div>';
      html += '<h2 class="wiz-title">' + t('wizDoorTitle') + '</h2>';
      html += '<p class="wiz-subtitle">' + t('wizDoorSub') + '</p>';
      html += '<div class="form-group">';
      html += bilingualLabel('Door / Apartment / Villa No.', 'رقم الباب / الشقة / الفيلا', false);
      html += '<input type="text" id="wiz-door" placeholder="e.g. Villa 12 / فيلا 12" value="' + escapeAttr(wizardData.doorNumber || '') + '">';
      html += '</div>';
      html += '</div>';
    }

    html += '</div>';

    // Bottom buttons
    html += '<div class="wiz-buttons">';
    if (step === 'door') {
      html += '<button class="btn-save wiz-btn-save" id="wiz-save">💾 ' + t('wizSaveLocation') + '</button>';
    } else {
      html += '<button class="btn-save wiz-btn-next" id="wiz-next">' + t('wizNext') + ' →</button>';
    }
    if (step === 'photo' || step === 'door') {
      html += '<button class="btn-skip wiz-btn-skip" id="wiz-skip">' + t('wizSkip') + '</button>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  }

  function bindWizardEvents() {
    var step = WIZARD_STEPS[wizardStep];
    var t = I18n.t;

    // Back button
    document.getElementById('wiz-back').addEventListener('click', function () {
      if (wizardStep === 0) {
        showView('list');
      } else {
        saveCurrentWizardStep();
        wizardStep--;
        renderCurrentView();
      }
    });

    // Step-specific bindings
    if (step === 'gps') {
      var wLat = document.getElementById('wiz-lat');
      var wLng = document.getElementById('wiz-lng');
      var preview = document.getElementById('wiz-gps-preview');
      var mapEl = document.getElementById('wiz-map');
      var wizMap = null;
      var wizMarker = null;

      var defaultLat = wLat.value ? parseFloat(wLat.value) : 24.7136;
      var defaultLng = wLng.value ? parseFloat(wLng.value) : 46.6753;
      var hasCoords = !!(wLat.value && wLng.value);

      wizMap = L.map(mapEl, { zoomControl: false }).setView([defaultLat, defaultLng], hasCoords ? 16 : 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(wizMap);

      if (hasCoords) {
        wizMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(wizMap);
        preview.textContent = '✅ ' + t('locationSaved') + ' — ' + defaultLat.toFixed(4) + ', ' + defaultLng.toFixed(4);
        wizMarker.on('dragend', function () {
          var pos = wizMarker.getLatLng();
          wLat.value = pos.lat.toFixed(6);
          wLng.value = pos.lng.toFixed(6);
          wizardData.lat = wLat.value;
          wizardData.lng = wLng.value;
          preview.textContent = '✅ ' + t('locationSaved') + ' — ' + pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4);
        });
      }

      // Tap map to place/move pin
      wizMap.on('click', function (e) {
        wLat.value = e.latlng.lat.toFixed(6);
        wLng.value = e.latlng.lng.toFixed(6);
        wizardData.lat = wLat.value;
        wizardData.lng = wLng.value;
        preview.textContent = '✅ ' + t('locationSaved') + ' — ' + e.latlng.lat.toFixed(4) + ', ' + e.latlng.lng.toFixed(4);
        if (wizMarker) {
          wizMarker.setLatLng(e.latlng);
        } else {
          wizMarker = L.marker(e.latlng, { draggable: true }).addTo(wizMap);
          wizMarker.on('dragend', function () {
            var pos = wizMarker.getLatLng();
            wLat.value = pos.lat.toFixed(6);
            wLng.value = pos.lng.toFixed(6);
            wizardData.lat = wLat.value;
            wizardData.lng = wLng.value;
            preview.textContent = '✅ ' + t('locationSaved') + ' — ' + pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4);
          });
        }
      });

      bindMapSearch('wiz-map-search', 'wiz-map-search-btn', function (lat, lng, label) {
        wLat.value = lat.toFixed(6);
        wLng.value = lng.toFixed(6);
        wizardData.lat = wLat.value;
        wizardData.lng = wLng.value;
        wizMap.setView([lat, lng], 16);
        if (wizMarker) {
          wizMarker.setLatLng([lat, lng]);
        } else {
          wizMarker = L.marker([lat, lng], { draggable: true }).addTo(wizMap);
          wizMarker.on('dragend', function () {
            var pos = wizMarker.getLatLng();
            wLat.value = pos.lat.toFixed(6);
            wLng.value = pos.lng.toFixed(6);
            wizardData.lat = wLat.value;
            wizardData.lng = wLng.value;
            preview.textContent = '✅ ' + t('locationSaved') + ' — ' + pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4);
          });
        }
        preview.textContent = '✅ ' + (label || t('locationSaved')) + ' — ' + lat.toFixed(4) + ', ' + lng.toFixed(4);
      });

      document.getElementById('wiz-gps').addEventListener('click', function () {
        var btn = this;
        if (!navigator.geolocation) {
          showToast(t('locationError'));
          return;
        }
        btn.textContent = '⏳ ' + t('locating');
        btn.disabled = true;
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            var lat = pos.coords.latitude;
            var lng = pos.coords.longitude;
            wLat.value = lat.toFixed(6);
            wLng.value = lng.toFixed(6);
            wizardData.lat = wLat.value;
            wizardData.lng = wLng.value;

            wizMap.setView([lat, lng], 16);
            if (wizMarker) {
              wizMarker.setLatLng([lat, lng]);
            } else {
              wizMarker = L.marker([lat, lng], { draggable: true }).addTo(wizMap);
              wizMarker.on('dragend', function () {
                var p = wizMarker.getLatLng();
                wLat.value = p.lat.toFixed(6);
                wLng.value = p.lng.toFixed(6);
                wizardData.lat = wLat.value;
                wizardData.lng = wLng.value;
                preview.textContent = '✅ ' + t('locationSaved') + ' — ' + p.lat.toFixed(4) + ', ' + p.lng.toFixed(4);
              });
            }

            preview.textContent = '✅ ' + t('locationSaved') + ' — ' + lat.toFixed(4) + ', ' + lng.toFixed(4);
            btn.textContent = '✅ ' + t('locationSaved');
            btn.disabled = false;
          },
          function () {
            showToast(t('locationError'));
            btn.textContent = '📍 ' + t('useMyLocation');
            btn.disabled = false;
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }

    if (step === 'photo') {
      bindMultiImagePicker('wiz-image-input', 'wiz-upload', 'wiz-image-preview');
    }

    // Next button
    var btnNext = document.getElementById('wiz-next');
    if (btnNext) {
      btnNext.addEventListener('click', function () {
        if (!validateWizardStep()) return;
        saveCurrentWizardStep();
        wizardStep++;
        renderCurrentView();
      });
    }

    // Skip button
    var btnSkip = document.getElementById('wiz-skip');
    if (btnSkip) {
      btnSkip.addEventListener('click', function () {
        saveCurrentWizardStep();
        wizardStep++;
        renderCurrentView();
      });
    }

    // Save button (final step)
    var btnSave = document.getElementById('wiz-save');
    if (btnSave) {
      btnSave.addEventListener('click', function () {
        var lat = parseFloat(wizardData.lat);
        var lng = parseFloat(wizardData.lng);

        var data = {
          name: wizardData.name,
          nameAr: wizardData.name,
          lat: lat,
          lng: lng,
          mapsUrl: 'https://maps.google.com/?q=' + lat + ',' + lng,
          doorNumber: wizardData.doorNumber || '',
          instructions: '',
          instructionsAr: '',
          images: currentImagesData,
          image: currentImagesData[0] ? currentImagesData[0].dataUrl : currentImageData,
          imageName: currentImagesData[0] ? currentImagesData[0].name : (currentImageData ? 'location.jpg' : null)
        };

        Storage.addLocation(data);
        showView('list');
        showToast(t('locationSaved'));
      });
    }
  }

  function saveCurrentWizardStep() {
    var step = WIZARD_STEPS[wizardStep];
    if (step === 'name') {
      var nameEl = document.getElementById('wiz-name');
      if (nameEl) wizardData.name = nameEl.value.trim();
    }
    if (step === 'gps') {
      var latEl = document.getElementById('wiz-lat');
      var lngEl = document.getElementById('wiz-lng');
      if (latEl) wizardData.lat = latEl.value;
      if (lngEl) wizardData.lng = lngEl.value;
    }
    if (step === 'door') {
      var doorEl = document.getElementById('wiz-door');
      if (doorEl) wizardData.doorNumber = doorEl.value.trim();
    }
  }

  function validateWizardStep() {
    var step = WIZARD_STEPS[wizardStep];
    var t = I18n.t;

    if (step === 'name') {
      var name = document.getElementById('wiz-name').value.trim();
      if (!name) { showToast(t('required')); return false; }
    }
    if (step === 'gps') {
      var lat = document.getElementById('wiz-lat').value;
      var lng = document.getElementById('wiz-lng').value;
      if (!lat || !lng) { showToast(t('gpsRequired')); return false; }
    }
    return true;
  }

  // --- Form View (for editing) ---

  function renderForm() {
    var t = I18n.t;
    var loc = Storage.getLocationById(editingId) || {};
    currentImagesData = getStoredImages(loc);
    currentImageData = currentImagesData[0] ? currentImagesData[0].dataUrl : ((loc && loc.image) || null);

    var html = '<div class="view-form">';
    html += '<header class="app-header">';
    html += '<button class="btn-back" id="btn-back">←</button>';
    html += '<h1 class="app-title">' + t('editLocation') + '</h1>';
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
    html += '<div class="map-search-row">';
    html += '<input type="search" class="map-search-input" id="form-map-search" placeholder="Search your home, building, compound...">';
    html += '<button type="button" class="map-search-btn" id="form-map-search-btn">🔎 Find</button>';
    html += '</div>';
    html += '<button type="button" class="btn-gps" id="btn-gps">📍 ' + t('useMyLocation') + '</button>';
    html += '<input type="hidden" id="f-lat" value="' + (loc.lat || '') + '">';
    html += '<input type="hidden" id="f-lng" value="' + (loc.lng || '') + '">';
    html += '<div class="form-map" id="form-map"></div>';
    html += '<p class="gps-preview" id="gps-preview"></p>';
    html += '</div>';
    html += '</div>';

    // Door photo
    html += '<div class="form-section">';
    html += '<div class="form-section-title">' + t('photoSection') + '</div>';
    html += '<div class="form-group">';
    html += '<input type="file" id="f-image" accept="image/*" multiple style="display:none">';
    html += '<div class="image-upload" id="image-upload">';
    html += '<button type="button" class="btn-upload" id="btn-upload">📷 Add up to 2 photos / أضف صورتين</button>';
    html += '</div>';
    html += renderImagePreviewHtml('image-preview', currentImagesData);
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

    // Init edit map
    var formMapEl = document.getElementById('form-map');
    var formMap = null;
    var formMarker = null;
    var hasLatLng = fLat.value && fLng.value;
    var initLat = hasLatLng ? parseFloat(fLat.value) : 24.7136;
    var initLng = hasLatLng ? parseFloat(fLng.value) : 46.6753;

    formMap = L.map(formMapEl, { zoomControl: false }).setView([initLat, initLng], hasLatLng ? 16 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(formMap);

    if (hasLatLng) {
      formMarker = L.marker([initLat, initLng], { draggable: true }).addTo(formMap);
      formMarker.on('dragend', function () {
        var p = formMarker.getLatLng();
        fLat.value = p.lat.toFixed(6);
        fLng.value = p.lng.toFixed(6);
        updateGpsPreview();
      });
    }

    formMap.on('click', function (e) {
      fLat.value = e.latlng.lat.toFixed(6);
      fLng.value = e.latlng.lng.toFixed(6);
      updateGpsPreview();
      if (formMarker) {
        formMarker.setLatLng(e.latlng);
      } else {
        formMarker = L.marker(e.latlng, { draggable: true }).addTo(formMap);
        formMarker.on('dragend', function () {
          var p = formMarker.getLatLng();
          fLat.value = p.lat.toFixed(6);
          fLng.value = p.lng.toFixed(6);
          updateGpsPreview();
        });
      }
    });

    btnBack.addEventListener('click', function () { showView('list'); });
    btnCancel.addEventListener('click', function () { showView('list'); });

    bindMapSearch('form-map-search', 'form-map-search-btn', function (lat, lng, label) {
      fLat.value = lat.toFixed(6);
      fLng.value = lng.toFixed(6);
      formMap.setView([lat, lng], 16);
      if (formMarker) {
        formMarker.setLatLng([lat, lng]);
      } else {
        formMarker = L.marker([lat, lng], { draggable: true }).addTo(formMap);
        formMarker.on('dragend', function () {
          var p = formMarker.getLatLng();
          fLat.value = p.lat.toFixed(6);
          fLng.value = p.lng.toFixed(6);
          updateGpsPreview();
        });
      }
      updateGpsPreview(label);
    });

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
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          fLat.value = lat.toFixed(6);
          fLng.value = lng.toFixed(6);
          updateGpsPreview();

          formMap.setView([lat, lng], 16);
          if (formMarker) {
            formMarker.setLatLng([lat, lng]);
          } else {
            formMarker = L.marker([lat, lng], { draggable: true }).addTo(formMap);
            formMarker.on('dragend', function () {
              var p = formMarker.getLatLng();
              fLat.value = p.lat.toFixed(6);
              fLng.value = p.lng.toFixed(6);
              updateGpsPreview();
            });
          }

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

    // Images
    bindMultiImagePicker('f-image', 'btn-upload', 'image-preview');

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
        images: currentImagesData,
        image: currentImagesData[0] ? currentImagesData[0].dataUrl : currentImageData,
        imageName: currentImagesData[0] ? currentImagesData[0].name : (currentImageData ? 'location.jpg' : null)
      };

      Storage.updateLocation(editingId, data);
      showView('list');
    });
  }

  function updateGpsPreview(label) {
    var lat = document.getElementById('f-lat').value;
    var lng = document.getElementById('f-lng').value;
    var preview = document.getElementById('gps-preview');
    if (lat && lng) {
      preview.textContent = '✅ ' + (label || I18n.t('locationSaved')) + ' — ' + parseFloat(lat).toFixed(4) + ', ' + parseFloat(lng).toFixed(4);
    } else {
      preview.textContent = '';
    }
  }


  function getStoredImages(loc) {
    if (!loc) return [];
    if (Array.isArray(loc.images) && loc.images.length) return loc.images.slice(0, 2);
    return loc.image ? [{ dataUrl: loc.image, name: loc.imageName || 'location.jpg' }] : [];
  }

  function renderImagePreviewHtml(id, images) {
    var html = '<div class="image-preview multi-image-preview" id="' + id + '"' + (!images.length ? ' style="display:none"' : '') + '>';
    html += '<div class="image-grid">';
    for (var i = 0; i < images.length; i++) {
      html += '<div class="image-tile"><img src="' + (images[i].dataUrl || images[i]) + '" alt=""></div>';
    }
    html += '</div>';
    html += '<div class="image-actions">';
    html += '<button type="button" class="btn-sm btn-change-photos">Change photos</button>';
    html += '<button type="button" class="btn-sm btn-danger btn-remove-photos">Remove photos</button>';
    html += '</div></div>';
    return html;
  }

  function refreshImagePreview(previewId) {
    var preview = document.getElementById(previewId);
    if (!preview) return;
    var grid = preview.querySelector('.image-grid');
    grid.innerHTML = '';
    for (var i = 0; i < currentImagesData.length; i++) {
      var tile = document.createElement('div');
      tile.className = 'image-tile';
      tile.innerHTML = '<img src="' + (currentImagesData[i].dataUrl || currentImagesData[i]) + '" alt="">';
      grid.appendChild(tile);
    }
    preview.style.display = currentImagesData.length ? '' : 'none';
  }

  function bindMultiImagePicker(inputId, uploadBtnId, previewId) {
    var input = document.getElementById(inputId);
    var upload = document.getElementById(uploadBtnId);
    var preview = document.getElementById(previewId);
    if (!input || !upload || !preview) return;
    function triggerUpload() { input.click(); }
    upload.addEventListener('click', triggerUpload);
    var change = preview.querySelector('.btn-change-photos');
    var remove = preview.querySelector('.btn-remove-photos');
    if (change) change.addEventListener('click', triggerUpload);
    if (remove) remove.addEventListener('click', function () {
      currentImagesData = [];
      currentImageData = null;
      input.value = '';
      refreshImagePreview(previewId);
    });
    input.addEventListener('change', function () {
      if (this.files && this.files.length) {
        Share.handleImageUploads(this.files).then(function (images) {
          currentImagesData = images.slice(0, 2);
          currentImageData = currentImagesData[0] ? currentImagesData[0].dataUrl : null;
          refreshImagePreview(previewId);
          showToast('✅ Added ' + currentImagesData.length + ' photo(s)');
        });
      }
    });
  }

  function bindMapSearch(inputId, buttonId, onSelect) {
    var input = document.getElementById(inputId);
    var button = document.getElementById(buttonId);
    if (!input || !button) return;
    function runSearch() {
      var q = input.value.trim();
      if (!q) { showToast('Type a place/home name first'); return; }
      button.disabled = true;
      button.textContent = 'Searching...';
      fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=' + encodeURIComponent(q))
        .then(function (res) { return res.json(); })
        .then(function (items) {
          if (!items || !items.length) { showToast('No place found'); return; }
          var item = items[0];
          onSelect(parseFloat(item.lat), parseFloat(item.lon), item.display_name.split(',').slice(0, 2).join(','));
        })
        .catch(function () { showToast('Search failed. Try Use My Location or tap map.'); })
        .finally(function () { button.disabled = false; button.textContent = '🔎 Find'; });
    }
    button.addEventListener('click', runSearch);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } });
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
