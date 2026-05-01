const assert = require('assert');
const Utils = require('../js/utils.js');

function test(name, fn) {
  try {
    fn();
    console.log('✓ ' + name);
  } catch (err) {
    console.error('✗ ' + name);
    throw err;
  }
}

test('normalizes Saudi local mobile number to international digits', () => {
  assert.strictEqual(Utils.normalizePhoneForWhatsApp('050 123 4567'), '966501234567');
});

test('normalizes already international phone number and strips symbols', () => {
  assert.strictEqual(Utils.normalizePhoneForWhatsApp('+966-50-123-4567'), '966501234567');
});

test('builds WhatsApp URL with encoded message', () => {
  assert.strictEqual(
    Utils.buildWhatsAppUrl('0501234567', 'Hello world'),
    'https://wa.me/966501234567?text=Hello%20world'
  );
});

test('extracts Google Maps URL from mixed pasted text', () => {
  assert.strictEqual(
    Utils.extractMapsUrl('my home https://maps.google.com/?q=24.7136,46.6753 thanks'),
    'https://maps.google.com/?q=24.7136,46.6753'
  );
});

test('builds quick location message with map and door details', () => {
  const message = Utils.buildQuickMessage({
    greeting: 'السلام عليكم',
    mapsText: 'https://maps.app.goo.gl/example',
    door: 'Villa 12',
    note: 'Call me when you arrive'
  });
  assert.ok(message.includes('السلام عليكم'));
  assert.ok(message.includes('https://maps.app.goo.gl/example'));
  assert.ok(message.includes('Villa 12'));
  assert.ok(message.includes('Call me when you arrive'));
});
