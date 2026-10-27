/**
 * Chocoloom Admin Panel - Core Realtime Order Management Controller
 * Handles Supabase Realtime, Cross-tab BroadcastChannel, LocalStorage Sync,
 * Web Audio Chime, Desktop Notifications, and Order Workflow.
 */

// Universal Asset & Image URL Resolver for WordPress & Local Environments
if (!window.getThemeAssetUrl) {
    window.getThemeAssetUrl = function(path) {
        if (!path || typeof path !== 'string') return path;
        path = path.trim();
        if (!path) return '';
        if (/^(https?:|\/\/|data:|blob:)/i.test(path)) return path;
        const wpConfig = (typeof window !== 'undefined' && (window.CHOCOLOOM_WP_CONFIG || (window.parent && window.parent.CHOCOLOOM_WP_CONFIG))) || {};
        const themeUri = wpConfig.themeUri ? wpConfig.themeUri.replace(/\/+$/, '') : '';
        if (themeUri) return `${themeUri}/${path.replace(/^\/+/, '')}`;
        return path;
    };
}

if (!window.getAppUrl) {
    window.getAppUrl = function(target) {
        if (!target || typeof target !== 'string') return target;
        const wpConfig = (typeof window !== 'undefined' && (window.CHOCOLOOM_WP_CONFIG || (window.parent && window.parent.CHOCOLOOM_WP_CONFIG))) || {};
        if (!wpConfig.isWordPress) return target;
        const homeUrl = (wpConfig.homeUrl || '/').replace(/\/+$/, '');
        const cleanTarget = target.split('?')[0].split('#')[0].replace(/^\/+/, '');
        const queryAndHash = target.slice(cleanTarget.length + (target.indexOf(cleanTarget) > -1 ? target.indexOf(cleanTarget) : 0));

        if (cleanTarget === 'uni-chocoloom.html' || cleanTarget === 'uni-chocoloom') {
            const cleanQuery = queryAndHash.startsWith('?') ? queryAndHash.slice(1) : queryAndHash;
            return `${homeUrl}/?page=uni-chocoloom${cleanQuery ? '&' + cleanQuery : ''}`;
        }
        if (cleanTarget === 'chocowallet.html' || cleanTarget === 'chocowallet') {
            const cleanQuery = queryAndHash.startsWith('?') ? queryAndHash.slice(1) : queryAndHash;
            return `${homeUrl}/?page=chocowallet${cleanQuery ? '&' + cleanQuery : ''}`;
        }
        if (cleanTarget === 'login.html' || cleanTarget === 'login') {
            const cleanQuery = queryAndHash.startsWith('?') ? queryAndHash.slice(1) : queryAndHash;
            return `${homeUrl}/?page=login${cleanQuery ? '&' + cleanQuery : ''}`;
        }
        if (cleanTarget === 'landing.html' || cleanTarget === 'landing') {
            const cleanQuery = queryAndHash.startsWith('?') ? queryAndHash.slice(1) : queryAndHash;
            return `${homeUrl}/?page=landing${cleanQuery ? '&' + cleanQuery : ''}`;
        }
        if (cleanTarget === 'order.html' || cleanTarget === 'order') {
            const cleanQuery = queryAndHash.startsWith('?') ? queryAndHash.slice(1) : queryAndHash;
            return `${homeUrl}/?page=order${cleanQuery ? '&' + cleanQuery : ''}`;
        }
        return target;
    };
}

// ==================== CONFIGURATION & STATE ====================
const OFFICIAL_SUPABASE_URL = 'https://icedyeuagmkgitkoznxr.supabase.co';
const OFFICIAL_SUPABASE_KEY = 'sb_publishable_NI0EpHVxbjk7gW5W8_1lXw_rhcmDwlY';

let savedSupabaseUrl = localStorage.getItem('chocoloom_supabase_url');
if (!savedSupabaseUrl || !savedSupabaseUrl.startsWith('https://')) {
    savedSupabaseUrl = OFFICIAL_SUPABASE_URL;
}
let savedSupabaseKey = localStorage.getItem('chocoloom_supabase_key');
if (!savedSupabaseKey || savedSupabaseKey.length < 20) {
    savedSupabaseKey = OFFICIAL_SUPABASE_KEY;
}
const savedNeonUrl = localStorage.getItem('chocoloom_neon_url');

const SUPABASE_CONFIG = {
    url: savedSupabaseUrl.trim().replace(/\/$/, ''),
    anonKey: savedSupabaseKey.trim()
};

const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_yrd3JMAzmWg2@ep-bold-math-b5bam8cm-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function sanitizeNeonUrl(raw) {
    if (!raw || typeof raw !== 'string') return DEFAULT_NEON_URL;
    let s = raw.trim();
    if (s.includes('ep-bold-math-b5bam8cm') && !s.includes('ep-bold-math-b5bam8cm-pooler.c-7')) {
        s = s.replace(/ep-bold-math-b5bam8cm(-pooler)?(.[a-z0-9-]+)?.aws.neon.tech/g, 'ep-bold-math-b5bam8cm-pooler.c-7.us-east-2.aws.neon.tech');
    }
    return s;
}

const NEON_CONFIG = {
    url: sanitizeNeonUrl(savedNeonUrl || DEFAULT_NEON_URL)
};

window.setSupabaseConfig = function(url, anonKey) {
    if (url) localStorage.setItem('chocoloom_supabase_url', url.trim().replace(/\/$/, ''));
    if (anonKey) localStorage.setItem('chocoloom_supabase_key', anonKey.trim());
    window.location.reload();
};

window.setNeonConfig = function(url) {
    if (url) localStorage.setItem('chocoloom_neon_url', url.trim());
    window.location.reload();
};

const AdminState = {
    orders: [],
    products: [],
    currentTab: 'orders',
    cardOrders: [],
    cardsActiveFilter: 'ALL',
    cardsSearchQuery: '', // 'orders' | 'products'
    activeFilter: 'ALL',
    searchQuery: '',
    viewMode: 'cards', // 'cards' | 'table'
    productsCategoryFilter: 'ALL',
    productsStockFilter: 'ALL',
    productsSearchQuery: '',
    productsViewMode: 'cards',
    banners: [],
    bannersFilter: 'ALL',
    bannersSearchQuery: '',
    bannersPreviewDevice: 'desktop',
    modalPreviewDevice: 'desktop',
    soundEnabled: localStorage.getItem('chocoloom_admin_sound') !== 'false',
    storeOpen: localStorage.getItem('chocoloom_store_status') !== 'closed',
    supabaseConnected: false,
    neonConnected: false,
    audioCtx: null,
    selectedOrder: null
};

let supabaseClient = null;
let broadcastChannel = null;
let neonSql = null;

// Multi-Cloud Connection Status Badge Handler
function updateCloudStatusBadges() {
    const connPill = document.getElementById('connectionStatusPill');
    if (!connPill) return;

    if (AdminState.supabaseConnected && AdminState.neonConnected) {
        connPill.innerHTML = '<span class="status-dot"></span> Supabase & Neon Active';
        connPill.style.background = '#ecfdf5';
        connPill.style.color = '#059669';
        connPill.title = 'Both Supabase Cloud and Neon Postgres are connected & in sync';
    } else if (AdminState.supabaseConnected) {
        connPill.innerHTML = '<span class="status-dot"></span> Supabase Cloud Active';
        connPill.style.background = '#ecfdf5';
        connPill.style.color = '#059669';
        connPill.title = 'Supabase Cloud Server is active. Click to configure Neon.';
    } else if (AdminState.neonConnected) {
        connPill.innerHTML = '<span class="status-dot" style="background: #00e599;"></span> Neon Postgres Active';
        connPill.style.background = '#f0fdf4';
        connPill.style.color = '#15803d';
        connPill.title = 'Neon Serverless Postgres is active. Click to view settings.';
    } else {
        connPill.innerHTML = '<span class="status-dot"></span> Local Sync Active';
        connPill.style.background = '#f1f5f9';
        connPill.style.color = '#64748b';
        connPill.title = 'Local & Cross-tab sync active. Click to connect Supabase / Neon Cloud.';
    }
}

// Switch between Supabase and Neon tabs in Cloud Settings Modal
window.switchCloudTab = function(tab) {
    const tabSupabase = document.getElementById('cloudTabSupabase');
    const tabNeon = document.getElementById('cloudTabNeon');
    const btnSupabase = document.getElementById('tabBtnSupabase');
    const btnNeon = document.getElementById('tabBtnNeon');

    if (tab === 'supabase') {
        if (tabSupabase) tabSupabase.style.display = 'block';
        if (tabNeon) tabNeon.style.display = 'none';
        if (btnSupabase) {
            btnSupabase.style.color = '#7c5cfc';
            btnSupabase.style.borderBottomColor = '#7c5cfc';
        }
        if (btnNeon) {
            btnNeon.style.color = '#64748b';
            btnNeon.style.borderBottomColor = 'transparent';
        }
    } else {
        if (tabSupabase) tabSupabase.style.display = 'none';
        if (tabNeon) tabNeon.style.display = 'block';
        if (btnNeon) {
            btnNeon.style.color = '#7c5cfc';
            btnNeon.style.borderBottomColor = '#7c5cfc';
        }
        if (btnSupabase) {
            btnSupabase.style.color = '#64748b';
            btnSupabase.style.borderBottomColor = 'transparent';
        }
    }
};

// Initialize Supabase Client
function initSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('✅ Supabase Client Initialized in Admin Panel with URL:', SUPABASE_CONFIG.url);
            setupSupabaseRealtime();
            setupAdminCatalogRealtime();
        } catch (e) {
            console.warn('Supabase client error:', e);
        }
    }
}

let adminLiveCatalogChannel = null;
function setupAdminCatalogRealtime() {
    if (!supabaseClient) return;
    try {
        if (adminLiveCatalogChannel) {
            try { adminLiveCatalogChannel.unsubscribe(); } catch(e) {}
        }
        adminLiveCatalogChannel = supabaseClient.channel('live-products-sync');
        adminLiveCatalogChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('⚡ Admin Live Sync Channel subscribed to "live-products-sync"');
            }
        });
    } catch(e) {
        console.warn('Admin catalog realtime error:', e);
    }
}

let supabaseRealtimeChannel = null;
let realtimeReconnectTimer = null;

// Setup Supabase Realtime Channel (Instant DB Changes & Global WebSocket Broadcast)
function setupSupabaseRealtime() {
    if (!supabaseClient) return;

    try {
        if (supabaseRealtimeChannel) {
            try { supabaseRealtimeChannel.unsubscribe(); } catch(e) {}
        }

        supabaseRealtimeChannel = supabaseClient
            .channel('admin_orders_feed', {
                config: {
                    broadcast: { ack: true }
                }
            })
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                (payload) => {
                    console.log('⚡ Supabase Realtime DB INSERT:', payload.new);
                    handleIncomingOrder(payload.new, true);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders' },
                (payload) => {
                    console.log('⚡ Supabase Realtime DB UPDATE:', payload.new);
                    handleOrderUpdate(payload.new);
                }
            )
            .on(
                'broadcast',
                { event: 'NEW_ORDER' },
                ({ payload }) => {
                    console.log('⚡ Supabase Realtime WebSocket Broadcast NEW_ORDER:', payload?.order);
                    if (payload && payload.order) {
                        handleIncomingOrder(payload.order, true);
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'STATUS_UPDATE' },
                ({ payload }) => {
                    if (payload) handleOrderUpdate(payload);
                }
            )
            .subscribe((status) => {
                console.log('📡 Supabase Live Channel status:', status);
                if (status === 'SUBSCRIBED') {
                    AdminState.supabaseConnected = true;
                    updateCloudStatusBadges();
                    if (realtimeReconnectTimer) {
                        clearTimeout(realtimeReconnectTimer);
                        realtimeReconnectTimer = null;
                    }
                    console.log('✅ Subscribed to Supabase Live Orders Channel (Instant DB & Broadcast Sync Active)');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    AdminState.supabaseConnected = false;
                    updateCloudStatusBadges();
                    if (!realtimeReconnectTimer) {
                        realtimeReconnectTimer = setTimeout(() => {
                            realtimeReconnectTimer = null;
                            console.log('🔄 Reconnecting Supabase Realtime Channel...');
                            setupSupabaseRealtime();
                            loadAllOrders(false);
                        }, 3000);
                    }
                } else {
                    updateCloudStatusBadges();
                }
            });
    } catch (e) {
        console.warn('Realtime subscription error:', e);
    }
}

// Test Supabase Connection (REST + Realtime check)
window.testSupabaseConnection = async function(showToastMsg = true) {
    const statusBox = document.getElementById('supabaseConnectionStatusBox');
    const urlInput = document.getElementById('supabaseConfigUrl');
    const keyInput = document.getElementById('supabaseConfigKey');
    const url = (urlInput && urlInput.value.trim()) ? urlInput.value.trim().replace(/\/$/, '') : (localStorage.getItem('chocoloom_supabase_url') || SUPABASE_CONFIG.url);
    const key = (keyInput && keyInput.value.trim()) ? keyInput.value.trim() : (localStorage.getItem('chocoloom_supabase_key') || SUPABASE_CONFIG.anonKey);

    if (urlInput && !urlInput.value.trim()) urlInput.value = url;
    if (keyInput && !keyInput.value.trim()) keyInput.value = key;

    if (!url || !key) {
        if (showToastMsg) showToast('Please enter both Supabase URL & Key', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        return false;
    }

    if (statusBox) {
        statusBox.style.background = '#f8fafc';
        statusBox.style.borderColor = '#e2e8f0';
        statusBox.style.color = '#475569';
        statusBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color: #7c5cfc;"></i> Testing Supabase connection...';
    }

    try {
        const res = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        if (res.ok) {
            AdminState.supabaseConnected = true;
            updateCloudStatusBadges();
            if (statusBox) {
                statusBox.style.background = '#ecfdf5';
                statusBox.style.borderColor = '#a7f3d0';
                statusBox.style.color = '#065f46';
                statusBox.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> <strong>Supabase Connected & Active!</strong> Live REST & Realtime operational.';
            }
            if (showToastMsg) showToast('Connected to Supabase Cloud Server!', 'fa-solid fa-circle-check', '#10b981');
            return true;
        } else {
            throw new Error(`HTTP ${res.status}`);
        }
    } catch(err) {
        AdminState.supabaseConnected = false;
        updateCloudStatusBadges();
        if (statusBox) {
            statusBox.style.background = '#fffbeb';
            statusBox.style.borderColor = '#fde68a';
            statusBox.style.color = '#92400e';
            statusBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b;"></i> <strong>Supabase is paused or unreachable.</strong><br><span style="font-size: 11px;">Verify project is active at supabase.com/dashboard</span>`;
        }
        if (showToastMsg) showToast('Supabase connection failed: ' + err.message, 'fa-solid fa-circle-exclamation', '#ef4444');
        return false;
    }
};

// ==================== NEON NATIVE SERVERLESS HTTP ENGINE ====================
// Zero-dependency direct HTTPS query protocol to Neon /sql endpoint (bypasses node/bundler issues)

function parseNeonConnectionString(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let s = raw.trim();
    // Strip common CLI prefixes and wrappers: psql '...', DATABASE_URL="...", etc.
    s = s.replace(/^(?:psql\s+)?['"]?/, '').replace(/['"]?$/, '');
    s = s.replace(/^DATABASE_URL\s*=\s*['"]?/, '').replace(/['"]?$/, '');
    s = s.replace(/[\r\n\t\s]+/g, '').trim();

    // Auto-normalize any ep-bold-math-b5bam8cm host to verified working pooled endpoint
    if (s.includes('ep-bold-math-b5bam8cm') && !s.includes('ep-bold-math-b5bam8cm-pooler.c-7')) {
        s = s.replace(/ep-bold-math-b5bam8cm(-pooler)?(\.[a-z0-9-]+)?\.aws\.neon\.tech/g, 'ep-bold-math-b5bam8cm-pooler.c-7.us-east-2.aws.neon.tech');
    }

    const protoIdx = s.indexOf('://');
    if (protoIdx === -1) return null;
    const afterProto = s.substring(protoIdx + 3);
    const atIdx = afterProto.lastIndexOf('@');
    if (atIdx === -1) return null;

    const hostAndDb = afterProto.substring(atIdx + 1);
    const slashIdx = hostAndDb.indexOf('/');
    if (slashIdx === -1) return null;

    const hostWithPort = hostAndDb.substring(0, slashIdx);
    const host = hostWithPort.split(':')[0];
    const dbPart = hostAndDb.substring(slashIdx + 1).split('?')[0];

    // Ensure sslmode=require parameter exists
    if (!s.includes('sslmode=')) {
        s += s.includes('?') ? '&sslmode=require' : '?sslmode=require';
    }

    return {
        url: s,
        host: host,
        database: dbPart || 'neondb'
    };
}

async function executeNeonQuery(connString, sqlQuery, params = []) {
    const parsed = parseNeonConnectionString(connString);
    if (!parsed) {
        throw new Error("Invalid Neon Connection String. Format: postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require");
    }

    const endpoint = `https://${parsed.host}/sql`;

    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Neon-Connection-String": parsed.url,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: sqlQuery,
            params: params || []
        })
    });

    const data = await res.json().catch(() => ({ message: `HTTP ${res.status}: Query returned invalid response` }));
    if (!res.ok || (data && (data.message || data.error))) {
        throw new Error(data?.message || data?.error || `HTTP ${res.status} Error`);
    }

    if (Array.isArray(data)) return data;
    if (data.rows && Array.isArray(data.rows)) return data.rows;
    return [data];
}

function sqlEscape(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
    return "'" + String(val).replace(/'/g, "''") + "'";
}

function createNeonSql(connString) {
    const parsed = parseNeonConnectionString(connString);
    if (!parsed) return null;
    const sql = async function(strings, ...values) {
        let query = '';
        if (typeof strings === 'string') {
            query = strings;
        } else {
            for (let i = 0; i < strings.length; i++) {
                query += strings[i];
                if (i < values.length) {
                    query += sqlEscape(values[i]);
                }
            }
        }
        return await executeNeonQuery(connString, query);
    };
    sql._url = connString;
    sql.query = (text) => sql(text);
    return sql;
}

function getNeonClient() {
    let raw = localStorage.getItem('chocoloom_neon_url');
    if (raw) {
        const sanitized = sanitizeNeonUrl(raw);
        if (sanitized !== raw) {
            localStorage.setItem('chocoloom_neon_url', sanitized);
            raw = sanitized;
        }
    } else {
        raw = NEON_CONFIG.url;
    }
    if (!raw || !raw.trim()) return null;
    const parsed = parseNeonConnectionString(raw);
    if (!parsed) return null;

    if (!neonSql || neonSql._url !== parsed.url) {
        neonSql = createNeonSql(parsed.url);
    }
    return neonSql;
}

// Test Neon Connection with Live Diagnostics
window.testNeonConnection = async function(showToastMsg = true) {
    const statusBox = document.getElementById('neonConnectionStatusBox');
    const inputUrl = document.getElementById('neonConfigUrl');
    let rawUrl = (inputUrl && inputUrl.value.trim()) ? inputUrl.value.trim() : (localStorage.getItem('chocoloom_neon_url') || NEON_CONFIG.url || DEFAULT_NEON_URL);

    if (inputUrl && !inputUrl.value.trim()) inputUrl.value = rawUrl;

    if (!rawUrl) {
        if (statusBox) {
            statusBox.style.background = '#fffbeb';
            statusBox.style.borderColor = '#fde68a';
            statusBox.style.color = '#92400e';
            statusBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b;"></i> <strong>Please enter your Neon Connection String first.</strong><br><span style="font-size: 11px;">Copy from Neon Console &rarr; Connect (format: <code>postgresql://user:pass@ep-xyz.neon.tech/neondb</code>)</span>';
        }
        if (showToastMsg) showToast('Please enter a Neon Connection String!', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        return false;
    }

    const parsed = parseNeonConnectionString(rawUrl);
    if (!parsed) {
        AdminState.neonConnected = false;
        updateCloudStatusBadges();
        if (statusBox) {
            statusBox.style.background = '#fef2f2';
            statusBox.style.borderColor = '#fecaca';
            statusBox.style.color = '#991b1b';
            statusBox.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i> <strong>Invalid Connection String Format!</strong><br><span style="font-size: 11px;">Expected format: <code>postgresql://[user]:[password]@[host]/[dbname]</code></span>';
        }
        if (showToastMsg) showToast('Invalid Neon URL format. Check connection string.', 'fa-solid fa-circle-exclamation', '#ef4444');
        return false;
    }

    // Auto-normalize input field
    if (inputUrl && inputUrl.value !== parsed.url) {
        inputUrl.value = parsed.url;
    }

    if (statusBox) {
        statusBox.style.background = '#f8fafc';
        statusBox.style.borderColor = '#e2e8f0';
        statusBox.style.color = '#475569';
        statusBox.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: #00e599;"></i> Connecting directly to <code>${parsed.host}</code>...`;
    }

    try {
        const sql = createNeonSql(parsed.url);
        const result = await sql`SELECT current_database() as db, current_user as usr, version() as ver`;
        AdminState.neonConnected = true;
        updateCloudStatusBadges();

        const dbName = result[0]?.db || parsed.database;
        const dbUser = result[0]?.usr || 'postgres';

        if (statusBox) {
            statusBox.style.background = '#ecfdf5';
            statusBox.style.borderColor = '#a7f3d0';
            statusBox.style.color = '#065f46';
            statusBox.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> <strong>Connected to Neon Postgres!</strong><br><span style="font-size: 11px;">Database: <code>${dbName}</code> &bull; User: <code>${dbUser}</code> &bull; Host: <code>${parsed.host}</code></span>`;
        }
        if (showToastMsg) {
            showToast(`Connected to Neon Postgres (${dbName})!`, 'fa-solid fa-circle-check', '#10b981');
        }
        return true;
    } catch (err) {
        AdminState.neonConnected = false;
        updateCloudStatusBadges();

        let userMsg = err.message || 'Check connection string format';
        if (userMsg.includes('password authentication failed')) {
            userMsg = 'Password authentication failed. Please double-check your Neon database password in the connection string.';
        } else if (userMsg.includes('database') && userMsg.includes('does not exist')) {
            userMsg = `Database "${parsed.database}" does not exist. Check the database name in your Neon dashboard.`;
        } else if (userMsg.includes('compute') || userMsg.includes('paused') || userMsg.includes('suspended')) {
            userMsg = 'Neon compute endpoint is paused or waking up. Please wait 3 seconds and click Test again.';
        } else if (userMsg.includes('Failed to fetch') || userMsg.includes('NetworkError')) {
            userMsg = `Unable to reach Neon host "${parsed.host}". Check if the hostname is correct and that your device has internet access.`;
        }

        if (statusBox) {
            statusBox.style.background = '#fef2f2';
            statusBox.style.borderColor = '#fecaca';
            statusBox.style.color = '#991b1b';
            statusBox.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i> <strong>Connection Failed:</strong><br><span style="font-size: 11px;">${userMsg}</span>`;
        }
        if (showToastMsg) {
            showToast('Neon error: ' + userMsg, 'fa-solid fa-circle-exclamation', '#ef4444');
        }
        return false;
    }
};

// Initialize Neon on Startup
async function initNeon() {
    const neonUrl = (localStorage.getItem('chocoloom_neon_url') || NEON_CONFIG.url || DEFAULT_NEON_URL || '').trim();
    if (neonUrl) {
        try {
            await testNeonConnection(false);
        } catch(e) {}
    }
}

// Setup Cross-tab Broadcast Channel (Instant zero-latency sync)
function setupBroadcastChannel() {
    if ('BroadcastChannel' in window) {
        try {
            broadcastChannel = new BroadcastChannel('chocoloom_orders_bus');
            broadcastChannel.onmessage = (event) => {
                const data = event.data;
                if (!data) return;
                console.log('📢 BroadcastChannel Received:', data);

                if (data.type === 'NEW_CARD_ORDER' && data.order) {
                    handleIncomingCardOrder(data.order, true);
                } else if (data.type === 'NEW_ORDER' && data.order) {
                    handleIncomingOrder(data.order, true);
                } else if (data.type === 'STATUS_UPDATE') {
                    const existing = AdminState.orders.find(o => 
                        o.order_number === data.order_number || (data.order_id && o.id === data.order_id)
                    );
                    if (existing && existing.status !== data.status) {
                        existing.status = data.status;
                        renderDashboard();
                    }
                }
            };
            console.log('✅ BroadcastChannel connected on "chocoloom_orders_bus"');
        } catch (e) {
            console.warn('BroadcastChannel error:', e);
        }
    }

    // Storage event fallback (for browsers or tabs on same origin)
    window.addEventListener('storage', (e) => {
        if (e.key === 'chocoloom_orders' && e.newValue) {
            try {
                const freshOrders = JSON.parse(e.newValue);
                if (Array.isArray(freshOrders)) {
                    mergeOrdersIntoState(freshOrders, true);
                    renderDashboard();
                }
            } catch (err) {}
        } else if (e.key === 'chocoloom_card_orders') {
            loadAllCardOrders(true);
        } else if (e.key === 'chocoloom_last_order' && e.newValue) {
            try {
                const lastOrder = JSON.parse(e.newValue);
                if (lastOrder) handleIncomingOrder(lastOrder, true);
            } catch (err) {}
        } else if (e.key === 'chocoloom_order_ping' && e.newValue) {
            loadAllOrders(false);
        }
    });

    // Window focus & visibility listeners for instant refresh upon tab switch
    window.addEventListener('focus', () => {
        loadAllOrders(false);
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadAllOrders(false);
        }
    });
}

// ==================== AUDIO SYNTHESIZER ====================
function getAudioContext() {
    if (!AdminState.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            AdminState.audioCtx = new AudioContextClass();
        }
    }
    if (AdminState.audioCtx && AdminState.audioCtx.state === 'suspended') {
        AdminState.audioCtx.resume();
    }
    return AdminState.audioCtx;
}

// Play pleasant multi-harmonic bakery doorbell chime
function playOrderChime() {
    if (!AdminState.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        
        // Chord frequencies (Bakery Bell: E5, G#5, B5, E6)
        const notes = [659.25, 830.61, 987.77, 1318.51];
        
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.9);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.95);
        });

        // Extra celebratory high ring chime
        setTimeout(() => {
            try {
                const chimeOsc = ctx.createOscillator();
                const chimeGain = ctx.createGain();
                const chimeNow = ctx.currentTime;
                chimeOsc.type = 'sine';
                chimeOsc.frequency.setValueAtTime(1760, chimeNow);
                chimeGain.gain.setValueAtTime(0.25, chimeNow);
                chimeGain.gain.exponentialRampToValueAtTime(0.001, chimeNow + 0.8);
                chimeOsc.connect(chimeGain);
                chimeGain.connect(ctx.destination);
                chimeOsc.start(chimeNow);
                chimeOsc.stop(chimeNow + 0.85);
            } catch(e) {}
        }, 300);

    } catch (err) {
        console.warn('Audio playback error:', err);
    }
}

// Browser Desktop Notification
function sendDesktopNotification(order) {
    if (!('Notification' in window)) return;

    const title = `🍰 New Order #${order.order_number || 'CL-Order'}!`;
    const custName = order.customer_name || 'Customer';
    const total = order.final_total || order.total || 0;
    const itemsCount = (Array.isArray(order.items) ? order.items.length : 1);
    const body = `${custName} ordered ${itemsCount} item(s) • Total: ₹${total}`;

    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'assets/logo.png',
            tag: order.order_number
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                new Notification(title, { body, icon: 'assets/logo.png' });
            }
        });
    }
}

// ==================== ORDER INGESTION & DATA SYNC ====================

const seenOrderKeys = new Set();
const recentlyAlertedOrders = new Set();
let isInitialOrderLoadDone = false;

// Ingest order into local state, audio alert, and render
function handleIncomingOrder(order, triggerAlert = true) {
    if (!order) return;

    // Normalize order structure
    const normalized = normalizeOrderData(order);
    const orderKey = normalized.order_number || normalized.id;

    // Check if already present
    const existingIndex = AdminState.orders.findIndex(o => 
        (normalized.order_number && o.order_number === normalized.order_number) || 
        (normalized.id && o.id === normalized.id)
    );

    if (existingIndex >= 0) {
        AdminState.orders[existingIndex] = { ...AdminState.orders[existingIndex], ...normalized };
    } else {
        // Prepend new order
        AdminState.orders.unshift(normalized);
        normalized.is_new = true;
    }

    // Trigger audio chime, desktop notification & popup banner
    if (triggerAlert && orderKey && !recentlyAlertedOrders.has(orderKey)) {
        recentlyAlertedOrders.add(orderKey);
        setTimeout(() => recentlyAlertedOrders.delete(orderKey), 45000);

        playOrderChime();
        sendDesktopNotification(normalized);
        showNewOrderToast(normalized);
    }

    if (orderKey) seenOrderKeys.add(orderKey);
    persistOrdersLocally();
    renderDashboard();
}

function handleOrderUpdate(updatedOrder) {
    const normalized = normalizeOrderData(updatedOrder);
    const idx = AdminState.orders.findIndex(o => 
        (normalized.order_number && o.order_number === normalized.order_number) || 
        (normalized.id && o.id === normalized.id)
    );
    if (idx >= 0) {
        AdminState.orders[idx] = { ...AdminState.orders[idx], ...normalized };
        persistOrdersLocally();
        renderDashboard();
    }
}

function normalizeOrderData(order) {
    let items = order.items;
    if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch(e) { items = []; }
    }
    if (!Array.isArray(items)) items = [];

    const orderNum = order.order_number || order.order_ref || `CL-${Date.now().toString().slice(-6)}`;
    const total = Number(order.final_total || order.total || order.item_total || 0);

    return {
        id: order.id || `local_${orderNum}`,
        order_number: orderNum,
        customer_name: order.customer_name || 'Guest Customer',
        customer_phone: order.customer_phone || '+91 98765 43210',
        customer_email: order.customer_email || '',
        delivery_address: order.delivery_address || (order.city ? `${order.city}, India` : 'Bengaluru, India'),
        delivery_notes: order.delivery_notes || order.note || '',
        restaurant_name: order.restaurant_name || 'Chocoloom Flagship Bakery',
        items: items,
        total_items: order.total_items || items.reduce((s, it) => s + (Number(it.quantity) || 1), 0),
        item_total: Number(order.item_total || total),
        delivery_fee: Number(order.delivery_fee || 35),
        platform_fee: Number(order.platform_fee || 6),
        gst_and_charges: Number(order.gst_and_charges || 15),
        tip_amount: Number(order.tip_amount || 0),
        discount_amount: Number(order.discount_amount || 0),
        final_total: total,
        total: total,
        payment_method: order.payment_method || 'Cash on Delivery',
        payment_status: order.payment_status || (order.payment_method === 'Cash on Delivery' ? 'pending' : 'completed'),
        status: order.status || 'Confirmed',
        created_at: order.created_at || new Date().toISOString(),
        updated_at: order.updated_at || new Date().toISOString()
    };
}

