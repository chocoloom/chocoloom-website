const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_ICON = path.join(ROOT_DIR, 'assets', 'icons', 'icon-512x512.png');
const RES_DIR = path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'res');

if (!fs.existsSync(SOURCE_ICON)) {
    console.error('Source icon not found:', SOURCE_ICON);
    process.exit(1);
}

console.log('Generating Android icons and splash from:', SOURCE_ICON);

const iconSizes = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
];

for (const item of iconSizes) {
    const targetDir = path.join(RES_DIR, item.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const launcher = path.join(targetDir, 'ic_launcher.png');
    const launcherRound = path.join(targetDir, 'ic_launcher_round.png');
    const launcherFg = path.join(targetDir, 'ic_launcher_foreground.png');

    execSync(`/usr/bin/sips -z ${item.size} ${item.size} "${SOURCE_ICON}" --out "${launcher}"`, { stdio: 'ignore' });
    execSync(`/usr/bin/sips -z ${item.size} ${item.size} "${SOURCE_ICON}" --out "${launcherRound}"`, { stdio: 'ignore' });
    execSync(`/usr/bin/sips -z ${item.fgSize} ${item.fgSize} "${SOURCE_ICON}" --out "${launcherFg}"`, { stdio: 'ignore' });
    console.log(`Generated ${item.dir} icons (${item.size}x${item.size})`);
}

// Update launcher background color to Chocoloom theme (#11071f)
const bgXml = path.join(RES_DIR, 'values', 'ic_launcher_background.xml');
if (fs.existsSync(bgXml)) {
    fs.writeFileSync(bgXml, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#11071f</color>\n</resources>\n');
    console.log('Updated ic_launcher_background.xml to brand color #11071f');
}

// Copy source icon directly as main splash fallback
const defaultSplash = path.join(RES_DIR, 'drawable', 'splash.png');
if (fs.existsSync(path.dirname(defaultSplash))) {
    execSync(`/usr/bin/sips -z 480 480 "${SOURCE_ICON}" --out "${defaultSplash}"`, { stdio: 'ignore' });
}

console.log('Android branding and launcher icons generated successfully!');

