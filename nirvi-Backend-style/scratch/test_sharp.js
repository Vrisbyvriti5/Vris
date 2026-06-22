const sharp = require('sharp');
const fs = require('fs');

async function testSharp() {
  try {
    console.log('Sharp version:', sharp.versions);
    // Create a small test image buffer (1x1 transparent pixel)
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    
    const output = await sharp(buffer)
      .webp()
      .toBuffer();
    
    console.log('Successfully converted test buffer to WebP');
    console.log('Output size:', output.length, 'bytes');
    process.exit(0);
  } catch (err) {
    console.error('Sharp test failed:', err);
    process.exit(1);
  }
}

testSharp();