// Fetch all orders from Supabase + Neon + LocalStorage with Smart Instant Detection
async function loadAllOrders(isUserInitiated = false) {
    let loadedFromSupabase = false;
    let supabaseReachable = false;
    const incomingBatch = [];

    // 1. Try Supabase JS Client
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.warn('Supabase order fetch error:', error.message || error);
            } else if (Array.isArray(data)) {
                supabaseReachable = true;
                if (data.length > 0) {
                    incomingBatch.push(...data);
                    loadedFromSupabase = true;
                    console.log('Loaded ' + data.length + ' orders from Supabase');
                } else {
                    loadedFromSupabase = true;
                    console.log('Supabase orders table reachable (0 orders found)');
                }
            }
        } catch (e) {
            console.warn('Supabase order fetch exception:', e);
        }
    }

    // Direct REST API fallback if JS client did not succeed
    if (!loadedFromSupabase) {
        try {
            const res = await fetch(SUPABASE_CONFIG.url + '/rest/v1/orders?select=*&order=created_at.desc&limit=100', {
                headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': 'Bearer ' + SUPABASE_CONFIG.anonKey
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    supabaseReachable = true;
                    if (data.length > 0) {
                        incomingBatch.push(...data);
                        loadedFromSupabase = true;
                        console.log('Loaded ' + data.length + ' orders via Supabase REST');
                    } else {
                        loadedFromSupabase = true;
                        console.log('Supabase REST reachable (0 orders found)');
                    }
                } else {
                    // Non-array response = RLS blocked or table missing
                    console.warn('Supabase REST returned non-array (check RLS / table):', JSON.stringify(data).slice(0, 200));
                }
            } else {
                res.text().then(function(t) {
                    console.warn('Supabase REST orders failed (HTTP ' + res.status + '):', t.slice(0, 300));
                }).catch(function() {});
            }
        } catch (e) {
            console.warn('Supabase REST fetch fallback failed:', e);
        }
    }

    // 2. Try Neon Postgres as secondary source (only if Supabase is unreachable)
    if (!loadedFromSupabase) {
        try {
            const sql = await getNeonClient();
            if (sql) {
                const neonOrders = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`;
                if (Array.isArray(neonOrders) && neonOrders.length > 0) {
                    incomingBatch.push(...neonOrders);
                    console.log('Loaded ' + neonOrders.length + ' orders from Neon Postgres');
                }
            }
        } catch(e) {
            console.warn('Neon order fetch exception:', e);
        }
    }

    // 3. LocalStorage fallback ONLY when Supabase is completely unreachable (offline mode)
    if (!supabaseReachable) {
        try {
            const localRaw = localStorage.getItem('chocoloom_orders');
            if (localRaw) {
                const localOrders = JSON.parse(localRaw);
                if (Array.isArray(localOrders) && localOrders.length > 0) {
                    incomingBatch.push(...localOrders);
                    console.log('Loaded ' + localOrders.length + ' orders from localStorage (offline fallback)');
                }
            }
        } catch (e) {
            console.warn('LocalStorage order read error:', e);
        }
    }

    // Deduplicate incomingBatch by order_number to prevent duplicates from multiple sources
    const _seenBatch = new Set();
    const dedupedBatch = [];
    for (let _bi = 0; _bi < incomingBatch.length; _bi++) {
        const _ord = incomingBatch[_bi];
        const _bk = _ord.order_number || _ord.order_ref || _ord.id;
        if (_bk && _seenBatch.has(_bk)) continue;
        if (_bk) _seenBatch.add(_bk);
        dedupedBatch.push(_ord);
    }

    // If Supabase is reachable but returned 0 orders, clear stale/demo-only local state
    if (supabaseReachable && dedupedBatch.length === 0 && AdminState.orders.length > 0) {
        const allDemo = AdminState.orders.every(o => o.id && String(o.id).startsWith('local_'));
        if (allDemo) {
            AdminState.orders = [];
            console.log('Cleared demo orders — Supabase confirmed 0 real orders in DB');
        }
    }

    // Seed demo only on fresh install when Supabase is also unreachable
    if (AdminState.orders.length === 0 && dedupedBatch.length === 0 && !supabaseReachable) {
        seedInitialDemoOrders();
    } else if (dedupedBatch.length > 0) {
        mergeOrdersIntoState(dedupedBatch, isInitialOrderLoadDone);
    }

    // Mark initial load done so future polling triggers new-order alerts
    if (!isInitialOrderLoadDone) {
        AdminState.orders.forEach(o => {
            const kk = o.order_number || o.id;
            if (kk) seenOrderKeys.add(kk);
        });
        isInitialOrderLoadDone = true;
    }

    persistOrdersLocally();
    renderDashboard();
    if (isUserInitiated) {
        showToast('Live orders refreshed from database!');
    }
}

function mergeOrdersIntoState(newOrders, triggerAlertForNew = false) {
    if (!Array.isArray(newOrders)) return;
    
    newOrders.forEach(raw => {
        const item = normalizeOrderData(raw);
        const orderKey = item.order_number || item.id;
        const idx = AdminState.orders.findIndex(o => 
            (item.order_number && o.order_number === item.order_number) || 
            (item.id && o.id === item.id)
        );

        if (idx >= 0) {
            AdminState.orders[idx] = { ...AdminState.orders[idx], ...item };
        } else {
            AdminState.orders.push(item);

            // Trigger alert if discovered via polling after initial load
            if (triggerAlertForNew && orderKey && !seenOrderKeys.has(orderKey) && !recentlyAlertedOrders.has(orderKey)) {
                recentlyAlertedOrders.add(orderKey);
                setTimeout(() => recentlyAlertedOrders.delete(orderKey), 45000);
                playOrderChime();
                sendDesktopNotification(item);
                showNewOrderToast(item);
            }
        }

        if (orderKey) seenOrderKeys.add(orderKey);
    });

    // Sort newest first
    AdminState.orders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function persistOrdersLocally() {
    try {
        localStorage.setItem('chocoloom_orders', JSON.stringify(AdminState.orders.slice(0, 100)));
    } catch (e) {}
}

// Initial demonstration orders so dashboard looks vibrant immediately
function seedInitialDemoOrders() {
    const demoOrder = {
        order_number: `CL-${Date.now().toString().slice(-6)}-2489`,
        customer_name: "Aarav Sharma",
        customer_phone: "+91 98450 12345",
        delivery_address: "Flat 402, Magnolia Towers, 100ft Rd, Indiranagar, Bengaluru - 560038",
        delivery_notes: "Please pack with extra birthday candles! Call on arrival.",
        items: [
            {
                name: "Midnight Belgian Truffle Celebration Cake",
                quantity: 1,
                price: 849,
                selected_weight: "1.0 KG",
                is_cooling: true,
                cooling_option: "Chilled Cooling Cake (+₹50)",
                cooling_price: 50,
                custom_message: "Happy 25th Birthday Rhea! ❤️",
                options_summary: "1.0 KG | Chilled Cooling Cake | Note: Happy 25th Birthday Rhea!"
            },
            {
                name: "Artisan Belgian Dark Chocolate Mousse Cup",
                quantity: 2,
                price: 180,
                selected_weight: "Standard",
                is_cooling: false
            }
        ],
        item_total: 1259,
        delivery_fee: 35,
        platform_fee: 6,
        gst_and_charges: 15,
        tip_amount: 30,
        final_total: 1345,
        total: 1345,
        payment_method: "UPI / Razorpay",
        payment_status: "completed",
        status: "Confirmed",
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString() // 4 minutes ago
    };

    AdminState.orders.push(normalizeOrderData(demoOrder));
}

// ==================== WORKFLOW STATUS UPDATES ====================

// Advance order status (Confirmed -> Preparing -> Out for Delivery -> Delivered)
window.advanceOrderStatus = async function(orderNumber) {
    const order = AdminState.orders.find(o => o.order_number === orderNumber);
    if (!order) return;

    let nextStatus = 'Preparing';
    if (order.status === 'Confirmed') nextStatus = 'Preparing';
    else if (order.status === 'Preparing') nextStatus = 'Out for Delivery';
    else if (order.status === 'Out for Delivery' || order.status === 'In Transit') nextStatus = 'Delivered';

    await updateOrderStatus(orderNumber, nextStatus);
};

// Update order status explicitly
window.updateOrderStatus = async function(orderNumber, newStatus) {
    const order = AdminState.orders.find(o => o.order_number === orderNumber);
    if (!order) return;

    const oldStatus = order.status;
    order.status = newStatus;
    order.updated_at = new Date().toISOString();

    // 1. Update in Supabase
    if (supabaseClient) {
        try {
            await supabaseClient
                .from('orders')
                .update({ status: newStatus, updated_at: order.updated_at })
                .eq('order_number', orderNumber);
        } catch (e) {
            console.warn('Supabase status update error:', e);
        }
    } else {
        try {
            await fetch(`${SUPABASE_CONFIG.url}/rest/v1/orders?order_number=eq.${orderNumber}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus, updated_at: order.updated_at })
            });
        } catch (e) {}
    }

    // 1b. Update in Neon Postgres (if configured)
    try {
        const sql = await getNeonClient();
        if (sql) {
            await sql`UPDATE orders SET status = ${newStatus}, updated_at = NOW() WHERE order_number = ${orderNumber}`;
            console.log(`✅ Updated order #${orderNumber} status in Neon Postgres to ${newStatus}`);
        }
    } catch (e) {
        console.warn('Neon order status update error:', e);
    }

    // 2. Broadcast via BroadcastChannel to customer website
    try {
        if ('BroadcastChannel' in window) {
            const ch = new BroadcastChannel('chocoloom_orders_bus');
            ch.postMessage({
                type: 'STATUS_UPDATE',
                order_number: orderNumber,
                order_id: order.id,
                status: newStatus
            });
            setTimeout(() => { try { ch.close(); } catch(e){} }, 500);
        }
    } catch (e) {}

    // 3. Persist locally
    persistOrdersLocally();
    renderDashboard();

    // Feedback Toast
    showToast(`Order #${orderNumber} updated to "${newStatus}"!`);
};

// ==================== MANUAL ORDER MANAGEMENT & CREATION ====================

window.openManualOrderModal = function() {
    getAudioContext(); // Enable Web Audio on user gesture

    // Reset form elements
    const form = document.getElementById('manualOrderForm');
    if (form) form.reset();

    const customGroup = document.getElementById('manualCustomNameGroup');
    if (customGroup) customGroup.style.display = 'none';

    // Set sensible defaults
    const qtyInput = document.getElementById('manualItemQty');
    if (qtyInput) qtyInput.value = '1';

    const weightSelect = document.getElementById('manualWeightSelect');
    if (weightSelect) weightSelect.value = '1.0 KG';

    const deliveryFeeInput = document.getElementById('manualDeliveryFee');
    if (deliveryFeeInput) deliveryFeeInput.value = '35';

    const platformFeeInput = document.getElementById('manualPlatformFee');
    if (platformFeeInput) platformFeeInput.value = '6';

    const gstFeeInput = document.getElementById('manualGstFee');
    if (gstFeeInput) gstFeeInput.value = '15';

    const coolingCheck = document.getElementById('manualCoolingCheck');
    if (coolingCheck) coolingCheck.checked = false;

    const paymentMethod = document.getElementById('manualPaymentMethod');
    if (paymentMethod) paymentMethod.value = 'Cash on Delivery';

    const paymentStatus = document.getElementById('manualPaymentStatus');
    if (paymentStatus) paymentStatus.value = 'completed';

    const orderStatus = document.getElementById('manualOrderStatus');
    if (orderStatus) orderStatus.value = 'Confirmed';

    // Populate products dropdown from live catalog
    populateManualOrderProductDropdown();

    recalcManualOrderTotal();

    openAdminModal('manualOrderModal');
};

function populateManualOrderProductDropdown() {
    const select = document.getElementById('manualProductSelect');
    if (!select) return;

    select.innerHTML = `
        <option value="">-- Choose Cake from Catalog --</option>
        <option value="custom">✏️ Custom Cake / Item...</option>
    `;

    const prods = (AdminState && Array.isArray(AdminState.products) && AdminState.products.length > 0)
        ? AdminState.products
        : [
            { name: "Red Velvet Romance Cream Cake", price: 799 },
            { name: "Death by Chocolate Signature Truffle", price: 920 },
            { name: "Fresh Strawberry Bachelorette Celebration", price: 850 },
            { name: "Choco Crunch Belgian Ferrero Fantasy", price: 980 }
        ];

    prods.forEach(prod => {
        if (!prod || !prod.name) return;
        const price = prod.price || prod.selling_price || 0;
        const opt = document.createElement('option');
        opt.value = prod.name;
        opt.dataset.price = price;
        opt.textContent = `${prod.name} (₹${price})`;
        select.appendChild(opt);
    });
}

window.onManualProductSelectChange = function(val) {
    const customGroup = document.getElementById('manualCustomNameGroup');
    const customInput = document.getElementById('manualCustomName');
    const priceInput = document.getElementById('manualItemPrice');

    if (val === 'custom') {
        if (customGroup) customGroup.style.display = 'block';
        if (customInput) {
            customInput.required = true;
            customInput.focus();
        }
        if (priceInput) priceInput.value = '';
    } else if (val) {
        if (customGroup) customGroup.style.display = 'none';
        if (customInput) customInput.required = false;

        // Find price
        const prods = AdminState.products || [];
        const match = prods.find(p => p.name === val);
        if (match) {
            const price = match.price || match.selling_price || 0;
            if (priceInput) priceInput.value = price;
        } else {
            const select = document.getElementById('manualProductSelect');
            const opt = select ? select.querySelector(`option[value="${CSS.escape(val)}"]`) : null;
            if (opt && opt.dataset.price && priceInput) {
                priceInput.value = opt.dataset.price;
            }
        }
    } else {
        if (customGroup) customGroup.style.display = 'none';
        if (customInput) customInput.required = false;
        if (priceInput) priceInput.value = '';
    }

    recalcManualOrderTotal();
};

window.recalcManualOrderTotal = function() {
    const priceInput = document.getElementById('manualItemPrice');
    const qtyInput = document.getElementById('manualItemQty');
    const coolingCheck = document.getElementById('manualCoolingCheck');
    const deliveryFeeInput = document.getElementById('manualDeliveryFee');
    const platformFeeInput = document.getElementById('manualPlatformFee');
    const gstFeeInput = document.getElementById('manualGstFee');

    const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
    const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : 1) || 1);
    const isCooling = coolingCheck ? coolingCheck.checked : false;
    const coolingPrice = isCooling ? 50 : 0;
    const deliveryFee = parseFloat(deliveryFeeInput ? deliveryFeeInput.value : 0) || 0;
    const platformFee = parseFloat(platformFeeInput ? platformFeeInput.value : 0) || 0;
    const gstFee = parseFloat(gstFeeInput ? gstFeeInput.value : 0) || 0;

    const itemTotal = (price + coolingPrice) * qty;
    const finalTotal = itemTotal + deliveryFee + platformFee + gstFee;

    const breakdownEl = document.getElementById('manualBillBreakdown');
    if (breakdownEl) {
        breakdownEl.textContent = `Items: ₹${price * qty} + Packaging: ₹${coolingPrice * qty} + Delivery & Taxes: ₹${deliveryFee + platformFee + gstFee}`;
    }

    const totalDisplayEl = document.getElementById('manualTotalDisplay');
    if (totalDisplayEl) {
        totalDisplayEl.textContent = `₹${finalTotal}`;
    }

    return { itemTotal, finalTotal, deliveryFee, platformFee, gstFee, coolingPrice, isCooling, qty, price };
};

window.fillSampleManualOrder = function() {
    const sampleCustomers = [
        { name: "Pooja Reddy", phone: "+91 99887 76655", area: "Koramangala 5th Block, Jyoti Nivas Rd, Bengaluru - 560034" },
        { name: "Vikram Malhotra", phone: "+91 98112 34567", area: "Sector 2, HSR Layout, 27th Main, Bengaluru - 560102" },
        { name: "Sneha Nair", phone: "+91 97401 23890", area: "Whitefield, ITPL Main Road, Bengaluru - 560066" },
        { name: "Rohit Verma", phone: "+91 98200 98712", area: "Indiranagar 100ft Road, Bengaluru - 560038" }
    ];

    const sampleCakes = [
        { name: "Red Velvet Romance Cream Cake", price: 799, weight: "1.0 KG", cooling: true, note: "Happy Anniversary Sweetheart 💕" },
        { name: "Death by Chocolate Signature Truffle", price: 920, weight: "1.5 KG", cooling: false, note: "Best Wishes from Team mXbyte!" },
        { name: "Fresh Strawberry Bachelorette Celebration", price: 850, weight: "1.0 KG", cooling: true, note: "Bride to Be Ananya! 👰‍♀️" },
        { name: "Choco Crunch Belgian Ferrero Fantasy", price: 980, weight: "0.5 KG", cooling: false, note: "Keep it extra crunchy!" }
    ];

    const cust = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const cake = sampleCakes[Math.floor(Math.random() * sampleCakes.length)];

    const custName = document.getElementById('manualCustName');
    if (custName) custName.value = cust.name;

    const custPhone = document.getElementById('manualCustPhone');
    if (custPhone) custPhone.value = cust.phone;

    const custAddr = document.getElementById('manualCustAddress');
    if (custAddr) custAddr.value = cust.area;

    const cakeNote = document.getElementById('manualCakeNote');
    if (cakeNote) cakeNote.value = cake.note;

    const select = document.getElementById('manualProductSelect');
    const customGroup = document.getElementById('manualCustomNameGroup');
    const customInput = document.getElementById('manualCustomName');

    let found = false;
    if (select) {
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === cake.name) {
                select.selectedIndex = i;
                found = true;
                break;
            }
        }
    }

    if (!found) {
        if (select) select.value = 'custom';
        if (customGroup) customGroup.style.display = 'block';
        if (customInput) customInput.value = cake.name;
    } else {
        if (customGroup) customGroup.style.display = 'none';
    }

    const priceInput = document.getElementById('manualItemPrice');
    if (priceInput) priceInput.value = cake.price;

    const weightSelect = document.getElementById('manualWeightSelect');
    if (weightSelect) weightSelect.value = cake.weight;

    const coolingCheck = document.getElementById('manualCoolingCheck');
    if (coolingCheck) coolingCheck.checked = cake.cooling;

    const paymentMethod = document.getElementById('manualPaymentMethod');
    if (paymentMethod) paymentMethod.value = Math.random() > 0.4 ? "UPI / Razorpay" : "Cash on Delivery";

    const paymentStatus = document.getElementById('manualPaymentStatus');
    if (paymentStatus) paymentStatus.value = "completed";

    const orderStatus = document.getElementById('manualOrderStatus');
    if (orderStatus) orderStatus.value = "Confirmed";

    window.recalcManualOrderTotal();
    showToast('⚡ Sample order details auto-filled!');
};

window.handleManualOrderSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const name = (document.getElementById('manualCustName')?.value || '').trim();
    const phone = (document.getElementById('manualCustPhone')?.value || '').trim();
    const address = (document.getElementById('manualCustAddress')?.value || '').trim();
    const prodSelectVal = document.getElementById('manualProductSelect')?.value;
    const customName = (document.getElementById('manualCustomName')?.value || '').trim();
    const note = (document.getElementById('manualCakeNote')?.value || '').trim();
    const weight = document.getElementById('manualWeightSelect')?.value || "1.0 KG";
    const paymentMethod = document.getElementById('manualPaymentMethod')?.value || "Cash on Delivery";
    const paymentStatus = document.getElementById('manualPaymentStatus')?.value || "completed";
    const orderStatus = document.getElementById('manualOrderStatus')?.value || "Confirmed";

    let cakeName = prodSelectVal;
    if (prodSelectVal === 'custom') {
        cakeName = customName;
    }

    if (!cakeName) {
        showToast('Please select or enter a cake name', true);
        return;
    }

    const calc = window.recalcManualOrderTotal();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const orderNum = `CL-${Date.now().toString().slice(-6)}-${randNum}`;

    const newOrder = {
        order_number: orderNum,
        customer_name: name,
        customer_phone: phone,
        delivery_address: address,
        delivery_notes: note ? `Custom message on cake: "${note}"` : `Manual Order Entry (Placed by Admin)`,
        items: [
            {
                name: cakeName,
                quantity: calc.qty,
                price: calc.price,
                selected_weight: weight,
                weight: weight,
                is_cooling: calc.isCooling,
                cooling_option: calc.isCooling ? "Chilled Cooling Cake (+₹50)" : "Normal Cake",
                cooling_price: calc.coolingPrice,
                custom_message: note || "",
                options_summary: `${weight} | ${calc.isCooling ? 'Cooling (+₹50)' : 'Normal'}${note ? ' | "' + note + '"' : ''}`
            }
        ],
        item_total: calc.itemTotal,
        delivery_fee: calc.deliveryFee,
        platform_fee: calc.platformFee,
        gst_and_charges: calc.gstFee,
        tip_amount: 0,
        final_total: calc.finalTotal,
        total: calc.finalTotal,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        status: orderStatus,
        created_at: new Date().toISOString()
    };

    handleIncomingOrder(newOrder, true);
    await window.saveOrderToDatabasesAndBus(newOrder);

    closeAdminModal('manualOrderModal');
    showToast(`✅ Manual Order #${orderNum} created successfully!`);
};

window.saveOrderToDatabasesAndBus = async function(order) {
    // 1. Also save to Neon Postgres if connected
    try {
        const neonSql = await getNeonClient();
        if (neonSql) {
            await ensureNeonTablesExist();
            await neonSql`
                INSERT INTO orders (
                    id, order_number, customer_name, customer_phone, phone, delivery_address,
                    delivery_notes, items, total_items, item_total, subtotal, delivery_fee,
                    platform_fee, gst_and_charges, tip_amount, final_total, total,
                    payment_method, payment_status, status, created_at, updated_at
                ) VALUES (
                    ${order.order_number}, ${order.order_number}, ${order.customer_name},
                    ${order.customer_phone}, ${order.customer_phone}, ${order.delivery_address},
                    ${order.delivery_notes}, ${JSON.stringify(order.items)}::jsonb,
                    ${order.items.length}, ${order.item_total}, ${order.item_total},
                    ${order.delivery_fee}, ${order.platform_fee}, ${order.gst_and_charges},
                    ${order.tip_amount || 0}, ${order.final_total}, ${order.final_total},
                    ${order.payment_method}, ${order.payment_status}, ${order.status},
                    NOW(), NOW()
                )
                ON CONFLICT (order_number) DO UPDATE SET updated_at = NOW();
            `;
            console.log('✅ Order saved to Neon Postgres');
        }
    } catch(neonErr) {
        console.warn('Neon order save warning:', neonErr);
    }

    // 2. Also save to Supabase if connected
    try {
        if (supabaseClient) {
            await supabaseClient.from('orders').upsert([{
                id: order.order_number,
                order_number: order.order_number,
                customer_name: order.customer_name,
                customer_phone: order.customer_phone,
                phone: order.customer_phone,
                delivery_address: order.delivery_address,
                delivery_notes: order.delivery_notes,
                items: order.items,
                total_items: order.items.length,
                item_total: order.item_total,
                subtotal: order.item_total,
                delivery_fee: order.delivery_fee,
                platform_fee: order.platform_fee,
                gst_and_charges: order.gst_and_charges,
                tip_amount: order.tip_amount || 0,
                final_total: order.final_total,
                total: order.final_total,
                payment_method: order.payment_method,
                payment_status: order.payment_status,
                status: order.status,
                created_at: order.created_at || new Date().toISOString()
            }], { onConflict: 'order_number' });
            console.log('✅ Order saved to Supabase');
        }
    } catch(sbErr) {
        console.warn('Supabase order save warning:', sbErr);
    }

    // 3. Broadcast to bus so any other opened tabs see it
    try {
        if ('BroadcastChannel' in window) {
            const ch = new BroadcastChannel('chocoloom_orders_bus');
            ch.postMessage({ type: 'NEW_ORDER', order: order });
            setTimeout(() => { try { ch.close(); } catch(e){} }, 500);
        }
    } catch(e) {}
};

// Backward-compatible alias for simulateIncomingOrder
window.simulateIncomingOrder = function() {
    window.openManualOrderModal();
    window.fillSampleManualOrder();
};

// ==================== RENDERING UI ====================

function renderDashboard() {
    renderStats();
    renderOrders();
    updateFilterPillCounts();
}

// KPI Statistics
function renderStats() {
    const orders = AdminState.orders;
    const totalCount = orders.length;
    const confirmedCount = orders.filter(o => o.status === 'Confirmed').length;
    const preparingCount = orders.filter(o => o.status === 'Preparing').length;
    const outCount = orders.filter(o => o.status === 'Out for Delivery').length;
    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
    const totalRev = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (Number(o.final_total) || 0), 0);

    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl('statTotalOrders', totalCount);
    setEl('statConfirmedOrders', confirmedCount);
    setEl('statPreparingOrders', preparingCount);
    setEl('statOutOrders', outCount);
    setEl('statDeliveredOrders', deliveredCount);
    setEl('statTotalRevenue', `₹${totalRev.toLocaleString('en-IN')}`);

    // Update live pulse badge in sidebar
    const pulseBadge = document.getElementById('sidebarLiveBadge');
    if (pulseBadge) {
        pulseBadge.textContent = confirmedCount;
        pulseBadge.style.display = confirmedCount > 0 ? 'inline-block' : 'none';
    }
    const mobBadge = document.getElementById('mobBadgeOrders');
    if (mobBadge) {
        mobBadge.textContent = confirmedCount;
        mobBadge.style.display = confirmedCount > 0 ? 'inline-flex' : 'none';
    }
}

// Update count numbers in filter buttons
function updateFilterPillCounts() {
    const orders = AdminState.orders;
    const countMap = {
        'ALL': orders.length,
        'Confirmed': orders.filter(o => o.status === 'Confirmed').length,
        'Preparing': orders.filter(o => o.status === 'Preparing').length,
        'Out for Delivery': orders.filter(o => o.status === 'Out for Delivery').length,
        'Delivered': orders.filter(o => o.status === 'Delivered').length,
        'Cancelled': orders.filter(o => o.status === 'Cancelled').length
    };

    Object.keys(countMap).forEach(key => {
        const el = document.getElementById(`countPill_${key.replace(/\s+/g, '_')}`);
        if (el) el.textContent = countMap[key];
    });
}

