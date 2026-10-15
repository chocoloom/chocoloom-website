<?php
/**
 * Chocoloom Catalog Sync API
 * Bridges Admin Panel price & option updates with the Main Website
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Detect and bootstrap WordPress environment if available
if (!defined('ABSPATH')) {
    $wp_load_paths = [
        __DIR__ . '/../../../wp-load.php',      // wp-content/themes/<theme>/save_catalog.php
        __DIR__ . '/../../../../wp-load.php',   // wp-content/plugins/<plugin>/save_catalog.php
        __DIR__ . '/../../wp-load.php',
        dirname(__DIR__, 2) . '/wp-load.php',
        dirname(__DIR__, 3) . '/wp-load.php',
        dirname(__DIR__, 4) . '/wp-load.php',
        isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/wp-load.php' : ''
    ];
    foreach ($wp_load_paths as $wPath) {
        if (!empty($wPath) && file_exists($wPath)) {
            @include_once $wPath;
            break;
        }
    }
}

$dataFile = __DIR__ . '/catalog_overrides.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Direct Multipart Form File Upload
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadsDir = __DIR__ . '/uploads';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0777, true);
        }
        $origName = $_FILES['image']['name'];
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])) {
            $ext = 'jpg';
        }
        $filename = 'product_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 8) . '.' . $ext;
        $dest = $uploadsDir . '/' . $filename;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $dest)) {
            $baseUrl = 'uploads/' . $filename;
            if (function_exists('get_template_directory_uri')) {
                $baseUrl = rtrim(get_template_directory_uri(), '/') . '/uploads/' . $filename;
            } elseif (function_exists('plugin_dir_url')) {
                $baseUrl = rtrim(plugin_dir_url(__FILE__), '/') . '/uploads/' . $filename;
            }
            echo json_encode([
                'success' => true,
                'url' => $baseUrl,
                'filename' => $filename
            ]);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save uploaded file']);
            exit;
        }
    }

    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!$payload && !empty($_POST)) {
        $payload = $_POST;
    }

    // 2. Base64 Upload Action via JSON
    if ($payload && isset($payload['action']) && $payload['action'] === 'upload_image' && !empty($payload['data'])) {
        $uploadsDir = __DIR__ . '/uploads';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0777, true);
        }
        $dataStr = $payload['data'];
        $ext = 'jpg';
        if (preg_match('/^data:image\/(\w+);base64,/', $dataStr, $type)) {
            $dataStr = substr($dataStr, strpos($dataStr, ',') + 1);
            $ext = strtolower($type[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
        }
        $decoded = base64_decode($dataStr);
        if ($decoded !== false) {
            $filename = 'product_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 8) . '.' . $ext;
            $dest = $uploadsDir . '/' . $filename;
            if (file_put_contents($dest, $decoded)) {
                $baseUrl = 'uploads/' . $filename;
                if (function_exists('get_template_directory_uri')) {
                    $baseUrl = rtrim(get_template_directory_uri(), '/') . '/uploads/' . $filename;
                } elseif (function_exists('plugin_dir_url')) {
                    $baseUrl = rtrim(plugin_dir_url(__FILE__), '/') . '/uploads/' . $filename;
                }
                echo json_encode([
                    'success' => true,
                    'url' => $baseUrl,
                    'filename' => $filename
                ]);
                exit;
            }
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to decode or write image']);
        exit;
    }

    if (!$payload || !is_array($payload)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
        exit;
    }

    $existing = [];
    if (function_exists('get_option')) {
        $wpOpt = get_option('chocoloom_catalog_overrides');
        if (is_array($wpOpt)) $existing = $wpOpt;
    }
    if (empty($existing) && file_exists($dataFile)) {
        $existing = json_decode(file_get_contents($dataFile), true) ?: [];
    }

    $merged = [
        'updated_at' => date('c'),
        'overrides' => array_merge($existing['overrides'] ?? [], $payload['overrides'] ?? []),
        'customProducts' => $payload['customProducts'] ?? ($existing['customProducts'] ?? []),
        'deletedProducts' => array_values(array_unique(array_merge($existing['deletedProducts'] ?? [], $payload['deletedProducts'] ?? []))),
        'banners' => isset($payload['banners']) ? $payload['banners'] : ($existing['banners'] ?? []),
        'store_status' => isset($payload['store_status']) ? $payload['store_status'] : ($existing['store_status'] ?? 'open')
    ];

    $savedToWp = false;
    if (function_exists('update_option')) {
        update_option('chocoloom_catalog_overrides', $merged, false);
        if (isset($payload['store_status'])) {
            update_option('chocoloom_store_status', sanitize_text_field($payload['store_status']), false);
        }
        $savedToWp = true;
    }

    $savedToFile = @file_put_contents($dataFile, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

    if ($savedToWp || $savedToFile !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'Catalog synced successfully' . ($savedToWp ? ' (WordPress DB + JSON)' : ' (JSON file)'),
            'data' => $merged
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to write catalog file and WordPress options unavailable']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (function_exists('get_option')) {
        $wpData = get_option('chocoloom_catalog_overrides');
        if (is_array($wpData) && (!empty($wpData['overrides']) || !empty($wpData['customProducts']) || !empty($wpData['deletedProducts']) || !empty($wpData['banners']))) {
            if (!isset($wpData['store_status'])) {
                $wpData['store_status'] = get_option('chocoloom_store_status', 'open');
            }
            echo json_encode($wpData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        echo $content ?: json_encode(['overrides' => [], 'customProducts' => [], 'deletedProducts' => [], 'banners' => [], 'store_status' => 'open']);
    } else {
        echo json_encode(['overrides' => [], 'customProducts' => [], 'deletedProducts' => [], 'banners' => [], 'store_status' => 'open']);
    }
    exit;
}
