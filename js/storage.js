// ========================================
// ShareMySpot — localStorage CRUD
// ========================================

var Storage = (function () {
  'use strict';

  var LOCATIONS_KEY = 'sharemyspot_locations';
  var SETTINGS_KEY = 'sharemyspot_settings';

  var defaultSettings = {
    lang: 'en',
    greeting: 'مرحباً! Hello! 👋'
  };

  // --- Locations ---

  function getLocations() {
    try {
      return JSON.parse(localStorage.getItem(LOCATIONS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveLocations(locations) {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  }

  function getLocationById(id) {
    var locations = getLocations();
    for (var i = 0; i < locations.length; i++) {
      if (locations[i].id === id) return locations[i];
    }
    return null;
  }

  function addLocation(loc) {
    var locations = getLocations();
    loc.id = 'loc_' + Date.now();
    loc.createdAt = Date.now();
    locations.push(loc);
    saveLocations(locations);
    return loc;
  }

  function updateLocation(id, data) {
    var locations = getLocations();
    for (var i = 0; i < locations.length; i++) {
      if (locations[i].id === id) {
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            locations[i][key] = data[key];
          }
        }
        saveLocations(locations);
        return locations[i];
      }
    }
    return null;
  }

  function deleteLocation(id) {
    var locations = getLocations();
    var filtered = [];
    for (var i = 0; i < locations.length; i++) {
      if (locations[i].id !== id) filtered.push(locations[i]);
    }
    saveLocations(filtered);
  }

  // --- Settings ---

  function getSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      return saved ? Object.assign({}, defaultSettings, saved) : Object.assign({}, defaultSettings);
    } catch (e) {
      return Object.assign({}, defaultSettings);
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  return {
    getLocations: getLocations,
    getLocationById: getLocationById,
    addLocation: addLocation,
    updateLocation: updateLocation,
    deleteLocation: deleteLocation,
    getSettings: getSettings,
    saveSettings: saveSettings
  };
})();
