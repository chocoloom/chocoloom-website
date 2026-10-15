<?php
/**
 * Plugin Name: Chocoloom Admin Panel
 * Plugin URI: https://chocoloom.com
 * Description: Order & Menu Management Admin Dashboard for Chocoloom Bakery with Cloud & REST API Sync.
 * Version: 2.0.0
 * Author: Chocoloom
 * Author URI: https://chocoloom.com
 * License: GPL-2.0+
 * Text Domain: chocoloom-admin
 */

if (!defined('ABSPATH')) {
    exit;
}

// 1. Centralized WordPress JS Config Provider
function chocoloom_plugin_get_js_config() {
    $plugin_url = untrailingslashit(plugin_dir_url(__FILE__));
    return array(
        'isWordPress'        => true,
        'restUrl'            => esc_url_raw(rest_url('chocoloom/v1/catalog')),
        'storeStatusRestUrl' => esc_url_raw(rest_url('chocoloom/v1/store-status')),
        'ajaxUrl'            => esc_url_raw(admin_url('admin-ajax.php')),
        'pluginUri'          => $plugin_url,
        'saveCatalogUrl'     => $plugin_url . '/save_catalog.php',
        'catalogJsonUrl'     => $plugin_url . '/catalog_overrides.json',
        'siteUrl'            => esc_url_raw(site_url()),
        'homeUrl'            => esc_url_raw(home_url('/')),
        'nonce'              => wp_create_nonce('wp_rest')
    );
}

// 2. Output window.CHOCOLOOM_WP_CONFIG in Admin Head
add_action('admin_head', function() {
    $config_json = json_encode(chocoloom_plugin_get_js_config());
    echo "<script>window.CHOCOLOOM_WP_CONFIG = {$config_json};</script>\n";
}, 1);

// 3. Register Admin Menu
add_action('admin_menu', function() {
    add_menu_page(
        'Chocoloom Admin',
        'Chocoloom Admin',
        'manage_options',
        'chocoloom-admin',
        'chocoloom_render_admin_dashboard',
        'dashicons-store',
        30
    );
});

function chocoloom_render_admin_dashboard() {
    $plugin_url = untrailingslashit(plugin_dir_url(__FILE__));
    $url = $plugin_url . '/index.html';
    $config_json = json_encode(chocoloom_plugin_get_js_config());
    ?>
    <script>
        window.CHOCOLOOM_WP_CONFIG = <?php echo $config_json; ?>;
    </script>
    <div class="wrap" style="margin: 0; padding: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #ffffff; border-bottom: 1px solid #e2e8f0; margin-bottom: 12px; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🎂</span>
                <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; display: inline-block;">Chocoloom Management Dashboard</h1>
            </div>
            <a href="<?php echo esc_url($url); ?>" target="_blank" class="button button-primary" style="background: #e11d48; border-color: #be123c;">
                Launch Fullscreen &#x2197;
            </a>
        </div>
        <iframe id="chocoloomAdminFrame" src="<?php echo esc_url($url); ?>" style="width: 100%; height: calc(100vh - 140px); border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); background: #f8fafc;"></iframe>
    </div>
    <script>
        // Forward configuration into iframe upon load
        var iframe = document.getElementById('chocoloomAdminFrame');
        if (iframe) {
            iframe.addEventListener('load', function() {
                try {
                    iframe.contentWindow.CHOCOLOOM_WP_CONFIG = window.CHOCOLOOM_WP_CONFIG;
                } catch(e) {}
            });
        }
    </script>
    <?php
}

