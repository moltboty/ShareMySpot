# ShareMySpot - Build Prompt for Antigravity

Build a Progressive Web App called "ShareMySpot" (شارك موقعي). Users save location cards (Home, Work, etc.) and share them to WhatsApp with one tap — sending a bilingual Arabic/English message with an optional door photo attached.

## TECH STACK:
- Pure HTML/CSS/JS (no framework - keep it simple)
- localStorage for data persistence
- Web Share API for sharing text + image to WhatsApp
- No backend needed - everything client-side
- PWA with manifest.json for "Add to Home Screen"

## FILE STRUCTURE:
```
sharemyspot/
├── index.html          # Main app shell, all views
├── css/style.css       # Mobile-first styles
├── js/
│   ├── app.js          # Main app logic, view switching
│   ├── storage.js      # localStorage CRUD for locations
│   ├── share.js        # Web Share API logic
│   └── i18n.js         # Arabic/English translations
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
└── icons/              # PWA icons (192px, 512px)
```

## DATA MODEL (localStorage):
Store array in 'sharemyspot_locations':
```javascript
{
  id: "loc_1710000000000",
  name: "Home",
  nameAr: "البيت",
  lat: 24.7136,
  lng: 46.6753,
  mapsUrl: "https://maps.google.com/?q=24.7136,46.6753",
  apartment: "Building 5, Apt 302",
  apartmentAr: "البناية 5، شقة 302",
  instructions: "Park near Starbucks",
  instructionsAr: "ركن بجانب ستاربكس",
  image: null,           // Data URL of door photo
  imageName: "door.jpg",
  createdAt: 1710000000000
}
```

## SCREEN 1: Location List (Home)
- Header: "ShareMySpot / شارك موقعي" with settings gear icon
- Language toggle: "EN | عر" button
- Location cards showing:
  * Location name (current UI language)
  * Map pin + coordinates
  * Door image thumbnail (if uploaded)
  * BIG green "📤 Share to WhatsApp" button (#25D366)
  * Small edit ✏️ and delete 🗑️ icons
- "+ Add Location" FAB at bottom right
- Empty state: "Tap + to add your first location"

## SCREEN 2: Add/Edit Location Form
Required fields:
1. Location Name (English) - text input
2. Location Name (Arabic) - text input
3. GPS Coordinates:
   - "Use My Location" button (navigator.geolocation)
   - OR manual lat/lng inputs
   - Preview: "📍 Will open: https://maps.google.com/?q=LAT,LNG"

Optional fields:
4. Door/Building Photo - file input (accept="image/*")
   - Resize to max 800px width, convert to JPEG 80% quality
   - Store as Data URL in localStorage
5. Apartment/Door Number (English + Arabic)
6. Instructions (English + Arabic) - textarea

Buttons: "💾 Save" and "Cancel"

## SCREEN 3: Settings
- UI Language toggle (EN/AR - switch to RTL when Arabic)
- Custom Greeting (default: "مرحباً! Hello! 👋")
- About section

## CRITICAL SHARING LOGIC:
```javascript
async function shareLocation(locationId) {
  const loc = getLocationById(locationId);
  const settings = getSettings();
  
  // Build bilingual message
  let message = settings.greeting + '\n\n';
  message += '📍 Location / الموقع:\n' + loc.mapsUrl + '\n\n';
  
  if (loc.apartment || loc.apartmentAr) {
    message += '🏠 Apartment / رقم الشقة:\n';
    if (loc.apartment) message += loc.apartment;
    if (loc.apartment && loc.apartmentAr) message += ' / ';
    if (loc.apartmentAr) message += loc.apartmentAr;
    message += '\n\n';
  }
  
  if (loc.instructions || loc.instructionsAr) {
    message += 'ℹ️ Instructions / التعليمات:\n';
    if (loc.instructions) message += loc.instructions;
    if (loc.instructions && loc.instructionsAr) message += ' / ';
    if (loc.instructionsAr) message += loc.instructionsAr;
  }
  
  const shareData = { text: message };
  
  // Add image if exists
  if (loc.image) {
    const file = dataURLtoFile(loc.image, loc.imageName || 'location.jpg');
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      shareData.files = [file];
    }
  }
  
  // Share
  try {
    await navigator.share(shareData);
  } catch (err) {
    if (err.name !== 'AbortError') {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(message);
      showToast('Message copied to clipboard!');
    }
  }
}

// Helper: Convert Data URL to File
function dataURLtoFile(dataURL, filename) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new File([u8arr], filename, { type: mime });
}
```

## IMPORTANT NOTES:
- Do NOT use 'url' field in shareData (ignored when files present)
- Embed Google Maps URL in 'text' field instead
- The 'text' becomes image caption in WhatsApp
- Always check navigator.canShare({ files: [file] }) before including files
- Provide clipboard fallback for unsupported browsers
- HTTPS required for Web Share API to work
- User gesture required (must trigger from button tap)

## IMAGE HANDLING:
When user uploads photo, resize to max 800px width and convert to JPEG 80% quality to save localStorage space:

```javascript
function handleImageUpload(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width, height = img.height;
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
```

## PWA MANIFEST (manifest.json):
```json
{
  "name": "ShareMySpot",
  "short_name": "ShareMySpot",
  "description": "Share your location to WhatsApp with one tap",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#25D366",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## UI DESIGN:
- Mobile-first (max 480px width focus)
- Clean, minimal design
- Use system fonts
- WhatsApp green (#25D366) for primary actions
- Light background (#f5f5f5)
- Card-based layout with subtle shadows
- Arabic: full RTL layout when language switched

Build this as a simple, functional PWA. Focus on core sharing feature working perfectly. Keep UI clean and fast.
