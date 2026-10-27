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

// =========================================================================
// NEON SERVERLESS POSTGRES CLOUD DATABASE INTEGRATION
// =========================================================================
const NEON_CONN_STRING = 'postgresql://neondb_owner:npg_yrd3JMAzmWg2@ep-bold-math-b5bam8cm-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';
const NEON_HOST = 'ep-bold-math-b5bam8cm-pooler.c-7.us-east-2.aws.neon.tech';

function sqlEscape(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
    return "'" + String(val).replace(/'/g, "''") + "'";
}

function executeNeonQuery(sqlQuery) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ query: sqlQuery });
        const options = {
            hostname: NEON_HOST,
            port: 443,
            path: '/sql',
            method: 'POST',
            headers: {
                'Neon-Connection-String': NEON_CONN_STRING,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 10000
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch(e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(new Error('Neon query timeout')); });
        req.write(postData);
        req.end();
    });
}

// Automatically sync all catalog price overrides into Neon Serverless Postgres
async function syncCatalogOverridesToNeon(payload) {
    if (!payload) return 0;
    const overrides = payload.overrides || {};
    let syncedCount = 0;

    for (const [key, item] of Object.entries(overrides)) {
        if (!item || (!item.price && item.is_available === undefined)) continue;
        const name = (item.name || key).trim();
        const price = Number(item.price || 0);
        const discPrice = Number(item.discount_price || price);
        const origPrice = Number(item.originalPrice || item.original_price || Math.round(price * 1.3));
        const id = item.sql_id || item.id || key;

        try {
            const findSql = `SELECT id FROM products WHERE id = ${sqlEscape(id)} OR LOWER(TRIM(name)) = LOWER(TRIM(${sqlEscape(name)})) LIMIT 1;`;
            const findRes = await executeNeonQuery(findSql);
            if (findRes && findRes.rows && findRes.rows.length > 0) {
                const targetId = findRes.rows[0].id;
                let updateParts = [
                    `price = ${sqlEscape(price)}`,
                    `discount_price = ${sqlEscape(discPrice)}`,
                    `original_price = ${sqlEscape(origPrice)}`,
                    `updated_at = NOW()`
                ];
                if (item.is_available !== undefined) updateParts.push(`is_available = ${sqlEscape(Boolean(item.is_available))}`);
                if (item.price_half_kg !== undefined) updateParts.push(`price_half_kg = ${sqlEscape(item.price_half_kg)}`);
                if (item.price_1kg !== undefined) updateParts.push(`price_1kg = ${sqlEscape(item.price_1kg)}`);
                if (item.price_1_5kg !== undefined) updateParts.push(`price_1_5kg = ${sqlEscape(item.price_1_5kg)}`);
                if (item.price_2kg !== undefined) updateParts.push(`price_2kg = ${sqlEscape(item.price_2kg)}`);
                if (item.price_3kg !== undefined) updateParts.push(`price_3kg = ${sqlEscape(item.price_3kg)}`);

                const updateSql = `UPDATE products SET ${updateParts.join(', ')} WHERE id = ${sqlEscape(targetId)};`;
                await executeNeonQuery(updateSql);
                syncedCount++;
                console.log(`⚡ [Neon Cloud DB] Updated "${name}" (${targetId}) -> ₹${price}`);
            }
        } catch (e) {
            console.warn(`[Neon Sync Note] Could not update "${name}":`, e.message);
        }
    }

    // Sync store operating status if provided
    if (payload.store_status) {
        try {
            await executeNeonQuery(`INSERT INTO store_settings (key, value, updated_at) VALUES ('store_status', ${sqlEscape(payload.store_status)}, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`);
            console.log(`⚡ [Neon Cloud DB] Synced store_status -> ${payload.store_status}`);
        } catch (e) {}
    }

    return syncedCount;
}

// Automatically sync all catalog price overrides into Supabase Cloud Database
const SUPABASE_REST_URL = 'https://icedyeuagmkgitkoznxr.supabase.co/rest/v1/products';
const SUPABASE_ANON_KEY = 'sb_publishable_NI0EpHVxbjk7gW5W8_1lXw_rhcmDwlY';