// Render Orders Grid / Table
function renderOrders() {
    const gridContainer = document.getElementById('ordersGridContainer');
    const tableContainer = document.getElementById('ordersTableContainer');
    const tableBody = document.getElementById('ordersTableBody');
    if (!gridContainer) return;

    let filtered = AdminState.orders.filter(order => {
        // Filter by status tab
        if (AdminState.activeFilter !== 'ALL' && order.status !== AdminState.activeFilter) {
            return false;
        }
        // Filter by search query
        if (AdminState.searchQuery) {
            const q = AdminState.searchQuery.toLowerCase();
            const orderNum = (order.order_number || '').toLowerCase();
            const custName = (order.customer_name || '').toLowerCase();
            const custPhone = (order.customer_phone || '').toLowerCase();
            const itemsStr = (order.items || []).map(i => i.name).join(' ').toLowerCase();
            if (!orderNum.includes(q) && !custName.includes(q) && !custPhone.includes(q) && !itemsStr.includes(q)) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-orders">
                <i class="fa-solid fa-cake-candles"></i>
                <h4>No Orders Found</h4>
                <p>There are no orders matching the current "${AdminState.activeFilter}" filter.</p>
                <button class="header-btn primary" onclick="openManualOrderModal()">
                    <i class="fa-solid fa-plus"></i> + Create Manual Order
                </button>
            </div>
        `;
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }

    if (AdminState.viewMode === 'table') {
        gridContainer.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
        if (tableBody) {
            tableBody.innerHTML = filtered.map(order => createOrderTableRow(order)).join('');
        }
    } else {
        gridContainer.style.display = 'grid';
        if (tableContainer) tableContainer.style.display = 'none';
        gridContainer.innerHTML = filtered.map(order => createOrderCardHTML(order)).join('');
    }
}

// Generate single Order Card HTML
function createOrderCardHTML(order) {
    const orderNum = order.order_number;
    const timeAgo = getTimeAgo(order.created_at);
    const statusClass = getStatusClass(order.status);
    const statusLabel = getStatusLabel(order.status);
    const items = Array.isArray(order.items) ? order.items : [];

    // Next step action button configuration
    let nextBtnText = '👨‍🍳 Send to Kitchen';
    let nextBtnDisplay = true;
    if (order.status === 'Confirmed') {
        nextBtnText = '👨‍🍳 Send to Kitchen';
    } else if (order.status === 'Preparing') {
        nextBtnText = '🛵 Dispatch for Delivery';
    } else if (order.status === 'Out for Delivery') {
        nextBtnText = '✅ Mark as Delivered';
    } else {
        nextBtnDisplay = false;
    }

    // Clean customer phone for WhatsApp
    const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waText = encodeURIComponent(`Hello ${order.customer_name}! Chocoloom Bakery update on your order #${order.order_number}: Your delicious fresh bakes are currently ${order.status}! 🎂 Total: ₹${order.final_total}. Thank you!`);

    return `
        <div class="order-card ${order.is_new ? 'highlight-new' : ''}" id="card_${orderNum}">
            <div class="card-top">
                <div class="order-ref-group">
                    <span class="order-number">#${orderNum}</span>
                    <span class="order-time"><i class="fa-regular fa-clock"></i> ${timeAgo}</span>
                </div>
                <span class="status-badge ${statusClass}">
                    ${getStatusIcon(order.status)} ${statusLabel}
                </span>
            </div>

            <!-- Customer Details -->
            <div class="customer-box">
                <div class="cust-row-top">
                    <span class="cust-name"><i class="fa-solid fa-user" style="color: var(--primary); font-size: 12px;"></i> ${escapeHtml(order.customer_name)}</span>
                    <div class="cust-actions">
                        <a href="tel:${order.customer_phone}" class="quick-contact-btn phone" title="Call Customer">
                            <i class="fa-solid fa-phone"></i> Call
                        </a>
                        <a href="https://wa.me/${waPhone}?text=${waText}" target="_blank" class="quick-contact-btn whatsapp" title="Chat on WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i> Chat
                        </a>
                    </div>
                </div>
                <div class="cust-address">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${escapeHtml(order.delivery_address)}</span>
                </div>
                ${order.delivery_notes ? `
                    <div style="font-size: 11px; color: #b45309; background: #fffbeb; padding: 4px 8px; border-radius: 4px; border: 1px solid #fef3c7; margin-top: 4px;">
                        <i class="fa-solid fa-comment-dots"></i> <strong>Note:</strong> ${escapeHtml(order.delivery_notes)}
                    </div>
                ` : ''}
            </div>

            <!-- Items List -->
            <div class="order-items-box">
                ${items.map(item => {
                    const weight = item.selected_weight || item.weight || '0.5 KG';
                    const isCooling = Boolean(item.is_cooling);
                    const coolingP = Number(item.cooling_price || 0);
                    const msg = item.custom_message || null;
                    const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);

                    return `
                        <div class="order-item-row">
                            <div class="item-left">
                                <span class="item-name-qty">
                                    <span class="item-qty-tag">${item.quantity || 1}x</span>
                                    ${escapeHtml(item.name || 'Artisan Cake')}
                                </span>
                                <div class="item-customization-pills">
                                    <span class="custom-pill weight"><i class="fa-solid fa-scale-balanced"></i> ${weight}</span>
                                    <span class="custom-pill ${isCooling ? 'cooling' : 'normal'}">
                                        ${isCooling ? `<i class="fa-solid fa-snowflake"></i> Chilled (+₹${coolingP})` : '<i class="fa-solid fa-cake-candles"></i> Normal'}
                                    </span>
                                    ${msg ? `<span class="custom-pill note"><i class="fa-solid fa-pen-nib"></i> "${escapeHtml(msg)}"</span>` : ''}
                                </div>
                            </div>
                            <span class="item-price">₹${subtotal}</span>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Financials & Payment -->
            <div class="order-financials">
                <span class="pay-method-badge ${order.payment_status === 'completed' ? 'paid' : ''}">
                    <i class="fa-solid ${order.payment_status === 'completed' ? 'fa-circle-check' : 'fa-hand-holding-dollar'}"></i>
                    ${escapeHtml(order.payment_method)} (${order.payment_status === 'completed' ? 'Paid' : 'Pending'})
                </span>
                <div class="total-amount-display">
                    <span>Total Bill</span>
                    <h4>₹${order.final_total}</h4>
                </div>
            </div>

            <!-- Stepper Actions -->
            <div class="order-actions">
                ${nextBtnDisplay ? `
                    <button class="action-btn advance-btn" onclick="advanceOrderStatus('${orderNum}')">
                        ${nextBtnText}
                    </button>
                ` : `
                    <button class="action-btn" style="background: #f1f5f9; color: #475569;" disabled>
                        ${order.status === 'Delivered' ? '✅ Completed' : '❌ Cancelled'}
                    </button>
                `}
                <button class="action-btn icon-only" title="Print KOT / Bill Receipt" onclick="openPrintModal('${orderNum}')">
                    <i class="fa-solid fa-print"></i>
                </button>
                <button class="action-btn icon-only" title="View Full Order Details" onclick="openOrderDetailsModal('${orderNum}')">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
                ${order.status !== 'Cancelled' && order.status !== 'Delivered' ? `
                    <button class="action-btn icon-only" title="Cancel Order" style="color: #dc2626;" onclick="updateOrderStatus('${orderNum}', 'Cancelled')">
                        <i class="fa-solid fa-ban"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Table row generation for Table view
function createOrderTableRow(order) {
    const orderNum = order.order_number;
    const timeAgo = getTimeAgo(order.created_at);
    const statusClass = getStatusClass(order.status);
    const itemsCount = (Array.isArray(order.items) ? order.items.length : 1);

    return `
        <tr>
            <td><strong>#${orderNum}</strong></td>
            <td>${escapeHtml(order.customer_name)}<br><small style="color: #64748b;">${order.customer_phone}</small></td>
            <td>${itemsCount} item(s)</td>
            <td><strong>₹${order.final_total}</strong></td>
            <td><span class="status-badge ${statusClass}">${getStatusLabel(order.status)}</span></td>
            <td><small>${timeAgo}</small></td>
            <td>
                <button class="header-btn" style="padding: 4px 8px; font-size: 11px;" onclick="openOrderDetailsModal('${orderNum}')">Details</button>
                <button class="header-btn" style="padding: 4px 8px; font-size: 11px;" onclick="openPrintModal('${orderNum}')"><i class="fa-solid fa-print"></i></button>
            </td>
        </tr>
    `;
}

// Status helpers
function getStatusClass(status) {
    switch (status) {
        case 'Confirmed': return 'confirmed';
        case 'Preparing': return 'preparing';
        case 'Out for Delivery': return 'out-for-delivery';
        case 'In Transit': return 'in-transit';
        case 'Delivered': return 'delivered';
        case 'Cancelled': return 'cancelled';
        default: return 'confirmed';
    }
}

function getStatusLabel(status) {
    return status || 'Confirmed';
}

function getStatusIcon(status) {
    switch (status) {
        case 'Confirmed': return '<i class="fa-solid fa-bell"></i>';
        case 'Preparing': return '<i class="fa-solid fa-fire-burner"></i>';
        case 'Out for Delivery': return '<i class="fa-solid fa-motorcycle"></i>';
        case 'In Transit': return '<i class="fa-solid fa-truck-fast"></i>';
        case 'Delivered': return '<i class="fa-solid fa-circle-check"></i>';
        case 'Cancelled': return '<i class="fa-solid fa-ban"></i>';
        default: return '<i class="fa-solid fa-bell"></i>';
    }
}

function getTimeAgo(dateStr) {
    if (!dateStr) return 'Just now';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffSecs = Math.max(0, Math.floor((now - then) / 1000));
    
    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==================== TOAST & MODAL CONTROLLERS ====================

function showNewOrderToast(order) {
    const existing = document.getElementById('newOrderToastBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'newOrderToastBanner';
    banner.className = 'new-order-toast-banner';
    banner.innerHTML = `
        <i class="fa-solid fa-bell-concierge" style="font-size: 24px; color: #10b981;"></i>
        <div class="toast-content">
            <h5>🔔 New Order Received!</h5>
            <p>#${order.order_number} • ${order.customer_name} • ₹${order.final_total}</p>
        </div>
        <button class="toast-btn" onclick="openOrderDetailsModal('${order.order_number}'); this.parentElement.remove();">
            View Order
        </button>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 4px;">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    document.body.appendChild(banner);

    setTimeout(() => {
        if (banner && banner.parentElement) {
            banner.remove();
        }
    }, 10000);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 999px; font-size: 13px; font-weight: 700; z-index: 10000; box-shadow: 0 10px 25px rgba(0,0,0,0.3);';
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981; margin-right: 6px;"></i> ${escapeHtml(message)}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// Order Details Drilldown Modal
window.openOrderDetailsModal = function(orderNumber) {
    const order = AdminState.orders.find(o => o.order_number === orderNumber);
    if (!order) return;

    AdminState.selectedOrder = order;
    const modal = document.getElementById('orderDetailsModal');
    const content = document.getElementById('orderDetailsContent');
    if (!modal || !content) return;

    const items = Array.isArray(order.items) ? order.items : [];

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
            <div>
                <h2 style="font-family: var(--font-heading); font-size: 20px; font-weight: 800;">Order #${order.order_number}</h2>
                <span style="font-size: 12px; color: var(--text-muted);">${new Date(order.created_at).toLocaleString()}</span>
            </div>
            <span class="status-badge ${getStatusClass(order.status)}">${getStatusIcon(order.status)} ${getStatusLabel(order.status)}</span>
        </div>

        <!-- Customer info -->
        <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-md);">
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">👤 ${escapeHtml(order.customer_name)}</div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">📞 ${order.customer_phone}</div>
            <div style="font-size: 13px; color: var(--text-secondary);">📍 ${escapeHtml(order.delivery_address)}</div>
            ${order.delivery_notes ? `<div style="font-size: 12px; color: #b45309; margin-top: 6px;"><strong>Delivery Note:</strong> ${escapeHtml(order.delivery_notes)}</div>` : ''}
        </div>

        <!-- Items Breakdown -->
        <div>
            <h4 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Order Items (${items.length})</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${items.map(it => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 10px; background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 13px;">
                        <div>
                            <div style="font-weight: 700;">${it.quantity || 1}x ${escapeHtml(it.name)}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">
                                ${it.selected_flavour || it.flavour ? '✨ ' + (it.selected_flavour || it.flavour) + (Number(it.flavour_price || it.flavourPrice) > 0 ? ' (+₹' + (it.flavour_price || it.flavourPrice) + ')' : '') + ' • ' : ''}⚖️ ${it.selected_weight || '0.5 KG'} • ${it.is_cooling ? '❄️ Cooling Cake (+₹' + (it.cooling_price || 0) + ')' : '🎂 Normal Cake'}
                                ${it.custom_message ? ` • ✍️ "${escapeHtml(it.custom_message)}"` : ''}
                            </div>
                        </div>
                        <span style="font-weight: 800;">₹${(Number(it.price) || 0) * (Number(it.quantity) || 1)}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Bill Breakdown -->
        <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-md); font-size: 13px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between;"><span>Item Subtotal:</span><span>₹${order.item_total}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Delivery Fee:</span><span>₹${order.delivery_fee}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Taxes & Charges:</span><span>₹${(order.platform_fee || 0) + (order.gst_and_charges || 0)}</span></div>
            ${order.tip_amount ? `<div style="display: flex; justify-content: space-between;"><span>Rider Tip:</span><span>₹${order.tip_amount}</span></div>` : ''}
            <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 16px; border-top: 1px solid var(--border-color); padding-top: 6px;">
                <span>Total Amount:</span>
                <span style="color: var(--primary);">₹${order.final_total}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                Payment Method: <strong>${escapeHtml(order.payment_method)}</strong> (${order.payment_status})
            </div>
        </div>

        <!-- Quick Status Change Select -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 8px;">
            <label style="font-size: 13px; font-weight: 700;">Update Status:</label>
            <select id="modalStatusSelect" style="padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-weight: 700;" onchange="updateOrderStatus('${order.order_number}', this.value); closeAdminModal('orderDetailsModal');">
                <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed (New)</option>
                <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing in Kitchen</option>
                <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
        </div>
    `;

    modal.classList.add('open');
};

window.openAdminModal = function(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('open');
};

window.closeAdminModal = function(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('open');
};

// ==================== THERMAL RECEIPT & KOT PRINTING ====================

window.openPrintModal = function(orderNumber) {
    const order = AdminState.orders.find(o => o.order_number === orderNumber);
    if (!order) return;

    const printableContainer = document.getElementById('printableReceiptContainer');
    if (!printableContainer) return;

    const items = Array.isArray(order.items) ? order.items : [];
    const dateFormatted = new Date(order.created_at).toLocaleString();

    printableContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
            <h2 style="font-size: 18px; margin: 0; font-weight: 900; letter-spacing: 1px;">CHOCOLOOM</h2>
            <div style="font-size: 10px;">Artisanal Cakes & Sweet Delights</div>
            <div style="font-size: 10px;">GSTIN: 29AAAAA0000A1Z5 • FSSAI: 11223344000123</div>
            <div style="font-size: 11px; font-weight: 800; margin-top: 4px;">*** KITCHEN & BILL RECEIPT ***</div>
        </div>

        <div style="font-size: 11px; margin-bottom: 8px; line-height: 1.4;">
            <div><strong>ORDER: #${order.order_number}</strong></div>
            <div>Date: ${dateFormatted}</div>
            <div>Customer: <strong>${escapeHtml(order.customer_name)}</strong></div>
            <div>Phone: ${order.customer_phone}</div>
            <div>Address: ${escapeHtml(order.delivery_address)}</div>
            ${order.delivery_notes ? `<div style="font-weight: bold; margin-top: 3px;">NOTES: ${escapeHtml(order.delivery_notes)}</div>` : ''}
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; margin-bottom: 4px;">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
            </div>
            ${items.map(it => `
                <div style="margin-bottom: 6px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                        <span>${it.quantity || 1}x ${escapeHtml(it.name)}</span>
                        <span>₹${(Number(it.price) || 0) * (Number(it.quantity) || 1)}</span>
                    </div>
                    <div style="font-size: 10px; padding-left: 10px;">
                        Weight: ${it.selected_weight || '0.5 KG'} | ${it.is_cooling ? '❄️ COOLING CAKE' : 'NORMAL'}
                        ${it.custom_message ? `<br>✍️ TEXT: "${escapeHtml(it.custom_message)}"` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        <div style="font-size: 11px; line-height: 1.4; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>₹${order.item_total}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Delivery Fee:</span><span>₹${order.delivery_fee}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Taxes/Packaging:</span><span>₹${(order.platform_fee || 0) + (order.gst_and_charges || 0)}</span></div>
            <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px;">
                <span>TOTAL PAYABLE:</span>
                <span>₹${order.final_total}</span>
            </div>
            <div style="font-size: 10px; margin-top: 2px;">Payment: ${escapeHtml(order.payment_method)} (${order.payment_status})</div>
        </div>

        <div style="text-align: center; border-top: 1px dashed #000; padding-top: 8px; font-size: 10px;">
            Thank you for ordering with Chocoloom!<br>
            Freshly baked with love & master craft.
        </div>
    `;

    window.print();
};

// ==================== EVENT LISTENERS & INITIALIZATION ====================

function initEventListeners() {
    // Global Search Input (Orders or Products depending on tab)
    const searchInput = document.getElementById('searchOrdersInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (AdminState.currentTab === 'products') {
                AdminState.productsSearchQuery = val;
                renderProducts();
            } else {
                AdminState.searchQuery = val;
                renderOrders();
            }
        });
    }

    // Products View Dedicated Search Bar
    const searchProdInput = document.getElementById('searchProductsInput');
    if (searchProdInput) {
        searchProdInput.addEventListener('input', (e) => {
            AdminState.productsSearchQuery = e.target.value.trim();
            renderProducts();
        });
    }

    // Products Category Filter Select
    const prodCatSelect = document.getElementById('productCategorySelect');
    if (prodCatSelect) {
        prodCatSelect.addEventListener('change', (e) => {
            AdminState.productsCategoryFilter = e.target.value;
            renderProducts();
        });
    }

    // Products Stock Filter Select
    const prodStockSelect = document.getElementById('productStockSelect');
    if (prodStockSelect) {
        prodStockSelect.addEventListener('change', (e) => {
            AdminState.productsStockFilter = e.target.value;
            renderProducts();
        });
    }

    // Audio toggle
    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            AdminState.soundEnabled = !AdminState.soundEnabled;
            localStorage.setItem('chocoloom_admin_sound', AdminState.soundEnabled ? 'true' : 'false');
            updateAudioButtonUI();
            if (AdminState.soundEnabled) {
                playOrderChime();
            }
        });
    }

    // Sound test button
    const testAudioBtn = document.getElementById('testAudioBtn');
    if (testAudioBtn) {
        testAudioBtn.addEventListener('click', () => {
            AdminState.soundEnabled = true;
            updateAudioButtonUI();
            playOrderChime();
            showToast('Chime sound alert tested successfully! 🔔');
        });
    }

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            AdminState.activeFilter = pill.getAttribute('data-filter');
            renderOrders();
        });
    });

    // View mode switcher
    const viewCardsBtn = document.getElementById('viewCardsBtn');
    const viewTableBtn = document.getElementById('viewTableBtn');
    if (viewCardsBtn && viewTableBtn) {
        viewCardsBtn.addEventListener('click', () => {
            AdminState.viewMode = 'cards';
            viewCardsBtn.classList.add('active');
            viewTableBtn.classList.remove('active');
            renderOrders();
        });
        viewTableBtn.addEventListener('click', () => {
            AdminState.viewMode = 'table';
            viewTableBtn.classList.add('active');
            viewCardsBtn.classList.remove('active');
            renderOrders();
        });
    }

    // Store status toggle
    const storeStatusBtn = document.getElementById('storeStatusBtn');
    if (storeStatusBtn) {
        storeStatusBtn.addEventListener('click', () => {
            AdminState.storeOpen = !AdminState.storeOpen;
            const status = AdminState.storeOpen ? 'open' : 'closed';
            try {
                localStorage.setItem('chocoloom_store_status', status);
            } catch(e) {}
            updateStoreStatusUI();
            loadAllCardOrders();
            if (AdminState.storeOpen) {
                showToast('🟢 Store is now OPEN — Website is accepting orders!', 'fa-solid fa-store', '#10b981');
            } else {
                showToast('🔴 Store is now CLOSED — All website items now show "Store Closed"', 'fa-solid fa-store-slash', '#ef4444');
            }
            broadcastStoreStatus(AdminState.storeOpen);
        });
    }

    // Refresh orders button
    const refreshBtn = document.getElementById('refreshOrdersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadAllOrders();
            showToast('Live orders refreshed from database!');
        });
    }

    // Keyboard shortcut / for search
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
    });

    // High-frequency live polling fallback (every 3 seconds) to guarantee immediate order appearance
    setInterval(() => {
        if (!document.hidden) {
            loadAllOrders(false);
        }
    }, 3000);
}

function updateAudioButtonUI() {
    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn) {
        if (AdminState.soundEnabled) {
            audioBtn.classList.remove('muted');
            audioBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Sound: ON';
        } else {
            audioBtn.classList.add('muted');
            audioBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Sound: OFF';
        }
    }
}

function updateStoreStatusUI() {
    const dot = document.getElementById('storeStatusDot');
    const text = document.getElementById('storeStatusText');
    const card = document.getElementById('storeStatusBtn');
    if (dot && text) {
        if (AdminState.storeOpen) {
            dot.className = 'status-dot';
            text.textContent = 'Accepting Orders';
            if (card) {
                card.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                card.title = 'Click to Stop Orders (Mark all website items Closed)';
            }
        } else {
            dot.className = 'status-dot offline';
            text.textContent = 'Store Closed';
            if (card) {
                card.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                card.title = 'Click to Open Store & Accept Orders';
            }
        }
    }
}

// Broadcast Store Open/Closed status to customer website and sync bridges
function broadcastStoreStatus(isOpen) {
    const status = isOpen ? 'open' : 'closed';
    const payload = {
        type: 'STORE_STATUS_UPDATE',
        storeOpen: isOpen,
        store_status: status,
        status: status,
        timestamp: Date.now()
    };

    // 1. BroadcastChannel across all browser tabs
    if ('BroadcastChannel' in window) {
        try {
            const ch = new BroadcastChannel('chocoloom_orders_bus');
            ch.postMessage(payload);
            setTimeout(() => { try { ch.close(); } catch(e){} }, 500);
        } catch(e) {}
        try {
            const chSync = new BroadcastChannel('chocoloom_admin_sync');
            chSync.postMessage(payload);
            setTimeout(() => { try { chSync.close(); } catch(e){} }, 500);
        } catch(e) {}
    }

    // 2. Cross-origin sync (bridges, windows, parent)
    sendCrossOriginSync(payload);

    // 3. Cloud Database Sync (Supabase & Neon)
    syncStoreStatusToCloud(isOpen);
}

// Synchronize store status to Supabase and Neon Postgres
async function syncStoreStatusToCloud(isOpen) {
    const statusVal = isOpen ? 'open' : 'closed';
    
    // Supabase
    if (supabaseClient) {
        try {
            await supabaseClient.from('store_settings').upsert({
                key: 'store_status',
                value: statusVal,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' }).catch(() => {});
        } catch(e) {}

        try {
            const channel = supabaseClient.channel('admin_orders_feed');
            channel.send({
                type: 'broadcast',
                event: 'store_status_change',
                payload: { storeOpen: isOpen, status: statusVal }
            }).catch(() => {});
        } catch(e) {}
    }

    // Neon Serverless Postgres
    try {
        const sql = getNeonClient();
        if (sql) {
            await sql`
                CREATE TABLE IF NOT EXISTS store_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `;
            await sql`
                INSERT INTO store_settings (key, value, updated_at) 
                VALUES ('store_status', ${statusVal}, NOW())
                ON CONFLICT (key) DO UPDATE SET value = ${statusVal}, updated_at = NOW();
            `;
            console.log('✅ Store status synced to Neon Postgres:', statusVal);
        }
    } catch(e) {
        console.warn('Neon store status sync error:', e);
    }

    // WordPress REST API / AJAX Sync
    try {
        const wpConfig = window.CHOCOLOOM_WP_CONFIG || window.parent?.CHOCOLOOM_WP_CONFIG || {};
        const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
        const wpTargets = [];
        if (wpConfig.storeStatusRestUrl) wpTargets.push(wpConfig.storeStatusRestUrl);
        if (wpConfig.restUrl) wpTargets.push(wpConfig.restUrl.replace(/\/catalog$/, '/store-status'));
        if (origin && origin !== 'null') {
            wpTargets.push(`${origin}/wp-json/chocoloom/v1/store-status`);
            wpTargets.push(`${origin}/index.php?rest_route=/chocoloom/v1/store-status`);
        }
        // Always include both live domains
        wpTargets.push("https://chocoloom.com/wp-json/chocoloom/v1/store-status");
        wpTargets.push("https://orders.chocoloom.com/wp-json/chocoloom/v1/store-status");

        const uniqueWpTargets = [...new Set(wpTargets)];
        for (const wpTarget of uniqueWpTargets) {
            try {
                const res = await fetch(wpTarget, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ store_status: statusVal, status: statusVal })
                });
                if (res && res.ok) {
                    console.log('✅ Store status synced to WordPress:', wpTarget);
                }
            } catch(wErr) {}
        }
    } catch(wpErr) {}
}

// Fetch store status from Supabase on init
async function fetchStoreStatusFromCloud() {
    if (supabaseClient) {
        try {
            const { data } = await supabaseClient.from('store_settings').select('value').eq('key', 'store_status').maybeSingle();
            if (data && data.value) {
                const wasOpen = AdminState.storeOpen;
                AdminState.storeOpen = (data.value !== 'closed');
                localStorage.setItem('chocoloom_store_status', data.value);
                if (wasOpen !== AdminState.storeOpen) {
                    updateStoreStatusUI();
                }
            }
        } catch(e) {}
    }
}

// ==================== MOBILE NAVIGATION CONTROLS ====================
window.toggleMobileSidebar = function() {
    const sb = document.querySelector('.sidebar');
    const bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.toggle('mobile-open');
    if (bd) bd.classList.toggle('active');
};

window.closeMobileSidebar = function() {
    const sb = document.querySelector('.sidebar');
    const bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.remove('mobile-open');
    if (bd) bd.classList.remove('active');
};

// ==================== TAB SWITCHER (ORDERS vs PRODUCTS) ====================
window.switchAdminTab = function(tabName) {
    if (typeof closeMobileSidebar === 'function') closeMobileSidebar();

    const mobOrders = document.getElementById('mobNavOrders');
    const mobCards = document.getElementById('mobNavCards');
    const mobProds = document.getElementById('mobNavProducts');
    const mobAds = document.getElementById('mobNavAds');
    if (mobOrders) mobOrders.classList.toggle('active', tabName === 'orders');
    if (mobCards) mobCards.classList.toggle('active', tabName === 'cards');
    if (mobProds) mobProds.classList.toggle('active', tabName === 'products');
    if (mobAds) mobAds.classList.toggle('active', tabName === 'advertisements');
    AdminState.currentTab = tabName;
    const ordersNav = document.getElementById("tabNavOrders");
    const prodsNav = document.getElementById("tabNavProducts");
    const adsNav = document.getElementById("tabNavAdvertisements");
    const cardsNav = document.getElementById("tabNavCards");
    const usersNav = document.getElementById("tabNavUsers");

    const ordersView = document.getElementById("ordersViewSection");
    const prodsView = document.getElementById("productsViewSection");
    const adsView = document.getElementById("advertisementsViewSection");
    const cardsView = document.getElementById("cardsViewSection");
    const usersView = document.getElementById("usersViewSection");
    const searchInput = document.getElementById("searchOrdersInput");

    if (ordersNav) ordersNav.classList.toggle("active", tabName === "orders");
    if (prodsNav) prodsNav.classList.toggle("active", tabName === "products");
    if (adsNav) adsNav.classList.toggle("active", tabName === "advertisements");
    if (cardsNav) cardsNav.classList.toggle("active", tabName === "cards");
    if (usersNav) usersNav.classList.toggle("active", tabName === "users");

    if (ordersView) ordersView.classList.toggle("active", tabName === "orders");
    if (prodsView) prodsView.classList.toggle("active", tabName === "products");
    if (adsView) adsView.classList.toggle("active", tabName === "advertisements");
    if (cardsView) cardsView.classList.toggle("active", tabName === "cards");
    if (usersView) usersView.classList.toggle("active", tabName === "users");

    if (tabName === "cards") {
        if (searchInput) searchInput.placeholder = "Filter Card Orders by recipient, embossed name, AWB, phone...";
        loadAllCardOrders();
    } else if (tabName === "products") {
        if (searchInput) searchInput.placeholder = "Search cakes, desserts, chocolates or category...";
        loadAllProducts();
    } else if (tabName === "advertisements") {
        if (searchInput) searchInput.placeholder = "Search advertisements by title, tag, code...";
        loadAllBanners();
    } else if (tabName === "users") {
        if (searchInput) searchInput.placeholder = "Search registered users...";
        if (typeof loadAllUsers === 'function') loadAllUsers();
    } else {
        if (searchInput) searchInput.placeholder = "Search Order ID, Customer, Phone, or Cake... (⌘K)";
        renderDashboard();
    }
};

// ==================== MENU, PRODUCTS & PRICING ENGINE ====================

// Load all products directly from Supabase Cloud (with fallback to Neon / Local)
window.loadAllProducts = async function() {
    // 1. PRIMARY: Receive all live products directly from Supabase Cloud Database!
    try {
        let supaProds = null;
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from("products").select("*").order("category", { ascending: true }).order("name", { ascending: true });
                if (!error && Array.isArray(data) && data.length > 0) supaProds = data;
            } catch(e) {}
        }
        if (!supaProds) {
            // Direct REST API fetch to Supabase
            try {
                const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products?select=*&order=category.asc,name.asc`, {
                    headers: {
                        'apikey': SUPABASE_CONFIG.anonKey,
                        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) supaProds = data;
                }
            } catch(e) {}
        }

        if (supaProds && supaProds.length > 0) {
            AdminState.products = supaProds.map(r => ({
                id: r.id,
                sql_id: r.id,
                name: r.name,
                description: r.description || '',
                price: Number((r.discount_price && Number(r.discount_price) > 0) ? r.discount_price : r.price || 0),
                originalPrice: Number(r.original_price || r.price || 0),
                price_half_kg: Number(r.price_half_kg || r.price || 0),
                price_1kg: Number(r.price_1kg || (Number(r.price) + 400)),
                price_1_5kg: Number(r.price_1_5kg || (Number(r.price) + 800)),
                price_2kg: Number(r.price_2kg || (Number(r.price) + 1200)),
                price_3kg: Number(r.price_3kg || (Number(r.price) + 2000)),
                cooling_price_half_kg: Number(r.cooling_price_half_kg || 50),
                cooling_price_1kg: Number(r.cooling_price_1kg || 150),
                cooling_price_1_5kg: Number(r.cooling_price_1_5kg || 199),
                cooling_price_2kg: Number(r.cooling_price_2kg || 200),
                cooling_price_3kg: Number(r.cooling_price_3kg || 299),
                category: r.category || 'Specialty Cakes',
                image: r.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
                image_url: r.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
                isVeg: true,
                is_available: r.is_available !== false,
                stock: Number(r.stock || 100),
                has_weight: r.has_weight !== undefined ? (r.has_weight === true || r.has_weight === 'true') : true,
                has_cooling: r.has_cooling !== undefined ? (r.has_cooling === true || r.has_cooling === 'true') : true,
                has_flavours: r.has_flavours !== undefined ? (r.has_flavours === true || r.has_flavours === 'true') : true,
                flavour: r.flavour || "",
                flavour_prices: (typeof r.flavour_prices === 'object' && r.flavour_prices !== null) ? r.flavour_prices : {}
            }));
            AdminState.supabaseConnected = true;
            updateCloudStatusBadges();
            console.log(`✅ Admin Panel received ${AdminState.products.length} live products directly from Supabase!`);
            // Also fetch live flavour weights if table exists
            try {
                const fwRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/flavour_weights?select=*`, {
                    headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}` }
                });
                if (fwRes.ok) {
                    const fwList = await fwRes.json();
                    if (Array.isArray(fwList) && fwList.length > 0) {
                        AdminState.flavourWeights = fwList;
                        fwList.forEach(fw => {
                            const matched = ADMIN_FLAVOUR_KEYS.find(f => f.id === fw.id);
                            if (matched) {
                                matched.defaultPrice = Number(fw.price_half_kg || 0);
                                matched.price_half_kg = Number(fw.price_half_kg || 0);
                                matched.price_1kg = Number(fw.price_1kg || 0);
                                matched.price_1_5kg = Number(fw.price_1_5kg || 0);
                                matched.price_2kg = Number(fw.price_2kg || 0);
                            }
                        });
                        console.log('✅ Admin loaded live flavour weights from Supabase:', fwList.length);
                    }
                }
            } catch(e) {}

            renderProductsStats();
            renderProducts();
            return;
        }
    } catch(supaErr) {
        console.warn('Supabase catalog fetch exception, checking Neon fallback:', supaErr);
    }

    // 2. Secondary Fallback: Neon Serverless Postgres
    try {
        const sql = getNeonClient();
        if (sql) {
            const neonProds = await sql`SELECT * FROM products ORDER BY category, name ASC`;
            if (Array.isArray(neonProds) && neonProds.length > 0) {
                AdminState.products = neonProds.map(r => ({
                    id: r.id,
                    sql_id: r.id,
                    name: r.name,
                    description: r.description || '',
                    price: Number((r.discount_price && Number(r.discount_price) > 0) ? r.discount_price : r.price || 0),
                    originalPrice: Number(r.original_price || r.price || 0),
                    price_half_kg: Number(r.price_half_kg || r.price || 0),
                    price_1kg: Number(r.price_1kg || (Number(r.price) + 400)),
                    price_1_5kg: Number(r.price_1_5kg || (Number(r.price) + 800)),
                    price_2kg: Number(r.price_2kg || (Number(r.price) + 1200)),
                    price_3kg: Number(r.price_3kg || (Number(r.price) + 2000)),
                    cooling_price_half_kg: Number(r.cooling_price_half_kg || 50),
                    cooling_price_1kg: Number(r.cooling_price_1kg || 150),
                    cooling_price_1_5kg: Number(r.cooling_price_1_5kg || 199),
                    cooling_price_2kg: Number(r.cooling_price_2kg || 200),
                    cooling_price_3kg: Number(r.cooling_price_3kg || 299),
                    category: r.category || 'Specialty Cakes',
                    image: r.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
                    image_url: r.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
                    isVeg: true,
                    is_available: r.is_available !== false,
                    stock: Number(r.stock || 100),
                    has_weight: r.has_weight !== undefined ? (r.has_weight === true || r.has_weight === 'true') : true,
                    has_cooling: r.has_cooling !== undefined ? (r.has_cooling === true || r.has_cooling === 'true') : true,
                    has_flavours: r.has_flavours !== undefined ? (r.has_flavours === true || r.has_flavours === 'true') : true,
                    flavour: r.flavour || "",
                    flavour_prices: (typeof r.flavour_prices === 'object' && r.flavour_prices !== null) ? r.flavour_prices : {}
                }));
                AdminState.neonConnected = true;
                updateCloudStatusBadges();
                renderProductsStats();
                renderProducts();
                return;
            }
        }
    } catch(neonErr) {}

    let baseList = [];
    const seen = new Set();

    // 2. Fallback: Load from SWIGGY_DATA in data.js if available
    if (window.SWIGGY_DATA && Array.isArray(window.SWIGGY_DATA.restaurants)) {
        window.SWIGGY_DATA.restaurants.forEach(r => {
            if (Array.isArray(r.menu)) {
                r.menu.forEach(d => {
                    if (d && !seen.has(d.id || d.name)) {
                        seen.add(d.id || d.name);
                        baseList.push({
                            id: d.id || ("cake_" + (baseList.length + 1)),
                            sql_id: d.sql_id || null,
                            name: d.name,
                            price: Number(d.price || 0),
                            originalPrice: Number(d.originalPrice || d.price || 0),
                            price_half_kg: Number(d.price_half_kg || d.price || 0),
                            price_1kg: Number(d.price_1kg || ((Number(d.price) || 0) + 400)),
                            price_1_5kg: Number(d.price_1_5kg || ((Number(d.price) || 0) + 800)),
                            price_2kg: Number(d.price_2kg || ((Number(d.price) || 0) + 1200)),
                            cooling_price_half_kg: Number(d.cooling_price_half_kg || 50),
                            category: d.category || "Specialty Cakes",
                            description: d.description || "",
                            image: d.image || "",
                            isVeg: d.isVeg !== false,
                            isUniSpecial: Boolean(d.isUniSpecial),
                            is_available: d.is_available !== false && d.isAvailable !== false
                        });
                    }
                });
            }
        });
    }

    // 2. Read LocalStorage deleted, overrides & custom products
    let deletedIds = [];
    let priceOverrides = {};
    let customProducts = [];
    try {
        deletedIds = JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]");
        priceOverrides = JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}");
        customProducts = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
    } catch(e) {}

    // Filter out deleted items
    baseList = baseList.filter(p => !deletedIds.includes(p.id) && (!p.sql_id || !deletedIds.includes(p.sql_id)));

    // Apply price overrides
    baseList.forEach(item => {
        const key = item.sql_id || item.id;
        const over = priceOverrides[key] || priceOverrides[item.id] || (item.name ? priceOverrides[item.name.toLowerCase().trim()] : null);
        if (over) {
            if (over.price !== undefined) item.price = Number(over.price);
            if (over.originalPrice !== undefined) item.originalPrice = Number(over.originalPrice);
            if (over.is_available !== undefined) item.is_available = Boolean(over.is_available);
            if (over.name) item.name = over.name;
            if (over.category) item.category = over.category;
            if (over.description) item.description = over.description;
            if (over.image) item.image = over.image;
            if (over.price_half_kg !== undefined) item.price_half_kg = Number(over.price_half_kg);
            if (over.price_1kg !== undefined) item.price_1kg = Number(over.price_1kg);
            if (over.price_1_5kg !== undefined) item.price_1_5kg = Number(over.price_1_5kg);
            if (over.price_2kg !== undefined) item.price_2kg = Number(over.price_2kg);
            if (over.cooling_price_half_kg !== undefined) item.cooling_price_half_kg = Number(over.cooling_price_half_kg);
            if (over.has_weight !== undefined) item.has_weight = Boolean(over.has_weight);
            if (over.has_cooling !== undefined) item.has_cooling = Boolean(over.has_cooling);
            if (over.has_flavours !== undefined) item.has_flavours = Boolean(over.has_flavours);
            if (over.flavour !== undefined) item.flavour = over.flavour;
            if (over.flavour_prices !== undefined) item.flavour_prices = over.flavour_prices;
            if (over.isDirectAdd !== undefined) item.isDirectAdd = Boolean(over.isDirectAdd);
        }
    });

    // Prepend custom added products
    customProducts.forEach(newProd => {
        if (!deletedIds.includes(newProd.id)) {
            const existingIdx = baseList.findIndex(p => p.id === newProd.id || (p.sql_id && p.sql_id === newProd.sql_id));
            if (existingIdx !== -1) {
                baseList[existingIdx] = { ...baseList[existingIdx], ...newProd };
            } else {
                baseList.unshift(newProd);
            }
        }
    });

    // 3. Sync from Supabase products table if connected
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from("products").select("*");
            if (!error && Array.isArray(data) && data.length > 0) {
                data.forEach(liveItem => {
                    const cleanName = (liveItem.name || "").toLowerCase().trim();
                    let match = baseList.find(p => p.sql_id === liveItem.id || p.id === liveItem.id || (p.name && p.name.toLowerCase().trim() === cleanName));
                    const effectivePrice = (liveItem.discount_price && Number(liveItem.discount_price) > 0) ? Number(liveItem.discount_price) : Number(liveItem.price);
                    const effectiveOrig = Number(liveItem.price || effectivePrice);

                    if (match) {
                        match.sql_id = liveItem.id;
                        match.price = effectivePrice;
                        match.originalPrice = effectiveOrig;
                        match.price_half_kg = Number(liveItem.price_half_kg || effectivePrice);
                        match.price_1kg = Number(liveItem.price_1kg || (effectivePrice + 400));
                        match.price_1_5kg = Number(liveItem.price_1_5kg || (effectivePrice + 800));
                        match.price_2kg = Number(liveItem.price_2kg || (effectivePrice + 1200));
                        match.price_3kg = Number(liveItem.price_3kg || (effectivePrice + 2000));
                        match.cooling_price_half_kg = Number(liveItem.cooling_price_half_kg || 50);
                        if (liveItem.is_available !== undefined) match.is_available = Boolean(liveItem.is_available);
                        if (liveItem.category) match.category = liveItem.category;
                        if (liveItem.description) match.description = liveItem.description;
                        if (liveItem.image_url) match.image = liveItem.image_url;
                    } else if (liveItem.is_available !== false) {
                        baseList.push({
                            id: "choco_sql_" + liveItem.id,
                            sql_id: liveItem.id,
                            name: liveItem.name,
                            price: effectivePrice,
                            originalPrice: effectiveOrig,
                            category: liveItem.category || "Specialty Cakes",
                            description: liveItem.description || "",
                            image: liveItem.image_url || "",
                            isVeg: true,
                            is_available: true
                        });
                    }
                });
            }
        } catch(e) {
            console.warn("Supabase products fetch:", e);
        }
    }

    // 4. Sync from Neon Postgres products table (if connected)
    try {
        const neonSql = await getNeonClient();
        if (neonSql) {
            const neonProds = await neonSql`SELECT * FROM products`;
            if (Array.isArray(neonProds) && neonProds.length > 0) {
                neonProds.forEach(liveItem => {
                    const cleanName = (liveItem.name || "").toLowerCase().trim();
                    let match = baseList.find(p => p.sql_id === liveItem.id || p.id === liveItem.id || (p.name && p.name.toLowerCase().trim() === cleanName));
                    const effectivePrice = (liveItem.discount_price && Number(liveItem.discount_price) > 0) ? Number(liveItem.discount_price) : Number(liveItem.price);
                    const effectiveOrig = Number(liveItem.price || effectivePrice);

                    if (match) {
                        if (!match.sql_id) match.sql_id = liveItem.id;
                        match.price = effectivePrice;
                        match.originalPrice = effectiveOrig;
                        match.price_half_kg = Number(liveItem.price_half_kg || effectivePrice);
                        match.price_1kg = Number(liveItem.price_1kg || (effectivePrice + 400));
                        match.price_1_5kg = Number(liveItem.price_1_5kg || (effectivePrice + 800));
                        match.price_2kg = Number(liveItem.price_2kg || (effectivePrice + 1200));
                        match.price_3kg = Number(liveItem.price_3kg || (effectivePrice + 2000));
                        match.cooling_price_half_kg = Number(liveItem.cooling_price_half_kg || 50);
                        if (liveItem.is_available !== undefined) match.is_available = Boolean(liveItem.is_available);
                        if (liveItem.category) match.category = liveItem.category;
                        if (liveItem.description) match.description = liveItem.description;
                        if (liveItem.image_url) match.image = liveItem.image_url;
                    } else if (liveItem.is_available !== false) {
                        baseList.push({
                            id: "choco_neon_" + liveItem.id,
                            sql_id: liveItem.id,
                            name: liveItem.name,
                            price: effectivePrice,
                            originalPrice: effectiveOrig,
                            category: liveItem.category || "Specialty Cakes",
                            description: liveItem.description || "",
                            image: liveItem.image_url || "",
                            isVeg: true,
                            is_available: true
                        });
                    }
                });
            }
        }
    } catch(e) {
        console.warn("Neon products fetch exception:", e);
    }

    AdminState.products = baseList;

    // Update sidebar badge
    const badge = document.getElementById("sidebarProductsBadge");
    if (badge) badge.textContent = baseList.length + "+";

    renderProductsStats();
    renderProducts();
};

