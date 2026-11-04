/**
 * Chocoloom Premium Festive Quick-Commerce Theme Controller
 * Powers the luxury Blinkit/Zepto-inspired UI/UX experience
 */

(function() {
    'use strict';

    // 1. Theme Configuration & Persistence
    const THEME_KEY = 'chocoloom_theme_mode';
    const DEFAULT_THEME = 'festive-royal';

    function getActiveTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
        } catch(e) {
            return DEFAULT_THEME;
        }
    }

    function applyTheme(themeName) {
        document.documentElement.classList.remove('theme-festive-royal', 'theme-luxe-dark', 'theme-classic-light');
        document.body.classList.remove('theme-festive-royal', 'theme-luxe-dark', 'theme-classic-light');

        if (themeName === 'festive-royal') {
            document.documentElement.classList.add('theme-festive-royal');
            document.body.classList.add('theme-festive-royal');
        } else if (themeName === 'luxe-dark') {
            document.documentElement.classList.add('theme-luxe-dark');
            document.body.classList.add('theme-luxe-dark');
        } else {
            document.documentElement.classList.add('theme-classic-light');
            document.body.classList.add('theme-classic-light');
        }

        try {
            localStorage.setItem(THEME_KEY, themeName);
        } catch(e) {}
    }

    // Apply immediately to prevent white flash
    applyTheme(getActiveTheme());

    // 2. Garland String Lights Generator
    function renderFestiveGarland() {
        const container = document.getElementById('festiveGarlandWrapper');
        if (!container) return;

        const bulbColors = ['#facc15', '#fbbf24', '#f59e0b', '#38bdf8', '#f43f5e', '#a855f7'];
        let bulbsSvg = `
            <svg class="festive-garland-svg" viewBox="0 0 1200 32" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,4 Q100,20 200,4 Q300,20 400,4 Q500,20 600,4 Q700,20 800,4 Q900,20 1000,4 Q1100,20 1200,4" fill="none" stroke="rgba(250, 204, 21, 0.4)" stroke-width="1.2" stroke-dasharray="3,3"/>
        `;

        // Generate glowing bulbs along the curve
        for (let i = 20; i < 1200; i += 38) {
            const y = 8 + Math.sin(i / 32) * 8;
            const col = bulbColors[Math.floor(Math.random() * bulbColors.length)];
            bulbsSvg += `
                <g class="festive-bulb" style="animation-delay: ${(i % 7) * 0.25}s">
                    <line x1="${i}" y1="${y - 4}" x2="${i}" y2="${y}" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
                    <circle cx="${i}" cy="${y + 2}" r="3.2" fill="${col}" filter="drop-shadow(0 0 3px ${col})"/>
                </g>
            `;
        }

        bulbsSvg += `</svg>`;
        container.innerHTML = bulbsSvg;
    }

    // 3. Dynamic Cycling Search Placeholder
    const SEARCH_PLACEHOLDERS = [
        'diwali celebration cakes',
        'belgian dark truffles',
        'artisan bento cakes',
        'diwali gift hampers',
        'chilled cooling cakes',
        'snacks & munchies',
        'chocolate fudge tub',
        'custom step cakes'
    ];

    let currentPlaceholderIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typingTimer = null;

    function tickTypewriter() {
        const input = document.getElementById('festiveSearchInput');
        if (!input) return;

        // Pause if user is currently typing
        if (document.activeElement === input && input.value.trim().length > 0) {
            typingTimer = setTimeout(tickTypewriter, 2000);
            return;
        }

        const fullText = SEARCH_PLACEHOLDERS[currentPlaceholderIdx];

        if (isDeleting) {
            charIdx--;
            input.setAttribute('placeholder', `Search "${fullText.substring(0, charIdx)}"`);
            if (charIdx === 0) {
                isDeleting = false;
                currentPlaceholderIdx = (currentPlaceholderIdx + 1) % SEARCH_PLACEHOLDERS.length;
                typingTimer = setTimeout(tickTypewriter, 500);
                return;
            }
            typingTimer = setTimeout(tickTypewriter, 40);
        } else {
            charIdx++;
            input.setAttribute('placeholder', `Search "${fullText.substring(0, charIdx)}"`);
            if (charIdx === fullText.length) {
                isDeleting = true;
                typingTimer = setTimeout(tickTypewriter, 2200);
                return;
            }
            typingTimer = setTimeout(tickTypewriter, 80);
        }
    }

    // 4. Voice Search Mic Handler
    window.handleFestiveVoiceSearch = function(e) {
        if (e) e.stopPropagation();
        const input = document.getElementById('festiveSearchInput');
        if (!input) return;

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            try {
                const rec = new SpeechRec();
                rec.lang = 'en-IN';
                rec.interimResults = false;
                rec.maxAlternatives = 1;

                if (typeof showToast === 'function') {
                    showToast('🎙️ Listening... Speak your favorite cake or dessert!', 'fa-solid fa-microphone', '#0284c7');
                }

                rec.onresult = function(event) {
                    const transcript = event.results[0][0].transcript;
                    if (transcript) {
                        input.value = transcript;
                        handleFestiveSearchSubmit(transcript);
                    }
                };
                rec.onerror = function() {
                    input.focus();
                };
                rec.start();
                return;
            } catch(err) {}
        }

        // Fallback: focus input and open search
        input.focus();
    };

    // 5. Search Submission & Catalog Filter Trigger
    window.handleFestiveSearchSubmit = function(query) {
        const q = (typeof query === 'string' ? query : (document.getElementById('festiveSearchInput')?.value || '')).trim();
        if (typeof AppState !== 'undefined') {
            AppState.searchQuery = q;
            if (typeof renderProductsGrid === 'function') renderProductsGrid();
        }
        // Scroll smoothly to catalog
        const catEl = document.getElementById('productsCatalogSection') || document.getElementById('productsGrid');
        if (catEl) {
            catEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // 6. Interactive Theme Switcher Modal / Cycle
    window.openThemeSwitcherModal = function() {
        let modal = document.getElementById('festiveThemeModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'festiveThemeModal';
            modal.className = 'festive-theme-modal-overlay';
            modal.onclick = function(e) {
                if (e.target === modal) window.closeThemeSwitcherModal();
            };
            document.body.appendChild(modal);
        }

        const active = getActiveTheme();

        modal.innerHTML = `
            <div class="festive-theme-modal-card">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #facc15; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Switch Store Theme
                    </h3>
                    <button type="button" onclick="closeThemeSwitcherModal()" style="color: #94a3b8; font-size: 18px; cursor: pointer; padding: 4px;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <p style="margin: 0 0 16px; font-size: 12.5px; color: #cbd5e1; line-height: 1.4;">
                    Personalize your Chocoloom shopping experience with instant luxury themes.
                </p>

                <div class="festive-theme-options-grid">
                    <div class="festive-theme-option-card ${active === 'festive-royal' ? 'active' : ''}" onclick="selectThemeMode('festive-royal')">
                        <div class="festive-theme-preview-dot" style="background: radial-gradient(circle, #0f336c 0%, #06152d 100%); border: 2px solid #facc15;">
                            🪔
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 14px; color: #ffffff;">Festive Royal Midnight</div>
                            <div style="font-size: 11.5px; color: #94a3b8;">Blinkit/Zepto-style Navy Gold Celebration</div>
                        </div>
                        ${active === 'festive-royal' ? '<i class="fa-solid fa-circle-check" style="color: #facc15; margin-left: auto;"></i>' : ''}
                    </div>

                    <div class="festive-theme-option-card ${active === 'luxe-dark' ? 'active' : ''}" onclick="selectThemeMode('luxe-dark')">
                        <div class="festive-theme-preview-dot" style="background: linear-gradient(135deg, #2b1308, #180903); border: 2px solid #f59e0b;">
                            🍫
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 14px; color: #ffffff;">Artisan Cocoa Luxe</div>
                            <div style="font-size: 11.5px; color: #94a3b8;">Deep Espresso & Belgian Gold</div>
                        </div>
                        ${active === 'luxe-dark' ? '<i class="fa-solid fa-circle-check" style="color: #f59e0b; margin-left: auto;"></i>' : ''}
                    </div>

                    <div class="festive-theme-option-card ${active === 'classic-light' ? 'active' : ''}" onclick="selectThemeMode('classic-light')">
                        <div class="festive-theme-preview-dot" style="background: #ffffff; border: 2px solid #7c5cfc;">
                            ☀️
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 14px; color: #ffffff;">Classic Studio Light</div>
                            <div style="font-size: 11.5px; color: #94a3b8;">Clean Modern Ivory & Royal Lavender</div>
                        </div>
                        ${active === 'classic-light' ? '<i class="fa-solid fa-circle-check" style="color: #7c5cfc; margin-left: auto;"></i>' : ''}
                    </div>
                </div>

                <button type="button" onclick="closeThemeSwitcherModal()" style="width: 100%; height: 44px; background: #facc15; color: #451a03; border: none; border-radius: 12px; font-weight: 900; font-size: 13.5px; cursor: pointer;">
                    Done
                </button>
            </div>
        `;

        modal.classList.add('open');
    };

    window.closeThemeSwitcherModal = function() {
        const modal = document.getElementById('festiveThemeModal');
        if (modal) modal.classList.remove('open');
    };

    window.selectThemeMode = function(themeName) {
        applyTheme(themeName);
        if (typeof showToast === 'function') {
            const nameMap = {
                'festive-royal': '🪔 Festive Royal Midnight Theme Applied!',
                'luxe-dark': '🍫 Artisan Cocoa Luxe Theme Applied!',
                'classic-light': '☀️ Classic Studio Light Mode Applied!'
            };
            showToast(nameMap[themeName] || 'Theme Updated', 'fa-solid fa-wand-magic-sparkles', '#facc15');
        }
        window.closeThemeSwitcherModal();
    };

    // 7. Bento Card Category Filter Links
    window.handleBentoCardClick = function(catKey) {
        if (typeof AppState !== 'undefined') {
            AppState.activeCategory = catKey;
            AppState.searchQuery = '';
            if (typeof updateCategoryViewState === 'function') updateCategoryViewState();
            if (typeof renderCategories === 'function') renderCategories();
            if (typeof renderProductsGrid === 'function') renderProductsGrid();
        }

        const catEl = document.getElementById('productsCatalogSection') || document.getElementById('productsGrid');
        if (catEl) {
            catEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // 8. Dismiss Floating Rewards Banner
    window.dismissFestiveReward = function(e) {
        if (e) e.stopPropagation();
        const toast = document.getElementById('festiveRewardToast');
        if (toast) {
            toast.style.transition = 'opacity 0.3s, transform 0.3s';
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, 20px)';
            setTimeout(() => toast.remove(), 300);
            try { sessionStorage.setItem('festive_reward_dismissed', 'true'); } catch(err) {}
        }
    };

    // 9. Sync Header State (Store Status, Location & Wallet)
    function syncFestiveHeaderState() {
        // Store Status
        const statusEl = document.getElementById('festiveStoreStatusText');
        if (statusEl && typeof getStoreOperatingStatus === 'function') {
            const status = getStoreOperatingStatus();
            if (status.isOpen) {
                statusEl.innerHTML = `Accepting Orders <span class="festive-status-trend-icon"><i class="fa-solid fa-arrow-trend-up"></i></span>`;
            } else {
                statusEl.innerHTML = `Currently unavailable <span class="festive-status-trend-icon"><i class="fa-solid fa-clock"></i></span>`;
            }
        }

        // Location text
        const locEl = document.getElementById('festiveLocationText');
        if (locEl) {
            const savedAddress = localStorage.getItem('chocoloom_delivery_address');
            if (savedAddress) {
                locEl.innerHTML = `<span class="festive-loc-badge">HOME</span> - ${savedAddress.slice(0, 24)}... <i class="fa-solid fa-chevron-down festive-loc-chevron"></i>`;
            }
        }

        // Wallet balance
        const walletEl = document.getElementById('festiveWalletBalance');
        if (walletEl) {
            const bal = localStorage.getItem('chocoloom_wallet_balance') || '0';
            walletEl.textContent = `₹${bal}`;
        }

        // Cart Dock Badge
        const cartBadge = document.getElementById('festiveDockCartBadge');
        if (cartBadge && typeof AppState !== 'undefined' && Array.isArray(AppState.cart)) {
            const count = AppState.cart.reduce((s, it) => s + (Number(it.quantity) || 1), 0);
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Initialize on DOM Ready
    document.addEventListener('DOMContentLoaded', function() {
        renderFestiveGarland();
        tickTypewriter();
        syncFestiveHeaderState();

        // Listen for search input changes
        const input = document.getElementById('festiveSearchInput');
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    handleFestiveSearchSubmit(input.value);
                }
            });
            input.addEventListener('input', function() {
                if (input.value.trim().length > 0) {
                    handleFestiveSearchSubmit(input.value);
                }
            });
        }

        // Listen for storage changes to keep wallet / address in sync
        window.addEventListener('storage', syncFestiveHeaderState);

        // Check if reward toast was dismissed
        try {
            if (sessionStorage.getItem('festive_reward_dismissed') === 'true') {
                const toast = document.getElementById('festiveRewardToast');
                if (toast) toast.remove();
            }
        } catch(e) {}
    });

    // Expose helpers globally
    window.syncFestiveHeaderState = syncFestiveHeaderState;
})();

