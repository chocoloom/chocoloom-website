/**
 * Chocoloom Progressive Web App (PWA) & Zoom Optimization Controller
 * Provides Chrome App Installability (beforeinstallprompt, manifest, sw.js)
 * and seamless pinch-to-zoom accessibility across all devices.
 */

(function () {
    'use strict';

    // 1. Double check and enforce zoomability programmatically
    function ensureZoomEnabled() {
        let metaViewport = document.querySelector('meta[name="viewport"]');
        if (!metaViewport) {
            metaViewport = document.createElement('meta');
            metaViewport.name = 'viewport';
            document.head.appendChild(metaViewport);
        }
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureZoomEnabled);
    } else {
        ensureZoomEnabled();
    }

    // 2. Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Determine relative root path
            const swPath = './sw.js';
            navigator.serviceWorker.register(swPath)
                .then((registration) => {
                    console.log('[Chocoloom PWA] Service Worker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    console.warn('[Chocoloom PWA] Service Worker registration failed:', error);
                });
        });
    }

    // 3. Chrome PWA Install Prompt Management
    let deferredInstallPrompt = null;
    let isAppAlreadyInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default mini-infobar in older Chrome
        e.preventDefault();
        deferredInstallPrompt = e;
        console.log('[Chocoloom PWA] Captured beforeinstallprompt event!');

        // Dispatch event for UI components that want to show install buttons
        window.dispatchEvent(new CustomEvent('chocoloom-install-available'));

        // Show subtle install banner if not dismissed recently
        const dismissedTime = localStorage.getItem('chocoloom_pwa_dismissed');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (!dismissedTime || (now - parseInt(dismissedTime, 10)) > oneDay) {
            setTimeout(showInstallBanner, 2000);
        }
    });

    // Global trigger function to prompt app installation
    window.installChocoloomApp = async function () {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            console.log('[Chocoloom PWA] Install prompt outcome:', outcome);
            if (outcome === 'accepted') {
                hideInstallBanner();
            }
            deferredInstallPrompt = null;
        } else {
            // If already installed or on iOS/desktop where prompt isn't directly invocable
            if (isAppAlreadyInstalled) {
                showToastMessage('✨ Chocoloom is already installed on your device!');
                return;
            }

            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIOS) {
                showToastMessage('📱 Tap the Share button in Safari, then tap "Add to Home Screen"');
            } else {
                showToastMessage('📱 Tap Chrome menu (⋮) at top right and choose "Install app"');
            }
        }
    };

    // App installed event listener
    window.addEventListener('appinstalled', () => {
        console.log('[Chocoloom PWA] Chocoloom app successfully installed!');
        deferredInstallPrompt = null;
        isAppAlreadyInstalled = true;
        hideInstallBanner();
        showToastMessage('🎉 Chocoloom App installed! Launch it from your home screen or apps list.');
    });

    // 4. Subtle Floating Install Banner UI
    function showInstallBanner() {
        if (isAppAlreadyInstalled || document.getElementById('chocoloomPwaInstallBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'chocoloomPwaInstallBanner';
        banner.className = 'chocoloom-pwa-banner';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <img src="assets/icons/icon-192x192.png" alt="Chocoloom App" class="pwa-banner-icon">
                <div class="pwa-banner-text">
                    <span class="pwa-banner-title">Install Chocoloom App</span>
                    <span class="pwa-banner-desc">Lightning-fast ordering & exclusive app rewards</span>
                </div>
                <div class="pwa-banner-actions">
                    <button type="button" class="pwa-install-btn" id="pwaTriggerInstallBtn">
                        <i class="fa-solid fa-download"></i> Install
                    </button>
                    <button type="button" class="pwa-close-btn" id="pwaDismissBannerBtn" aria-label="Close">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Bind clicks
        document.getElementById('pwaTriggerInstallBtn').addEventListener('click', () => {
            window.installChocoloomApp();
        });

        document.getElementById('pwaDismissBannerBtn').addEventListener('click', () => {
            hideInstallBanner();
            localStorage.setItem('chocoloom_pwa_dismissed', Date.now().toString());
        });

        // Trigger entrance animation
        setTimeout(() => {
            banner.classList.add('visible');
        }, 50);
    }

    function hideInstallBanner() {
        const banner = document.getElementById('chocoloomPwaInstallBanner');
        if (banner) {
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 400);
        }
    }

    function showToastMessage(msg) {
        let toast = document.getElementById('chocoloomPwaToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'chocoloomPwaToast';
            toast.className = 'chocoloom-pwa-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Expose helpers globally
    window.ChocoloomPWA = {
        install: window.installChocoloomApp,
        isInstalled: () => isAppAlreadyInstalled
    };
})();