// 4. Register WordPress REST API Endpoints (/wp-json/chocoloom/v1/catalog)
add_action('rest_api_init', function() {
    register_rest_route('chocoloom/v1', '/catalog', array(
        array(
            'methods'             => 'GET',
            'callback'            => 'chocoloom_plugin_rest_get_catalog',
            'permission_callback' => '__return_true'
        ),
        array(
            'methods'             => 'POST',
            'callback'            => 'chocoloom_plugin_rest_save_catalog',
            'permission_callback' => '__return_true'
        )
    ));

    register_rest_route('chocoloom/v1', '/store-status', array(
        array(
            'methods'             => 'GET',
            'callback'            => 'chocoloom_plugin_rest_get_store_status',
            'permission_callback' => '__return_true'
        ),
        array(
            'methods'             => 'POST',
            'callback'            => 'chocoloom_plugin_rest_save_store_status',
            'permission_callback' => '__return_true'
        )
    ));
});

function chocoloom_plugin_rest_get_catalog() {
    $catalog = get_option('chocoloom_catalog_overrides');
    if (!is_array($catalog)) {
        $json_file = plugin_dir_path(__FILE__) . 'catalog_overrides.json';
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

    $response = rest_ensure_response($catalog);
    $response->header('Access-Control-Allow-Origin', '*');
    $response->header('Cache-Control', 'no-cache, must-revalidate, max-age=0');
    return $response;
}

function chocoloom_plugin_rest_save_catalog(WP_REST_Request $request) {
    $payload = $request->get_json_params();
    if (empty($payload)) {
        $payload = json_decode($request->get_body(), true) ?: $_POST;
    }

    if (!is_array($payload)) {
        return new WP_Error('invalid_payload', 'Invalid JSON data provided', array('status' => 400));
    }

    $existing = get_option('chocoloom_catalog_overrides');
    if (!is_array($existing)) {
        $json_file = plugin_dir_path(__FILE__) . 'catalog_overrides.json';
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

    update_option('chocoloom_catalog_overrides', $merged, false);
    if (isset($payload['store_status'])) {
        update_option('chocoloom_store_status', sanitize_text_field($payload['store_status']), false);
    }

    $json_file = plugin_dir_path(__FILE__) . 'catalog_overrides.json';
    @file_put_contents($json_file, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

    $response = rest_ensure_response(array(
        'success' => true,
        'message' => 'Catalog synced successfully via Chocoloom Plugin',
        'data'    => $merged
    ));
    $response->header('Access-Control-Allow-Origin', '*');
    return $response;
}

function chocoloom_plugin_rest_get_store_status() {
    $status = get_option('chocoloom_store_status', 'open');
    $response = rest_ensure_response(array(
        'store_status' => $status,
        'isOpen'       => ($status !== 'closed')
    ));
    $response->header('Access-Control-Allow-Origin', '*');
    return $response;
}

function chocoloom_plugin_rest_save_store_status(WP_REST_Request $request) {
    $params = $request->get_json_params() ?: json_decode($request->get_body(), true) ?: $_POST;
    $status = isset($params['store_status']) ? sanitize_text_field($params['store_status']) : (isset($params['status']) ? sanitize_text_field($params['status']) : 'open');
    update_option('chocoloom_store_status', $status, false);

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

// 5. AJAX Endpoints
add_action('wp_ajax_chocoloom_save_catalog', 'chocoloom_plugin_ajax_save_catalog');
add_action('wp_ajax_nopriv_chocoloom_save_catalog', 'chocoloom_plugin_ajax_save_catalog');
function chocoloom_plugin_ajax_save_catalog() {
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
    @file_put_contents(plugin_dir_path(__FILE__) . 'catalog_overrides.json', json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    wp_send_json_success(array('data' => $merged));
}

add_action('wp_ajax_chocoloom_get_catalog', 'chocoloom_plugin_ajax_get_catalog');
add_action('wp_ajax_nopriv_chocoloom_get_catalog', 'chocoloom_plugin_ajax_get_catalog');
function chocoloom_plugin_ajax_get_catalog() {
    $catalog = get_option('chocoloom_catalog_overrides');
    if (!is_array($catalog)) {
        $json_file = plugin_dir_path(__FILE__) . 'catalog_overrides.json';
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
