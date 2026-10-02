const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Royal Obsidian Background -->
    <radialGradient id="shieldBg" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#241708"/>
      <stop offset="60%" stop-color="#140D04"/>
      <stop offset="100%" stop-color="#080502"/>
    </radialGradient>

    <!-- Master Lustrous Gold Gradient -->
    <linearGradient id="goldMaster" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFF2BF"/>
      <stop offset="22%" stop-color="#F5B82E"/>
      <stop offset="52%" stop-color="#D48800"/>
      <stop offset="78%" stop-color="#FCD56B"/>
      <stop offset="100%" stop-color="#B26E00"/>
    </linearGradient>

    <!-- Warm Highlight Gradient -->
    <linearGradient id="goldShine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF8E1"/>
      <stop offset="45%" stop-color="#F7C042"/>
      <stop offset="100%" stop-color="#D48800"/>
    </linearGradient>

    <!-- High-Contrast Clean Shadow -->
    <filter id="royalGlow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.8"/>
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#F5B82E" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- 1. Obsidian Luxury Shield Base -->
  <circle cx="256" cy="256" r="248" fill="url(#shieldBg)"/>

  <!-- 2. Solid Gold Border Ring -->
  <circle cx="256" cy="256" r="238" fill="none" stroke="url(#goldMaster)" stroke-width="12"/>

  <!-- Subtle Inner Ring Accent -->
  <circle cx="256" cy="256" r="222" fill="none" stroke="url(#goldMaster)" stroke-width="2" stroke-opacity="0.45"/>

  <g filter="url(#royalGlow)">
    <!-- ======================================================== -->
    <!-- 3. SACRED LOTUS CROWN (Nestled in Upper Aperture)         -->
    <!-- ======================================================== -->
    <!-- Central Lotus Petal (Vertical Flame / Lance Silhouette) -->
    <path d="M 256,60 
             C 244,95 236,128 243,148 
             C 246,158 250,164 256,166 
             C 262,164 266,158 269,148 
             C 276,128 268,95 256,60 Z" 
          fill="url(#goldShine)"/>

    <!-- Left Wing Petal -->
    <path d="M 252,165 
             C 230,163 200,143 186,116 
             C 178,100 181,89 188,87 
             C 194,85 207,92 219,108 
             C 232,126 244,147 252,165 Z" 
          fill="url(#goldMaster)"/>

    <!-- Right Wing Petal -->
    <path d="M 260,165 
             C 282,163 312,143 326,116 
             C 334,100 331,89 324,87 
             C 318,85 305,92 293,108 
             C 280,126 268,147 260,165 Z" 
          fill="url(#goldMaster)"/>

    <!-- Lotus Base Pedestal Jewel Diamond -->
    <polygon points="256,164 264,175 256,186 248,175" fill="#FFF8E1"/>

    <!-- ======================================================== -->
    <!-- 4. SIGNATURE ROYAL SERIF "V"                             -->
    <!-- ======================================================== -->
    <!-- Left Top Serif -->
    <path d="M 120,192 
             L 210,192 
             C 196,202 188,214 190,230 
             L 170,230 
             C 172,214 164,202 150,192 Z" 
          fill="url(#goldMaster)"/>

    <!-- Left Main Heavy Downstroke (Bold Solid Geometry for 16px Clarity) -->
    <polygon points="170,220 226,220 274,424 246,424" fill="url(#goldShine)"/>
    <polygon points="170,220 188,220 248,424 246,424" fill="url(#goldMaster)"/>

    <!-- Right Top Serif -->
    <path d="M 314,192 
             L 392,192 
             C 378,202 370,214 368,230 
             L 354,230 
             C 356,214 348,202 334,192 Z" 
          fill="url(#goldMaster)"/>

    <!-- Right Light Upstroke (Crisp Hairline) -->
    <polygon points="262,424 286,424 370,220 354,220" fill="url(#goldMaster)"/>

    <!-- Bottom Vertex Apex Anchor & Pedestal -->
    <path d="M 238,422 L 282,422 L 272,438 L 248,438 Z" fill="url(#goldMaster)"/>
    
    <!-- Base Hanging Jewel Diamond (Matches Pendant in Logo) -->
    <polygon points="256,444 266,456 256,468 246,456" fill="#FFF8E1"/>
  </g>
</svg>`;

async function generateAllAssets() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Vector SVG
  const svgPath = path.join(publicDir, 'favicon.svg');
  fs.writeFileSync(svgPath, SVG_CONTENT, 'utf8');
  console.log('✓ Created public/favicon.svg');

  // 2. Standard PNG icons
  const pngSizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
  ];

  for (const item of pngSizes) {
    const dest = path.join(publicDir, item.name);
    await sharp(Buffer.from(SVG_CONTENT))
      .resize(item.size, item.size)
      .png()
      .toFile(dest);
    console.log(`✓ Created public/${item.name} (${item.size}×${item.size})`);
  }

  // 3. Multi-layer Windows ICO (16x16, 32x32, 48x48)
  const icoSizes = [16, 32, 48];
  const icoImages = [];

  for (const size of icoSizes) {
    const { data } = await sharp(Buffer.from(SVG_CONTENT))
      .resize(size, size)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bih = Buffer.alloc(40);
    bih.writeUInt32LE(40, 0);
    bih.writeInt32LE(size, 4);
    bih.writeInt32LE(size * 2, 8); // doubled height for ICO
    bih.writeUInt16LE(1, 12);
    bih.writeUInt16LE(32, 14); // 32-bit RGBA
    bih.writeUInt32LE(0, 16);
    bih.writeUInt32LE(size * size * 4, 20);
    bih.writeInt32LE(0, 24);
    bih.writeInt32LE(0, 28);
    bih.writeUInt32LE(0, 32);
    bih.writeUInt32LE(0, 36);

    const xorMask = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
      const srcY = size - 1 - y; // bottom-up
      for (let x = 0; x < size; x++) {
        const srcIdx = (srcY * size + x) * 4;
        const dstIdx = (y * size + x) * 4;
        xorMask[dstIdx] = data[srcIdx + 2];     // B
        xorMask[dstIdx + 1] = data[srcIdx + 1]; // G
        xorMask[dstIdx + 2] = data[srcIdx];     // R
        xorMask[dstIdx + 3] = data[srcIdx + 3]; // A
      }
    }

    const rowBytes = Math.ceil(size / 32) * 4;
    const andMask = Buffer.alloc(rowBytes * size); // all 0 = transparent by alpha

    const imageData = Buffer.concat([bih, xorMask, andMask]);
    icoImages.push({ size, data: imageData });
  }

  const numImages = icoImages.length;
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(numImages, 4);

  let offset = 6 + (numImages * 16);
  const dirEntries = [];
  for (const img of icoImages) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size, 0);
    entry.writeUInt8(img.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += img.data.length;
  }

  const icoBuffer = Buffer.concat([icoHeader, ...dirEntries, ...icoImages.map(img => img.data)]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Created public/favicon.ico (Multi-layer 16x16, 32x32, 48x48)');

  // 4. Web App Manifest
  const manifest = {
    name: "Velaash",
    short_name: "Velaash",
    description: "Shop clothing for men and women, plus traditional pooja and brass essentials, at Velaash.",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#140D04",
    background_color: "#FFFBF0",
    display: "standalone",
    start_url: "/"
  };
  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✓ Created public/site.webmanifest');
}

generateAllAssets().catch(err => {
  console.error('Failed generating assets:', err);
  process.exit(1);
});