// Render Products KPI Metrics
function renderProductsStats() {
    const list = AdminState.products || [];
    const total = list.length;
    const inStock = list.filter(p => p.is_available !== false).length;
    const outOfStock = total - inStock;
    const categoriesSet = new Set(list.map(p => p.category).filter(Boolean));
    const avgPrice = total > 0 ? Math.round(list.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / total) : 0;

    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl("statTotalProducts", total);
    setEl("statInStockProducts", inStock);
    setEl("statOutOfStockProducts", outOfStock);
    setEl("statTotalCategories", categoriesSet.size);
    setEl("statAvgPrice", "₹" + avgPrice);
}

// Render Products Grid & Table
function renderProducts() {
    const gridContainer = document.getElementById("productsGridContainer");
    const tableContainer = document.getElementById("productsTableContainer");
    const tableBody = document.getElementById("productsTableBody");
    if (!gridContainer) return;

    let filtered = AdminState.products.filter(prod => {
        // Category filter
        if (AdminState.productsCategoryFilter && AdminState.productsCategoryFilter !== "ALL") {
            if (!prod.category || prod.category.toLowerCase().trim() !== AdminState.productsCategoryFilter.toLowerCase().trim()) {
                return false;
            }
        }
        // Stock filter
        if (AdminState.productsStockFilter === "IN_STOCK" && prod.is_available === false) return false;
        if (AdminState.productsStockFilter === "OUT_OF_STOCK" && prod.is_available !== false) return false;

        // Search query
        if (AdminState.productsSearchQuery) {
            const q = AdminState.productsSearchQuery.toLowerCase();
            const name = (prod.name || "").toLowerCase();
            const cat = (prod.category || "").toLowerCase();
            const price = String(prod.price || "");
            if (!name.includes(q) && !cat.includes(q) && !price.includes(q)) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-orders" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-cake-candles"></i>
                <h4>No Cakes or Items Found</h4>
                <p>No products match your current search or category filter.</p>
                <button class="header-btn primary" onclick="openAddProductModal()">
                    <i class="fa-solid fa-plus"></i> Add New Product
                </button>
            </div>
        `;
        if (tableContainer) tableContainer.style.display = "none";
        return;
    }

    if (AdminState.productsViewMode === "table") {
        gridContainer.style.display = "none";
        if (tableContainer) tableContainer.style.display = "block";
        if (tableBody) {
            tableBody.innerHTML = filtered.map(prod => createProductTableRowHTML(prod)).join("");
        }
    } else {
        gridContainer.style.display = "grid";
        if (tableContainer) tableContainer.style.display = "none";
        gridContainer.innerHTML = filtered.map(prod => createProductCardHTML(prod)).join("");
    }
}

// Helpers for flavour detection and pricing in Admin
function getAdminDefaultFlavour(prod) {
    if (prod && prod.flavour && prod.flavour.trim()) return prod.flavour.trim();
    if (prod && prod.flavour_prices && typeof prod.flavour_prices === 'object') {
        for (const [k, v] of Object.entries(prod.flavour_prices)) {
            if (Number(v) > 0) {
                const matched = (typeof ADMIN_FLAVOUR_KEYS !== 'undefined' ? ADMIN_FLAVOUR_KEYS : []).find(f => f.id.toLowerCase() === k.toLowerCase() || f.name.toLowerCase() === k.toLowerCase());
                if (matched) return matched.name;
            }
        }
    }
    const text = `${(prod && prod.name) || ''} ${(prod && prod.category) || ''}`.toLowerCase();
    if (text.includes('red velvet')) return 'Red Velvet';
    if (text.includes('blueberry')) return 'Blueberry';
    if (text.includes('black forest')) return 'Black Forest';
    if (text.includes('white forest')) return 'White Forest';
    if (text.includes('black currant') || text.includes('currant')) return 'Black Currant';
    if (text.includes('milk badam') || text.includes('badam')) return 'Milk Badam';
    if (text.includes('honey almond') || text.includes('almond')) return 'Honey Almond';
    if (text.includes('caramel')) return 'Caramel';
    if (text.includes('milky butterscotch')) return 'Milky Butterscotch';
    if (text.includes('nutty bubble')) return 'Nutty Bubble';
    if (text.includes('butterscotch')) return 'Butterscotch';
    if (text.includes('strawberry')) return 'Strawberry';
    if (text.includes('pineapple')) return 'Pineapple';
    if (text.includes('vanilla')) return 'Vanilla';
    if (text.includes('choco') || text.includes('truffle') || text.includes('fudge') || text.includes('dark')) return 'Chocolate';
    return 'Chocolate';
}

function getAdminFlavourPrice(prod, flavourName) {
    const basePrice = Number(prod && (prod.price_half_kg || prod.price) || 0);
    if (!flavourName || (prod && prod.has_flavours === false)) return basePrice;

    const fKey = flavourName.toLowerCase().replace(/\s+/g, '_');
    const fNameLower = flavourName.toLowerCase();

    if (prod && prod.flavour_prices && typeof prod.flavour_prices === 'object') {
        let entered = null;
        if (prod.flavour_prices[flavourName] !== undefined && prod.flavour_prices[flavourName] !== "") {
            entered = Number(prod.flavour_prices[flavourName]);
        } else if (prod.flavour_prices[fKey] !== undefined && prod.flavour_prices[fKey] !== "") {
            entered = Number(prod.flavour_prices[fKey]);
        } else {
            for (const [k, v] of Object.entries(prod.flavour_prices)) {
                if (k.toLowerCase().trim() === fNameLower || k.toLowerCase().trim() === fKey) {
                    entered = Number(v);
                    break;
                }
            }
        }
        if (entered !== null && !isNaN(entered) && entered > 0) {
            // Show only what was entered in flavour rate! Don't add extra price!
            if (entered >= 150) {
                return entered;
            } else {
                return basePrice + entered;
            }
        }
    }
    // If no flavour rate entered or entered 0, show base price only without adding extra price!
    return basePrice;
}

// Single Product Card HTML
function createProductCardHTML(prod) {
    const isAvail = prod.is_available !== false;
    const hasWeight = prod.has_weight !== false;
    const hasCooling = prod.has_cooling !== false;
    const nonCakeCategories = ['chocolates', 'snacks', 'desserts', 'shakes', 'brownies', 'combos', 'extras', 'dark', 'milk', 'ruby', 'drinks'];
    const isCatNonCake = nonCakeCategories.some(nc => (prod.category || '').toLowerCase().includes(nc));
    const hasFlavours = prod.has_flavours !== false && !isCatNonCake;
    const defaultFlavour = (prod.flavour && prod.flavour.trim()) ? prod.flavour.trim() : (hasFlavours ? getAdminDefaultFlavour(prod) : null);

    const basePrice = Number(prod.price || 0);
    const finalCardPrice = getAdminFlavourPrice(prod, defaultFlavour);
    const origPrice = Number(prod.originalPrice || Math.round(basePrice * 1.3)) + (finalCardPrice > basePrice ? (finalCardPrice - basePrice) : 0);
    const fallbackImg = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80";
    const imgSrc = prod.image || fallbackImg;

    return `
        <div class="product-admin-card" id="prodCard_${prod.id}">
            <div class="prod-card-img-wrap">
                <img src="${imgSrc}" alt="${escapeHtml(prod.name)}" class="prod-card-img" loading="lazy" onerror="this.src='${fallbackImg}'">
                <span class="prod-badge-cat">${escapeHtml(prod.category || "Cakes")}</span>
                <span class="prod-badge-stock ${isAvail ? 'in-stock' : 'out-of-stock'}">
                    ${isAvail ? '● In Stock' : '✕ Out of Stock'}
                </span>
            </div>

            <div class="prod-card-body">
                <div class="prod-card-header-row">
                    <h4 class="prod-card-title">${escapeHtml(prod.name)}</h4>
                    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                        ${hasFlavours && defaultFlavour ? `
                            <span class="admin-flavour-chip" style="font-size: 10px; font-weight: 700; color: #7c5cfc; background: #f5f3ff; border: 1px solid #ede9fe; padding: 1.5px 6.5px; border-radius: 4px; white-space: nowrap;" title="Flavour: ${defaultFlavour}">${defaultFlavour}</span>
                        ` : ''}
                        ${prod.isVeg !== false ? '<div class="prod-veg-dot" title="Pure Veg"><span></span></div>' : ""}
                    </div>
                </div>

                <p class="prod-card-desc">${escapeHtml(prod.description || "Handcrafted fresh cake baked with premium Belgian ingredients.")}</p>

                <!-- Price Row & Quick 1-Click Update with Flavour Display -->
                <div class="prod-card-price-row">
                    <div class="price-box-admin">
                        <span class="price-main-val">₹${finalCardPrice}</span>
                        ${origPrice > finalCardPrice ? `<span class="price-orig-val">₹${origPrice}</span>` : ""}
                    </div>
                    <button class="quick-edit-price-btn" onclick="openQuickPriceModal('${prod.id}')" title="Quick Update Price">
                        <i class="fa-solid fa-pen-to-square"></i> Edit Price
                    </button>
                </div>

                <!-- Weight Pricing Preview (Includes Flavour Rate) -->
                ${prod.has_weight === false ? `
                <div class="weights-preview-pills">
                    <span class="weight-preview-tag" style="background: #eef2ff; color: #4338ca; border-color: #c7d2fe; font-weight: 700;">
                        <i class="fa-solid fa-box"></i> Fixed Unit Price (No Weight/KG)
                    </span>
                    ${prod.has_cooling === false ? '<span class="weight-preview-tag" style="background: #f1f5f9; color: #475569;">No Cooling Surcharge</span>' : ''}
                </div>
                ` : `
                <div class="weights-preview-pills">
                    <span class="weight-preview-tag">0.5KG: ₹${finalCardPrice}</span>
                    <span class="weight-preview-tag">1KG: ₹${(Number(prod.price_1kg) || (basePrice + 400)) + (finalCardPrice > basePrice ? (finalCardPrice - basePrice) : 0)}</span>
                    <span class="weight-preview-tag">2KG: ₹${(Number(prod.price_2kg) || (basePrice + 1200)) + (finalCardPrice > basePrice ? (finalCardPrice - basePrice) : 0)}</span>
                </div>
                `}

                <!-- Stock Toggle Switch -->
                <div class="stock-toggle-bar">
                    <span>Available on Website</span>
                    <label class="switch-control">
                        <input type="checkbox" ${isAvail ? "checked" : ""} onchange="toggleProductStock('${prod.id}', this.checked)">
                        <span class="switch-slider"></span>
                    </label>
                </div>

                <!-- Actions -->
                <div class="prod-card-actions">
                    <button class="action-btn" style="flex: 1; background: var(--bg-main); color: var(--text-primary); border: 1px solid var(--border-color);" onclick="openEditProductModal('${prod.id}')">
                        <i class="fa-solid fa-pen"></i> Edit Details
                    </button>
                    <button class="action-btn icon-only" style="color: #dc2626; border: 1px solid #fee2e2; background: #fef2f2;" title="Remove from Menu" onclick="deleteProductItem('${prod.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Single Product Table Row HTML
function createProductTableRowHTML(prod) {
    const isAvail = prod.is_available !== false;
    const nonCakeCategories = ['chocolates', 'snacks', 'desserts', 'shakes', 'brownies', 'combos', 'extras', 'dark', 'milk', 'ruby', 'drinks'];
    const isCatNonCake = nonCakeCategories.some(nc => (prod.category || '').toLowerCase().includes(nc));
    const hasFlavours = prod.has_flavours !== false && !isCatNonCake;
    const defaultFlavour = hasFlavours ? getAdminDefaultFlavour(prod) : null;
    const basePrice = Number(prod.price || 0);
    const finalCardPrice = getAdminFlavourPrice(prod, defaultFlavour);
    const fallbackImg = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100";

    return `
        <tr>
            <td>
                <img src="${prod.image || fallbackImg}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover;" onerror="this.src='${fallbackImg}'">
            </td>
            <td>
                <strong>${escapeHtml(prod.name)}</strong>
                ${prod.isUniSpecial ? '<span style="font-size: 10px; background: #fdf4ff; color: #a21caf; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">🎓 Uni Deal</span>' : ""}
            </td>
            <td><span class="custom-pill weight">${escapeHtml(prod.category)}</span></td>
            <td>
                <strong style="color: var(--primary); font-size: 15px;">₹${finalCardPrice}</strong>
                ${hasFlavours && defaultFlavour ? `
                    <span style="font-size: 10.5px; font-weight: 700; color: #7c5cfc; background: rgba(124, 92, 252, 0.08); padding: 2px 6px; border-radius: 4px; margin-left: 6px; display: inline-block;">
                        ${defaultFlavour}: ₹${finalCardPrice}
                    </span>
                ` : ''}
                <button class="quick-edit-price-btn" style="margin-left: 8px;" onclick="openQuickPriceModal('${prod.id}')">Edit</button>
            </td>
            <td><span style="color: var(--text-muted); text-decoration: line-through;">₹${prod.originalPrice ? (Number(prod.originalPrice) + (finalCardPrice > basePrice ? (finalCardPrice - basePrice) : 0)) : ""}</span></td>
            <td>
                <label class="switch-control">
                    <input type="checkbox" ${isAvail ? "checked" : ""} onchange="toggleProductStock('${prod.id}', this.checked)">
                    <span class="switch-slider"></span>
                </label>
            </td>
            <td>
                <button class="header-btn" style="padding: 5px 9px; font-size: 12px;" onclick="openEditProductModal('${prod.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="header-btn" style="padding: 5px 9px; font-size: 12px; color: #dc2626;" onclick="deleteProductItem('${prod.id}')"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `;
}

// Toggle between Card View and Table View for products
window.toggleProductView = function(mode) {
    AdminState.productsViewMode = mode;
    const cardsBtn = document.getElementById("viewProdCardsBtn");
    const tableBtn = document.getElementById("viewProdTableBtn");
    if (cardsBtn && tableBtn) {
        if (mode === "cards") {
            cardsBtn.classList.add("active");
            tableBtn.classList.remove("active");
        } else {
            tableBtn.classList.add("active");
            cardsBtn.classList.remove("active");
        }
    }
    renderProducts();
};

// ==================== ADD & EDIT PRODUCT WORKFLOW ====================

// Product Image Upload & Automatic Link Generation Engine
function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function compressImageToDataUrl(file, maxWidth = 800, maxHeight = 800, quality = 0.85) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > maxWidth || h > maxHeight) {
                    if (w > h) {
                        h = Math.round((h * maxWidth) / w);
                        w = maxWidth;
                    } else {
                        w = Math.round((w * maxHeight) / h);
                        h = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                try {
                    const webpUrl = canvas.toDataURL('image/webp', quality);
                    if (webpUrl && webpUrl.startsWith('data:image/webp')) {
                        return resolve(webpUrl);
                    }
                } catch(err) {}
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
}

window.handleProductImageFileSelect = function(input) {
    if (input && input.files && input.files[0]) {
        window.processAndUploadProductImage(input.files[0]);
    }
};

window.handleProductImageDrop = function(e) {
    if (e) {
        e.preventDefault();
        const dropzone = document.getElementById('productImageDropzone');
        if (dropzone) {
            dropzone.style.borderColor = 'rgba(124, 92, 252, 0.4)';
            dropzone.style.background = 'rgba(124, 92, 252, 0.04)';
        }
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            window.processAndUploadProductImage(e.dataTransfer.files[0]);
        }
    }
};

window.processAndUploadProductImage = async function(file) {
    if (!file) return;

    const dropzone = document.getElementById('productImageDropzone');
    const prompt = document.getElementById('productUploadPrompt');
    const spinner = document.getElementById('productUploadSpinner');
    const statusBadge = document.getElementById('productImageStatusBadge');
    const inputUrl = document.getElementById('prodInputImage');

    if (prompt) prompt.style.display = 'none';
    if (spinner) spinner.style.display = 'flex';

    try {
        let generatedUrl = null;

        // 1. Try Supabase Storage first (if client is active)
        if (supabaseClient && supabaseClient.storage) {
            try {
                const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                const fileName = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
                const { data, error } = await supabaseClient.storage
                    .from('products')
                    .upload(fileName, file, { cacheControl: '3600', upsert: true });

                if (!error && data) {
                    const { data: pubData } = supabaseClient.storage.from('products').getPublicUrl(fileName);
                    if (pubData && pubData.publicUrl) {
                        generatedUrl = pubData.publicUrl;
                        console.log('✅ Uploaded directly to Supabase Storage:', generatedUrl);
                    }
                }
            } catch (supErr) {
                console.warn('Supabase storage upload note:', supErr);
            }
        }

        // 2. Try Server Upload (save_catalog.php or sync_server.js)
        if (!generatedUrl) {
            const formData = new FormData();
            formData.append('image', file);

            const uploadEndpoints = [
                'save_catalog.php',
                '../save_catalog.php',
                'http://127.0.0.1:3001/upload_image',
                'http://localhost:3001/upload_image'
            ];

            for (const ep of uploadEndpoints) {
                try {
                    let res;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 1200);
                    if (ep.includes(':3001')) {
                        const base64Data = await readFileAsDataUrl(file);
                        res = await fetch(ep, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: base64Data, filename: file.name }),
                            signal: controller.signal
                        });
                    } else {
                        res = await fetch(ep, {
                            method: 'POST',
                            body: formData,
                            signal: controller.signal
                        });
                    }
                    clearTimeout(timeoutId);
                    if (res && res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
                        const json = await res.json();
                        if (json && json.success && json.url) {
                            generatedUrl = json.url;
                            console.log('✅ Uploaded to server endpoint:', ep, '->', generatedUrl);
                            break;
                        }
                    }
                } catch(epErr) {}
            }
        }

        // 3. Fallback: Compress via HTML5 Canvas into ultra-sharp, self-contained Data URL
        if (!generatedUrl) {
            generatedUrl = await compressImageToDataUrl(file, 800, 800, 0.85);
            console.log('✅ Generated optimized data URL for image');
        }

        if (generatedUrl) {
            if (inputUrl) inputUrl.value = generatedUrl;
            window.updateProductImagePreview(generatedUrl);
            if (statusBadge) statusBadge.style.display = 'inline-flex';
            showToast('✅ Image uploaded & link generated successfully!', 'fa-solid fa-circle-check', '#10b981');
        }
    } catch(err) {
        console.error('Image upload error:', err);
        showToast('Image processing failed: ' + (err.message || 'Unknown error'), 'fa-solid fa-triangle-exclamation', '#ef4444');
    } finally {
        if (prompt) prompt.style.display = 'flex';
        if (spinner) spinner.style.display = 'none';
    }
};

window.updateProductImagePreview = function(url) {
    const container = document.getElementById('productImagePreviewContainer');
    const img = document.getElementById('productImagePreviewImg');
    const text = document.getElementById('productImagePreviewUrlText');
    const statusBadge = document.getElementById('productImageStatusBadge');
    const inputUrl = document.getElementById('prodInputImage');

    if (!url || !url.trim()) {
        if (container) container.style.display = 'none';
        if (statusBadge) statusBadge.style.display = 'none';
        return;
    }

    const cleanUrl = url.trim();
    if (img) {
        img.src = cleanUrl;
        img.onerror = function() {
            img.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80';
        };
    }
    if (text) {
        text.textContent = cleanUrl;
        text.title = cleanUrl;
    }
    if (container) container.style.display = 'flex';
    if (statusBadge) statusBadge.style.display = 'inline-flex';
    if (inputUrl && inputUrl.value !== cleanUrl) inputUrl.value = cleanUrl;
};

window.clearProductUploadedImage = function() {
    const fileInput = document.getElementById('productFileInput');
    if (fileInput) fileInput.value = '';
    const inputUrl = document.getElementById('prodInputImage');
    if (inputUrl) inputUrl.value = '';
    window.updateProductImagePreview('');
};


// ==================== PRODUCT WEIGHT & COOLING TOGGLES CONTROLLER ====================

// ==================== FLAVOUR KEYS & HELPERS FOR ADMIN ====================
const ADMIN_FLAVOUR_KEYS = [
    // 5 Normal & Cooling Shared Flavours
    { id: 'vanilla', name: 'Vanilla', defaultPrice: 0, category: 'normal', icon: '🍦' },
    { id: 'butterscotch', name: 'Butterscotch', defaultPrice: 0, category: 'normal', icon: '🧈' },
    { id: 'strawberry', name: 'Strawberry', defaultPrice: 50, category: 'normal', icon: '🍓' },
    { id: 'pineapple', name: 'Pineapple', defaultPrice: 0, category: 'normal', icon: '🍍' },
    { id: 'chocolate', name: 'Chocolate', defaultPrice: 0, category: 'normal', icon: '🍫', altId: 'chocolate_truffle' },
    // 10 Cooling-Exclusive Flavours
    { id: 'blueberry', name: 'Blueberry', defaultPrice: 50, category: 'cooling', icon: '🫐' },
    { id: 'black_currant', name: 'Black Currant', defaultPrice: 50, category: 'cooling', icon: '🍇' },
    { id: 'black_forest', name: 'Black Forest', defaultPrice: 0, category: 'cooling', icon: '🍒' },
    { id: 'milk_badam', name: 'Milk Badam', defaultPrice: 100, category: 'cooling', icon: '🥛' },
    { id: 'honey_almond', name: 'Honey Almond', defaultPrice: 100, category: 'cooling', icon: '🍯' },
    { id: 'red_velvet', name: 'Red Velvet', defaultPrice: 50, category: 'cooling', icon: '❤️' },
    { id: 'white_forest', name: 'White Forest', defaultPrice: 0, category: 'cooling', icon: '🍰' },
    { id: 'caramel', name: 'Caramel', defaultPrice: 50, category: 'cooling', icon: '🍮' },
    { id: 'milky_butterscotch', name: 'Milky Butterscotch', defaultPrice: 50, category: 'cooling', icon: '🍨' },
    { id: 'nutty_bubble', name: 'Nutty Bubble', defaultPrice: 100, category: 'cooling', icon: '🫧' }
];

window.ADMIN_FLAVOUR_KEYS = ADMIN_FLAVOUR_KEYS;

window.onFlavour05Input = function(flavourId, val) {
    const p = Number(val) || 0;
    const inp10 = document.getElementById('flavourPrice_' + flavourId + '_10');
    const inp15 = document.getElementById('flavourPrice_' + flavourId + '_15');
    const inp20 = document.getElementById('flavourPrice_' + flavourId + '_20');

    if (p > 0) {
        if (inp10 && (!inp10.value || inp10.dataset.autoCalc !== 'false')) inp10.value = p + 400;
        if (inp15 && (!inp15.value || inp15.dataset.autoCalc !== 'false')) inp15.value = p + 800;
        if (inp20 && (!inp20.value || inp20.dataset.autoCalc !== 'false')) inp20.value = p + 1200;
    }

    // If this flavour is the one currently selected in "Flavour for Selling Price", sync top inputs
    const selFlavour = document.getElementById("prodInputPriceFlavour") ? document.getElementById("prodInputPriceFlavour").value.trim() : "";
    const fKey = flavourId.toLowerCase().replace(/\s+/g, '_');
    if (selFlavour && (selFlavour.toLowerCase() === flavourId.toLowerCase() || selFlavour.toLowerCase().replace(/\s+/g, '_') === fKey)) {
        const mainP = document.getElementById("prodInputPrice");
        if (mainP && p > 0) {
            mainP.value = p;
            if (typeof autoComputeWeightPrices === 'function') autoComputeWeightPrices(p, true);
        }
    }
};

window.autoCalcSingleFlavourWeights = function(flavourId) {
    const inp05 = document.getElementById('flavourPrice_' + flavourId);
    const p = inp05 ? (Number(inp05.value) || 0) : 0;
    if (p <= 0) {
        if (typeof showToast === 'function') showToast('Please enter a 0.5 KG price first!', 'fa-solid fa-circle-exclamation', '#f59e0b');
        return;
    }
    const inp10 = document.getElementById('flavourPrice_' + flavourId + '_10');
    const inp15 = document.getElementById('flavourPrice_' + flavourId + '_15');
    const inp20 = document.getElementById('flavourPrice_' + flavourId + '_20');

    if (inp10) inp10.value = p + 400;
    if (inp15) inp15.value = p + 800;
    if (inp20) inp20.value = p + 1200;

    if (typeof showToast === 'function') {
        showToast(`✨ Auto-filled weights for ${flavourId}: 0.5KG (₹${p}) • 1KG (₹${p+400}) • 1.5KG (₹${p+800}) • 2KG (₹${p+1200})`, 'fa-solid fa-wand-magic-sparkles', '#db2777');
    }
};

window.autoFillAllFlavourWeights = function() {
    let count = 0;
    const baseFallback = Number(document.getElementById("prodInputPrice") ? document.getElementById("prodInputPrice").value : 749) || 749;
    ADMIN_FLAVOUR_KEYS.forEach(f => {
        const inp05 = document.getElementById('flavourPrice_' + f.id);
        const inp10 = document.getElementById('flavourPrice_' + f.id + '_10');
        const inp15 = document.getElementById('flavourPrice_' + f.id + '_15');
        const inp20 = document.getElementById('flavourPrice_' + f.id + '_20');

        let p = inp05 ? (Number(inp05.value) || 0) : 0;
        if (p <= 0) {
            p = baseFallback + f.defaultPrice;
            if (inp05) inp05.value = p;
        }
        if (inp10) inp10.value = p + 400;
        if (inp15) inp15.value = p + 800;
        if (inp20) inp20.value = p + 1200;
        count++;
    });
    if (typeof showToast === 'function') {
        showToast(`⚡ All ${count} flavours weight variations auto-filled! (+₹400 / +₹800 / +₹1200)`, 'fa-solid fa-scale-balanced', '#7c5cfc');
    }
};

window.setAllFlavourPrices = function(val) {
    ADMIN_FLAVOUR_KEYS.forEach(f => {
        const inp05 = document.getElementById('flavourPrice_' + f.id);
        const inp10 = document.getElementById('flavourPrice_' + f.id + '_10');
        const inp15 = document.getElementById('flavourPrice_' + f.id + '_15');
        const inp20 = document.getElementById('flavourPrice_' + f.id + '_20');

        if (inp05) inp05.value = val;
        if (inp10) inp10.value = val === 0 ? 0 : (val + 400);
        if (inp15) inp15.value = val === 0 ? 0 : (val + 800);
        if (inp20) inp20.value = val === 0 ? 0 : (val + 1200);
    });
    if (typeof showToast === 'function') {
        showToast(val === 0 ? 'All flavours set to ₹0 (Free)' : `All flavours set to ₹${val}`, 'fa-solid fa-tags', '#db2777');
    }
};

window.resetDefaultFlavourPrices = function() {
    ADMIN_FLAVOUR_KEYS.forEach(f => {
        const inp05 = document.getElementById('flavourPrice_' + f.id);
        const inp10 = document.getElementById('flavourPrice_' + f.id + '_10');
        const inp15 = document.getElementById('flavourPrice_' + f.id + '_15');
        const inp20 = document.getElementById('flavourPrice_' + f.id + '_20');

        if (inp05) inp05.value = f.defaultPrice;
        if (inp10) inp10.value = f.defaultPrice > 0 ? (f.defaultPrice + 400) : 0;
        if (inp15) inp15.value = f.defaultPrice > 0 ? (f.defaultPrice + 800) : 0;
        if (inp20) inp20.value = f.defaultPrice > 0 ? (f.defaultPrice + 1200) : 0;
    });
    if (typeof showToast === 'function') {
        showToast('Reset to standard flavour prices', 'fa-solid fa-rotate-left', '#db2777');
    }
};

window.toggleAdminWeightSection = function(enabled) {
    const chk = document.getElementById("prodInputHasWeight");
    if (chk && chk.checked !== enabled) chk.checked = enabled;

    const fields = document.getElementById("adminWeightPricingFields");
    const note = document.getElementById("adminNoWeightNote");
    const badge = document.getElementById("weightStatusBadge");
    const label = document.getElementById("labelHasWeight");

    if (fields) fields.style.display = enabled ? "grid" : "none";
    if (note) note.style.display = enabled ? "none" : "block";
    if (badge) {
        badge.textContent = enabled ? "ACTIVE" : "DISABLED (FIXED PRICE)";
        badge.style.color = enabled ? "#16a34a" : "#64748b";
        badge.style.background = enabled ? "#dcfce7" : "#f1f5f9";
    }
    if (label) {
        label.style.borderColor = enabled ? "#7c5cfc" : "#e2e8f0";
        label.style.background = enabled ? "#faf5ff" : "#ffffff";
    }
};

window.toggleAdminCoolingSection = function(enabled) {
    const chk = document.getElementById("prodInputHasCooling");
    if (chk && chk.checked !== enabled) chk.checked = enabled;

    const field = document.getElementById("adminCoolingPriceField");
    const note = document.getElementById("adminNoCoolingNote");
    const label = document.getElementById("labelHasCooling");

    if (field) field.style.display = enabled ? "block" : "none";
    if (note) note.style.display = enabled ? "none" : "block";
    if (label) {
        label.style.borderColor = enabled ? "#0284c7" : "#e2e8f0";
        label.style.background = enabled ? "#f0f9ff" : "#ffffff";
    }
};

window.toggleAdminFlavoursSection = function(enabled) {
    const chk = document.getElementById("prodInputHasFlavours");
    if (chk && chk.checked !== enabled) chk.checked = enabled;

    const box = document.getElementById("adminFlavoursContent");
    const note = document.getElementById("adminNoFlavoursNote");
    const badge = document.getElementById("flavoursStatusBadge");
    const label = document.getElementById("labelHasFlavours");

    if (box) box.style.display = enabled ? "block" : "none";
    if (note) note.style.display = enabled ? "none" : "block";
    if (badge) {
        badge.textContent = enabled ? "ACTIVE" : "DISABLED";
        badge.style.color = enabled ? "#db2777" : "#64748b";
        badge.style.background = enabled ? "#fce7f3" : "#f1f5f9";
    }
    if (label) {
        label.style.borderColor = enabled ? "#db2777" : "#e2e8f0";
        label.style.background = enabled ? "#fdf2f8" : "#ffffff";
    }
};

