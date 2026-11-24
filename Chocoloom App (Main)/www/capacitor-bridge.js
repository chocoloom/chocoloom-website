/**
 * Chocoloom Android Native Bridge
 * Handles hardware back button, external intents (WhatsApp, phone, maps),
 * status bar styling, automatic device safe-area detection (notch & bottom nav),
 * and native app UX optimizations across all Android mobile phone devices.
 */
(function() {
    'use strict';

    console.log('[Chocoloom Native Bridge] Initialized.');

    // 1. Automatic Safe Area Insets Updater (Called from Native Android or Web probe)
    window.updateDeviceSafeAreas = function(top, bottom, left, right) {
        top = Math.max(0, parseInt(top, 10) || 0);
        bottom = Math.max(0, parseInt(bottom, 10) || 0);
        left = Math.max(0, parseInt(left, 10) || 0);
        right = Math.max(0, parseInt(right, 10) || 0);

        var root = document.documentElement;
        if (!root) return;

        root.style.setProperty('--safe-area-inset-top', top + 'px');
        root.style.setProperty('--safe-area-inset-bottom', bottom + 'px');
        root.style.setProperty('--safe-area-inset-left', left + 'px');
        root.style.setProperty('--safe-area-inset-right', right + 'px');
        root.style.setProperty('--device-bottom-nav-height', bottom + 'px');

        // Flag phones with 3-button navigation bar (typically >= 28px)
        var hasNavButtons = bottom >= 28;
        root.classList.toggle('has-nav-buttons', hasNavButtons);
        if (document.body) document.body.classList.toggle('has-nav-buttons', hasNavButtons);

        // Flag phones with notch / cutout (typically >= 28px)
        var hasNotch = top >= 28;
        root.classList.toggle('has-notch', hasNotch);
        if (document.body) document.body.classList.toggle('has-notch', hasNotch);

        console.log('[SafeAreas] Insets updated -> Top:', top, 'Bottom:', bottom, 'Left:', left, 'Right:', right, 'Buttons:', hasNavButtons);
    };

    // 2. Continuous Automatic Insets Verification (Fallback Engine)
    function autoDetectSafeAreas() {
        var envTop = 0;
        var envBottom = 0;

        // Probe CSS env() values
        try {
            var probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);';
            document.body.appendChild(probe);
            var cs = window.getComputedStyle(probe);
            envTop = parseInt(cs.paddingTop, 10) || 0;
            envBottom = parseInt(cs.paddingBottom, 10) || 0;
            document.body.removeChild(probe);
        } catch (e) {}

        var top = envTop;
        var bottom = envBottom;

        // If bottom is 0 on mobile, detect screen height vs innerHeight difference
        if (bottom === 0 && window.screen && window.screen.height) {
            var diff = Math.round(window.screen.height - window.innerHeight);
            // On Android with 3-button navigation, diff is ~48px (or 32px - 120px)
            if (diff >= 32 && diff <= 120) {
                bottom = diff;
            }
        }

        // On Capacitor native Android, default minimum status bar is 24px
        var isNative = document.documentElement.classList.contains('capacitor-native-app') || 
                       (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
        if (isNative && top < 24) {
            top = 28; // Standard Android status bar fallback
        }

        window.updateDeviceSafeAreas(top, bottom, 0, 0);
    }

    // Add native app class for CSS adjustments
    function applyNativeAppClass() {
        var isNative = (window.Capacitor && (typeof window.Capacitor.isNativePlatform === 'function' ? window.Capacitor.isNativePlatform() : true)) ||
                       window.location.protocol === 'capacitor:' ||
                       (window.location.hostname === 'localhost' && window.location.protocol === 'https:');
        if (isNative) {
            document.documentElement.classList.add('capacitor-native-app');
            if (document.body) {
                document.body.classList.add('capacitor-native-app');
            }
        }
    }
    applyNativeAppClass();

    document.addEventListener('DOMContentLoaded', function() {
        applyNativeAppClass();
        autoDetectSafeAreas();
    });

    window.addEventListener('resize', autoDetectSafeAreas);
    window.addEventListener('orientationchange', function() {
        setTimeout(autoDetectSafeAreas, 200);
    });

    // Hardware Back Button Handler
    document.addEventListener('ionBackButton', handleBackButton);
    window.addEventListener('popstate', function() {
        console.log('[Chocoloom] URL popstate event');
    });

    function handleBackButton(ev) {
        if (ev && ev.detail && ev.detail.register) {
            ev.detail.register(10, function() {
                processBackAction();
            });
        }
    }

    function processBackAction() {
        // 1. Close any open modals / bottom sheets / overlays first
        const openModalCloseBtn = document.querySelector('.modal.show .btn-close, .modal.active .btn-close, .cart-sheet.open .close-btn, .mobile-menu.open .close-btn, [data-dismiss="modal"]');
        if (openModalCloseBtn) {
            openModalCloseBtn.click();
            return;
        }

        // 2. If a category filter is currently active, return to all menu
        const categoryBackBtn = document.querySelector('.kids-back-btn, [onclick*="resetCategoryFilter"]');
        if (categoryBackBtn && typeof window.resetCategoryFilter === 'function') {
            window.resetCategoryFilter();
            return;
        }

        // 3. If search input is active, clear search
        const searchInput = document.querySelector('#searchInput, #headerSearchInput');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            searchInput.blur();
            if (typeof window.filterProducts === 'function') {
                window.filterProducts('');
            }
            return;
        }

        // 4. If browser has history, go back
        if (window.history.length > 1 && window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
            window.history.back();
            return;
        }

        // 5. If on home page, exit/minimize
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.exitApp();
        }
    }

    // Intercept clicks on external protocol links (tel:, mailto:, wa.me, whatsapp:)
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link || !link.href) return;

        const href = link.getAttribute('href') || link.href;
        if (href.startsWith('tel:') || href.startsWith('mailto:') || href.includes('wa.me') || href.includes('whatsapp://')) {
            // Let the system handle native intents
            console.log('[Chocoloom Native Bridge] Opening external intent:', href);
        }
    }, true);

    // If Capacitor App plugin is available, register native back button listener
    document.addEventListener('DOMContentLoaded', function() {
        if (window.Capacitor && window.Capacitor.Plugins) {
            const { App, StatusBar, SplashScreen } = window.Capacitor.Plugins;

            if (StatusBar) {
                try {
                    StatusBar.setOverlaysWebView({ overlay: true });
                    StatusBar.setStyle({ style: 'DARK' }); // Light icons/text on dark ad background
                } catch(e) {}
            }

            if (SplashScreen) {
                try {
                    setTimeout(() => SplashScreen.hide({ fadeOutDuration: 400 }), 500);
                } catch(e) {}
            }

            if (App) {
                App.addListener('backButton', function() {
                    processBackAction();
                });
            }
        }
    });
})();