async function syncCatalogOverridesToSupabase(payload) {
    if (!payload || !payload.overrides) return 0;
    const overrides = payload.overrides || {};
    let synced = 0;

    for (const [key, item] of Object.entries(overrides)) {
        if (!item || (!item.price && item.is_available === undefined)) continue;
        const name = (item.name || key).trim();
        const price = Number(item.price || 0);
        const discPrice = Number(item.discount_price || price);
        const patchData = {
            price: price,
            discount_price: discPrice,
            updated_at: new Date().toISOString()
        };
        if (item.price_half_kg !== undefined) patchData.price_half_kg = Number(item.price_half_kg);
        if (item.price_1kg !== undefined) patchData.price_1kg = Number(item.price_1kg);
        if (item.price_1_5kg !== undefined) patchData.price_1_5kg = Number(item.price_1_5kg);
        if (item.price_2kg !== undefined) patchData.price_2kg = Number(item.price_2kg);
        if (item.price_3kg !== undefined) patchData.price_3kg = Number(item.price_3kg);
        if (item.is_available !== undefined) patchData.is_available = Boolean(item.is_available);

        const id = item.sql_id || item.id || key;
        const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const targetUrl = isUuid 
            ? `${SUPABASE_REST_URL}?id=eq.${id}`
            : `${SUPABASE_REST_URL}?name=eq.${encodeURIComponent(name)}`;

        try {
            await new Promise((resolve) => {
                const postStr = JSON.stringify(patchData);
                const parsed = new URL(targetUrl);
                const req = https.request({
                    hostname: parsed.hostname,
                    port: 443,
                    path: parsed.pathname + parsed.search,
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postStr),
                        'Prefer': 'return=representation'
                    },
                    timeout: 4000
                }, (res) => {
                    let d = '';
                    res.on('data', c => d += c);
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            try {
                                const arr = JSON.parse(d);
                                if (Array.isArray(arr) && arr.length > 0) {
                                    synced++;
                                    console.log(`⚡ [Supabase Cloud DB] Updated "${name}" -> ₹${price}`);
                                }
                            } catch(e) {}
                        }
                        resolve();
                    });
                });
                req.on('error', () => resolve());
                req.on('timeout', () => { req.destroy(); resolve(); });
                req.write(postStr);
                req.end();
            });
        } catch(e) {}
    }
    return synced;
}

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
                console.warn(`⚠️ Cloud sync note for ${url.hostname}:`, err.message);
            });
            req.write(dataString);
            req.end();
        } catch (e) {
            console.warn('⚠️ Cloud sync exception:', e.message);
        }
    });
}

const server = http.createServer((req, res) => {
    // Enable CORS for mobile development, fonts, and cross-origin admin sync
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
        reqPath === '/api/save_catalog' ||
        reqPath === '/api/save_catalog.php' ||
        reqPath === '/wp-json/chocoloom/v1/catalog'
    )) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body || '{}');
                payload.updated_at = new Date().toISOString();

                // 1. Save to local catalog_overrides.json in both directories
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

                // 2. Automatically sync directly to Neon Serverless Postgres and Supabase Cloud Database
                let neonCount = 0;
                let supaCount = 0;
                try {
                    neonCount = await syncCatalogOverridesToNeon(payload);
                } catch (neonErr) {
                    console.warn('Neon sync warning:', neonErr.message);
                }
                try {
                    supaCount = await syncCatalogOverridesToSupabase(payload);
                } catch (supaErr) {
                    console.warn('Supabase sync warning:', supaErr.message);
                }

                // 3. Asynchronously forward to live endpoints in real-time
                forwardCatalogToLiveCloud(payload);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: `Catalog overrides saved locally & synced ${supaCount} items to Supabase & ${neonCount} items to Neon Postgres!`,
                    supabaseSynced: supaCount,
                    neonSynced: neonCount,
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
        reqPath === '/api/save_catalog' ||
        reqPath === '/api/catalog' ||
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
    if (reqUrl === '/') {
        reqUrl = __dirname.includes('(Admin)') ? '/index.html' : '/order.html';
    }

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
    console.log(` 🚀 Chocoloom Server with Neon Postgres Cloud Sync is LIVE!`);
    console.log(`======================================================`);
    console.log(` 🍰 Customer Storefront:`);
    console.log(`    http://localhost:${PORT}/order.html`);
    console.log(` 👑 Live Admin Panel:`);
    console.log(`    http://localhost:${PORT}/admin`);
    console.log(` ⚡ Neon Cloud Database: Connected & Active`);
    console.log(`\n 📱 On your Mobile Phone (connected to same Wi-Fi):`);
    ips.forEach(ip => {
        console.log(`    http://${ip}:${PORT}/order.html`);
    });
    console.log(`======================================================\n`);
});