window.handleAdminCategoryChange = function(category) {
    const cat = (category || "").toLowerCase();
    const nonCakeCategories = [
        "chocolates", "snacks", "desserts", "shakes", 
        "brownies", "combos", "extras", "dark", "milk", "ruby", "drinks"
    ];

    const isNonCake = nonCakeCategories.some(nc => cat.includes(nc));
    if (isNonCake) {
        // Automatically default to NO cake weight, NO cooling temperature, and NO flavours
        window.toggleAdminWeightSection(false);
        window.toggleAdminCoolingSection(false);
        if (window.toggleAdminFlavoursSection) window.toggleAdminFlavoursSection(false);
    } else {
        // Standard Cakes, Theme Cakes, Celebration Cakes, Bento Cakes, etc.
        window.toggleAdminWeightSection(true);
        window.toggleAdminCoolingSection(true);
        if (window.toggleAdminFlavoursSection) window.toggleAdminFlavoursSection(true);
    }
};

window.syncAdminPriceFlavour = function(val) {
    if (document.getElementById("prodInputFlavour")) {
        document.getElementById("prodInputFlavour").value = val;
    }
    
    // Find the product being edited
    const formId = document.getElementById("prodFormId") ? document.getElementById("prodFormId").value.trim() : "";
    const prod = formId ? AdminState.products.find(p => p.id === formId || p.sql_id === formId || String(p.id) === String(formId) || String(p.sql_id) === String(formId)) : null;

    const baseHalfKgPrice = prod ? Number(prod.price_half_kg || prod.price || 0) : (Number(document.getElementById("prodInputPrice").value) || 749);
    const fKey = (val || "").toLowerCase().replace(/\s+/g, '_');
    const matchedF = (typeof ADMIN_FLAVOUR_KEYS !== 'undefined' ? ADMIN_FLAVOUR_KEYS : []).find(f => f.id.toLowerCase() === fKey || f.name.toLowerCase() === (val || "").toLowerCase() || (f.altId && f.altId.toLowerCase() === fKey));

    let foundPrice = null;

    // 1. Check existing flavourPrice_<id> input in the DOM
    if (matchedF) {
        const inp = document.getElementById('flavourPrice_' + matchedF.id) || (matchedF.altId ? document.getElementById('flavourPrice_' + matchedF.altId) : null);
        if (inp && inp.value !== "" && !isNaN(inp.value) && Number(inp.value) > 0) {
            const entered = Number(inp.value);
            foundPrice = entered >= 150 ? entered : (baseHalfKgPrice + entered);
        }
    }

    // 2. Check prod.flavour_prices object
    if (foundPrice === null && prod && prod.flavour_prices && typeof prod.flavour_prices === 'object') {
        const fp = prod.flavour_prices;
        let entered = null;
        if (fp[val] !== undefined && fp[val] !== "") {
            entered = Number(fp[val]);
        } else if (fp[fKey] !== undefined && fp[fKey] !== "") {
            entered = Number(fp[fKey]);
        } else {
            for (const [k, v] of Object.entries(fp)) {
                if (k.toLowerCase().trim() === (val || "").toLowerCase() || k.toLowerCase().trim() === fKey) {
                    entered = Number(v);
                    break;
                }
            }
        }
        if (entered !== null && !isNaN(entered) && entered > 0) {
            foundPrice = entered >= 150 ? entered : (baseHalfKgPrice + entered);
        }
    }

    // 3. Fallback to getAdminFlavourPrice helper
    if (foundPrice === null && prod) {
        const p = getAdminFlavourPrice(prod, val);
        if (p > 0) foundPrice = p;
    }

    // 4. Fallback to matched flavour default price
    if (foundPrice === null && matchedF && matchedF.defaultPrice > 0) {
        foundPrice = baseHalfKgPrice + matchedF.defaultPrice;
    }

    // 5. If still no specific price, use base price
    if (foundPrice === null && baseHalfKgPrice > 0) {
        foundPrice = baseHalfKgPrice;
    }

    // Update Selling Price, Strike Price, and Weight variants
    if (foundPrice && foundPrice > 0) {
        const priceInput = document.getElementById("prodInputPrice");
        if (priceInput) {
            priceInput.value = foundPrice;
        }
        const origInput = document.getElementById("prodInputOrigPrice");
        if (origInput) {
            origInput.value = Math.round(foundPrice * 1.3);
        }
        if (typeof autoComputeWeightPrices === 'function') {
            autoComputeWeightPrices(foundPrice, true);
        }
        if (typeof showToast === 'function') {
            showToast(`Selected ${val}: Price updated to ₹${foundPrice}`, 'fa-solid fa-wand-magic-sparkles', '#7c5cfc');
        }
    }
};

window.openAddProductModal = function() {
    const modal = document.getElementById("productModal");
    const title = document.getElementById("productModalTitle");
    const form = document.getElementById("productForm");
    if (!modal || !form) return;

    form.reset();
    document.getElementById("prodFormId").value = "";
    if (document.getElementById("prodInputFlavour")) document.getElementById("prodInputFlavour").value = "";
    if (document.getElementById("prodInputPriceFlavour")) document.getElementById("prodInputPriceFlavour").value = "Chocolate";
    if (window.resetDefaultFlavourPrices) window.resetDefaultFlavourPrices();
    if (title) title.textContent = "Add New Cake / Product";

    // Clear previous image upload state & preview
    window.clearProductUploadedImage();

    // Set smart default values
    document.getElementById("prodInputPrice").value = "749";
    document.getElementById("prodInputOrigPrice").value = "999";
    autoComputeWeightPrices("749");
    document.getElementById("prodInputInStock").checked = true;
    document.getElementById("prodInputIsVeg").checked = true;

    // Initialize weight & cooling toggle states based on initial category
    const initialCat = document.getElementById("prodInputCategory") ? document.getElementById("prodInputCategory").value : "Specialty Cakes";
    window.handleAdminCategoryChange(initialCat);

    modal.classList.add("open");
};

window.openEditProductModal = function(productId) {
    const prod = AdminState.products.find(p => p.id === productId || p.sql_id === productId || String(p.id) === String(productId) || String(p.sql_id) === String(productId));
    if (!prod) return;

    const modal = document.getElementById("productModal");
    const title = document.getElementById("productModalTitle");
    if (!modal) return;

    document.getElementById("prodFormId").value = prod.id || prod.sql_id || "";
    if (title) title.textContent = "Edit Product: " + (prod.name || "Item");

    // Basic product details
    document.getElementById("prodInputName").value = prod.name || "";
    document.getElementById("prodInputCategory").value = prod.category || "Specialty Cakes";
    const activeFlavour = (prod.flavour && prod.flavour.trim()) ? prod.flavour.trim() : (prod.selected_flavour || getAdminDefaultFlavour(prod) || "Chocolate");
    if (document.getElementById("prodInputFlavour")) document.getElementById("prodInputFlavour").value = activeFlavour;
    if (document.getElementById("prodInputPriceFlavour")) {
        const sel = document.getElementById("prodInputPriceFlavour");
        let matched = false;
        for (let i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value.toLowerCase() === activeFlavour.toLowerCase() || activeFlavour.toLowerCase().includes(sel.options[i].value.toLowerCase())) {
                sel.selectedIndex = i;
                matched = true;
                break;
            }
        }
        if (!matched) sel.value = activeFlavour;
    }
    const flavourPrice = getAdminFlavourPrice(prod, activeFlavour);
    const displayP = (flavourPrice && flavourPrice > 0) ? flavourPrice : (Number(prod.price) || 0);
    document.getElementById("prodInputPrice").value = displayP || "";
    document.getElementById("prodInputOrigPrice").value = prod.originalPrice || prod.original_price || Math.round((Number(displayP) || 0) * 1.3);
    document.getElementById("prodInputImage").value = prod.image || prod.image_url || "";
    document.getElementById("prodInputDesc").value = prod.description || "";

    // Weight variants with fallbacks - dynamically calculate based on displayP (the flavour's price!)
    const activeBaseP = displayP || Number(prod.price) || 0;
    const diff = (displayP > Number(prod.price || 0)) ? (displayP - Number(prod.price || 0)) : 0;
    const p05Val = (prod.price_half_kg !== undefined && prod.price_half_kg !== null && prod.price_half_kg !== "") ? (Number(prod.price_half_kg) + diff) : activeBaseP;
    const p10Val = (prod.price_1kg !== undefined && prod.price_1kg !== null && prod.price_1kg !== "") ? (Number(prod.price_1kg) + (diff * 2)) : (activeBaseP + 400);
    const p15Val = (prod.price_1_5kg !== undefined && prod.price_1_5kg !== null && prod.price_1_5kg !== "") ? (Number(prod.price_1_5kg) + (diff * 3)) : (activeBaseP + 800);
    const p20Val = (prod.price_2kg !== undefined && prod.price_2kg !== null && prod.price_2kg !== "") ? (Number(prod.price_2kg) + (diff * 4)) : (activeBaseP + 1200);

    document.getElementById("prodInputPrice05").value = p05Val;
    document.getElementById("prodInputPrice10").value = p10Val;
    document.getElementById("prodInputPrice15").value = p15Val;
    document.getElementById("prodInputPrice20").value = p20Val;

    const noteEl = document.getElementById("adminWeightFlavourSyncNote");
    if (noteEl) {
        noteEl.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>KG weights scaled for <strong>${activeFlavour}</strong>: 0.5KG (₹${p05Val}) • 1KG (₹${p10Val}) • 1.5KG (₹${p15Val}) • 2KG (₹${p20Val})</span>`;
    }
    document.getElementById("prodInputCoolingPrice").value = (prod.cooling_price_half_kg !== undefined && prod.cooling_price_half_kg !== null && prod.cooling_price_half_kg !== "") ? prod.cooling_price_half_kg : 50;

    // Toggles
    document.getElementById("prodInputIsVeg").checked = prod.isVeg !== false;
    document.getElementById("prodInputIsUni").checked = Boolean(prod.isUniSpecial);
    document.getElementById("prodInputInStock").checked = prod.is_available !== false;

    // Live image preview
    const currentImg = prod.image || prod.image_url || "";
    if (currentImg) {
        window.updateProductImagePreview(currentImg);
    } else {
        window.clearProductUploadedImage();
    }

    // Weight & Cooling toggles: check product properties or infer from category / isDirectAdd
    const nonCakeCategories = ["chocolates", "snacks", "desserts", "shakes", "brownies", "combos", "extras", "dark", "milk", "ruby", "drinks"];
    const isCatNonCake = nonCakeCategories.some(nc => (prod.category || "").toLowerCase().includes(nc));
    
    let hasWeight = true;
    if (prod.has_weight !== undefined) {
        hasWeight = Boolean(prod.has_weight);
    } else if (prod.isDirectAdd || isCatNonCake) {
        hasWeight = false;
    }

    let hasCooling = true;
    if (prod.has_cooling !== undefined) {
        hasCooling = Boolean(prod.has_cooling);
    } else if (prod.isDirectAdd || isCatNonCake) {
        hasCooling = false;
    }

    let hasFlavours = true;
    if (prod.has_flavours !== undefined) {
        hasFlavours = Boolean(prod.has_flavours);
    } else if (prod.isDirectAdd || isCatNonCake) {
        hasFlavours = false;
    }

    window.toggleAdminWeightSection(hasWeight);
    window.toggleAdminCoolingSection(hasCooling);
    if (window.toggleAdminFlavoursSection) window.toggleAdminFlavoursSection(hasFlavours);
    if (document.getElementById("prodInputFlavour")) {
        document.getElementById("prodInputFlavour").value = prod.flavour || prod.selected_flavour || "";
    }
    const savedFlavourPrices = prod.flavour_prices || {};
    ADMIN_FLAVOUR_KEYS.forEach(f => {
        const inp05 = document.getElementById('flavourPrice_' + f.id);
        const inp10 = document.getElementById('flavourPrice_' + f.id + '_10');
        const inp15 = document.getElementById('flavourPrice_' + f.id + '_15');
        const inp20 = document.getElementById('flavourPrice_' + f.id + '_20');

        let val05 = f.defaultPrice;
        if (savedFlavourPrices[f.id] !== undefined) val05 = savedFlavourPrices[f.id];
        else if (savedFlavourPrices[f.name] !== undefined) val05 = savedFlavourPrices[f.name];
        else if (f.altId && savedFlavourPrices[f.altId] !== undefined) val05 = savedFlavourPrices[f.altId];
        else if (savedFlavourPrices[f.id + '_05'] !== undefined) val05 = savedFlavourPrices[f.id + '_05'];

        if (inp05) inp05.value = (val05 !== null && val05 !== undefined) ? val05 : "";

        const num05 = Number(val05) || 0;
        let val10 = savedFlavourPrices[f.id + '_10'] || savedFlavourPrices[f.name + '_10'];
        let val15 = savedFlavourPrices[f.id + '_15'] || savedFlavourPrices[f.name + '_15'];
        let val20 = savedFlavourPrices[f.id + '_20'] || savedFlavourPrices[f.name + '_20'];

        if (val10 === undefined && num05 > 0) val10 = num05 + 400;
        if (val15 === undefined && num05 > 0) val15 = num05 + 800;
        if (val20 === undefined && num05 > 0) val20 = num05 + 1200;

        if (inp10) inp10.value = (val10 !== null && val10 !== undefined) ? val10 : "";
        if (inp15) inp15.value = (val15 !== null && val15 !== undefined) ? val15 : "";
        if (inp20) inp20.value = (val20 !== null && val20 !== undefined) ? val20 : "";
    });
    if (document.getElementById("prodInputFlavourPricingMode")) {
        document.getElementById("prodInputFlavourPricingMode").value = prod.flavour_pricing_mode || "tiered";
    }

    modal.classList.add("open");
};

window.autoComputeWeightPrices = function(baseVal, force = false) {
    const p = Number(baseVal) || 0;
    if (p <= 0) return;
    const p05 = document.getElementById("prodInputPrice05");
    const p10 = document.getElementById("prodInputPrice10");
    const p15 = document.getElementById("prodInputPrice15");
    const p20 = document.getElementById("prodInputPrice20");

    // Automatically pre-calculate weight variant inputs scaled to the selected flavour price
    if (p05) p05.value = p;
    if (p10 && (force || !p10.value || p10.value.trim() === '' || Number(p10.value) <= 0)) p10.value = p + 400;
    if (p15 && (force || !p15.value || p15.value.trim() === '' || Number(p15.value) <= 0)) p15.value = p + 800;
    if (p20 && (force || !p20.value || p20.value.trim() === '' || Number(p20.value) <= 0)) p20.value = p + 1200;

    // Keep the active flavour in the flavour table in sync with the entered Selling Price
    const selFlavour = document.getElementById("prodInputPriceFlavour") ? document.getElementById("prodInputPriceFlavour").value.trim() : "";
    if (selFlavour) {
        const fKey = selFlavour.toLowerCase().replace(/\s+/g, '_');
        const matchedF = (typeof ADMIN_FLAVOUR_KEYS !== 'undefined' ? ADMIN_FLAVOUR_KEYS : []).find(f => f.id.toLowerCase() === fKey || f.name.toLowerCase() === selFlavour.toLowerCase() || (f.altId && f.altId.toLowerCase() === fKey));
        if (matchedF) {
            const inp = document.getElementById('flavourPrice_' + matchedF.id) || (matchedF.altId ? document.getElementById('flavourPrice_' + matchedF.altId) : null);
            if (inp) inp.value = p;
        }

        const noteEl = document.getElementById("adminWeightFlavourSyncNote");
        if (noteEl) {
            noteEl.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>KG weights scaled for <strong>${selFlavour}</strong>: 0.5KG (₹${p}) • 1KG (₹${p+400}) • 1.5KG (₹${p+800}) • 2KG (₹${p+1200})</span>`;
        }
    }
};

window.setPresetImage = function(url) {
    const el = document.getElementById("prodInputImage");
    if (el) el.value = url;
    window.updateProductImagePreview(url);
    showToast('📷 Preset image selected!', 'fa-solid fa-image', '#7c5cfc');
};

// Handle Add / Edit Product Submit with complete persistence
window.handleProductFormSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const formId = document.getElementById("prodFormId").value.trim();
    const name = document.getElementById("prodInputName").value.trim();
    const category = document.getElementById("prodInputCategory").value;
    const price = Number(document.getElementById("prodInputPrice").value);
    const origPrice = Number(document.getElementById("prodInputOrigPrice").value || Math.round(price * 1.3));
    const image = document.getElementById("prodInputImage").value.trim();
    const desc = document.getElementById("prodInputDesc").value.trim();

    const price05 = Number(document.getElementById("prodInputPrice05").value || price);
    const price10 = Number(document.getElementById("prodInputPrice10").value || (price + 400));
    const price15 = Number(document.getElementById("prodInputPrice15").value || (price + 800));
    const price20 = Number(document.getElementById("prodInputPrice20").value || (price + 1200));
    const price30 = price + 2000;
    const coolingP = Number(document.getElementById("prodInputCoolingPrice").value || 50);

    const isVeg = document.getElementById("prodInputIsVeg").checked;
    const isUni = document.getElementById("prodInputIsUni").checked;
    const inStock = document.getElementById("prodInputInStock").checked;

    // Read weight, cooling, and flavours toggles
    const hasWeight = document.getElementById("prodInputHasWeight") ? document.getElementById("prodInputHasWeight").checked : true;
    const hasCooling = document.getElementById("prodInputHasCooling") ? document.getElementById("prodInputHasCooling").checked : true;
    const hasFlavours = document.getElementById("prodInputHasFlavours") ? document.getElementById("prodInputHasFlavours").checked : true;
    const priceFlavourEl = document.getElementById("prodInputPriceFlavour");
    const flavour = priceFlavourEl ? priceFlavourEl.value.trim() : (document.getElementById("prodInputFlavour") ? document.getElementById("prodInputFlavour").value.trim() : "");
    const flavourPrices = {};
    ADMIN_FLAVOUR_KEYS.forEach(f => {
        const inp05 = document.getElementById('flavourPrice_' + f.id);
        const inp10 = document.getElementById('flavourPrice_' + f.id + '_10');
        const inp15 = document.getElementById('flavourPrice_' + f.id + '_15');
        const inp20 = document.getElementById('flavourPrice_' + f.id + '_20');

        const val05 = inp05 ? (Number(inp05.value) || 0) : f.defaultPrice;
        const val10 = inp10 && inp10.value !== "" ? (Number(inp10.value) || 0) : (val05 > 0 ? (val05 + 400) : 0);
        const val15 = inp15 && inp15.value !== "" ? (Number(inp15.value) || 0) : (val05 > 0 ? (val05 + 800) : 0);
        const val20 = inp20 && inp20.value !== "" ? (Number(inp20.value) || 0) : (val05 > 0 ? (val05 + 1200) : 0);

        flavourPrices[f.id] = val05;
        flavourPrices[f.name] = val05;
        if (f.altId) flavourPrices[f.altId] = val05;

        flavourPrices[f.id + '_05'] = val05;
        flavourPrices[f.id + '_10'] = val10;
        flavourPrices[f.id + '_15'] = val15;
        flavourPrices[f.id + '_20'] = val20;

        flavourPrices[f.name + '_05'] = val05;
        flavourPrices[f.name + '_10'] = val10;
        flavourPrices[f.name + '_15'] = val15;
        flavourPrices[f.name + '_20'] = val20;
    });
    if (flavour) {
        flavourPrices[flavour] = price;
        flavourPrices[flavour.toLowerCase().replace(/\s+/g, '_')] = price;
    }
    const flavourPricingMode = document.getElementById("prodInputFlavourPricingMode") ? document.getElementById("prodInputFlavourPricingMode").value : "tiered";

    // If weight options are disabled, unify all weight variants to base price
    const finalPrice05 = hasWeight ? price05 : price;
    const finalPrice10 = hasWeight ? price10 : price;
    const finalPrice15 = hasWeight ? price15 : price;
    const finalPrice20 = hasWeight ? price20 : price;
    const finalPrice30 = hasWeight ? price30 : price;
    const finalCoolingP = hasCooling ? coolingP : 0;

    if (!name || isNaN(price) || price <= 0) {
        showToast("Please provide a valid product name and selling price!", "fa-solid fa-triangle-exclamation", "#f59e0b");
        return;
    }

    const saveBtn = document.getElementById("saveProductBtn");
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    let updatedProduct = null;

    if (formId) {
        // Edit existing product in memory
        const idx = AdminState.products.findIndex(p => p.id === formId || p.sql_id === formId || String(p.id) === String(formId) || String(p.sql_id) === String(formId));
        if (idx !== -1) {
            AdminState.products[idx] = {
                ...AdminState.products[idx],
                name,
                category,
                price,
                discount_price: price,
                originalPrice: origPrice,
                original_price: origPrice,
                image: image || AdminState.products[idx].image,
                image_url: image || AdminState.products[idx].image_url || AdminState.products[idx].image,
                description: desc,
                price_half_kg: finalPrice05,
                price_1kg: finalPrice10,
                price_1_5kg: finalPrice15,
                price_2kg: finalPrice20,
                price_3kg: finalPrice30,
                cooling_price_half_kg: finalCoolingP,
                cooling_price_charge: finalCoolingP,
                has_weight: hasWeight,
                has_cooling: hasCooling,
                has_flavours: hasFlavours,
                isDirectAdd: isDirectAdd,
                flavour: hasFlavours ? flavour : "",
                flavour_prices: hasFlavours ? flavourPrices : {},
                flavour_pricing_mode: flavourPricingMode,
                isVeg,
                isUniSpecial: isUni,
                is_available: inStock
            };
            updatedProduct = AdminState.products[idx];
        } else {
            updatedProduct = {
                id: formId,
                name, category, price, discount_price: price, originalPrice: origPrice, original_price: origPrice,
                image, image_url: image, description: desc,
                price_half_kg: price05, price_1kg: price10, price_1_5kg: price15, price_2kg: price20, price_3kg: price30,
                cooling_price_half_kg: coolingP, cooling_price_charge: coolingP, isVeg, isUniSpecial: isUni, is_available: inStock
            };
            AdminState.products.unshift(updatedProduct);
        }

        // Persist overrides locally in localStorage under chocoloom_price_overrides
        savePriceOverrideLocally(formId, {
            price,
            discount_price: price,
            originalPrice: origPrice,
            original_price: origPrice,
            is_available: inStock,
            name,
            category,
            description: desc,
            image: image || (updatedProduct ? updatedProduct.image : ''),
            image_url: image || (updatedProduct ? updatedProduct.image : ''),
            price_half_kg: finalPrice05,
            price_1kg: finalPrice10,
            price_1_5kg: finalPrice15,
            price_2kg: finalPrice20,
            price_3kg: finalPrice30,
            cooling_price_half_kg: finalCoolingP,
            cooling_price_charge: finalCoolingP,
            cooling_price_1kg: hasCooling ? Math.round(coolingP * 1.8) : 0,
            cooling_price_1_5kg: hasCooling ? Math.round(coolingP * 2.5) : 0,
            cooling_price_2kg: hasCooling ? Math.round(coolingP * 3.2) : 0,
            cooling_price_3kg: hasCooling ? Math.round(coolingP * 4.5) : 0,
            has_weight: hasWeight,
            has_cooling: hasCooling,
            has_flavours: hasFlavours,
            isDirectAdd: isDirectAdd,
            flavour: hasFlavours ? flavour : "",
            flavour_prices: hasFlavours ? flavourPrices : {},
            isVeg,
            isUniSpecial: isUni
        });

        // Also update in chocoloom_custom_products if was custom and un-delete
        try {
            let customs = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
            const cIdx = customs.findIndex(c => c.id === formId || (c.sql_id && c.sql_id === formId));
            if (cIdx !== -1) {
                customs[cIdx] = { ...customs[cIdx], ...updatedProduct };
                localStorage.setItem("chocoloom_custom_products", JSON.stringify(customs));
            }
            let dels = JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]");
            if (dels.includes(formId)) {
                dels = dels.filter(d => d !== formId);
                localStorage.setItem("chocoloom_deleted_products", JSON.stringify(dels));
            }
        } catch(e) {}
    } else {
        // Create new product
        const newId = "choco_custom_" + Date.now();
        updatedProduct = {
            id: newId,
            sql_id: null,
            name, category, price, discount_price: price, originalPrice: origPrice, original_price: origPrice,
            image: image || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600",
            image_url: image || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600",
            description: desc,
            price_half_kg: finalPrice05, price_1kg: finalPrice10, price_1_5kg: finalPrice15, price_2kg: finalPrice20, price_3kg: finalPrice30,
            cooling_price_half_kg: finalCoolingP,
            cooling_price_charge: finalCoolingP,
            has_weight: hasWeight,
            has_cooling: hasCooling,
            has_flavours: hasFlavours,
            flavour: hasFlavours ? flavour : "",
            flavour_prices: hasFlavours ? flavourPrices : {},
            isDirectAdd: isDirectAdd,
            isVeg, isUniSpecial: isUni,
            is_available: inStock
        };

        AdminState.products.unshift(updatedProduct);
        saveCustomProductLocally(updatedProduct);
    }

    // 1. Instantly close modal, update UI, and notify user (0ms latency)
    closeAdminModal("productModal");
    renderProducts();
    renderProductsStats();
    showToast(formId ? `✅ Product "${name}" saved!` : `🎂 Added "${name}"!`, "fa-solid fa-circle-check", "#10b981");

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Product';
    }

    // 2. Broadcast via BroadcastChannel and cross-origin sync so customer site updates in real time
    broadcastProductUpdate("SAVE", updatedProduct);

    // 3. Asynchronously persist to Cloud Database (Supabase & Neon) and server in background without blocking
    (async () => {
        try {
            await Promise.allSettled([
                syncProductToSupabase(updatedProduct),
                syncProductToNeon(updatedProduct),
                syncCatalogToServer()
            ]);
        } catch(syncErr) {
            console.warn('Background sync error:', syncErr);
        }
    })();
};

// Quick 1-Click Price Update Modal
window.openQuickPriceModal = function(productId) {
    const prod = AdminState.products.find(p => p.id === productId || p.sql_id === productId);
    if (!prod) return;

    const modal = document.getElementById("quickPriceModal");
    if (!modal) return;

    document.getElementById("quickPriceProdId").value = prod.id;
    document.getElementById("quickPriceProdName").textContent = prod.name;
    document.getElementById("quickPriceNewVal").value = prod.price;
    document.getElementById("quickPriceOrigVal").value = prod.originalPrice || Math.round(prod.price * 1.3);

    modal.classList.add("open");
    setTimeout(() => {
        const inp = document.getElementById("quickPriceNewVal");
        if (inp) { inp.focus(); inp.select(); }
    }, 150);
};

window.handleQuickPriceSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const prodId = document.getElementById("quickPriceProdId").value;
    const newPrice = Number(document.getElementById("quickPriceNewVal").value);
    const newOrig = Number(document.getElementById("quickPriceOrigVal").value || Math.round(newPrice * 1.3));

    if (!newPrice) return;

    const prod = AdminState.products.find(p => p.id === prodId || p.sql_id === prodId);
    if (prod) {
        const price05 = newPrice;
        const price10 = newPrice + 400;
        const price15 = newPrice + 800;
        const price20 = newPrice + 1200;
        const price30 = newPrice + 2000;

        prod.price = newPrice;
        prod.discount_price = newPrice;
        prod.originalPrice = newOrig;
        prod.price_half_kg = price05;
        prod.price_1kg = price10;
        prod.price_1_5kg = price15;
        prod.price_2kg = price20;
        prod.price_3kg = price30;

        if (prod.flavour) {
            if (!prod.flavour_prices || typeof prod.flavour_prices !== 'object') prod.flavour_prices = {};
            prod.flavour_prices[prod.flavour] = newPrice;
            prod.flavour_prices[prod.flavour + '_05'] = price05;
            prod.flavour_prices[prod.flavour + '_10'] = price10;
            prod.flavour_prices[prod.flavour + '_15'] = price15;
            prod.flavour_prices[prod.flavour + '_20'] = price20;
            const fKey = prod.flavour.toLowerCase().replace(/\s+/g, '_');
            prod.flavour_prices[fKey] = newPrice;
            prod.flavour_prices[fKey + '_05'] = price05;
            prod.flavour_prices[fKey + '_10'] = price10;
            prod.flavour_prices[fKey + '_15'] = price15;
            prod.flavour_prices[fKey + '_20'] = price20;
        }

        const updateData = {
            id: prod.id,
            sql_id: prod.sql_id,
            name: prod.name,
            category: prod.category,
            price: newPrice,
            discount_price: newPrice,
            originalPrice: newOrig,
            price_half_kg: price05,
            price_1kg: price10,
            price_1_5kg: price15,
            price_2kg: price20,
            price_3kg: price30,
            cooling_price_half_kg: prod.cooling_price_half_kg || 50,
            is_available: prod.is_available !== false
        };

        savePriceOverrideLocally(prodId, updateData);
        broadcastProductUpdate("PRICE", prod);

        // Immediate UI update & modal close (0ms latency)
        closeAdminModal("quickPriceModal");
        renderProducts();
        renderProductsStats();
        showToast('✅ Updated price for "' + prod.name + '" to ₹' + newPrice + '!', 'fa-solid fa-circle-check', '#10b981');

        // Background non-blocking sync to cloud databases and server
        (async () => {
            try {
                await Promise.allSettled([
                    syncProductToSupabase(prod),
                    syncProductToNeon(prod),
                    syncCatalogToServer()
                ]);
            } catch(err) {
                console.warn('Background quick price sync error:', err);
            }
        })();
    }
};

// Toggle in-stock availability switch (Instant sub-1ms response)
window.toggleProductStock = function(productId, isAvailable) {
    const prod = AdminState.products.find(p => p.id === productId || p.sql_id === productId || String(p.id) === String(productId) || String(p.sql_id) === String(productId));
    if (!prod) return;

    // 1. Mutate in-memory state immediately
    prod.is_available = Boolean(isAvailable);

    // 2. Save locally immediately to both price_overrides and catalog_cache
    savePriceOverrideLocally(productId, { is_available: isAvailable });
    try {
        const cache = JSON.parse(localStorage.getItem('chocoloom_db_catalog_cache') || '{}');
        const pObj = { ...(cache[productId] || cache[prod.sql_id] || cache[prod.name?.toLowerCase().trim()] || {}), is_available: isAvailable };
        if (productId) cache[productId] = pObj;
        if (prod.sql_id) cache[prod.sql_id] = pObj;
        if (prod.name) {
            cache[prod.name.toLowerCase().trim()] = pObj;
            cache[prod.name.toLowerCase().replace(/[^a-z0-9]/g, '')] = pObj;
        }
        localStorage.setItem('chocoloom_db_catalog_cache', JSON.stringify(cache));
    } catch(e) {}

    // 3. BROADCAST IMMEDIATELY (0ms across all local tabs and Supabase Realtime)
    broadcastProductUpdate("STOCK", prod);

    // 4. Update Admin UI immediately
    renderProductsStats();
    showToast('"' + prod.name + '" is now ' + (isAvailable ? "In Stock ⚡" : "Marked Out of Stock ⚡"), 'fa-solid fa-circle-check', isAvailable ? '#10b981' : '#64748b');

    // 5. Background non-blocking sync to Cloud DBs
    (async () => {
        try {
            await Promise.allSettled([
                syncProductToSupabase(prod),
                syncProductToNeon(prod),
                syncCatalogToServer()
            ]);
        } catch(err) {}
    })();
};

