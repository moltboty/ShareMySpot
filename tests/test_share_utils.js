const assert = require('assert');
const ShareUtils = require('../js/share-utils.js');

function test(name, fn) {
  try {
    fn();
    console.log('✓ ' + name);
  } catch (err) {
    console.error('✗ ' + name);
    throw err;
  }
}

test('normalizes legacy single image into image list', () => {
  assert.deepStrictEqual(
    ShareUtils.getShareImages({ image: 'data:image/jpeg;base64,abc', imageName: 'door.jpg' }),
    [{ dataUrl: 'data:image/jpeg;base64,abc', name: 'door.jpg' }]
  );
});

test('limits share images to two attachments', () => {
  const images = ShareUtils.getShareImages({
    images: [
      { dataUrl: 'one', name: 'one.jpg' },
      { dataUrl: 'two', name: 'two.jpg' },
      { dataUrl: 'three', name: 'three.jpg' }
    ]
  });
  assert.strictEqual(images.length, 2);
  assert.strictEqual(images[1].name, 'two.jpg');
});

test('builds a clear full card text with map and door details', () => {
  const text = ShareUtils.buildCardText({
    greeting: 'مرحبا',
    loc: {
      name: 'Home',
      mapsUrl: 'https://maps.google.com/?q=24.1,46.2',
      doorNumber: 'Villa 12'
    }
  });
  assert.ok(text.includes('مرحبا'));
  assert.ok(text.includes('Home'));
  assert.ok(text.includes('https://maps.google.com/?q=24.1,46.2'));
  assert.ok(text.includes('Villa 12'));
});
