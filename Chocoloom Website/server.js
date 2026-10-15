const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const websiteDir = __dirname;
const adminDir = path.resolve(__dirname, '../Chocoloom Website (Admin)');

// Cloud endpoints to sync live
const CLOUD_ENDPOINTS = [
    'https://chocoloom.com/wp-json/chocoloom/v1/catalog',
    'https://orders.chocoloom.com/wp-json/chocoloom/v1/catalog'
];

function forwardCatalogToLiveCloud(payload) {
    const dataString = JSON.stringify(payload);
    CLOUD_ENDPOINTS.forEach(endpointUrl => {
        try {
            const url = new URL(endpointUrl);
            const req = https.request({
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(dataString)
                },
                timeout: 5000
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    console.log(`☁️ Synced catalog to Cloud [${url.hostname}] (HTTP ${res.statusCode})`);
                });
            });
            req.on('error', (err) => {
                console.warn(`⚠️ Cloud sync warning for ${url.hostname}:`, err.message);
            });
            req.write(dataString);
            req.end();
        } catch (e) {
            console.warn('⚠️ Cloud sync exception:', e.message);
        }
    });
}

const server = http.createServer((req, res) => {
    // Enable CORS for mobile development, fonts, and cross-tab admin sync
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-WP-Nonce, X-Requested-With');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    const reqPath = decodeURI(parsedUrl.pathname);

    // =========================================================================
    // 1. Handle Save Catalog POST Endpoints (Sync from Admin Panel)
    // =========================================================================
    if (req.method === 'POST' && (
        reqPath === '/save_catalog' || 
        reqPath === '/save_catalog.php' || 
        reqPath === '/api/save_catalog.php' ||
        reqPath === '/wp-json/chocoloom/v1/catalog'
    )) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                payload.updated_at = new Date().toISOString();

                // Save to local catalog_overrides.json in both directories
                const targetFiles = [
                    path.join(websiteDir, 'catalog_overrides.json'),
                    path.join(adminDir, 'catalog_overrides.json')
                ];

                targetFiles.forEach(targetFile => {
                    try {
                        let existing = {};
                        if (fs.existsSync(targetFile)) {
                            try { existing = JSON.parse(fs.readFileSync(targetFile, 'utf8')); } catch(e) {}
                        }
                        const merged = {
                            updated_at: payload.updated_at,
                            overrides: { ...(existing.overrides || {}), ...(payload.overrides || {}) },
                            customProducts: payload.customProducts || existing.customProducts || [],
                            deletedProducts: Array.from(new Set([...(existing.deletedProducts || []), ...(payload.deletedProducts || [])])),
                            banners: payload.banners || existing.banners || [],
                            store_status: payload.store_status || existing.store_status || 'open'
                        };
                        fs.writeFileSync(targetFile, JSON.stringify(merged, null, 2), 'utf8');
                    } catch(err) {
                        console.warn(`Could not write to ${targetFile}:`, err.message);
                    }
                });

                console.log(`💾 Catalog overrides saved locally at ${payload.updated_at}!`);

                // Also asynchronously forward to live Hostinger sites in real-time
                forwardCatalogToLiveCloud(payload);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Catalog overrides saved to local files and synced to live Cloud!',
                    data: payload
                }));
            } catch(e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON payload', details: e.message }));
            }
        });
        return;
    }

    // =========================================================================
    // 2. Handle GET Catalog Overrides JSON
    // =========================================================================
    if (req.method === 'GET' && (
        reqPath === '/save_catalog' || 
        reqPath === '/save_catalog.php' ||
        reqPath === '/wp-json/chocoloom/v1/catalog' ||
        reqPath === '/catalog_overrides.json'
    )) {
        const jsonPath = path.join(websiteDir, 'catalog_overrides.json');
        if (fs.existsSync(jsonPath)) {
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            fs.createReadStream(jsonPath).pipe(res);
            return;
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ overrides: {}, customProducts: [], deletedProducts: [], banners: [], store_status: 'open' }));
            return;
        }
    }

    // =========================================================================
    // 3. Handle Admin Panel route: /admin or /admin.html
    // =========================================================================
    if (reqPath === '/admin' || reqPath === '/admin.html') {
        const adminHtmlPath = path.join(adminDir, 'index.html');
        if (fs.existsSync(adminHtmlPath)) {
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            fs.createReadStream(adminHtmlPath).pipe(res);
            return;
        }
    }

    // Also serve admin-specific files (admin.js, admin_styles.css)
    if (reqPath === '/admin.js' || reqPath === '/admin_styles.css') {
        const adminAssetPath = path.join(adminDir, reqPath.slice(1));
        if (fs.existsSync(adminAssetPath)) {
            const ext = path.extname(adminAssetPath).toLowerCase();
            res.writeHead(200, {
                'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            fs.createReadStream(adminAssetPath).pipe(res);
            return;
        }
    }

    // =========================================================================
    // 4. Default Static File Server for Customer Storefront
    // =========================================================================
    let reqUrl = reqPath;
    if (reqUrl === '/') reqUrl = '/order.html';

    let filePath = path.join(websiteDir, reqUrl);

    // Prevent directory traversal
    if (!filePath.startsWith(websiteDir)) {
        res.writeHead(403);
        res.end('Access Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            if (fs.existsSync(filePath + '.html')) {
                filePath = filePath + '.html';
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`404 Not Found: ${reqUrl}`);
                return;
            }
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

function getLocalIpAddresses() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                ips.push(net.address);
            }
        }
    }
    return ips;
}

server.listen(PORT, HOST, () => {
    const ips = getLocalIpAddresses();
    console.log(`\n======================================================`);
    console.log(` 🚀 Chocoloom Local Dev Server is LIVE!`);
    console.log(`======================================================`);
    console.log(` 🍰 Customer Storefront:`);
    console.log(`    http://localhost:${PORT}/order.html`);
    console.log(` 👑 Live Admin Panel:`);
    console.log(`    http://localhost:${PORT}/admin`);
    console.log(`\n 📱 On your Mobile Phone (connected to same Wi-Fi):`);
    ips.forEach(ip => {
        console.log(`    http://${ip}:${PORT}/order.html`);
    });
    console.log(`======================================================\n`);
});