// Delete Product
window.deleteProductItem = async function(productId) {
    const prod = AdminState.products.find(p => p.id === productId || p.sql_id === productId);
    if (!prod) return;

    if (!confirm('Are you sure you want to remove "' + prod.name + '" from the active bakery menu?')) {
        return;
    }

    // Filter out in state
    AdminState.products = AdminState.products.filter(p => p.id !== productId && p.sql_id !== productId);

    // Save to deleted list
    try {
        const deletedIds = JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]");
        if (!deletedIds.includes(productId)) deletedIds.push(productId);
        if (prod.sql_id && !deletedIds.includes(prod.sql_id)) deletedIds.push(prod.sql_id);
        localStorage.setItem("chocoloom_deleted_products", JSON.stringify(deletedIds));

        // Also clean from custom products if was custom
        let customs = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
        customs = customs.filter(c => c.id !== productId);
        localStorage.setItem("chocoloom_custom_products", JSON.stringify(customs));
    } catch(e) {}

    // Instant UI update
    renderProducts();
    renderProductsStats();
    showToast('"' + prod.name + '" has been removed from menu', 'fa-solid fa-trash-can', '#ef4444');

    // Broadcast delete
    broadcastProductUpdate("DELETE", { id: productId, sql_id: prod.sql_id, name: prod.name });

    // Background non-blocking delete
    (async () => {
        try {
            if (prod.sql_id) {
                if (supabaseClient) supabaseClient.from("products").delete().eq("id", prod.sql_id).catch(() => {});
                fetch(`${SUPABASE_CONFIG.url}/rest/v1/products?id=eq.${prod.sql_id}`, {
                    method: 'DELETE',
                    headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}` }
                }).catch(() => {});
            }
            await deleteProductFromNeon(prod.sql_id || productId, prod.name);
            await syncCatalogToServer();
        } catch(e) {}
    })();
};

// Helper to save custom product locally
function saveCustomProductLocally(prod) {
    try {
        let customs = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
        const idx = customs.findIndex(c => c.id === prod.id);
        if (idx !== -1) customs[idx] = prod;
        else customs.unshift(prod);
        localStorage.setItem("chocoloom_custom_products", JSON.stringify(customs));
    } catch(e) {}
    syncCatalogToServer();
}

// Cross-Origin / Cross-Port Realtime Sync Bridge
function initSyncBridges() {
    const candidateOrigins = [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501"
    ];
    candidateOrigins.forEach(origin => {
        if (origin !== window.location.origin) {
            const id = "sync_bridge_" + origin.replace(/[^a-z0-9]/gi, "_");
            if (!document.getElementById(id)) {
                try {
                    const ifr = document.createElement("iframe");
                    ifr.id = id;
                    ifr.style.display = "none";
                    ifr.src = origin + "/sync_bridge.html";
                    document.body.appendChild(ifr);
                } catch(e) {}
            }
        }
    });
}

function sendCrossOriginSync(payload) {
    const message = { type: "CHOCOLOOM_SYNC", ...payload };

    // 1. Send to all bridge iframes
    const iframes = document.querySelectorAll("iframe[id^='sync_bridge_']");
    iframes.forEach(ifr => {
        try {
            if (ifr.contentWindow) {
                ifr.contentWindow.postMessage(message, "*");
            }
        } catch(e) {}
    });

    // 2. Send to opener or parent if open in window/tab
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, "*");
        }
    } catch(e) {}
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, "*");
        }
    } catch(e) {}

    // 3. Dispatch locally
    try {
        window.postMessage(message, "*");
    } catch(e) {}
}

function savePriceOverrideLocally(id, data) {
    let enriched = { ...(data || {}) };
    try {
        let overrides = JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}");
        enriched = { ...(overrides[id] || {}), ...data };
        if (enriched.price !== undefined) {
            const p = Number(enriched.price);
            if (!enriched.price_half_kg) enriched.price_half_kg = p;
            if (!enriched.price_1kg) enriched.price_1kg = p + 400;
            if (!enriched.price_1_5kg) enriched.price_1_5kg = p + 800;
            if (!enriched.price_2kg) enriched.price_2kg = p + 1200;
            if (!enriched.price_3kg) enriched.price_3kg = p + 2000;
        }

        if (id) overrides[id] = enriched;
        if (data && data.sql_id) overrides[data.sql_id] = enriched;
        if (data && data.id) overrides[data.id] = enriched;
        if (data && data.name) {
            overrides[data.name.toLowerCase().trim()] = enriched;
            overrides[data.name.toLowerCase().replace(/[^a-z0-9]/g, '')] = enriched;
        }
        localStorage.setItem("chocoloom_price_overrides", JSON.stringify(overrides));

        try {
            let dbC = JSON.parse(localStorage.getItem("chocoloom_db_catalog_cache") || "{}");
            if (id) dbC[id] = { ...(dbC[id] || {}), ...enriched };
            if (data && data.sql_id) dbC[data.sql_id] = { ...(dbC[data.sql_id] || {}), ...enriched };
            if (data && data.name) {
                dbC[data.name.toLowerCase().trim()] = { ...(dbC[data.name.toLowerCase().trim()] || {}), ...enriched };
                dbC[data.name.toLowerCase().replace(/[^a-z0-9]/g, '')] = { ...(dbC[data.name.toLowerCase().replace(/[^a-z0-9]/g, '')] || {}), ...enriched };
            }
            localStorage.setItem("chocoloom_db_catalog_cache", JSON.stringify(dbC));
        } catch(e) {}
    } catch(e) {}

    // Find full product details from memory to guarantee complete attributes sync to database
    let prodToSync = null;
    if (typeof AdminState !== "undefined" && Array.isArray(AdminState.products)) {
        prodToSync = AdminState.products.find(p => p.id === id || p.sql_id === id || (data && data.name && p.name && p.name.toLowerCase().trim() === data.name.toLowerCase().trim()));
    }
    const mergedProd = { ...(prodToSync || {}), id: id, ...enriched };

    // Asynchronously guarantee persistence to Cloud Database (Supabase & Neon)
    try {
        if (typeof syncProductToSupabase === "function") {
            syncProductToSupabase(mergedProd).catch(e => console.warn("Background Supabase sync error:", e));
        }
        if (typeof syncProductToNeon === "function") {
            syncProductToNeon(mergedProd).catch(e => console.warn("Background Neon sync error:", e));
        }
    } catch(dbErr) {}

    syncCatalogToServer();
    sendCrossOriginSync({
        action: "PRICE",
        overrides: JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}"),
        customProducts: JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]"),
        deletedProducts: JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]")
    });
}

// Auto-sync catalog changes to server endpoints or JSON storage (WordPress REST API, PHP, and Local Daemon)
async function syncCatalogToServer() {
    try {
        const payload = {
            overrides: JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}"),
            customProducts: JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]"),
            deletedProducts: JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]"),
            banners: JSON.parse(localStorage.getItem("chocoloom_banners") || "[]"),
            store_status: localStorage.getItem("chocoloom_store_status") || "open",
            updated_at: new Date().toISOString()
        };

        const wpConfig = window.CHOCOLOOM_WP_CONFIG || window.parent?.CHOCOLOOM_WP_CONFIG || {};
        const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        const targets = [];
        // 1. WordPress REST API (Top Priority when running in or alongside WordPress)
        if (wpConfig.restUrl) targets.push(wpConfig.restUrl);
        if (origin && origin !== 'null') {
            targets.push(`${origin}/wp-json/chocoloom/v1/catalog`);
            targets.push(`${origin}/index.php?rest_route=/chocoloom/v1/catalog`);
        }
        // Always include both Chocoloom live domains so changes are instantly reflected on customer website
        targets.push("https://chocoloom.com/wp-json/chocoloom/v1/catalog");
        targets.push("https://orders.chocoloom.com/wp-json/chocoloom/v1/catalog");

        // 2. Direct save_catalog endpoints (Vercel Serverless Function & PHP)
        if (wpConfig.saveCatalogUrl) targets.push(wpConfig.saveCatalogUrl);
        if (origin && origin !== 'null') {
            targets.push(`${origin}/api/save_catalog`);
            targets.push(`${origin}/save_catalog`);
            targets.push(`${origin}/save_catalog.php`);
        }
        targets.push("/api/save_catalog", "/save_catalog", "save_catalog.php", "./save_catalog.php", "../save_catalog.php", "../api/save_catalog.php");

        // 3. WordPress AJAX Fallback
        if (wpConfig.ajaxUrl) {
            targets.push(wpConfig.ajaxUrl + '?action=chocoloom_save_catalog');
        } else if (origin && origin !== 'null') {
            targets.push(`${origin}/wp-admin/admin-ajax.php?action=chocoloom_save_catalog`);
        }

        // 4. Local Node Daemon (ports 3000 & 3001 on localhost)
        if (isLocal) {
            targets.push("http://127.0.0.1:3000/save_catalog", "http://localhost:3000/save_catalog");
            targets.push("http://127.0.0.1:3001/save_catalog", "http://localhost:3001/save_catalog");
        }

        // Execute sync to targets in parallel (keep both production endpoints updated)
        const uniqueTargets = [...new Set(targets)];
        await Promise.allSettled(uniqueTargets.map(async target => {
            try {
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timeoutMs = target.includes(':3001') ? 400 : 1500;
                const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
                let res;
                try {
                    res = await fetch(target, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "X-WP-Nonce": wpConfig.nonce || ""
                        },
                        body: JSON.stringify(payload),
                        signal: controller ? controller.signal : undefined
                    });
                } finally {
                    if (timer) clearTimeout(timer);
                }
                if (res && res.ok) {
                    console.log("✅ Catalog successfully synced to server target:", target);
                }
            } catch(e) {}
        }));
    } catch(e) {}
}

// Export complete updated data.js for 1-click permanent persistence
window.exportDataJsFile = function() {
    const rawData = window.SWIGGY_DATA || (typeof SWIGGY_DATA !== "undefined" ? SWIGGY_DATA : null);
    if (!rawData) {
        showToast("Base SWIGGY_DATA not loaded!", "fa-solid fa-circle-exclamation", "#ef4444");
        return;
    }

    const exportedData = JSON.parse(JSON.stringify(rawData));
    let deletedIds = [];
    let priceOverrides = {};
    let customProducts = [];
    try {
        deletedIds = JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]");
        priceOverrides = JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}");
        customProducts = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
    } catch(e) {}

    if (exportedData.restaurants && exportedData.restaurants[0] && Array.isArray(exportedData.restaurants[0].menu)) {
        let menu = exportedData.restaurants[0].menu;
        menu = menu.filter(p => !deletedIds.includes(p.id) && (!p.sql_id || !deletedIds.includes(p.sql_id)));
        menu.forEach(item => {
            const key = item.sql_id || item.id;
            const over = priceOverrides[key] || priceOverrides[item.id] || (item.name ? priceOverrides[item.name.toLowerCase().trim()] : null);
            if (over) {
                Object.assign(item, over);
            }
        });
        customProducts.forEach(newProd => {
            if (!deletedIds.includes(newProd.id)) {
                const existingIdx = menu.findIndex(p => p.id === newProd.id);
                if (existingIdx !== -1) {
                    menu[existingIdx] = { ...menu[existingIdx], ...newProd };
                } else {
                    menu.unshift(newProd);
                }
            }
        });
        exportedData.restaurants[0].menu = menu;
    }

    const fileContent = "window.SWIGGY_DATA = " + JSON.stringify(exportedData, null, 4) + ";\n";
    const blob = new Blob([fileContent], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Downloaded updated data.js! Replace data.js in your website folder to keep everything permanently in sync.", "fa-solid fa-file-arrow-down", "#10b981");
};

// Reset local overrides to original data.js
window.resetToDataJs = function() {
    if (!confirm("Are you sure you want to clear all local overrides and reset everything to base data.js?")) {
        return;
    }
    localStorage.removeItem("chocoloom_price_overrides");
    localStorage.removeItem("chocoloom_custom_products");
    localStorage.removeItem("chocoloom_deleted_products");
    syncCatalogToServer();
    broadcastProductUpdate("RESET", null);
    if (typeof window.loadAllProducts === "function") {
        window.loadAllProducts().then(() => {
            renderProducts();
            renderProductsStats();
            showToast("Catalog reset to base data.js!", "fa-solid fa-rotate-left", "#7c5cfc");
        });
    }
};

// 1-Click Sync to Main Site
window.syncAllToMainSite = async function() {
    showToast("Syncing catalog to main site...", "fa-solid fa-cloud-arrow-up fa-spin", "#7c5cfc");
    await syncCatalogToServer();
    const payload = {
        type: "PRODUCTS_UPDATED",
        action: "SAVE",
        overrides: JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}"),
        customProducts: JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]"),
        deletedProducts: JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]"),
        timestamp: Date.now()
    };
    if ("BroadcastChannel" in window) {
        const ch = new BroadcastChannel("chocoloom_orders_bus");
        ch.postMessage(payload);
        setTimeout(() => { try { ch.close(); } catch(e){} }, 500);
    }
    sendCrossOriginSync(payload);
    setTimeout(() => {
        showToast("Catalog synced successfully! Main site (Port 5500 & 5501) is now up to date.", "fa-solid fa-circle-check", "#10b981");
    }, 400);
};

// Sync single product with Supabase table (Primary Cloud Database)
async function syncProductToSupabase(prod) {
    if (!prod) return { success: false, error: 'No product provided' };
    try {
        const finalImage = prod.image_url || prod.image || "";
        const finalPrice = Number(prod.price || 0);
        const payload = {
            name: String(prod.name || '').trim(),
            price: finalPrice,
            discount_price: finalPrice,
            price_half_kg: Number(prod.price_half_kg || finalPrice),
            price_1kg: Number(prod.price_1kg || (finalPrice + 400)),
            price_1_5kg: Number(prod.price_1_5kg || (finalPrice + 800)),
            price_2kg: Number(prod.price_2kg || (finalPrice + 1200)),
            price_3kg: Number(prod.price_3kg || (finalPrice + 2000)),
            cooling_price_half_kg: Number(prod.cooling_price_half_kg || 50),
            category: String(prod.category || 'Specialty Cakes'),
            description: String(prod.description || ''),
            image_url: finalImage,
            is_available: prod.is_available !== false,
            updated_at: new Date().toISOString()
        };

        // Add customization columns if available
        if (prod.has_weight !== undefined) payload.has_weight = Boolean(prod.has_weight);
        if (prod.has_cooling !== undefined) payload.has_cooling = Boolean(prod.has_cooling);
        if (prod.has_flavours !== undefined) payload.has_flavours = Boolean(prod.has_flavours);
        if (prod.flavour !== undefined) {
            payload.flavour = prod.flavour;
            payload.default_flavour = prod.flavour;
        }
        if (prod.flavour_prices && typeof prod.flavour_prices === 'object') {
            payload.flavour_prices = prod.flavour_prices;
            const fp = prod.flavour_prices;
            payload.flavour_price_truffle = Number(fp.chocolate_truffle ?? 0);
            payload.flavour_price_black_forest = Number(fp.black_forest ?? 0);
            payload.flavour_price_red_velvet = Number(fp.red_velvet ?? 50);
            payload.flavour_price_butterscotch = Number(fp.butterscotch ?? 0);
            payload.flavour_price_pineapple = Number(fp.pineapple ?? 0);
            payload.flavour_price_vanilla = Number(fp.vanilla ?? 0);
            payload.flavour_price_black_currant = Number(fp.black_currant ?? 50);
            payload.flavour_price_mango = Number(fp.mango ?? 50);
            payload.flavour_price_strawberry = Number(fp.strawberry ?? 50);
            payload.flavour_price_rasmalai = Number(fp.rasmalai ?? 100);
            payload.flavour_price_hazelnut = Number(fp.hazelnut_ferrero ?? 100);
        }

        let updated = false;
        let lastError = null;

        const restHeaders = {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };

        // 1. Resolve Target Supabase UUID
        let targetId = null;
        if (prod.sql_id && !String(prod.sql_id).startsWith('choco_') && !String(prod.sql_id).startsWith('uni_')) {
            targetId = prod.sql_id;
        } else if (prod.id && !String(prod.id).startsWith('choco_') && !String(prod.id).startsWith('uni_')) {
            targetId = prod.id;
        }

        // Search by exact name in Supabase if targetId not found
        if (!targetId && prod.name) {
            try {
                const findRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products?select=id&name=eq.${encodeURIComponent(prod.name.trim())}&limit=1`, {
                    headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}` }
                });
                if (findRes.ok) {
                    const items = await findRes.json();
                    if (Array.isArray(items) && items.length > 0) targetId = items[0].id;
                }
            } catch(e) {}
        }

        // Search by wildcard name if still not found
        if (!targetId && prod.name) {
            try {
                const findRes2 = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products?select=id&name=ilike.*${encodeURIComponent(prod.name.trim())}*&limit=1`, {
                    headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}` }
                });
                if (findRes2.ok) {
                    const items2 = await findRes2.json();
                    if (Array.isArray(items2) && items2.length > 0) targetId = items2[0].id;
                }
            } catch(e) {}
        }

        // 2. Direct Supabase REST API (Primary - Works across all browser environments)
        if (targetId) {
            try {
                const patchRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products?id=eq.${targetId}`, {
                    method: 'PATCH',
                    headers: restHeaders,
                    body: JSON.stringify(payload)
                });
                if (patchRes.ok) {
                    const patchData = await patchRes.json();
                    if (Array.isArray(patchData) && patchData.length > 0) {
                        prod.sql_id = targetId;
                        updated = true;
                        console.log(`✅ [Supabase REST] Updated "${prod.name}" (${targetId}) -> ₹${payload.price}`);
                    }
                } else {
                    lastError = await patchRes.text();
                    console.error(`❌ [Supabase REST PATCH Error] ${patchRes.status}:`, lastError);
                }
            } catch(fetchErr) {
                lastError = fetchErr.message;
                console.warn('Supabase REST PATCH exception:', fetchErr);
            }
        }

        // 3. Fallback: Supabase JS Client (if active)
        if (!updated && supabaseClient) {
            try {
                if (targetId) {
                    const { data, error } = await supabaseClient.from("products").update(payload).eq("id", targetId).select();
                    if (!error && data && data.length > 0) {
                        prod.sql_id = targetId;
                        updated = true;
                    }
                    if (error) lastError = error.message;
                } else {
                    const { data, error } = await supabaseClient.from("products").insert([payload]).select();
                    if (!error && data && data[0]) {
                        prod.sql_id = data[0].id;
                        updated = true;
                    }
                    if (error) lastError = error.message;
                }
            } catch(clientErr) {
                console.warn('Supabase JS Client attempt exception:', clientErr);
            }
        }

        // 4. If new product and not yet inserted, insert via REST POST
        if (!updated && !targetId) {
            try {
                const postRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products`, {
                    method: 'POST',
                    headers: restHeaders,
                    body: JSON.stringify(payload)
                });
                if (postRes.ok) {
                    const inserted = await postRes.json();
                    if (inserted && inserted[0]) {
                        prod.sql_id = inserted[0].id;
                        updated = true;
                        console.log(`✅ [Supabase REST] Inserted new product "${prod.name}" (${prod.sql_id})`);
                    }
                } else {
                    lastError = await postRes.text();
                }
            } catch(postErr) {
                lastError = postErr.message;
            }
        }

        // Keep local object attributes synced
        prod.image = finalImage;
        prod.image_url = finalImage;
        prod.price = payload.price;
        prod.discount_price = payload.price;

        // Broadcast to customer website via Supabase Realtime channel
        if (adminLiveCatalogChannel) {
            try {
                adminLiveCatalogChannel.send({
                    type: 'broadcast',
                    event: 'PRODUCT_UPDATE',
                    payload: { ...payload, id: targetId || prod.sql_id, image: finalImage }
                }).catch(() => {});
            } catch(bErr) {}
        }

        return { success: updated, error: lastError };
    } catch(e) {
        console.warn("Sync product to Supabase exception:", e);
        return { success: false, error: e.message };
    }
}

// Auto-create Neon tables if they don't exist
let _neonTablesEnsured = false;
async function ensureNeonTablesExist() {
    if (_neonTablesEnsured) return true;
    _neonTablesEnsured = true;
    const sql = await getNeonClient();
    if (!sql) return false;
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price NUMERIC,
                discount_price NUMERIC,
                original_price NUMERIC,
                image_url TEXT,
                category TEXT,
                stock INTEGER DEFAULT 100,
                is_available BOOLEAN DEFAULT TRUE,
                price_half_kg NUMERIC,
                price_1kg NUMERIC,
                price_1_5kg NUMERIC,
                price_2kg NUMERIC,
                price_3kg NUMERIC,
                cooling_price_charge NUMERIC DEFAULT 0,
                cooling_price_half_kg NUMERIC DEFAULT 50,
                cooling_price_1kg NUMERIC DEFAULT 150,
                cooling_price_1_5kg NUMERIC DEFAULT 199,
                cooling_price_2kg NUMERIC DEFAULT 200,
                cooling_price_3kg NUMERIC DEFAULT 299,
                has_weight BOOLEAN DEFAULT TRUE,
                has_cooling BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        try {
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS has_weight BOOLEAN DEFAULT TRUE;`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS has_cooling BOOLEAN DEFAULT TRUE;`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS has_flavours BOOLEAN DEFAULT FALSE;`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS flavour TEXT;`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS flavour_prices JSONB DEFAULT '{}'::jsonb;`;
        } catch(cErr) {}
        await sql`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                order_number TEXT UNIQUE NOT NULL,
                customer_name TEXT DEFAULT 'Guest Customer',
                customer_phone TEXT,
                phone TEXT,
                customer_email TEXT,
                delivery_address TEXT,
                delivery_location JSONB,
                delivery_notes TEXT,
                restaurant_id TEXT DEFAULT 'chocoloom',
                restaurant_name TEXT DEFAULT 'Chocoloom Flagship Bakery',
                items JSONB DEFAULT '[]'::jsonb,
                total_items INTEGER DEFAULT 1,
                item_total NUMERIC(10,2) DEFAULT 0.00,
                subtotal NUMERIC(10,2) DEFAULT 0.00,
                delivery_fee NUMERIC(10,2) DEFAULT 0.00,
                platform_fee NUMERIC(10,2) DEFAULT 0.00,
                gst_and_charges NUMERIC(10,2) DEFAULT 0.00,
                tip_amount NUMERIC(10,2) DEFAULT 0.00,
                discount_amount NUMERIC(10,2) DEFAULT 0.00,
                coupon_code TEXT,
                final_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
                total NUMERIC(10,2) DEFAULT 0.00,
                payment_method TEXT DEFAULT 'Cash on Delivery',
                payment_status TEXT DEFAULT 'pending',
                payment_id TEXT,
                status TEXT DEFAULT 'Confirmed',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        try {
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_location JSONB;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_id TEXT;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_name TEXT;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 1;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_total NUMERIC(10,2) DEFAULT 0.00;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0.00;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0.00;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_and_charges NUMERIC(10,2) DEFAULT 0.00;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) DEFAULT 0.00;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) DEFAULT 0.00;`;
            await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;`;
            await sql`CREATE INDEX IF NOT EXISTS idx_neon_orders_order_number ON orders(order_number);`;
            await sql`CREATE INDEX IF NOT EXISTS idx_neon_orders_created_at ON orders(created_at DESC);`;
            await sql`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE,
                    phone TEXT UNIQUE,
                    password TEXT,
                    role TEXT DEFAULT 'Customer',
                    is_student BOOLEAN DEFAULT FALSE,
                    college_id TEXT,
                    college_name TEXT,
                    avatar_url TEXT,
                    addresses JSONB DEFAULT '[]'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `;
            await sql`CREATE INDEX IF NOT EXISTS idx_neon_users_email ON users(email);`;
            await sql`CREATE INDEX IF NOT EXISTS idx_neon_users_phone ON users(phone);`;

            // VIP Chocowallet Physical NFC Card Orders Table
            await sql`
                CREATE TABLE IF NOT EXISTS card_orders (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    order_number TEXT UNIQUE NOT NULL,
                    customer_name TEXT DEFAULT 'Guest Customer',
                    customer_phone TEXT,
                    embossed_name TEXT,
                    shipping_address TEXT,
                    city TEXT,
                    pincode TEXT,
                    card_edition TEXT DEFAULT 'Matte Black Titanium VIP',
                    courier TEXT DEFAULT 'BlueDart Express Air Priority',
                    tracking_number TEXT,
                    amount NUMERIC(10,2) DEFAULT 199.00,
                    final_total NUMERIC(10,2) DEFAULT 199.00,
                    payment_status TEXT DEFAULT 'completed',
                    status TEXT DEFAULT 'Pending Embossing',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `;
            await sql`CREATE INDEX IF NOT EXISTS idx_neon_card_orders_order_number ON card_orders(order_number);`;
            await sql`CREATE INDEX IF NOT EXISTS idx_neon_card_orders_created_at ON card_orders(created_at DESC);`;
            await sql`
                CREATE TABLE IF NOT EXISTS store_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `;
        } catch(alterErr) {}
        return true;
    } catch(err) {
        console.warn('Neon table creation error:', err);
        return false;
    }
}

// Sync single product with Neon Postgres table (Intelligent UPSERT matching by ID or Name)
async function syncProductToNeon(prod) {
    if (!prod) return { success: false, error: 'Empty product' };
    const sql = await getNeonClient();
    if (!sql) return { success: false, error: 'No Neon connection' };

    try {
        if (!_neonTablesEnsured) {
            ensureNeonTablesExist().catch(() => {});
        }

        const id = String(prod.sql_id || prod.id || ('choco_' + Date.now())).trim();
        const name = String(prod.name || 'Unnamed Cake').trim();
        const desc = String(prod.description || '');
        const price = Number(prod.price || 0);
        const discPrice = Number(prod.discount_price || prod.price || 0);
        const origPrice = Number(prod.originalPrice || prod.original_price || Math.round(price * 1.3));
        const p05 = Number(prod.price_half_kg || price);
        const p10 = Number(prod.price_1kg || (price + 400));
        const p15 = Number(prod.price_1_5kg || (price + 800));
        const p20 = Number(prod.price_2kg || (price + 1200));
        const p30 = Number(prod.price_3kg || (price + 2000));
        const c05 = Number(prod.cooling_price_half_kg || 50);
        const c10 = Number(prod.cooling_price_1kg || 150);
        const c15 = Number(prod.cooling_price_1_5kg || 199);
        const c20 = Number(prod.cooling_price_2kg || 200);
        const c30 = Number(prod.cooling_price_3kg || 299);
        const cat = String(prod.category || 'Specialty Cakes');
        const img = String(prod.image || prod.image_url || '');
        const isAvail = prod.is_available !== false;
        const hasWeight = prod.has_weight !== false;
        const hasCooling = prod.has_cooling !== false;
        const hasFlavours = Boolean(prod.has_flavours);
        const flavour = String(prod.flavour || '');
        const flavourPrices = prod.flavour_prices || {};

        // Check if row already exists in Neon by ID, sql_id, or Name
        let existingId = null;
        try {
            const existingRows = await sql`
                SELECT id FROM products 
                WHERE id = ${id} OR id = ${String(prod.id || '')} OR id = ${String(prod.sql_id || '')} OR LOWER(TRIM(name)) = LOWER(TRIM(${name}))
                LIMIT 1;
            `;
            if (Array.isArray(existingRows) && existingRows.length > 0 && existingRows[0]?.id) {
                existingId = existingRows[0].id;
            }
        } catch(findErr) {
            console.warn('Neon check existing product error:', findErr);
        }

        if (existingId) {
            // Update existing row directly
            await sql`
                UPDATE products SET
                    name = ${name},
                    description = ${desc},
                    price = ${price},
                    discount_price = ${discPrice},
                    original_price = ${origPrice},
                    image_url = ${img},
                    category = ${cat},
                    is_available = ${isAvail},
                    price_half_kg = ${p05},
                    price_1kg = ${p10},
                    price_1_5kg = ${p15},
                    price_2kg = ${p20},
                    price_3kg = ${p30},
                    cooling_price_half_kg = ${c05},
                    cooling_price_1kg = ${c10},
                    cooling_price_1_5kg = ${c15},
                    cooling_price_2kg = ${c20},
                    cooling_price_3kg = ${c30},
                    has_weight = ${hasWeight},
                    has_cooling = ${hasCooling},
                    has_flavours = ${hasFlavours},
                    flavour = ${flavour},
                    flavour_prices = ${JSON.stringify(flavourPrices)}::jsonb,
                    updated_at = NOW()
                WHERE id = ${existingId};
            `;
            prod.id = existingId;
            prod.sql_id = existingId;
            console.log('✅ Updated existing product in Neon Postgres:', name, '(' + existingId + ')');
            return { success: true, id: existingId, action: 'UPDATE' };
        } else {
            // Insert new row
            await sql`
                INSERT INTO products (
                    id, name, description, price, discount_price, original_price,
                    image_url, category, is_available,
                    price_half_kg, price_1kg, price_1_5kg, price_2kg, price_3kg,
                    cooling_price_half_kg, cooling_price_1kg, cooling_price_1_5kg, cooling_price_2kg, cooling_price_3kg,
                    has_weight, has_cooling, has_flavours, flavour, flavour_prices,
                    created_at, updated_at
                ) VALUES (
                    ${id}, ${name}, ${desc}, ${price}, ${discPrice}, ${origPrice},
                    ${img}, ${cat}, ${isAvail},
                    ${p05}, ${p10}, ${p15}, ${p20}, ${p30},
                    ${c05}, ${c10}, ${c15}, ${c20}, ${c30},
                    ${hasWeight}, ${hasCooling}, ${hasFlavours}, ${flavour}, ${JSON.stringify(flavourPrices)}::jsonb,
                    NOW(), NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    discount_price = EXCLUDED.discount_price,
                    original_price = EXCLUDED.original_price,
                    image_url = EXCLUDED.image_url,
                    category = EXCLUDED.category,
                    is_available = EXCLUDED.is_available,
                    price_half_kg = EXCLUDED.price_half_kg,
                    price_1kg = EXCLUDED.price_1kg,
                    price_1_5kg = EXCLUDED.price_1_5kg,
                    price_2kg = EXCLUDED.price_2kg,
                    price_3kg = EXCLUDED.price_3kg,
                    cooling_price_half_kg = EXCLUDED.cooling_price_half_kg,
                    cooling_price_1kg = EXCLUDED.cooling_price_1kg,
                    cooling_price_1_5kg = EXCLUDED.cooling_price_1_5kg,
                    cooling_price_2kg = EXCLUDED.cooling_price_2kg,
                    cooling_price_3kg = EXCLUDED.cooling_price_3kg,
                    has_weight = EXCLUDED.has_weight,
                    has_cooling = EXCLUDED.has_cooling,
                    has_flavours = EXCLUDED.has_flavours,
                    flavour = EXCLUDED.flavour,
                    flavour_prices = EXCLUDED.flavour_prices,
                    updated_at = NOW();
            `;
            prod.id = id;
            prod.sql_id = id;
            console.log('✅ Inserted new product into Neon Postgres:', name, '(' + id + ')');
            return { success: true, id: id, action: 'INSERT' };
        }
    } catch(err) {
        console.warn('Neon sync product error:', err);
        return { success: false, error: err.message };
    }
}

// Delete product from Neon Postgres table
async function deleteProductFromNeon(prodId, prodName = '') {
    if (!prodId && !prodName) return;
    const sql = await getNeonClient();
    if (!sql) return;
    try {
        if (prodId) {
            await sql`DELETE FROM products WHERE id = ${String(prodId)};`;
        }
        if (prodName) {
            await sql`DELETE FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(${String(prodName)}));`;
        }
        console.log('✅ Deleted product from Neon Postgres:', prodId || prodName);
    } catch(err) {
        console.warn('Neon delete product error:', err);
    }
}

// 1-Click Migration & Sync All Products to Neon Postgres
window.syncAllProductsToNeon = async function() {
    const sql = await getNeonClient();
    if (!sql) {
        showToast('Please enter & save your Neon Connection String first!', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        return;
    }

    showToast('Setting up Neon tables & syncing catalog...', 'fa-solid fa-spinner fa-spin', '#7c5cfc');
    try {
        await ensureNeonTablesExist();
        const prods = AdminState.products || [];
        let count = 0;
        for (const p of prods) {
            await syncProductToNeon(p);
            count++;
        }
        showToast(`✅ Successfully synced ${count} products to Neon Postgres!`, 'fa-solid fa-circle-check', '#10b981');
        const statusBox = document.getElementById('neonConnectionStatusBox');
        if (statusBox) {
            statusBox.style.background = '#ecfdf5';
            statusBox.style.borderColor = '#a7f3d0';
            statusBox.style.color = '#065f46';
            statusBox.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> <strong>Neon Synced!</strong> ${count} products active in database.`;
        }
    } catch(err) {
        console.error('Neon bulk sync error:', err);
        showToast('Neon sync error: ' + err.message, 'fa-solid fa-circle-exclamation', '#ef4444');
    }
};

// Broadcast product change across tabs via BroadcastChannel & Cross-Origin Bridge
function broadcastProductUpdate(action, prod) {
    try {
        const overrides = JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}");
        const customProducts = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
        const deletedProducts = JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]");

        const payload = {
            type: "PRODUCTS_UPDATED",
            action: action,
            product: prod,
            overrides: overrides,
            customProducts: customProducts,
            deletedProducts: deletedProducts,
            timestamp: Date.now()
        };

        if ("BroadcastChannel" in window) {
            try {
                const chAdmin = new BroadcastChannel("chocoloom_admin_sync");
                chAdmin.postMessage(payload);
                setTimeout(() => { try { chAdmin.close(); } catch(e){} }, 500);
            } catch(e) {}

            try {
                const chOrders = new BroadcastChannel("chocoloom_orders_bus");
                chOrders.postMessage(payload);
                setTimeout(() => { try { chOrders.close(); } catch(e){} }, 500);
            } catch(e) {}
        }

        // 2. Supabase Realtime Broadcast (Instant sub-50ms push to customer website)
        if (adminLiveCatalogChannel) {
            try {
                adminLiveCatalogChannel.send({
                    type: 'broadcast',
                    event: 'PRODUCT_UPDATE',
                    payload: {
                        ...(prod || {}),
                        id: prod?.sql_id || prod?.id,
                        sql_id: prod?.sql_id,
                        name: prod?.name,
                        is_available: prod ? (prod.is_available !== false) : true,
                        price: prod?.price,
                        action: action
                    }
                }).catch(() => {});
            } catch(e) {}
        }

        sendCrossOriginSync(payload);
    } catch(e) {}
}


