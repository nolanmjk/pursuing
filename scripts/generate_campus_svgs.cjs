// Generate SVG campus placeholder images for each university
// These are beautiful gradient cards with university names - always load, no hotlink issues
const fs = require('fs');
const path = require('path');

const collegesPath = path.join(__dirname, '..', 'src', 'data', 'colleges.json');
const outputDir = path.join(__dirname, '..', 'public', 'images', 'campuses');

const colleges = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Level-based color palettes (matching the CSS gradients)
const palettes = {
  '985': { start: '#0F2027', mid: '#203A43', end: '#2C5364', accent: '#4DB8D4' },
  '211': { start: '#1A1A3E', mid: '#2D3561', end: '#4A6FA5', accent: '#7B9FD4' },
  '省重点': { start: '#0F1F14', mid: '#1A4731', end: '#2D6A4F', accent: '#5DBA8A' },
  '本科': { start: '#1A1A2E', mid: '#2B2B5C', end: '#4A4A8A', accent: '#8A8AD4' },
  '专科': { start: '#2D2D2D', mid: '#3D3D3D', end: '#505050', accent: '#888888' },
};

const defaultPalette = palettes['本科'];

function generateSVG(name, level, id) {
  const p = palettes[level] || defaultPalette;
  // Truncate name for display (max 8 chars for hero, full for thumb)
  const displayName = name.length > 8 ? name : name;
  const fontSize = displayName.length > 6 ? 36 : displayName.length > 4 ? 44 : 52;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.start}"/>
      <stop offset="50%" stop-color="${p.mid}"/>
      <stop offset="100%" stop-color="${p.end}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255,255,255,0)" />
      <stop offset="50%" stop-color="rgba(255,255,255,0.03)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.06)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="800" height="400" fill="url(#bg)"/>
  <rect width="800" height="400" fill="url(#grid)"/>
  <rect width="800" height="400" fill="url(#glow)"/>
  <rect width="800" height="400" fill="url(#shine)"/>
  <!-- Decorative lines -->
  <line x1="60" y1="340" x2="200" y2="340" stroke="${p.accent}" stroke-width="1" opacity="0.3"/>
  <line x1="600" y1="340" x2="740" y2="340" stroke="${p.accent}" stroke-width="1" opacity="0.3"/>
  <circle cx="220" cy="340" r="3" fill="${p.accent}" opacity="0.4"/>
  <circle cx="580" cy="340" r="3" fill="${p.accent}" opacity="0.4"/>
  <!-- University name -->
  <text x="400" y="195" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="6">${displayName}</text>
  <!-- English subtitle -->
  <text x="400" y="240" text-anchor="middle" fill="rgba(255,255,255,0.25)" font-family="'Segoe UI',sans-serif" font-size="14" letter-spacing="4">UNIVERSITY</text>
  <!-- Bottom accent bar -->
  <rect x="320" y="360" width="160" height="2" rx="1" fill="${p.accent}" opacity="0.3"/>
</svg>`;
}

function generateThumbSVG(name, level, id) {
  const p = palettes[level] || defaultPalette;
  const displayName = name.length > 8 ? name.substring(0, 7) + '…' : name;
  const fontSize = displayName.length > 6 ? 18 : displayName.length > 4 ? 22 : 26;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.start}"/>
      <stop offset="50%" stop-color="${p.mid}"/>
      <stop offset="100%" stop-color="${p.end}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.06)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="400" height="240" fill="url(#bg)"/>
  <rect width="400" height="240" fill="url(#grid)"/>
  <rect width="400" height="240" fill="url(#glow)"/>
  <text x="200" y="115" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="4">${displayName}</text>
  <text x="200" y="145" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-family="'Segoe UI',sans-serif" font-size="10" letter-spacing="3">UNIVERSITY</text>
  <rect x="140" y="205" width="120" height="1.5" rx="1" fill="${p.accent}" opacity="0.25"/>
</svg>`;
}

// Generate SVGs and update college image paths
let count = 0;
colleges.forEach(college => {
  const heroSVG = generateSVG(college.name, college.level, college.id);
  const thumbSVG = generateThumbSVG(college.name, college.level, college.id);

  // Write SVG files
  fs.writeFileSync(path.join(outputDir, `${college.id}_hero.svg`), heroSVG);
  fs.writeFileSync(path.join(outputDir, `${college.id}_thumb.svg`), thumbSVG);

  // Update college data: hero image and thumb image
  college.image = `/images/campuses/${college.id}_hero.svg`;
  college.thumbImage = `/images/campuses/${college.id}_thumb.svg`;
  count++;
});

// Write updated colleges.json
fs.writeFileSync(collegesPath, JSON.stringify(colleges, null, 2));
console.log(`Generated ${count * 2} SVG campus images (hero + thumb for ${count} colleges)`);
console.log(`Updated colleges.json with image paths`);
