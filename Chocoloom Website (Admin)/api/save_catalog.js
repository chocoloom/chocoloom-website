const https = require('https');

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

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            const data = await executeNeonQuery('SELECT * FROM products ORDER BY category, name ASC;');
            res.status(200).json({ success: true, count: data.rows ? data.rows.length : 0, products: data.rows || [] });
        } catch(e) {
            res.status(500).json({ error: e.message });
        }
        return;
    }

    if (req.method === 'POST') {
        try {
            const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
            const overrides = payload.overrides || {};
            let synced = 0;

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
                        synced++;
                    }
                } catch(e) {}
            }

            if (payload.store_status) {
                try {
                    await executeNeonQuery(`INSERT INTO store_settings (key, value, updated_at) VALUES ('store_status', ${sqlEscape(payload.store_status)}, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`);
                } catch(e) {}
            }

            res.status(200).json({ success: true, synced: synced, message: `Synced ${synced} products to Neon Postgres cloud database.` });
        } catch(e) {
            res.status(400).json({ error: 'Failed to process update', details: e.message });
        }
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