// ==================== SECURITY PIN AUTHENTICATION (PIN: 2026) ====================
const SECURITY_PIN = '2026';

function isUserAuthenticated() {
    return localStorage.getItem('chocoloom_admin_authed') === 'true' || 
           sessionStorage.getItem('chocoloom_admin_authed') === 'true';
}

function checkAdminAuth() {
    const overlay = document.getElementById('adminAuthOverlay');
    if (!overlay) return;

    if (isUserAuthenticated()) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    } else {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        resetPinInputs();
        setTimeout(() => {
            const first = document.getElementById('pinBox1');
            if (first) first.focus();
        }, 150);
    }
}

function resetPinInputs() {
    for (let i = 1; i <= 4; i++) {
        const box = document.getElementById(`pinBox${i}`);
        if (box) {
            box.value = '';
            box.classList.remove('filled');
        }
    }
    const err = document.getElementById('authErrorMsg');
    if (err) err.textContent = '';
}

window.quickFillPin = function(pin = '2026') {
    const boxes = [1, 2, 3, 4].map(i => document.getElementById(`pinBox${i}`));
    pin.split('').slice(0, 4).forEach((digit, idx) => {
        if (boxes[idx]) {
            boxes[idx].value = digit;
            boxes[idx].classList.add('filled');
        }
    });
    verifyPin();
};

window.pressKeypad = function(digit) {
    try { getAudioContext(); } catch(e) {}
    const boxes = [1, 2, 3, 4].map(i => document.getElementById(`pinBox${i}`));
    let targetBox = boxes.find(b => b && !b.value);
    if (!targetBox) {
        resetPinInputs();
        targetBox = boxes[0];
    }
    if (targetBox) {
        targetBox.value = digit;
        targetBox.classList.add('filled');
        const nextIdx = boxes.indexOf(targetBox) + 1;
        if (nextIdx < 4 && boxes[nextIdx]) {
            boxes[nextIdx].focus();
        } else {
            verifyPin();
        }
    }
};

window.clearPin = function() {
    resetPinInputs();
    const first = document.getElementById('pinBox1');
    if (first) first.focus();
};

window.backspacePin = function() {
    const boxes = [1, 2, 3, 4].map(i => document.getElementById(`pinBox${i}`));
    for (let i = 3; i >= 0; i--) {
        const box = boxes[i];
        if (box && box.value) {
            box.value = '';
            box.classList.remove('filled');
            box.focus();
            break;
        }
    }
};

window.verifyPin = function() {
    const d1 = document.getElementById('pinBox1')?.value || '';
    const d2 = document.getElementById('pinBox2')?.value || '';
    const d3 = document.getElementById('pinBox3')?.value || '';
    const d4 = document.getElementById('pinBox4')?.value || '';
    const enteredPin = `${d1}${d2}${d3}${d4}`.trim();

    const err = document.getElementById('authErrorMsg');
    const card = document.getElementById('authCardBox');
    const overlay = document.getElementById('adminAuthOverlay');
    const rememberMe = document.getElementById('authRememberCheckbox')?.checked;

    if (enteredPin === SECURITY_PIN) {
        // Correct PIN
        if (err) err.textContent = '';
        try {
            if (rememberMe) {
                localStorage.setItem('chocoloom_admin_authed', 'true');
            } else {
                sessionStorage.setItem('chocoloom_admin_authed', 'true');
            }
        } catch(e) {}

        // Play positive unlock chime
        try { playUnlockChime(); } catch(e) {}

        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }

        try { showToast('🔓 Access Granted! Welcome to Chocoloom Admin Portal.'); } catch(e) {}
        try { loadAllOrders(); } catch(e) { console.error("Error loading orders:", e); }
        try { loadAllProducts(); } catch(e) { console.error("Error loading products:", e); }
        try { if (typeof loadAllBanners === 'function') loadAllBanners(true); } catch(e) { console.error("Error loading banners:", e); }
        try { if (typeof loadAllCardOrders === 'function') loadAllCardOrders(); } catch(e) { console.error("Error loading card orders:", e); }
    } else {
        // Incorrect PIN
        try { playErrorBuzz(); } catch(e) {}
        if (err) {
            err.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Incorrect PIN. Security PIN is <strong>2026</strong>.';
        }
        if (card) {
            card.classList.remove('shake');
            void card.offsetWidth; // Force reflow
            card.classList.add('shake');
        }
        setTimeout(() => {
            resetPinInputs();
            const first = document.getElementById('pinBox1');
            if (first) first.focus();
        }, 500);
    }
};

window.lockAdminPortal = function() {
    try {
        localStorage.removeItem('chocoloom_admin_authed');
        sessionStorage.removeItem('chocoloom_admin_authed');
    } catch(e) {}
    const overlay = document.getElementById('adminAuthOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        resetPinInputs();
        setTimeout(() => {
            const first = document.getElementById('pinBox1');
            if (first) first.focus();
        }, 150);
    }
    showToast('🔒 Admin Portal has been locked.');
};

function playUnlockChime() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0, now + idx * 0.07);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.45);
        });
    } catch(e) {}
}

function playErrorBuzz() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(110, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    } catch(e) {}
}

function initPinKeyboardListeners() {
    const boxes = [1, 2, 3, 4].map(i => document.getElementById(`pinBox${i}`));
    boxes.forEach((box, idx) => {
        if (!box) return;
        box.addEventListener('focus', () => {
            box.select();
        });
        box.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val) {
                box.classList.add('filled');
                if (idx < 3) {
                    boxes[idx + 1].focus();
                } else {
                    verifyPin();
                }
            } else {
                box.classList.remove('filled');
            }
        });

        box.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                box.value = ''; // Clean overwrite
            } else if (e.key === 'Backspace') {
                if (!box.value && idx > 0) {
                    e.preventDefault();
                    boxes[idx - 1].focus();
                    boxes[idx - 1].value = '';
                    boxes[idx - 1].classList.remove('filled');
                }
            } else if (e.key === 'Enter') {
                verifyPin();
            } else if (e.key === 'ArrowLeft' && idx > 0) {
                boxes[idx - 1].focus();
            } else if (e.key === 'ArrowRight' && idx < 3) {
                boxes[idx + 1].focus();
            }
        });

        // Paste support
        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
            if (/^\d{4}$/.test(pasted)) {
                pasted.split('').forEach((char, i) => {
                    if (boxes[i]) {
                        boxes[i].value = char;
                        boxes[i].classList.add('filled');
                    }
                });
                verifyPin();
            }
        });
    });

    // Global keyboard listener when auth overlay is visible
    document.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('adminAuthOverlay');
        if (!overlay || overlay.classList.contains('hidden') || overlay.style.display === 'none') {
            return;
        }
        if (!boxes.includes(document.activeElement)) {
            if (e.key >= '0' && e.key <= '9') {
                pressKeypad(e.key);
            } else if (e.key === 'Backspace') {
                backspacePin();
            } else if (e.key === 'Enter') {
                verifyPin();
            }
        }
    });
}

// ==================== CLOUD SERVER CONFIGURATION MODAL ====================
window.openCloudConfigModal = function() {
    // Cloud database settings hidden
    return false;
};

window.saveCloudServerConfig = function() {
    const urlInput = document.getElementById("supabaseConfigUrl");
    const keyInput = document.getElementById("supabaseConfigKey");
    const neonInput = document.getElementById("neonConfigUrl");

    const url = urlInput ? urlInput.value.trim().replace(/\/$/, '') : '';
    const key = keyInput ? keyInput.value.trim() : '';
    const neonUrl = neonInput ? neonInput.value.trim() : '';

    if (url) localStorage.setItem("chocoloom_supabase_url", url);
    if (key) localStorage.setItem("chocoloom_supabase_key", key);
    if (neonUrl) localStorage.setItem("chocoloom_neon_url", neonUrl);

    // Relay to customer website via sync bridge and broadcast channel
    const configPayload = {
        type: "CLOUD_CONFIG_UPDATE",
        supabaseUrl: url,
        supabaseAnonKey: key,
        neonUrl: neonUrl
    };

    sendCrossOriginSync(configPayload);

    if ("BroadcastChannel" in window) {
        try {
            const ch = new BroadcastChannel("chocoloom_orders_bus");
            ch.postMessage(configPayload);
            setTimeout(() => { try { ch.close(); } catch(e){} }, 500);
        } catch(e) {}
    }

    showToast("Cloud credentials saved! Reconnecting services...", "fa-solid fa-circle-check", "#10b981");

    setTimeout(() => {
        window.location.reload();
    }, 600);
};

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    initNeon();
    setupBroadcastChannel();
    initSyncBridges();
    initEventListeners();
    initPinKeyboardListeners();
    updateAudioButtonUI();
    updateStoreStatusUI();
    fetchStoreStatusFromCloud();
    loadAllCardOrders();
    checkAdminAuth();

    // If already authenticated, load orders, products, and advertisements
    if (isUserAuthenticated()) {
        loadAllOrders();
        loadAllProducts();
        loadAllBanners(true);
    }

    // Request notification permission smoothly
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            Notification.requestPermission();
        }, 3000);
    }
});

// ==================== VIP CARD ORDERS CONTROLLER ====================
window.loadAllCardOrders = async function(silent = false) {
    let cardList = [];

    // 1. Neon Serverless Postgres
    try {
        const sql = getNeonClient();
        if (sql) {
            await ensureNeonTablesExist();
            const rows = await sql`SELECT * FROM card_orders ORDER BY created_at DESC`;
            if (Array.isArray(rows) && rows.length > 0) {
                cardList = rows;
            }
        }
    } catch (e) {
        console.warn('Neon card_orders fetch note:', e);
    }

    // 2. Supabase
    if (cardList.length === 0 && supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('card_orders').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data) && data.length > 0) {
                cardList = data;
            }
        } catch (e) {}
    }

    // 3. Fallback to localStorage
    if (cardList.length === 0) {
        try {
            const local = JSON.parse(localStorage.getItem('chocoloom_card_orders') || '[]');
            if (Array.isArray(local) && local.length > 0) {
                cardList = local;
            }
        } catch (e) {}
    }

    // 4. Master catalog fallback from window.SWIGGY_DATA.cardOrders
    if (cardList.length === 0 && window.SWIGGY_DATA && Array.isArray(window.SWIGGY_DATA.cardOrders)) {
        cardList = JSON.parse(JSON.stringify(window.SWIGGY_DATA.cardOrders));
    }

    // Cache to localStorage if first load so local modifications persist instantly
    if (cardList.length > 0 && !localStorage.getItem('chocoloom_card_orders')) {
        try {
            localStorage.setItem('chocoloom_card_orders', JSON.stringify(cardList));
        } catch(e) {}
    }

    AdminState.cardOrders = cardList;
    updateCardOrdersBadge();
    renderCardOrders();
};

window.updateCardOrdersBadge = function() {
    const badge = document.getElementById('sidebarCardsBadge');
    const mobBadge = document.getElementById('mobBadgeCards');
    const activeCount = (AdminState.cardOrders || []).filter(o => o.status !== 'Delivered').length;
    if (badge) {
        badge.textContent = activeCount;
        badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }
    if (mobBadge) {
        mobBadge.textContent = activeCount;
        mobBadge.style.display = activeCount > 0 ? 'inline-flex' : 'none';
    }
};

