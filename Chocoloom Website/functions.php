<?php
/**
 * Chocoloom Theme & Admin Functions
 * Provides full WordPress REST API & AJAX persistence for Menu, Prices, Store Status, and Banners
 */

if (!defined('ABSPATH')) {
    exit;
}

// 0. Full Cross-Origin Resource Sharing (CORS) support for Admin & Website Sync across domains
add_action('init', function() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
    header("Access-Control-Allow-Origin: " . $origin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-WP-Nonce');
    if ($origin !== '*') {
        header('Access-Control-Allow-Credentials: true');
    }
    if ('OPTIONS' === ($_SERVER['REQUEST_METHOD'] ?? '')) {
        status_header(200);
        exit();
    }
});

// Prevent WordPress Canonical Redirect Loops in Customizer & iframe previews
add_action('template_redirect', function() {
    if (is_customize_preview() || isset($_GET['customize_theme']) || isset($_GET['customize_changeset_uuid'])) {
        remove_action('template_redirect', 'redirect_canonical');
    }
}, 1);


// 1. Theme Setup
function chocoloom_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption'));
}
add_action('after_setup_theme', 'chocoloom_theme_setup');

// 2. Script & Style Enqueue with Version Cache Busting
function chocoloom_enqueue_scripts() {
    $uri = untrailingslashit(get_template_directory_uri());
    $dir = untrailingslashit(get_template_directory());

    $theme_ver = file_exists($dir . '/styles.css') ? filemtime($dir . '/styles.css') : '3.3';
    $data_ver  = file_exists($dir . '/data.js') ? filemtime($dir . '/data.js') : '3.3';
    $app_ver   = file_exists($dir . '/app.js') ? filemtime($dir . '/app.js') : '3.3';
    $admin_ver = file_exists($dir . '/admin.js') ? filemtime($dir . '/admin.js') : '3.3';

    // Google Fonts: Plus Jakarta Sans
    wp_enqueue_style('google-font-jakarta', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap', array(), null);

    // FontAwesome
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css', array(), '6.5.1');

    // Main Stylesheets
    if (file_exists($dir . '/styles.css')) {
        wp_enqueue_style('chocoloom-main-style', $uri . '/styles.css', array(), $theme_ver);
    }
    if (file_exists($dir . '/style.css')) {
        wp_enqueue_style('chocoloom-wp-style', get_stylesheet_uri(), array(), $theme_ver);
    }

    // External SDKs & Providers
    wp_enqueue_script('razorpay-checkout', 'https://checkout.razorpay.com/v1/checkout.js', array(), null, true);
    wp_enqueue_script('supabase-js', 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', array(), null, true);

    // React 18 Runtime & Component Islands
    wp_enqueue_script('react', 'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js', array(), '18.2.0', true);
    wp_enqueue_script('react-dom', 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js', array('react'), '18.2.0', true);

    // Chocoloom Master Catalog & Logic
    if (file_exists($dir . '/data.js')) {
        wp_enqueue_script('chocoloom-data', $uri . '/data.js', array(), $data_ver, true);
    }
    if (file_exists($dir . '/react-components.js')) {
        $react_ver = filemtime($dir . '/react-components.js');
        wp_enqueue_script('chocoloom-react-components', $uri . '/react-components.js', array('react', 'react-dom', 'chocoloom-data'), $react_ver, true);
    }
    if (file_exists($dir . '/app.js')) {
        wp_enqueue_script('chocoloom-app', $uri . '/app.js', array('chocoloom-data', 'supabase-js'), $app_ver, true);
    }
    if (file_exists($dir . '/admin.js') && is_admin()) {
        wp_enqueue_script('chocoloom-admin-script', $uri . '/admin.js', array('chocoloom-data', 'supabase-js'), $admin_ver, true);
    }
    if (file_exists($dir . '/pwa.js')) {
        $pwa_ver = filemtime($dir . '/pwa.js');
        wp_enqueue_script('chocoloom-pwa', $uri . '/pwa.js', array(), $pwa_ver, true);
    }

    // Inject WordPress Configuration for Javascript
    $wp_config = chocoloom_get_wp_js_config();
    if (wp_script_is('chocoloom-app', 'registered') || wp_script_is('chocoloom-app', 'enqueued')) {
        wp_localize_script('chocoloom-app', 'CHOCOLOOM_WP_CONFIG', $wp_config);
    }
    if (wp_script_is('chocoloom-admin-script', 'registered') || wp_script_is('chocoloom-admin-script', 'enqueued')) {
        wp_localize_script('chocoloom-admin-script', 'CHOCOLOOM_WP_CONFIG', $wp_config);
    }
}
add_action('wp_enqueue_scripts', 'chocoloom_enqueue_scripts');

// 3. Page URL Helper for WordPress
function chocoloom_get_page_url($page_name = '') {
    $base = home_url('/');
    switch (strtolower(trim($page_name))) {
        case 'uni-chocoloom':
        case 'uni':
        case 'uni-chocoloom.html':
            return esc_url_raw(add_query_arg('page', 'uni-chocoloom', $base));
        case 'chocowallet':
        case 'wallet':
        case 'chocowallet.html':
            return esc_url_raw(add_query_arg('page', 'chocowallet', $base));
        case 'login':
        case 'login.html':
            return esc_url_raw(add_query_arg('page', 'login', $base));
        case 'landing':
        case 'landing.html':
            return esc_url_raw(add_query_arg('page', 'landing', $base));
        case 'order':
        case 'order.html':
        case 'home':
        default:
            return esc_url_raw($base);
    }
}

// 4. Centralized Javascript Config Provider
function chocoloom_get_wp_js_config() {
    $theme_uri = untrailingslashit(get_template_directory_uri());
    $home_url  = untrailingslashit(home_url('/'));
    return array(
        'isWordPress'        => true,
        'restUrl'            => esc_url_raw(rest_url('chocoloom/v1/catalog')),
        'storeStatusRestUrl' => esc_url_raw(rest_url('chocoloom/v1/store-status')),
        'ajaxUrl'            => esc_url_raw(admin_url('admin-ajax.php')),
        'themeUri'           => $theme_uri,
        'saveCatalogUrl'     => $theme_uri . '/save_catalog.php',
        'catalogJsonUrl'     => $theme_uri . '/catalog_overrides.json',
        'siteUrl'            => esc_url_raw(site_url()),
        'homeUrl'            => $home_url,
        'pages'              => array(
            'home'         => $home_url . '/',
            'order'        => $home_url . '/?page=order',
            'uniChocoloom' => $home_url . '/?page=uni-chocoloom',
            'chocowallet'  => $home_url . '/?page=chocowallet',
            'login'        => $home_url . '/?page=login',
            'landing'      => $home_url . '/?page=landing',
        ),
        'nonce'              => wp_create_nonce('wp_rest')
    );
}

// 5. Output window.CHOCOLOOM_WP_CONFIG early in head for both frontend and admin
function chocoloom_print_head_config() {
    $config_json = json_encode(chocoloom_get_wp_js_config());
    echo "<script>window.CHOCOLOOM_WP_CONFIG = {$config_json};</script>\n";
}
add_action('wp_head', 'chocoloom_print_head_config', 1);
add_action('admin_head', 'chocoloom_print_head_config', 1);

// 6. Seamless WordPress Route & Template Interceptor
function chocoloom_custom_template_redirect() {
    $req_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    $path = trim(parse_url($req_uri, PHP_URL_PATH), '/');
    $page_param = isset($_GET['page']) ? sanitize_key($_GET['page']) : '';
    $view_param = isset($_GET['view']) ? sanitize_key($_GET['view']) : '';
    $theme_dir = untrailingslashit(get_template_directory());

    if ($page_param === 'uni-chocoloom' || $view_param === 'uni-chocoloom' || preg_match('#(^|/)uni-chocoloom(\.html)?$#i', $path)) {
        if (file_exists($theme_dir . '/template-uni-chocoloom.php')) {
            include $theme_dir . '/template-uni-chocoloom.php';
            exit;
        }
    }

    if ($page_param === 'chocowallet' || $view_param === 'chocowallet' || preg_match('#(^|/)chocowallet(\.html)?$#i', $path)) {
        if (file_exists($theme_dir . '/template-chocowallet.php')) {
            include $theme_dir . '/template-chocowallet.php';
            exit;
        }
    }

    if ($page_param === 'login' || $view_param === 'login' || preg_match('#(^|/)login(\.html)?$#i', $path)) {
        if (file_exists($theme_dir . '/template-login.php')) {
            include $theme_dir . '/template-login.php';
            exit;
        }
    }

    if ($page_param === 'landing' || $view_param === 'landing' || preg_match('#(^|/)landing(\.html)?$#i', $path)) {
        if (file_exists($theme_dir . '/template-landing.php')) {
            include $theme_dir . '/template-landing.php';
            exit;
        }
    }

    if ($page_param === 'order' || $view_param === 'order' || preg_match('#(^|/)order(\.html)?$#i', $path)) {
        if (file_exists($theme_dir . '/index.php')) {
            include $theme_dir . '/index.php';
            exit;
        }
    }
}
add_action('template_redirect', 'chocoloom_custom_template_redirect');

// 5. Register WordPress REST API Endpoints (/wp-json/chocoloom/v1/catalog)
add_action('rest_api_init', function() {
    register_rest_route('chocoloom/v1', '/catalog', array(
        array(
            'methods'             => 'GET',
            'callback'            => 'chocoloom_rest_handle_get_catalog',
            'permission_callback' => '__return_true'
        ),
        array(
            'methods'             => 'POST',
            'callback'            => 'chocoloom_rest_handle_save_catalog',
            'permission_callback' => '__return_true'
        )
    ));

    register_rest_route('chocoloom/v1', '/store-status', array(
        array(
            'methods'             => 'GET',
            'callback'            => 'chocoloom_rest_handle_get_store_status',
            'permission_callback' => '__return_true'
        ),
        array(
            'methods'             => 'POST',
            'callback'            => 'chocoloom_rest_handle_save_store_status',
            'permission_callback' => '__return_true'
        )
    ));
});

// REST GET Handler
function chocoloom_rest_handle_get_catalog() {
    $catalog = get_option('chocoloom_catalog_overrides');
    if (!is_array($catalog)) {
        $json_file = get_template_directory() . '/catalog_overrides.json';
        if (file_exists($json_file)) {
            $catalog = json_decode(file_get_contents($json_file), true);
        }
    }
    if (!is_array($catalog)) {
        $catalog = array(
            'overrides'       => array(),
            'customProducts'  => array(),
            'deletedProducts' => array(),
            'banners'         => array(),
            'store_status'    => get_option('chocoloom_store_status', 'open')
        );
    }
    if (!isset($catalog['store_status'])) {
        $catalog['store_status'] = get_option('chocoloom_store_status', 'open');
    }

     = rest_ensure_response();
    ->header('Access-Control-Allow-Origin', '*');
    ->header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    ->header('Pragma', 'no-cache');
    ->header('Expires', '0');
    ->header('X-LiteSpeed-Cache-Control', 'no-cache');
    ->header('X-LiteSpeed-Tag', 'no-cache');
    return $response;
}

// REST POST Handler
function chocoloom_rest_handle_save_catalog(WP_REST_Request $request) {
    $payload = $request->get_json_params();
    if (empty($payload)) {
        $raw = $request->get_body();
        $payload = json_decode($raw, true);
    }
    if (empty($payload) && !empty($_POST)) {
        $payload = $_POST;
    }

    if (!is_array($payload)) {
        return new WP_Error('invalid_payload', 'Invalid JSON data provided', array('status' => 400));
    }

    $existing = get_option('chocoloom_catalog_overrides');
    if (!is_array($existing)) {
        $json_file = get_template_directory() . '/catalog_overrides.json';
        if (file_exists($json_file)) {
            $existing = json_decode(file_get_contents($json_file), true) ?: array();
        } else {
            $existing = array();
        }
    }

    $merged = array(
        'updated_at'      => current_time('c'),
        'overrides'       => array_merge(isset($existing['overrides']) && is_array($existing['overrides']) ? $existing['overrides'] : array(), isset($payload['overrides']) && is_array($payload['overrides']) ? $payload['overrides'] : array()),
        'customProducts'  => isset($payload['customProducts']) && is_array($payload['customProducts']) ? $payload['customProducts'] : (isset($existing['customProducts']) && is_array($existing['customProducts']) ? $existing['customProducts'] : array()),
        'deletedProducts' => array_values(array_unique(array_merge(isset($existing['deletedProducts']) && is_array($existing['deletedProducts']) ? $existing['deletedProducts'] : array(), isset($payload['deletedProducts']) && is_array($payload['deletedProducts']) ? $payload['deletedProducts'] : array()))),
        'banners'         => isset($payload['banners']) ? $payload['banners'] : (isset($existing['banners']) ? $existing['banners'] : array()),
        'store_status'    => isset($payload['store_status']) ? sanitize_text_field($payload['store_status']) : (isset($existing['store_status']) ? $existing['store_status'] : 'open')
    );

    // Save permanently in WordPress options table
    update_option('chocoloom_catalog_overrides', $merged, false);
    if (isset($payload['store_status'])) {
        update_option('chocoloom_store_status', sanitize_text_field($payload['store_status']), false);
    }

    // Also attempt writing to catalog_overrides.json
    $json_file = get_template_directory() . '/catalog_overrides.json';
    @file_put_contents($json_file, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

    $response = rest_ensure_response(array(
        'success' => true,
        'message' => 'Catalog synced successfully to WordPress database',
        'data'    => $merged
    ));
    $response->header('Access-Control-Allow-Origin', '*');
    return $response;
}

// REST Store Status Handlers
function chocoloom_rest_handle_get_store_status() {
    $status = get_option('chocoloom_store_status', 'open');
    $response = rest_ensure_response(array(
        'store_status' => $status,
        'isOpen'       => ($status !== 'closed')
    ));
    $response->header('Access-Control-Allow-Origin', '*');
    return $response;
}

function chocoloom_rest_handle_save_store_status(WP_REST_Request $request) {
    $params = $request->get_json_params() ?: json_decode($request->get_body(), true) ?: $_POST;
    $status = isset($params['store_status']) ? sanitize_text_field($params['store_status']) : (isset($params['status']) ? sanitize_text_field($params['status']) : 'open');
    update_option('chocoloom_store_status', $status, false);

    // Update in catalog overrides too
    $catalog = get_option('chocoloom_catalog_overrides');
    if (is_array($catalog)) {
        $catalog['store_status'] = $status;
        $catalog['updated_at'] = current_time('c');
        update_option('chocoloom_catalog_overrides', $catalog, false);
    }

    $response = rest_ensure_response(array(
        'success'      => true,
        'store_status' => $status,
        'isOpen'       => ($status !== 'closed')
    ));
    $response->header('Access-Control-Allow-Origin', '*');
    return $response;
}

// 6. WordPress AJAX Endpoints (admin-ajax.php fallback)
add_action('wp_ajax_chocoloom_save_catalog', 'chocoloom_ajax_save_catalog');
add_action('wp_ajax_nopriv_chocoloom_save_catalog', 'chocoloom_ajax_save_catalog');
function chocoloom_ajax_save_catalog() {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    if (empty($payload)) {
        wp_send_json_error(array('message' => 'Empty payload'));
    }

    $existing = get_option('chocoloom_catalog_overrides');
    if (!is_array($existing)) $existing = array();

    $merged = array(
        'updated_at'      => current_time('c'),
        'overrides'       => array_merge($existing['overrides'] ?? array(), $payload['overrides'] ?? array()),
        'customProducts'  => $payload['customProducts'] ?? ($existing['customProducts'] ?? array()),
        'deletedProducts' => array_values(array_unique(array_merge($existing['deletedProducts'] ?? array(), $payload['deletedProducts'] ?? array()))),
        'banners'         => $payload['banners'] ?? ($existing['banners'] ?? array()),
        'store_status'    => $payload['store_status'] ?? ($existing['store_status'] ?? 'open')
    );

    update_option('chocoloom_catalog_overrides', $merged, false);
    if (isset($payload['store_status'])) {
        update_option('chocoloom_store_status', sanitize_text_field($payload['store_status']), false);
    }
    @file_put_contents(get_template_directory() . '/catalog_overrides.json', json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    wp_send_json_success(array('data' => $merged));
}

add_action('wp_ajax_chocoloom_get_catalog', 'chocoloom_ajax_get_catalog');
add_action('wp_ajax_nopriv_chocoloom_get_catalog', 'chocoloom_ajax_get_catalog');
function chocoloom_ajax_get_catalog() {
    $catalog = get_option('chocoloom_catalog_overrides');
    if (!is_array($catalog)) {
        $json_file = get_template_directory() . '/catalog_overrides.json';
        if (file_exists($json_file)) {
            $catalog = json_decode(file_get_contents($json_file), true);
        }
    }
    if (!is_array($catalog)) {
        $catalog = array(
            'overrides'       => array(),
            'customProducts'  => array(),
            'deletedProducts' => array(),
            'banners'         => array(),
            'store_status'    => get_option('chocoloom_store_status', 'open')
        );
    }
    wp_send_json($catalog);
}
