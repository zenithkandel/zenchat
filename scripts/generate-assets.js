const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 transparent/black PNG base64 representation
const basePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const files = ['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'favicon.png'];
files.forEach((file) => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, basePng);
  }
});

console.log('Assets created successfully in assets/');