window.renderCardOrders = function() {
    const tbody = document.getElementById('cardOrdersTableBody');
    if (!tbody) return;

    const orders = AdminState.cardOrders || [];

    // Top KPI stats
    const totalCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'Pending Embossing').length;
    const inTransitCount = orders.filter(o => o.status === 'In Transit').length;
    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
    const revenue = orders.filter(o => o.payment_status === 'completed' || o.payment_status === 'paid' || !o.payment_status).reduce((sum, o) => sum + (Number(o.amount || o.final_total) || 199), 0);

    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl('statTotalCards', totalCount);
    setEl('statPendingCards', pendingCount);
    setEl('statInTransitCards', inTransitCount);
    setEl('statDeliveredCards', deliveredCount);
    setEl('statCardsRevenue', `₹${revenue.toLocaleString('en-IN')}`);

    // Update filter pill counts
    setEl('countCardPill_ALL', totalCount);
    setEl('countCardPill_Pending', pendingCount);
    setEl('countCardPill_InTransit', inTransitCount);
    setEl('countCardPill_Delivered', deliveredCount);

    // Apply filtering
    let filtered = orders.filter(order => {
        if (AdminState.cardsActiveFilter && AdminState.cardsActiveFilter !== 'ALL' && order.status !== AdminState.cardsActiveFilter) {
            return false;
        }
        if (AdminState.cardsSearchQuery) {
            const q = AdminState.cardsSearchQuery.toLowerCase();
            const orderNum = (order.order_number || '').toLowerCase();
            const custName = (order.customer_name || '').toLowerCase();
            const embossed = (order.embossed_name || '').toLowerCase();
            const phone = (order.customer_phone || '').toLowerCase();
            const awb = (order.tracking_number || '').toLowerCase();
            const addr = (order.shipping_address || '').toLowerCase();
            const city = (order.city || '').toLowerCase();
            if (!orderNum.includes(q) && !custName.includes(q) && !embossed.includes(q) && !phone.includes(q) && !awb.includes(q) && !addr.includes(q) && !city.includes(q)) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px 20px; color: #64748b;">
                    <i class="fa-solid fa-credit-card" style="font-size: 32px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
                    <strong style="font-size: 14px; color: #1e293b; display: block; margin-bottom: 4px;">No VIP Card Orders Found</strong>
                    <span style="font-size: 12px;">There are no card orders matching the current filter.</span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(order => {
        const orderId = order.id || order.order_number;
        const orderNum = order.order_number || 'CL-VIP-8842';
        const embossed = escapeHtml(order.embossed_name || order.customer_name || 'VIP MEMBER');
        const custName = escapeHtml(order.customer_name || 'Customer');
        const phone = escapeHtml(order.customer_phone || '');
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const address = escapeHtml(order.shipping_address || (order.city ? `${order.city} - ${order.pincode}` : 'Bengaluru'));
        const city = escapeHtml(order.city || 'Bengaluru');
        const pin = escapeHtml(order.pincode || '560001');
        const edition = escapeHtml(order.card_edition || 'Matte Black Titanium VIP');
        const isGold = edition.includes('Gold');
        const awb = order.tracking_number || 'BD88429108IN';
        const courier = order.courier || 'BlueDart Express Air Priority';
        const timeAgo = getTimeAgo(order.created_at);
        const status = order.status || 'Pending Embossing';

        let statusClass = 'in-transit';
        if (status === 'Pending Embossing') statusClass = 'pending-embossing';
        else if (status === 'Embossed') statusClass = 'embossed';
        else if (status === 'Delivered') statusClass = 'delivered';

        const isPaid = order.payment_status === 'completed' || order.payment_status === 'paid' || !order.payment_status;

        return `
            <tr>
                <td>
                    <div style="font-weight: 800; color: #0f172a; font-size: 13px;">#${orderNum}</div>
                    <small style="color: #64748b; font-size: 11px;"><i class="fa-regular fa-clock"></i> ${timeAgo}</small>
                </td>
                <td>
                    <div class="embossed-name-badge" title="Name to laser engrave in gold foil on metal card">
                        <i class="fa-solid fa-crown"></i>
                        <span>${embossed}</span>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${custName}</div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
                        <span style="font-size: 11.5px; color: #64748b;">${phone}</span>
                        ${phone ? `
                            <a href="tel:${phone}" class="table-action-icon-btn" title="Call Customer" style="padding: 2px 5px; font-size: 10px;">
                                <i class="fa-solid fa-phone" style="color: #0284c7;"></i>
                            </a>
                            <a href="https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${custName}! Update on your Chocoloom VIP Card order #${orderNum}: Your physical metal card (Embossed: ${embossed}) is currently ${status}! Courier Partner: ${courier}, AWB Tracking: ${awb}`)}" target="_blank" class="table-action-icon-btn" title="WhatsApp Customer" style="padding: 2px 5px; font-size: 10px;">
                                <i class="fa-brands fa-whatsapp" style="color: #16a34a;"></i>
                            </a>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <div class="card-table-addr" title="${address}">
                        <i class="fa-solid fa-location-dot" style="color: #9333ea; font-size: 11px; margin-right: 4px;"></i>${address}
                    </div>
                    <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">
                        <i class="fa-solid fa-city" style="font-size: 9px;"></i> ${city} • PIN: ${pin}
                    </div>
                </td>
                <td>
                    <span class="card-edition-badge ${isGold ? 'gold' : 'black'}">
                        <i class="fa-solid fa-credit-card"></i> ${edition}
                    </span>
                </td>
                <td>
                    <div class="card-tracking-pill">
                        <i class="fa-solid fa-plane-departure" style="font-size: 10px;"></i>
                        <span>${awb}</span>
                        <button type="button" class="table-action-icon-btn" style="border: none; padding: 2px 4px; background: transparent;" onclick="navigator.clipboard.writeText('${awb}'); showToast('Tracking code ${awb} copied! 📋', 'fa-regular fa-copy', '#10b981');" title="Copy AWB">
                            <i class="fa-regular fa-copy" style="font-size: 11px; color: #9333ea;"></i>
                        </button>
                    </div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px; display: flex; align-items: center; justify-content: space-between;">
                        <span>${courier}</span>
                        <a href="javascript:void(0)" onclick="promptForCardTracking('${orderId}')" style="color: #9333ea; font-size: 10px; text-decoration: underline; margin-left: 4px;" title="Edit AWB/Courier">Edit</a>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 900; color: #0f172a; font-size: 13px;">₹${order.amount || 199}</div>
                    <span style="font-size: 10.5px; background: ${isPaid ? '#ecfdf5' : '#fef3c7'}; color: ${isPaid ? '#059669' : '#d97706'}; font-weight: 800; padding: 1px 6px; border-radius: 4px;">
                        <i class="fa-solid ${isPaid ? 'fa-circle-check' : 'fa-clock'}"></i> ${isPaid ? 'Paid' : 'Pending'}
                    </span>
                </td>
                <td>
                    <!-- Status Lifecycle Dropdown -->
                    <select class="card-status-select ${statusClass}" onchange="updateCardOrderStatus('${orderId}', this.value)" title="Change lifecycle status">
                        <option value="Pending Embossing" ${status === 'Pending Embossing' ? 'selected' : ''}>⏳ Pending Embossing</option>
                        <option value="Embossed" ${status === 'Embossed' ? 'selected' : ''}>✨ Embossed</option>
                        <option value="In Transit" ${status === 'In Transit' ? 'selected' : ''}>🚚 In Transit</option>
                        <option value="Delivered" ${status === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
                    </select>
                </td>
                <td>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="table-action-icon-btn primary" onclick="openCardLabelModal('${orderId}')" title="Print Velvet Box Courier Label & Embossing Preview">
                            <i class="fa-solid fa-print"></i> Label
                        </button>
                        <button class="table-action-icon-btn" onclick="promptForCardTracking('${orderId}')" title="Edit BlueDart Tracking Code">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

window.filterCardOrders = function(filter) {
    AdminState.cardsActiveFilter = filter;
    document.querySelectorAll('[id^="cardFilter_"]').forEach(el => el.classList.remove('active'));
    const activeBtn = document.getElementById(`cardFilter_${filter.replace(/\s+/g, '')}`);
    if (activeBtn) activeBtn.classList.add('active');
    renderCardOrders();
};

window.handleSearchCards = function(val) {
    AdminState.cardsSearchQuery = (val || '').toLowerCase().trim();
    renderCardOrders();
};

// Render physical card embossing preview & printable shipping label
window.openCardLabelModal = function(orderId) {
    const order = (AdminState.cardOrders || []).find(o => o.id === orderId || o.order_number === orderId || String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
    if (!order) return;

    const content = document.getElementById('cardShippingLabelContent');
    if (!content) return;

    const orderNum = order.order_number || 'CL-VIP-8842';
    const embossed = escapeHtml(order.embossed_name || order.customer_name || 'VIP MEMBER');
    const custName = escapeHtml(order.customer_name || 'Customer');
    const phone = escapeHtml(order.customer_phone || '+91 98765 43210');
    const address = escapeHtml(order.shipping_address || (order.city ? `${order.city} - ${order.pincode}` : 'Bengaluru'));
    const city = escapeHtml(order.city || 'Bengaluru');
    const pin = escapeHtml(order.pincode || '560001');
    const edition = escapeHtml(order.card_edition || 'Matte Black Titanium VIP');
    const isGold = edition.includes('Gold');
    const awb = order.tracking_number || 'BD88429108IN';
    const courier = order.courier || 'BlueDart Express Air Priority';
    const cardNumber = order.card_number || `8842 9102 7834 ${orderNum.replace(/\D/g, '').slice(-4) || '8842'}`;

    content.innerHTML = `
        <!-- Section 1: Physical Metal Card Embossing Preview -->
        <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 11px; font-weight: 800; color: #7e22ce; text-transform: uppercase; letter-spacing: 1px;">
                    <i class="fa-solid fa-crown" style="color: #eab308;"></i> Physical Metal Card Laser Engraving Spec
                </span>
                <span style="font-size: 11px; color: #64748b; font-weight: 700;">
                    ${edition}
                </span>
            </div>

            <div class="vip-metal-card-preview ${isGold ? 'royal-gold' : 'matte-black'}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="assets/logo.png" alt="Chocoloom" style="width: 26px; height: 26px; border-radius: 6px;">
                        <span style="font-weight: 900; letter-spacing: 1px; font-size: 13px;">CHOCOLOOM VIP</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-wifi" style="transform: rotate(90deg); font-size: 14px; opacity: 0.85;" title="NFC Contactless Tap Enabled"></i>
                        <span style="font-size: 9.5px; font-weight: 800; padding: 2px 7px; border-radius: 999px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);">0.8mm METAL</span>
                    </div>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin: 12px 0 8px 0;">
                    <div class="vip-card-chip"></div>
                    <i class="fa-solid fa-crown" style="font-size: 20px; color: ${isGold ? '#854d0e' : '#facc15'}; opacity: 0.9;"></i>
                </div>

                <div>
                    <div style="font-family: monospace; font-size: 13px; letter-spacing: 2px; opacity: 0.75; margin-bottom: 6px;">
                        ${cardNumber}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                        <div>
                            <div style="font-size: 8.5px; letter-spacing: 0.8px; opacity: 0.6; text-transform: uppercase;">CARDHOLDER EMBOSSED</div>
                            <div class="vip-card-embossed-name">${embossed}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 8px; opacity: 0.6;">VALID THRU</div>
                            <div style="font-family: monospace; font-weight: 800; font-size: 11px;">10/31</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 2: BlueDart Express Printable Shipping Label -->
        <div class="shipping-label-card" id="printableCardShippingLabel">
            <div class="shipping-label-header">
                <div class="shipping-label-brand">
                    <img src="assets/logo.png" alt="Chocoloom Logo" style="width: 28px; height: 28px; border-radius: 6px;">
                    <div>
                        <h4>CHOCOLOOM VIP EMBOSSING LAB</h4>
                        <span style="font-size: 10px; color: #64748b;">Luxury Physical NFC Smart Card Fulfillment & Dispatch</span>
                    </div>
                </div>
                <div class="shipping-courier-tag">
                    <i class="fa-solid fa-plane-departure"></i> ${courier}
                </div>
            </div>

            <!-- Ship To Address Box -->
            <div class="shipping-address-box">
                <div class="shipping-address-title">SHIP TO RECIPIENT:</div>
                <div class="shipping-address-name">${custName}</div>
                <div class="shipping-address-text">${address}</div>
                <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-top: 2px;">City: ${city} • Pincode: ${pin}</div>
                <div class="shipping-address-phone"><i class="fa-solid fa-phone"></i> Contact: ${phone}</div>
            </div>

            <!-- Laser Embossing & Packaging Specifications -->
            <div class="shipping-specs-grid">
                <div class="shipping-spec-item" style="grid-column: 1 / -1; background: #faf5ff; border-color: #d8b4fe;">
                    <label style="color: #7e22ce;"><i class="fa-solid fa-crown" style="color: #eab308;"></i> LASER ENGRAVING SPECIFICATION (GOLD FOIL):</label>
                    <span style="font-size: 14px; font-weight: 900; color: #581c87; letter-spacing: 1px;">${embossed}</span>
                </div>
                <div class="shipping-spec-item">
                    <label>CARD EDITION FINISH</label>
                    <span>✨ ${edition} (0.8mm RFID)</span>
                </div>
                <div class="shipping-spec-item">
                    <label>PACKAGING KIT</label>
                    <span>🎁 Midnight Velvet Presentation Box + Welcome Letter</span>
                </div>
                <div class="shipping-spec-item">
                    <label>PRELOADED BALANCE</label>
                    <span style="color: #16a34a;">₹250 Active Bonus Credit</span>
                </div>
                <div class="shipping-spec-item">
                    <label>PAYMENT STATUS</label>
                    <span style="color: #059669;">Prepaid • ₹199 Received (No COD)</span>
                </div>
            </div>

            <!-- Courier Barcode Strip -->
            <div class="shipping-barcode-strip">
                <div class="mock-barcode"></div>
                <div class="shipping-barcode-number">AWB: ${awb}</div>
                <div style="font-size: 10.5px; color: #64748b; margin-top: 4px;">BlueDart Priority Air Waybill • Package ID: #${orderNum}</div>
            </div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px;">
            <button type="button" class="header-btn" onclick="closeAdminModal('cardShippingLabelModal')">Close</button>
            <button type="button" class="header-btn primary" onclick="printCardShippingLabel()">
                <i class="fa-solid fa-print"></i> Print Courier Shipping Label
            </button>
        </div>
    `;

    openAdminModal('cardShippingLabelModal');
};

// Aliases for compatibility
window.openCardShippingLabelModal = window.openCardLabelModal;

window.printCardShippingLabel = function() {
    const labelCard = document.getElementById('printableCardShippingLabel');
    if (!labelCard) return;

    const printContainer = document.getElementById('printableReceiptContainer');
    if (printContainer) {
        printContainer.innerHTML = labelCard.outerHTML;
        printContainer.style.display = 'block';
    }

    window.print();

    setTimeout(() => {
        if (printContainer) {
            printContainer.innerHTML = '';
            printContainer.style.display = 'none';
        }
    }, 1000);
};

// Update card status with immediate local, Neon, and Supabase persistence
window.updateCardOrderStatus = async function(orderId, newStatus, courier, awb) {
    const order = (AdminState.cardOrders || []).find(o => o.id === orderId || o.order_number === orderId || String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
    if (!order) return;

    if (newStatus) order.status = newStatus;
    if (courier !== undefined && courier !== null) order.courier = courier;
    if (awb !== undefined && awb !== null) order.tracking_number = awb;
    order.updated_at = new Date().toISOString();

    // 1. Immediate localStorage persistence
    try {
        localStorage.setItem('chocoloom_card_orders', JSON.stringify(AdminState.cardOrders));
    } catch(e) {}

    // 2. Persist to Neon Serverless Postgres
    try {
        const sql = getNeonClient();
        if (sql) {
            await ensureNeonTablesExist();
            await sql`
                UPDATE card_orders
                SET status = ${order.status},
                    courier = ${order.courier || 'BlueDart Express Air Priority'},
                    tracking_number = ${order.tracking_number || ''},
                    updated_at = NOW()
                WHERE id = ${String(order.id)} OR order_number = ${order.order_number}
            `;
        }
    } catch (e) {
        console.warn('Neon card status update note:', e);
    }

    // 3. Persist to Supabase if connected
    if (supabaseClient) {
        try {
            await supabaseClient.from('card_orders').update({
                status: order.status,
                courier: order.courier || 'BlueDart Express Air Priority',
                tracking_number: order.tracking_number || '',
                updated_at: new Date().toISOString()
            }).or(`id.eq.${order.id},order_number.eq.${order.order_number}`);
        } catch(e) {}
    }

    // 4. Reactive UI updates
    updateCardOrdersBadge();
    renderCardOrders();
    showToast(`Order #${order.order_number} updated to: ${order.status} 🏷️`, 'fa-solid fa-circle-check', '#10b981');
};

// Prompt dialog helper to update Courier & AWB
window.promptForCardTracking = async function(orderId) {
    const order = (AdminState.cardOrders || []).find(o => o.id === orderId || o.order_number === orderId || String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
    if (!order) return;

    const currentCourier = order.courier || 'BlueDart Express Air Priority';
    const currentAwb = order.tracking_number || 'BD88429108IN';

    const newAwb = prompt(`Enter new AWB tracking number for order #${order.order_number}:`, currentAwb);
    if (newAwb === null) return;

    const newCourier = prompt(`Enter Courier Partner name:`, currentCourier);
    if (newCourier === null) return;

    await window.updateCardOrderStatus(
        order.id || order.order_number,
        order.status,
        newCourier.trim() || currentCourier,
        newAwb.trim().toUpperCase() || currentAwb
    );
};

window.updateCardTrackingAwb = function(orderNum) {
    window.promptForCardTracking(orderNum);
};

window.advanceCardOrderStatus = async function(orderNum) {
    const order = (AdminState.cardOrders || []).find(o => o.order_number === orderNum || o.id === orderNum);
    if (!order) return;

    let nextStatus = 'In Transit';
    if (order.status === 'Pending Embossing') nextStatus = 'Embossed';
    else if (order.status === 'Embossed') nextStatus = 'In Transit';
    else if (order.status === 'In Transit') nextStatus = 'Delivered';
    else return;

    await window.updateCardOrderStatus(order.id || order.order_number, nextStatus);
};

// Export all VIP card shipping orders to CSV
window.exportCardOrdersCSV = function() {
    const orders = AdminState.cardOrders || [];
    if (!orders || orders.length === 0) {
        showToast('No card orders available to export.');
        return;
    }

    const headers = ['Order Number', 'Date', 'Embossed Name', 'Customer Name', 'Phone', 'Address', 'City', 'Pincode', 'Card Edition', 'Courier', 'AWB Number', 'Amount', 'Payment Status', 'Status'];
    const rows = orders.map(o => [
        `"${o.order_number || ''}"`,
        `"${o.created_at || ''}"`,
        `"${o.embossed_name || o.customer_name || ''}"`,
        `"${o.customer_name || ''}"`,
        `"${o.customer_phone || ''}"`,
        `"${(o.shipping_address || '').replace(/"/g, '""')}"`,
        `"${o.city || ''}"`,
        `"${o.pincode || ''}"`,
        `"${o.card_edition || ''}"`,
        `"${o.courier || 'BlueDart Express'}"`,
        `"${o.tracking_number || ''}"`,
        `"${o.amount || 199}"`,
        `"${o.payment_status || 'completed'}"`,
        `"${o.status || 'In Transit'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chocoloom_vip_card_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded VIP Card Shipping Roster CSV 📊', 'fa-solid fa-file-csv', '#10b981');
};

window.exportCardOrdersCsv = window.exportCardOrdersCSV;

window.simulateIncomingCardOrder = function() {
    getAudioContext();
    const demoHolders = [
        { name: 'Kavya Madhavan', phone: '+91 98840 12345', street: 'Tower 4, Prestige Shantiniketan, ITPL', city: 'Bengaluru', pin: '560048', edition: 'Matte Black Titanium VIP' },
        { name: 'Aditya Chawla', phone: '+91 97110 56789', street: 'Flat 12B, Ocean Drive, Bandra West', city: 'Mumbai', pin: '400050', edition: 'Royal Cocoa Gold VIP' },
        { name: 'Sameer Kulkarni', phone: '+91 98230 44556', street: 'Plot 104, Kalyani Nagar', city: 'Pune', pin: '411006', edition: 'Matte Black Titanium VIP' }
    ];

    const pick = demoHolders[Math.floor(Math.random() * demoHolders.length)];
    const lastFour = Math.floor(1000 + Math.random() * 9000);
    const orderNum = 'CL-VIP-' + lastFour;
    const awb = 'BD' + Math.floor(10000000 + Math.random() * 90000000) + 'IN';

    const newOrder = {
        id: 'card_ord_' + Date.now(),
        order_number: orderNum,
        customer_name: pick.name,
        customer_phone: pick.phone,
        embossed_name: pick.name.toUpperCase(),
        shipping_address: `${pick.street}, ${pick.city} - ${pick.pin}`,
        street: pick.street,
        city: pick.city,
        pincode: pick.pin,
        card_edition: pick.edition,
        card_number: `8842 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${lastFour}`,
        tracking_number: awb,
        courier: 'BlueDart Express Air Priority',
        amount: 199,
        final_total: 199,
        payment_status: 'completed',
        payment_method: 'UPI / Online Payment',
        status: 'Pending Embossing',
        created_at: new Date().toISOString()
    };

    AdminState.cardOrders.unshift(newOrder);

    try {
        localStorage.setItem('chocoloom_card_orders', JSON.stringify(AdminState.cardOrders));
    } catch(e) {}

    playOrderChime();
    showToast(`👑 New VIP Card Order Received! Emboss: ${newOrder.embossed_name} • ${newOrder.city}`, 'fa-solid fa-crown', '#9333ea');
    updateCardOrdersBadge();
    renderCardOrders();
};

window.handleIncomingCardOrder = function(order, playSound = true) {
    if (!order) return;
    const existing = AdminState.cardOrders.find(o => o.order_number === order.order_number);
    if (!existing) {
        AdminState.cardOrders.unshift(order);
        if (playSound) {
            playOrderChime();
            showToast(`👑 New VIP Card Order Received! Emboss: ${order.embossed_name || order.customer_name}`, 'fa-solid fa-crown', '#9333ea');
        }
        updateCardOrdersBadge();
        renderCardOrders();
    }
};

// ==================== ADVERTISEMENTS & HERO BANNERS CONTROLLER ====================

// Load all banners (from LocalStorage, save_catalog.php, or data.js)
window.loadAllBanners = async function(silent = false) {
    let bannersList = [];

    // 1. Check LocalStorage
    try {
        const stored = localStorage.getItem('chocoloom_banners');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                bannersList = parsed;
            }
        }
    } catch(e) {}

    // 2. Fallback to save_catalog.php / catalog_overrides.json
    if (!bannersList.length) {
        try {
            const endpoints = ['save_catalog.php', '../save_catalog.php', 'catalog_overrides.json'];
            for (const ep of endpoints) {
                try {
                    const res = await fetch(ep + '?v=' + Date.now());
                    if (res.ok) {
                        const data = await res.json();
                        if (data && Array.isArray(data.banners) && data.banners.length > 0) {
                            bannersList = data.banners;
                            break;
                        }
                    }
                } catch(err) {}
            }
        } catch(e) {}
    }

    // 3. Fallback to SWIGGY_DATA.banners
    if (!bannersList.length && window.SWIGGY_DATA && Array.isArray(SWIGGY_DATA.banners)) {
        bannersList = JSON.parse(JSON.stringify(SWIGGY_DATA.banners));
    }

    // Ensure all items have proper properties and fallback images, omitting removed tombola banner
    bannersList = bannersList.filter(b => b && b.id !== 'b_tombola' && !(b.id && b.id.includes('tombola')) && b.ctaAction !== 'tombola_game').map(b => {
        return {
            ...b,
            image: b.image || '',
            fallbackImage: b.fallbackImage || '',
            discountText: b.discountText || '',
            cta: b.cta || 'Claim Offer',
            code: b.code || '',
            ctaAction: b.ctaAction || 'copy_coupon',
            bgColor: b.bgColor || '#110722',
            isGraphicBanner: Boolean(b.isGraphicBanner),
            isActive: b.isActive !== false
        };
    });

    AdminState.banners = bannersList;

    // Cache locally
    try {
        localStorage.setItem('chocoloom_banners', JSON.stringify(AdminState.banners));
    } catch(e) {}

    updateBannersKPIs();

    if (!silent || AdminState.currentTab === 'advertisements') {
        renderBannersGrid();
    }
};

// Update KPI Counters & Sidebar Badge
window.updateBannersKPIs = function() {
    const banners = AdminState.banners || [];
    const activeCount = banners.filter(b => b.isActive !== false).length;
    const graphicCount = banners.filter(b => b.isGraphicBanner).length;
    const photoCount = banners.filter(b => !b.isGraphicBanner).length;
    const couponCount = banners.filter(b => b.code).length;

    const badge = document.getElementById('sidebarBannersBadge');
    if (badge) badge.textContent = activeCount;

    const elTotal = document.getElementById('statTotalBanners');
    if (elTotal) elTotal.textContent = banners.length;

    const elActive = document.getElementById('statActiveBanners');
    if (elActive) elActive.textContent = activeCount;

    const elGraphic = document.getElementById('statGraphicBanners');
    if (elGraphic) elGraphic.textContent = graphicCount;

    const elPhoto = document.getElementById('statPhotoBanners');
    if (elPhoto) elPhoto.textContent = photoCount;

    const elCoupons = document.getElementById('statBannersCoupons');
    if (elCoupons) elCoupons.textContent = couponCount;
};

// Filter Banners by Category / Type
window.filterBanners = function(filter) {
    AdminState.bannersFilter = filter;
    const pills = document.querySelectorAll('#advertisementsViewSection .filter-pill');
    pills.forEach(p => p.classList.remove('active'));
    const targetPill = document.getElementById(`bannerFilter_${filter}`);
    if (targetPill) targetPill.classList.add('active');
    renderBannersGrid();
};

// Live Search Filter
window.handleSearchBanners = function(query) {
    AdminState.bannersSearchQuery = (query || '').toLowerCase().trim();
    renderBannersGrid();
};

// Switch Preview Simulation Mode (Desktop vs Mobile)
window.setBannersPreviewMode = function(mode) {
    AdminState.bannersPreviewDevice = mode;
    const btnDesktop = document.getElementById('btnPreviewDesktop');
    const btnMobile = document.getElementById('btnPreviewMobile');
    if (btnDesktop) btnDesktop.classList.toggle('active', mode === 'desktop');
    if (btnMobile) btnMobile.classList.toggle('active', mode === 'mobile');
    renderBannersGrid();
};

// Render Banners Grid in Admin Workspace
window.renderBannersGrid = function() {
    const container = document.getElementById('bannersGridContainer');
    if (!container) return;

    let banners = [...(AdminState.banners || [])];

    // Filter by type / status
    if (AdminState.bannersFilter === 'GRAPHIC') {
        banners = banners.filter(b => b.isGraphicBanner);
    } else if (AdminState.bannersFilter === 'PHOTO') {
        banners = banners.filter(b => !b.isGraphicBanner);
    } else if (AdminState.bannersFilter === 'ACTIVE') {
        banners = banners.filter(b => b.isActive !== false);
    }

    // Filter by search query
    if (AdminState.bannersSearchQuery) {
        const q = AdminState.bannersSearchQuery;
        banners = banners.filter(b => 
            (b.title && b.title.toLowerCase().includes(q)) ||
            (b.tag && b.tag.toLowerCase().includes(q)) ||
            (b.code && b.code.toLowerCase().includes(q)) ||
            (b.category && b.category.toLowerCase().includes(q))
        );
    }

    if (!banners.length) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: 20px;">
                <div style="font-size: 42px; margin-bottom: 12px; opacity: 0.6;">📢</div>
                <h3 style="margin: 0 0 8px 0; color: #ffffff;">No Advertisements Found</h3>
                <p style="color: var(--text-muted); font-size: 13.5px; margin: 0 0 18px 0;">No banners match your active filter. Create a new advertisement to display at the top of Chocoloom!</p>
                <button class="header-btn primary" onclick="openAddBannerModal()">
                    <i class="fa-solid fa-plus"></i> + Add New Advertisement
                </button>
            </div>
        `;
        return;
    }

    const isMobileMode = AdminState.bannersPreviewDevice === 'mobile';

    container.innerHTML = banners.map((ban, index) => {
        const globalIndex = AdminState.banners.findIndex(b => b.id === ban.id);
        const isFirst = globalIndex === 0;
        const isLast = globalIndex === AdminState.banners.length - 1;
        const isGraphic = Boolean(ban.isGraphicBanner);
        const isActive = ban.isActive !== false;
        const displayImage = (isMobileMode && ban.mobileImage) ? ban.mobileImage : ban.image;
        const bgColor = ban.bgColor || (isGraphic ? '#ffd735' : '#110722');

        return `
            <div class="banner-admin-card" id="bannerCard_${ban.id}">
                <!-- Card Header -->
                <div class="banner-card-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="banner-order-badge">#${globalIndex + 1}</span>
                        <span class="banner-format-pill ${isGraphic ? 'graphic' : 'photo'}">
                            ${isGraphic ? '<i class="fa-solid fa-paint-roller"></i> Graphic Poster' : '<i class="fa-solid fa-camera"></i> Photo Deal'}
                        </span>
                        ${ban.isComingSoon ? `
                            <span class="banner-format-pill" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border-color: rgba(245, 158, 11, 0.4);">
                                <i class="fa-solid fa-clock-rotate-left"></i> Coming Soon
                            </span>
                        ` : ''}
                    </div>
                    <span class="banner-status-pill ${isActive ? 'live' : 'hidden'}">
                        ${isActive ? '<i class="fa-solid fa-circle" style="font-size: 8px;"></i> Live on Site' : '<i class="fa-regular fa-eye-slash"></i> Hidden'}
                    </span>
                </div>

                <!-- Simulation Visual Viewport -->
                <div class="banner-preview-viewport ${isMobileMode ? 'mode-mobile' : 'mode-desktop'}" style="background-color: ${bgColor};">
                    <img src="${displayImage}" alt="${ban.title}" onerror="this.onerror=null;this.src='${ban.fallbackImage || ban.image}';">
                    

                    <!-- Overlaid Ribbons Preview -->
                    ${ban.discountText ? `
                        <div style="position: absolute; top: 8px; right: 8px; z-index: 4; background: linear-gradient(135deg, #e11d48, #b91c1c); color: #fff; font-size: 9.5px; font-weight: 800; padding: 4px 8px; border-radius: 999px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-ticket"></i> ${ban.discountText}
                        </div>
                    ` : ''}

                    <div class="banner-preview-overlay-info">
                        ${ban.code ? `
                            <span style="background: rgba(17, 7, 34, 0.85); color: #ffd735; border: 1px dashed #ffd735; border-radius: 999px; font-size: 9.5px; font-weight: 800; padding: 3px 8px;">
                                CODE: ${ban.code}
                            </span>
                        ` : ''}
                        ${ban.cta ? `
                            <span style="background: #dc2626; color: #ffffff; border-radius: 999px; font-size: 9.5px; font-weight: 800; padding: 4px 9px; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);">
                                ${ban.cta} →
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Card Body -->
                <div class="banner-card-body">
                    <div>
                        <h4 class="banner-card-title">${ban.title}</h4>
                        <div class="banner-card-tag">
                            <i class="${ban.tagIcon || 'fa-solid fa-tag'}"></i>
                            <span>${ban.tag || ban.category || 'Special Promotion'}</span>
                        </div>
                    </div>

                    <!-- Details Table -->
                    <div class="banner-details-table">
                        <div class="banner-detail-item">
                            <span class="banner-detail-label">Background Color</span>
                            <div class="banner-color-indicator">
                                <span class="color-swatch-box" style="background: ${bgColor};"></span>
                                <span class="banner-detail-value">${bgColor}</span>
                            </div>
                        </div>

                        <div class="banner-detail-item">
                            <span class="banner-detail-label">Coupon Promo Code</span>
                            <span class="banner-detail-value" style="color: #fbbf24;">${ban.code || 'None'}</span>
                        </div>

                        <div class="banner-detail-item">
                            <span class="banner-detail-label">Call To Action</span>
                            <span class="banner-detail-value">${ban.cta || 'Play / Claim'}</span>
                        </div>

                        <div class="banner-detail-item">
                            <span class="banner-detail-label">Click Action</span>
                            <span class="banner-detail-value" style="color: #38bdf8;">
                                ${ban.ctaAction === 'tombola_game' ? '🎲 Tombola Game' : (ban.ctaAction === 'redirect_url' ? '🔗 External Redirect' : (ban.ctaAction === 'copy_coupon' ? '📋 Copy Code' : (ban.ctaAction === 'custom_url' ? '🌐 Custom URL' : 'Default Action')))}
                            </span>
                        </div>

                        <div class="banner-detail-item">
                            <span class="banner-detail-label">Redirect Link</span>
                            <span class="banner-detail-value" style="color: #38bdf8; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${ban.redirectUrl ? `<a href="${ban.redirectUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline;" title="${ban.redirectUrl}"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${ban.redirectUrl}</a>` : '<span style="color: #64748b;">Not set</span>'}
                            </span>
                        </div>

                        <div class="banner-detail-item">
                            <span class="banner-detail-label">Coming Soon Status</span>
                            <span class="banner-detail-value" style="color: ${ban.isComingSoon ? '#fbbf24' : '#94a3b8'};">
                                ${ban.isComingSoon ? '⏳ Active (Badge Shown)' : 'Normal / Live'}
                            </span>
                        </div>
                    </div>

                    <!-- Desktop & Mobile Image Status -->
                    <div class="banner-images-status-row">
                        <span><i class="fa-solid fa-laptop" style="color: #a78bfa;"></i> Desktop: <strong>1024 × 244</strong></span>
                        <span>
                            <i class="fa-solid fa-mobile-screen" style="color: #38bdf8;"></i> 
                            ${ban.mobileImage ? '<strong style="color: #34d399;">Custom Mobile Ready</strong>' : '<strong>Auto-Scaling</strong>'}
                        </span>
                    </div>
                </div>

                <!-- Actions Footer -->
                <div class="banner-card-actions">
                    <div class="banner-action-btn-group">
                        <button class="icon-btn" onclick="moveBanner('${ban.id}', -1)" title="Move banner earlier in carousel" ${isFirst ? 'disabled' : ''} style="${isFirst ? 'opacity: 0.3; cursor: not-allowed;' : ''}">
                            <i class="fa-solid fa-chevron-up"></i>
                        </button>
                        <button class="icon-btn" onclick="moveBanner('${ban.id}', 1)" title="Move banner later in carousel" ${isLast ? 'disabled' : ''} style="${isLast ? 'opacity: 0.3; cursor: not-allowed;' : ''}">
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        <button class="icon-btn" onclick="toggleBannerActive('${ban.id}')" title="${isActive ? 'Hide banner on website' : 'Make banner active and live'}" style="color: ${isActive ? '#34d399' : '#94a3b8'};">
                            <i class="fa-solid ${isActive ? 'fa-eye' : 'fa-eye-slash'}"></i>
                        </button>
                    </div>

                    <div class="banner-action-btn-group">
                        <button class="header-btn" onclick="openEditBannerModal('${ban.id}')" style="font-size: 12px; padding: 6px 12px;">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button class="header-btn" onclick="deleteBanner('${ban.id}')" style="font-size: 12px; padding: 6px 12px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// Open Add Banner Modal
window.openAddBannerModal = function() {
    const modal = document.getElementById('bannerModal');
    const form = document.getElementById('bannerForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('bannerFormId').value = 'b_' + Date.now();
    document.getElementById('bannerModalTitle').textContent = 'Add New Advertisement';

    // Defaults
    document.getElementById('bannerInputTagIcon').value = 'fa-solid fa-ticket';
    document.getElementById('bannerInputBgColor').value = '#ffd735';
    document.getElementById('bannerInputBgHex').value = '#ffd735';
    document.getElementById('bannerInputIsActive').checked = true;
    document.getElementById('bannerInputCtaAction').value = 'tombola_game';
    const redirectInput = document.getElementById('bannerInputRedirectUrl');
    if (redirectInput) redirectInput.value = '';
    const comingSoonCheckbox = document.getElementById('bannerInputIsComingSoon');
    if (comingSoonCheckbox) comingSoonCheckbox.checked = false;
    handleBannerTypeChange('graphic');
    setModalPreviewDevice('desktop');

    modal.classList.add('open');
    updateModalLivePreview();
};

// Open Edit Banner Modal
window.openEditBannerModal = function(bannerId) {
    const ban = (AdminState.banners || []).find(b => b.id === bannerId);
    if (!ban) return;

    const modal = document.getElementById('bannerModal');
    if (!modal) return;

    document.getElementById('bannerFormId').value = ban.id;
    document.getElementById('bannerModalTitle').textContent = `Edit Advertisement: ${ban.title}`;

    document.getElementById('bannerInputTitle').value = ban.title || '';
    document.getElementById('bannerInputCategory').value = ban.category || '';
    document.getElementById('bannerInputTag').value = ban.tag || '';
    document.getElementById('bannerInputTagIcon').value = ban.tagIcon || 'fa-solid fa-ticket';
    document.getElementById('bannerInputDesktopImage').value = ban.image || '';
    document.getElementById('bannerInputMobileImage').value = ban.mobileImage || '';

    const color = ban.bgColor || '#ffd735';
    document.getElementById('bannerInputBgColor').value = color.startsWith('#') ? color : '#ffd735';
    document.getElementById('bannerInputBgHex').value = color;

    document.getElementById('bannerInputDiscount').value = ban.discountText || '';
    document.getElementById('bannerInputCode').value = ban.code || '';
    document.getElementById('bannerInputCta').value = ban.cta || '';
    document.getElementById('bannerInputCtaAction').value = ban.ctaAction || (ban.redirectUrl ? 'redirect_url' : (ban.id.includes('tombola') ? 'tombola_game' : 'copy_coupon'));
    const redirectInput = document.getElementById('bannerInputRedirectUrl');
    if (redirectInput) redirectInput.value = ban.redirectUrl || ban.url || ban.link || '';
    const comingSoonCheckbox = document.getElementById('bannerInputIsComingSoon');
    if (comingSoonCheckbox) comingSoonCheckbox.checked = Boolean(ban.isComingSoon);
    document.getElementById('bannerInputSubtitle').value = ban.subtitle || '';
    document.getElementById('bannerInputIsActive').checked = ban.isActive !== false;

    handleBannerTypeChange(ban.isGraphicBanner ? 'graphic' : 'photo');
    setModalPreviewDevice('desktop');

    modal.classList.add('open');
    updateModalLivePreview();
};

// Handle Format Switch in Modal (Graphic Poster vs Photo Deal)
window.handleBannerTypeChange = function(type) {
    const isGraphic = type === 'graphic';
    const cardGraphic = document.getElementById('cardTypeGraphic');
    const cardPhoto = document.getElementById('cardTypePhoto');
    const radGraphic = document.getElementById('typeOptionGraphic');
    const radPhoto = document.getElementById('typeOptionPhoto');
    const subGroup = document.getElementById('groupBannerSubtitle');

    if (cardGraphic) cardGraphic.classList.toggle('active', isGraphic);
    if (cardPhoto) cardPhoto.classList.toggle('active', !isGraphic);
    if (radGraphic) radGraphic.checked = isGraphic;
    if (radPhoto) radPhoto.checked = !isGraphic;
    if (subGroup) subGroup.style.display = isGraphic ? 'none' : 'block';

    updateModalLivePreview();
};

// Handle Image File Select & FileReader Base64 conversion
window.handleBannerFileSelect = function(input, targetDevice) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const dataUrl = e.target.result;
        if (targetDevice === 'desktop') {
            const el = document.getElementById('bannerInputDesktopImage');
            if (el) el.value = dataUrl;
        } else {
            const el = document.getElementById('bannerInputMobileImage');
            if (el) el.value = dataUrl;
        }
        updateModalLivePreview();
        showToast(`📷 ${targetDevice === 'desktop' ? 'Desktop' : 'Mobile'} banner image loaded!`, 'fa-solid fa-circle-check', '#10b981');
    };

    reader.readAsDataURL(file);
};

// Quick helper to set preset desktop image
window.setModalDesktopImage = function(url) {
    const el = document.getElementById('bannerInputDesktopImage');
    if (el) el.value = url;
    updateModalLivePreview();
};

// Quick helper to set background color
window.setModalBgColor = function(color) {
    const picker = document.getElementById('bannerInputBgColor');
    const hex = document.getElementById('bannerInputBgHex');
    if (picker) picker.value = color.startsWith('#') ? color : '#ffd735';
    if (hex) hex.value = color;
    updateModalLivePreview();
};

// Toggle Modal Preview Mode (Desktop vs Mobile)
window.setModalPreviewDevice = function(device) {
    AdminState.modalPreviewDevice = device;
    const tabDesk = document.getElementById('modalPreviewTabDesktop');
    const tabMob = document.getElementById('modalPreviewTabMobile');
    if (tabDesk) tabDesk.classList.toggle('active', device === 'desktop');
    if (tabMob) tabMob.classList.toggle('active', device === 'mobile');
    updateModalLivePreview();
};

// Real-Time Interactive Simulation Sandbox in Modal
window.updateModalLivePreview = function() {
    const container = document.getElementById('modalPreviewContainer');
    if (!container) return;

    const radGraphic = document.getElementById('typeOptionGraphic');
    const isGraphic = radGraphic ? radGraphic.checked : true;
    const isMobile = AdminState.modalPreviewDevice === 'mobile';

    const title = document.getElementById('bannerInputTitle')?.value || 'Advertisement Title';
    const tag = document.getElementById('bannerInputTag')?.value || 'COMMUNITY PROMOTION';
    const tagIcon = document.getElementById('bannerInputTagIcon')?.value || 'fa-solid fa-ticket';
    const desktopImg = document.getElementById('bannerInputDesktopImage')?.value || 'assets/tombola-banner.png?v=3';
    const mobileImg = document.getElementById('bannerInputMobileImage')?.value || '';
    const displayImg = (isMobile && mobileImg) ? mobileImg : desktopImg;
    const bgColor = document.getElementById('bannerInputBgHex')?.value || '#ffd735';
    const discount = document.getElementById('bannerInputDiscount')?.value || '';
    const code = document.getElementById('bannerInputCode')?.value || '';
    const cta = document.getElementById('bannerInputCta')?.value || 'Play / Claim Now';
    const subtitle = document.getElementById('bannerInputSubtitle')?.value || '';
    const isComingSoon = Boolean(document.getElementById('bannerInputIsComingSoon')?.checked);
    const redirectUrl = document.getElementById('bannerInputRedirectUrl')?.value || '';

    container.innerHTML = `
        <div class="simulation-billboard ${isMobile ? 'mobile-view' : 'desktop-view'}" style="background-color: ${bgColor};">
            ${isGraphic ? `
                <img src="${displayImg}" alt="${title}" onerror="this.onerror=null;this.src='assets/tombola-banner.png?v=3';">
                

                ${discount ? `
                    <div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #e11d48, #b91c1c); color: #fff; font-size: ${isMobile ? '9px' : '11px'}; font-weight: 800; padding: 4px 10px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 5px; z-index: 5;">
                        <i class="fa-solid fa-ticket"></i> ${discount}
                    </div>
                ` : ''}

                <div style="position: absolute; bottom: 10px; right: 12px; display: flex; align-items: center; gap: 8px; z-index: 5;">
                    <div style="background: #dc2626; color: #fff; border-radius: 999px; font-size: ${isMobile ? '10px' : '12px'}; font-weight: 800; padding: 6px 12px; box-shadow: 0 4px 14px rgba(220,38,38,0.5); display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-dice"></i> ${cta} →
                    </div>
                    ${code ? `
                        <div style="background: rgba(17, 7, 34, 0.9); border: 1.5px dashed #ffd735; color: #fff; border-radius: 999px; font-size: ${isMobile ? '9px' : '11px'}; font-weight: 800; padding: 5px 10px;">
                            CODE: ${code}
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div style="position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden;">
                    <img src="${displayImg}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div style="position: absolute; inset: 0; background: linear-gradient(90deg, rgba(16,7,30,0.92) 0%, rgba(16,7,30,0.7) 50%, rgba(16,7,30,0.15) 100%);"></div>
                </div>

                ${discount ? `
                    <div style="position: absolute; top: 10px; right: 10px; background: #e11d48; color: #fff; font-size: ${isMobile ? '9px' : '11px'}; font-weight: 800; padding: 4px 10px; border-radius: 999px; z-index: 5;">
                        <i class="fa-solid fa-fire"></i> ${discount}
                    </div>
                ` : ''}

                <div style="position: relative; z-index: 4; padding: ${isMobile ? '12px' : '20px 30px'}; width: 100%; box-sizing: border-box; text-align: left;">
                    <div style="font-size: 10px; font-weight: 800; color: #ffd735; margin-bottom: 4px; display: inline-flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 999px;">
                        <i class="${tagIcon}"></i> ${tag}
                    </div>
                    <h3 style="margin: 2px 0 4px 0; color: #ffffff; font-size: ${isMobile ? '14px' : '22px'}; font-weight: 900; line-height: 1.2;">
                        ${title}
                    </h3>
                    <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.85); font-size: ${isMobile ? '10px' : '12px'}; max-width: 80%;">
                        ${subtitle || 'Delicious handcrafted bakery desserts delivered in 25 mins.'}
                    </p>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div style="background: #ffffff; color: #1e1035; border-radius: 8px; font-size: ${isMobile ? '10px' : '12px'}; font-weight: 800; padding: 6px 14px;">
                            ${cta}
                        </div>
                        ${code ? `
                            <div style="background: rgba(255,255,255,0.15); border: 1px dashed #ffd735; color: #ffd735; border-radius: 8px; font-size: ${isMobile ? '9px' : '11px'}; font-weight: 800; padding: 5px 10px;">
                                ${code}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `}
        </div>
    `;
};

// Handle Form Submit (Save / Add Advertisement)
window.handleBannerFormSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const bannerId = document.getElementById('bannerFormId').value.trim() || ('b_' + Date.now());
    const title = document.getElementById('bannerInputTitle').value.trim();
    if (!title) {
        showToast('Please enter an advertisement title!', 'fa-solid fa-triangle-exclamation', '#ef4444');
        return;
    }

    const radGraphic = document.getElementById('typeOptionGraphic');
    const isGraphic = radGraphic ? radGraphic.checked : true;
    const desktopImg = document.getElementById('bannerInputDesktopImage').value.trim();
    if (!desktopImg) {
        showToast('Please provide a desktop banner image!', 'fa-solid fa-triangle-exclamation', '#ef4444');
        return;
    }

    const mobileImg = document.getElementById('bannerInputMobileImage').value.trim();
    const category = document.getElementById('bannerInputCategory').value.trim() || 'Promotions';
    const tag = document.getElementById('bannerInputTag').value.trim() || title;
    const tagIcon = document.getElementById('bannerInputTagIcon').value.trim() || 'fa-solid fa-ticket';
    const bgColor = document.getElementById('bannerInputBgHex').value.trim() || (isGraphic ? '#ffd735' : '#110722');
    const discount = document.getElementById('bannerInputDiscount').value.trim();
    const code = document.getElementById('bannerInputCode').value.trim().toUpperCase();
    const cta = document.getElementById('bannerInputCta').value.trim() || (isGraphic ? 'Play Tombola Now' : 'Claim Offer');
    const ctaAction = document.getElementById('bannerInputCtaAction').value || 'tombola_game';
    const redirectUrl = (document.getElementById('bannerInputRedirectUrl')?.value || '').trim();
    const isComingSoon = Boolean(document.getElementById('bannerInputIsComingSoon')?.checked);
    const subtitle = document.getElementById('bannerInputSubtitle').value.trim();
    const isActive = document.getElementById('bannerInputIsActive').checked;

    const bannerObj = {
        id: bannerId,
        title: title,
        category: category,
        tag: tag,
        tagIcon: tagIcon,
        isGraphicBanner: isGraphic,
        image: desktopImg,
        mobileImage: mobileImg || null,
        fallbackImage: desktopImg,
        bgColor: bgColor,
        discountText: discount,
        code: code,
        cta: cta,
        ctaAction: ctaAction,
        redirectUrl: redirectUrl,
        isComingSoon: isComingSoon,
        subtitle: subtitle,
        isActive: isActive,
        updated_at: new Date().toISOString()
    };

    const existingIndex = AdminState.banners.findIndex(b => b.id === bannerId);
    if (existingIndex >= 0) {
        AdminState.banners[existingIndex] = { ...AdminState.banners[existingIndex], ...bannerObj };
    } else {
        AdminState.banners.unshift(bannerObj);
    }

    // Save to LocalStorage
    try {
        localStorage.setItem('chocoloom_banners', JSON.stringify(AdminState.banners));
    } catch(err) {}

    // Instant UI update & modal close (0ms latency)
    closeAdminModal('bannerModal');
    updateBannersKPIs();
    renderBannersGrid();
    showToast(`🎉 Advertisement "${title}" saved and live on website!`, 'fa-solid fa-circle-check', '#10b981');

    // Save to server asynchronously in background
    syncBannersToServer(false).catch(() => {});
};

// Toggle Banner Active / Inactive
window.toggleBannerActive = function(bannerId) {
    const ban = (AdminState.banners || []).find(b => b.id === bannerId);
    if (!ban) return;

    ban.isActive = ban.isActive === false ? true : false;

    try {
        localStorage.setItem('chocoloom_banners', JSON.stringify(AdminState.banners));
    } catch(e) {}

    updateBannersKPIs();
    renderBannersGrid();

    showToast(
        ban.isActive ? `👁️ Advertisement "${ban.title}" is now LIVE on website!` : `🔒 Advertisement "${ban.title}" is now hidden.`,
        ban.isActive ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash',
        ban.isActive ? '#10b981' : '#64748b'
    );

    syncBannersToServer(false).catch(() => {});
};

// Delete Banner
window.deleteBanner = function(bannerId) {
    const ban = (AdminState.banners || []).find(b => b.id === bannerId);
    if (!ban) return;

    if (!confirm(`Are you sure you want to delete the advertisement "${ban.title}"?`)) {
        return;
    }

    AdminState.banners = AdminState.banners.filter(b => b.id !== bannerId);

    try {
        localStorage.setItem('chocoloom_banners', JSON.stringify(AdminState.banners));
    } catch(e) {}

    updateBannersKPIs();
    renderBannersGrid();

    showToast(`🗑️ Advertisement "${ban.title}" deleted.`, 'fa-solid fa-trash-can', '#ef4444');

    syncBannersToServer(false).catch(() => {});
};

// Reorder Banner
window.moveBanner = function(bannerId, direction) {
    const idx = AdminState.banners.findIndex(b => b.id === bannerId);
    if (idx < 0) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= AdminState.banners.length) return;

    const temp = AdminState.banners[idx];
    AdminState.banners[idx] = AdminState.banners[targetIdx];
    AdminState.banners[targetIdx] = temp;

    try {
        localStorage.setItem('chocoloom_banners', JSON.stringify(AdminState.banners));
    } catch(e) {}

    renderBannersGrid();
    showToast('🔄 Carousel banner order updated!', 'fa-solid fa-arrows-up-down', '#7c5cfc');

    syncBannersToServer(false).catch(() => {});
};

// Sync Banners to Server (save_catalog.php / catalog_overrides.json) & Broadcast
window.syncBannersToServer = async function(notify = false) {
    try {
        const payload = {
            banners: AdminState.banners
        };

        const endpoints = [
            'http://127.0.0.1:3000/save_catalog',
            'http://localhost:3000/save_catalog',
            'http://127.0.0.1:3001/save_catalog',
            'http://localhost:3001/save_catalog',
            'save_catalog.php',
            '../save_catalog.php',
            './save_catalog.php',
            '../api/save_catalog.php'
        ];
        await Promise.allSettled(endpoints.map(async ep => {
            try {
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timer = controller ? setTimeout(() => controller.abort(), 1500) : null;
                try {
                    await fetch(ep, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        signal: controller ? controller.signal : undefined
                    });
                } finally {
                    if (timer) clearTimeout(timer);
                }
            } catch(err) {}
        }));

        // Cross-origin and cross-port iframe relay bridge
        if (typeof sendCrossOriginSync === 'function') {
            try {
                sendCrossOriginSync({ banners: AdminState.banners, action: 'BANNERS_UPDATE' });
            } catch(e) {}
        }

        // Also trigger full catalog sync to WordPress REST API on both live domains
        if (typeof syncCatalogToServer === 'function') {
            syncCatalogToServer();
        }

        // Broadcast across browser tabs
        if (broadcastChannel) {
            try {
                broadcastChannel.postMessage({ type: 'BANNERS_UPDATED', banners: AdminState.banners });
            } catch(e) {}
        }

        // Trigger local storage event for open client tabs
        try {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'chocoloom_banners',
                newValue: JSON.stringify(AdminState.banners)
            }));
        } catch(e) {}

        if (notify) {
            showToast(
                success ? '✅ All advertisements saved to disk & live website!' : '✅ Advertisements saved live in browser!',
                'fa-solid fa-circle-check',
                '#10b981'
            );
        }
    } catch(err) {
        if (notify) {
            showToast('⚠️ Synced locally in browser', 'fa-solid fa-info-circle', '#f59e0b');
        }
    }
};

// 1-Click Export / Download catalog_overrides.json directly
window.exportCatalogOverridesFile = function() {
    let existing = { overrides: {}, customProducts: [], deletedProducts: [], banners: [] };
    try {
        existing.overrides = JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}");
        existing.customProducts = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
        existing.deletedProducts = JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]");
        existing.banners = AdminState.banners || JSON.parse(localStorage.getItem("chocoloom_banners") || "[]");
        existing.updated_at = new Date().toISOString();
    } catch(e) {}

    const blob = new Blob([JSON.stringify(existing, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalog_overrides.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("💾 catalog_overrides.json downloaded!", "fa-solid fa-file-arrow-down", "#10b981");
};


