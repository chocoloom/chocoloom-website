/**
 * Chocoloom Local Catalog Sync Server (Optional Background Daemon)
 * Listens on port 3001 and saves price & catalog updates directly to disk:
 * 1. catalog_overrides.json
 * 2. data.js
 *
 * Usage: node sync_server.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

// Resolve directories
const currentDir = __dirname;
const adminDir = path.resolve(__dirname, '../Chocoloom Website (Admin)');
const websiteDir = path.resolve(__dirname, '../Chocoloom Website');

const targetOverrideFiles = [
    path.join(currentDir, 'catalog_overrides.json'),
    path.join(adminDir, 'catalog_overrides.json'),
    path.join(websiteDir, 'catalog_overrides.json')
].filter((p, idx, self) => fs.existsSync(path.dirname(p)) && self.indexOf(p) === idx);

const catalogOverridesPath = targetOverrideFiles[0] || path.join(currentDir, 'catalog_overrides.json');

const server = http.createServer((req, res) => {
    // CORS headers for all local origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/save_catalog' || req.url === '/api/save_catalog')) {
        let currentData = { overrides: {}, customProducts: [], deletedProducts: [], banners: [] };
        if (fs.existsSync(catalogOverridesPath)) {
            try {
                currentData = JSON.parse(fs.readFileSync(catalogOverridesPath, 'utf8'));
            } catch(e) {}
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(currentData));
        return;
    }

    if (req.method === 'GET' && req.url.startsWith('/uploads/')) {
        const filePath = path.join(currentDir, req.url);
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    if (req.method === 'POST' && (req.url === '/upload_image' || req.url === '/api/upload_image')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                const targetUploadDirs = [
                    path.join(currentDir, 'uploads'),
                    path.join(adminDir, 'uploads'),
                    path.join(websiteDir, 'uploads')
                ].filter((p, idx, self) => fs.existsSync(path.dirname(p)) && self.indexOf(p) === idx);

                let dataStr = parsed.data || '';
                let ext = 'jpg';
                const match = dataStr.match(/^data:image\/(\w+);base64,/);
                if (match) {
                    ext = match[1] === 'jpeg' ? 'jpg' : match[1];
                    dataStr = dataStr.replace(/^data:image\/\w+;base64,/, '');
                }
                const filename = `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

                targetUploadDirs.forEach(dir => {
                    try {
                        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                        fs.writeFileSync(path.join(dir, filename), Buffer.from(dataStr, 'base64'));
                    } catch(e) {
                        console.warn('Could not write uploaded image to', dir, e.message);
                    }
                });

                console.log(`[${new Date().toLocaleTimeString()}] 📷 Uploaded image saved: uploads/${filename}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, url: 'uploads/' + filename, filename: filename }));
            } catch(e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    if (req.method === 'POST' && (req.url === '/save_catalog' || req.url === '/api/save_catalog')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                let existing = { overrides: {}, customProducts: [], deletedProducts: [], banners: [] };
                if (fs.existsSync(catalogOverridesPath)) {
                    try {
                        existing = JSON.parse(fs.readFileSync(catalogOverridesPath, 'utf8'));
                    } catch(e) {}
                }

                const merged = {
                    updated_at: new Date().toISOString(),
                    overrides: { ...(existing.overrides || {}), ...(payload.overrides || {}) },
                    customProducts: payload.customProducts || existing.customProducts || [],
                    deletedProducts: Array.from(new Set([...(existing.deletedProducts || []), ...(payload.deletedProducts || [])])),
                    banners: payload.banners !== undefined ? payload.banners : (existing.banners || [])
                };

                // Write to catalog_overrides.json in all target locations
                targetOverrideFiles.forEach(targetPath => {
                    try {
                        fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2), 'utf8');
                    } catch(e) {
                        console.warn('Could not write to', targetPath, e.message);
                    }
                });

                console.log(`[${new Date().toLocaleTimeString()}] ✅ Catalog synced to disk: ${merged.banners ? merged.banners.length : 0} banners, ${Object.keys(merged.overrides).length} overrides.`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Catalog saved to disk', data: merged }));
            } catch(err) {
                console.error('Save catalog error:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    if (req.method === 'POST' && (req.url === '/api/send_otp' || req.url === '/send_otp')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const rawPhone = String(payload.phone || '').replace(/\D/g, '');
                const cleanPhone = rawPhone.slice(-10);
                const otp = String(payload.otp || '').replace(/\D/g, '');
                const authKey = '578220ADr54BbXE3Bj6aca415dP1';

                const targetUrl = `https://control.msg91.com/api/v5/otp?mobile=91${cleanPhone}&authkey=${authKey}&otp_length=4${otp ? `&otp=${otp}` : ''}`;

                const proxyReq = https.request(targetUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (proxyRes) => {
                    let resData = '';
                    proxyRes.on('data', d => { resData += d; });
                    proxyRes.on('end', () => {
                        console.log(`[${new Date().toLocaleTimeString()}] 📱 MSG91 OTP Dispatch (+91 ${cleanPhone}):`, resData);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(resData);
                    });
                });

                proxyReq.on('error', (e) => {
                    console.warn('MSG91 proxy error:', e.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                });

                proxyReq.end();
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Chocoloom Local Sync Server running at http://127.0.0.1:${PORT}`);
    console.log(`📁 Overrides file: ${catalogOverridesPath}`);
});
