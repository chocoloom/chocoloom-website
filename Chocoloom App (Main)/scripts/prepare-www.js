const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const WWW_DIR = path.resolve(ROOT_DIR, 'www');

console.log('[prepare-www] Staging web assets for Android build into:', WWW_DIR);

// Ensure WWW directory exists & is clean
if (fs.existsSync(WWW_DIR)) {
    fs.rmSync(WWW_DIR, { recursive: true, force: true });
}
fs.mkdirSync(WWW_DIR, { recursive: true });

// Helper to copy file
function copyFile(srcRelative, destRelative = null) {
    const src = path.join(ROOT_DIR, srcRelative);
    const dest = path.join(WWW_DIR, destRelative || srcRelative);
    if (fs.existsSync(src)) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
        // console.log(`Copied file: ${srcRelative} -> ${destRelative || srcRelative}`);
    } else {
        console.warn(`[prepare-www] Warning: Source file does not exist: ${srcRelative}`);
    }
}

// Helper to copy directory recursively (dereferencing symlinks)
function copyDir(srcRelative, destRelative = null) {
    const src = path.join(ROOT_DIR, srcRelative);
    const dest = path.join(WWW_DIR, destRelative || srcRelative);
    if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true, dereference: true });
        console.log(`[prepare-www] Copied directory: ${srcRelative}`);
    } else {
        console.warn(`[prepare-www] Warning: Source directory does not exist: ${srcRelative}`);
    }
}

// 1. Copy Core Root Files
const rootFiles = [
    'index.html',
    'order.html',
    'product.html',
    'admin.html',
    'chocowallet.html',
    'uni-chocoloom.html',
    'login.html',
    'landing.html',
    'app.js',
    'data.js',
    'react-components.js',
    'pwa.js',
    'sw.js',
    'workshop.js',
    'workshop.css',
    'styles.css',
    'admin_styles.css',
    'style.css',
    'manifest.json',
    'catalog_overrides.json',
    'sql_items.json',
    'screenshot.png'
];

for (const file of rootFiles) {
    copyFile(file);
}

// 2. Copy Asset & Category Image Folders
const assetFolders = [
    'assets',
    'Anniversary Cakes',
    'Bachelor Cakes',
    'Half Birthday Cakes',
    'Wedding Cakes',
    'chocoloom desert',
    'desserts',
    'admin',
    'workshop'
];

for (const dir of assetFolders) {
    copyDir(dir);
}

// 3. Set up Clean Route Directories with REAL index.html files (no broken symlinks)
const routeMappings = [
    { routeDir: 'order', sourceHtml: 'order.html' },
    { routeDir: 'product', sourceHtml: 'product.html' },
    { routeDir: 'chocowallet', sourceHtml: 'chocowallet.html' },
    { routeDir: 'uni-chocoloom', sourceHtml: 'uni-chocoloom.html' },
    { routeDir: 'login', sourceHtml: 'login.html' },
    { routeDir: 'landing', sourceHtml: 'landing.html' }
];

for (const mapping of routeMappings) {
    const targetDir = path.join(WWW_DIR, mapping.routeDir);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const sourcePath = path.join(ROOT_DIR, mapping.sourceHtml);
    const targetFile = path.join(targetDir, 'index.html');
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetFile);
    }
}

// 4. Copy Native Android Helper Script (capacitor-bridge.js)
copyFile('capacitor-bridge.js');

// 5. Inject capacitor-bridge.js into HTML files in www
const htmlFiles = [
    'index.html',
    'order.html',
    'product.html',
    'chocowallet.html',
    'uni-chocoloom.html',
    'login.html',
    'landing.html'
];

for (const htmlFile of htmlFiles) {
    const filePath = path.join(WWW_DIR, htmlFile);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('capacitor-bridge.js')) {
            content = content.replace('</body>', '    <script src="capacitor-bridge.js"></script>\n</body>');
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
}

for (const mapping of routeMappings) {
    const routeHtml = path.join(WWW_DIR, mapping.routeDir, 'index.html');
    if (fs.existsSync(routeHtml)) {
        let content = fs.readFileSync(routeHtml, 'utf8');
        if (!content.includes('capacitor-bridge.js')) {
            content = content.replace('</body>', '    <script src="../capacitor-bridge.js"></script>\n</body>');
            fs.writeFileSync(routeHtml, content, 'utf8');
        }
    }
}

console.log('[prepare-www] Staging complete! Ready for Capacitor sync.');

