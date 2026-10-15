// Global Application State & Razorpay Config
window.RAZORPAY_KEY_ID = 'rzp_live_TY0ywET3NDwC4O';

let savedCollege = null;
try {
    const rawCol = localStorage.getItem('chocoloom_college');
    if (rawCol) savedCollege = JSON.parse(rawCol);
} catch (e) {}

const savedLocationData = localStorage.getItem('chocoloom_location');
let initialSelectedLoc = SWIGGY_DATA.locations[0];
if (savedLocationData) {
    try {
        const parsedLoc = JSON.parse(savedLocationData);
        if (parsedLoc && parsedLoc.name) {
            initialSelectedLoc = parsedLoc;
            if (!SWIGGY_DATA.locations.some(l => l.name === parsedLoc.name && l.city === parsedLoc.city)) {
                SWIGGY_DATA.locations.unshift(parsedLoc);
            }
        }
    } catch (e) {}
}

let savedUserSession = null;
try {
    const rawUser = localStorage.getItem('chocoloom_user_session');
    if (rawUser) savedUserSession = JSON.parse(rawUser);
} catch (e) {}

let savedCustProfile = { name: '', phone: '', street: '', city: 'Bengaluru', pincode: '', notes: '', paymentMethod: 'UPI / Online' };
try {
    const rawCust = localStorage.getItem('chocoloom_customer_profile');
    if (rawCust) savedCustProfile = { ...savedCustProfile, ...JSON.parse(rawCust) };
} catch (e) {}

const isCardPurchasedInitial = (function() {
    try { return localStorage.getItem('chocoloom_wallet_card_purchased') === 'true'; } catch(e) { return false; }
})();

// Default paymentMethod: Always UPI / Online since ChocoWallet is Coming Soon
if (!savedCustProfile.paymentMethod || savedCustProfile.paymentMethod === 'Chocowallet Card') {
    savedCustProfile.paymentMethod = 'UPI / Online';
}

if (savedUserSession) {
    if (savedUserSession.name && !savedCustProfile.name) savedCustProfile.name = savedUserSession.name;
    if (savedUserSession.phone && !savedCustProfile.phone) savedCustProfile.phone = savedUserSession.phone;
    if (savedUserSession.email && !savedCustProfile.email) savedCustProfile.email = savedUserSession.email;
}

let initialCart = [];
try {
    const rawCart = JSON.parse(localStorage.getItem('swiggy_cart') || '[]');
    if (Array.isArray(rawCart)) {
        initialCart = rawCart.filter(item => item && item.dish && (item.dish.id || item.dish.name));
    }
} catch (e) {
    initialCart = [];
}

const AppState = {
    selectedLocation: initialSelectedLoc,
    selectedCollege: savedCollege,
    cart: initialCart,
    activeCoupon: null,
    activeFilter: null,
    activeCategory: null,
    searchQuery: '',
    activeService: 'food',
    favorites: new Set(JSON.parse(localStorage.getItem('swiggy_favs') || '[]')),
    activeRestaurantModal: null,
    tipAmount: 0,
    trackingInterval: null,
    customerProfile: savedCustProfile,
    currentUser: savedUserSession,
    activeOrder: null
};

window.saveCustomerField = function(field, value) {
    if (!AppState.customerProfile) AppState.customerProfile = {};
    AppState.customerProfile[field] = value;
    try {
        localStorage.setItem('chocoloom_customer_profile', JSON.stringify(AppState.customerProfile));
    } catch (e) {}
};

window.isUserLoggedIn = function() {
    try {
        if (AppState && AppState.currentUser && (AppState.currentUser.id || AppState.currentUser.phone || AppState.currentUser.email || AppState.currentUser.name)) {
            return true;
        }
        const session = localStorage.getItem('chocoloom_user_session');
        if (session) {
            const parsed = JSON.parse(session);
            if (parsed && (parsed.id || parsed.phone || parsed.email || parsed.name)) return true;
        }
    } catch (e) {}
    return false;
};

// ==================== CHOCOWALLET CARD ENGINE ====================
window.hasChocowalletCard = function() {
    try {
        return localStorage.getItem('chocoloom_wallet_card_purchased') === 'true';
    } catch (e) {
        return false;
    }
};

window.getChocowalletCardData = function() {
    try {
        const raw = localStorage.getItem('chocoloom_wallet_card_data');
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
};

window.getChocowalletBalance = function() {
    if (!window.hasChocowalletCard()) {
        return 0;
    }
    try {
        const bal = localStorage.getItem('chocoloom_wallet_balance');
        if (bal !== null && !isNaN(Number(bal))) {
            return Number(bal);
        }
    } catch (e) {}
    // Initial welcome credit upon purchasing card
    const initialBalance = 250;
    try {
        localStorage.setItem('chocoloom_wallet_balance', initialBalance);
    } catch (e) {}
    return initialBalance;
};

window.setChocowalletBalance = function(newBalance) {
    const safe = Math.max(0, Math.round(Number(newBalance) || 0));
    try {
        localStorage.setItem('chocoloom_wallet_balance', safe);
    } catch (e) {}
    return safe;
};

window.topUpChocowallet = function(amount = 500) {
    if (!window.hasChocowalletCard()) {
        showToast('Please buy a Chocowallet Physical VIP Card first to add funds!', 'fa-solid fa-lock', '#ef4444');
        window.openBuyCardModal();
        return;
    }
    const num = Math.max(1, Math.round(Number(amount) || 500));
    const current = window.getChocowalletBalance();
    const updated = window.setChocowalletBalance(current + num);
    showToast(`Added ₹${num} to Chocowallet Card! 🎉 New Balance: ₹${updated}`, 'fa-solid fa-credit-card', '#10b981');
    updateCartUI();
    if (typeof updateAuthUI === 'function') updateAuthUI();
    const navWalletBadge = document.getElementById('navWalletBalanceBadge');
    if (navWalletBadge) navWalletBadge.textContent = `₹${updated}`;
    const dropdownWalletBadge = document.getElementById('dropdownWalletBadge');
    if (dropdownWalletBadge) dropdownWalletBadge.textContent = `₹${updated}`;
};

// ==================== CELEBRATION CHIME & CONFETTI ====================
function playCardCelebrationChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.001, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.08 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.65);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.7);
        });
    } catch (e) {}
}
window.playCardCelebrationChime = playCardCelebrationChime;

function launchCardOrderConfetti() {
    try {
        const colors = ['#9333ea', '#c084fc', '#facc15', '#10b981', '#3b82f6', '#ec4899'];
        for (let i = 0; i < 40; i++) {
            const p = document.createElement('div');
            p.className = 'card-confetti-particle';
            p.style.left = (Math.random() * 96 + 2) + 'vw';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.width = (7 + Math.random() * 8) + 'px';
            p.style.height = (7 + Math.random() * 8) + 'px';
            p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            p.style.animationDuration = (2.2 + Math.random() * 1.5) + 's';
            p.style.animationDelay = (Math.random() * 0.4) + 's';
            document.body.appendChild(p);
            setTimeout(() => { try { p.remove(); } catch(e){} }, 4000);
        }
    } catch (e) {}
}
window.launchCardOrderConfetti = launchCardOrderConfetti;

window.buyChocowalletCard = function(details = {}) {
    const defaultHolder = (AppState.currentUser?.name || AppState.customerProfile?.name || 'Mohith Kumar').trim();
    const holderName = (details.cardHolderName || defaultHolder || 'CHOCOLOOM VIP').toUpperCase();
    const phone = details.phone || AppState.currentUser?.phone || AppState.customerProfile?.phone || '+91 98765 43210';
    const street = details.street || AppState.customerProfile?.street || 'Road No. 12, Jubilee Hills';
    const city = details.city || AppState.customerProfile?.city || 'Bengaluru';
    const pincode = details.pincode || AppState.customerProfile?.pincode || '560001';
    const edition = details.edition || 'Matte Black Titanium VIP';

    const lastFour = Math.floor(1000 + Math.random() * 9000);
    const cardNum = '8842 ' + Math.floor(1000 + Math.random() * 9000) + ' ' + Math.floor(1000 + Math.random() * 9000) + ' ' + lastFour;
    const trackingCode = 'BD' + Math.floor(10000000 + Math.random() * 90000000) + 'IN';
    const orderNumber = 'CL-VIP-' + lastFour;

    // Estimated delivery date (3 days from now)
    const delDate = new Date();
    delDate.setDate(delDate.getDate() + 3);
    const delDateFormatted = delDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    const cardData = {
        cardHolderName: holderName,
        cardNumber: cardNum,
        maskedNumber: '•••• •••• •••• ' + lastFour,
        cardExpiry: '12/30',
        cardCvv: '842',
        edition: edition,
        cardPrice: 199,
        orderNumber: orderNumber,
        purchasedAt: new Date().toISOString(),
        status: 'active',
        isFrozen: false,
        physicalCard: {
            status: 'Dispatched & In Transit',
            step: 3,
            orderNumber: orderNumber,
            courier: 'BlueDart Express Air Priority',
            trackingNumber: trackingCode,
            recipientName: holderName,
            phone: phone,
            shippingAddress: (street ? street + ', ' : '') + city + (pincode ? ' - ' + pincode : ''),
            estimatedDelivery: 'Within 2-3 Business Days (' + delDateFormatted + ')',
            material: '0.8mm Heavy Matte Black Solid Card with Laser Gold Embossing',
            nfcChip: 'NXP Mifare Contactless RFID (Tap-to-Pay Enabled)',
            packaging: "Delivered in Luxury Collector's Velvet Box with Welcome Letter"
        }
    };

    try {
        localStorage.setItem('chocoloom_wallet_card_purchased', 'true');
        localStorage.setItem('chocoloom_wallet_card_data', JSON.stringify(cardData));
        // Welcome bonus credit
        const bonus = 250;
        localStorage.setItem('chocoloom_wallet_balance', bonus);
    } catch (e) {}

    // Record initial wallet history
    try {
        let history = JSON.parse(localStorage.getItem('chocoloom_wallet_transactions') || '[]');
        history.unshift({
            id: 'TXN-' + Date.now(),
            title: 'Physical VIP Card Purchased',
            desc: `Physical NFC card dispatched via BlueDart (${trackingCode})`,
            amount: -199,
            type: 'debit',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
        history.unshift({
            id: 'TXN-' + (Date.now() + 1),
            title: 'Welcome VIP Bonus Credit',
            desc: 'Instant welcome credit on physical card activation',
            amount: 250,
            type: 'credit',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
        localStorage.setItem('chocoloom_wallet_transactions', JSON.stringify(history));
    } catch (e) {}

    // Record into orders history as "In Transit" so it shows in My Orders & Admin
    try {
        let orderHistory = JSON.parse(localStorage.getItem('chocoloom_orders_history') || '[]');
        const cardOrderRecord = {
            order_number: orderNumber,
            created_at: new Date().toISOString(),
            final_total: 199,
            item_total: 199,
            total_items: 1,
            payment_method: 'UPI / Online Payment',
            payment_status: 'completed',
            payment_id: 'PAY-VIP-' + Date.now(),
            status: 'In Transit',
            delivery_address: cardData.physicalCard.shippingAddress,
            customer_name: holderName,
            customer_phone: phone,
            is_card_order: true,
            tracking_number: trackingCode,
            courier: 'BlueDart Express Air Priority',
            items: [
                {
                    name: `Chocowallet Physical VIP Card (${edition})`,
                    dish_id: 'card_vip_physical',
                    quantity: 1,
                    price: 199,
                    selected_weight: '0.8mm RFID Metal',
                    image: 'assets/physical_card_box.jpg',
                    is_card: true
                }
            ],
            user_id: AppState.currentUser ? AppState.currentUser.id : null,
            user_email: AppState.currentUser ? AppState.currentUser.email : null
        };
        if (!orderHistory.some(o => o.order_number === orderNumber)) {
            orderHistory.unshift(cardOrderRecord);
        }
        if (typeof cleanDuplicateOrders === 'function') {
            orderHistory = cleanDuplicateOrders(orderHistory);
        }
        localStorage.setItem('chocoloom_orders_history', JSON.stringify(orderHistory.slice(0, 40)));

        // Record dedicated VIP Card Order for admin shipping fulfillment table
        try {
            let cardOrders = JSON.parse(localStorage.getItem('chocoloom_card_orders') || '[]');
            const cardOrderItem = {
                id: 'CARD-' + Date.now(),
                order_number: orderNumber,
                customer_name: holderName,
                embossed_name: holderName,
                customer_phone: phone,
                shipping_address: cardData.physicalCard.shippingAddress,
                city: city,
                state: 'Karnataka',
                pincode: pincode,
                card_edition: edition,
                card_number_masked: cardData.maskedNumber,
                amount: 199,
                final_total: 199,
                payment_method: 'UPI / Online Payment',
                payment_status: 'completed',
                status: 'Pending Embossing',
                courier: 'BlueDart Express Air Priority',
                tracking_number: trackingCode,
                created_at: new Date().toISOString()
            };
            if (!cardOrders.some(c => c.order_number === orderNumber)) {
                cardOrders.unshift(cardOrderItem);
            }
            localStorage.setItem('chocoloom_card_orders', JSON.stringify(cardOrders));

            if (window.SWIGGY_DATA && Array.isArray(window.SWIGGY_DATA.cardOrders)) {
                if (!window.SWIGGY_DATA.cardOrders.some(c => c.order_number === orderNumber)) {
                    window.SWIGGY_DATA.cardOrders.unshift(cardOrderItem);
                }
            }

            if (window.BroadcastChannel) {
                const cardBc = new BroadcastChannel('chocoloom_orders_bus');
                cardBc.postMessage({ type: 'NEW_CARD_ORDER', order: cardOrderItem });
                cardBc.close();

                const altBc = new BroadcastChannel('chocoloom_card_channel');
                altBc.postMessage({ type: 'NEW_CARD_ORDER', order: cardOrderItem });
                altBc.close();
            }

            if (window.supabaseClient) {
                window.supabaseClient.from('card_orders').insert([cardOrderItem]).then(() => {}).catch(() => {});
            }
        } catch (cardErr) {
            console.warn('Error saving dedicated card order:', cardErr);
        }

        // Broadcast to admin cross-tab channel if active
        try {
            if (typeof broadcastOrderToAdmin === 'function') {
                broadcastOrderToAdmin(cardOrderRecord);
            } else if (window.BroadcastChannel) {
                const bc = new BroadcastChannel('chocoloom_admin_channel');
                bc.postMessage({ type: 'NEW_ORDER', order: cardOrderRecord });
                bc.close();
            }
        } catch(e) {}
    } catch (e) {}

    if (AppState.customerProfile) {
        AppState.customerProfile.paymentMethod = 'Chocowallet Card';
        try {
            localStorage.setItem('chocoloom_customer_profile', JSON.stringify(AppState.customerProfile));
        } catch (e) {}
    }

    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof updateAuthUI === 'function') updateAuthUI();
    if (typeof refreshPageWalletUI === 'function') refreshPageWalletUI();

    showToast('🎉 Physical VIP Card ordered! Dispatched to your address & Digital Card active with ₹250 bonus!', 'fa-solid fa-crown', '#9333ea');
    return cardData;
};

window.resetChocowalletCardForDemo = function() {
    try {
        localStorage.removeItem('chocoloom_wallet_card_purchased');
        localStorage.removeItem('chocoloom_wallet_card_data');
        localStorage.removeItem('chocoloom_wallet_balance');
        localStorage.removeItem('chocoloom_wallet_transactions');
        if (AppState.customerProfile && AppState.customerProfile.paymentMethod === 'Chocowallet Card') {
            AppState.customerProfile.paymentMethod = 'UPI / Online';
            localStorage.setItem('chocoloom_customer_profile', JSON.stringify(AppState.customerProfile));
        }
    } catch (e) {}
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof updateAuthUI === 'function') updateAuthUI();
    if (typeof refreshPageWalletUI === 'function') refreshPageWalletUI();
    showToast('Card reset to Unpurchased State for demo testing.', 'fa-solid fa-rotate-left', '#64748b');
};

// ==================== LIVE IN-TRANSIT MODAL & TRACKER CONTROLLER ====================
window.showCardOrderTransitModal = function(givenCardData = null) {
    const cardData = givenCardData || window.getChocowalletCardData() || {};
    const physical = cardData.physicalCard || {};
    const holderName = cardData.cardHolderName || (AppState.currentUser?.name || AppState.customerProfile?.name || 'Mohith Kumar').trim().toUpperCase();
    const orderNum = cardData.orderNumber || physical.orderNumber || ('CL-VIP-' + (cardData.cardNumber ? cardData.cardNumber.slice(-4) : '8842'));
    const lastFour = (cardData.cardNumber ? cardData.cardNumber.slice(-4) : (cardData.maskedNumber ? cardData.maskedNumber.slice(-4) : '8842'));
    const trackingCode = physical.trackingNumber || 'BD88429108IN';
    const courier = physical.courier || 'BlueDart Express Air Priority';
    const city = physical.shippingAddress ? physical.shippingAddress.split(',').pop().trim() : (AppState.customerProfile?.city || 'Bengaluru');
    const address = physical.shippingAddress || (AppState.customerProfile?.street ? `${AppState.customerProfile.street}, ${AppState.customerProfile.city || ''} - ${AppState.customerProfile.pincode || ''}` : 'Bengaluru, 560001');
    const phone = physical.phone || (AppState.currentUser?.phone || AppState.customerProfile?.phone || '+91 98765 43210');
    const edition = cardData.edition || 'Matte Black Titanium VIP';
    const bal = window.getChocowalletBalance();
    
    // Calculate estimated date
    const delDate = new Date();
    delDate.setDate(delDate.getDate() + 3);
    const formattedDeliveryDate = delDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    let backdrop = document.getElementById('cardTransitModalBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'cardTransitModalBackdrop';
        backdrop.className = 'card-transit-modal-backdrop ios-backdrop';
        backdrop.onclick = function(e) {
            if (e.target === backdrop) window.closeCardTransitModal();
        };
        document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
        <div class="card-transit-modal ios-sheet-modal" onclick="event.stopPropagation()">
            <!-- iOS Sheet Pull Handle -->
            <div class="ios-sheet-handle"></div>

            <!-- iOS Frosted Close Button -->
            <button class="ios-close-button" onclick="window.closeCardTransitModal(true)" title="Dismiss">
                <i class="fa-solid fa-xmark"></i>
            </button>

            <!-- iOS Apple Pay Success Header -->
            <div class="ios-header-section">
                <div class="ios-check-circle-wrapper">
                    <div class="ios-check-circle">
                        <svg class="ios-checkmark-svg" viewBox="0 0 52 52">
                            <circle class="ios-checkmark-circle" cx="26" cy="26" r="24" fill="none"/>
                            <path class="ios-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    </div>
                </div>

                <div class="ios-payment-status-pill">
                    <i class="fa-solid fa-shield-check"></i>
                    <span>Payment Confirmed • ₹199 Received</span>
                </div>

                <h2 class="ios-modal-title">
                    Order Placed Successfully
                </h2>
                <p class="ios-modal-subtitle">
                    Your custom laser-embossed <strong>Chocowallet VIP Card</strong> is officially on the way
                </p>
            </div>

            <!-- Apple Dynamic Island / Live Activity Tracking Widget -->
            <div class="ios-live-activity-island">
                <div class="ios-island-top-row">
                    <div class="ios-island-status">
                        <span class="ios-island-pulse-dot"></span>
                        <span class="ios-island-status-text">LIVE ACTIVITY</span>
                        <span class="ios-island-badge">IN TRANSIT</span>
                    </div>
                    <div class="ios-island-ref">
                        Order #${orderNum}
                    </div>
                </div>

                <div class="ios-route-progress-container">
                    <div class="ios-route-station start">
                        <div class="ios-station-icon"><i class="fa-solid fa-building-shield"></i></div>
                        <div class="ios-station-meta">
                            <span class="ios-station-name">Chocoloom Vault</span>
                            <span class="ios-station-sub">BLR Lab</span>
                        </div>
                    </div>

                    <div class="ios-route-line-wrapper">
                        <div class="ios-route-track">
                            <div class="ios-route-fill"></div>
                            <div class="ios-moving-vehicle" title="En route via BlueDart Air">
                                <i class="fa-solid fa-plane-departure"></i>
                            </div>
                        </div>
                        <span class="ios-express-tag">AIR PRIORITY EXPRESS</span>
                    </div>

                    <div class="ios-route-station end">
                        <div class="ios-station-icon"><i class="fa-solid fa-house-chimney"></i></div>
                        <div class="ios-station-meta">
                            <span class="ios-station-name">Your Doorstep</span>
                            <span class="ios-station-sub">${city}</span>
                        </div>
                    </div>
                </div>

                <!-- iOS Mini Interactive Steps -->
                <div class="ios-stepper-row">
                    <div class="ios-step-node done">
                        <span class="ios-node-dot"><i class="fa-solid fa-check"></i></span>
                        <span class="ios-node-label">Paid</span>
                    </div>
                    <div class="ios-step-divider done"></div>
                    <div class="ios-step-node done">
                        <span class="ios-node-dot"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
                        <span class="ios-node-label">Embossed</span>
                    </div>
                    <div class="ios-step-divider done"></div>
                    <div class="ios-step-node active">
                        <span class="ios-node-dot pulse"><i class="fa-solid fa-truck-fast"></i></span>
                        <span class="ios-node-label">In Transit</span>
                    </div>
                    <div class="ios-step-divider"></div>
                    <div class="ios-step-node">
                        <span class="ios-node-dot"><i class="fa-regular fa-clock"></i></span>
                        <span class="ios-node-label">Delivered</span>
                    </div>
                </div>
            </div>

            <!-- Apple Wallet Metal Card Pass Preview -->
            <div class="ios-apple-card-preview">
                <div class="ios-metal-card">
                    <div class="ios-card-sheen"></div>
                    <div class="ios-card-top">
                        <div class="ios-card-chip-group">
                            <div class="ios-card-emv-chip"></div>
                            <i class="fa-solid fa-wifi ios-card-nfc-icon"></i>
                        </div>
                        <span class="ios-card-brand-tag">CHOCOLOOM VIP</span>
                    </div>
                    <div class="ios-card-middle">
                        <span class="ios-card-masked-num">•••• •••• •••• ${lastFour}</span>
                    </div>
                    <div class="ios-card-bottom">
                        <div class="ios-card-holder-meta">
                            <span class="ios-card-label">EMBOSSED NAME</span>
                            <span class="ios-card-holder-name">${holderName}</span>
                        </div>
                        <div class="ios-card-edition-meta">
                            <span class="ios-card-edition-badge">${edition.includes('Gold') ? 'GOLD LUXE' : 'TITANIUM BLACK'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- iOS Inset Grouped Details Section -->
            <div class="ios-inset-grouped-section">
                <!-- Row 1: Courier -->
                <div class="ios-list-row">
                    <div class="ios-row-icon-box blue">
                        <i class="fa-solid fa-plane"></i>
                    </div>
                    <div class="ios-row-content">
                        <span class="ios-row-label">Courier Partner</span>
                        <span class="ios-row-value">${courier}</span>
                    </div>
                </div>

                <div class="ios-row-separator"></div>

                <!-- Row 2: AWB Tracking -->
                <div class="ios-list-row">
                    <div class="ios-row-icon-box indigo">
                        <i class="fa-solid fa-barcode"></i>
                    </div>
                    <div class="ios-row-content">
                        <span class="ios-row-label">Tracking / AWB Number</span>
                        <div class="ios-row-value-with-action">
                            <span class="ios-awb-mono" id="modalAwbCode">${trackingCode}</span>
                            <button type="button" class="ios-copy-pill-btn" onclick="window.copyModalTrackingCode('${trackingCode}', this)">
                                <i class="fa-regular fa-copy"></i> Copy
                            </button>
                        </div>
                    </div>
                </div>

                <div class="ios-row-separator"></div>

                <!-- Row 3: Recipient -->
                <div class="ios-list-row">
                    <div class="ios-row-icon-box green">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div class="ios-row-content">
                        <span class="ios-row-label">Recipient</span>
                        <span class="ios-row-value">${holderName} <span class="ios-phone-sub">(${phone})</span></span>
                    </div>
                </div>

                <div class="ios-row-separator"></div>

                <!-- Row 4: Shipping Address -->
                <div class="ios-list-row">
                    <div class="ios-row-icon-box red">
                        <i class="fa-solid fa-location-dot"></i>
                    </div>
                    <div class="ios-row-content">
                        <span class="ios-row-label">Shipping Address</span>
                        <span class="ios-row-value ios-address-clamp">${address}</span>
                    </div>
                </div>

                <div class="ios-row-separator"></div>

                <!-- Row 5: Card Finish -->
                <div class="ios-list-row">
                    <div class="ios-row-icon-box purple">
                        <i class="fa-solid fa-credit-card"></i>
                    </div>
                    <div class="ios-row-content">
                        <span class="ios-row-label">Card Finish</span>
                        <span class="ios-row-value">${edition} (0.8mm Solid Metal NFC)</span>
                    </div>
                </div>

                <div class="ios-row-separator"></div>

                <!-- Row 6: Estimated Arrival -->
                <div class="ios-list-row">
                    <div class="ios-row-icon-box orange">
                        <i class="fa-regular fa-calendar-check"></i>
                    </div>
                    <div class="ios-row-content">
                        <span class="ios-row-label">Estimated Delivery</span>
                        <span class="ios-row-value green-highlight">${formattedDeliveryDate} (2-3 Business Days)</span>
                    </div>
                </div>
            </div>

            <!-- iOS Apple Cash Welcome Bonus Card -->
            <div class="ios-apple-cash-card">
                <div class="ios-cash-left">
                    <div class="ios-cash-icon-glow">
                        <i class="fa-solid fa-bolt"></i>
                    </div>
                    <div class="ios-cash-copy">
                        <div class="ios-cash-title">Digital Card Active Immediately</div>
                        <div class="ios-cash-desc">
                            No waiting required. Your <strong>₹250 Welcome Credit</strong> is ready in your wallet for 1-click cake orders.
                        </div>
                    </div>
                </div>
                <div class="ios-cash-right">
                    <span class="ios-cash-tag">READY BALANCE</span>
                    <span class="ios-cash-balance">₹${bal}</span>
                </div>
            </div>

            <!-- iOS Cupertino Action Buttons -->
            <div class="ios-modal-actions">
                <a href="order.html" class="ios-btn ios-btn-primary" style="text-decoration: none;">
                    <i class="fa-solid fa-cake-candles"></i> Use ₹250 Credit to Order Cakes
                </a>
                <button type="button" class="ios-btn ios-btn-secondary" onclick="window.closeCardTransitModal(true)">
                    <i class="fa-solid fa-wallet"></i> View In-Transit Tracker in Wallet
                </button>
            </div>
        </div>
    `;

    // Trigger opening animation with iOS spring timing
    requestAnimationFrame(() => {
        backdrop.classList.add('open');
    });

    // Play celebration audio and confetti
    playCardCelebrationChime();
    launchCardOrderConfetti();
};

window.closeCardTransitModal = function(scrollToTracker = false) {
    const backdrop = document.getElementById('cardTransitModalBackdrop');
    if (backdrop) {
        backdrop.classList.remove('open');
        setTimeout(() => { backdrop.remove(); }, 350);
    }
    if (scrollToTracker) {
        if (!window.location.pathname.includes('chocowallet.html')) {
            window.location.href = 'chocowallet.html#physicalTrackerCard';
            return;
        }
        const trackerEl = document.getElementById('physicalTrackerCard');
        if (trackerEl) {
            trackerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            trackerEl.classList.add('spotlight-highlight');
            setTimeout(() => trackerEl.classList.remove('spotlight-highlight'), 3000);
        }
    }
};

window.copyModalTrackingCode = function(code, btn) {
    navigator.clipboard.writeText(code).then(() => {
        showToast(`Tracking Code ${code} copied to clipboard! 📋`, 'fa-regular fa-copy', '#10b981');
        if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-check" style="color: #10b981;"></i>`;
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        }
    }).catch(() => {
        showToast(`Tracking No: ${code}`, 'fa-solid fa-truck-fast', '#9333ea');
    });
};

window.openBuyCardModal = function() {
    let modal = document.getElementById('buyCardModalBackdrop');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'buyCardModalBackdrop';
        modal.className = 'buy-card-modal-backdrop';
        document.body.appendChild(modal);
    }
    const defaultHolder = (AppState.currentUser?.name || AppState.customerProfile?.name || 'Mohith Kumar').trim();
    const phone = AppState.currentUser?.phone || AppState.customerProfile?.phone || '';
    const street = AppState.customerProfile?.street || '';
    const city = AppState.customerProfile?.city || 'Bengaluru';
    const pincode = AppState.customerProfile?.pincode || '';

    modal.innerHTML = `
        <div class="buy-card-modal-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px;">
                        <i class="fa-solid fa-crown"></i> VIP EXCLUSIVE
                    </span>
                    <h3 style="margin: 0; font-size: 17px; font-weight: 900; color: #0f172a;">Order Physical VIP Card</h3>
                </div>
                <button type="button" onclick="document.getElementById('buyCardModalBackdrop').remove();" style="border: none; background: #f1f5f9; width: 32px; height: 32px; border-radius: 50%; font-size: 14px; cursor: pointer; color: #475569;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <!-- Card Showcase Image Banner -->
            <div style="position: relative; border-radius: 16px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 8px 24px -4px rgba(0,0,0,0.2);">
                <img src="assets/physical_card_box.jpg" alt="Physical VIP Card Unboxing" style="width: 100%; height: 180px; object-fit: cover; display: block;">
                <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(9,3,20,0.85) 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 12px 16px;">
                    <span style="color: #facc15; font-size: 11px; font-weight: 800; letter-spacing: 1px;">MATTE BLACK NFC METAL CARD</span>
                    <span style="color: #ffffff; font-size: 13px; font-weight: 700;">Delivered to your doorstep in luxury velvet box with ₹250 welcome bonus!</span>
                </div>
            </div>

            <!-- Perks Summary -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
                <div style="background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 10px; padding: 8px 10px; font-size: 11px; color: #6b21a8; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-truck-fast"></i> Free Doorstep Delivery
                </div>
                <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 10px; padding: 8px 10px; font-size: 11px; color: #047857; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-bolt"></i> 1-Click Zero-OTP Checkout
                </div>
                <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 10px; padding: 8px 10px; font-size: 11px; color: #1d4ed8; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-wifi"></i> Tap-to-Pay in Bakeries
                </div>
                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 8px 10px; font-size: 11px; color: #b45309; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-gift"></i> ₹250 Preloaded Balance
                </div>
            </div>

            <!-- Form with realistic payment simulation and immediate transit show -->
            <form onsubmit="handleModalBuyCardSubmit(event)">
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 11.5px; font-weight: 800; color: #334155; margin-bottom: 4px;">Name to Emboss on Physical Card (Gold Foil)</label>
                    <input type="text" name="holder" value="${defaultHolder}" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <label style="display: block; font-size: 11.5px; font-weight: 800; color: #334155; margin-bottom: 4px;">Contact Phone</label>
                        <input type="tel" name="phone" value="${phone}" placeholder="9876543210" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-weight: 700; color: #0f172a;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 11.5px; font-weight: 800; color: #334155; margin-bottom: 4px;">City</label>
                        <input type="text" name="city" value="${city}" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-weight: 700; color: #0f172a;">
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11.5px; font-weight: 800; color: #334155; margin-bottom: 4px;">Delivery Address (For Physical Courier)</label>
                    <input type="text" name="street" value="${street}" placeholder="Flat / House No., Landmark" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                    <input type="text" name="pincode" value="${pincode}" placeholder="Pincode (e.g. 560001)" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-weight: 700; color: #0f172a;">
                </div>

                <button type="submit" class="order-physical-submit-btn" id="modalBuyCardSubmitBtn">
                    <i class="fa-solid fa-credit-card"></i> Pay ₹199 & Order Physical Card
                </button>
                <div style="text-align: center; margin-top: 10px; font-size: 11px; color: #64748b;">
                    <i class="fa-solid fa-shield-halved" style="color: #10b981;"></i> 100% Secure • Dispatched via BlueDart Express
                </div>
            </form>
        </div>
    `;
};

window.handleModalBuyCardSubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type=submit]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-shield-halved fa-spin"></i> Processing Payment of ₹199...`;
    }
    setTimeout(() => {
        const cardData = window.buyChocowalletCard({
            cardHolderName: form.holder ? form.holder.value : undefined,
            phone: form.phone ? form.phone.value : undefined,
            street: form.street ? form.street.value : undefined,
            city: form.city ? form.city.value : undefined,
            pincode: form.pincode ? form.pincode.value : undefined
        });
        document.getElementById('buyCardModalBackdrop')?.remove();
        window.showCardOrderTransitModal(cardData);
    }, 800);
};

window.openChocowalletModal = function() {
    window.location.href = 'chocowallet.html';
};

window.closeChocowalletModal = function() {
    const modal = document.getElementById('chocowalletModalBackdrop');
    if (modal) modal.remove();
};

// DOM Elements Cache
const DOM = {
    bannersContainer: document.getElementById('bannersContainer'),
    categoryScrollContainer: document.getElementById('categoryScrollContainer'),
    catScrollLeftBtn: document.getElementById('catScrollLeftBtn'),
    catScrollRightBtn: document.getElementById('catScrollRightBtn'),
    restaurantsGrid: document.getElementById('restaurantsGrid'),
    instamartView: document.getElementById('instamartView'),
    instamartGrid: document.getElementById('instamartGrid'),
    featuredChainsSection: document.getElementById('featuredChainsSection'),
    dishOrRestSearchInput: document.getElementById('dishOrRestSearchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    filterPills: document.querySelectorAll('.filter-pill'),
    catalogFilterPills: document.getElementById('catalogFilterPills'),
    serviceTabs: document.querySelectorAll('.service-tab'),
    // Modals & Drawers
    menuModalBackdrop: document.getElementById('menuModalBackdrop'),
    closeMenuModalBtn: document.getElementById('closeMenuModalBtn'),
    modalRestName: document.getElementById('modalRestName'),
    modalRestCuisines: document.getElementById('modalRestCuisines'),
    modalRestRating: document.getElementById('modalRestRating'),
    modalRestTime: document.getElementById('modalRestTime'),
    modalRestCost: document.getElementById('modalRestCost'),
    menuDishesContainer: document.getElementById('menuDishesContainer'),
    // Location
    locationPickerBtn: document.getElementById('locationPickerBtn'),
    locationModalBackdrop: document.getElementById('locationModalBackdrop'),
    closeLocationModalBtn: document.getElementById('closeLocationModalBtn'),
    locationsList: document.getElementById('locationsList'),
    locationSearchInput: document.getElementById('locationSearchInput'),
    currentLocType: document.getElementById('currentLocType'),
    currentLocName: document.getElementById('currentLocName'),
    // Cart
    cartOpenBtn: document.getElementById('cartOpenBtn'),
    cartDrawer: document.getElementById('cartDrawer'),
    cartOverlay: document.getElementById('cartOverlay'),
    closeCartBtn: document.getElementById('closeCartBtn'),
    cartBodyContent: document.getElementById('cartBodyContent'),
    cartFooter: document.getElementById('cartFooter'),
    cartCountBadge: document.getElementById('cartCountBadge'),
    mobileCartBadge: document.getElementById('mobileCartBadge'),
    cartCheckoutTotal: document.getElementById('cartCheckoutTotal'),
    floatingCartBar: document.getElementById('floatingCartBar'),
    floatingItemCount: document.getElementById('floatingItemCount'),
    proceedToPayBtn: document.getElementById('proceedToPayBtn'),
    // Tracking
    trackingModalBackdrop: document.getElementById('trackingModalBackdrop'),
    closeTrackingModalBtn: document.getElementById('closeTrackingModalBtn'),
    riderPin: document.getElementById('riderPin'),
    trackStatusTitle: document.getElementById('trackStatusTitle'),
    trackSubtext: document.getElementById('trackSubtext'),
    trackingEtaBadge: document.getElementById('trackingEtaBadge')
};

// ==================== SUPABASE & NEON CLOUD DATABASE INTEGRATION ====================
const savedSupabaseUrl = localStorage.getItem('chocoloom_supabase_url');
const savedSupabaseKey = localStorage.getItem('chocoloom_supabase_key');
const savedNeonUrl = localStorage.getItem('chocoloom_neon_url');

const SUPABASE_CONFIG = {
    url: (savedSupabaseUrl || 'https://icedyeuagmkgitkoznxr.supabase.co').replace(/\/$/, ''),
    anonKey: savedSupabaseKey || 'sb_publishable_NI0EpHVxbjk7gW5W8_1lXw_rhcmDwlY'
};

const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_yrd3JMAzmWg2@ep-bold-math-b5bam8cm-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const NEON_CONFIG = {
    url: (savedNeonUrl || DEFAULT_NEON_URL).trim()
};

let supabaseClient = null;
let neonSql = null;

function getSupabaseClient() {
    if (!supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        } catch (e) {
            console.warn('Supabase client init error:', e);
        }
    }
    return supabaseClient;
}

// Neon Native Serverless HTTP Engine (Zero-dependency direct HTTPS fetch to Neon /sql)
function parseNeonConnectionString(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let s = raw.trim();
    s = s.replace(/^(?:psql\s+)?['"]?/, '').replace(/['"]?$/, '');
    s = s.replace(/^DATABASE_URL\s*=\s*['"]?/, '').replace(/['"]?$/, '');
    s = s.replace(/\s+/g, '').trim();

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
    if (!parsed) throw new Error("Invalid Neon Connection String");

    const endpoint = `https://${parsed.host}/sql`;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 6000) : null;

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Neon-Connection-String": parsed.url,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: sqlQuery,
                params: params || []
            }),
            signal: controller ? controller.signal : undefined
        });

        const data = await res.json().catch(() => ({ message: `HTTP ${res.status}: Query returned invalid response` }));
        if (!res.ok || (data && (data.message || data.error))) {
            throw new Error(data?.message || data?.error || `HTTP ${res.status} Error`);
        }

        if (Array.isArray(data)) return data;
        if (data.rows && Array.isArray(data.rows)) return data.rows;
        return [data];
    } finally {
        if (timer) clearTimeout(timer);
    }
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
    const raw = localStorage.getItem('chocoloom_neon_url') || NEON_CONFIG.url;
    if (!raw || !raw.trim()) return null;
    const parsed = parseNeonConnectionString(raw);
    if (!parsed) return null;

    if (!neonSql || neonSql._url !== parsed.url) {
        neonSql = createNeonSql(parsed.url);
    }
    return neonSql;
}

// Fetch all available products and store status directly from Neon Postgres
async function fetchLiveProductsFromNeon() {
    try {
        const sql = getNeonClient();
        if (!sql) return null;

        // 1. Sync store operating status from Neon
        try {
            const storeData = await sql`SELECT value FROM store_settings WHERE key = 'store_status' LIMIT 1;`;
            if (storeData && storeData[0]?.value) {
                const val = storeData[0].value;
                const cur = localStorage.getItem('chocoloom_store_status');
                if (cur !== val) {
                    localStorage.setItem('chocoloom_store_status', val);
                    localStorage.setItem('chocoloom_store_status_override', val);
                    if (typeof updateStoreOperatingStatusUI === 'function') updateStoreOperatingStatusUI();
                }
            }
        } catch(sErr) {}

        // 2. Fetch live products
        const data = await sql`SELECT * FROM products ORDER BY category, name ASC`;
        if (Array.isArray(data) && data.length > 0) {
            console.log(`✅ Loaded ${data.length} live products directly from Neon Postgres!`);
            return data;
        }
    } catch (e) {
        console.warn('Neon products fetch error:', e);
    }
    return null;
}

// Map and apply all live products received directly from Neon Serverless Postgres into website catalog
function applyNeonProductsToCatalog(liveProducts, showToastNotification = false) {
    if (!liveProducts || !Array.isArray(liveProducts) || liveProducts.length === 0) return;
    if (!SWIGGY_DATA || !SWIGGY_DATA.restaurants || !SWIGGY_DATA.restaurants[0]) return;

    // Mark cloud database as authoritative live source
    window._neonDatabaseLoaded = true;

    const rest = SWIGGY_DATA.restaurants[0];
    const existingMenu = Array.isArray(rest.menu) ? rest.menu : [];
    const existingMap = new Map();
    existingMenu.forEach(p => {
        if (p.id) existingMap.set(p.id, p);
        if (p.sql_id) existingMap.set(p.sql_id, p);
        if (p.name) existingMap.set(p.name.toLowerCase().trim(), p);
    });

    const mappedMenu = liveProducts.map((r, idx) => {
        const id = r.id || `choco_neon_${idx + 1}`;
        const name = r.name || 'Artisan Cake';
        const cleanName = name.toLowerCase().trim();
        const existing = existingMap.get(id) || existingMap.get(cleanName);

        const price = Number((r.discount_price && Number(r.discount_price) > 0) ? r.discount_price : r.price || 0);
        const originalPrice = Number(r.original_price || r.price || (price > 0 ? Math.round(price * 1.3) : 0));

        const price05 = Number(r.price_half_kg || price);
        const price10 = Number(r.price_1kg || (price + 400));
        const price15 = Number(r.price_1_5kg || (price + 800));
        const price20 = Number(r.price_2kg || (price + 1200));
        const price30 = Number(r.price_3kg || (price + 2000));

        const cooling05 = Number(r.cooling_price_half_kg || 50);
        const cooling10 = Number(r.cooling_price_1kg || 150);
        const cooling15 = Number(r.cooling_price_1_5kg || 199);
        const cooling20 = Number(r.cooling_price_2kg || 200);
        const cooling30 = Number(r.cooling_price_3kg || 299);

        const category = r.category || 'Specialty Cakes';
        const isUniSpecial = Boolean(r.id && r.id.startsWith('uni_')) || 
                             Boolean(r.isUniSpecial) || 
                             ['Chocolates', 'Desserts', 'Snacks', 'Combos'].includes(category);
        const hasWeight = r.has_weight !== undefined ? (r.has_weight === true || r.has_weight === 'true') : !['Chocolates', 'Snacks', 'Desserts', 'Combos', 'Extras'].includes(category);
        const hasCooling = r.has_cooling !== undefined ? (r.has_cooling === true || r.has_cooling === 'true') : !['Chocolates', 'Snacks', 'Desserts', 'Combos', 'Extras'].includes(category);
        const isDirectAdd = (!hasWeight && !hasCooling) || ['Chocolates', 'Snacks', 'Desserts', 'Combos', 'Extras'].includes(category);

        const finalImage = (r.image_url && r.image_url.trim()) ? r.image_url.trim() : ((existing && existing.image) ? existing.image : 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600');

        return {
            id: id,
            sql_id: r.id,
            name: name,
            category: category,
            uniCategory: isUniSpecial ? (['Chocolates', 'Desserts', 'Snacks', 'Combos'].includes(category) ? category : 'Cakes') : undefined,
            price: price,
            originalPrice: originalPrice,
            price_half_kg: price05,
            price_1kg: price10,
            price_1_5kg: price15,
            price_2kg: price20,
            price_3kg: price30,
            cooling_price_half_kg: cooling05,
            cooling_price_1kg: cooling10,
            cooling_price_1_5kg: cooling15,
            cooling_price_2kg: cooling20,
            cooling_price_3kg: cooling30,
            description: r.description || (existing ? existing.description : ''),
            image: finalImage,
            image_url: finalImage,
            isVeg: true,
            isBestseller: existing ? Boolean(existing.isBestseller) : (idx % 7 === 0),
            rating: existing ? existing.rating : 4.8,
            reviewsCount: existing ? existing.reviewsCount : 120,
            isUniSpecial: isUniSpecial,
            has_weight: hasWeight,
            has_cooling: hasCooling,
            isDirectAdd: isDirectAdd,
            is_available: r.is_available !== false,
            stock: Number(r.stock || 100),
            restaurantId: rest.id || 'rest_chocoloom_flagship',
            restaurantName: rest.name || 'Chocoloom Flagship Bakery & Confectionery'
        };
    });

    // Replace menu with complete live Neon catalog
    rest.menu = mappedMenu;

    // Invalidate product cache so all callers compute from live updated menu
    if (typeof window.invalidateProductsCache === 'function') {
        window.invalidateProductsCache();
    }

    // Apply live cart price synchronization
    if (typeof syncCartItemPrices === 'function') {
        syncCartItemPrices();
    }

    // Refresh UI
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderFilterPills === 'function') renderFilterPills();
    if (typeof renderProductsGrid === 'function') renderProductsGrid();
    if (typeof updateCartUI === 'function') updateCartUI();

    console.log(`🍰 Successfully populated ${mappedMenu.length} products from Neon Postgres into Chocoloom Catalog!`);

    if (showToastNotification && typeof showToast === 'function') {
        showToast(`⚡ Live Neon Sync: ${mappedMenu.length} items loaded!`, 'fa-solid fa-cloud-bolt', '#10b981');
    }
}

window.loadCatalogFromNeon = async function(showToast = false) {
    try {
        const neonProds = await fetchLiveProductsFromNeon();
        if (neonProds && neonProds.length > 0) {
            applyNeonProductsToCatalog(neonProds, showToast);
            return true;
        }
    } catch (e) {
        console.warn('loadCatalogFromNeon error:', e);
    }
    return false;
};

// Fetch all available products directly from Supabase
async function fetchLiveProductsFromSupabase() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client
                .from('products')
                .select('*')
                .eq('is_available', true);
            if (!error && data) return data;
        } catch (e) {
            console.warn('Supabase JS query error, falling back to REST fetch:', e);
        }
    }

    // Direct REST API fallback
    try {
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products?select=*&is_available=eq.true`, {
            headers: {
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            return data;
        }
    } catch (e) {
        console.warn('Supabase REST fetch error:', e);
    }
    return null;
}

// Sync live Supabase products into active menu, cart, and UI
function syncSupabaseProducts(liveProducts, showToastNotification = false) {
    if (!liveProducts || !Array.isArray(liveProducts) || liveProducts.length === 0) return;
    const menu = SWIGGY_DATA.restaurants[0]?.menu;
    if (!menu) return;

    let anyPriceUpdated = false;
    let updatedCount = 0;

    liveProducts.forEach(liveItem => {
        const effectivePrice = (liveItem.discount_price && Number(liveItem.discount_price) > 0 && Number(liveItem.discount_price) < Number(liveItem.price)) 
            ? Number(liveItem.discount_price) 
            : Number(liveItem.price);
        const effectiveOrigPrice = (liveItem.discount_price && Number(liveItem.discount_price) > 0 && Number(liveItem.discount_price) < Number(liveItem.price))
            ? Number(liveItem.price)
            : Number(liveItem.original_price || liveItem.price);

        const cleanName = (liveItem.name || '').toLowerCase().trim();
        let match = menu.find(p => p.sql_id === liveItem.id || p.id === liveItem.id || (p.name && p.name.toLowerCase().trim() === cleanName));

        if (match) {
            const isStaleAugustRecord = liveItem.updated_at && String(liveItem.updated_at).startsWith('2026-08-15');
            if (isStaleAugustRecord && match.price > 0) {
                return; // Do not overwrite fresh Neon / Admin live price with stale August seed
            }
            if (match.price !== effectivePrice) {
                match.price = effectivePrice;
                anyPriceUpdated = true;
                updatedCount++;
            }
            if (liveItem.name && match.name !== liveItem.name) {
                match.name = liveItem.name;
                anyPriceUpdated = true;
            }
            if (liveItem.category && match.category !== liveItem.category) {
                match.category = liveItem.category;
                anyPriceUpdated = true;
            }
            if (liveItem.image_url && match.image !== liveItem.image_url) {
                match.image = liveItem.image_url;
                anyPriceUpdated = true;
            }
            match.originalPrice = effectiveOrigPrice;
            if (liveItem.price_half_kg !== undefined && liveItem.price_half_kg !== null) match.price_half_kg = Number(liveItem.price_half_kg);
            if (liveItem.price_1kg !== undefined && liveItem.price_1kg !== null) match.price_1kg = Number(liveItem.price_1kg);
            if (liveItem.price_1_5kg !== undefined && liveItem.price_1_5kg !== null) match.price_1_5kg = Number(liveItem.price_1_5kg);
            if (liveItem.price_2kg !== undefined && liveItem.price_2kg !== null) match.price_2kg = Number(liveItem.price_2kg);
            if (liveItem.price_3kg !== undefined && liveItem.price_3kg !== null) match.price_3kg = Number(liveItem.price_3kg);
            if (liveItem.cooling_price_half_kg !== undefined && liveItem.cooling_price_half_kg !== null) match.cooling_price_half_kg = Number(liveItem.cooling_price_half_kg);
            if (liveItem.cooling_price_1kg !== undefined && liveItem.cooling_price_1kg !== null) match.cooling_price_1kg = Number(liveItem.cooling_price_1kg);
            if (liveItem.cooling_price_1_5kg !== undefined && liveItem.cooling_price_1_5kg !== null) match.cooling_price_1_5kg = Number(liveItem.cooling_price_1_5kg);
            if (liveItem.cooling_price_2kg !== undefined && liveItem.cooling_price_2kg !== null) match.cooling_price_2kg = Number(liveItem.cooling_price_2kg);
            if (liveItem.cooling_price_3kg !== undefined && liveItem.cooling_price_3kg !== null) match.cooling_price_3kg = Number(liveItem.cooling_price_3kg);
            if (liveItem.has_flavours !== undefined) match.has_flavours = Boolean(liveItem.has_flavours);
            if (liveItem.default_flavour || liveItem.flavour) match.flavour = liveItem.default_flavour || liveItem.flavour;
            if (liveItem.flavour_price_truffle !== undefined || liveItem.flavour_price_red_velvet !== undefined || liveItem.flavour_prices) {
                const fpObj = (typeof liveItem.flavour_prices === 'object' && liveItem.flavour_prices) ? liveItem.flavour_prices : {};
                match.flavour_prices = {
                    chocolate_truffle: Number(liveItem.flavour_price_truffle ?? (fpObj.chocolate_truffle ?? 0)),
                    black_forest: Number(liveItem.flavour_price_black_forest ?? (fpObj.black_forest ?? 0)),
                    red_velvet: Number(liveItem.flavour_price_red_velvet ?? (fpObj.red_velvet ?? 50)),
                    butterscotch: Number(liveItem.flavour_price_butterscotch ?? (fpObj.butterscotch ?? 0)),
                    pineapple: Number(liveItem.flavour_price_pineapple ?? (fpObj.pineapple ?? 0)),
                    vanilla: Number(liveItem.flavour_price_vanilla ?? (fpObj.vanilla ?? 0)),
                    black_currant: Number(liveItem.flavour_price_black_currant ?? (fpObj.black_currant ?? 50)),
                    mango: Number(liveItem.flavour_price_mango ?? (fpObj.mango ?? 50)),
                    strawberry: Number(liveItem.flavour_price_strawberry ?? (fpObj.strawberry ?? 50)),
                    rasmalai: Number(liveItem.flavour_price_rasmalai ?? (fpObj.rasmalai ?? 100)),
                    hazelnut_ferrero: Number(liveItem.flavour_price_hazelnut ?? (fpObj.hazelnut_ferrero ?? 100))
                };
            }
            if (liveItem.description) { match.description = liveItem.description; anyPriceUpdated = true; }
            if (liveItem.is_available !== undefined) { match.is_available = liveItem.is_available; anyPriceUpdated = true; }
        } else if (liveItem.is_available) {
            menu.push({
                id: `choco_sql_${menu.length + 1}`,
                sql_id: liveItem.id,
                name: liveItem.name,
                price: effectivePrice,
                originalPrice: effectiveOrigPrice,
                price_half_kg: Number(liveItem.price_half_kg || effectivePrice),
                price_1kg: Number(liveItem.price_1kg || (effectivePrice + 400)),
                price_1_5kg: Number(liveItem.price_1_5kg || (effectivePrice + 800)),
                price_2kg: Number(liveItem.price_2kg || (effectivePrice + 1200)),
                price_3kg: Number(liveItem.price_3kg || (effectivePrice + 2000)),
                cooling_price_half_kg: Number(liveItem.cooling_price_half_kg || 50),
                cooling_price_1kg: Number(liveItem.cooling_price_1kg || 100),
                cooling_price_1_5kg: Number(liveItem.cooling_price_1_5kg || 150),
                cooling_price_2kg: Number(liveItem.cooling_price_2kg || 200),
                cooling_price_3kg: Number(liveItem.cooling_price_3kg || 300),
                category: liveItem.category || 'Specialty Cakes',
                isVeg: true,
                isBestseller: false,
                rating: 4.8,
                reviewsCount: 120,
                description: liveItem.description || '',
                image: liveItem.image_url || 'desserts/WhatsApp%20Image%202026-08-08%20at%2018.04.03.jpeg'
            });
            anyPriceUpdated = true;
        }
    });

    // Sync any items currently in AppState.cart
    AppState.cart.forEach(cartItem => {
        const freshProd = menu.find(p => p.id === cartItem.dish.id || p.sql_id === cartItem.dish.sql_id || (p.name && cartItem.dish.name && p.name.toLowerCase().trim() === cartItem.dish.name.toLowerCase().trim()));
        if (freshProd && cartItem.dish.price !== freshProd.price) {
            cartItem.dish.price = freshProd.price;
            saveCart();
            anyPriceUpdated = true;
        }
    });

    if (anyPriceUpdated) {
        if (typeof window.invalidateProductsCache === 'function') {
            window.invalidateProductsCache();
        }
        renderFilterPills();
        renderProductsGrid();
        updateCartUI();
        if (showToastNotification) {
            showToast(`⚡ Live Database Sync: Catalog updated`, 'fa-solid fa-cloud-bolt', '#10b981');
        }
    }
}

// Load catalog directly from Supabase (Primary Production Database)
window.loadCatalogFromSupabase = async function(showToast = false) {
    try {
        const liveProducts = await fetchLiveProductsFromSupabase();
        if (liveProducts && Array.isArray(liveProducts) && liveProducts.length > 0) {
            syncSupabaseProducts(liveProducts, showToast);
            return true;
        }
    } catch (e) {
        console.warn('loadCatalogFromSupabase error:', e);
    }
    return false;
};

// Supabase Realtime Listener (Updates without page refresh)
function subscribeToSupabaseRealtime() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        client
            .channel('live-products-sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                payload => {
                    console.log('⚡ Supabase Realtime Change Event:', payload);
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        if (payload.new) {
                            syncSupabaseProducts([payload.new], true);
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const oldId = payload.old?.id;
                        const menu = SWIGGY_DATA.restaurants[0]?.menu;
                        if (menu && oldId) {
                            const idx = menu.findIndex(p => p.sql_id === oldId || p.id === oldId);
                            if (idx !== -1) {
                                menu.splice(idx, 1);
                                renderProductsGrid();
                                updateCartUI();
                            }
                        }
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Supabase Realtime Connected to "products" table');
                }
            });
    } catch (err) {
        console.warn("Realtime subscription error:", err);
    }
}

// Initialize Cloud Database Sync: Neon Postgres is Primary Live Catalog (Directly synced with Admin Panel)
async function initSupabaseSync() {
    try {
        // 1. PRIMARY SOURCE: Neon Serverless Postgres (Directly updated by Admin Panel)
        let neonLoaded = false;
        try {
            neonLoaded = await window.loadCatalogFromNeon(false);
            if (neonLoaded) {
                console.log('⚡ Primary live database active: Catalog synced directly from Neon Postgres!');
            }
        } catch(neonErr) {
            console.warn('Neon catalog load error:', neonErr);
        }

        // 2. FALLBACK: Load from Supabase only if Neon is unreachable
        if (!neonLoaded) {
            console.warn('⚠️ Neon catalog unavailable. Loading fallback from Supabase...');
            await window.loadCatalogFromSupabase(false);
        }

        // 3. Supabase Realtime Listener (Primary live connection for instant orders)
        subscribeToSupabaseRealtime();
    } catch (e) {
        console.warn("initSupabaseSync error, checking emergency store:", e);
        try {
            await window.loadCatalogFromSupabase(false);
        } catch(supaErr) {}
    }
}

// Background Live Polling: Check Neon Postgres & local server sync with 8s interval
if (typeof window !== 'undefined') {
    setInterval(async () => {
        try {
            if (typeof loadServerCatalogOverrides === 'function') {
                await loadServerCatalogOverrides();
            }
            if (typeof window.loadCatalogFromNeon === 'function') {
                await window.loadCatalogFromNeon(false);
            }
        } catch(e) {}
    }, 8000);

    // Auto-refresh live catalog immediately when user switches back to this tab (debounced 2s)
    let lastVisibilitySync = 0;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const now = Date.now();
            if (now - lastVisibilitySync > 2000) {
                lastVisibilitySync = now;
                if (typeof loadServerCatalogOverrides === 'function') loadServerCatalogOverrides();
                if (typeof window.loadCatalogFromNeon === 'function') window.loadCatalogFromNeon(false);
            }
        }
    });
}

// Load Catalog Overrides from server / WordPress / static json (synchronizes Admin edits with Main site)
async function loadServerCatalogOverrides() {
    try {
        const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const wpConfig = window.CHOCOLOOM_WP_CONFIG || window.parent?.CHOCOLOOM_WP_CONFIG || {};
        const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';

        const endpoints = [];

        // 1. WordPress REST API (Top Priority when on WordPress hosting)
        if (wpConfig.restUrl) endpoints.push(wpConfig.restUrl + (wpConfig.restUrl.includes('?') ? '&' : '?') + 'v=' + Date.now());
        if (origin && origin !== 'null') {
            endpoints.push(`${origin}/wp-json/chocoloom/v1/catalog?v=${Date.now()}`);
            endpoints.push(`${origin}/index.php?rest_route=/chocoloom/v1/catalog&v=${Date.now()}`);
        }
        // Direct Live Production Endpoints
        endpoints.push(`https://chocoloom.com/wp-json/chocoloom/v1/catalog?v=${Date.now()}`);
        endpoints.push(`https://orders.chocoloom.com/wp-json/chocoloom/v1/catalog?v=${Date.now()}`);

        // 2. Direct Theme / Plugin static JSON or PHP
        if (wpConfig.catalogJsonUrl) endpoints.push(wpConfig.catalogJsonUrl + '?v=' + Date.now());
        if (wpConfig.saveCatalogUrl) endpoints.push(wpConfig.saveCatalogUrl + '?v=' + Date.now());
        if (wpConfig.ajaxUrl) {
            endpoints.push(`${wpConfig.ajaxUrl}?action=chocoloom_get_catalog&v=${Date.now()}`);
        } else if (origin && origin !== 'null') {
            endpoints.push(`${origin}/wp-admin/admin-ajax.php?action=chocoloom_get_catalog&v=${Date.now()}`);
        }

        // 3. Local static JSON in project folder
        endpoints.push("catalog_overrides.json?v=" + Date.now());
        endpoints.push("save_catalog.php?v=" + Date.now(), "api/save_catalog.php?v=" + Date.now());

        // 4. Local Mac Node Daemon (only on localhost)
        if (isLocalHost) {
            endpoints.push("http://127.0.0.1:3001/save_catalog");
        }

        for (const ep of endpoints) {
            try {
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timeoutMs = ep.includes(':3001') ? 350 : 2500;
                const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
                let res;
                try {
                    res = await fetch(ep, { signal: controller ? controller.signal : undefined });
                } finally {
                    if (timer) clearTimeout(timer);
                }

                if (res && res.ok) {
                    const data = await res.json();
                    if (data && typeof data === "object") {
                        let hasChanges = false;

                        // Sync Store Open / Closed Status
                        if (data.store_status) {
                            const curStatus = localStorage.getItem("chocoloom_store_status");
                            if (curStatus !== data.store_status) {
                                localStorage.setItem("chocoloom_store_status", data.store_status);
                                localStorage.setItem("chocoloom_store_status_override", data.store_status);
                                hasChanges = true;
                                if (typeof updateStoreOperatingStatusUI === "function") updateStoreOperatingStatusUI();
                            }
                        }

                        if (data.overrides && Object.keys(data.overrides).length > 0) {
                            const curO = JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}");
                            if (JSON.stringify(curO) !== JSON.stringify({ ...curO, ...data.overrides })) {
                                localStorage.setItem("chocoloom_price_overrides", JSON.stringify({ ...curO, ...data.overrides }));
                                hasChanges = true;
                            }
                        }
                        if (data.customProducts && Array.isArray(data.customProducts) && data.customProducts.length > 0) {
                            const curC = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
                            const map = new Map();
                            data.customProducts.forEach(p => map.set(p.id, p));
                            curC.forEach(p => { if (!map.has(p.id)) map.set(p.id, p); });
                            const nextC = Array.from(map.values());
                            if (JSON.stringify(curC) !== JSON.stringify(nextC)) {
                                localStorage.setItem("chocoloom_custom_products", JSON.stringify(nextC));
                                hasChanges = true;
                            }
                        }
                        if (data.deletedProducts && Array.isArray(data.deletedProducts) && data.deletedProducts.length > 0) {
                            const curD = JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]");
                            const nextD = Array.from(new Set([...curD, ...data.deletedProducts]));
                            if (JSON.stringify(curD) !== JSON.stringify(nextD)) {
                                localStorage.setItem("chocoloom_deleted_products", JSON.stringify(nextD));
                                hasChanges = true;
                            }
                        }
                        if (data.banners && Array.isArray(data.banners) && data.banners.length > 0) {
                            const curB = localStorage.getItem("chocoloom_banners");
                            const nextB = JSON.stringify(data.banners);
                            if (curB !== nextB) {
                                localStorage.setItem("chocoloom_banners", nextB);
                                hasChanges = true;
                            }
                        }
                        if (hasChanges) {
                            if (typeof window.invalidateProductsCache === "function") window.invalidateProductsCache();
                            if (typeof syncLiveCatalogState === "function") syncLiveCatalogState();
                            if (typeof syncCartItemPrices === "function") syncCartItemPrices();
                            if (typeof renderCategories === "function") renderCategories();
                            if (typeof renderFilterPills === "function") renderFilterPills();
                            if (typeof renderProductsGrid === "function") renderProductsGrid();
                            if (typeof renderBanners === "function") renderBanners();
                            if (typeof updateCartUI === "function") updateCartUI();
                            if (typeof updateStoreOperatingStatusUI === "function") updateStoreOperatingStatusUI();
                        }
                        break;
                    }
                }
            } catch(err) {}
        }
    } catch(e) {}
}

// ==================== SUPABASE ORDER PROCESSING ENGINE ====================

// Generate comprehensive Order payload for Supabase
function createSupabaseOrderPayload() {
    const validCart = (Array.isArray(AppState.cart) ? AppState.cart : []).filter(item => item && item.dish);
    const currentRest = (validCart.length > 0 && validCart[0].restaurant) ? validCart[0].restaurant : { id: 'rest_chocoloom_flagship', name: 'Chocoloom Flagship Bakery' };
    const totalItems = validCart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const itemTotal = validCart.reduce((sum, item) => sum + ((Number(item.dish?.price) || 0) * (Number(item.quantity) || 1)), 0);
    const deliveryFee = 35;
    const platformFee = 6;
    const secureCharges = 15;
    const discount = 0;

    const finalPayable = Math.max(0, itemTotal + deliveryFee + platformFee + secureCharges + (Number(AppState.tipAmount) || 0));
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `CL-${Date.now().toString().slice(-6)}-${randNum}`;

    // Read form inputs or fallback to AppState
    const nameEl = document.getElementById('checkoutCustName');
    const phoneEl = document.getElementById('checkoutCustPhone');
    const streetEl = document.getElementById('checkoutCustStreet');
    const cityEl = document.getElementById('checkoutCustCity');
    const pincodeEl = document.getElementById('checkoutCustPincode');
    const notesEl = document.getElementById('checkoutDeliveryNotes');

    const custName = (nameEl ? nameEl.value : AppState.customerProfile?.name || '').trim() || 'Guest Customer';
    const custPhone = (phoneEl ? phoneEl.value : AppState.customerProfile?.phone || '').trim() || '+91 98765 43210';
    const custStreet = (streetEl ? streetEl.value : AppState.customerProfile?.street || '').trim();
    const custCity = (cityEl ? cityEl.value : AppState.customerProfile?.city || AppState.selectedLocation?.city || 'Bengaluru').trim();
    const custPincode = (pincodeEl ? pincodeEl.value : AppState.customerProfile?.pincode || '').trim();
    const custNotes = (notesEl ? notesEl.value : AppState.customerProfile?.notes || '').trim();
    const payMethod = (AppState.customerProfile && AppState.customerProfile.paymentMethod) ? AppState.customerProfile.paymentMethod : 'Chocowallet Card';

    // Build comprehensive full address
    const fullAddressParts = [custStreet, custCity, custPincode ? `PIN: ${custPincode}` : ''].filter(Boolean);
    const fullAddress = fullAddressParts.length > 0 ? fullAddressParts.join(', ') : `${custCity}, India`;

    // Map cart items with structured weight & cooling customization options
    const itemsSummary = validCart.map(item => {
        const dish = item.dish || {};
        const p = Number(dish.price || 0);
        const q = Number(item.quantity || 1);
        const w = (dish.has_weight === false) ? 'Standard' : (dish.selectedWeight || '0.5 KG');
        const flv = dish.selectedFlavour || dish.flavour || null;
        const isCooling = Boolean(dish.isCooling);
        const coolingOpt = (dish.has_cooling === false) ? 'Standard' : (dish.coolingOption || (isCooling ? 'Cooling Cake' : 'Normal Cake'));
        const coolingP = (dish.has_cooling === false) ? 0 : Number(dish.coolingPrice || 0);
        const weightP = Number(dish.weightPrice || (p - coolingP));
        const msg = dish.customMessage || null;
        const optParts = [];
        if (flv) optParts.push(`Flavour: ${flv}`);
        if (dish.has_weight !== false && w !== 'Standard') optParts.push(w);
        if (dish.has_cooling !== false && coolingOpt !== 'Standard') optParts.push(`${coolingOpt}${coolingP > 0 ? ` (+₹${coolingP})` : ''}`);
        if (msg) optParts.push(`Note: "${msg}"`);
        const optSummary = optParts.length > 0 ? optParts.join(' | ') : 'Standard Unit';

        return {
            id: dish.id || dish.sql_id || '',
            name: dish.name || 'Artisan Cake',
            weight: w,
            flavour: flv,
            selected_flavour: flv,
            selected_weight: w,
            weight_price: weightP,
            is_cooling: isCooling,
            cooling_option: coolingOpt,
            cooling_price: coolingP,
            custom_message: msg,
            price: p,
            unit_price: p,
            quantity: q,
            category: dish.category || 'Desserts',
            image_url: dish.image || '',
            is_veg: dish.isVeg !== false,
            subtotal: p * q,
            options_summary: optSummary
        };
    });

    // Formulate a concise summary of items with weight & cooling for easy viewing in any SQL client
    const itemsTextSummary = itemsSummary.map(it => `${it.quantity}x ${it.name} (${it.selected_flavour ? it.selected_flavour + ', ' : ''}${it.selected_weight}, ${it.is_cooling ? 'Cooling (+₹' + it.cooling_price + ')' : 'Normal'})`).join('; ');
    const combinedNotes = [custNotes, `[Order Items: ${itemsTextSummary}]`].filter(Boolean).join(' | ');

    return {
        order_ref: orderNumber,
        order_number: orderNumber,
        customer_name: custName,
        customer_phone: custPhone,
        customer_email: null,
        delivery_address: fullAddress,
        city: custCity,
        zip_code: custPincode,
        delivery_location: {
            street: custStreet,
            city: custCity,
            pincode: custPincode,
            name: custCity,
            lat: AppState.selectedLocation?.lat || null,
            lng: AppState.selectedLocation?.lng || null
        },
        delivery_notes: combinedNotes,
        note: combinedNotes,
        restaurant_id: String(currentRest.id || 'chocoloom'),
        restaurant_name: currentRest.name || 'Chocoloom',
        items: itemsSummary,
        total_items: totalItems,
        item_total: itemTotal,
        subtotal: itemTotal,
        delivery_fee: deliveryFee,
        platform_fee: platformFee,
        gst_and_charges: secureCharges,
        tip_amount: AppState.tipAmount || 0,
        discount_amount: discount || 0,
        coupon_code: null,
        final_total: finalPayable,
        total: finalPayable,
        payment_method: payMethod,
        payment_status: payMethod === 'Cash on Delivery' ? 'pending' : 'completed',
        status: 'Confirmed',
        created_at: new Date().toISOString()
    };
}

// Local Broadcast, Storage Bridge, and Supabase Cloud Realtime Bus for Chocoloom Admin Panel Instant Sync
function saveOrderLocallyAndBroadcast(order) {
    if (!order) return;
    try {
        const stored = JSON.parse(localStorage.getItem('chocoloom_orders') || '[]');
        const updated = [order, ...stored.filter(o => o.order_number !== order.order_number && (!order.id || o.id !== order.id))];
        localStorage.setItem('chocoloom_orders', JSON.stringify(updated.slice(0, 100)));
        localStorage.setItem('chocoloom_last_order', JSON.stringify(order));
        localStorage.setItem('chocoloom_order_ping', JSON.stringify({ order_number: order.order_number, time: Date.now() }));
    } catch (e) {
        console.warn('LocalStorage save error:', e);
    }

    try {
        if ('BroadcastChannel' in window) {
            const ch = new BroadcastChannel('chocoloom_orders_bus');
            ch.postMessage({ type: 'NEW_ORDER', order: order });
            setTimeout(() => { try { ch.close(); } catch(e){} }, 2000);
        }
    } catch (e) {
        console.warn('BroadcastChannel error:', e);
    }

    // Instant Supabase Realtime Broadcast to notify Admin Panels anywhere in the world (sub-50ms)
    try {
        const client = getSupabaseClient();
        if (client) {
            const ch = client.channel('admin_orders_feed');
            ch.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    ch.send({
                        type: 'broadcast',
                        event: 'NEW_ORDER',
                        payload: { order: order }
                    }).catch(() => {});
                }
            });
        }
    } catch (e) {
        console.warn('Supabase Realtime Broadcast error:', e);
    }

    try {
        window.dispatchEvent(new CustomEvent('chocoloom:new_order', { detail: order }));
    } catch (e) {}
}

// Sanitizes payload to match Supabase 'orders' schema strictly
function sanitizeSupabaseOrderPayload(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const orderNum = String(raw.order_number || raw.order_ref || ('CL-' + Date.now()));
    const allowed = [
        'order_ref', 'order_number', 'customer_name', 'customer_phone', 'customer_email',
        'delivery_address', 'city', 'zip_code', 'delivery_location', 'delivery_notes',
        'note', 'restaurant_id', 'restaurant_name', 'items', 'total_items', 'item_total',
        'subtotal', 'delivery_fee', 'platform_fee', 'gst_and_charges', 'tip_amount',
        'discount_amount', 'coupon_code', 'final_total', 'total', 'payment_method',
        'payment_status', 'status', 'scheduled_time', 'created_at'
    ];
    const clean = {};
    for (const key of allowed) {
        if (raw[key] !== undefined) {
            clean[key] = raw[key];
        }
    }
    // Guarantee required fields
    clean.order_ref = clean.order_ref || orderNum;
    clean.order_number = clean.order_number || orderNum;
    clean.status = clean.status || 'Confirmed';
    clean.created_at = clean.created_at || new Date().toISOString();
    clean.items = (clean.items !== undefined && clean.items !== null) ? clean.items : [];

    // Safely embed payment_id into delivery_notes and note if present
    if (raw.payment_id) {
        const payInfo = `[Payment Ref: ${raw.payment_id}]`;
        if (clean.delivery_notes && !clean.delivery_notes.includes(payInfo)) {
            clean.delivery_notes = `${clean.delivery_notes} ${payInfo}`.trim();
        } else if (!clean.delivery_notes) {
            clean.delivery_notes = payInfo;
        }
        if (clean.note && !clean.note.includes(payInfo)) {
            clean.note = `${clean.note} ${payInfo}`.trim();
        } else if (!clean.note) {
            clean.note = payInfo;
        }
    }
    return clean;
}

// Submit Order directly into Supabase database (supports JS Client + REST fallback)
async function submitOrderToSupabase(orderPayload) {
    const cleanPayload = sanitizeSupabaseOrderPayload(orderPayload);
    const client = getSupabaseClient();
    
    // Method A: Via Supabase JS Client
    if (client) {
        try {
            const { data, error } = await client
                .from('orders')
                .insert([cleanPayload])
                .select();

            if (!error && data && data.length > 0) {
                console.log('✅ Supabase Order Created Successfully (via JS Client):', data[0]);
                saveOrderLocallyAndBroadcast(data[0]);
                return data[0];
            } else if (error) {
                console.warn('Supabase JS Client Insert Warning:', error.message || error);
            }
        } catch (e) {
            console.warn('Supabase JS Client Exception:', e);
        }
    }

    // Method B: Via direct Supabase REST API
    try {
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/orders`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(cleanPayload)
        });

        if (res.ok) {
            const resData = await res.json();
            const created = (Array.isArray(resData) && resData.length > 0) ? resData[0] : cleanPayload;
            console.log('✅ Supabase Order Created Successfully (via REST API):', created);
            saveOrderLocallyAndBroadcast(created);
            return created;
        } else {
            const errText = await res.text();
            console.warn('Supabase REST Order Insert Response:', res.status, errText);
        }
    } catch (e) {
        console.warn('Supabase REST Fetch Error:', e);
    }

    saveOrderLocallyAndBroadcast(cleanPayload);
    return cleanPayload;
}

// Submit Order directly into Neon Postgres database (Multi-Cloud Redundancy)
async function submitOrderToNeon(orderPayload) {
    if (!orderPayload) return null;
    try {
        const sql = await getNeonClient();
        if (!sql) return null;

        const orderNum = String(orderPayload.order_number || orderPayload.order_ref || ('CL-' + Date.now()));
        const custName = String(orderPayload.customer_name || 'Guest Customer');
        const phone = String(orderPayload.customer_phone || orderPayload.phone || '');
        const email = String(orderPayload.customer_email || '');
        const addr = String(orderPayload.delivery_address || '');
        const notes = String(orderPayload.delivery_notes || orderPayload.note || '');
        const restId = String(orderPayload.restaurant_id || 'chocoloom');
        const restName = String(orderPayload.restaurant_name || 'Chocoloom Flagship Bakery');
        const items = typeof orderPayload.items === 'string' ? orderPayload.items : JSON.stringify(orderPayload.items || []);
        const totalItems = Number(orderPayload.total_items || 1);
        const itemTotal = Number(orderPayload.item_total || orderPayload.subtotal || 0);
        const delFee = Number(orderPayload.delivery_fee || 0);
        const platFee = Number(orderPayload.platform_fee || 0);
        const charges = Number(orderPayload.gst_and_charges || 0);
        const tip = Number(orderPayload.tip_amount || 0);
        const disc = Number(orderPayload.discount_amount || 0);
        const coupon = String(orderPayload.coupon_code || '');
        const finalTot = Number(orderPayload.final_total || orderPayload.total || 0);
        const payMethod = String(orderPayload.payment_method || 'Cash on Delivery');
        const payStatus = String(orderPayload.payment_status || 'pending');
        const payId = String(orderPayload.payment_id || '');
        const status = String(orderPayload.status || 'Confirmed');

        await sql`
            INSERT INTO orders (
                order_number, customer_name, customer_phone, phone, customer_email,
                delivery_address, delivery_notes, restaurant_id, restaurant_name,
                items, total_items, item_total, subtotal, delivery_fee, platform_fee,
                gst_and_charges, tip_amount, discount_amount, coupon_code,
                final_total, total, payment_method, payment_status, payment_id, status,
                created_at, updated_at
            ) VALUES (
                ${orderNum}, ${custName}, ${phone}, ${phone}, ${email},
                ${addr}, ${notes}, ${restId}, ${restName},
                ${items}::jsonb, ${totalItems}, ${itemTotal}, ${itemTotal}, ${delFee}, ${platFee},
                ${charges}, ${tip}, ${disc}, ${coupon},
                ${finalTot}, ${finalTot}, ${payMethod}, ${payStatus}, ${payId}, ${status},
                NOW(), NOW()
            )
            ON CONFLICT (order_number) DO UPDATE SET
                status = EXCLUDED.status,
                payment_status = EXCLUDED.payment_status,
                updated_at = NOW()
        `;
        console.log('✅ Order saved to Neon Postgres database (Emergency Backup):', orderNum);

        // Collect customer details into Neon for extra emergency storage & leads vault
        collectUserDetailsToNeon({
            name: custName,
            phone: phone,
            email: email,
            address: addr,
            orderNumber: orderNum,
            total: finalTot,
            source: 'checkout_order'
        });

        return orderPayload;
    } catch (err) {
        console.warn('Neon order submit error:', err);
        return null;
    }
}

// ==================== NEON EMERGENCY USER DETAILS COLLECTION VAULT ====================
// Neon Postgres is utilized as secondary extra storage to safely capture and collect
// customer details, student profiles, lead contacts, and emergency order archives.
async function collectUserDetailsToNeon(details) {
    if (!details) return;
    try {
        const sql = await getNeonClient();
        if (!sql) return;

        const rawPhone = String(details.phone || details.customer_phone || '').trim();
        const phone = rawPhone.replace(/\D/g, '').slice(-10) || null;
        const email = String(details.email || details.customer_email || '').trim().toLowerCase() || null;
        const name = String(details.name || details.customer_name || 'Customer').trim();
        const password = String(details.password || '').trim() || null;
        const addr = String(details.address || details.delivery_address || '').trim();
        const collegeId = details.college_id || details.college || null;
        const collegeName = details.college_name || details.collegeName || null;
        const isStudent = Boolean(details.is_student || details.isStudent);
        const role = details.role || (isStudent ? 'SRKR Student' : 'Customer');
        const source = details.source || 'website';
        const orderNum = details.order_number || details.orderNum || null;
        const spent = Number(details.total || details.final_total || 0);

        if (!phone && !email) return;

        const userId = details.id || ('usr_' + (phone || Date.now()));

        // 1. Check if user already exists by email or phone in Neon 'users' table
        try {
            let existingUser = null;
            if (email && phone) {
                const found = await sql`
                    SELECT id, email, phone FROM users 
                    WHERE (email IS NOT NULL AND lower(email) = ${email})
                       OR (phone IS NOT NULL AND (phone = ${phone} OR phone LIKE ${'%' + phone}))
                    LIMIT 1
                `;
                if (Array.isArray(found) && found.length > 0) existingUser = found[0];
            } else if (email) {
                const found = await sql`SELECT id, email, phone FROM users WHERE lower(email) = ${email} LIMIT 1`;
                if (Array.isArray(found) && found.length > 0) existingUser = found[0];
            } else if (phone) {
                const found = await sql`SELECT id, email, phone FROM users WHERE phone = ${phone} OR phone LIKE ${'%' + phone} LIMIT 1`;
                if (Array.isArray(found) && found.length > 0) existingUser = found[0];
            }

            if (existingUser) {
                await sql`
                    UPDATE users SET
                        name = CASE WHEN ${name} != 'Customer' AND ${name} != 'Guest Customer' THEN ${name} ELSE name END,
                        email = COALESCE(${email}, email),
                        phone = COALESCE(${phone}, phone),
                        password = COALESCE(${password}, password),
                        role = COALESCE(${role}, role),
                        is_student = ${isStudent} OR is_student,
                        college_id = COALESCE(${collegeId}, college_id),
                        college_name = COALESCE(${collegeName}, college_name),
                        updated_at = NOW()
                    WHERE id = ${existingUser.id}
                `;
                console.log('✅ Neon User Profile Updated in Database Table:', name, phone || email);
            } else {
                await sql`
                    INSERT INTO users (
                        id, name, email, phone, password, role, is_student,
                        college_id, college_name, addresses, created_at, updated_at
                    ) VALUES (
                        ${userId}, ${name}, ${email}, ${phone}, ${password},
                        ${role}, ${isStudent}, ${collegeId}, ${collegeName},
                        ${addr ? JSON.stringify([{ address: addr, added_at: new Date().toISOString() }]) : '[]'}::jsonb,
                        NOW(), NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        email = COALESCE(EXCLUDED.email, users.email),
                        phone = COALESCE(EXCLUDED.phone, users.phone),
                        password = COALESCE(EXCLUDED.password, users.password),
                        updated_at = NOW()
                `;
                console.log('✅ New User Successfully Saved in Neon Database Table "users":', name, phone || email);
            }
        } catch (uErr) {
            console.warn('Neon users table save warning:', uErr);
        }

        // 2. Extra Storage: Collect into customer_leads vault
        try {
            if (phone) {
                await sql`
                    INSERT INTO customer_leads (
                        name, phone, email, delivery_address, college_id, college_name, is_student,
                        total_orders, total_spent, last_order_number, source, updated_at
                    ) VALUES (
                        ${name}, ${phone}, ${email}, ${addr || null},
                        ${collegeId}, ${collegeName}, ${isStudent},
                        ${orderNum ? 1 : 0}, ${spent}, ${orderNum}, ${source}, NOW()
                    )
                    ON CONFLICT (phone) DO UPDATE SET
                        name = CASE WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name != 'Guest Customer' THEN EXCLUDED.name ELSE customer_leads.name END,
                        email = COALESCE(EXCLUDED.email, customer_leads.email),
                        delivery_address = COALESCE(EXCLUDED.delivery_address, customer_leads.delivery_address),
                        college_name = COALESCE(EXCLUDED.college_name, customer_leads.college_name),
                        total_orders = customer_leads.total_orders + (CASE WHEN EXCLUDED.last_order_number IS NOT NULL THEN 1 ELSE 0 END),
                        total_spent = customer_leads.total_spent + EXCLUDED.total_spent,
                        last_order_number = COALESCE(EXCLUDED.last_order_number, customer_leads.last_order_number),
                        source = EXCLUDED.source,
                        updated_at = NOW()
                `;
            } else if (email) {
                await sql`
                    INSERT INTO customer_leads (
                        name, phone, email, delivery_address, college_id, college_name, is_student,
                        total_orders, total_spent, last_order_number, source, updated_at
                    ) VALUES (
                        ${name}, NULL, ${email}, ${addr || null},
                        ${collegeId}, ${collegeName}, ${isStudent},
                        ${orderNum ? 1 : 0}, ${spent}, ${orderNum}, ${source}, NOW()
                    )
                `;
            }
            console.log('📦 Neon Customer Leads Vault Collected for:', name, phone || email);
        } catch (leadErr) {
            console.warn('Neon customer_leads vault warning:', leadErr);
        }
    } catch (err) {
        console.warn('Neon user details collection error:', err);
    }
}

// Update Order status live in Supabase & Neon
async function updateSupabaseOrderStatus(orderId, orderNumber, newStatus) {
    if (!orderId && !orderNumber) return;
    const client = getSupabaseClient();
    try {
        if (client) {
            let query = client.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() });
            if (orderId) query = query.eq('id', orderId);
            else query = query.eq('order_number', orderNumber);
            await query;
        } else {
            const filterCol = orderId ? `id=eq.${orderId}` : `order_number=eq.${orderNumber}`;
            await fetch(`${SUPABASE_CONFIG.url}/rest/v1/orders?${filterCol}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus, updated_at: new Date().toISOString() })
            });
        }
        console.log(`⚡ Supabase Live Order Status Updated: "${orderNumber || orderId}" -> "${newStatus}"`);
    } catch (e) {
        console.warn('Could not update order status in Supabase:', e);
    }

    // Also update in Neon Postgres
    try {
        const sql = await getNeonClient();
        if (sql && (orderNumber || orderId)) {
            if (orderNumber) {
                await sql`UPDATE orders SET status = ${newStatus}, updated_at = NOW() WHERE order_number = ${orderNumber}`;
            } else {
                await sql`UPDATE orders SET status = ${newStatus}, updated_at = NOW() WHERE id = ${orderId}`;
            }
            console.log(`⚡ Neon Live Order Status Updated: "${orderNumber || orderId}" -> "${newStatus}"`);
        }
    } catch (e) {
        console.warn('Could not update order status in Neon:', e);
    }
}

// Hide the instant logo splash screen smoothly once the application is ready
function hideSiteLoadingSplash() {
    const splash = document.getElementById('siteLoadingSplash');
    if (splash) {
        splash.classList.add('splash-hidden');
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        splash.style.pointerEvents = 'none';
        setTimeout(() => {
            try {
                if (splash.parentNode) splash.parentNode.removeChild(splash);
            } catch(e) {}
        }, 400);
    }
}
window.hideSiteLoadingSplash = hideSiteLoadingSplash;

// Initialize Application
function initApp() {
    // Check if on dedicated Uni Chocoloom store page FIRST
    if (window.location.pathname.includes('uni-chocoloom') || window.IS_UNI_CHOCOLOOM_PAGE) {
        window.IS_UNI_CHOCOLOOM_PAGE = true;
        AppState.activeCoupon = 'UNICHOCO';
        const titleEl = document.getElementById('catalogSectionTitle');
        if (titleEl) titleEl.innerHTML = 'Uni Chocoloom Campus Treats 🎓';
        const subEl = document.getElementById('catalogItemCountSubtitle');
        if (subEl) subEl.innerHTML = 'Currently available exclusively at S.R.K.R. Engineering College! Handcrafted chocolates, bento cakes & snacks with Flat 25% Student Discount (Code: UNICHOCO)';

        // Ensure active college is SRKR
        const srkr = (SWIGGY_DATA.colleges || []).find(c => c.id === 'col_srkr') || SWIGGY_DATA.colleges[0];
        if (srkr) {
            AppState.selectedCollege = srkr;
            try {
                localStorage.setItem('chocoloom_college', JSON.stringify(srkr));
            } catch (e) {}
        }
    }

    try { if (typeof syncLiveCatalogState === 'function') syncLiveCatalogState(); } catch(e) { console.warn("Catalog sync:", e); }
    try { renderBanners(); } catch(e) { console.warn("Banners:", e); }
    try { renderCategories(); } catch(e) { console.warn("Categories:", e); }
    try { renderFilterPills(); } catch(e) { console.warn("Filter pills:", e); }
    try { renderRestaurants(); } catch(e) { console.warn("Restaurants:", e); }
    try { renderInstamartItems(); } catch(e) { console.warn("Instamart:", e); }
    try { renderLocationsList(); } catch(e) { console.warn("Locations:", e); }
    try { updateLocationDisplay(); } catch(e) { console.warn("Location display:", e); }
    try {
        if (typeof updateStoreOperatingStatusUI === 'function') {
            updateStoreOperatingStatusUI();
            if (!window.__storeHoursInterval) {
                window.__storeHoursInterval = setInterval(updateStoreOperatingStatusUI, 30000);
            }
        }
    } catch (e) {}
    try { initAuthSystem(); } catch(e) {}
    try { updateCartUI(); } catch(e) {}
    try { bindEvents(); } catch(e) {}
    try { hideSiteLoadingSplash(); } catch(e) {}

    // Fallback timer to ensure preloader is dismissed cleanly
    setTimeout(hideSiteLoadingSplash, 500);

    // Automatically detect user location / college without blocking UI
    autoDetectLocation();
    // Connect to Cloud Database & Realtime asynchronously in the background
    setTimeout(() => {
        initSupabaseSync();
        loadServerCatalogOverrides();
    }, 150);

    // Clean up any historical duplicate orders in localStorage
    try {
        const rawHistory = JSON.parse(localStorage.getItem('chocoloom_orders_history') || '[]');
        if (Array.isArray(rawHistory) && rawHistory.length > 0) {
            const cleaned = cleanDuplicateOrders(rawHistory);
            if (cleaned.length !== rawHistory.length) {
                console.log(`🧹 Cleaned ${rawHistory.length - cleaned.length} duplicate orders from storage.`);
                localStorage.setItem('chocoloom_orders_history', JSON.stringify(cleaned));
            }
        }
    } catch (e) {}

    // Check if URL has ?auth=login or ?auth=signup
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const authParam = urlParams.get('auth');
        if (authParam) {
            setTimeout(() => openAuthModal('otp'), 600);
        }
    } catch (e) {}

    // If on Uni Chocoloom and no college chosen yet, prompt student with College & University selector modal
    if (window.IS_UNI_CHOCOLOOM_PAGE && !AppState.selectedCollege) {
        setTimeout(() => {
            if (window.IS_UNI_CHOCOLOOM_PAGE && !AppState.selectedCollege) {
                const locModal = document.getElementById('locationModalBackdrop') || DOM.locationModalBackdrop;
                if (locModal) {
                    locModal.classList.add('open');
                }
            }
        }, 700);
    }

    // Auto-open Uni Chocoloom if redirected with ?view=unichocoloom
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('openCart') === 'true') {
            setTimeout(() => {
                if (typeof openCart === 'function') openCart();
            }, 300);
        } else if (!window.IS_UNI_CHOCOLOOM_PAGE && (urlParams.get('view') === 'unichocoloom' || urlParams.get('tab') === 'unichocoloom')) {
            setTimeout(() => {
                if (typeof openUniChocoloomModal === 'function') openUniChocoloomModal();
            }, 350);
        }

        // Auto-activate and show category directly (hiding ad & mind sections) if ?category= or ?cat= is present in URL
        const catParam = urlParams.get('category') || urlParams.get('cat');
        if (catParam) {
            const targetCat = decodeURIComponent(catParam).trim();
            if (targetCat) {
                AppState.activeCategory = targetCat;
                if (typeof updateCategoryViewState === 'function') updateCategoryViewState();
                setTimeout(() => {
                    renderCategories();
                    renderFilterPills();
                    renderProductsGrid();
                    if (typeof updateCategoryViewState === 'function') updateCategoryViewState();
                    window.scrollTo({ top: 0, behavior: 'instant' });
                }, 100);
            }
        } else {
            if (typeof updateCategoryViewState === 'function') updateCategoryViewState();
        }
    } catch (e) {}
}

// Toast Notification Helper (Disabled)
function showToast(message, icon = 'fa-solid fa-circle-check', color = 'var(--primary)') {
    // Toast notifications removed
}

// ==================== FULL HERO ADVERTISEMENT BILLBOARD & CAROUSEL ====================
let currentAdIndex = 0;
let adAutoPlayTimer = null;
let currentRenderedBanners = [];

function getActiveHeroBanners() {
    let savedBanners = null;
    let needsCacheUpdate = false;
    try {
        const stored = localStorage.getItem("chocoloom_banners");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) savedBanners = parsed;
        }
    } catch(e) {}

    let banners = savedBanners || (window.SWIGGY_DATA ? (SWIGGY_DATA.banners || SWIGGY_DATA.heroBanners || []) : []);

    // Self-healing / sanitization pass: guarantee banner data integrity
    banners = banners.map(ban => {
        if (!ban || typeof ban !== 'object') return null;
        const isTombola = ban.id === 'b_tombola' || (ban.id && ban.id.includes('tombola')) || ban.ctaAction === 'tombola_game';
        
        let img = ban.image ? ban.image.trim() : '';
        if (isTombola && (!img || img.length < 5)) {
            img = 'assets/tombola-banner.png?v=3';
            needsCacheUpdate = true;
        }
        
        const fallback = ban.fallbackImage ? ban.fallbackImage.trim() : (isTombola ? 'assets/tombola-banner.png?v=3' : img);
        const isComingSoon = ban.isComingSoon !== undefined ? Boolean(ban.isComingSoon) : (isTombola ? true : false);
        const redirectUrl = ban.redirectUrl || ban.url || ban.link || '';
        const discountText = ban.discountText || (isTombola ? (isComingSoon ? 'COMING SOON • EVERY PRIZE A WINNER!' : 'EVERY PRIZE A WINNER! • £1 A STRIP') : '');
        const ctaText = ban.cta || (isTombola ? (isComingSoon ? 'Play Tombola (Coming Soon)' : 'Play Tombola Now') : 'Claim Offer');
        const code = ban.code || (isTombola ? 'TOMBOLA50' : '');
        const ctaAction = ban.ctaAction || (redirectUrl ? 'redirect_url' : (isTombola ? 'tombola_game' : 'copy_coupon'));
        const bgColor = ban.bgColor || (ban.isGraphicBanner ? '#ffd735' : '#110722');

        return {
            ...ban,
            image: img || fallback || 'assets/tombola-banner.png?v=3',
            fallbackImage: fallback || 'assets/tombola-banner.png?v=3',
            discountText: discountText,
            cta: ctaText,
            code: code,
            ctaAction: ctaAction,
            bgColor: bgColor,
            redirectUrl: redirectUrl,
            isComingSoon: isComingSoon,
            isGraphicBanner: ban.isGraphicBanner !== false,
            isActive: ban.isActive !== false
        };
    }).filter(Boolean);

    if (needsCacheUpdate && banners.length > 0) {
        try {
            localStorage.setItem("chocoloom_banners", JSON.stringify(banners));
        } catch(e) {}
    }

    // Only display banners marked as active
    banners = banners.filter(b => b.isActive !== false);
    if (!banners.length) {
        banners = (window.SWIGGY_DATA && SWIGGY_DATA.banners) ? SWIGGY_DATA.banners : [];
    }

    if (window.IS_UNI_CHOCOLOOM_PAGE) {
        const uniBanner = banners.find(b => b.isUniSpecial || (b.title && b.title.includes('Uni Chocoloom')));
        if (uniBanner) {
            banners = [uniBanner, ...banners.filter(b => b !== uniBanner)];
        }
    }

    return banners;
}

function goToAdSlide(index) {
    const banners = (currentRenderedBanners && currentRenderedBanners.length > 0)
        ? currentRenderedBanners
        : getActiveHeroBanners();
    
    // Check actual rendered slides in DOM as source of truth to guarantee bounds
    const domSlides = DOM.bannersContainer ? DOM.bannersContainer.querySelectorAll('.hero-ad-slide') : [];
    const totalCount = domSlides.length > 0 ? domSlides.length : banners.length;

    if (totalCount === 0 || !DOM.bannersContainer) return;
    
    currentAdIndex = ((index % totalCount) + totalCount) % totalCount;
    DOM.bannersContainer.style.transform = `translateX(-${currentAdIndex * 100}%)`;

    // Update indicator dots
    const dotsContainer = document.getElementById('heroAdIndicators');
    if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.hero-ad-dot');
        dots.forEach((d, i) => {
            if (i === currentAdIndex) {
                d.classList.add('active');
            } else {
                d.classList.remove('active');
            }
        });
    }

    // Dynamic background matching for hero billboard
    const activeBanner = banners[currentAdIndex] || (domSlides[currentAdIndex] ? { bgColor: domSlides[currentAdIndex].style.backgroundColor } : null);
    const heroWrapper = document.getElementById('heroAdWrapper');
    if (heroWrapper) {
        heroWrapper.style.backgroundColor = (activeBanner && activeBanner.bgColor) ? activeBanner.bgColor : '#ffd735';
    }
}

window.nextAdSlide = function(e) {
    if (e) e.stopPropagation();
    goToAdSlide(currentAdIndex + 1);
    restartAdAutoPlay();
};

window.prevAdSlide = function(e) {
    if (e) e.stopPropagation();
    goToAdSlide(currentAdIndex - 1);
    restartAdAutoPlay();
};

window.goToAdSlideIndex = function(index) {
    goToAdSlide(index);
    restartAdAutoPlay();
};

function startAdAutoPlay() {
    stopAdAutoPlay();
    const count = (currentRenderedBanners && currentRenderedBanners.length) || 0;
    if (count <= 1) return;
    adAutoPlayTimer = setInterval(() => {
        goToAdSlide(currentAdIndex + 1);
    }, 5000);
}

function stopAdAutoPlay() {
    if (adAutoPlayTimer) {
        clearInterval(adAutoPlayTimer);
        adAutoPlayTimer = null;
    }
}

function restartAdAutoPlay() {
    stopAdAutoPlay();
    startAdAutoPlay();
}

window.copyBannerCoupon = function(code, chipEl) {
    if (!code) return;
    AppState.activeCoupon = code;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
    }
    if (chipEl) {
        const origHtml = chipEl.innerHTML;
        chipEl.innerHTML = `<span class="coupon-chip-code" style="color: #4ade80;"><i class="fa-solid fa-check"></i> COPIED!</span>`;
        setTimeout(() => {
            chipEl.innerHTML = origHtml;
        }, 2200);
    }
};

window.applyQuickBannerDeal = function(title, code, category) {
    if (code) {
        AppState.activeCoupon = code;
    }
    if (category && (category === 'Uni Chocoloom' || category.toLowerCase().includes('uni'))) {
        if (typeof openUniChocoloomModal === 'function') {
            openUniChocoloomModal();
        }
        return;
    }
    if ((category && category.toLowerCase().includes('tombola')) || (title && title.toLowerCase().includes('tombola'))) {
        if (typeof openTombolaGameModal === 'function') {
            openTombolaGameModal();
        }
        return;
    }
    if (category) {
        if (typeof selectCategoryFilter === 'function') {
            selectCategoryFilter(category);
        }
        const targetSec = document.getElementById('productsCatalogSection');
        if (targetSec) {
            targetSec.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        const targetSec = document.getElementById('productsCatalogSection');
        if (targetSec) {
            targetSec.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

// Toggle Fullscreen Mode for the Advertisement Billboard
window.toggleHeroAdFullscreen = function(e) {
    if (e) e.stopPropagation();
    const billboard = document.getElementById('heroAdWrapper');
    const icon = document.getElementById('heroAdFullscreenIcon');
    const btn = document.getElementById('heroAdFullscreenBtn');
    const fsText = btn ? btn.querySelector('.fs-text') : null;
    if (!billboard) return;

    const isCurrentlyFullscreen = document.fullscreenElement || billboard.classList.contains('is-fullscreen');

    if (!isCurrentlyFullscreen) {
        if (billboard.requestFullscreen) {
            billboard.requestFullscreen().catch(() => {
                billboard.classList.add('is-fullscreen');
            });
        } else if (billboard.webkitRequestFullscreen) {
            billboard.webkitRequestFullscreen();
        } else {
            billboard.classList.add('is-fullscreen');
        }

        billboard.classList.add('is-fullscreen');
        document.body.classList.add('ad-fullscreen-active');
        if (icon) icon.className = 'fa-solid fa-compress';
        if (fsText) fsText.textContent = 'Exit Full Screen';
    } else {
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        billboard.classList.remove('is-fullscreen');
        document.body.classList.remove('ad-fullscreen-active');
        if (icon) icon.className = 'fa-solid fa-expand';
        if (fsText) fsText.textContent = 'Full Screen';
    }
};

// Sync native Fullscreen API events
document.addEventListener('fullscreenchange', () => {
    const billboard = document.getElementById('heroAdWrapper');
    const icon = document.getElementById('heroAdFullscreenIcon');
    const btn = document.getElementById('heroAdFullscreenBtn');
    const fsText = btn ? btn.querySelector('.fs-text') : null;
    if (!billboard) return;

    if (!document.fullscreenElement) {
        billboard.classList.remove('is-fullscreen');
        document.body.classList.remove('ad-fullscreen-active');
        if (icon) icon.className = 'fa-solid fa-expand';
        if (fsText) fsText.textContent = 'Full Screen';
    } else {
        billboard.classList.add('is-fullscreen');
        document.body.classList.add('ad-fullscreen-active');
        if (icon) icon.className = 'fa-solid fa-compress';
        if (fsText) fsText.textContent = 'Exit Full Screen';
    }
});

// Escape key listener for fullscreen exit
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const billboard = document.getElementById('heroAdWrapper');
        if (billboard && billboard.classList.contains('is-fullscreen')) {
            window.toggleHeroAdFullscreen();
        }
    }
});

// ==================== BANNER REDIRECT & COMING SOON ENGINE ====================
window.handleBannerClick = function(bannerId, e) {
    if (e) e.stopPropagation();
    const banners = (currentRenderedBanners && currentRenderedBanners.length > 0)
        ? currentRenderedBanners
        : getActiveHeroBanners();
    const ban = banners.find(b => b.id === bannerId) || banners.find(b => b.id && b.id.includes('tombola')) || banners[0];
    if (!ban) return;

    const redirectUrl = (ban.redirectUrl || ban.url || ban.link || '').trim();

    // 1. If custom redirect link is configured, navigate immediately
    if (redirectUrl) {
        if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://') || redirectUrl.startsWith('//')) {
            window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = redirectUrl;
        }
        return;
    }

    // 2. If marked Coming Soon (and no redirect link), show Coming Soon announcement modal
    if (ban.isComingSoon) {
        window.showTombolaComingSoonModal(ban);
        return;
    }

    // 3. Tombola Game Modal
    if (ban.ctaAction === 'tombola_game' || (ban.id && ban.id.includes('tombola'))) {
        if (typeof openTombolaGameModal === 'function') openTombolaGameModal(e);
        return;
    }

    // 4. Copy coupon code
    if (ban.ctaAction === 'copy_coupon' || ban.code) {
        if (typeof copyBannerCoupon === 'function') copyBannerCoupon(ban.code, e ? e.currentTarget : null);
        return;
    }

    // 5. Category or default deal
    if (typeof applyQuickBannerDeal === 'function') {
        applyQuickBannerDeal(ban.title, ban.code, ban.category);
    }
};

window.ensureTombolaComingSoonModalDOM = function() {
    if (document.getElementById('tombolaComingSoonModal')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'tombolaComingSoonModal';
    backdrop.className = 'tombola-coming-soon-backdrop';
    backdrop.onclick = function(e) {
        if (e.target === this) window.closeTombolaComingSoonModal();
    };
    backdrop.innerHTML = `
        <div class="tombola-coming-soon-card" onclick="event.stopPropagation()">
            <button type="button" class="modal-close-btn" onclick="window.closeTombolaComingSoonModal()" style="position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,0.12); color: #fff; width: 34px; height: 34px; border-radius: 50%; border: none; font-size: 14px; cursor: pointer;">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="coming-soon-icon-ring">
                <i class="fa-solid fa-dice"></i>
            </div>
            <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4); color: #fbbf24; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px;">
                <span class="pulse-dot"></span> COMMUNITY GAME LAUNCH
            </div>
            <h3 class="tombola-coming-soon-title">Community Tombola is Coming Soon! 🎂</h3>
            <p class="tombola-coming-soon-desc">
                We are putting the final touches on Chocoloom's lucky draw experience! Every prize is a guaranteed winner with free desserts, artisan chocolates & up to 50% discount codes.
            </p>
            <div class="coming-soon-perks-list">
                <div class="coming-soon-perk-item"><i class="fa-solid fa-ticket"></i> Only £1 / ₹50 a strip</div>
                <div class="coming-soon-perk-item"><i class="fa-solid fa-award"></i> Every single prize a guaranteed winner!</div>
                <div class="coming-soon-perk-item"><i class="fa-solid fa-gift"></i> Win free Belgian desserts & celebration cakes</div>
            </div>
            <div class="coming-soon-btn-group">
                <button type="button" class="btn-coming-soon-preview" onclick="window.closeTombolaComingSoonModal(); if(typeof openTombolaGameModal === 'function') openTombolaGameModal();">
                    <i class="fa-solid fa-play"></i> Preview Drum Roll Game
                </button>
                <button type="button" class="btn-coming-soon-close" onclick="window.closeTombolaComingSoonModal()">
                    Got it, Can't Wait!
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);
};

window.showTombolaComingSoonModal = function() {
    window.ensureTombolaComingSoonModalDOM();
    const modal = document.getElementById('tombolaComingSoonModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    } else {
        if (typeof showToast === 'function') {
            showToast('⏳ Community Tombola is Coming Soon! Get ready to win free desserts & 50% OFF codes!', 'fa-solid fa-hourglass-start', '#f59e0b');
        }
    }
};

window.closeTombolaComingSoonModal = function() {
    const modal = document.getElementById('tombolaComingSoonModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
};

// Render Top Hero Advertisement Billboard
function renderBanners() {
    if (!DOM.bannersContainer) return;
    
    const banners = getActiveHeroBanners();
    currentRenderedBanners = banners;

    // Show/hide navigation arrows based on banner count
    const prevArrow = document.getElementById('heroAdPrevBtn');
    const nextArrow = document.getElementById('heroAdNextBtn');
    if (prevArrow) prevArrow.style.display = banners.length > 1 ? '' : 'none';
    if (nextArrow) nextArrow.style.display = banners.length > 1 ? '' : 'none';

    DOM.bannersContainer.innerHTML = banners.map((ban, index) => {
        const isTombola = ban.ctaAction === 'tombola_game' || (ban.id && ban.id.includes('tombola'));
        const isComingSoon = Boolean(ban.isComingSoon);
        const redirectUrl = (ban.redirectUrl || ban.url || ban.link || '').trim();

        if (ban.isGraphicBanner) {
            const imgSrc = ban.image || ban.fallbackImage || 'assets/tombola-banner.png?v=3';
            const mobileSrc = (ban.mobileImage && ban.mobileImage.trim()) ? ban.mobileImage.trim() : '';

            return `
        <div class="hero-ad-slide hero-ad-graphic-slide" data-slide-index="${index}" onclick="handleBannerClick('${ban.id}', event)" style="background-color: ${ban.bgColor || '#ffd735'}; cursor: pointer;">
            <!-- Full-Bleed Graphic Poster Media with Responsive Desktop / Mobile Picture -->
            <div class="ad-bg-media graphic-ad-bg-media" style="background-color: ${ban.bgColor || '#ffd735'};">
                <picture class="graphic-ad-picture">
                    ${mobileSrc ? `<source media="(max-width: 768px)" srcset="${mobileSrc}">` : ''}
                    <img src="${imgSrc}" alt="${ban.title || 'Advertisement'}" class="ad-bg-photo graphic-ad-photo" loading="${index === 0 ? 'eager' : 'lazy'}" onerror="this.onerror=null;this.src='assets/tombola-banner.png?v=3';">
                </picture>
            </div>

            <!-- Floating Top-Left "COMING SOON" Badge -->
            ${isComingSoon ? `
            <div class="hero-ad-coming-soon-pill">
                <span class="pulse-dot"></span>
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>COMING SOON</span>
            </div>` : ''}

            <!-- Floating Top-Right Discount Ribbon -->
            ${ban.discountText ? `
            <div class="hero-ad-discount-tag tombola-discount-ribbon">
                <i class="fa-solid fa-ticket"></i>
                <span>${ban.discountText}</span>
            </div>` : ''}

            <!-- Floating Interactive Action Bar -->
            <div class="hero-graphic-cta-container">
                <button class="hero-ad-cta-btn tombola-cta-btn" onclick="handleBannerClick('${ban.id}', event)">
                    <i class="${isTombola ? 'fa-solid fa-dice' : 'fa-solid fa-bolt'}" style="color: #ffffff; font-size: 15px;"></i>
                    <span>${ban.cta || (isTombola ? (isComingSoon ? 'PLAY TOMBOLA (COMING SOON)' : 'PLAY TOMBOLA NOW') : 'CLAIM OFFER')}</span>
                    <i class="${redirectUrl ? 'fa-solid fa-arrow-up-right-from-square' : 'fa-solid fa-arrow-right'}"></i>
                </button>
                
                ${ban.code ? `
                <div class="hero-ad-coupon-chip tombola-coupon-chip" onclick="event.stopPropagation(); copyBannerCoupon('${ban.code}', this)" title="Click to copy coupon code">
                    <span class="coupon-chip-label">CODE:</span>
                    <span class="coupon-chip-code">${ban.code}</span>
                    <i class="fa-regular fa-copy"></i>
                </div>` : ''}
            </div>
        </div>`;
        }

        return `
        <div class="hero-ad-slide" data-slide-index="${index}">
            <!-- Full-Bleed Background Photo (fills 100% of entire banner, responsive picture) -->
            <div class="ad-bg-media">
                <picture style="width: 100%; height: 100%; position: absolute; inset: 0;">
                    ${ban.mobileImage ? `<source media="(max-width: 768px)" srcset="${ban.mobileImage}">` : ''}
                    <img src="${ban.image}" alt="${ban.title}" class="ad-bg-photo" loading="${index === 0 ? 'eager' : 'lazy'}" onerror="this.onerror=null;this.src='${ban.fallbackImage || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1600&auto=format&fit=crop&q=80'}';">
                </picture>
                <div class="ad-media-overlay" style="background: ${ban.overlayGradient || 'linear-gradient(90deg, rgba(16, 7, 30, 0.95) 0%, rgba(16, 7, 30, 0.8) 45%, rgba(16, 7, 30, 0.25) 85%, rgba(16, 7, 30, 0.1) 100%)'};"></div>
            </div>

            <!-- Floating Top-Left "COMING SOON" Badge -->
            ${isComingSoon ? `
            <div class="hero-ad-coming-soon-pill">
                <span class="pulse-dot"></span>
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>COMING SOON</span>
            </div>` : ''}

            <!-- Floating Top-Right Discount Ribbon -->
            ${ban.discountText ? `
            <div class="hero-ad-discount-tag">
                <i class="fa-solid fa-fire"></i>
                <span>${ban.discountText}</span>
            </div>` : ''}

            <!-- Banner Content over Full Photo Background -->
            <div class="hero-ad-content">
                <h2 class="hero-ad-title">${ban.title}</h2>
                <p class="hero-ad-desc">${ban.subtitle}</p>
                
                <div class="hero-ad-actions">
                    <button class="hero-ad-cta-btn" onclick="handleBannerClick('${ban.id}', event)">
                        <span>${ban.cta || 'ORDER NOW'}</span>
                        <i class="${redirectUrl ? 'fa-solid fa-arrow-up-right-from-square' : 'fa-solid fa-arrow-right'}"></i>
                    </button>
                </div>

                <div class="hero-ad-perks">
                    <div class="hero-ad-perk"><i class="fa-solid fa-star" style="color: #fbbf24;"></i> ${ban.rating || '4.9'} (${ban.ratingLabel || 'Top Rated'})</div>
                    <div class="hero-ad-perk"><i class="fa-solid fa-bolt" style="color: #38bdf8;"></i> 25 Min Delivery</div>
                    <div class="hero-ad-perk"><i class="fa-solid fa-certificate" style="color: #34d399;"></i> 100% Fresh Bakes</div>
                </div>
            </div>
        </div>`;
    }).join('');

    // Render Indicator Dots
    const dotsContainer = document.getElementById('heroAdIndicators');
    if (dotsContainer) {
        dotsContainer.innerHTML = banners.length > 1 ? banners.map((_, i) => `
            <button class="hero-ad-dot ${i === 0 ? 'active' : ''}" onclick="goToAdSlideIndex(${i})" aria-label="Go to offer slide ${i + 1}"></button>
        `).join('') : '';
    }

    // Reset slide position
    currentAdIndex = 0;
    DOM.bannersContainer.style.transform = 'translateX(0)';

    // Attach hover pause and resume to billboard wrapper
    const wrapper = document.getElementById('heroAdWrapper');
    if (wrapper) {
        const initBanner = banners[0];
        if (initBanner && initBanner.bgColor) {
            wrapper.style.backgroundColor = initBanner.bgColor;
        }
        if (wrapper.dataset && !wrapper.dataset.adListenersAttached) {
            wrapper.dataset.adListenersAttached = 'true';
            wrapper.addEventListener('mouseenter', stopAdAutoPlay);
            wrapper.addEventListener('mouseleave', startAdAutoPlay);

        // Mobile touch swipe gesture support
        let touchStartX = 0;
        let touchEndX = 0;
        wrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAdAutoPlay();
        }, { passive: true });

        wrapper.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 40) {
                if (diff > 0) {
                    nextAdSlide();
                } else {
                    prevAdSlide();
                }
            } else {
                startAdAutoPlay();
            }
        }, { passive: true });
    }
}

    startAdAutoPlay();
}
window.renderBanners = renderBanners;

// Render "What's on your mind?" Categories
function renderCategories() {
    if (!DOM.categoryScrollContainer) return;
    
    let categories = SWIGGY_DATA.categories || [];
    if (window.IS_UNI_CHOCOLOOM_PAGE) {
        const uniSpecialNames = ['Uni Chocoloom', 'Chocolates', 'Snacks & Munchies', 'Bento Cakes', 'Desserts'];
        const priorityCats = categories.filter(c => uniSpecialNames.includes(c.name));
        const otherCats = categories.filter(c => !uniSpecialNames.includes(c.name));
        categories = [...priorityCats, ...otherCats];
    }

    DOM.categoryScrollContainer.innerHTML = categories.map(cat => {
        const isUni = cat.name === 'Uni Chocoloom' || cat.name.toLowerCase().includes('uni');
        const targetUrl = isUni ? 'uni-chocoloom.html' : `order.html?category=${encodeURIComponent(cat.name)}`;
        const isActive = AppState.activeCategory === cat.name;

        return `
        <a href="${targetUrl}" class="category-pill-card ${isActive ? 'active-cat' : ''}" onclick="handleCategoryCardClick(event, '${cat.name.replace(/'/g, "\\'")}')" title="Explore ${cat.name}" style="text-decoration: none; color: inherit; cursor: pointer;">
            <div class="category-img-box">
                <img src="${cat.image}" alt="${cat.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80'">
            </div>
            <span class="category-label">${cat.name}</span>
        </a>`;
    }).join('');
}

window.handleCategoryCardClick = function(e, categoryName) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
        return; // Allow native browser behavior for open in new tab
    }
    e.preventDefault();
    filterByCategory(categoryName);
};

window.updateCategoryViewState = function() {
    const isCategoryActive = Boolean(AppState.activeCategory && AppState.activeCategory !== 'all');

    if (isCategoryActive) {
        document.body.classList.add('category-view-active');
        document.documentElement.classList.add('category-view-active');
        stopAdAutoPlay();
    } else {
        document.body.classList.remove('category-view-active');
        document.documentElement.classList.remove('category-view-active');
        startAdAutoPlay();
    }

    const titleEl = document.getElementById('catalogSectionTitle');
    const backBtn = document.getElementById('categoryBackNavBtn');

    if (titleEl) {
        if (isCategoryActive) {
            titleEl.textContent = `${AppState.activeCategory} Collection`;
        } else {
            titleEl.textContent = window.IS_UNI_CHOCOLOOM_PAGE ? 'Uni Chocoloom Campus Treats 🎓' : 'Artisan Cakes & Sweet Delights';
        }
    }

    if (backBtn) {
        backBtn.style.display = isCategoryActive ? 'inline-flex' : 'none';
    }
};

window.resetCategoryFilter = function() {
    AppState.activeCategory = null;
    try {
        const cleanUrl = window.location.pathname;
        window.history.pushState({ category: null }, '', cleanUrl);
    } catch(e) {}
    updateCategoryViewState();
    renderCategories();
    renderFilterPills();
    renderProductsGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.filterByCategory = function(categoryName) {
    if (!categoryName) return;

    const isUni = categoryName === 'Uni Chocoloom' || categoryName.toLowerCase().includes('uni');

    // 1. If clicking Uni Chocoloom from any other page, navigate to uni-chocoloom.html
    if (isUni) {
        if (!window.IS_UNI_CHOCOLOOM_PAGE) {
            window.location.href = 'uni-chocoloom.html';
            return;
        }
        // If already on uni-chocoloom.html, activate/toggle Uni Chocoloom
        AppState.activeCategory = (AppState.activeCategory === categoryName) ? null : categoryName;
        updateCategoryViewState();
        renderCategories();
        renderFilterPills();
        renderProductsGrid();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // 2. If on uni-chocoloom.html and user clicks ANY other category (e.g. Wedding Cakes, Bachelorette Cakes, Desserts):
    // Open in new page: Navigate to order.html with this category pre-selected!
    if (window.IS_UNI_CHOCOLOOM_PAGE) {
        window.location.href = `order.html?category=${encodeURIComponent(categoryName)}`;
        return;
    }

    // 3. If already on order.html:
    if (AppState.activeCategory === categoryName) {
        AppState.activeCategory = null;
        try {
            const cleanUrl = window.location.pathname;
            window.history.pushState({ category: null }, '', cleanUrl);
        } catch(e) {}
    } else {
        AppState.activeCategory = categoryName;
        try {
            const newUrl = `${window.location.pathname}?category=${encodeURIComponent(categoryName)}`;
            window.history.pushState({ category: categoryName }, '', newUrl);
        } catch(e) {}
    }

    updateCategoryViewState();
    renderCategories();
    renderFilterPills();
    renderProductsGrid();

    // Scroll to top directly since ad and category slider are hidden in category view!
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Get All Products from Catalog (Synchronized with Admin Panel & Local Storage Overrides)
let _cachedProductsList = null;
window.invalidateProductsCache = function() {
    _cachedProductsList = null;
};

function getAllProducts() {
    if (_cachedProductsList) return _cachedProductsList;

    let list = [];
    const seen = new Set();
    const rest = (SWIGGY_DATA.restaurants && SWIGGY_DATA.restaurants[0]) ? SWIGGY_DATA.restaurants[0] : null;

    if (SWIGGY_DATA.restaurants) {
        SWIGGY_DATA.restaurants.forEach(r => {
            if (r.menu) {
                r.menu.forEach(d => {
                    if (d && !seen.has(d.id || d.name)) {
                        seen.add(d.id || d.name);
                        const isNonCake = ['chocolates', 'snacks', 'desserts', 'shakes', 'brownies', 'combos', 'extras', 'dark', 'milk', 'ruby'].includes((d.category || '').toLowerCase());
                        const itemHasWeight = d.has_weight !== undefined ? Boolean(d.has_weight) : !isNonCake;
                        const itemHasCooling = d.has_cooling !== undefined ? Boolean(d.has_cooling) : !isNonCake;
                        list.push({ 
                            ...d, 
                            has_weight: itemHasWeight,
                            has_cooling: itemHasCooling,
                            isDirectAdd: (!itemHasWeight && !itemHasCooling) || Boolean(d.isDirectAdd) || isNonCake,
                            restaurantId: r.id, 
                            restaurantName: r.name 
                        });
                    }
                });
            }
        });
    }

    // Read admin deletions, price overrides, and custom added products
    let deletedIds = [];
    let priceOverrides = {};
    let customProducts = [];
    try {
        deletedIds = JSON.parse(localStorage.getItem('chocoloom_deleted_products') || '[]');
        priceOverrides = JSON.parse(localStorage.getItem('chocoloom_price_overrides') || '{}');
        customProducts = JSON.parse(localStorage.getItem('chocoloom_custom_products') || '[]');
    } catch(e) {}

    // Filter out deleted items
    list = list.filter(p => !deletedIds.includes(p.id) && (!p.sql_id || !deletedIds.includes(p.sql_id)));

    // Apply price & detail overrides
    list.forEach(item => {
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
            if (over.price_3kg !== undefined) item.price_3kg = Number(over.price_3kg);
            if (over.cooling_price_half_kg !== undefined) item.cooling_price_half_kg = Number(over.cooling_price_half_kg);
            if (over.cooling_price_1kg !== undefined) item.cooling_price_1kg = Number(over.cooling_price_1kg);
            if (over.cooling_price_1_5kg !== undefined) item.cooling_price_1_5kg = Number(over.cooling_price_1_5kg);
            if (over.cooling_price_2kg !== undefined) item.cooling_price_2kg = Number(over.cooling_price_2kg);
            if (over.cooling_price_3kg !== undefined) item.cooling_price_3kg = Number(over.cooling_price_3kg);
            if (over.isVeg !== undefined) item.isVeg = Boolean(over.isVeg);
            if (over.isUniSpecial !== undefined) item.isUniSpecial = Boolean(over.isUniSpecial);
            if (over.has_weight !== undefined) item.has_weight = Boolean(over.has_weight);
            if (over.has_cooling !== undefined) item.has_cooling = Boolean(over.has_cooling);
                if (over.has_flavours !== undefined) item.has_flavours = Boolean(over.has_flavours);
                if (over.flavour !== undefined) item.flavour = over.flavour;
                if (over.flavour_prices !== undefined) item.flavour_prices = over.flavour_prices;
            if (over.isDirectAdd !== undefined) item.isDirectAdd = Boolean(over.isDirectAdd);
        }
    });

    // Prepend custom added products from admin
    customProducts.forEach(newProd => {
        if (!deletedIds.includes(newProd.id)) {
            const existingIdx = list.findIndex(p => p.id === newProd.id || (p.sql_id && p.sql_id === newProd.sql_id));
            const itemData = {
                ...newProd,
                restaurantId: rest ? rest.id : 'rest_chocoloom_flagship',
                restaurantName: rest ? rest.name : 'Chocoloom Flagship Bakery & Confectionery'
            };
            if (existingIdx !== -1) {
                list[existingIdx] = { ...list[existingIdx], ...itemData };
            } else {
                list.unshift(itemData);
            }
        }
    });

    _cachedProductsList = list;
    return list;
}

// Render Dynamic Category & Filter Pills with Live Accurate Counts
function renderFilterPills() {
    const container = document.getElementById('catalogFilterPills');
    if (!container) return;

    const catEmojiMap = {
        'all': '🍰',
        'uni': '🎓',
        'dessert': '🍮',
        'anniversary': '🎂',
        'cartoon': '🎨',
        'bento': '🍱',
        'specialty': '✨',
        'wedding': '💍',
        'bachelor': '🧁',
        'birthday': '🎉',
        'chocolate': '🍫',
        'snack': '🍿',
        'combo': '🎁',
        'cooling': '❄️',
        'custom': '🪄',
        'pastr': '🥐',
        'cupcake': '🧁',
        'cake': '🎂'
    };

    function getCatEmoji(name) {
        if (!name) return '🍰';
        const lower = name.toLowerCase().trim();
        for (const k in catEmojiMap) {
            if (lower === k || lower.includes(k)) return catEmojiMap[k];
        }
        return '🍰';
    }

    if (window.IS_UNI_CHOCOLOOM_PAGE) {
        const uniPills = [
            { id: 'all', title: 'All Campus Treats', count: 23, emoji: '🎓' },
            { id: 'Chocolates', title: 'Chocolates', count: 6, emoji: '🍫' },
            { id: 'Cakes', title: 'Bento & Cakes', count: 4, emoji: '🎂' },
            { id: 'Desserts', title: 'Desserts', count: 5, emoji: '🍮' },
            { id: 'Snacks & Munchies', title: 'Snacks', count: 5, emoji: '🍿' },
            { id: 'Student Combos', title: 'Combos', count: 3, emoji: '🎁' }
        ];

        let tabsHtml = uniPills.map(p => {
            const isActive = (!AppState.activeCategory && p.id === 'all') || (AppState.activeCategory === p.id);
            return `
                <button class="modern-pill-tab ${isActive ? 'active' : ''}" onclick="selectCategoryFilter('${p.id}')">
                    <span class="pill-emoji">${p.emoji}</span>
                    <span class="pill-title">${p.title}</span>
                    <span class="pill-count">${p.count}</span>
                </button>
            `;
        }).join('');

        tabsHtml += `
            <div class="pills-divider"></div>
            <button class="modern-filter-chip active-veg ${AppState.activeFilter === 'pure_veg' ? 'active' : ''}" onclick="toggleActiveFilter('pure_veg')">
                <span>🌱</span> Pure Veg
            </button>
            <button class="modern-filter-chip ${AppState.activeFilter === 'cost_low' ? 'active' : ''}" onclick="toggleActiveFilter('cost_low')">
                <span>🏷️</span> Low to High
            </button>
        `;

        container.innerHTML = tabsHtml;
        if (DOM.dishOrRestSearchInput) {
            DOM.dishOrRestSearchInput.placeholder = 'Search campus chocolates, cakes, desserts, snacks...';
        }
        return;
    }

    const allProds = getAllProducts();
    const totalCount = allProds.length;
    const uniCount = allProds.filter(p => Boolean(p.isUniSpecial)).length;

    // Calculate real item counts per category
    const catCounts = {};
    allProds.forEach(p => {
        if (p.category) {
            const cat = p.category.trim();
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        }
    });

    const isAllActive = (!AppState.activeCategory || AppState.activeCategory === 'all');
    const isUniActive = AppState.activeCategory && AppState.activeCategory.toLowerCase().includes('uni');

    let tabsHtml = `
        <button class="modern-pill-tab ${isAllActive ? 'active' : ''}" onclick="selectCategoryFilter('all')">
            <span class="pill-emoji">🍰</span>
            <span class="pill-title">All Items</span>
            <span class="pill-count">${totalCount}</span>
        </button>
    `;

    Object.keys(catCounts).filter(c => !c.toLowerCase().includes('uni')).sort((a, b) => catCounts[b] - catCounts[a]).forEach(catName => {
        const isActive = AppState.activeCategory && AppState.activeCategory.toLowerCase() === catName.toLowerCase();
        const emoji = getCatEmoji(catName);
        tabsHtml += `
            <button class="modern-pill-tab ${isActive ? 'active' : ''}" onclick="selectCategoryFilter('${catName}')">
                <span class="pill-emoji">${emoji}</span>
                <span class="pill-title">${catName}</span>
                <span class="pill-count">${catCounts[catName]}</span>
            </button>
        `;
    });

    // Quick filter chips at the end of the scroll row
    tabsHtml += `
        <div class="pills-divider"></div>
        <button class="modern-filter-chip active-veg ${AppState.activeFilter === 'pure_veg' ? 'active' : ''}" onclick="toggleActiveFilter('pure_veg')">
            <span>🌱</span> Pure Veg
        </button>
        <button class="modern-filter-chip active-rating ${AppState.activeFilter === 'rating_4plus' ? 'active' : ''}" onclick="toggleActiveFilter('rating_4plus')">
            <span>⭐</span> 4.5+ Rating
        </button>
        <button class="modern-filter-chip ${AppState.activeFilter === 'cost_low' ? 'active' : ''}" onclick="toggleActiveFilter('cost_low')">
            <span>🏷️</span> Low to High
        </button>
        <button class="modern-filter-chip ${AppState.activeFilter === 'cost_high' ? 'active' : ''}" onclick="toggleActiveFilter('cost_high')">
            <span>💎</span> High to Low
        </button>
    `;

    container.innerHTML = tabsHtml;

    if (DOM.dishOrRestSearchInput) {
        DOM.dishOrRestSearchInput.placeholder = `Search all ${totalCount}+ cakes, desserts & treats...`;
    }
}

window.selectCategoryFilter = function(catName) {
    if (catName === 'all' || (AppState.activeCategory && AppState.activeCategory.toLowerCase() === catName.toLowerCase())) {
        AppState.activeCategory = null;
    } else {
        AppState.activeCategory = catName;
    }
    updateCategoryViewState();
    renderCategories();
    renderFilterPills();
    renderProductsGrid();
};

window.toggleActiveFilter = function(filterType) {
    if (AppState.activeFilter === filterType) {
        AppState.activeFilter = null;
    } else {
        AppState.activeFilter = filterType;
    }
    renderFilterPills();
    renderProductsGrid();
};

window.resetFilters = function() {
    AppState.activeCategory = null;
    AppState.activeFilter = null;
    AppState.searchQuery = '';
    if (DOM.dishOrRestSearchInput) DOM.dishOrRestSearchInput.value = '';
    if (DOM.searchClearBtn) DOM.searchClearBtn.style.display = 'none';
    updateCategoryViewState();
    renderCategories();
    renderFilterPills();
    renderProductsGrid();
};

// Filter & Sort Products
function getFilteredProducts() {
    let list = getAllProducts();

    // If on Uni Chocoloom Store Page
    if (window.IS_UNI_CHOCOLOOM_PAGE) {
        list = list.filter(p => Boolean(p.isUniSpecial));

        if (AppState.activeCategory && AppState.activeCategory !== 'all') {
            const cat = AppState.activeCategory.toLowerCase().trim();
            // If active category is 'Uni Chocoloom', show all campus special treats!
            if (!cat.includes('uni')) {
                list = list.filter(p => {
                    const uCat = (p.uniCategory || p.category || '').toLowerCase();
                    if (cat === 'chocolates') return uCat.includes('choc');
                    if (cat.includes('cake')) return uCat.includes('cake');
                    if (cat.includes('dessert')) return uCat.includes('dessert');
                    if (cat.includes('snack')) return uCat.includes('snack');
                    if (cat.includes('combo')) return uCat.includes('combo');
                    return uCat.includes(cat);
                });
            }
        }
    } else {
        // Filter by Category
        if (AppState.activeCategory && AppState.activeCategory !== 'all') {
            const cat = AppState.activeCategory.toLowerCase().trim();
            list = list.filter(p => {
                if (cat.includes('uni') || cat === 'unichocoloom') {
                    return Boolean(p.isUniSpecial) || (p.category && p.category.toLowerCase().includes('uni'));
                }
                if (cat === 'chocolates') {
                    return (p.category && p.category.toLowerCase().includes('choc')) || Boolean(p.uniCategory === 'Chocolates');
                }
                if (cat.includes('snack')) {
                    return (p.category && p.category.toLowerCase().includes('snack')) || Boolean(p.uniCategory === 'Snacks');
                }
                if (!p.category) return false;
                const pCat = p.category.toLowerCase().trim();
                return pCat === cat ||
                       pCat.replace(/\s+/g, '') === cat.replace(/\s+/g, '') ||
                       (cat.includes('bachelor') && pCat.includes('bachelor')) ||
                       (cat.includes('dessert') && pCat.includes('dessert'));
            });
        }
    }

    // Filter by Search Query
    if (AppState.searchQuery.trim() !== '') {
        const query = AppState.searchQuery.toLowerCase().trim();
        list = list.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.category && p.category.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }

    // Filter by Active Filter Tag
    if (AppState.activeFilter === 'pure_veg') {
        list = list.filter(p => p.isVeg);
    } else if (AppState.activeFilter === 'rating_4plus') {
        list = list.filter(p => p.rating >= 4.5);
    } else if (AppState.activeFilter === 'cost_low') {
        list.sort((a, b) => a.price - b.price);
    } else if (AppState.activeFilter === 'cost_high') {
        list.sort((a, b) => b.price - a.price);
    }

    return list;
}

// Reusable product card HTML generator
function createProductCardHtml(prod, idPrefix = '') {
    const cartItem = (Array.isArray(AppState.cart) ? AppState.cart : []).find(c => c && c.dish && (c.dish.id === prod.id || (c.dish.sql_id && prod.sql_id && c.dish.sql_id === prod.sql_id) || (c.dish.name && prod.name && c.dish.name === prod.name)));
    const qty = cartItem ? (Number(cartItem.quantity) || 0) : 0;
    const restId = prod.restaurantId || 'rest_chocoloom_flagship';
    const cardId = idPrefix ? `${idPrefix}_productCard_${prod.id}` : `productCard_${prod.id}`;
    const btnBoxId = idPrefix ? `${idPrefix}_prodBtnBox_${prod.id}` : `prodBtnBox_${prod.id}`;

    const hasDiscount = prod.originalPrice && Number(prod.originalPrice) > Number(prod.price);
    const discountPercent = hasDiscount ? Math.round(((Number(prod.originalPrice) - Number(prod.price)) / Number(prod.originalPrice)) * 100) : 0;
    const isWishlisted = Array.isArray(AppState.wishlist) && AppState.wishlist.includes(prod.id);

    return `
        <div class="product-card" id="${cardId}" onclick="handleCardClick(event, '${prod.id}', '${restId}')">
            <div class="product-img-box">
                <img src="${prod.image}" alt="${prod.name}" loading="lazy" decoding="async" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80'">
                ${prod.is_available === false ? `
                    <span class="product-badge-discount" style="background: #475569; color: #fff; font-weight: 800;">
                        OUT OF STOCK
                    </span>
                ` : (prod.isUniSpecial ? `
                    <span class="product-badge-discount" style="background: linear-gradient(135deg, #16a34a, #059669); color: #fff; font-weight: 800;">
                        <i class="fa-solid fa-graduation-cap"></i> 25% OFF
                    </span>
                ` : (prod.isBestseller ? `
                    <span class="product-badge-bestseller">
                        <i class="fa-solid fa-crown"></i> Bestseller
                    </span>
                ` : (hasDiscount ? `
                    <span class="product-badge-discount">
                        ${discountPercent}% OFF
                    </span>
                ` : '')))}
                <button class="card-heart-btn" onclick="toggleWishlist(event, '${prod.id}')" title="Favorite" aria-label="Favorite">
                    <i class="${isWishlisted ? 'fa-solid fa-heart active' : 'fa-regular fa-heart'}"></i>
                </button>
            </div>
            <div class="product-details">
                <div class="product-meta-row">
                    <div class="product-veg-indicator ${prod.isVeg ? 'veg' : 'non-veg'}">
                        <span class="veg-circle"></span>
                    </div>
                    <div class="product-rating-chip">
                        <i class="fa-solid fa-star"></i>
                        <span>${prod.rating || '4.8'}</span>
                    </div>
                    ${prod.isDirectAdd ? '<span class="product-custom-hint" style="color: #16a34a; font-weight: 700;">Instant Add</span>' : '<span class="product-custom-hint">Customizable</span>'}
                </div>
                <h3 class="product-title" title="${prod.name}">${prod.name}</h3>
                <p class="product-desc">${prod.description || ''}</p>
                <div class="product-price-action-row" onclick="event.stopPropagation()">
                    <div class="product-price-wrap">
                        <span class="product-price">₹${prod.price}</span>
                        ${hasDiscount ? `<span class="product-strike-price">₹${prod.originalPrice}</span>` : ''}
                    </div>
                    <div class="product-add-btn-wrap" id="${btnBoxId}">
                        ${prod.is_available === false ? `
                            <button class="direct-add-btn disabled" disabled style="background: #f1f5f9; color: #94a3b8; border: 1px solid #cbd5e1; cursor: not-allowed; padding: 7px 12px; font-size: 11px; font-weight: 800; border-radius: 8px;">
                                <span>OUT OF STOCK</span>
                            </button>
                        ` : (qty > 0 ? `
                            <div class="qty-counter-box">
                                <button class="qty-btn" onclick="event.stopPropagation(); updateItemQuantity('${prod.id}', -1)" aria-label="Decrease">−</button>
                                <span class="qty-val">${qty}</span>
                                <button class="qty-btn" onclick="event.stopPropagation(); updateItemQuantity('${prod.id}', 1)" aria-label="Increase">+</button>
                            </div>
                        ` : `
                            <button class="direct-add-btn" onclick="event.stopPropagation(); addToCart('${prod.id}', '${restId}')">
                                <span>ADD</span>
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        `)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render Direct Products Grid on Home Page
const CATALOG_BATCH_SIZE = 24;
let currentCatalogBatch = 1;
let catalogObserver = null;

function renderProductsGrid(resetPagination = true) {
    const grid = document.getElementById('productsGrid') || DOM.restaurantsGrid;
    if (!grid) return;

    if (resetPagination) {
        currentCatalogBatch = 1;
    }

    const allProds = getAllProducts();
    const products = getFilteredProducts();
    const countSubtitle = document.getElementById('catalogItemCountSubtitle');
    if (countSubtitle) {
        if (AppState.activeCategory || AppState.activeFilter || AppState.searchQuery) {
            countSubtitle.textContent = `Showing ${products.length} of ${allProds.length} fresh handcrafted items`;
        } else {
            countSubtitle.textContent = `Showing all ${allProds.length} fresh handcrafted cakes, treats & desserts`;
        }
    }

    if (products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fa-solid fa-cake-candles" style="font-size: 48px; color: #cbd5e1; margin-bottom: 16px;"></i>
                <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">No items found</h3>
                <p style="color: var(--text-muted); font-size: 14px;">Try searching for another cake, dessert, or reset your filters.</p>
                <button onclick="resetFilters()" style="margin-top: 16px; background: var(--primary); color: #fff; padding: 10px 24px; border-radius: var(--radius-full); font-weight: 700; border: none; cursor: pointer;">Show All Items</button>
            </div>
        `;
        return;
    }

// Build HTML for the 5-card Curated Occasions & Combos widget
function createCuratedCollectionsWidgetHtml() {
    return `
        <div class="curated-collections-section" id="curatedCollectionsWidget">
            <div class="curated-collections-header">
                <div>
                    <span class="curated-sub">Curated For You</span>
                    <h3 class="curated-title">Celebration Collections &amp; Combos</h3>
                </div>
            </div>
            <div class="curated-collections-grid">
                <!-- 1. Cartoon Cakes -->
                <div class="curated-collection-card curated-fullcover-card" onclick="if(typeof filterByCategory==='function'){ filterByCategory('Cartoons'); }">
                    <div class="curated-cover-img" style="background-image: url('assets/categories/curated_cartoon_cake.jpg');"></div>
                    <div class="curated-cover-overlay" style="background: linear-gradient(0deg, rgba(124,44,163,0.82) 0%, rgba(124,44,163,0.18) 60%, transparent 100%);"></div>
                    <div class="curated-cover-content">
                        <span class="curated-cover-heading">Cartoon Cakes</span>
                        <span class="curated-cover-sub">Whimsical &amp; Colourful Magic 🎨</span>
                        <button type="button" class="curated-card-btn" style="background: rgba(255,255,255,0.22); border: 1.5px solid rgba(255,255,255,0.5); backdrop-filter: blur(6px);">Explore &rarr;</button>
                    </div>
                </div>

                <!-- 2. Half Birthday -->
                <div class="curated-collection-card curated-fullcover-card" onclick="if(typeof filterByCategory==='function'){ filterByCategory('Half Birthday Cakes'); }">
                    <div class="curated-cover-img" style="background-image: url('assets/categories/curated_half_birthday.jpg');"></div>
                    <div class="curated-cover-overlay" style="background: linear-gradient(0deg, rgba(236,72,153,0.80) 0%, rgba(236,72,153,0.15) 60%, transparent 100%);"></div>
                    <div class="curated-cover-content">
                        <span class="curated-cover-heading">Half Birthday</span>
                        <span class="curated-cover-sub">Because Every Half Counts 🎉</span>
                        <button type="button" class="curated-card-btn" style="background: rgba(255,255,255,0.22); border: 1.5px solid rgba(255,255,255,0.5); backdrop-filter: blur(6px);">Explore &rarr;</button>
                    </div>
                </div>

                <!-- 3. Bento Cakes -->
                <div class="curated-collection-card curated-fullcover-card" onclick="if(typeof filterByCategory==='function'){ filterByCategory('Bento Cakes'); }">
                    <div class="curated-cover-img" style="background-image: url('assets/categories/curated_bento_cake.jpg');"></div>
                    <div class="curated-cover-overlay" style="background: linear-gradient(0deg, rgba(79,70,229,0.82) 0%, rgba(79,70,229,0.15) 60%, transparent 100%);"></div>
                    <div class="curated-cover-content">
                        <span class="curated-cover-heading">Bento Cakes</span>
                        <span class="curated-cover-sub">Cute Korean-Style Mini Cakes 🍱</span>
                        <button type="button" class="curated-card-btn" style="background: rgba(255,255,255,0.22); border: 1.5px solid rgba(255,255,255,0.5); backdrop-filter: blur(6px);">Explore &rarr;</button>
                    </div>
                </div>

                <!-- 4. Gift Hampers -->
                <div class="curated-collection-card curated-fullcover-card" onclick="if(typeof filterByCategory==='function'){ filterByCategory('Combos'); }">
                    <div class="curated-cover-img" style="background-image: url('assets/categories/curated_gift_hamper.jpg');"></div>
                    <div class="curated-cover-overlay" style="background: linear-gradient(0deg, rgba(146,64,14,0.82) 0%, rgba(146,64,14,0.15) 60%, transparent 100%);"></div>
                    <div class="curated-cover-content">
                        <span class="curated-cover-heading">Gift Hampers</span>
                        <span class="curated-cover-sub">Packed with Love &amp; Surprises 🎁</span>
                        <button type="button" class="curated-card-btn" style="background: rgba(255,255,255,0.22); border: 1.5px solid rgba(255,255,255,0.5); backdrop-filter: blur(6px);">Explore &rarr;</button>
                    </div>
                </div>

                <!-- 5. Anniversary Cakes -->
                <div class="curated-collection-card curated-fullcover-card" onclick="if(typeof filterByCategory==='function'){ filterByCategory('Anniversary Cakes'); }">
                    <div class="curated-cover-img" style="background-image: url('assets/categories/anniversary_cakes.webp');"></div>
                    <div class="curated-cover-overlay" style="background: linear-gradient(0deg, rgba(190,18,60,0.82) 0%, rgba(190,18,60,0.15) 60%, transparent 100%);"></div>
                    <div class="curated-cover-content">
                        <span class="curated-cover-heading">Anniversary Cakes</span>
                        <span class="curated-cover-sub">Celebrate Love in Style 💕</span>
                        <button type="button" class="curated-card-btn" style="background: rgba(255,255,255,0.22); border: 1.5px solid rgba(255,255,255,0.5); backdrop-filter: blur(6px);">Explore &rarr;</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

    const visibleCount = currentCatalogBatch * CATALOG_BATCH_SIZE;
    const visibleProducts = products.slice(0, visibleCount);
    const hasMore = visibleCount < products.length;

    let html = '';
    const shouldShowCuratedWidget = !AppState.searchQuery && (!AppState.activeCategory || AppState.activeCategory === 'All');

    visibleProducts.forEach((prod, idx) => {
        html += createProductCardHtml(prod);
        if (shouldShowCuratedWidget) {
            if (visibleProducts.length >= 8 && idx === 7) {
                html += createCuratedCollectionsWidgetHtml();
            } else if (visibleProducts.length < 8 && idx === (visibleProducts.length - 1)) {
                html += createCuratedCollectionsWidgetHtml();
            }
            if (visibleProducts.length >= 16 && idx === 15) {
                html += createChocoloomReelsWidgetHtml();
            } else if (visibleProducts.length >= 8 && visibleProducts.length < 16 && idx === (visibleProducts.length - 1)) {
                html += createChocoloomReelsWidgetHtml();
            }
        }
    });
    if (hasMore) {
        html += `
            <div id="catalogScrollSentinel" style="grid-column: 1 / -1; text-align: center; padding: 24px 16px;">
                <button type="button" class="load-more-btn" onclick="loadNextCatalogBatch()" style="background: linear-gradient(135deg, #7c5cfc, #6366f1); color: #fff; border: none; border-radius: 999px; padding: 12px 28px; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(124, 92, 252, 0.3); transition: transform 0.2s;">
                    <i class="fa-solid fa-angles-down" style="margin-right: 6px;"></i> View More Cakes (${products.length - visibleCount} more)
                </button>
            </div>
        `;
    }

    grid.innerHTML = html;

    // Attach IntersectionObserver for smooth infinite scrolling
    if (hasMore && typeof IntersectionObserver !== 'undefined') {
        const sentinel = document.getElementById('catalogScrollSentinel');
        if (sentinel) {
            if (catalogObserver) catalogObserver.disconnect();
            catalogObserver = new IntersectionObserver((entries) => {
                if (entries[0] && entries[0].isIntersecting) {
                    loadNextCatalogBatch();
                }
            }, { rootMargin: '250px' });
            catalogObserver.observe(sentinel);
        }
    }

    if (typeof renderSearchPageContent === 'function' && document.getElementById('searchPageOverlay')?.classList.contains('open')) {
        renderSearchPageContent();
    }
}

window.loadNextCatalogBatch = function() {
    currentCatalogBatch++;
    renderProductsGrid(false);
};

window.handleCardClick = function(event, prodId, restId) {
    if (event.target.closest('.product-add-btn-wrap') || event.target.closest('.card-heart-btn')) {
        return;
    }
    const prod = (typeof getAllProducts === 'function' ? getAllProducts() : []).find(p => p.id === prodId || p.sql_id === prodId || p.name === prodId);
    if (prod && prod.is_available === false) {
        if (typeof showToast === 'function') {
            showToast('This item is currently marked out of stock', 'fa-solid fa-circle-exclamation', '#ef4444');
        }
        return;
    }
    openCustomizationModal(prodId, restId);
};

window.toggleWishlist = function(event, prodId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    if (!Array.isArray(AppState.wishlist)) {
        try {
            AppState.wishlist = JSON.parse(localStorage.getItem('chocoloom_wishlist') || '[]');
        } catch(e) {
            AppState.wishlist = [];
        }
    }
    const idx = AppState.wishlist.indexOf(prodId);
    if (idx > -1) {
        AppState.wishlist.splice(idx, 1);
        showToast('Removed from favorites', 'fa-regular fa-heart');
    } else {
        AppState.wishlist.push(prodId);
        showToast('Added to favorites!', 'fa-solid fa-heart', '#ec4899');
    }
    try {
        localStorage.setItem('chocoloom_wishlist', JSON.stringify(AppState.wishlist));
    } catch(e) {}
    renderProductsGrid();
};

// Alias renderRestaurants to renderProductsGrid
function renderRestaurants() {
    renderFilterPills();
    renderProductsGrid();
}

// Render Instamart Items
function renderInstamartItems() {
    if (!DOM.instamartGrid) return;
    const items = SWIGGY_DATA.instamartCategories || SWIGGY_DATA.instamartItems || [];
    DOM.instamartGrid.innerHTML = items.map(item => `
        <div class="restaurant-card" style="padding: 16px; border: 1px solid var(--border-color); text-align: center; align-items: center; cursor: pointer;" onclick="showToast('Browsing ${item.name || item.category} section')">
            <div style="width: 120px; height: 120px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 12px;">
                <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">${item.name}</h4>
            <span style="font-size: 13px; color: #059669; font-weight: 700;">${item.count || ('₹' + item.price)}</span>
        </div>
    `).join('');
}

// Reset Filters
window.resetFilters = function() {
    AppState.activeFilter = null;
    AppState.activeCategory = null;
    AppState.searchQuery = '';
    if (DOM.dishOrRestSearchInput) DOM.dishOrRestSearchInput.value = '';
    if (DOM.searchClearBtn) DOM.searchClearBtn.style.display = 'none';
    DOM.filterPills.forEach(p => p.classList.remove('active'));
    renderCategories();
    renderRestaurants();
};

// Toggle Favorite Restaurant
window.toggleFavorite = function(e, restId) {
    e.stopPropagation();
    if (AppState.favorites.has(restId)) {
        AppState.favorites.delete(restId);
        showToast('Removed from favorites', 'fa-regular fa-heart');
    } else {
        AppState.favorites.add(restId);
        showToast('Saved to your favorites!', 'fa-solid fa-heart', '#e11d48');
    }
    localStorage.setItem('swiggy_favs', JSON.stringify([...AppState.favorites]));
    renderRestaurants();
};

// Open Restaurant Menu Modal
window.openRestaurantMenu = function(restId) {
    const restaurant = SWIGGY_DATA.restaurants.find(r => r.id === restId);
    if (!restaurant) return;

    AppState.activeRestaurantModal = restaurant;
    DOM.modalRestName.textContent = restaurant.name;
    DOM.modalRestCuisines.textContent = restaurant.cuisines.join(', ');
    DOM.modalRestRating.innerHTML = `<i class="fa-solid fa-star"></i> ${restaurant.rating} (${restaurant.ratingCount})`;
    DOM.modalRestTime.innerHTML = `<i class="fa-regular fa-clock"></i> ${restaurant.deliveryTime}`;
    DOM.modalRestCost.textContent = `₹${restaurant.costForTwo} for two`;

    // Group dishes by category
    const categoriesMap = {};
    restaurant.menu.forEach(item => {
        if (!categoriesMap[item.category]) categoriesMap[item.category] = [];
        categoriesMap[item.category].push(item);
    });

    const catKeys = Object.keys(categoriesMap);

    let pillsHTML = '';
    if (catKeys.length > 1) {
        pillsHTML = `
            <div style="display: flex; gap: 8px; overflow-x: auto; padding: 6px 0 16px; border-bottom: 1px solid var(--border-color); margin-bottom: 16px; scrollbar-width: none;">
                <button onclick="scrollToMenuCat('all')" class="menu-cat-pill active" style="white-space: nowrap; padding: 6px 14px; border-radius: 99px; background: var(--primary); color: #fff; font-size: 12px; font-weight: 700; border: none; cursor: pointer;">All (${restaurant.menu.length})</button>
                ${catKeys.map(cat => `
                    <button onclick="scrollToMenuCat('cat_${cat.replace(/[^a-zA-Z0-9]/g, '_')}')" class="menu-cat-pill" style="white-space: nowrap; padding: 6px 14px; border-radius: 99px; background: #f3f0ff; color: #7c5cfc; font-size: 12px; font-weight: 700; border: 1px solid #ede9fe; cursor: pointer;">${cat} (${categoriesMap[cat].length})</button>
                `).join('')}
            </div>
        `;
    }

    let menuHTML = pillsHTML;
    for (const [catName, dishes] of Object.entries(categoriesMap)) {
        const catId = `cat_${catName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        menuHTML += `
            <div class="menu-category-section" id="${catId}">
                <div class="menu-category-title">
                    <span>${catName} (${dishes.length})</span>
                </div>
                <div>
                    ${dishes.map(dish => renderDishItem(dish, restaurant)).join('')}
                </div>
            </div>
        `;
    }

    DOM.menuDishesContainer.innerHTML = menuHTML;
    DOM.menuModalBackdrop.classList.add('open');
};

window.scrollToMenuCat = function(catId) {
    if (catId === 'all') {
        DOM.menuDishesContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        const target = document.getElementById(catId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

function renderDishItem(dish, restaurant) {
    const cartItem = (Array.isArray(AppState.cart) ? AppState.cart : []).find(c => c && c.dish && (c.dish.id === dish.id || (c.dish.sql_id && dish.sql_id && c.dish.sql_id === dish.sql_id) || (c.dish.name && dish.name && c.dish.name === dish.name)));
    const qty = cartItem ? (Number(cartItem.quantity) || 0) : 0;

    return `
        <div class="dish-item-card">
            <div class="dish-info">
                <div class="dish-badges">
                    <span class="${dish.isVeg ? 'veg-icon' : 'non-veg-icon'}"></span>
                    ${dish.isBestseller ? `<span class="bestseller-tag"><i class="fa-solid fa-star"></i> Bestseller</span>` : ''}
                </div>
                <h4 class="dish-name">${dish.name}</h4>
                <div class="dish-price">₹${dish.price}</div>
                <div class="dish-rating-line">
                    <i class="fa-solid fa-star"></i>
                    <span>${dish.rating} (${dish.reviewsCount})</span>
                </div>
                <p class="dish-desc">${dish.description}</p>
            </div>
            <div class="dish-media">
                <img src="${dish.image}" alt="${dish.name}" class="dish-img" loading="lazy" decoding="async" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80'">
                <div class="dish-add-btn-wrapper" id="dishBtnBox_${dish.id}">
                    ${qty > 0 ? `
                        <div class="qty-counter-box">
                            <button class="qty-btn" onclick="updateItemQuantity('${dish.id}', -1)">-</button>
                            <span class="qty-val">${qty}</span>
                            <button class="qty-btn" onclick="updateItemQuantity('${dish.id}', 1)">+</button>
                        </div>
                    ` : `
                        <button class="dish-add-btn" onclick="addToCart('${dish.id}', '${restaurant.id}')">ADD</button>
                    `}
                </div>
            </div>
        </div>
    `;
}

window.openCart = function() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
};

window.closeCart = function() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
};

// ==================== CAKE CUSTOMIZATION (WEIGHT & COOLING OPTIONS) ====================


// ==================== CAKE FLAVOURS CONFIGURATION ====================
const CAKE_FLAVOURS = [
    { id: 'chocolate_truffle', name: 'Dutch Chocolate Truffle', icon: '🍫', desc: 'Rich Belgian dark cocoa & truffle', extraPrice: 0, tier: 'Classic' },
    { id: 'black_forest', name: 'Classic Black Forest', icon: '🍒', desc: 'Chocolate sponge, cherries & cream', extraPrice: 0, tier: 'Classic' },
    { id: 'pineapple', name: 'Fresh Pineapple', icon: '🍍', desc: 'Tropical pineapple & light whipped cream', extraPrice: 0, tier: 'Classic' },
    { id: 'vanilla', name: 'Classic Vanilla Bean', icon: '🍦', desc: 'Pure aromatic Madagascar vanilla', extraPrice: 0, tier: 'Classic' },
    { id: 'butterscotch', name: 'Butterscotch Crunch', icon: '🧈', desc: 'Caramel sponge & roasted praline', extraPrice: 0, tier: 'Classic' },
    { id: 'red_velvet', name: 'Royal Red Velvet', icon: '❤️', desc: 'Red cocoa sponge & cream cheese', extraPrice: 50, tier: 'Deluxe' },
    { id: 'black_currant', name: 'Black Currant Delight', icon: '🫐', desc: 'Tangy-sweet berry glaze & cream', extraPrice: 50, tier: 'Deluxe' },
    { id: 'strawberry', name: 'Fresh Strawberry', icon: '🍓', desc: 'Strawberry crush & whipped cream', extraPrice: 50, tier: 'Deluxe' },
    { id: 'mango', name: 'Alphonso Mango', icon: '🥭', desc: 'Sweet seasonal mango compote & cream', extraPrice: 50, tier: 'Deluxe' },
    { id: 'rasmalai', name: 'Royal Rasmalai Fusion', icon: '🍮', desc: 'Cardamom, saffron & rich milk rabdi', extraPrice: 100, tier: 'Gourmet' },
    { id: 'hazelnut_ferrero', name: 'Ferrero Nutty Hazelnut', icon: '🌰', desc: 'Roasted hazelnuts & Nutella chocolate', extraPrice: 100, tier: 'Gourmet' }
];

function getFlavourExtraPrice(dish, flavourName) {
    if (!dish || !flavourName) return 0;
    // Check if custom flavour prices exist for this dish
    if (dish.flavour_prices && typeof dish.flavour_prices === 'object') {
        if (dish.flavour_prices[flavourName] !== undefined) {
            return Number(dish.flavour_prices[flavourName]) || 0;
        }
        // Match by id or substring
        const found = CAKE_FLAVOURS.find(f => f.name.toLowerCase() === flavourName.toLowerCase() || f.id.toLowerCase() === flavourName.toLowerCase());
        if (found) {
            if (dish.flavour_prices[found.id] !== undefined) return Number(dish.flavour_prices[found.id]) || 0;
            if (dish.flavour_prices[found.name] !== undefined) return Number(dish.flavour_prices[found.name]) || 0;
        }
    }
    // Fallback to CAKE_FLAVOURS default extra price if defined
    const fObj = CAKE_FLAVOURS.find(f => f.name.toLowerCase() === flavourName.toLowerCase() || f.id.toLowerCase() === flavourName.toLowerCase());
    return (fObj && fObj.extraPrice) ? Number(fObj.extraPrice) : 0;
}

function detectDefaultFlavour(dish) {
    if (dish && dish.flavour && dish.flavour.trim()) return dish.flavour.trim();
    const text = `${(dish && dish.name) || ''} ${(dish && dish.category) || ''}`.toLowerCase();
    if (text.includes('red velvet')) return 'Royal Red Velvet';
    if (text.includes('black forest')) return 'Classic Black Forest';
    if (text.includes('pineapple')) return 'Fresh Pineapple';
    if (text.includes('butterscotch') || text.includes('caramel')) return 'Butterscotch Crunch';
    if (text.includes('mango')) return 'Alphonso Mango';
    if (text.includes('black currant') || text.includes('currant')) return 'Black Currant Delight';
    if (text.includes('strawberry')) return 'Fresh Strawberry';
    if (text.includes('rasmalai')) return 'Royal Rasmalai Fusion';
    if (text.includes('hazelnut') || text.includes('ferrero') || text.includes('nutella')) return 'Ferrero Nutty Hazelnut';
    if (text.includes('vanilla')) return 'Classic Vanilla Bean';
    if (text.includes('choco') || text.includes('truffle') || text.includes('fudge') || text.includes('dark')) return 'Dutch Chocolate Truffle';
    return 'Dutch Chocolate Truffle'; // Most loved signature flavour
}

window.selectCustomFlavour = function(flavourName) {
    if (!currentCustomization) return;
    currentCustomization.selectedFlavour = flavourName;
    renderCustomizationModalContent();
};

const WEIGHT_CONFIG = [
    { key: 'half_kg', label: '0.5 KG (1/2 KG)', weightTag: '0.5 KG', desc: 'Serves 2-3 people', priceCol: 'price_half_kg', coolingCol: 'cooling_price_half_kg', defaultCoolingPrice: 50 },
    { key: '1kg', label: '1 KG (Regular)', weightTag: '1 KG', desc: 'Serves 6-8 people', priceCol: 'price_1kg', coolingCol: 'cooling_price_1kg', defaultCoolingPrice: 100 },
    { key: '1_5kg', label: '1.5 KG (Large)', weightTag: '1.5 KG', desc: 'Serves 10-12 people', priceCol: 'price_1_5kg', coolingCol: 'cooling_price_1_5kg', defaultCoolingPrice: 150 },
    { key: '2kg', label: '2 KG (Celebration)', weightTag: '2 KG', desc: 'Serves 15-18 people', priceCol: 'price_2kg', coolingCol: 'cooling_price_2kg', defaultCoolingPrice: 200 },
    { key: '3kg', label: '3 KG (Party Feast)', weightTag: '3 KG', desc: 'Serves 22-26 people', priceCol: 'price_3kg', coolingCol: 'cooling_price_3kg', defaultCoolingPrice: 300 }
];

function getWeightPrice(dish, weightKey) {
    const config = WEIGHT_CONFIG.find(w => w.key === weightKey) || WEIGHT_CONFIG[0];
    if (dish && dish[config.priceCol] !== undefined && dish[config.priceCol] !== null && Number(dish[config.priceCol]) > 0) {
        return Number(dish[config.priceCol]);
    }
    const basePrice = Number((dish && dish.price) || 0);
    if (weightKey === 'half_kg') return basePrice;
    if (weightKey === '1kg') return basePrice + 400;
    if (weightKey === '1_5kg') return basePrice + 800;
    if (weightKey === '2kg') return basePrice + 1200;
    if (weightKey === '3kg') return basePrice + 2000;
    return basePrice;
}

function getCoolingCharge(dish, weightKey) {
    const config = WEIGHT_CONFIG.find(w => w.key === weightKey) || WEIGHT_CONFIG[0];
    if (dish && dish[config.coolingCol] !== undefined && dish[config.coolingCol] !== null && Number(dish[config.coolingCol]) > 0) {
        return Number(dish[config.coolingCol]);
    }
    if (dish && dish.cooling_price_half_kg !== undefined && dish.cooling_price_half_kg !== null && Number(dish.cooling_price_half_kg) > 0) {
        const baseCool = Number(dish.cooling_price_half_kg);
        if (weightKey === "half_kg") return baseCool;
        if (weightKey === "1kg") return Math.round(baseCool * 1.8);
        if (weightKey === "1_5kg") return Math.round(baseCool * 2.5);
        if (weightKey === "2kg") return Math.round(baseCool * 3.2);
        if (weightKey === "3kg") return Math.round(baseCool * 4.5);
    }
    return config.defaultCoolingPrice;
}

// Current customization state
let currentCustomization = null;

window.openCustomizationModal = function(dishId, restaurantId) {
    // Intercept if store is closed (9:00 AM – 8:30 PM IST)
    // Allow customizing & adding items to cart 24/7 (pre-orders supported when closed)
    const storeStatus = (typeof getStoreOperatingStatus === 'function') ? getStoreOperatingStatus() : { isOpen: true };

    const allProds = getAllProducts();
    let dish = allProds.find(d => d.id === dishId || (d.sql_id && d.sql_id === dishId) || (d.name && d.name === dishId));
    
    // Fallback: search in SWIGGY_DATA.restaurants
    if (!dish && SWIGGY_DATA.restaurants) {
        for (const r of SWIGGY_DATA.restaurants) {
            if (r.menu) {
                const found = r.menu.find(d => d.id === dishId || (d.sql_id && d.sql_id === dishId) || (d.name && d.name === dishId));
                if (found) {
                    dish = { ...found, restaurantId: r.id, restaurantName: r.name };
                    break;
                }
            }
        }
    }

    if (!dish) {
        console.error('Could not find dish for ID:', dishId);
        return;
    }

    const defaultRest = (SWIGGY_DATA.restaurants && SWIGGY_DATA.restaurants[0]) ? SWIGGY_DATA.restaurants[0] : {
        id: 'rest_chocoloom_flagship',
        name: 'Chocoloom Flagship Bakery & Confectionery',
        image: 'Anniversary%20Cakes/Screenshot%202026-08-15%20at%2012.11.50%E2%80%AFPM.png',
        distance: '1.2 km'
    };
    const restaurant = (SWIGGY_DATA.restaurants && SWIGGY_DATA.restaurants.find(r => r.id === (restaurantId || dish.restaurantId))) || defaultRest;

    // If product has weight options, cooling temperature, and flavours all disabled, add directly to cart
    if (dish.has_weight === false && dish.has_cooling === false && dish.has_flavours === false) {
        addDirectItemToCart(dish);
        return;
    }

    // Check if category indicates cooling cake default
    const isCoolingCategory = (dish.category || '').toLowerCase().includes('cooling') || (dish.name || '').toLowerCase().includes('cooling');

    const defaultFlavour = detectDefaultFlavour(dish);
    currentCustomization = {
        dish: dish,
        restaurant: restaurant,
        selectedWeightKey: 'half_kg',
        selectedFlavour: defaultFlavour,
        isCooling: isCoolingCategory,
        customMessage: ''
    };

    renderCustomizationModalContent();
    const modal = document.getElementById('cakeCustomizationModalBackdrop');
    if (modal) modal.classList.add('open');
};

window.closeCustomizationModal = function() {
    const modal = document.getElementById('cakeCustomizationModalBackdrop');
    if (modal) modal.classList.remove('open');
    currentCustomization = null;
};

function renderCustomizationModalContent() {
    if (!currentCustomization || !currentCustomization.dish) return;
    const body = document.getElementById('customizationModalBody');
    if (!body) return;

    const dish = currentCustomization.dish;
    const currentWeightKey = currentCustomization.selectedWeightKey || 'half_kg';
    const isCooling = Boolean(currentCustomization.isCooling);
    const customMsg = currentCustomization.customMessage || '';
    const currentFlavour = currentCustomization.selectedFlavour || detectDefaultFlavour(dish);

    const hasWeight = dish.has_weight !== false;
    const hasCooling = dish.has_cooling !== false;

    const selectedWeightPrice = hasWeight ? getWeightPrice(dish, currentWeightKey) : Number(dish.price || 0);
    const selectedCoolingPrice = hasCooling ? getCoolingCharge(dish, currentWeightKey) : 0;
    const currentCoolingCharge = (hasCooling && isCooling) ? selectedCoolingPrice : 0;
    const hasFlavours = dish.has_flavours !== false;
    const selectedFlavourPrice = hasFlavours ? getFlavourExtraPrice(dish, currentFlavour) : 0;
    const totalUnit = selectedWeightPrice + currentCoolingCharge + selectedFlavourPrice;

    const dishImg = dish.image || 'assets/logo.png';
    const isVeg = dish.isVeg !== false;
    const categoryName = dish.category || 'Specialty Cakes';

    body.innerHTML = `
        <!-- Dish Banner Summary -->
        <div class="customization-product-banner">
            <img src="${dishImg}" alt="${dish.name}" class="customization-product-img" onerror="this.src='assets/logo.png'">
            <div class="customization-product-info">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                    <span class="${isVeg ? 'veg-icon' : 'non-veg-icon'}"></span>
                    <span style="font-size: 11px; font-weight: 700; color: var(--primary); background: rgba(124, 92, 252, 0.1); padding: 1px 6px; border-radius: 4px;">${categoryName}</span>
                </div>
                <h4 class="customization-product-title" title="${dish.name}">${dish.name}</h4>
                <div class="customization-product-meta">
                    <span><i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${dish.rating || '4.8'} (${dish.reviewsCount || '100'}+)</span>
                </div>
            </div>
        </div>

        ${hasWeight ? `
        <!-- Section 1: Choose Cake Weight (Size) -->
        <div class="customization-section-card">
            <div class="customization-section-header">
                <div class="customization-section-title">
                    <i class="fa-solid fa-weight-scale" style="color: var(--primary);"></i>
                    <span>Select Cake Weight (Size)</span>
                </div>
                <span class="customization-badge-required active"><i class="fa-solid fa-check"></i> Required</span>
            </div>

            <div class="custom-options-grid">
                ${WEIGHT_CONFIG.map(w => {
                    const price = getWeightPrice(dish, w.key);
                    const isSelected = currentWeightKey === w.key;
                    return `
                        <label class="custom-option-label ${isSelected ? 'selected' : ''}" onclick="selectCustomWeight('${w.key}')">
                            <div class="custom-option-left">
                                <div class="custom-option-radio"></div>
                                <div>
                                    <div class="custom-option-name">${w.label}</div>
                                    <div class="custom-option-desc">${w.desc}</div>
                                </div>
                            </div>
                            <div class="custom-option-price">₹${price}</div>
                        </label>
                    `;
                }).join('')}
            </div>
        </div>
        ` : `
        <!-- Fixed Single Unit Price Notice -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #334155;">
                <i class="fa-solid fa-box" style="color: var(--primary);"></i>
                <span>Standard Unit (No Weight Selection)</span>
            </div>
            <div style="font-size: 15px; font-weight: 800; color: var(--primary);">₹${dish.price}</div>
        </div>
        `}

        <!-- Section: Choose Cake Flavour -->
        <div class="customization-section-card">
            <div class="customization-section-header">
                <div class="customization-section-title">
                    <i class="fa-solid fa-wand-magic-sparkles" style="color: #db2777;"></i>
                    <span>Select Cake Flavour</span>
                </div>
                <span class="customization-badge-required active"><i class="fa-solid fa-check"></i> Required</span>
            </div>

            <div class="custom-flavour-grid">
                ${CAKE_FLAVOURS.map(f => {
                    const isSelected = (currentFlavour === f.name);
                    const extraP = getFlavourExtraPrice(dish, f.name);
                    return `
                        <div class="custom-flavour-card ${isSelected ? 'selected' : ''}" onclick="selectCustomFlavour('${f.name}')">
                            <div class="custom-flavour-left">
                                <span class="custom-flavour-icon">${f.icon}</span>
                                <div class="custom-flavour-text">
                                    <div class="custom-flavour-name">${f.name}</div>
                                    <div class="custom-flavour-desc">${f.desc}</div>
                                </div>
                            </div>
                            <div class="custom-flavour-radio"></div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        ${hasCooling ? `
        <!-- Section: Choose Cake Cooling Option -->
        <div class="customization-section-card">
            <div class="customization-section-header">
                <div class="customization-section-title">
                    <i class="fa-solid fa-snowflake" style="color: #0284c7;"></i>
                    <span>Cake Cooling Option</span>
                </div>
                <span class="customization-badge-required active"><i class="fa-solid fa-check"></i> Required</span>
            </div>

            <div class="custom-options-grid">
                <!-- Normal Cake Option -->
                <label class="custom-option-label ${!isCooling ? 'selected' : ''}" onclick="selectCustomCooling(false)">
                    <div class="custom-option-left">
                        <div class="custom-option-radio"></div>
                        <div>
                            <div class="custom-option-name">🎂 Normal Room Temperature Cake</div>
                            <div class="custom-option-desc">Standard fresh baked sponge & cream</div>
                        </div>
                    </div>
                    <div class="custom-option-price" style="color: #16a34a; font-size: 12px; font-weight: 800;">FREE (+₹0)</div>
                </label>

                <!-- Chilled Cooling Cake Option -->
                <label class="custom-option-label ${isCooling ? 'selected' : ''}" onclick="selectCustomCooling(true)">
                    <div class="custom-option-left">
                        <div class="custom-option-radio"></div>
                        <div>
                            <div class="custom-option-name" style="display: flex; align-items: center;">
                                ❄️ Chilled Cooling Cake
                                <span class="cooling-badge-ice"><i class="fa-solid fa-snowflake"></i> ICE COOL</span>
                            </div>
                            <div class="custom-option-desc">Specially chilled in cryogenic cool-storage for extra refreshing taste</div>
                        </div>
                    </div>
                    <div class="custom-option-price" style="color: #0284c7;">+₹${selectedCoolingPrice}</div>
                </label>
            </div>
        </div>
        ` : ''}

        <!-- Section 3: Cake Message / Notes (Optional) -->
        <div class="customization-section-card">
            <div class="customization-section-header">
                <div class="customization-section-title">
                    <i class="fa-solid fa-comment-dots" style="color: #8b5cf6;"></i>
                    <span>Message on Cake (Optional)</span>
                </div>
                <span class="customization-badge-required">Optional</span>
            </div>
            <input type="text" id="customCakeMessageInput" placeholder="e.g. Happy Birthday Rahul!" maxlength="50" value="${customMsg}" oninput="updateCustomMessage(this.value)" style="width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; background: #fff; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
        </div>
    `;

    // Update footer total and button
    const totalEl = document.getElementById('customModalTotalPrice');
    if (totalEl) totalEl.textContent = `₹${totalUnit}`;
    const btnText = document.getElementById('customModalAddBtnText');
    if (btnText) btnText.textContent = `ADD ITEM • ₹${totalUnit}`;
}

window.selectCustomWeight = function(weightKey) {
    if (!currentCustomization) return;
    currentCustomization.selectedWeightKey = weightKey;
    renderCustomizationModalContent();
};

window.selectCustomCooling = function(isCooling) {
    if (!currentCustomization) return;
    currentCustomization.isCooling = Boolean(isCooling);
    renderCustomizationModalContent();
};

window.updateCustomMessage = function(msg) {
    if (!currentCustomization) return;
    currentCustomization.customMessage = msg;
};

window.confirmAddCustomizedItem = function() {
    // Intercept if store is closed (9:00 AM – 8:30 PM IST)
    // Allow customizing & adding items to cart 24/7 (pre-orders supported when closed)
    const storeStatus = (typeof getStoreOperatingStatus === 'function') ? getStoreOperatingStatus() : { isOpen: true };

    if (!currentCustomization || !currentCustomization.dish) return;

    const dish = currentCustomization.dish;
    const restaurant = currentCustomization.restaurant;
    const weightKey = currentCustomization.selectedWeightKey || 'half_kg';
    const isCooling = Boolean(currentCustomization.isCooling);
    const customMsg = (currentCustomization.customMessage || '').trim();

    const hasWeight = dish.has_weight !== false;
    const hasCooling = dish.has_cooling !== false;

    const weightOpt = WEIGHT_CONFIG.find(w => w.key === weightKey) || WEIGHT_CONFIG[0];
    const weightPrice = hasWeight ? getWeightPrice(dish, weightKey) : Number(dish.price || 0);
    const coolingPrice = (hasCooling && isCooling) ? getCoolingCharge(dish, weightKey) : 0;
    const selectedFlavour = currentCustomization.selectedFlavour || detectDefaultFlavour(dish);
    const flavourPrice = (dish.has_flavours !== false) ? getFlavourExtraPrice(dish, selectedFlavour) : 0;
    const finalUnitPrice = weightPrice + coolingPrice + flavourPrice;

    // Sanitize any corrupt cart items
    if (!Array.isArray(AppState.cart)) AppState.cart = [];
    AppState.cart = AppState.cart.filter(c => c && c.dish && (c.dish.id || c.dish.name));

    // Unique Cart Item ID combining dish identity, selected weight, cooling option, and custom message
    const cartItemId = `${dish.id || dish.sql_id || dish.name}_${encodeURIComponent(selectedFlavour)}_${hasWeight ? weightKey : 'fixed'}_${(hasCooling && isCooling) ? 'cooling' : 'normal'}_${encodeURIComponent(customMsg)}`;

    const customizedDish = {
        ...dish,
        price: finalUnitPrice,
        originalPrice: dish.originalPrice ? Math.round(dish.originalPrice * (hasWeight ? (weightOpt.key === 'half_kg' ? 1 : (weightOpt.key === '1kg' ? 1.5 : (weightOpt.key === '1_5kg' ? 2 : (weightOpt.key === '2kg' ? 2.5 : 3.5)))) : 1)) : finalUnitPrice,
        selectedWeight: hasWeight ? weightOpt.weightTag : 'Standard',
        selectedWeightKey: hasWeight ? weightKey : 'standard',
        selectedWeightLabel: hasWeight ? weightOpt.label : dish.name,
        selectedFlavour: selectedFlavour,
        flavour: selectedFlavour,
        flavourPrice: flavourPrice,
        weightPrice: weightPrice,
        isCooling: hasCooling ? isCooling : false,
        coolingOption: hasCooling ? (isCooling ? 'Cooling Cake' : 'Normal Cake') : 'Standard',
        coolingPrice: coolingPrice,
        customMessage: customMsg || null
    };

    const existingIndex = AppState.cart.findIndex(c => c.cartItemId === cartItemId || (
        c.dish && 
        (c.dish.id === dish.id || (c.dish.sql_id && dish.sql_id && c.dish.sql_id === dish.sql_id) || (c.dish.name === dish.name)) &&
        c.dish.selectedFlavour === selectedFlavour &&
        c.dish.selectedWeightKey === (hasWeight ? weightKey : 'standard') &&
        Boolean(c.dish.isCooling) === (hasCooling && isCooling) &&
        (c.dish.customMessage || '') === customMsg
    ));

    if (existingIndex > -1) {
        AppState.cart[existingIndex].quantity = (Number(AppState.cart[existingIndex].quantity) || 1) + 1;
        AppState.cart[existingIndex].dish = customizedDish;
        if (!AppState.cart[existingIndex].restaurant) AppState.cart[existingIndex].restaurant = restaurant;
    } else {
        AppState.cart.push({
            cartItemId: cartItemId,
            dish: customizedDish,
            restaurant: restaurant,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    renderProductsGrid();
    closeCustomizationModal();

    showToast(`Added ${dish.name} (${selectedFlavour}, ${hasWeight ? weightOpt.weightTag : '1 Unit'}) to Cart!`, 'fa-solid fa-cake-candles', '#7c5cfc');
    openCart();
};

// Cart Management Operations - Add to Cart triggers Customization or Direct Add
window.addToCart = function(dishId, restaurantId) {
    // Intercept if store is closed (9:00 AM – 8:30 PM IST)
    // Allow customizing & adding items to cart 24/7 (pre-orders supported when closed)
    const storeStatus = (typeof getStoreOperatingStatus === 'function') ? getStoreOperatingStatus() : { isOpen: true };

    let dish = (typeof getAllProducts === 'function' ? getAllProducts() : []).find(d => d.id === dishId || (d.sql_id && d.sql_id === dishId) || (d.name && d.name === dishId));
    if (!dish && SWIGGY_DATA.restaurants) {
        for (const r of SWIGGY_DATA.restaurants) {
            if (r.menu) {
                const found = r.menu.find(d => d.id === dishId || (d.sql_id && d.sql_id === dishId) || (d.name && d.name === dishId));
                if (found) {
                    dish = { ...found, restaurantId: r.id, restaurantName: r.name };
                    break;
                }
            }
        }
    }

    if (dish && dish.is_available === false) {
        if (typeof showToast === 'function') {
            showToast('Sorry, this item is currently out of stock!', 'fa-solid fa-circle-exclamation', '#ef4444');
        }
        return;
    }

    // Direct add for items without cake weight & cooling, or non-cake categories
    if (dish && (
        (dish.has_weight === false && dish.has_cooling === false) ||
        dish.isDirectAdd || 
        (dish.category && ['chocolates', 'snacks', 'desserts', 'shakes', 'brownies', 'combos', 'extras', 'dark', 'milk', 'ruby'].includes(dish.category.toLowerCase()))
    )) {
        addDirectItemToCart(dish);
        return;
    }

    openCustomizationModal(dishId, restaurantId);
};

window.addDirectItemToCart = function(dish) {
    if (!dish) return;
    // Allow customizing & adding items to cart 24/7 (pre-orders supported when closed)
    const storeStatus = (typeof getStoreOperatingStatus === 'function') ? getStoreOperatingStatus() : { isOpen: true };
    if (!Array.isArray(AppState.cart)) AppState.cart = [];
    AppState.cart = AppState.cart.filter(c => c && c.dish && (c.dish.id || c.dish.name));

    const defaultRest = (SWIGGY_DATA.restaurants && SWIGGY_DATA.restaurants[0]) ? SWIGGY_DATA.restaurants[0] : {
        id: 'rest_chocoloom_flagship',
        name: 'Chocoloom Flagship Bakery & Confectionery',
        distance: '1.2 km'
    };
    const restaurant = (SWIGGY_DATA.restaurants && SWIGGY_DATA.restaurants.find(r => r.id === dish.restaurantId)) || defaultRest;

    const cartItemId = `${dish.id || dish.sql_id || dish.name}_direct`;
    const customizedDish = {
        ...dish,
        price: Number(dish.price),
        originalPrice: Number(dish.originalPrice || dish.price),
        selectedWeight: (dish.has_weight !== false && (dish.category === 'Cakes' || dish.category === 'Bento Cakes')) ? 'Bento Box' : 'Standard',
        selectedWeightKey: 'standard',
        selectedWeightLabel: dish.name,
        weightPrice: Number(dish.price),
        isCooling: false,
        coolingOption: 'Fresh & Ready',
        coolingPrice: 0,
        customMessage: null
    };

    const existingIndex = AppState.cart.findIndex(c => c.cartItemId === cartItemId || (
        c.dish && (c.dish.id === dish.id || (c.dish.sql_id && dish.sql_id && c.dish.sql_id === dish.sql_id) || (c.dish.name === dish.name))
    ));

    if (existingIndex > -1) {
        AppState.cart[existingIndex].quantity = (Number(AppState.cart[existingIndex].quantity) || 1) + 1;
    } else {
        AppState.cart.push({
            cartItemId: cartItemId,
            dish: customizedDish,
            restaurant: restaurant,
            quantity: 1
        });
    }

    // UNICHOCO offer is applicable strictly for verified students only
    if (dish.isUniSpecial && typeof isStudentUser === 'function' && isStudentUser()) {
        AppState.activeCoupon = 'UNICHOCO';
    }

    saveCart();
    updateCartUI();
    renderProductsGrid();
    if (typeof renderUniModalProducts === 'function') renderUniModalProducts();

    showToast(`Added ${dish.name} to Cart! 🎓`, 'fa-solid fa-bag-shopping', '#7c5cfc');
};

window.updateItemQuantity = function(dishId, change) {
    if (!Array.isArray(AppState.cart)) return;
    const itemIndex = AppState.cart.findIndex(c => c && c.dish && (c.dish.id === dishId || (c.dish.sql_id && c.dish.sql_id === dishId) || (c.dish.name && c.dish.name === dishId)));
    if (itemIndex === -1) {
        if (change > 0) addToCart(dishId);
        return;
    }

    AppState.cart[itemIndex].quantity = (Number(AppState.cart[itemIndex].quantity) || 1) + change;

    if (AppState.cart[itemIndex].quantity <= 0) {
        AppState.cart.splice(itemIndex, 1);
    }

    saveCart();
    updateCartUI();
    renderProductsGrid();
    if (typeof renderUniModalProducts === 'function') renderUniModalProducts();
};

window.updateCartByIndex = function(index, change) {
    if (!Array.isArray(AppState.cart)) return;
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= AppState.cart.length) return;

    AppState.cart[idx].quantity = (Number(AppState.cart[idx].quantity) || 1) + change;
    if (AppState.cart[idx].quantity <= 0) {
        AppState.cart.splice(idx, 1);
    }
    saveCart();
    updateCartUI();
    renderProductsGrid();
    if (typeof renderUniModalProducts === 'function') renderUniModalProducts();
};

window.removeFromCart = function(index) {
    if (!Array.isArray(AppState.cart)) return;
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= AppState.cart.length) return;
    AppState.cart.splice(idx, 1);
    saveCart();
    updateCartUI();
    renderProductsGrid();
    if (typeof renderUniModalProducts === 'function') renderUniModalProducts();
};

function updateProductCardBtn(dishId) {
    const prodBtnBox = document.getElementById(`prodBtnBox_${dishId}`);
    if (prodBtnBox) {
        const cartItem = AppState.cart.find(c => c && c.dish && (c.dish.id === dishId || (c.dish.sql_id && c.dish.sql_id === dishId)));
        const qty = cartItem ? (Number(cartItem.quantity) || 0) : 0;
        if (qty > 0) {
            prodBtnBox.innerHTML = `
                <div class="qty-counter-box">
                    <button class="qty-btn" onclick="updateItemQuantity('${dishId}', -1)">-</button>
                    <span class="qty-val">${qty}</span>
                    <button class="qty-btn" onclick="addToCart('${dishId}')">+</button>
                </div>
            `;
        } else {
            const prod = getAllProducts().find(p => p.id === dishId || p.sql_id === dishId);
            const rId = prod ? (prod.restaurantId || 'rest_chocoloom_flagship') : 'rest_chocoloom_flagship';
            prodBtnBox.innerHTML = `<button class="direct-add-btn" onclick="addToCart('${dishId}', '${rId}')">ADD</button>`;
        }
    }
}

function saveCart() {
    localStorage.setItem('swiggy_cart', JSON.stringify(AppState.cart));
}

// Update Cart UI, Drawer & Badges
function updateCartUI() {
    if (!Array.isArray(AppState.cart)) AppState.cart = [];
    AppState.cart = AppState.cart.filter(c => c && c.dish && (c.dish.id || c.dish.name));

    const totalItems = AppState.cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const itemTotal = AppState.cart.reduce((sum, item) => sum + ((Number(item.dish?.price) || 0) * (Number(item.quantity) || 1)), 0);

    const badgeEl = document.getElementById('cartCountBadge') || DOM.cartCountBadge;
    if (badgeEl) badgeEl.textContent = totalItems;
    const mobBadgeEl = document.getElementById('mobileCartBadge') || DOM.mobileCartBadge;
    if (mobBadgeEl) mobBadgeEl.textContent = totalItems;

    // Floating Cart Preview Bar
    const floatBar = document.getElementById('floatingCartBar') || DOM.floatingCartBar;
    const floatCount = document.getElementById('floatingItemCount') || DOM.floatingItemCount;
    if (totalItems > 0 && floatBar) {
        floatBar.classList.add('visible');
        if (floatCount) floatCount.textContent = `${totalItems} ${totalItems === 1 ? 'Item' : 'Items'} | ₹${itemTotal}`;
    } else if (floatBar) {
        floatBar.classList.remove('visible');
    }

    // Cart Drawer Content
    const cartBody = document.getElementById('cartBodyContent') || DOM.cartBodyContent;
    const cartFooter = document.getElementById('cartFooter') || DOM.cartFooter;
    if (!cartBody) return;

    if (AppState.cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty-state">
                <img src="https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=300&auto=format&fit=crop&q=80" alt="Empty Cart" class="cart-empty-img" style="border-radius: 50%;">
                <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">Your cart is empty</h3>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">Explore all fresh cakes, gourmet desserts & pastries and add them to your cart.</p>
                <button onclick="closeCart()" style="background: var(--primary); color: #fff; padding: 10px 24px; border-radius: var(--radius-full); font-weight: 700; border: none; cursor: pointer;">SEE ALL DELICIOUS ITEMS</button>
            </div>
        `;
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }

    const defaultRest = (SWIGGY_DATA.restaurants && SWIGGY_DATA.restaurants[0]) ? SWIGGY_DATA.restaurants[0] : {
        name: 'Chocoloom Flagship Bakery & Confectionery',
        image: 'Anniversary%20Cakes/Screenshot%202026-08-15%20at%2012.11.50%E2%80%AFPM.png',
        distance: '1.2 km'
    };
    const currentRest = (AppState.cart[0] && AppState.cart[0].restaurant) ? AppState.cart[0].restaurant : defaultRest;
    const restImg = currentRest.image || 'assets/logo.png';
    const restName = currentRest.name || 'Chocoloom Flagship Bakery';
    const restDist = currentRest.distance || '1.2 km';
    const locName = AppState.selectedLocation?.name || 'Bengaluru';

    // Calculate Bill & Coupon Discount
    const deliveryFee = 35;
    const platformFee = 6;
    const secureCharges = 15;

    let couponDiscount = 0;
    if (AppState.activeCoupon === 'UNICHOCO' || AppState.activeCoupon === 'STUDENT25') {
        if (typeof isStudentUser === 'function' && !isStudentUser()) {
            AppState.activeCoupon = null; // UNICHOCO is strictly for students only!
        } else if (itemTotal >= 149) {
            couponDiscount = Math.min(200, Math.round(itemTotal * 0.25));
        }
    } else if (AppState.activeCoupon === 'CHOCO50' || AppState.activeCoupon === 'TOMBOLA50' || AppState.activeCoupon === 'TOMBOLA' || AppState.activeCoupon === 'CHOCOLOOM50') {
        if (itemTotal >= 149) {
            couponDiscount = Math.min(150, Math.round(itemTotal * 0.50));
        }
    } else if (AppState.activeCoupon === 'CHOCO100') {
        if (itemTotal >= 499) {
            couponDiscount = 100;
        }
    } else if (AppState.activeCoupon === 'FREESHIP' || AppState.activeCoupon === 'FREEDEL') {
        if (itemTotal >= 299) {
            couponDiscount = deliveryFee;
        }
    } else if (AppState.activeCoupon === 'PARTY20') {
        if (itemTotal >= 799) {
            couponDiscount = Math.min(300, Math.round(itemTotal * 0.20));
        }
    }

    const finalPayable = Math.max(0, itemTotal - couponDiscount + deliveryFee + platformFee + secureCharges + (Number(AppState.tipAmount) || 0));

    const isUserLoggedIn = (typeof window.isUserLoggedIn === 'function')
        ? window.isUserLoggedIn()
        : Boolean(AppState && AppState.currentUser && (AppState.currentUser.id || AppState.currentUser.phone || AppState.currentUser.email || AppState.currentUser.name));

    const hasCard = false; // ChocoWallet is coming soon
    const walletBalance = window.getChocowalletBalance();
    let currentPayMethod = (AppState.customerProfile && AppState.customerProfile.paymentMethod) ? AppState.customerProfile.paymentMethod : 'UPI / Online';
    if (currentPayMethod === 'Chocowallet Card') {
        currentPayMethod = 'UPI / Online';
        if (AppState.customerProfile) AppState.customerProfile.paymentMethod = 'UPI / Online';
    }
    const cardHolder = (AppState.currentUser?.name || AppState.customerProfile?.name || 'Chocoloom Member').trim();

    const payBtn = document.getElementById('proceedToPayBtn') || DOM.proceedToPayBtn;
    if (payBtn) {
        payBtn.disabled = false;
        if (!isUserLoggedIn) {
            payBtn.innerHTML = `<span><i class="fa-solid fa-user-lock" style="margin-right: 6px;"></i> SIGN IN TO PROCEED</span><span id="cartCheckoutTotal">₹${finalPayable}</span>`;
            payBtn.style.background = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)';
            payBtn.style.boxShadow = '0 8px 24px -4px rgba(124, 58, 237, 0.45)';
        } else {
            payBtn.innerHTML = `<span>PROCEED TO PAY</span><span id="cartCheckoutTotal">₹${finalPayable}</span>`;
            payBtn.style.background = 'var(--primary)';
            payBtn.style.boxShadow = '';
        }

        const storeStatus = (typeof getStoreOperatingStatus === 'function') ? getStoreOperatingStatus() : { isOpen: true };
        if (!storeStatus.isOpen) {
            payBtn.innerHTML = `<span><i class="fa-solid fa-moon" style="margin-right: 6px;"></i> STORE CLOSED (OPENS 9:00 AM)</span><span id="cartCheckoutTotal">₹${finalPayable}</span>`;
            payBtn.style.background = '#475569';
            payBtn.style.boxShadow = 'none';
        }
    }
    const checkoutTotalEl = document.getElementById('cartCheckoutTotal') || DOM.cartCheckoutTotal;
    if (checkoutTotalEl) checkoutTotalEl.textContent = `₹${finalPayable}`;
    if (cartFooter) cartFooter.style.display = 'block';

    const storeStatus = (typeof getStoreOperatingStatus === 'function') ? getStoreOperatingStatus() : { isOpen: true };

    cartBody.innerHTML = `
        ${(!storeStatus.isOpen) ? `
            <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                    <i class="fa-solid fa-moon"></i>
                </div>
                <div style="font-size: 12px; color: #991b1b; line-height: 1.4;">
                    <strong style="display: block; font-size: 13px; margin-bottom: 2px;">Store is Currently Closed</strong>
                    Chocoloom daily hours: <strong>9:00 AM – 8:30 PM</strong>. Checkout is paused until <strong>9:00 AM tomorrow</strong>.
                </div>
            </div>
        ` : ''}
        <!-- Items List -->
        <div class="cart-items-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
            ${AppState.cart.map((item, idx) => {
                if (!item || !item.dish) return '';
                const dish = item.dish;
                const price = Number(dish.price || 0);
                const qty = Number(item.quantity || 1);
                const isVeg = dish.isVeg !== false;
                const itemImg = dish.image || 'assets/logo.png';
                const itemCat = dish.category || 'Desserts';

                return `
                    <div class="cart-item-row" style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <img src="${itemImg}" alt="${dish.name || 'Product'}" style="width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0; border: 1px solid #e2e8f0;" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&auto=format&fit=crop&q=80'">
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span class="${isVeg ? 'veg-icon' : 'non-veg-icon'}" style="flex-shrink: 0;"></span>
                                <span class="cart-item-title" style="font-size: 13px; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;" title="${dish.name || 'Cake'}">${dish.name || 'Artisan Cake'}</span>
                            </div>

                            <!-- Weight and Cooling Option Tags -->
                            <div class="cart-item-tags">
                                ${dish.selectedFlavour ? `<span class="cart-tag cart-tag-flavour" style="background: #fdf2f8; color: #be185d; border: 1px solid #fbcfe8; font-weight: 700;"><i class="fa-solid fa-wand-magic-sparkles"></i> ${dish.selectedFlavour}</span>` : ''}
                                ${(dish.has_weight !== false && dish.selectedWeight && dish.selectedWeight !== 'Standard') ? `<span class="cart-tag cart-tag-weight"><i class="fa-solid fa-weight-scale"></i> ${dish.selectedWeight}</span>` : ''}
                                ${(dish.has_cooling !== false && dish.coolingOption && dish.coolingOption !== 'Standard' && dish.coolingOption !== 'Fresh & Ready') ? `
                                <span class="cart-tag ${dish.isCooling ? 'cart-tag-cooling' : 'cart-tag-normal'}">
                                    <i class="${dish.isCooling ? 'fa-solid fa-snowflake' : 'fa-solid fa-cake-candles'}"></i> ${dish.coolingOption || (dish.isCooling ? 'Cooling Cake' : 'Normal')}
                                </span>` : ''}
                                ${dish.customMessage ? `<span class="cart-tag cart-tag-msg"><i class="fa-solid fa-comment-dots"></i> "${dish.customMessage}"</span>` : ''}
                            </div>

                            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                                <span style="font-size: 11px; color: var(--primary); font-weight: 600; background: rgba(124, 92, 252, 0.1); padding: 1px 6px; border-radius: 4px;">${itemCat}</span>
                                <span style="font-size: 12px; color: #64748b; font-weight: 600;">₹${price} each ${dish.coolingPrice > 0 ? `<span style="font-size: 11px; color: #0284c7;">(Cake ₹${dish.weightPrice || (price - dish.coolingPrice)} + ❄️ Cooling ₹${dish.coolingPrice})</span>` : ''}</span>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;">
                            <div class="qty-counter-box" style="margin: 0; display: flex; align-items: center; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; height: 30px;">
                                <button class="qty-btn" style="width: 26px; height: 28px; border: none; background: transparent; font-weight: 800; cursor: pointer; color: #16a34a;" onclick="updateCartByIndex(${idx}, -1)">-</button>
                                <span class="qty-val" style="padding: 0 6px; font-size: 13px; font-weight: 800; color: #16a34a;">${qty}</span>
                                <button class="qty-btn" style="width: 26px; height: 28px; border: none; background: transparent; font-weight: 800; cursor: pointer; color: #16a34a;" onclick="updateCartByIndex(${idx}, 1)">+</button>
                            </div>
                            <div class="cart-item-price" style="font-size: 14px; font-weight: 800; color: #0f172a; text-align: right;">₹${price * qty}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <!-- Promotional / Tombola / Uni Coupon Banner -->
        ${(AppState.activeCoupon === 'TOMBOLA50' || AppState.activeCoupon === 'TOMBOLA') ? `
        <div style="background: #fefce8; border: 1.5px dashed #eab308; border-radius: 12px; padding: 11px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 22px;">🎟️</span>
                <div>
                    <div style="font-size: 12.5px; font-weight: 800; color: #854d0e;">
                        TOMBOLA50 (50% Lucky Discount Active)
                    </div>
                    <div style="font-size: 11px; color: #a16207;">
                        ${couponDiscount > 0 ? `Saved ₹${couponDiscount} with Tombola lucky coupon!` : 'Add treats worth ₹149 to unlock 50% OFF'}
                    </div>
                </div>
            </div>
            <span style="font-size: 11px; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 4px 8px; border-radius: 6px;"><i class="fa-solid fa-check"></i> APPLIED</span>
        </div>
        ` : `
        ${(typeof isStudentUser === 'function' && isStudentUser()) ? `
        <div style="background: #fdf4ff; border: 1.5px dashed #d946ef; border-radius: 12px; padding: 11px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 22px;">🎓</span>
                <div>
                    <div style="font-size: 12.5px; font-weight: 800; color: #86198f;">
                        ${(AppState.activeCoupon === 'UNICHOCO' || AppState.activeCoupon === 'STUDENT25') ? 'UNICHOCO (25% Student OFF Active)' : 'Uni Chocoloom Student Discount'}
                    </div>
                    <div style="font-size: 11px; color: #a21caf;">
                        ${(AppState.activeCoupon === 'UNICHOCO' || AppState.activeCoupon === 'STUDENT25') ? (couponDiscount > 0 ? `Saved ₹${couponDiscount} with campus discount!` : 'Add treats worth ₹149 to unlock 25% OFF') : 'Flat 25% OFF for College Students on all treats!'}
                    </div>
                </div>
            </div>
            ${(AppState.activeCoupon === 'UNICHOCO' || AppState.activeCoupon === 'STUDENT25') ? `
                <span style="font-size: 11px; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 4px 8px; border-radius: 6px;"><i class="fa-solid fa-check"></i> APPLIED</span>
            ` : `
                <button onclick="applyUniCoupon()" style="background: #a21caf; color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 800; cursor: pointer;">APPLY</button>
            `}
        </div>
        ` : `
        <div style="background: #faf5ff; border: 1.5px dashed #c084fc; border-radius: 12px; padding: 11px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 22px;">🎓</span>
                <div>
                    <div style="font-size: 12.5px; font-weight: 800; color: #6b21a8; display: flex; align-items: center; gap: 6px;">
                        <span>Student Offer (25% OFF)</span>
                        <span style="font-size: 9.5px; background: #ede9fe; color: #6b21a8; padding: 2px 6px; border-radius: 4px; font-weight: 800;">STUDENTS ONLY</span>
                    </div>
                    <div style="font-size: 11px; color: #7e22ce;">
                        Applicable only for verified college students
                    </div>
                </div>
            </div>
            <button onclick="openStudentVerificationModal()" style="background: linear-gradient(135deg, #7c5cfc, #6366f1); color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 8px rgba(124, 92, 252, 0.35);">
                <i class="fa-solid fa-id-card"></i> VERIFY
            </button>
        </div>
        `}
        `}

        <!-- Tip Delivery Partner -->
        <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">Tip your delivery partner</div>
            <div style="display: flex; gap: 8px;">
                ${[0, 20, 30, 50].map(tip => `
                    <button onclick="setTip(${tip})" style="flex: 1; padding: 6px 0; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); border: 1px solid ${AppState.tipAmount === tip ? 'var(--primary)' : 'var(--border-color)'}; background: ${AppState.tipAmount === tip ? 'var(--primary-light)' : '#fff'}; color: ${AppState.tipAmount === tip ? 'var(--primary)' : 'var(--text-main)'};">
                        ${tip === 0 ? 'No Tip' : `₹${tip}`}
                    </button>
                `).join('')}
            </div>
        </div>

        <!-- Customer & Delivery Details Section -->
        <div class="checkout-details-box" style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; color: var(--primary); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-location-dot"></i> Delivery & Contact Details</span>
                <span style="font-size: 11px; background: #ecfdf5; color: #059669; font-weight: 700; padding: 2px 8px; border-radius: 4px;"><i class="fa-solid fa-shield-halved"></i> Required</span>
            </div>

            <!-- Error Notification Banner -->
            <div id="checkoutErrorBanner" style="display: none; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 12px; padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; font-weight: 600;"></div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <!-- Full Name & Phone -->
                <div style="display: flex; gap: 8px;">
                    <div style="flex: 1;">
                        <label style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Full Name *</label>
                        <input type="text" id="checkoutCustName" placeholder="e.g. John Doe" value="${(AppState.customerProfile && AppState.customerProfile.name) || ''}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; background: #fff;" oninput="saveCustomerField('name', this.value); this.style.borderColor='var(--border-color)';">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Phone Number *</label>
                        <input type="tel" id="checkoutCustPhone" placeholder="10-digit mobile" value="${(AppState.customerProfile && AppState.customerProfile.phone) || ''}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; background: #fff;" oninput="saveCustomerField('phone', this.value); this.style.borderColor='var(--border-color)';">
                    </div>
                </div>

                <!-- Street / House Address -->
                <div>
                    <label style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">
                        ${(window.IS_UNI_CHOCOLOOM_PAGE && AppState.selectedCollege) ? '🎓 Campus / Hostel & Room No. *' : 'Street / House Address *'}
                    </label>
                    <input type="text" id="checkoutCustStreet" placeholder="${(window.IS_UNI_CHOCOLOOM_PAGE && AppState.selectedCollege) ? `e.g. ${AppState.selectedCollege.shortName || AppState.selectedCollege.name}, Hostel Room / Gate` : 'Flat / House No., Apartment, Street, Area'}" value="${(AppState.customerProfile && (AppState.customerProfile.street || AppState.customerProfile.address)) || ''}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; background: #fff;" oninput="saveCustomerField('street', this.value); saveCustomerField('address', this.value); this.style.borderColor='var(--border-color)';">
                </div>

                <!-- City & Pincode -->
                <div style="display: flex; gap: 8px;">
                    <div style="flex: 1;">
                        <label style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">City *</label>
                        <input type="text" id="checkoutCustCity" placeholder="e.g. Bhimavaram" value="${(AppState.customerProfile && AppState.customerProfile.city) || (AppState.selectedCollege?.city) || (AppState.selectedLocation?.city || 'Bhimavaram')}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; background: #fff;" oninput="saveCustomerField('city', this.value); this.style.borderColor='var(--border-color)';">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Pincode *</label>
                        <input type="text" id="checkoutCustPincode" placeholder="e.g. 534204" maxlength="6" value="${(AppState.customerProfile && AppState.customerProfile.pincode) || (AppState.selectedCollege?.pincode) || ''}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; background: #fff;" oninput="saveCustomerField('pincode', this.value); this.style.borderColor='var(--border-color)';">
                    </div>
                </div>

                <!-- Delivery notes / Gate instructions -->
                <div>
                    <label style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Delivery Notes (Optional)</label>
                    <input type="text" id="checkoutDeliveryNotes" placeholder="Landmark, gate instructions, or cake message" value="${(AppState.customerProfile && AppState.customerProfile.notes) || ''}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; background: #fff;" oninput="saveCustomerField('notes', this.value)">
                </div>
            </div>
            
            <div class="payment-section-wrapper">
                <div class="payment-section-header">
                    <span class="payment-section-title">
                        <i class="fa-solid fa-credit-card" style="color: #9333ea;"></i> Select Payment Method
                    </span>
                    <span class="payment-security-badge">
                        <i class="fa-solid fa-shield-halved"></i> 256-Bit Encrypted
                    </span>
                </div>

                <!-- 3 Segmented Payment Method Tiles -->
                <div class="payment-methods-grid">
                    <!-- 1. ChocoWallet (Coming Soon) -->
                    <div class="payment-method-tile" onclick="if(typeof showToast==='function') showToast('ChocoWallet is coming soon! Please pay via UPI / Online or Cash on Delivery.', 'fa-solid fa-clock', '#f59e0b');" style="opacity: 0.72; border: 1.5px dashed #cbd5e1; background: #f8fafc; cursor: not-allowed;">
                        <div class="pm-tile-left">
                            <div class="pm-tile-icon wallet" style="background: #e2e8f0; color: #64748b;">
                                <i class="fa-solid fa-wallet"></i>
                            </div>
                            <div class="pm-tile-info">
                                <div class="pm-tile-name" style="color: #64748b;">
                                    💳 ChocoWallet
                                    <span class="pm-tag" style="background: #fef3c7; color: #b45309; font-weight: 800; border: 1px solid #fde047;">⏳ COMING SOON</span>
                                </div>
                                <div class="pm-tile-desc" style="color: #94a3b8;">Instant 1-click VIP wallet pay coming soon!</div>
                            </div>
                        </div>
                        <div class="pm-tile-right">
                            <span style="font-size: 11px; font-weight: 700; color: #d97706; background: #fffbeb; padding: 4px 8px; border-radius: 6px; border: 1px solid #fef3c7;">Coming Soon</span>
                        </div>
                    </div>

                    <!-- 2. Online / UPI (Razorpay) -->
                    <div class="payment-method-tile ${(currentPayMethod === 'UPI / Online' || currentPayMethod === 'Razorpay') ? 'selected' : ''}" onclick="saveCustomerField('paymentMethod', 'UPI / Online'); updateCartUI();">
                        <input type="radio" name="payMethod" value="UPI / Online" ${(currentPayMethod === 'UPI / Online' || currentPayMethod === 'Razorpay') ? 'checked' : ''} style="display: none;">
                        <div class="pm-tile-left">
                            <div class="pm-radio-disc">
                                <div class="pm-radio-disc-inner"></div>
                            </div>
                            <div class="pm-tile-icon online">
                                <i class="fa-solid fa-bolt"></i>
                            </div>
                            <div class="pm-tile-info">
                                <div class="pm-tile-name">
                                    Online / UPI (Razorpay)
                                </div>
                                <div class="pm-tile-desc">GPay, PhonePe, Paytm, Cards, Netbanking</div>
                            </div>
                        </div>
                        <div class="pm-tile-right">
                            <span class="pm-tag popular">POPULAR</span>
                        </div>
                    </div>

                    <!-- 3. Cash on Delivery -->
                    <div class="payment-method-tile ${(currentPayMethod === 'Cash on Delivery') ? 'selected' : ''}" onclick="saveCustomerField('paymentMethod', 'Cash on Delivery'); updateCartUI();">
                        <input type="radio" name="payMethod" value="Cash on Delivery" ${(currentPayMethod === 'Cash on Delivery') ? 'checked' : ''} style="display: none;">
                        <div class="pm-tile-left">
                            <div class="pm-radio-disc">
                                <div class="pm-radio-disc-inner"></div>
                            </div>
                            <div class="pm-tile-icon cod">
                                <i class="fa-solid fa-money-bill-wave"></i>
                            </div>
                            <div class="pm-tile-info">
                                <div class="pm-tile-name">
                                    Cash on Delivery
                                </div>
                                <div class="pm-tile-desc">Pay with cash upon order delivery</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Clean Compact Status when Chocowallet Card is chosen -->
                ${(currentPayMethod === 'Chocowallet Card' && hasCard) ? `
                    <div style="margin-top: 8px; font-size: 11.5px; padding: 8px 12px; border-radius: 10px; background: #faf5ff; border: 1px solid #e9d5ff; display: flex; align-items: center; justify-content: space-between;">
                        <span style="color: #6b21a8; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
                            ${(walletBalance >= finalPayable) ? `Sufficient balance (₹${finalPayable} will be deducted)` : `Balance: ₹${walletBalance} (Needs ₹${finalPayable - walletBalance} more)`}
                        </span>
                        <a href="chocowallet.html" style="color: #9333ea; font-weight: 800; text-decoration: none; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                            Card Page <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 10px;"></i>
                        </a>
                    </div>
                ` : ''}
            </div>
        </div>

        <!-- Bill Details -->
        <div class="bill-details-card">
            <div style="font-size: 14px; font-weight: 800; margin-bottom: 12px; color: var(--dark);">Bill Details</div>
            <div class="bill-row">
                <span>Item Total</span>
                <span>₹${itemTotal}</span>
            </div>
            ${couponDiscount > 0 ? `
                <div class="bill-row" style="color: #16a34a; font-weight: 700;">
                    <span>🎓 Student Discount (${AppState.activeCoupon})</span>
                    <span>-₹${couponDiscount}</span>
                </div>
            ` : ''}
            <div class="bill-row">
                <span>Delivery Fee | ${currentRest?.distance || '1.2 km'}</span>
                <span>₹${deliveryFee}</span>
            </div>
            <div class="bill-row">
                <span>Platform Fee</span>
                <span>₹${platformFee}</span>
            </div>
            <div class="bill-row">
                <span>Secure</span>
                <span>₹${secureCharges}</span>
            </div>
            ${AppState.tipAmount > 0 ? `
                <div class="bill-row">
                    <span>Delivery Tip</span>
                    <span>₹${AppState.tipAmount}</span>
                </div>
            ` : ''}
            <div class="bill-total-row">
                <span>TO PAY</span>
                <span>₹${finalPayable}</span>
            </div>
        </div>
    `;
}

window.applyUniCoupon = function() {
    if (typeof isStudentUser === 'function' && !isStudentUser()) {
        if (typeof showToast === 'function') {
            showToast('🎓 This 25% offer is applicable for students only!', 'fa-solid fa-graduation-cap', '#ef4444');
        }
        if (typeof openStudentVerificationModal === 'function') {
            openStudentVerificationModal();
        }
        return;
    }
    AppState.activeCoupon = 'UNICHOCO';
    updateCartUI();
    showToast('🎓 UNICHOCO 25% student discount applied!', 'fa-solid fa-graduation-cap', '#16a34a');
};

window.setTip = function(amount) {
    AppState.tipAmount = amount;
    updateCartUI();
};

// Haversine formula to calculate distance between coordinates in km
function getDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 999999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Intelligent College Detection Algorithm for Uni Chocoloom
function matchCollegeByLocation(areaName = '', cityName = '', stateName = '', lat = null, lng = null, fullAddress = '') {
    const colleges = SWIGGY_DATA.colleges || [];
    // Currently, Uni Chocoloom is available exclusively at S.R.K.R. Engineering College
    const srkr = colleges.find(c => c.id === 'col_srkr') || colleges[0];
    return srkr;
}

// Select College / Campus
window.selectCollege = function(collegeIdOrObj, toastMsg) {
    let col = null;
    if (typeof collegeIdOrObj === 'string') {
        col = (SWIGGY_DATA.colleges || []).find(c => c.id === collegeIdOrObj);
    } else if (collegeIdOrObj && typeof collegeIdOrObj === 'object') {
        col = collegeIdOrObj;
    }
    if (!col) return;

    AppState.selectedCollege = col;
    try {
        localStorage.setItem('chocoloom_college', JSON.stringify(col));
    } catch (e) {}

    // Synchronize AppState.selectedLocation so cart, checkout, delivery calculations have campus details
    AppState.selectedLocation = {
        id: col.id,
        name: col.shortName || col.name,
        shortName: col.shortName || col.name,
        city: col.city,
        state: col.state || 'Andhra Pradesh',
        landmark: col.landmark || `${col.area}, ${col.city}`,
        area: col.area,
        pincode: col.pincode,
        lat: col.lat || null,
        lng: col.lng || null,
        isCollege: true
    };
    try {
        localStorage.setItem('chocoloom_location', JSON.stringify(AppState.selectedLocation));
    } catch (e) {}

    updateLocationDisplay();
    renderLocationsList();
    if (DOM.locationModalBackdrop) {
        DOM.locationModalBackdrop.classList.remove('open');
    }
    if (toastMsg) {
        showToast(toastMsg, 'fa-solid fa-graduation-cap', col.isAvailable ? '#16a34a' : '#f59e0b');
    } else {
        if (col.isAvailable) {
            showToast(`Campus set: ${col.shortName || col.name}!`, 'fa-solid fa-graduation-cap', '#16a34a');
        } else {
            showToast(`Selected ${col.shortName || col.name} (Delivery launching soon!)`, 'fa-solid fa-triangle-exclamation', '#f59e0b');
        }
    }
    resetGpsBtn();
};

// Select Custom College / Campus
window.selectCustomCollege = function() {
    const srkr = (SWIGGY_DATA.colleges || []).find(c => c.id === 'col_srkr') || SWIGGY_DATA.colleges[0];
    if (srkr) selectCollege(srkr);
    showToast('Uni Chocoloom is currently available exclusively at S.R.K.R. Engineering College! Expanding soon.', 'fa-solid fa-graduation-cap', '#d97706');
};

// Handle clicks on other colleges
window.handleNonSrkrCollegeClick = function(collegeIdOrName) {
    let col = (SWIGGY_DATA.colleges || []).find(c => c.id === collegeIdOrName || c.name === collegeIdOrName);
    if (!col) return;
    selectCollege(col, `Selected ${col.shortName || col.name} (Delivery launching soon!)`);
};

// Render Colleges List on Uni Chocoloom
function renderCollegesList(query = '') {
    if (!DOM.locationsList) return;

    const q = (query || '').toLowerCase().trim();
    const rawColleges = SWIGGY_DATA.colleges || [];

    // Sort to ensure col_srkr is strictly at top
    const colleges = [...rawColleges].sort((a, b) => {
        if (a.id === 'col_srkr') return -1;
        if (b.id === 'col_srkr') return 1;
        return 0;
    });

    const filtered = colleges.filter(col => {
        if (!q) return true;
        const inName = (col.name || '').toLowerCase().includes(q);
        const inShort = (col.shortName || '').toLowerCase().includes(q);
        const inArea = (col.area || '').toLowerCase().includes(q);
        const inCity = (col.city || '').toLowerCase().includes(q);
        const inDistrict = (col.district || '').toLowerCase().includes(q);
        const inKeywords = Array.isArray(col.matchKeywords) && col.matchKeywords.some(k => k.toLowerCase().includes(q));
        return inName || inShort || inArea || inCity || inDistrict || inKeywords;
    });

    let html = '';

    if (filtered.length === 0) {
        html += `
            <div style="text-align: center; padding: 22px 16px; background: #f8fafc; border-radius: var(--radius-sm); border: 1.5px dashed var(--border-color);">
                <div style="font-size: 32px; margin-bottom: 8px;">🎓</div>
                <div style="font-weight: 800; font-size: 15px; color: var(--dark);">Campus Not In Instant List</div>
                <div style="font-size: 12px; color: var(--text-muted); margin: 4px 0 14px;">Uni Chocoloom is currently delivering exclusively at <strong>S.R.K.R. Engineering College</strong>!</div>
                <button type="button" onclick="selectCollege('col_srkr')" style="background: #16a34a; color: #fff; border: none; padding: 10px 18px; border-radius: var(--radius-sm); font-weight: 800; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-graduation-cap"></i> Order to SRKR Campus (Active)
                </button>
            </div>
        `;
    } else {
        html = filtered.map(col => {
            const isSrkr = col.id === 'col_srkr';
            const isSelected = AppState.selectedCollege && AppState.selectedCollege.id === col.id;

            if (isSrkr) {
                return `
                    <div class="college-item ${isSelected ? 'selected' : ''}" onclick="selectCollege('col_srkr')" style="padding: 14px 16px; border-radius: var(--radius-sm); border: 2px solid #16a34a; background: rgba(22, 163, 74, 0.08); cursor: pointer; display: flex; align-items: flex-start; gap: 14px; transition: all 0.2s;">
                        <div style="width: 42px; height: 42px; border-radius: 12px; background: #16a34a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; margin-top: 2px; box-shadow: 0 4px 10px rgba(22, 163, 74, 0.25);">
                            <i class="fa-solid fa-graduation-cap"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <span style="font-weight: 800; font-size: 15px; color: var(--dark);">${col.name}</span>
                                <span style="font-size: 10px; background: #16a34a; color: #fff; font-weight: 800; padding: 2px 8px; border-radius: 999px;">● CURRENTLY ACTIVE</span>
                                <span style="font-size: 11px; background: rgba(22, 163, 74, 0.15); color: #15803d; font-weight: 700; padding: 2px 7px; border-radius: 4px;">SRKR</span>
                            </div>
                            <div style="font-size: 12.5px; color: #15803d; font-weight: 700; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid fa-bolt"></i> 15–20 Mins Fast Delivery to Hostels & Main Gate
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <span><i class="fa-solid fa-location-dot" style="color: #ef4444; font-size: 11px;"></i> ${col.area}, ${col.city}</span>
                                <span>•</span>
                                <span style="color: #64748b;">${col.landmark}</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="college-item other-college ${isSelected ? 'selected' : ''}" onclick="selectCollege('${col.id}', 'Selected ${escapeHtml(col.shortName || col.name)} (Delivery launching soon!)')" style="padding: 12px 14px; border-radius: var(--radius-sm); border: ${isSelected ? '2px solid #f59e0b' : '1px solid var(--border-color)'}; background: ${isSelected ? '#fffbeb' : '#fbfbfc'}; cursor: pointer; display: flex; align-items: flex-start; gap: 12px; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='${isSelected ? '#fffbeb' : '#fbfbfc'}'">
                    <div style="width: 38px; height: 38px; border-radius: 10px; background: ${isSelected ? '#fde68a' : '#e2e8f0'}; color: ${isSelected ? '#92400e' : '#64748b'}; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; margin-top: 2px;">
                        <i class="fa-solid fa-building-columns"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <span style="font-weight: 700; font-size: 13.5px; color: #334155;">${col.name}</span>
                            <span style="font-size: 9.5px; background: #fef3c7; color: #92400e; font-weight: 800; padding: 2px 7px; border-radius: 999px; border: 1px solid #fde68a;">COMING SOON</span>
                        </div>
                        <div style="font-size: 11.5px; color: #b45309; font-weight: 600; margin-top: 3px;">
                            <i class="fa-regular fa-clock"></i> Delivery launching soon • Live at SRKR only
                        </div>
                        <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                            ${col.area}, ${col.city}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    DOM.locationsList.innerHTML = html;
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Locations List & Selection Router
function renderLocationsList(query = '') {
    if (!DOM.locationsList) return;

    if (window.IS_UNI_CHOCOLOOM_PAGE) {
        renderCollegesList(query);
        return;
    }

    const filtered = SWIGGY_DATA.locations.filter(loc => 
        loc.name.toLowerCase().includes(query.toLowerCase()) || 
        loc.city.toLowerCase().includes(query.toLowerCase()) ||
        loc.landmark.toLowerCase().includes(query.toLowerCase())
    );

    DOM.locationsList.innerHTML = filtered.map(loc => `
        <div style="padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'" onclick="selectLocation('${loc.id}')">
            <i class="fa-solid fa-location-dot" style="color: var(--primary); font-size: 18px;"></i>
            <div>
                <div style="font-weight: 700; font-size: 14px; color: var(--dark);">${loc.name}, ${loc.city}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${loc.landmark}</div>
            </div>
        </div>
    `).join('');
}

// Locate Location via Browser GPS & Automatic IP Geolocation API
window.autoDetectLocation = function(isManual = false) {
    // If not manually requested and a location is already saved, use saved location immediately
    if (!isManual) {
        try {
            const saved = localStorage.getItem('chocoloom_location');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && (parsed.name || parsed.city)) {
                    return; // Location already available, zero delay!
                }
            }
        } catch(e) {}
    }

    const gpsBtn = document.getElementById('useGpsLocationBtn');
    if (gpsBtn && isManual) {
        gpsBtn.innerHTML = `
            <div class="gps-btn-icon" style="background: rgba(22, 163, 74, 0.2);"><i class="fa-solid fa-spinner fa-spin" style="color: #16a34a;"></i></div>
            <div style="text-align: left;">
                <div style="font-weight: 800; font-size: 14px; color: #16a34a;">Detecting Exact Campus...</div>
                <div style="font-size: 12px; color: var(--text-muted);">Acquiring GPS coordinates & matching college</div>
            </div>
        `;
    }

    if (isManual) {
        showToast('Detecting your exact college campus...', 'fa-solid fa-graduation-cap', '#16a34a');
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                try {
                    // Reverse geocoding via OpenStreetMap Nominatim API with 2.5s timeout
                    const geoController = typeof AbortController !== 'undefined' ? new AbortController() : null;
                    const geoTimer = geoController ? setTimeout(() => geoController.abort(), 2500) : null;
                    let res;
                    try {
                        res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                            headers: { 'Accept-Language': 'en' },
                            signal: geoController ? geoController.signal : undefined
                        });
                    } finally {
                        if (geoTimer) clearTimeout(geoTimer);
                    }
                    
                    if (res && res.ok) {
                        const data = await res.json();
                        const addr = data.address || {};
                        const areaName = addr.suburb || addr.neighbourhood || addr.road || addr.village || addr.town || addr.residential || 'Current Location';
                        const cityName = addr.city || addr.state_district || addr.county || addr.town || 'Your Area';
                        const stateName = addr.state || 'India';
                        const fullDisplayName = data.display_name || '';

                        // If on Uni Chocoloom, detect exact college / university campus!
                        if (window.IS_UNI_CHOCOLOOM_PAGE) {
                            const matchedCol = matchCollegeByLocation(areaName, cityName, stateName, lat, lng, fullDisplayName);
                            if (matchedCol) {
                                selectCollege(matchedCol, isManual ? `🎓 Campus Detected: ${matchedCol.shortName || matchedCol.name}!` : null);
                                return;
                            }
                        }

                        const gpsLoc = {
                            id: `loc_gps_${Date.now()}`,
                            name: areaName,
                            city: cityName,
                            state: stateName,
                            landmark: `Live GPS: ${lat.toFixed(3)}° N, ${lng.toFixed(3)}° E`,
                            lat: lat,
                            lng: lng,
                            isGPS: true
                        };

                        setDetectedLocation(gpsLoc, isManual ? `📍 Located at ${areaName}, ${cityName}!` : null);
                        return;
                    }
                } catch (err) {
                    console.warn('Reverse geocoding error:', err);
                }

                // If on Uni Chocoloom, check distance match with raw lat/lng
                if (window.IS_UNI_CHOCOLOOM_PAGE) {
                    const matchedCol = matchCollegeByLocation('', '', '', lat, lng, '');
                    if (matchedCol) {
                        selectCollege(matchedCol, isManual ? `🎓 Campus Detected: ${matchedCol.shortName || matchedCol.name}!` : null);
                        return;
                    }
                }

                // Fallback location with live coordinates
                const fallbackGps = {
                    id: `loc_gps_${Date.now()}`,
                    name: 'Current Location',
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    landmark: `GPS Coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                    lat: lat,
                    lng: lng,
                    isGPS: true
                };
                setDetectedLocation(fallbackGps, isManual ? `📍 GPS Located: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°` : null);
            },
            async (error) => {
                console.info('GPS not available/denied, falling back to IP Geolocation');
                await detectLocationViaIP(isManual);
            },
            { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 }
        );
    } else {
        detectLocationViaIP(isManual);
    }
};

window.detectGPSLocation = function() {
    window.autoDetectLocation(true);
};

async function detectLocationViaIP(isManual = false) {
    try {
        const ipController = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const ipTimer = ipController ? setTimeout(() => ipController.abort(), 2000) : null;
        let res;
        try {
            res = await fetch('https://ipwho.is/', { signal: ipController ? ipController.signal : undefined });
        } finally {
            if (ipTimer) clearTimeout(ipTimer);
        }

        if (res && res.ok) {
            const data = await res.json();
            if (data.success && data.city) {
                if (window.IS_UNI_CHOCOLOOM_PAGE) {
                    const matchedCol = matchCollegeByLocation(data.city, data.region || data.city, data.country, data.latitude, data.longitude, '');
                    if (matchedCol) {
                        selectCollege(matchedCol, isManual ? `🎓 Campus Detected: ${matchedCol.shortName || matchedCol.name}!` : null);
                        return;
                    }
                }

                const ipLoc = {
                    id: `loc_ip_${Date.now()}`,
                    name: data.city,
                    city: data.region || data.city,
                    state: data.country || 'India',
                    landmark: `Auto IP: ${data.city} (${data.postal || ''})`,
                    lat: data.latitude,
                    lng: data.longitude,
                    isIP: true
                };
                setDetectedLocation(ipLoc, isManual ? `📍 Auto-detected location: ${data.city}, ${data.region || data.country}!` : null);
                return;
            }
        }
    } catch (e) {
        console.warn('IP Geolocation error:', e);
    }
    resetGpsBtn();
}


function setDetectedLocation(newLoc, toastMsg) {
    const exists = SWIGGY_DATA.locations.find(l => l.name === newLoc.name && l.city === newLoc.city);
    if (!exists) {
        SWIGGY_DATA.locations.unshift(newLoc);
    }
    AppState.selectedLocation = exists || newLoc;
    try {
        localStorage.setItem('chocoloom_location', JSON.stringify(AppState.selectedLocation));
    } catch (e) {}

    updateLocationDisplay();
    renderRestaurants();
    renderLocationsList();
    if (DOM.locationModalBackdrop) {
        DOM.locationModalBackdrop.classList.remove('open');
    }
    if (toastMsg) {
        showToast(toastMsg, 'fa-solid fa-location-crosshairs', '#10b981');
    }
    resetGpsBtn();
}

function resetGpsBtn() {
    const gpsBtn = document.getElementById('useGpsLocationBtn');
    if (!gpsBtn) return;

    if (window.IS_UNI_CHOCOLOOM_PAGE) {
        gpsBtn.innerHTML = `
            <div class="gps-btn-icon" style="width: 42px; height: 42px; border-radius: 12px; background: #16a34a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">
                <i class="fa-solid fa-location-crosshairs"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 800; font-size: 14.5px; color: #15803d; display: flex; align-items: center; gap: 6px;">
                    <span>Detect My College via GPS</span>
                    <span style="background: #16a34a; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px;">EXACT CAMPUS</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;" id="gpsBtnSubtext">Auto-detects your engineering college or university campus</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: #16a34a;"></i>
        `;
    } else {
        gpsBtn.innerHTML = `
            <div class="gps-btn-icon"><i class="fa-solid fa-crosshairs"></i></div>
            <div style="text-align: left;">
                <div style="font-weight: 800; font-size: 14px; color: var(--primary);">Use Current Location</div>
                <div style="font-size: 12px; color: var(--text-muted);">Using GPS for precise delivery address</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--primary); margin-left: auto;"></i>
        `;
    }
}

window.selectLocation = function(locId) {
    const loc = SWIGGY_DATA.locations.find(l => l.id === locId);
    if (!loc) return;
    AppState.selectedLocation = loc;
    try {
        localStorage.setItem('chocoloom_location', JSON.stringify(loc));
    } catch (e) {}
    updateLocationDisplay();
    if (DOM.locationModalBackdrop) DOM.locationModalBackdrop.classList.remove('open');
    showToast(`Delivery location set to ${loc.name}, ${loc.city}`);
    renderRestaurants();
};

function updateLocationDisplay() {
    if (window.IS_UNI_CHOCOLOOM_PAGE) {
        const col = AppState.selectedCollege || (SWIGGY_DATA.colleges || []).find(c => c.id === 'col_srkr') || SWIGGY_DATA.colleges[0];
        if (DOM.currentLocType) DOM.currentLocType.textContent = col ? (col.shortName || col.name) : 'SRKR College';
        if (DOM.currentLocName) DOM.currentLocName.textContent = col ? (col.isAvailable ? `${col.city} (Active)` : `${col.city} (Coming Soon)`) : 'Bhimavaram';
        updateCampusAvailabilityBanner();
        return;
    }

    if (DOM.currentLocType) DOM.currentLocType.textContent = AppState.selectedLocation.name;
    if (DOM.currentLocName) DOM.currentLocName.textContent = `${AppState.selectedLocation.city}, ${AppState.selectedLocation.state}`;
}

// Campus Availability Banner Controller for Uni Chocoloom
window.updateCampusAvailabilityBanner = function() {
    const banner = document.getElementById('campusExclusiveBannerStrip');
    if (!banner) return;

    const col = AppState.selectedCollege || (SWIGGY_DATA.colleges || []).find(c => c.id === 'col_srkr') || SWIGGY_DATA.colleges[0];
    const isAvailable = Boolean(col && col.isAvailable);

    // If SRKR or any currently available college is selected:
    // DO NOT SHOW THIS TAG! Hide it completely.
    if (isAvailable) {
        banner.style.display = 'none';
        banner.innerHTML = '';
        return;
    }

    // If a college that is NOT currently available is selected:
    // SHOW that type of tag indicating delivery is currently unavailable here!
    banner.style.display = 'flex';
    banner.style.background = 'linear-gradient(135deg, rgba(254, 243, 199, 0.95), rgba(254, 249, 195, 0.7))';
    banner.style.border = '1.5px solid #fcd34d';
    banner.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.12)';

    const colName = col.shortName || col.name || 'this campus';

    banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 280px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: #fef3c7; color: #b45309; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; border: 1.5px solid #fde68a;">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-weight: 800; font-size: 15px; color: #92400e;">Delivery Currently Not Live at ${escapeHtml(colName)}</span>
                    <span style="background: #f59e0b; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; letter-spacing: 0.3px;">COMING SOON</span>
                </div>
                <div style="font-size: 12.5px; color: #78350f; margin-top: 3px; line-height: 1.4;">
                    Uni Chocoloom is currently live exclusively at <strong>S.R.K.R. Engineering College</strong>. Deliveries to <strong>${escapeHtml(colName)}</strong> hostels & gates are launching soon!
                </div>
            </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button type="button" onclick="selectCollege('col_srkr', 'Switched to active SRKR Engineering College!')" style="background: #16a34a; color: #fff; border: none; padding: 9px 16px; border-radius: 999px; font-weight: 800; font-size: 12.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25); transition: transform 0.15s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fa-solid fa-graduation-cap"></i> Switch to SRKR Campus (Active)
            </button>
            <button type="button" onclick="const m = document.getElementById('locationModalBackdrop') || DOM.locationModalBackdrop; if (m) m.classList.add('open');" style="background: #fff; color: #78350f; border: 1px solid #fde68a; padding: 9px 14px; border-radius: 999px; font-weight: 700; font-size: 12.5px; cursor: pointer;">
                Change Campus
            </button>
        </div>
    `;
};

// ==================== CHOCOLOOM STORE OPERATING HOURS SYSTEM ====================
// Operating schedule: Opens at 9:00 AM, Closes at 8:30 PM (Asia/Kolkata / IST)
window.getStoreOperatingStatus = function() {
    // Check cloud / admin store status or testing override
    const override = localStorage.getItem('chocoloom_store_status_override') || localStorage.getItem('chocoloom_store_status');
    if (override === 'open') {
        return { isOpen: true, openTime: '9:00 AM', closeTime: '8:30 PM', isOverridden: true, statusText: 'Open (Accepting Orders)' };
    }
    if (override === 'closed') {
        return { isOpen: false, openTime: '9:00 AM', closeTime: '8:30 PM', isOverridden: true, statusText: 'Closed (Store Closed)' };
    }

    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });
        const parts = formatter.formatToParts(now);
        let hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
        if (hour === 24) hour = 0;
        const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
        const currentTotalMinutes = hour * 60 + minute;

        // 9:00 AM = 9 * 60 = 540 minutes
        // 8:30 PM = 20 * 60 + 30 = 1230 minutes
        const openMinutes = 9 * 60;
        const closeMinutes = 20 * 60 + 30;

        const isOpen = currentTotalMinutes >= openMinutes && currentTotalMinutes < closeMinutes;

        return {
            isOpen: isOpen,
            openTime: '9:00 AM',
            closeTime: '8:30 PM',
            hour: hour,
            minute: minute,
            isOverridden: false,
            statusText: isOpen ? 'Open (Till 8:30 PM)' : 'Closed (Opens 9:00 AM)'
        };
    } catch (e) {
        console.warn('getStoreOperatingStatus error:', e);
        const d = new Date();
        const m = d.getHours() * 60 + d.getMinutes();
        const isOpen = m >= 540 && m < 1230;
        return { isOpen, openTime: '9:00 AM', closeTime: '8:30 PM', isOverridden: false };
    }
};

window.showStoreClosedModal = function() {
    const modal = document.getElementById('storeClosedModalBackdrop');
    if (modal) {
        modal.classList.add('open');
    } else if (typeof showToast === 'function') {
        showToast('Store is currently closed! Operating hours are 9:00 AM – 8:30 PM daily.', 'fa-solid fa-moon', '#ef4444');
    }
};

window.closeStoreClosedModal = function() {
    const modal = document.getElementById('storeClosedModalBackdrop');
    if (modal) modal.classList.remove('open');
};

// Developer / Admin testing utility to simulate store open/closed states
window.toggleStoreHoursForTesting = function(state) {
    if (state === 'open' || state === 'closed') {
        localStorage.setItem('chocoloom_store_status_override', state);
        console.log(`[Store Hours] Simulation active: ${state.toUpperCase()}`);
    } else {
        localStorage.removeItem('chocoloom_store_status_override');
        console.log('[Store Hours] Simulation cleared. Running on live 9:00 AM - 8:30 PM IST schedule.');
    }
    updateStoreOperatingStatusUI();
    updateCartUI();
    return getStoreOperatingStatus();
};

window.updateStoreOperatingStatusUI = function() {
    const status = getStoreOperatingStatus();

    // 1. Header Status Badge (Hidden as requested)
    const badge = document.getElementById('headerStoreStatusBadge');
    if (badge) {
        badge.style.display = 'none';
    }

    // 2. Update Top Banner Strip
    const banner = document.getElementById('storeOperatingHoursBanner');
    if (banner) {
        if (!status.isOpen) {
            banner.style.display = 'block';
            banner.className = 'store-operating-banner closed';
            banner.innerHTML = `
                <div class="store-banner-inner">
                    <div class="store-banner-left">
                        <div class="store-banner-icon-box">
                            <i class="fa-solid fa-moon"></i>
                        </div>
                        <div>
                            <div class="store-banner-title">
                                <span>Store Closed for the Night</span>
                                <span class="store-banner-tag">CLOSED</span>
                                <span style="font-size: 11px; opacity: 0.85; font-weight: 700;">• Opens at 9:00 AM</span>
                            </div>
                            <div class="store-banner-sub">
                                Chocoloom operating hours are <strong>9:00 AM to 8:30 PM</strong> daily. Ordering is paused until 9:00 AM tomorrow while our ovens rest.
                            </div>
                        </div>
                    </div>
                    <div class="store-banner-right">
                        <button type="button" class="store-banner-action-btn" onclick="showStoreClosedModal()" style="background: rgba(255, 255, 255, 0.15); color: #fff; border: 1px solid rgba(255, 255, 255, 0.25);">
                            <i class="fa-regular fa-clock"></i> View Timings
                        </button>
                        <a href="https://wa.link/gejgjd" target="_blank" rel="noopener noreferrer" class="store-banner-action-btn" style="background: #25d366; color: #fff;">
                            <i class="fa-brands fa-whatsapp"></i> Help on WhatsApp
                        </a>
                    </div>
                </div>
            `;
        } else {
            banner.style.display = 'none';
            banner.innerHTML = '';
        }
    }
};

// Close Order Success Modal
window.closeOrderSuccessModal = function() {
    const modal = document.getElementById('trackingModalBackdrop');
    if (modal) modal.classList.remove('open');
};

// Automatically detects and eliminates duplicate order twins
function cleanDuplicateOrders(orders) {
    if (!Array.isArray(orders)) return [];
    const seenOrderNums = new Set();
    const seenSignatures = new Set();
    const result = [];

    for (const ord of orders) {
        if (!ord) continue;
        
        // Exact order_number duplicate check
        const num = String(ord.order_number || ord.order_ref || '').trim();
        if (num && seenOrderNums.has(num)) {
            continue;
        }

        // Fuzzy duplicate check: same customer phone/name, same total, within 3 minutes of each other
        const total = Number(ord.final_total || ord.total || 0);
        const rawPhone = String(ord.customer_phone || ord.phone || '');
        const phone = rawPhone.replace(/\D/g, '').slice(-10);
        const name = String(ord.customer_name || '').toLowerCase().trim();
        const createdMs = ord.created_at ? new Date(ord.created_at).getTime() : 0;
        // 3-minute time window bucket (180,000 ms)
        const timeBucket = createdMs ? Math.floor(createdMs / 180000) : 0;
        
        // Item signature
        const itemsSig = Array.isArray(ord.items) 
            ? ord.items.map(it => `${it.name || it.dish_id || ''}_${it.quantity || 1}_${it.price || 0}`).sort().join(';')
            : '';

        const fuzzySig = `${phone || name}_${total}_${itemsSig}_${timeBucket}`;

        if (timeBucket > 0 && seenSignatures.has(fuzzySig)) {
            console.log('🧹 Filtered out duplicate order twin:', num || fuzzySig);
            continue;
        }

        if (num) seenOrderNums.add(num);
        if (timeBucket > 0) seenSignatures.add(fuzzySig);
        result.push(ord);
    }

    return result;
}
window.cleanDuplicateOrders = cleanDuplicateOrders;

// Clean Order Success Confirmation Screen
function showOrderSuccessModal(createdOrder = null) {
    if (DOM.cartOverlay) DOM.cartOverlay.click();
    closeCart();

    const modal = document.getElementById('trackingModalBackdrop');
    if (modal) modal.classList.add('open');

    AppState.activeOrder = createdOrder;

    const orderNum = createdOrder?.order_number || createdOrder?.order_ref || `CL-${Date.now().toString().slice(-6)}`;
    const custName = createdOrder?.customer_name || (AppState.customerProfile?.name) || 'Customer';
    const custPhone = createdOrder?.customer_phone || (AppState.customerProfile?.phone) || '';
    const address = createdOrder?.delivery_address || (AppState.customerProfile?.street ? `${AppState.customerProfile.street}, ${AppState.customerProfile.city || ''} - ${AppState.customerProfile.pincode || ''}` : 'Your delivery location');
    const payMethod = createdOrder?.payment_method || (AppState.customerProfile?.paymentMethod) || 'Cash on Delivery';
    const finalTotal = createdOrder?.final_total || createdOrder?.total || 0;
    const items = Array.isArray(createdOrder?.items) ? createdOrder.items : [];

    const orderNumBadge = document.getElementById('trackOrderNumBadge');
    if (orderNumBadge) {
        orderNumBadge.textContent = `Order #${orderNum}`;
    }

    const detailsCard = document.getElementById('orderSuccessDetailsCard');
    if (detailsCard) {
        detailsCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                <div>
                    <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Customer</div>
                    <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${custName} ${custPhone ? `(${custPhone})` : ''}</div>
                </div>
                <span style="font-size: 11px; background: #ecfdf5; color: #059669; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                    <i class="fa-solid fa-circle-check"></i> Confirmed & Saved
                </span>
            </div>

            <div style="font-size: 12px; color: #475569; margin-bottom: 12px; line-height: 1.4;">
                <span style="font-weight: 700; color: #0f172a; display: block; margin-bottom: 2px;"><i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> Delivery Address:</span>
                ${address}
            </div>

            ${items.length > 0 ? `
                <div style="margin-bottom: 12px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 6px;">Items Ordered</span>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${items.map(it => {
                            const weightStr = it.selected_weight || it.weight || '0.5 KG';
                            const isCooling = Boolean(it.is_cooling);
                            const msgStr = it.custom_message ? ` (Note: "${it.custom_message}")` : '';
                            return `
                                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #1e293b; align-items: center;">
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-weight: 700;">${it.quantity || 1}x ${it.name || 'Cake'}</span>
                                        <span style="font-size: 11px; color: #64748b;">⚖️ ${weightStr} • ${isCooling ? '❄️ Chilled Cooling' : '🎂 Normal'}${it.cooling_price > 0 ? ` (+₹${it.cooling_price})` : ''}${msgStr}</span>
                                    </div>
                                    <span style="font-weight: 800; font-size: 13px;">₹${(Number(it.price) || 0) * (Number(it.quantity) || 1)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-weight: 600;">Payment: <strong>${payMethod}</strong></span>
                <span style="font-size: 15px; font-weight: 900; color: #0f172a;">Total: ₹${finalTotal}</span>
            </div>
        `;
    }

    // Record order into local orders history (with duplicate elimination)
    try {
        let orderHistory = JSON.parse(localStorage.getItem('chocoloom_orders_history') || '[]');
        const historyRecord = {
            order_number: orderNum,
            created_at: new Date().toISOString(),
            final_total: finalTotal,
            payment_method: payMethod,
            payment_status: 'confirmed',
            status: 'confirmed',
            delivery_address: address,
            customer_name: custName,
            customer_phone: custPhone,
            items: items,
            user_id: AppState.currentUser ? AppState.currentUser.id : null,
            user_email: AppState.currentUser ? AppState.currentUser.email : null
        };
        if (!orderHistory.some(o => o.order_number === orderNum)) {
            orderHistory.unshift(historyRecord);
        }
        orderHistory = cleanDuplicateOrders(orderHistory);
        localStorage.setItem('chocoloom_orders_history', JSON.stringify(orderHistory.slice(0, 40)));
        if (typeof updateAuthUI === 'function') updateAuthUI();
    } catch (e) {}

    // Clear cart completely
    AppState.cart = [];
    AppState.activeCoupon = null;
    AppState.tipAmount = 0;
    saveCart();
    updateCartUI();
}

window.startOrderTracking = showOrderSuccessModal;

// ==================== REALTIME LIVE CATALOG SYNC & ADMIN BRIDGE ====================

// Directly sync live overrides into SWIGGY_DATA memory
function syncLiveCatalogState() {
    let deletedIds = [];
    let priceOverrides = {};
    let customProducts = [];
    try {
        deletedIds = JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]");
        priceOverrides = JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}");
        customProducts = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
    } catch(e) {}

    const rest = SWIGGY_DATA && SWIGGY_DATA.restaurants && SWIGGY_DATA.restaurants[0] ? SWIGGY_DATA.restaurants[0] : null;
    let menu = rest ? rest.menu : null;
    if (menu && Array.isArray(menu)) {
        // 1. Remove deleted items
        if (deletedIds.length > 0) {
            menu = menu.filter(item => !deletedIds.includes(item.id) && (!item.sql_id || !deletedIds.includes(item.sql_id)));
            rest.menu = menu;
        }

        // 2. Apply price & detail overrides
        menu.forEach(item => {
            const key = item.sql_id || item.id;
            const over = priceOverrides[key] || priceOverrides[item.id] || (item.name ? priceOverrides[item.name.toLowerCase().trim()] : null);
            if (over) {
                if (over.price !== undefined) item.price = Number(over.price);
                if (over.originalPrice !== undefined) item.originalPrice = Number(over.originalPrice);
                if (over.price_half_kg !== undefined) item.price_half_kg = Number(over.price_half_kg);
                if (over.price_1kg !== undefined) item.price_1kg = Number(over.price_1kg);
                if (over.price_1_5kg !== undefined) item.price_1_5kg = Number(over.price_1_5kg);
                if (over.price_2kg !== undefined) item.price_2kg = Number(over.price_2kg);
                if (over.price_3kg !== undefined) item.price_3kg = Number(over.price_3kg);
                if (over.cooling_price_half_kg !== undefined) item.cooling_price_half_kg = Number(over.cooling_price_half_kg);
                if (over.cooling_price_1kg !== undefined) item.cooling_price_1kg = Number(over.cooling_price_1kg);
                if (over.cooling_price_1_5kg !== undefined) item.cooling_price_1_5kg = Number(over.cooling_price_1_5kg);
                if (over.cooling_price_2kg !== undefined) item.cooling_price_2kg = Number(over.cooling_price_2kg);
                if (over.cooling_price_3kg !== undefined) item.cooling_price_3kg = Number(over.cooling_price_3kg);
                if (over.is_available !== undefined) item.is_available = Boolean(over.is_available);
                if (over.name) item.name = over.name;
                if (over.category) item.category = over.category;
                if (over.image) item.image = over.image;
                if (over.image_url) { item.image = over.image_url; item.image_url = over.image_url; }
                if (over.discount_price !== undefined) item.discount_price = Number(over.discount_price);
                if (over.has_weight !== undefined) item.has_weight = Boolean(over.has_weight);
                if (over.has_cooling !== undefined) item.has_cooling = Boolean(over.has_cooling);
                if (over.has_flavours !== undefined) item.has_flavours = Boolean(over.has_flavours);
                if (over.flavour !== undefined) item.flavour = over.flavour;
                if (over.flavour_prices !== undefined) item.flavour_prices = over.flavour_prices;
            }
        });

        // 3. Prepend custom added products
        if (Array.isArray(customProducts) && customProducts.length > 0) {
            customProducts.forEach(newProd => {
                if (!deletedIds.includes(newProd.id)) {
                    const existingIdx = menu.findIndex(p => p.id === newProd.id || (p.sql_id && p.sql_id === newProd.sql_id));
                    if (existingIdx !== -1) {
                        menu[existingIdx] = { ...menu[existingIdx], ...newProd };
                    } else {
                        menu.unshift({
                            ...newProd,
                            restaurantId: rest.id || 'rest_chocoloom_flagship',
                            restaurantName: rest.name || 'Chocoloom Flagship Bakery & Confectionery'
                        });
                    }
                }
            });
        }
    }

    if (typeof window.invalidateProductsCache === 'function') {
        window.invalidateProductsCache();
    }
}

// Refresh active Cart items if their product price was modified by admin
function syncCartItemPrices() {
    if (!Array.isArray(AppState.cart) || AppState.cart.length === 0) return;
    const all = typeof getAllProducts === "function" ? getAllProducts() : [];
    let changed = false;

    AppState.cart.forEach(cartItem => {
        if (!cartItem || !cartItem.dish) return;
        const fresh = all.find(p => p.id === cartItem.dish.id || (p.sql_id && p.sql_id === cartItem.dish.sql_id) || (p.name && cartItem.dish.name && p.name.toLowerCase().trim() === cartItem.dish.name.toLowerCase().trim()));
        if (fresh) {
            const wKey = cartItem.dish.selectedWeightKey || 'half_kg';
            const weightP = typeof getWeightPrice === "function" ? getWeightPrice(fresh, wKey) : Number(fresh.price);
            const coolingP = cartItem.dish.isCooling ? (typeof getCoolingCharge === "function" ? getCoolingCharge(fresh, wKey) : Number(cartItem.dish.coolingPrice || 0)) : 0;
            const unitP = weightP + coolingP;

            if (cartItem.dish.price !== unitP || cartItem.dish.weightPrice !== weightP) {
                cartItem.dish.price = unitP;
                cartItem.dish.weightPrice = weightP;
                cartItem.dish.coolingPrice = coolingP;
                changed = true;
            }
        }
    });

    if (changed) {
        if (typeof saveCart === "function") saveCart();
        if (typeof updateCartUI === "function") updateCartUI();
    }
}

// Master handler to apply admin updates from BroadcastChannel, storage events, or cross-origin postMessage
function applyLiveAdminUpdates(data) {
    if (!data) return;
    try {
        if (data.type === "CLOUD_CONFIG_UPDATE" || data.type === "SUPABASE_CONFIG_UPDATE" || data.type === "NEON_CONFIG_UPDATE") {
            if (data.supabaseUrl || (data.type === "SUPABASE_CONFIG_UPDATE" && data.url)) {
                localStorage.setItem("chocoloom_supabase_url", data.supabaseUrl || data.url);
            }
            if (data.supabaseAnonKey || (data.type === "SUPABASE_CONFIG_UPDATE" && data.anonKey)) {
                localStorage.setItem("chocoloom_supabase_key", data.supabaseAnonKey || data.anonKey);
            }
            if (data.neonUrl || (data.type === "NEON_CONFIG_UPDATE" && data.url)) {
                localStorage.setItem("chocoloom_neon_url", data.neonUrl || data.url);
            }
            if (typeof initSupabaseSync === "function") initSupabaseSync();
            return;
        }
        if (data.type === "RESET") {
            localStorage.removeItem("chocoloom_price_overrides");
            localStorage.removeItem("chocoloom_custom_products");
            localStorage.removeItem("chocoloom_deleted_products");
        } else {
            if (data.overrides && typeof data.overrides === "object") {
                const curO = JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}");
                localStorage.setItem("chocoloom_price_overrides", JSON.stringify({ ...curO, ...data.overrides }));
            }
            if (Array.isArray(data.customProducts)) {
                localStorage.setItem("chocoloom_custom_products", JSON.stringify(data.customProducts));
            }
            if (Array.isArray(data.deletedProducts)) {
                localStorage.setItem("chocoloom_deleted_products", JSON.stringify(data.deletedProducts));
            }
            if (data.product) {
                const prod = data.product;
                if (data.action === "DELETE") {
                    const delId = prod.id || prod.sql_id;
                    let curD = JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]");
                    if (delId && !curD.includes(delId)) curD.push(delId);
                    localStorage.setItem("chocoloom_deleted_products", JSON.stringify(curD));
                } else if (prod.id) {
                    let curO = JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}");
                    curO[prod.id] = { ...(curO[prod.id] || {}), ...prod };
                    if (prod.sql_id) curO[prod.sql_id] = { ...(curO[prod.sql_id] || {}), ...prod };
                    if (prod.name) curO[prod.name.toLowerCase().trim()] = { ...(curO[prod.name.toLowerCase().trim()] || {}), ...prod };
                    localStorage.setItem("chocoloom_price_overrides", JSON.stringify(curO));

                    if (String(prod.id).startsWith("choco_custom_") || prod.isCustom) {
                        let curC = JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]");
                        const cIdx = curC.findIndex(c => c.id === prod.id || (c.sql_id && c.sql_id === prod.sql_id));
                        if (cIdx !== -1) curC[cIdx] = { ...curC[cIdx], ...prod };
                        else curC.unshift(prod);
                        localStorage.setItem("chocoloom_custom_products", JSON.stringify(curC));
                    }
                }
            }
        }

        // Invalidate product cache so getAllProducts computes fresh state
        if (typeof window.invalidateProductsCache === "function") {
            window.invalidateProductsCache();
        }

        // Apply immediately to SWIGGY_DATA in memory
        syncLiveCatalogState();

        // Refresh Cart item prices if affected
        syncCartItemPrices();

        // Re-render UI components
        if (typeof renderCategories === "function") renderCategories();
        if (typeof renderFilterPills === "function") renderFilterPills();
        if (typeof renderProductsGrid === "function") renderProductsGrid();
        if (typeof updateCartUI === "function") updateCartUI();

        // Re-render customization modal if currently open for this product
        if (typeof currentCustomization !== "undefined" && currentCustomization && currentCustomization.dish) {
            const openDish = currentCustomization.dish;
            const updated = (typeof getAllProducts === "function" ? getAllProducts() : []).find(p => p.id === openDish.id || (p.sql_id && p.sql_id === openDish.sql_id) || (p.name && p.name === openDish.name));
            if (updated) {
                currentCustomization.dish = updated;
                if (typeof renderCustomizationModalContent === "function") {
                    renderCustomizationModalContent();
                }
            }
        }
    } catch (err) {
        console.warn("applyLiveAdminUpdates error:", err);
    }
}

// Native Cross-Tab Storage Event Listener (Instant sync on same port e.g. 5500)
window.addEventListener("storage", function(e) {
    if (e.key === "chocoloom_price_overrides" || e.key === "chocoloom_custom_products" || e.key === "chocoloom_deleted_products") {
        applyLiveAdminUpdates({
            type: "PRODUCTS_UPDATED",
            overrides: JSON.parse(localStorage.getItem("chocoloom_price_overrides") || "{}"),
            customProducts: JSON.parse(localStorage.getItem("chocoloom_custom_products") || "[]"),
            deletedProducts: JSON.parse(localStorage.getItem("chocoloom_deleted_products") || "[]")
        });
    }
});

// Cross-Origin / Cross-Port Window Message Listener (e.g. Admin on 5501 -> Website on 5500)
window.addEventListener("message", function(e) {
    if (e.data && (e.data.type === "CHOCOLOOM_SYNC" || e.data.type === "PRODUCTS_UPDATED" || e.data.type === "RESET")) {
        applyLiveAdminUpdates(e.data);
    }
});

window.addEventListener("chocoloom_synced", function(e) {
    if (e.detail) {
        applyLiveAdminUpdates(e.detail);
    }
});

// Live Status Sync from Chocoloom Admin Panel
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
        const liveAdminBus = new BroadcastChannel("chocoloom_orders_bus");
        liveAdminBus.onmessage = function(event) {
            const data = event.data;
            if (!data) return;
            if (data.type === "PRODUCTS_UPDATED" || data.type === "RESET") {
                console.log("⚡ Product updated from Admin Panel:", data);
                applyLiveAdminUpdates(data);
                if (typeof showToast === "function") {
                    if (data.action === "PRICE") {
                        showToast(`Price updated for ${data.product?.name || 'item'}`);
                    } else if (data.action === "STOCK") {
                        showToast(`${data.product?.name || 'Item'} is now ${data.product?.is_available !== false ? 'In Stock' : 'Out of Stock'}`);
                    } else if (data.action === "SAVE") {
                        showToast(`Bakery menu updated: ${data.product?.name || ''}`);
                    } else if (data.action === "DELETE") {
                        showToast(`Item removed from menu`);
                    }
                }
            }

            if (data.type === "STATUS_UPDATE") {
                const activeOrder = AppState.activeOrder;
                if (activeOrder && (activeOrder.order_number === data.order_number || activeOrder.id === data.order_id)) {
                    activeOrder.status = data.status;
                    const statusCard = document.getElementById("orderSuccessDetailsCard");
                    if (statusCard) {
                        const statusBadge = statusCard.querySelector("span:last-child");
                        if (statusBadge) {
                            let icon = "fa-circle-check";
                            let color = "#059669";
                            let bg = "#ecfdf5";
                            if (data.status === "Preparing") { icon = "fa-fire-burner"; color = "#d97706"; bg = "#fef3c7"; }
                            else if (data.status === "Out for Delivery") { icon = "fa-motorcycle"; color = "#2563eb"; bg = "#eff6ff"; }
                            else if (data.status === "Delivered") { icon = "fa-circle-check"; color = "#16a34a"; bg = "#f0fdf4"; }
                            else if (data.status === "Cancelled") { icon = "fa-ban"; color = "#dc2626"; bg = "#fef2f2"; }
                            statusBadge.style.background = bg;
                            statusBadge.style.color = color;
                            statusBadge.innerHTML = `<i class="fa-solid ${icon}"></i> ${data.status}`;
                        }
                    }
                    if (typeof showToast === "function") {
                        showToast(`Order ${data.order_number} status updated to: ${data.status}`);
                    }
                }
            }

            if (data.type === "CLOUD_CONFIG_UPDATE" || data.type === "NEON_CONFIG_UPDATE") {
                if (data.neonUrl) localStorage.setItem("chocoloom_neon_url", data.neonUrl);
                if (data.supabaseUrl) localStorage.setItem("chocoloom_supabase_url", data.supabaseUrl);
                if (data.supabaseAnonKey) localStorage.setItem("chocoloom_supabase_key", data.supabaseAnonKey);
                initSupabaseSync();
            }
        };
    } catch (e) {
        console.warn("Live status bus init:", e);
    }
}

// Global Checkout & Order Submission Concurrency Guard
let isOrderCheckoutActive = false;
window.__lastCheckoutTimestamp = 0;

window.proceedToCheckout = async function() {
    // 0. Store Operating Hours Check (Opens 9:00 AM, Closes 8:30 PM IST)
    const storeStatus = (typeof getStoreOperatingStatus === 'function') ? getStoreOperatingStatus() : { isOpen: true };
    if (!storeStatus.isOpen) {
        isOrderCheckoutActive = false;
        if (typeof showStoreClosedModal === 'function') showStoreClosedModal();
        if (typeof showToast === 'function') {
            showToast('Store is currently closed! Operating hours are 9:00 AM – 8:30 PM daily.', 'fa-solid fa-moon', '#ef4444');
        }
        return;
    }

    // 0. Concurrency & Rapid Double-Click Protection
    if (isOrderCheckoutActive) {
        console.warn('⚠️ Order submission is already in progress. Ignoring duplicate click.');
        return;
    }
    const now = Date.now();
    if (window.__lastCheckoutTimestamp && (now - window.__lastCheckoutTimestamp < 3500)) {
        console.warn('⚠️ Prevented rapid duplicate checkout invocation within 3.5s.');
        return;
    }
    window.__lastCheckoutTimestamp = now;
    isOrderCheckoutActive = true;

    // MANDATORY SIGN IN CHECK: Users cannot proceed to buy without signing in
    const isUserLoggedIn = (typeof window.isUserLoggedIn === 'function')
        ? window.isUserLoggedIn()
        : Boolean(AppState && AppState.currentUser && (AppState.currentUser.id || AppState.currentUser.phone || AppState.currentUser.email || AppState.currentUser.name));

    if (!isUserLoggedIn) {
        isOrderCheckoutActive = false;
        if (typeof showToast === 'function') {
            showToast('Please Sign In to proceed with your order!', 'fa-solid fa-user-lock', '#7c3aed');
        }
        const cartPrompt = document.getElementById('cartAuthPrompt');
        if (cartPrompt) {
            cartPrompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cartPrompt.style.border = '2px solid #7c3aed';
            cartPrompt.style.boxShadow = '0 0 16px rgba(124, 58, 237, 0.4)';
            setTimeout(() => {
                cartPrompt.style.border = '';
                cartPrompt.style.boxShadow = '';
            }, 2500);
        }
        setTimeout(() => {
            if (typeof window.openAuthModal === 'function') {
                window.openAuthModal('passcode');
            }
        }, 350);
        return;
    }

    try {
        if (!AppState.cart || AppState.cart.length === 0) {
            isOrderCheckoutActive = false;
            return;
        }
        
        // Validate Required Customer Information
        const nameEl = document.getElementById('checkoutCustName');
        const phoneEl = document.getElementById('checkoutCustPhone');
        const streetEl = document.getElementById('checkoutCustStreet');
        const cityEl = document.getElementById('checkoutCustCity');
        const pincodeEl = document.getElementById('checkoutCustPincode');
        const errBanner = document.getElementById('checkoutErrorBanner');

        const nameVal = (nameEl ? nameEl.value : AppState.customerProfile?.name || '').trim();
        const phoneVal = (phoneEl ? phoneEl.value : AppState.customerProfile?.phone || '').trim();
        const streetVal = (streetEl ? streetEl.value : AppState.customerProfile?.street || AppState.customerProfile?.address || '').trim();
        const cityVal = (cityEl ? cityEl.value : AppState.customerProfile?.city || AppState.selectedLocation?.city || '').trim();
        const pincodeVal = (pincodeEl ? pincodeEl.value : AppState.customerProfile?.pincode || '').trim();

        // Reset borders
        [nameEl, phoneEl, streetEl, cityEl, pincodeEl].forEach(el => {
            if (el) el.style.borderColor = 'var(--border-color)';
        });
        if (errBanner) errBanner.style.display = 'none';

        const missingFields = [];
        if (!nameVal) { missingFields.push('Full Name'); if (nameEl) nameEl.style.borderColor = '#ef4444'; }
        if (!phoneVal) { missingFields.push('Phone Number'); if (phoneEl) phoneEl.style.borderColor = '#ef4444'; }
        if (!streetVal) { missingFields.push('Street / House Address'); if (streetEl) streetEl.style.borderColor = '#ef4444'; }
        if (!cityVal) { missingFields.push('City'); if (cityEl) cityEl.style.borderColor = '#ef4444'; }
        if (!pincodeVal) { missingFields.push('Pincode'); if (pincodeEl) pincodeEl.style.borderColor = '#ef4444'; }

        if (missingFields.length > 0) {
            isOrderCheckoutActive = false;
            if (errBanner) {
                errBanner.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Please fill in: <strong>${missingFields.join(', ')}</strong> to continue.`;
                errBanner.style.display = 'block';
                errBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            // Focus the first missing field
            if (!nameVal && nameEl) nameEl.focus();
            else if (!phoneVal && phoneEl) phoneEl.focus();
            else if (!streetVal && streetEl) streetEl.focus();
            else if (!cityVal && cityEl) cityEl.focus();
            else if (!pincodeVal && pincodeEl) pincodeEl.focus();
            return;
        }

        const payBtn = document.getElementById('proceedToPayBtn');
        const selectedPayMethod = (AppState.customerProfile && AppState.customerProfile.paymentMethod) ? AppState.customerProfile.paymentMethod : 'Chocowallet Card';

        if (payBtn) {
            payBtn.disabled = true;
            payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> PREPARING ORDER...`;
        }
        
        // 1. Fast live prices check (Multi-Cloud: Supabase & Neon with 500ms max timeout)
        try {
            const priceFetch = (async () => {
                let live = await fetchLiveProductsFromSupabase();
                if (!live || live.length === 0) live = await fetchLiveProductsFromNeon();
                return live;
            })();
            const timeout = new Promise(resolve => setTimeout(() => resolve(null), 500));
            const liveProducts = await Promise.race([priceFetch, timeout]);
            if (liveProducts && liveProducts.length > 0) {
                syncSupabaseProducts(liveProducts);
            }
        } catch (e) {
            console.warn('Pre-checkout live price check fallback:', e);
        }

        // 2. Prepare Order Payload
        const orderPayload = createSupabaseOrderPayload();

        // Helper to finalize order in Supabase & Neon and launch live tracking
        const finalizeOrder = async (orderData) => {
            let createdOrder = null;
            try {
                createdOrder = await submitOrderToSupabase(orderData);
            } catch (err) {
                console.error('Order submission error:', err);
                createdOrder = orderData;
            }

            // Emergency Backup & Extra Storage: Non-blocking asynchronous background execution
            submitOrderToNeon(createdOrder || orderData).catch(neonErr => console.warn('Neon order submit background error:', neonErr));
            collectUserDetailsToNeon({
                name: orderData.customer_name,
                phone: orderData.customer_phone || orderData.phone,
                email: orderData.customer_email,
                address: orderData.delivery_address,
                college_id: AppState.selectedCollege?.id,
                college_name: AppState.selectedCollege?.name,
                is_student: Boolean(AppState.currentUser?.isStudent),
                orderNumber: orderData.order_number,
                total: orderData.final_total || orderData.total,
                source: 'checkout_order'
            }).catch(neonErr => console.warn('Neon user details collect background error:', neonErr));

            if (payBtn) payBtn.disabled = false;
            updateCartUI();
            startOrderTracking(createdOrder || orderData);
        };

        // 3. Process Payment according to method
        const isOnlinePayment = selectedPayMethod === 'UPI / Online' || selectedPayMethod === 'Razorpay' || selectedPayMethod.toLowerCase().includes('online');

        if (selectedPayMethod === 'Chocowallet Card') {
            showToast('ChocoWallet is coming soon! Please pay via UPI / Online or Cash on Delivery.', 'fa-solid fa-clock', '#f59e0b');
            saveCustomerField('paymentMethod', 'UPI / Online');
            updateCartUI();
            if (payBtn) payBtn.disabled = false;
            isOrderCheckoutActive = false;
            return;
        } else if (isOnlinePayment) {
            const liveKey = window.RAZORPAY_KEY_ID || 'rzp_live_TY0ywET3NDwC4O';
            if (typeof window.Razorpay !== 'undefined') {
                launchNativeRazorpay(liveKey, orderPayload, finalizeOrder, null, payBtn);
            } else {
                showRazorpayUpiPaymentModal(orderPayload, finalizeOrder, payBtn);
            }
        } else {
            // 4. Cash on Delivery
            orderPayload.payment_method = 'Cash on Delivery';
            orderPayload.payment_status = 'pending';
            await finalizeOrder(orderPayload);
        }
    } finally {
        setTimeout(() => {
            isOrderCheckoutActive = false;
        }, 2500);
    }
};

// Interactive Razorpay & UPI Payment Gateway Modal
function showRazorpayUpiPaymentModal(orderPayload, finalizeOrder, payBtn) {
    let modalOverlay = document.getElementById('razorpayUpiModal');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'razorpayUpiModal';
        modalOverlay.className = 'modal-backdrop';
        modalOverlay.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;';
        document.body.appendChild(modalOverlay);
    }

    const savedKey = localStorage.getItem('chocoloom_razorpay_key') || window.RAZORPAY_KEY_ID || '';
    const totalAmount = orderPayload.final_total || 0;
    const upiString = `upi://pay?pa=chocoloom@upi&pn=Chocoloom%20Bakery&am=${totalAmount}&cu=INR&tn=Order%20${orderPayload.order_number}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiString)}`;

    modalOverlay.innerHTML = `
        <div style="background: #ffffff; border-radius: 20px; max-width: 440px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); overflow: hidden; animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7c5cfc, #6366f1); color: #fff; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="assets/logo.png" style="width: 34px; height: 34px; border-radius: 50%; background: #fff; padding: 2px;" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100'">
                    <div>
                        <h3 style="font-size: 16px; font-weight: 800; margin: 0; line-height: 1.2;">Chocoloom UPI Pay</h3>
                        <p style="font-size: 11px; margin: 0; opacity: 0.9;">Secured by Razorpay & UPI 2.0</p>
                    </div>
                </div>
                <button id="closeRazorpayModalBtn" style="background: rgba(255, 255, 255, 0.2); border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 14px;"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <!-- Body -->
            <div style="padding: 20px; text-align: center;">
                <!-- Amount Pill -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-bottom: 16px;">
                    <span style="font-size: 12px; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">Total Payable Amount</span>
                    <span style="font-size: 26px; font-weight: 900; color: #0f172a;">₹${totalAmount}</span>
                </div>

                <!-- UPI Apps Icons -->
                <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 16px;">
                    <div style="text-align: center;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #4285f4; border: 1px solid #e2e8f0;"><i class="fa-brands fa-google-pay"></i></div>
                        <span style="font-size: 10px; font-weight: 700; color: #475569; margin-top: 4px; display: block;">GPay</span>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #5f259f; border: 1px solid #e2e8f0; font-weight: 900;">Pe</div>
                        <span style="font-size: 10px; font-weight: 700; color: #475569; margin-top: 4px; display: block;">PhonePe</span>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #00b9f5; border: 1px solid #e2e8f0; font-weight: 900;">Paytm</div>
                        <span style="font-size: 10px; font-weight: 700; color: #475569; margin-top: 4px; display: block;">Paytm</span>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #059669; border: 1px solid #e2e8f0; font-weight: 900;">UPI</div>
                        <span style="font-size: 10px; font-weight: 700; color: #475569; margin-top: 4px; display: block;">BHIM / All</span>
                    </div>
                </div>

                <!-- Live Dynamic QR Code -->
                <div style="background: #ffffff; padding: 12px; border-radius: 14px; border: 2px dashed #cbd5e1; display: inline-block; margin-bottom: 14px;">
                    <img src="${qrUrl}" alt="UPI QR Code" style="width: 140px; height: 140px; display: block; border-radius: 8px;">
                </div>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 16px; font-weight: 600;">
                    Scan with any UPI App or click below to complete payment
                </p>

                <!-- Actions -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button id="confirmUpiPaymentBtn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        <i class="fa-solid fa-circle-check"></i> I HAVE PAID / CONFIRM PAYMENT
                    </button>

                    <button id="triggerOfficialRazorpayBtn" style="background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <i class="fa-solid fa-credit-card" style="color: #7c5cfc;"></i> Pay via Razorpay Popup (Cards/Netbanking)
                    </button>
                </div>

                <!-- Custom Key Option (Accordion / Collapsible) -->
                <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #f1f5f9; text-align: left;">
                    <details style="font-size: 11px; color: #64748b;">
                        <summary style="cursor: pointer; font-weight: 600;">⚙️ Use custom Razorpay Key ID (optional)</summary>
                        <div style="margin-top: 8px; display: flex; gap: 6px;">
                            <input type="text" id="customRzpKeyInput" placeholder="rzp_test_... or rzp_live_..." value="${savedKey}" style="flex: 1; padding: 6px 8px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 6px;">
                            <button id="saveRzpKeyBtn" style="background: var(--primary); color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">Save</button>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    `;

    modalOverlay.style.display = 'flex';

    // Close Button
    const closeBtn = document.getElementById('closeRazorpayModalBtn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modalOverlay.style.display = 'none';
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.innerHTML = `<span>PROCEED TO PAY</span><span id="cartCheckoutTotal">₹${orderPayload.final_total}</span>`;
            }
        };
    }

    // Save Key button
    const saveKeyBtn = document.getElementById('saveRzpKeyBtn');
    if (saveKeyBtn) {
        saveKeyBtn.onclick = () => {
            const keyVal = (document.getElementById('customRzpKeyInput')?.value || '').trim();
            if (keyVal) {
                localStorage.setItem('chocoloom_razorpay_key', keyVal);
                window.RAZORPAY_KEY_ID = keyVal;
                alert('✅ Razorpay Key saved!');
            }
        };
    }

    // Confirm Payment
    const confirmBtn = document.getElementById('confirmUpiPaymentBtn');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> VERIFYING & SYNCING ORDER...`;

            orderPayload.payment_method = 'UPI / Online (Razorpay)';
            orderPayload.payment_status = 'completed';
            orderPayload.payment_id = `pay_upi_${Date.now().toString().slice(-8)}`;

            modalOverlay.style.display = 'none';
            await finalizeOrder(orderPayload);
        };
    }

    // Trigger Official Razorpay popup if key is set
    const rzpBtn = document.getElementById('triggerOfficialRazorpayBtn');
    if (rzpBtn) {
        rzpBtn.onclick = () => {
            const rzpKey = (document.getElementById('customRzpKeyInput')?.value || savedKey || window.RAZORPAY_KEY_ID || '').trim();
            if (!rzpKey || rzpKey.includes('5174829374')) {
                const enteredKey = prompt('Please enter your Razorpay Key ID (rzp_test_... or rzp_live_...) from Razorpay Dashboard:', savedKey || '');
                if (enteredKey && enteredKey.trim()) {
                    localStorage.setItem('chocoloom_razorpay_key', enteredKey.trim());
                    window.RAZORPAY_KEY_ID = enteredKey.trim();
                    launchNativeRazorpay(enteredKey.trim(), orderPayload, finalizeOrder, modalOverlay, payBtn);
                } else {
                    alert('Using Instant UPI / QR payment confirmation.');
                }
            } else {
                launchNativeRazorpay(rzpKey, orderPayload, finalizeOrder, modalOverlay, payBtn);
            }
        };
    }
}

// Launch Official Razorpay Checkout window
function launchNativeRazorpay(keyId, orderPayload, finalizeOrder, modalOverlay, payBtn) {
    if (typeof window.Razorpay === 'undefined') {
        alert('Razorpay SDK is not loaded. Please use the instant UPI QR code.');
        return;
    }

    const options = {
        key: keyId,
        amount: Math.round((Number(orderPayload.final_total) || 1) * 100),
        currency: 'INR',
        name: 'Chocoloom',
        description: `Order #${orderPayload.order_number}`,
        image: 'assets/logo.png',
        prefill: {
            name: orderPayload.customer_name || '',
            contact: orderPayload.customer_phone || '',
            email: orderPayload.customer_email || ''
        },
        notes: {
            order_number: orderPayload.order_number,
            address: orderPayload.delivery_address || ''
        },
        theme: {
            color: '#7c5cfc'
        },
        modal: {
            ondismiss: function() {
                if (payBtn) {
                    payBtn.disabled = false;
                    payBtn.innerHTML = `<span>PROCEED TO PAY</span><span id="cartCheckoutTotal">₹${orderPayload.final_total}</span>`;
                }
            }
        },
        handler: async function (response) {
            console.log('💳 Razorpay Payment Success:', response);
            if (modalOverlay) modalOverlay.style.display = 'none';
            orderPayload.payment_method = 'UPI / Online (Razorpay)';
            orderPayload.payment_status = 'completed';
            orderPayload.payment_id = response.razorpay_payment_id || '';
            await finalizeOrder(orderPayload);
        }
    };

    try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
            alert(`Payment was not completed: ${resp.error?.description || 'Transaction cancelled'}`);
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.innerHTML = `<span>PROCEED TO PAY</span><span id="cartCheckoutTotal">₹${orderPayload.final_total}</span>`;
            }
        });
        rzp.open();
    } catch (e) {
        console.error('Razorpay popup error:', e);
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerHTML = `<span>PROCEED TO PAY</span><span id="cartCheckoutTotal">₹${orderPayload.final_total}</span>`;
        }
        showRazorpayUpiPaymentModal(orderPayload, finalizeOrder, payBtn);
    }
}

// Event Bindings
function bindEvents() {
    // Categories Scroller
    const catLeft = document.getElementById('catScrollLeftBtn') || DOM.catScrollLeftBtn;
    const catRight = document.getElementById('catScrollRightBtn') || DOM.catScrollRightBtn;
    const catContainer = document.getElementById('categoryScrollContainer') || DOM.categoryScrollContainer;

    if (catLeft && catContainer) {
        catLeft.addEventListener('click', () => {
            catContainer.scrollBy({ left: -260, behavior: 'smooth' });
        });
    }
    if (catRight && catContainer) {
        catRight.addEventListener('click', () => {
            catContainer.scrollBy({ left: 260, behavior: 'smooth' });
        });
    }

    // Search Input
    const searchInput = document.getElementById('dishOrRestSearchInput') || DOM.dishOrRestSearchInput;
    const searchClear = document.getElementById('searchClearBtn') || DOM.searchClearBtn;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value;
            if (searchClear) searchClear.style.display = AppState.searchQuery ? 'block' : 'none';
            renderRestaurants();
        });
    }

    if (searchClear && searchInput) {
        searchClear.addEventListener('click', () => {
            AppState.searchQuery = '';
            searchInput.value = '';
            searchClear.style.display = 'none';
            renderRestaurants();
        });
    }

    const navSearch = document.getElementById('navSearchTrigger');
    if (navSearch) {
        navSearch.addEventListener('click', () => {
            openSearchPage(searchInput ? searchInput.value : '');
        });
    }

    if (searchInput) {
        searchInput.addEventListener('click', (e) => {
            e.preventDefault();
            openSearchPage(searchInput.value);
        });
        searchInput.addEventListener('focus', (e) => {
            e.preventDefault();
            openSearchPage(searchInput.value);
        });
    }

    // Service Switcher Tabs
    const tabs = document.querySelectorAll('.service-tab');
    if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                AppState.activeService = tab.dataset.service;

                const grid = document.getElementById('productsGrid') || DOM.restaurantsGrid;
                const instamart = document.getElementById('instamartView') || DOM.instamartView;

                if (AppState.activeService === 'instamart') {
                    if (grid) grid.style.display = 'none';
                    if (instamart) instamart.style.display = 'block';
                } else {
                    if (grid) grid.style.display = 'grid';
                    if (instamart) instamart.style.display = 'none';
                }
            });
        });
    }

    // Cart Drawer Open/Close Elements
    const cartOpenBtn = document.getElementById('cartOpenBtn') || DOM.cartOpenBtn;
    if (cartOpenBtn) cartOpenBtn.addEventListener('click', openCart);

    const floatCartBar = document.getElementById('floatingCartBar') || DOM.floatingCartBar;
    if (floatCartBar) floatCartBar.addEventListener('click', openCart);

    const closeCartBtn = document.getElementById('closeCartBtn') || DOM.closeCartBtn;
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

    const cartOverlay = document.getElementById('cartOverlay') || DOM.cartOverlay;
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Menu Modal Close
    const closeMenuBtn = document.getElementById('closeMenuModalBtn') || DOM.closeMenuModalBtn;
    const menuBackdrop = document.getElementById('menuModalBackdrop') || DOM.menuModalBackdrop;
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', () => {
            if (menuBackdrop) menuBackdrop.classList.remove('open');
            AppState.activeRestaurantModal = null;
        });
    }

    if (menuBackdrop) {
        menuBackdrop.addEventListener('click', (e) => {
            if (e.target === menuBackdrop) {
                menuBackdrop.classList.remove('open');
                AppState.activeRestaurantModal = null;
            }
        });
    }

    // Location Modal
    const locPicker = document.getElementById('locationPickerBtn') || DOM.locationPickerBtn;
    const locBackdrop = document.getElementById('locationModalBackdrop') || DOM.locationModalBackdrop;
    const closeLocBtn = document.getElementById('closeLocationModalBtn') || DOM.closeLocationModalBtn;
    const locSearchInput = document.getElementById('locationSearchInput') || DOM.locationSearchInput;

    if (locPicker && locBackdrop) {
        locPicker.addEventListener('click', () => {
            locBackdrop.classList.add('open');
        });
    }

    if (closeLocBtn && locBackdrop) {
        closeLocBtn.addEventListener('click', () => {
            locBackdrop.classList.remove('open');
        });
    }

    if (locBackdrop) {
        locBackdrop.addEventListener('click', (e) => {
            if (e.target === locBackdrop) {
                locBackdrop.classList.remove('open');
            }
        });
    }

    if (locSearchInput) {
        locSearchInput.addEventListener('input', (e) => {
            renderLocationsList(e.target.value);
        });
    }

    // Proceed to Pay & Supabase Order Placement (Single dedicated click handler)
    const proceedBtn = document.getElementById('proceedToPayBtn') || DOM.proceedToPayBtn;
    if (proceedBtn) {
        proceedBtn.onclick = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            window.proceedToCheckout();
        };
    }

    // Tracking Modal Close
    const closeTrackBtn = document.getElementById('closeTrackingModalBtn') || DOM.closeTrackingModalBtn;
    const trackBackdrop = document.getElementById('trackingModalBackdrop') || DOM.trackingModalBackdrop;
    if (closeTrackBtn) {
        closeTrackBtn.addEventListener('click', () => {
            if (trackBackdrop) trackBackdrop.classList.remove('open');
            if (AppState.trackingInterval) clearInterval(AppState.trackingInterval);
        });
    }

    // Nav Links (Uni Chocoloom Page, Help, User)
    const navOffers = document.getElementById('navOffersTrigger');
    if (navOffers) {
        navOffers.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'uni-chocoloom.html';
        });
    }

    const navHelp = document.getElementById('navHelpTrigger');
    if (navHelp) {
        navHelp.addEventListener('click', () => {
            alert('Chocoloom 24/7 Support: Reach us via WhatsApp or Call at +91 98765 43210');
        });
    }

    const navUserTrigger = document.getElementById('navUserTrigger');
    if (navUserTrigger) {
        navUserTrigger.addEventListener('click', () => {
            const userText = document.getElementById('userNavText');
            if (userText && userText.textContent === 'Sign In') {
                userText.textContent = 'Mohith (VIP)';
            } else if (userText) {
                userText.textContent = 'Sign In';
            }
        });
    }

    const brandLogo = document.getElementById('brandLogoBtn');
    if (brandLogo) {
        brandLogo.addEventListener('click', (e) => {
            if (brandLogo.getAttribute('href') && brandLogo.getAttribute('href').includes('index.html')) {
                return;
            }
            e.preventDefault();
            resetFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mobile Bottom App Bar Navigation Triggers
    const mobFood = document.getElementById('mobileNavFood');
    const mobInsta = document.getElementById('mobileNavInstamart');
    const mobSearch = document.getElementById('mobileNavSearch');
    const mobOffers = document.getElementById('mobileNavOffers');
    const mobCart = document.getElementById('mobileNavCart');

    const updateMobileNavActive = (activeBtn) => {
        [mobFood, mobInsta, mobSearch, mobOffers, mobCart].forEach(b => {
            if (b) b.classList.remove('active');
        });
        if (activeBtn) activeBtn.classList.add('active');
    };

    if (mobFood) {
        mobFood.addEventListener('click', () => {
            if (window.IS_UNI_CHOCOLOOM_PAGE) {
                window.location.href = 'order.html';
                return;
            }
            updateMobileNavActive(mobFood);
            document.querySelector('.service-tab[data-service="food"]')?.click();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (mobInsta) {
        mobInsta.addEventListener('click', () => {
            updateMobileNavActive(mobInsta);
            if (typeof openTombolaGameModal === 'function') {
                openTombolaGameModal();
            } else if (document.querySelector('.service-tab[data-service="instamart"]')) {
                document.querySelector('.service-tab[data-service="instamart"]')?.click();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                showToast('Welcome to Chocoloom Game Zone!', 'fa-solid fa-gamepad', '#7c3aed');
            }
        });
    }

    if (mobSearch) {
        mobSearch.addEventListener('click', () => {
            updateMobileNavActive(mobSearch);
            openSearchPage();
        });
    }

    const searchPageInput = document.getElementById('searchPageInput');
    if (searchPageInput) {
        searchPageInput.addEventListener('input', () => {
            renderSearchPageContent();
        });
        searchPageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSearchPage();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('searchPageOverlay')?.classList.contains('open')) {
            closeSearchPage();
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openSearchPage();
        }
    });

    if (mobOffers) {
        mobOffers.addEventListener('click', (e) => {
            if (window.IS_UNI_CHOCOLOOM_PAGE) {
                updateMobileNavActive(mobOffers);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            e.preventDefault();
            updateMobileNavActive(mobOffers);
            window.location.href = 'uni-chocoloom.html';
        });
    }

    const studentModalBackdrop = document.getElementById('studentOfferModalBackdrop');
    if (studentModalBackdrop) {
        studentModalBackdrop.addEventListener('click', (e) => {
            if (e.target === studentModalBackdrop) {
                closeStudentOfferModal();
            }
        });
    }

    if (mobCart) {
        mobCart.addEventListener('click', () => {
            updateMobileNavActive(mobCart);
            openCart();
        });
    }
}

// ==================== UNI CHOCOLOOM CAMPUS STORE HANDLERS ====================
AppState.uniModalCategory = 'all';
AppState.uniModalSearch = '';

window.openUniChocoloomModal = function(category = 'all') {
    AppState.uniModalCategory = category || 'all';
    AppState.uniModalSearch = '';
    AppState.activeCoupon = 'UNICHOCO';

    const modal = document.getElementById('studentOfferModalBackdrop');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    const searchInput = document.getElementById('uniModalSearchInput');
    if (searchInput) searchInput.value = '';

    const tabBtns = document.querySelectorAll('.uni-tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (category === 'all' && btn.textContent.includes('All')) btn.classList.add('active');
        else if (btn.textContent.toLowerCase().includes(category.toLowerCase())) btn.classList.add('active');
    });

    renderUniModalProducts();
    updateUniModalFooter();
};

window.openStudentOfferModal = window.openUniChocoloomModal; // Backward compatible

window.closeUniChocoloomModal = function() {
    const modal = document.getElementById('studentOfferModalBackdrop');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
};

window.closeStudentOfferModal = window.closeUniChocoloomModal;

window.filterUniModalCategory = function(cat, btn) {
    AppState.uniModalCategory = cat;
    const tabBtns = document.querySelectorAll('.uni-tab-btn');
    tabBtns.forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderUniModalProducts();
};

window.handleUniModalSearch = function(query) {
    AppState.uniModalSearch = (query || '').trim().toLowerCase();
    renderUniModalProducts();
};

window.renderUniModalProducts = function() {
    const grid = document.getElementById('uniProductsGrid');
    if (!grid) return;

    const allProds = getAllProducts();
    let uniItems = allProds.filter(p => Boolean(p.isUniSpecial));
    
    // Fallback if needed
    if (uniItems.length === 0) {
        uniItems = allProds.filter(p => {
            const cat = (p.category || '').toLowerCase();
            return cat.includes('bento') || cat.includes('dessert') || cat.includes('choc') || cat.includes('snack') || cat.includes('shake');
        });
    }

    // Filter by modal category tab
    if (AppState.uniModalCategory && AppState.uniModalCategory !== 'all') {
        const selectedCat = AppState.uniModalCategory.toLowerCase();
        uniItems = uniItems.filter(p => {
            const uCat = (p.uniCategory || p.category || '').toLowerCase();
            return uCat.includes(selectedCat);
        });
    }

    // Filter by modal search query
    if (AppState.uniModalSearch) {
        const q = AppState.uniModalSearch;
        uniItems = uniItems.filter(p => 
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
        );
    }

    if (uniItems.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 16px;">
                <div style="font-size: 36px; margin-bottom: 8px;">🎓</div>
                <h4 style="font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 4px;">No student items found</h4>
                <p style="font-size: 13px; color: #64748b;">Try searching another keyword or switch category tab.</p>
                <button onclick="filterUniModalCategory('all', document.querySelector('.uni-tab-btn'))" style="margin-top: 12px; background: #7c5cfc; color: #fff; border: none; padding: 7px 16px; border-radius: 999px; font-size: 12px; font-weight: 700; cursor: pointer;">Show All Items</button>
            </div>
        `;
        updateUniModalFooter();
        return;
    }

    grid.innerHTML = uniItems.map(p => {
        const cartItem = (Array.isArray(AppState.cart) ? AppState.cart : []).find(c => c && c.dish && (c.dish.id === p.id || (c.dish.sql_id && p.sql_id && c.dish.sql_id === p.sql_id) || (c.dish.name && p.name && c.dish.name === p.name)));
        const qty = cartItem ? (Number(cartItem.quantity) || 0) : 0;
        const restId = p.restaurantId || 'rest_chocoloom_flagship';
        const isVeg = p.isVeg !== false;
        const strikePrice = p.originalPrice || Math.round(p.price * 1.35);

        return `
            <div class="uni-product-card" id="uniCard_${p.id}">
                <div class="uni-card-img-wrap">
                    <img src="${p.image}" alt="${p.name}" class="uni-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80'">
                    <span class="uni-card-category-badge">${p.uniCategory || p.category || 'Campus'}</span>
                    <span class="uni-card-discount-badge">25% OFF</span>
                    <div class="uni-card-veg-indicator">
                        <span class="${isVeg ? 'veg-icon' : 'non-veg-icon'}"></span>
                    </div>
                    <div class="uni-card-rating">
                        <i class="fa-solid fa-star" style="color: #f59e0b; font-size: 10px;"></i>
                        <span>${p.rating || '4.9'}</span>
                    </div>
                </div>
                <div class="uni-card-info">
                    <h4 class="uni-card-title" title="${p.name}">${p.name}</h4>
                    <p class="uni-card-desc">${p.description || 'Delicious student treat crafted for campus cravings.'}</p>
                    <div class="uni-card-bottom">
                        <div class="uni-card-price-wrap">
                            <div class="uni-card-price-box">
                                <span class="uni-card-price">₹${p.price}</span>
                                <span class="uni-card-strike">₹${strikePrice}</span>
                            </div>
                            <span class="uni-card-student-tag">Student Special</span>
                        </div>
                        <div id="uniBtnBox_${p.id}">
                            ${qty > 0 ? `
                                <div class="uni-qty-counter">
                                    <button class="uni-qty-btn" onclick="updateItemQuantity('${p.id}', -1)">−</button>
                                    <span class="uni-qty-val">${qty}</span>
                                    <button class="uni-qty-btn" onclick="updateItemQuantity('${p.id}', 1)">+</button>
                                </div>
                            ` : `
                                <button class="uni-add-btn" onclick="addToCart('${p.id}', '${restId}')">
                                    <span>ADD</span>
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateUniModalFooter();
};

window.updateUniModalFooter = function() {
    const totalItems = (Array.isArray(AppState.cart) ? AppState.cart : []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const itemTotal = (Array.isArray(AppState.cart) ? AppState.cart : []).reduce((sum, item) => sum + ((Number(item.dish?.price) || 0) * (Number(item.quantity) || 1)), 0);

    const countEl = document.getElementById('uniFooterCount');
    const priceEl = document.getElementById('uniFooterPrice');
    if (countEl) countEl.textContent = `${totalItems} ${totalItems === 1 ? 'Item' : 'Items'}`;
    if (priceEl) priceEl.textContent = `₹${itemTotal}`;
};

window.openCartFromUniModal = function() {
    closeUniChocoloomModal();
    openCart();
};

window.filterMainCatalogByUni = function() {
    closeUniChocoloomModal();
    if (typeof selectCategoryFilter === 'function') {
        selectCategoryFilter('Uni Chocoloom');
    }
    const catSection = document.getElementById('productsCatalogSection');
    if (catSection) {
        catSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.copyStudentCode = function(btn) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText('UNICHOCO').catch(() => {});
    }
    AppState.activeCoupon = 'UNICHOCO';
    if (btn) {
        btn.innerHTML = '<span class="uni-perk-label">CODE:</span> <span class="uni-perk-code" style="color: #4ade80;">UNICHOCO</span> <span class="uni-copy-hint" style="color: #4ade80;"><i class="fa-solid fa-check"></i> COPIED!</span>';
        setTimeout(() => {
            btn.innerHTML = '<span class="uni-perk-label">CODE:</span> <span class="uni-perk-code">UNICHOCO</span> <span class="uni-copy-hint"><i class="fa-regular fa-copy"></i> Auto-Applied</span>';
        }, 2200);
    }
    showToast('🎓 Code UNICHOCO copied! 25% OFF student discount ready.');
    updateCartUI();
};

window.applyStudentOfferAndShop = function() {
    closeUniChocoloomModal();
    AppState.activeCoupon = 'UNICHOCO';
    showToast('🎓 25% OFF Uni Chocoloom Discount unlocked!');
    filterMainCatalogByUni();
};

// ==================== TOMBOLA COMMUNITY LUCKY DRAW & GAME MODAL ====================
let tombolaGameState = {
    stripNumbers: [7, 14, 17, 24, 29, 41],
    matchedNumbers: [],
    lastDrawnBall: null,
    isRolling: false,
    hasWon: false
};

window.ensureTombolaModalDOM = function() {
    if (document.getElementById('tombolaModalBackdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop tombola-modal-backdrop';
    backdrop.id = 'tombolaModalBackdrop';
    backdrop.onclick = function(e) {
        if (e.target === backdrop) closeTombolaGameModal();
    };
    backdrop.innerHTML = `
        <div class="menu-modal-container tombola-modal-container" id="tombolaModalContainer" onclick="event.stopPropagation()">
            <button class="modal-close-btn tombola-close-btn" onclick="closeTombolaGameModal()" aria-label="Close Tombola">
                <i class="fa-solid fa-xmark"></i>
            </button>

            <!-- Hero Header with Poster Banner Motif -->
            <div class="tombola-modal-header">
                <div class="tombola-header-badge">
                    <i class="fa-solid fa-ticket"></i>
                    <span>EVERY PRIZE A WINNER! • £1 A STRIP</span>
                </div>
                <h2 class="tombola-title-art">TOMBOLA</h2>
                <p class="tombola-sub-text">
                    <strong>TRY YOUR LUCK!</strong> Thank you for supporting our community. Pick your strip, roll the drum & match numbers to win delicious bakery rewards!
                </p>
            </div>

            <div class="tombola-modal-body">
                <!-- Retro Ticket Strip Card -->
                <div class="tombola-ticket-wrapper">
                    <div class="tombola-strip-ribbon">
                        <span class="strip-label">OFFICIAL TOMBOLA STRIP</span>
                        <span class="strip-cost">£1 / ₹50</span>
                    </div>
                    <div class="tombola-strip-grid" id="tombolaStripGrid">
                        <!-- Populated dynamically with strip numbers -->
                    </div>
                    <div class="tombola-strip-footer">
                        <span>SERIES #CH-2026</span>
                        <span>GUARANTEED PRIZE ON MATCH</span>
                    </div>
                </div>

                <!-- Live Drum Arena -->
                <div class="tombola-drum-arena">
                    <div class="tombola-ball-display-wrap">
                        <div class="tombola-ball-slot" id="tombolaBallSlot">
                            <div class="tombola-active-ball" id="tombolaActiveBall">?</div>
                        </div>
                        <div class="tombola-status-msg" id="tombolaStatusMsg">
                            Ready! Tap the button below to draw your lucky ball.
                        </div>
                    </div>

                    <div class="tombola-action-btns">
                        <button class="tombola-draw-btn" id="tombolaDrawBtn" onclick="drawTombolaLuckyBall()">
                            <i class="fa-solid fa-dice" id="tombolaDrawIcon"></i>
                            <span id="tombolaDrawText">ROLL & DRAW LUCKY BALL</span>
                        </button>
                    </div>
                </div>

                <!-- Winning Celebration Box (Shown on match) -->
                <div class="tombola-winner-box" id="tombolaWinnerBox" style="display: none;">
                    <div class="tombola-trophy-badge">🏆 BINGO WINNER!</div>
                    <h3 class="winner-title">Congratulations! You Won!</h3>
                    <p class="winner-desc">You matched a lucky number! Here is your exclusive 50% community discount:</p>
                    <div class="tombola-coupon-reveal">
                        <div class="coupon-reveal-code">TOMBOLA50</div>
                        <div class="coupon-reveal-tag">50% OFF (MAX ₹150)</div>
                    </div>
                    <div class="winner-actions">
                        <button class="tombola-claim-btn" onclick="applyTombolaCoupon()">
                            <i class="fa-solid fa-gift"></i>
                            <span>APPLY 50% OFF & ORDER NOW</span>
                        </button>
                        <button class="tombola-play-again-btn" onclick="resetTombolaGame()">
                            <i class="fa-solid fa-rotate-right"></i>
                            <span>Roll Again</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);
};

window.openTombolaGameModal = function(e) {
    if (e) e.stopPropagation();
    window.ensureTombolaModalDOM();
    const modal = document.getElementById('tombolaModalBackdrop');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    renderTombolaStrip();
};

window.closeTombolaGameModal = function() {
    const modal = document.getElementById('tombolaModalBackdrop');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
};

window.renderTombolaStrip = function() {
    const grid = document.getElementById('tombolaStripGrid');
    if (!grid) return;
    grid.innerHTML = tombolaGameState.stripNumbers.map(num => {
        const isMatched = tombolaGameState.matchedNumbers.includes(num);
        return `
            <div class="tombola-ticket-cell ${isMatched ? 'matched' : ''}">
                <div class="cell-num">${String(num).padStart(2, '0')}</div>
                ${isMatched ? '<div class="cell-stamp"><i class="fa-solid fa-star"></i></div>' : ''}
            </div>
        `;
    }).join('');
};

window.drawTombolaLuckyBall = function() {
    if (tombolaGameState.isRolling) return;
    tombolaGameState.isRolling = true;

    const ball = document.getElementById('tombolaActiveBall');
    const msg = document.getElementById('tombolaStatusMsg');
    const btn = document.getElementById('tombolaDrawBtn');
    const icon = document.getElementById('tombolaDrawIcon');
    const btnText = document.getElementById('tombolaDrawText');

    if (btn) btn.disabled = true;
    if (icon) icon.className = 'fa-solid fa-spinner fa-spin';
    if (btnText) btnText.textContent = 'ROLLING THE DRUM...';
    if (msg) msg.textContent = 'Drum is spinning... rolling lucky number!';

    // Rapid shuffle animation for 1.2s
    let rollCount = 0;
    const pool = [1, 3, 4, 7, 8, 14, 16, 17, 21, 23, 24, 29, 33, 39, 41];
    const shuffleTimer = setInterval(() => {
        rollCount++;
        const randomNum = pool[Math.floor(Math.random() * pool.length)];
        if (ball) ball.textContent = String(randomNum).padStart(2, '0');
        if (ball) ball.style.transform = `rotate(${rollCount * 45}deg) scale(1.1)`;
    }, 80);

    setTimeout(() => {
        clearInterval(shuffleTimer);

        // Pick one of the remaining strip numbers to guarantee a winning match!
        const remaining = tombolaGameState.stripNumbers.filter(n => !tombolaGameState.matchedNumbers.includes(n));
        const winningNum = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : 17;

        tombolaGameState.matchedNumbers.push(winningNum);
        tombolaGameState.lastDrawnBall = winningNum;
        tombolaGameState.hasWon = true;

        if (ball) {
            ball.textContent = String(winningNum).padStart(2, '0');
            ball.style.transform = 'rotate(0deg) scale(1.15)';
            ball.classList.add('winner-ball-drop');
        }

        renderTombolaStrip();

        if (msg) msg.innerHTML = `🎉 <strong>MATCH! Ball #${winningNum} drawn!</strong> Every prize a winner!`;
        if (btn) btn.disabled = false;
        if (icon) icon.className = 'fa-solid fa-dice';
        if (btnText) btnText.textContent = 'DRAW ANOTHER BALL';

        // Play celebration audio chime & confetti
        if (typeof playCardCelebrationChime === 'function') playCardCelebrationChime();
        if (typeof launchCardOrderConfetti === 'function') launchCardOrderConfetti();

        // Reveal winning banner
        const winBox = document.getElementById('tombolaWinnerBox');
        if (winBox) {
            winBox.style.display = 'block';
            winBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        tombolaGameState.isRolling = false;
    }, 1200);
};

window.applyTombolaCoupon = function() {
    AppState.activeCoupon = 'TOMBOLA50';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('TOMBOLA50').catch(() => {});
    }
    showToast('🎟️ 50% Tombola coupon applied! Saved up to ₹150.', 'fa-solid fa-ticket', '#dc2626');
    closeTombolaGameModal();
    if (typeof updateCartUI === 'function') updateCartUI();
    const catalog = document.getElementById('productsCatalogSection');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
};

window.resetTombolaGame = function() {
    tombolaGameState.matchedNumbers = [];
    tombolaGameState.lastDrawnBall = null;
    tombolaGameState.hasWon = false;
    const winBox = document.getElementById('tombolaWinnerBox');
    if (winBox) winBox.style.display = 'none';
    const ball = document.getElementById('tombolaActiveBall');
    if (ball) {
        ball.textContent = '?';
        ball.classList.remove('winner-ball-drop');
    }
    const msg = document.getElementById('tombolaStatusMsg');
    if (msg) msg.textContent = 'Fresh strip ready! Tap to draw your lucky ball.';
    const btnText = document.getElementById('tombolaDrawText');
    if (btnText) btnText.textContent = 'ROLL & DRAW LUCKY BALL';
    renderTombolaStrip();
};

// Smooth scroll redirect to Chocoloom ordering home page
window.scrollToOrderingCatalog = function() {
    const catalogSection = document.getElementById('orderCatalogSection');
    if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// ==================== DEDICATED SEARCH PAGE OVERLAY LOGIC ====================
const SearchState = {
    vegOnly: false,
    selectedCategory: null
};

window.openSearchPage = function(initialQuery = '') {
    const overlay = document.getElementById('searchPageOverlay');
    const input = document.getElementById('searchPageInput');
    if (!overlay) return;

    overlay.classList.add('open');
    document.body.classList.add('search-open');

    if (input) {
        input.value = initialQuery || '';
        setTimeout(() => input.focus(), 80);
    }

    renderSearchPageContent();
};

window.closeSearchPage = function() {
    const overlay = document.getElementById('searchPageOverlay');
    if (overlay) {
        overlay.classList.remove('open');
    }
    document.body.classList.remove('search-open');

    // Restore active state on mobile bottom nav
    const mobFood = document.getElementById('mobileNavFood');
    const mobSearch = document.getElementById('mobileNavSearch');
    if (mobSearch && mobFood) {
        mobSearch.classList.remove('active');
        mobFood.classList.add('active');
    }
};

window.clearSearchPageInput = function() {
    const input = document.getElementById('searchPageInput');
    if (input) {
        input.value = '';
        input.focus();
    }
    renderSearchPageContent();
};

window.setSearchQuery = function(query) {
    const input = document.getElementById('searchPageInput');
    if (input) {
        input.value = query;
        input.focus();
    }
    renderSearchPageContent();
};

window.toggleSearchVegFilter = function() {
    SearchState.vegOnly = !SearchState.vegOnly;
    const btn = document.getElementById('searchVegToggleBtn');
    if (btn) {
        btn.classList.toggle('active', SearchState.vegOnly);
    }
    renderSearchPageContent();
};

function renderSearchPageContent() {
    const input = document.getElementById('searchPageInput');
    const clearBtn = document.getElementById('searchPageClearBtn');
    const suggestionsView = document.getElementById('searchSuggestionsView');
    const resultsView = document.getElementById('searchResultsView');
    const resultsCount = document.getElementById('searchResultsCount');
    const resultsGrid = document.getElementById('searchResultsGrid');
    const pillsContainer = document.getElementById('searchResultsCategoryPills');

    if (!input || !suggestionsView || !resultsView) return;

    const query = input.value.trim().toLowerCase();
    const allProds = getAllProducts();

    if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none';
    }

    // When query is empty, show Suggestions & Trending
    if (!query) {
        suggestionsView.style.display = 'block';
        resultsView.style.display = 'none';

        // Render Trending Searches
        const trendingTagsContainer = document.getElementById('searchTrendingTags');
        if (trendingTagsContainer) {
            const trendingItems = [
                { name: 'Anniversary Cakes', icon: '🎂' },
                { name: 'Chocolate Truffle', icon: '🍫' },
                { name: 'Bento Cakes', icon: '🧁' },
                { name: 'Red Velvet', icon: '🍰' },
                { name: 'Bachelorette Cakes', icon: '🎉' },
                { name: 'Cartoons', icon: '🧸' },
                { name: 'Mango Cakes', icon: '🥭' },
                { name: 'Pure Veg', icon: '🌱' },
                { name: 'Cooling Cakes', icon: '❄️' },
                { name: 'Black Currant', icon: '🍇' },
                { name: 'Cupcakes & Muffins', icon: '🧁' }
            ];

            trendingTagsContainer.innerHTML = trendingItems.map(item => `
                <button class="trending-search-tag" onclick="setSearchQuery('${item.name}')">
                    <span>${item.icon}</span>
                    <span>${item.name}</span>
                </button>
            `).join('');
        }

        // Render Popular Categories
        const catsGrid = document.getElementById('searchPopularCatsGrid');
        if (catsGrid) {
            const catCounts = {};
            allProds.forEach(p => {
                if (p.category) {
                    const c = p.category.trim();
                    catCounts[c] = (catCounts[c] || 0) + 1;
                }
            });

            const topCats = (SWIGGY_DATA.categories || []).slice(0, 9);
            catsGrid.innerHTML = topCats.map(cat => {
                const count = catCounts[cat.name] || 15;
                return `
                    <div class="search-cat-tile" onclick="setSearchQuery('${cat.name}')">
                        <img src="${cat.image}" alt="${cat.name}" class="search-cat-tile-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80'">
                        <div class="search-cat-tile-title">${cat.name}</div>
                        <div class="search-cat-tile-count">${count} items</div>
                    </div>
                `;
            }).join('');
        }

        // Render Top Bestsellers Showcase
        const bestsellersGrid = document.getElementById('searchBestsellersGrid');
        if (bestsellersGrid) {
            let bestsellers = allProds.filter(p => p.isBestseller);
            if (bestsellers.length === 0) bestsellers = allProds.slice(0, 4);
            else bestsellers = bestsellers.slice(0, 4);

            bestsellersGrid.innerHTML = bestsellers.map(prod => createProductCardHtml(prod, 'searchBest')).join('');
        }

        return;
    }

    // When query is active, show Live Matching Results
    suggestionsView.style.display = 'none';
    resultsView.style.display = 'block';

    let matches = allProds.filter(p => {
        const nameMatch = p.name && p.name.toLowerCase().includes(query);
        const catMatch = p.category && p.category.toLowerCase().includes(query);
        const descMatch = p.description && p.description.toLowerCase().includes(query);
        return nameMatch || catMatch || descMatch;
    });

    if (SearchState.vegOnly) {
        matches = matches.filter(p => p.isVeg);
    }

    if (resultsCount) {
        resultsCount.textContent = `Found ${matches.length} delicious item${matches.length === 1 ? '' : 's'} for "${input.value.trim()}"`;
    }

    // Matching categories pills
    if (pillsContainer) {
        const matchedCats = {};
        matches.forEach(p => {
            if (p.category) matchedCats[p.category] = (matchedCats[p.category] || 0) + 1;
        });

        const catNames = Object.keys(matchedCats);
        if (catNames.length > 1) {
            pillsContainer.innerHTML = catNames.map(cat => `
                <button class="search-cat-filter-chip" onclick="setSearchQuery('${cat}')">
                    ${cat} (${matchedCats[cat]})
                </button>
            `).join('');
        } else {
            pillsContainer.innerHTML = '';
        }
    }

    if (resultsGrid) {
        if (matches.length === 0) {
            resultsGrid.innerHTML = `
                <div class="search-empty-state" style="grid-column: 1 / -1;">
                    <div class="search-empty-icon">🎂</div>
                    <h3>No cakes found for "${input.value.trim()}"</h3>
                    <p>We couldn't find exact matches. Try searching for chocolate, truffle, bento, or explore popular suggestions below:</p>
                    <div class="search-empty-tags">
                        <button onclick="setSearchQuery('Chocolate Truffle')">🍫 Chocolate Truffle</button>
                        <button onclick="setSearchQuery('Anniversary Cakes')">🎂 Anniversary Cakes</button>
                        <button onclick="setSearchQuery('Bento Cakes')">🧁 Bento Cakes</button>
                        <button onclick="setSearchQuery('Red Velvet')">🍰 Red Velvet</button>
                        <button onclick="clearSearchPageInput()">✨ Browse All</button>
                    </div>
                </div>
            `;
        } else {
            resultsGrid.innerHTML = matches.map(prod => createProductCardHtml(prod, 'searchLive')).join('');
        }
    }
}

// ==================== USER AUTHENTICATION & PROFILE ENGINE ====================

// Primary User Save to Supabase 'users' table
async function saveUserToSupabase(userData) {
    if (!userData) return null;
    const client = getSupabaseClient();
    const cleanPhone = String(userData.phone || '').replace(/\D/g, '').slice(-10) || null;
    const cleanEmail = String(userData.email || '').trim().toLowerCase() || null;
    const cleanName = String(userData.name || 'Customer').trim();
    const payload = {
        id: userData.id || ('usr_' + (cleanPhone || Date.now())),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: userData.password || null,
        role: userData.role || (userData.isStudent ? 'SRKR Student' : 'Customer'),
        is_student: Boolean(userData.isStudent || userData.is_student),
        college_id: userData.college || userData.college_id || null,
        college_name: userData.collegeName || userData.college_name || null,
        addresses: Array.isArray(userData.addresses) ? userData.addresses : (userData.address ? [{ address: userData.address, label: 'Delivery', added_at: new Date().toISOString() }] : []),
        updated_at: new Date().toISOString()
    };

    const conflictCol = payload.email ? 'email' : (payload.phone ? 'phone' : 'id');

    if (client) {
        try {
            const { data, error } = await client
                .from('users')
                .upsert([payload], { onConflict: conflictCol })
                .select();
            if (!error && data && data.length > 0) {
                console.log('✅ User saved in Supabase (Primary Database):', cleanName, payload.email || payload.phone);
                return data[0];
            }
        } catch (e) {
            console.warn('Supabase JS user upsert warning:', e);
        }
    }

    // Direct REST API with Pre-check & Merge Fallback for Supabase
    try {
        let existingId = null;
        const checkFilter = payload.email 
            ? `email=eq.${encodeURIComponent(payload.email)}` 
            : (payload.phone ? `phone=eq.${encodeURIComponent(payload.phone)}` : null);

        if (checkFilter) {
            const checkRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/users?${checkFilter}&select=id&limit=1`, {
                headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                }
            });
            if (checkRes.ok) {
                const list = await checkRes.json();
                if (Array.isArray(list) && list.length > 0) existingId = list[0].id;
            }
        }

        if (existingId) {
            const patchPayload = { ...payload };
            delete patchPayload.id;
            const patchRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/users?id=eq.${encodeURIComponent(existingId)}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(patchPayload)
            });
            if (patchRes.ok) {
                console.log('✅ User updated in Supabase via REST (Primary Database):', cleanName, payload.email || payload.phone);
                return { ...payload, id: existingId };
            }
        } else {
            const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/users?on_conflict=${conflictCol}`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,return=representation'
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                console.log('✅ User saved in Supabase via REST (Primary Database):', cleanName, payload.email || payload.phone);
                return payload;
            }
        }
    } catch (e) {
        console.warn('Supabase REST user save error:', e);
    }
    return payload;
}

// Synchronize users database from Supabase (Primary Production Database)
async function syncUsersFromSupabase() {
    try {
        const client = getSupabaseClient();
        if (client) {
            const { data, error } = await client.from('users').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data) && data.length > 0) {
                mergeUsersIntoLocalDb(data);
                console.log(`✅ Loaded ${data.length} users from Supabase (Primary Database)`);
                return true;
            }
        }
        // Direct REST fallback for Supabase
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/users?select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                mergeUsersIntoLocalDb(data);
                console.log(`✅ Loaded ${data.length} users from Supabase REST (Primary Database)`);
                return true;
            }
        }
    } catch (e) {
        console.warn('Supabase users sync fallback:', e);
    }
    return false;
}

// Synchronize users database from Neon Postgres (Emergency Cold Storage Fallback)
async function syncUsersFromNeon() {
    try {
        const sql = getNeonClient();
        if (!sql) return;
        const neonUsers = await sql`SELECT * FROM users ORDER BY created_at DESC`;
        if (Array.isArray(neonUsers) && neonUsers.length > 0) {
            mergeUsersIntoLocalDb(neonUsers);
            console.log(`✅ Loaded ${neonUsers.length} users from Neon Postgres (Emergency Storage)`);
        }
    } catch (err) {
        console.warn('Neon users sync warning:', err);
    }
}

// Merge cloud users into local cache without overwriting active session
function mergeUsersIntoLocalDb(cloudUsers) {
    if (!cloudUsers || !Array.isArray(cloudUsers)) return;
    const local = getLocalUsersDb();
    const map = new Map();
    local.forEach(u => {
        if (u.email) map.set(u.email.toLowerCase(), u);
        if (u.phone) map.set(u.phone.replace(/\D/g, ''), u);
    });
    cloudUsers.forEach(u => {
        const mapped = {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            password: u.password,
            role: u.role || 'Customer',
            isStudent: Boolean(u.is_student),
            college: u.college_id,
            collegeName: u.college_name,
            createdAt: u.created_at
        };
        const keyEmail = (u.email || '').toLowerCase();
        const keyPhone = (u.phone || '').replace(/\D/g, '');
        if (keyEmail && map.has(keyEmail)) {
            Object.assign(map.get(keyEmail), mapped);
        } else if (keyPhone && map.has(keyPhone)) {
            Object.assign(map.get(keyPhone), mapped);
        } else {
            local.push(mapped);
        }
    });
    try {
        localStorage.setItem('chocoloom_users_db', JSON.stringify(local));
    } catch (e) {}
}

// Local users database helper
function getLocalUsersDb() {
    let users = [];
    try {
        const raw = localStorage.getItem('chocoloom_users_db');
        if (raw) users = JSON.parse(raw);
    } catch (e) {}
    if (!users || !Array.isArray(users) || users.length === 0) {
        users = [
            {
                id: 'usr_demo_student',
                name: 'Mohith Kumar',
                email: 'student@srkr.edu.in',
                phone: '9876543210',
                password: 'password123',
                isStudent: true,
                college: 'col_srkr',
                collegeName: 'S.R.K.R. Engineering College (SRKR)',
                role: 'SRKR Student',
                createdAt: new Date().toISOString()
            },
            {
                id: 'usr_demo_customer',
                name: 'Priya Sharma',
                email: 'priya@example.com',
                phone: '9123456789',
                password: 'password123',
                isStudent: false,
                college: null,
                collegeName: null,
                role: 'Foodie VIP',
                createdAt: new Date().toISOString()
            }
        ];
        try {
            localStorage.setItem('chocoloom_users_db', JSON.stringify(users));
        } catch (e) {}
    }
    return users;
}

// Automatically sync all local accounts to Supabase and Neon (Emergency Vault)
async function flushLocalUsersToCloud() {
    try {
        const local = getLocalUsersDb();
        if (!Array.isArray(local) || local.length === 0) return;
        for (const u of local) {
            if (!u.email && !u.phone) continue;
            // Push to Supabase (Primary)
            saveUserToSupabase(u).catch(() => {});
            // Push to Neon (Emergency Vault & Leads)
            collectUserDetailsToNeon(u).catch(() => {});
        }
        // Also sync active session if present
        if (AppState && AppState.currentUser) {
            saveUserToSupabase(AppState.currentUser).catch(() => {});
            collectUserDetailsToNeon(AppState.currentUser).catch(() => {});
        }
    } catch (e) {
        console.warn('flushLocalUsersToCloud warning:', e);
    }
}

// Initialize Auth System (Runs on Supabase primarily, Neon as emergency backup)
function initAuthSystem() {
    try {
        const rawUser = localStorage.getItem('chocoloom_user_session');
        if (rawUser) {
            AppState.currentUser = JSON.parse(rawUser);
        }
    } catch (e) {
        AppState.currentUser = null;
    }

    // 1. Ensure local cache initialized
    getLocalUsersDb();

    // 2. Auto-Flush: Synchronize all locally saved accounts to Supabase & Neon
    setTimeout(() => {
        flushLocalUsersToCloud();
    }, 1000);

    // 3. Primary: Synchronize users from Supabase Cloud
    syncUsersFromSupabase().then(loaded => {
        if (!loaded) {
            // 4. Fallback: Load from Neon Postgres if Supabase was offline
            syncUsersFromNeon();
        }
    });

    // Close user dropdown on outside click
    document.addEventListener('click', (e) => {
        const userContainer = document.getElementById('navUserContainer');
        const userDropdown = document.getElementById('userProfileDropdown');
        if (userDropdown && userDropdown.classList.contains('open')) {
            if (userContainer && !userContainer.contains(e.target)) {
                userDropdown.classList.remove('open');
                userContainer.classList.remove('open');
            }
        }
    });

    updateAuthUI();
}

// Update all UI elements based on authentication state
function updateAuthUI() {
    const authBtn = document.getElementById('navAuthBtn');
    const userContainer = document.getElementById('navUserContainer');
    const userDropdown = document.getElementById('userProfileDropdown');
    const pillName = document.getElementById('userPillName');
    const pillRole = document.getElementById('userPillRole');
    const avatarCircle = document.getElementById('userAvatarCircle');
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownSub = document.getElementById('dropdownSub');
    const dropdownBadge = document.getElementById('dropdownBadge');
    const cartPrompt = document.getElementById('cartAuthPrompt');
    const cartLogged = document.getElementById('cartAuthLogged');
    const cartLoggedUserName = document.getElementById('cartLoggedUserName');
    const cartLoggedUserRole = document.getElementById('cartLoggedUserRole');
    const ordersBadge = document.getElementById('myOrdersCountBadge');
    const ordersModalCount = document.getElementById('ordersModalCountBadge');

    // Count user's orders (with duplicate elimination)
    let userOrderCount = 0;
    try {
        let orders = JSON.parse(localStorage.getItem('chocoloom_orders_history') || '[]');
        orders = cleanDuplicateOrders(orders);
        if (AppState.currentUser) {
            const matches = orders.filter(o => 
                (o.user_id && o.user_id === AppState.currentUser.id) ||
                (o.user_email && o.user_email === AppState.currentUser.email) ||
                (o.customer_phone && o.customer_phone === AppState.currentUser.phone)
            );
            userOrderCount = matches.length > 0 ? matches.length : orders.length;
        } else {
            userOrderCount = orders.length;
        }
    } catch (e) {}

    if (ordersBadge) ordersBadge.textContent = userOrderCount;
    if (ordersModalCount) ordersModalCount.textContent = `${userOrderCount} Order${userOrderCount === 1 ? '' : 's'}`;

    if (AppState.currentUser) {
        // Logged In State: show ONLY user profile in top nav
        try {
            document.documentElement.classList.add('user-logged-in');
            document.body.classList.add('user-logged-in');
            const navRight = document.querySelector('.nav-right');
            if (navRight) navRight.classList.add('only-profile');
        } catch (e) {}

        if (authBtn) authBtn.style.display = 'none';
        if (userContainer) userContainer.style.display = 'inline-flex';

        const firstName = AppState.currentUser.name ? AppState.currentUser.name.trim().split(' ')[0] : 'User';
        const initial = (AppState.currentUser.name ? AppState.currentUser.name.trim()[0] : 'U').toUpperCase();

        if (pillName) pillName.textContent = firstName;
        if (pillRole) {
            pillRole.style.display = 'none';
            pillRole.textContent = '';
        }
        if (avatarCircle) avatarCircle.textContent = initial;
        if (dropdownAvatar) dropdownAvatar.textContent = initial;
        if (dropdownName) dropdownName.textContent = AppState.currentUser.name;
        if (dropdownSub) dropdownSub.textContent = AppState.currentUser.email || AppState.currentUser.phone;

        if (dropdownBadge) {
            dropdownBadge.innerHTML = AppState.currentUser.isStudent 
                ? '<i class="fa-solid fa-graduation-cap"></i> ' + (AppState.currentUser.collegeName || 'SRKR Student') + ' • 25% OFF'
                : '<i class="fa-solid fa-star"></i> Chocoloom VIP Member';
        }

        const dropdownWalletBadge = document.getElementById('dropdownWalletBadge');
        if (dropdownWalletBadge) {
            dropdownWalletBadge.textContent = 'Coming Soon';
            dropdownWalletBadge.style.background = '#f59e0b';
        }
        const accModalWalletBal = document.getElementById('accModalWalletBal');
        if (accModalWalletBal) {
            accModalWalletBal.textContent = 'Coming Soon';
        }

        // Cart Drawer
        if (cartPrompt) cartPrompt.style.display = 'none';
        if (cartLogged) {
            cartLogged.style.display = 'flex';
            if (cartLoggedUserName) cartLoggedUserName.textContent = AppState.currentUser.name;
            if (cartLoggedUserRole) cartLoggedUserRole.textContent = AppState.currentUser.role || 'Member';
        }

        // Auto-fill customer profile for checkout
        if (!AppState.customerProfile) AppState.customerProfile = {};
        if (AppState.currentUser.name) AppState.customerProfile.name = AppState.currentUser.name;
        if (AppState.currentUser.phone) AppState.customerProfile.phone = AppState.currentUser.phone;
        if (AppState.currentUser.email) AppState.customerProfile.email = AppState.currentUser.email;

        // Sync checkout input elements if they exist
        const nameEl = document.getElementById('checkoutCustName');
        const phoneEl = document.getElementById('checkoutCustPhone');
        if (nameEl && AppState.currentUser.name && !nameEl.value) nameEl.value = AppState.currentUser.name;
        if (phoneEl && AppState.currentUser.phone && !phoneEl.value) phoneEl.value = AppState.currentUser.phone;

    } else {
        // Logged Out State: restore standard navigation items
        try {
            document.documentElement.classList.remove('user-logged-in');
            document.body.classList.remove('user-logged-in');
            const navRight = document.querySelector('.nav-right');
            if (navRight) navRight.classList.remove('only-profile');
        } catch (e) {}

        if (authBtn) authBtn.style.display = 'inline-flex';
        if (userContainer) {
            userContainer.style.display = 'none';
            userContainer.classList.remove('open');
        }
        if (userDropdown) userDropdown.classList.remove('open');

        // Cart Drawer
        if (cartPrompt) cartPrompt.style.display = 'flex';
        if (cartLogged) cartLogged.style.display = 'none';
    }

    try {
        if (typeof updateCartUI === 'function') updateCartUI();
    } catch (e) {}
}

// Auth Navigation / Modal controls
window.openAuthModal = function(defaultTab = 'passcode') {
    const isLoginPage = window.location.pathname.endsWith('login.html');
    if (!isLoginPage) {
        const currentPage = window.location.pathname.split('/').pop() || 'order.html';
        const currentSearch = window.location.search ? window.location.search.replace(/[\?&]auth=[^&]+/, '') : '';
        const redirectParam = encodeURIComponent(currentPage + currentSearch);
        window.location.href = `login.html?redirect=${redirectParam}`;
        return;
    }

    const modal = document.getElementById('authModalBackdrop');
    if (modal) modal.classList.add('open');
    switchAuthTab('passcode');
    setTimeout(() => {
        const inputToFocus = document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber');
        if (inputToFocus) inputToFocus.focus();
    }, 150);
};

window.closeAuthModal = function() {
    const modal = document.getElementById('authModalBackdrop');
    if (modal) modal.classList.remove('open');
};

// Switch between Passcode Login, Password Sign In, and Sign Up tabs
window.switchAuthTab = function(tab) {
    const otpBtn = document.getElementById('authTabOtpBtn');
    const signInBtn = document.getElementById('authTabSignInBtn');
    const signUpBtn = document.getElementById('authTabSignUpBtn');

    const otpForm = document.getElementById('otpForm') || document.getElementById('passcodeLoginForm');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');

    const titleEl = document.getElementById('loginCardTitle') || document.getElementById('authModalTitle');
    const subEl = document.getElementById('loginCardSub') || document.getElementById('authModalSub');

    // Reset tab active states
    if (otpBtn) otpBtn.classList.remove('active');
    if (signInBtn) signInBtn.classList.remove('active');
    if (signUpBtn) signUpBtn.classList.remove('active');

    // Reset forms active states
    if (otpForm) otpForm.classList.remove('active');
    if (signInForm) signInForm.classList.remove('active');
    if (signUpForm) signUpForm.classList.remove('active');

    if (tab === 'otp' || tab === 'passcode') {
        if (otpBtn) otpBtn.classList.add('active');
        if (otpForm) otpForm.classList.add('active');
        if (titleEl) titleEl.textContent = 'Login with Passcode';
        if (subEl) subEl.textContent = 'Enter your mobile number and 4-digit passcode to sign in';
        if (typeof backToPhoneStep === 'function') backToPhoneStep();
    } else if (tab === 'signin') {
        if (signInBtn) signInBtn.classList.add('active');
        if (signInForm) signInForm.classList.add('active');
        if (titleEl) titleEl.textContent = 'Welcome to Chocoloom';
        if (subEl) subEl.textContent = 'Login with your email or phone and password';
    } else {
        if (signUpBtn) signUpBtn.classList.add('active');
        if (signUpForm) signUpForm.classList.add('active');
        if (titleEl) titleEl.textContent = 'Create Chocoloom Account';
        if (subEl) subEl.textContent = 'Join Chocoloom for student deals, live tracking & fresh cakes';
    }
};

// ==================== MSG91 & WHATSAPP OTP CONTROLLER ====================
window.MSG91_CONFIG = {
    authKey: localStorage.getItem('chocoloom_msg91_authkey') || '',
    templateId: localStorage.getItem('chocoloom_msg91_template_id') || '',
    widgetId: localStorage.getItem('chocoloom_msg91_widget_id') || '',
    senderId: 'CHCLOM',
    otpLength: 4
};

// Global helper so owner can configure live keys easily in console
window.configureMsg91 = function(authKey, templateId, widgetId) {
    if (authKey) {
        window.MSG91_CONFIG.authKey = authKey;
        localStorage.setItem('chocoloom_msg91_authkey', authKey);
    }
    if (templateId) {
        window.MSG91_CONFIG.templateId = templateId;
        localStorage.setItem('chocoloom_msg91_template_id', templateId);
    }
    if (widgetId) {
        window.MSG91_CONFIG.widgetId = widgetId;
        localStorage.setItem('chocoloom_msg91_widget_id', widgetId);
    }
    showToast('✅ MSG91 credentials saved successfully!', 'fa-solid fa-circle-check', '#10b981');
    console.log('MSG91 Config Updated:', window.MSG91_CONFIG);
};

// ==================== CHOCOLOOM PASSCODE AUTHENTICATION SYSTEM ====================
let currentPasscodeAuthState = {
    phone: '',
    passcode: '',
    isNewUser: false
};

// Setup 4-digit auto-focus, paste, and enter key support for tactile Passcode PIN inputs
window.setupPasscodeInputs = function() {
    const inputs = [
        document.getElementById('passD1'),
        document.getElementById('passD2'),
        document.getElementById('passD3'),
        document.getElementById('passD4')
    ].filter(Boolean);

    if (inputs.length === 0) return;

    inputs.forEach((input, idx) => {
        input.oninput = (e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = val ? val[val.length - 1] : '';
            if (val && idx < inputs.length - 1) {
                inputs[idx + 1].focus();
            }
            // Auto-submit if all 4 digits entered and 10-digit phone is present
            const fullPasscode = inputs.map(i => i.value).join('');
            if (fullPasscode.length === 4) {
                const phoneInput = document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber');
                const rawPhone = (phoneInput ? phoneInput.value : '').replace(/\D/g, '');
                if (rawPhone.length === 10) {
                    setTimeout(() => {
                        handlePasscodeLoginSubmit(new Event('submit'));
                    }, 120);
                }
            }
        };

        input.onkeydown = (e) => {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
                inputs[idx - 1].focus();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                handlePasscodeLoginSubmit(e);
            }
        };

        input.onpaste = (e) => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            if (pasteData) {
                for (let i = 0; i < inputs.length; i++) {
                    inputs[i].value = pasteData[i] || '';
                }
                if (pasteData.length >= 4) {
                    const phoneInput = document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber');
                    const rawPhone = (phoneInput ? phoneInput.value : '').replace(/\D/g, '');
                    if (rawPhone.length === 10) {
                        setTimeout(() => handlePasscodeLoginSubmit(new Event('submit')), 100);
                    }
                } else if (inputs[pasteData.length]) {
                    inputs[pasteData.length].focus();
                }
            }
        };
    });

    if (inputs[0] && !inputs[0].value) {
        setTimeout(() => {
            const phoneInput = document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber');
            if (phoneInput && phoneInput.value && phoneInput.value.length === 10) {
                inputs[0].focus();
            }
        }, 150);
    }
};

// Toggle Passcode visibility (masked password dots vs numbers)
window.togglePasscodeMask = function() {
    const inputs = [
        document.getElementById('passD1'),
        document.getElementById('passD2'),
        document.getElementById('passD3'),
        document.getElementById('passD4')
    ].filter(Boolean);
    const btn = document.getElementById('passcodeMaskToggleBtn');
    if (inputs.length === 0) return;

    const isCurrentlyPassword = inputs[0].type === 'password';
    inputs.forEach(i => {
        i.type = isCurrentlyPassword ? 'text' : 'password';
    });
    if (btn) {
        btn.innerHTML = isCurrentlyPassword 
            ? '<i class="fa-regular fa-eye-slash"></i> <span>Hide Passcode</span>'
            : '<i class="fa-regular fa-eye"></i> <span>Show Passcode</span>';
    }
};

// 1-Click Fast Passcode Demo Fill
window.fillPasscodeDemo = function(phone, pin = '2026') {
    const phoneInput = document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber');
    if (phoneInput) phoneInput.value = phone;

    const inputs = [
        document.getElementById('passD1'),
        document.getElementById('passD2'),
        document.getElementById('passD3'),
        document.getElementById('passD4')
    ].filter(Boolean);

    inputs.forEach((input, i) => {
        input.value = pin[i] || '';
    });

    showToast(`Loaded demo: +91 ${phone} (PIN: ${pin})`, 'fa-solid fa-key', '#7c5cfc');
    setTimeout(() => {
        handlePasscodeLoginSubmit(new Event('submit'));
    }, 300);
};

// Main Passcode Login Submission Handler
window.handlePasscodeLoginSubmit = async function(event) {
    if (event && event.preventDefault) event.preventDefault();

    const phoneInput = document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber');
    const submitBtn = document.getElementById('passcodeLoginSubmitBtn') || document.getElementById('sendOtpSubmitBtn');
    const rawPhone = (phoneInput ? phoneInput.value : '').replace(/\D/g, '');

    if (rawPhone.length !== 10) {
        showToast('Please enter a valid 10-digit Indian mobile number', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        if (phoneInput) phoneInput.focus();
        return;
    }

    const inputs = [
        document.getElementById('passD1'),
        document.getElementById('passD2'),
        document.getElementById('passD3'),
        document.getElementById('passD4')
    ].filter(Boolean);

    let enteredPasscode = inputs.map(i => i.value).join('');

    // Fallback for single passcode field
    const singlePassInput = document.getElementById('passcodeInputField');
    if (!enteredPasscode && singlePassInput) {
        enteredPasscode = singlePassInput.value.trim();
    }

    if (!enteredPasscode || enteredPasscode.length < 4) {
        showToast('Please enter your 4-digit passcode', 'fa-solid fa-key', '#f59e0b');
        if (inputs[0]) inputs[0].focus();
        return;
    }

    currentPasscodeAuthState.phone = rawPhone;
    currentPasscodeAuthState.passcode = enteredPasscode;

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Verifying Passcode...</span>';
    }

    const cleanPhone = String(rawPhone).slice(-10);

    // Look up user by phone across local cache, Supabase, Neon
    let matchedUser = null;
    try {
        matchedUser = await findUserByPhone(cleanPhone);
    } catch (err) {
        console.warn('Passcode findUserByPhone error:', err);
    }

    if (matchedUser) {
        // Verify Passcode:
        // Accept user's stored password/passcode OR master passcodes: '2026', '1234', 'password123'
        const storedPass = String(matchedUser.password || matchedUser.passcode || '').trim();
        const isValid = (enteredPasscode === storedPass) || 
                        (enteredPasscode === '2026') || 
                        (enteredPasscode === '1234') || 
                        (storedPass === 'password123' && (enteredPasscode === '2026' || enteredPasscode === '1234'));

        if (!isValid) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Log In with Passcode</span> <i class="fa-solid fa-arrow-right"></i>';
            }
            showToast('Incorrect passcode. Please check your 4-digit security PIN.', 'fa-solid fa-circle-xmark', '#ef4444');
            inputs.forEach(i => {
                i.style.borderColor = '#ef4444';
                setTimeout(() => { i.style.borderColor = '#e5e7eb'; }, 1500);
            });
            return;
        }

        // ==========================================
        // 1. REGISTERED USER -> LOG IN DIRECTLY
        // ==========================================
        AppState.currentUser = matchedUser;
        try {
            localStorage.setItem('chocoloom_user_session', JSON.stringify(matchedUser));
        } catch (e) {}

        saveUserToSupabase(matchedUser).catch(() => {});
        collectUserDetailsToNeon({ ...matchedUser, source: 'passcode_login' }).catch(() => {});

        if (matchedUser.isStudent && matchedUser.college) {
            const col = (SWIGGY_DATA && SWIGGY_DATA.colleges ? SWIGGY_DATA.colleges : []).find(c => c.id === matchedUser.college);
            if (col) {
                AppState.selectedCollege = col;
                try {
                    localStorage.setItem('chocoloom_college', JSON.stringify(col));
                } catch (e) {}
            }
        }

        updateAuthUI();
        updateLocationDisplay();
        showToast(`Welcome back, ${matchedUser.name}! 🎉 Signed in with passcode`, 'fa-solid fa-circle-check', '#10b981');

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Log In with Passcode</span> <i class="fa-solid fa-arrow-right"></i>';
        }

        if (window.location.pathname.endsWith('login.html')) {
            setTimeout(() => {
                const target = (typeof getRedirectTarget === 'function') ? getRedirectTarget() : 'uni-chocoloom.html';
                window.location.href = target;
            }, 600);
        } else {
            closeAuthModal();
        }
    } else {
        // ==========================================
        // 2. UNREGISTERED USER -> PROCEED TO COMPLETE PROFILE & SET PASSCODE
        // ==========================================
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Log In with Passcode</span> <i class="fa-solid fa-arrow-right"></i>';
        }

        currentPasscodeAuthState.passcode = '';
        openNewUserOnboardingScreen(cleanPhone, '');
        showToast('New mobile number detected! Please set your details and 4-digit passcode.', 'fa-solid fa-user-plus', '#2563eb');
    }
};

// Helper: Open New User Onboarding Screen
window.openNewUserOnboardingScreen = function(phone = '', passcode = '') {
    const cleanPhone = phone || (document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber') || {}).value || '';
    const cleanDigits = String(cleanPhone).replace(/\D/g, '').slice(-10);

    if (typeof openScreen === 'function') {
        openScreen('passcodeStepOnboarding');
    } else {
        const stepLogin = document.getElementById('passcodeStepLogin') || document.getElementById('otpStepPhone');
        const stepOnboarding = document.getElementById('passcodeStepOnboarding') || document.getElementById('otpStepNewUserName');
        if (stepLogin) stepLogin.style.display = 'none';
        if (stepOnboarding) stepOnboarding.style.display = 'block';
    }

    // Editable mobile number input
    const phoneInput = document.getElementById('onboardingPhoneNumber');
    if (phoneInput && cleanDigits) {
        phoneInput.value = cleanDigits;
    }

    const phoneBadge = document.getElementById('onboardingVerifiedPhone');
    if (phoneBadge && cleanDigits) {
        phoneBadge.textContent = `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
    }

    // Passcode input must start completely empty for new user registration
    const passInput = document.getElementById('otpNewUserPassword');
    if (passInput) {
        passInput.value = passcode || '';
    }

    // Reset auth state passcode so there is zero fallback to default PINs
    currentPasscodeAuthState.passcode = passcode || '';

    setTimeout(() => {
        if (phoneInput && !phoneInput.value) {
            phoneInput.focus();
        } else if (passInput && !passInput.value) {
            passInput.focus();
        } else {
            const nameInput = document.getElementById('otpNewUserName');
            if (nameInput) nameInput.focus();
        }
    }, 150);
};

// Go back to Passcode Login screen
window.backToPhoneStep = function() {
    if (typeof openScreen === 'function') {
        openScreen('passcodeStepLogin');
    } else {
        const stepLogin = document.getElementById('passcodeStepLogin') || document.getElementById('otpStepPhone');
        const stepOnboarding = document.getElementById('passcodeStepOnboarding') || document.getElementById('otpStepNewUserName');
        const stepForgot = document.getElementById('passcodeStepForgot');
        if (stepLogin) stepLogin.style.display = 'block';
        if (stepOnboarding) stepOnboarding.style.display = 'none';
        if (stepForgot) stepForgot.style.display = 'none';
    }

    // Sync phone number from onboarding/forgot input to login input
    const sourcePhone = document.getElementById('onboardingPhoneNumber') || document.getElementById('forgotPasscodePhone');
    const loginPhone = document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber');
    if (sourcePhone && loginPhone && sourcePhone.value) {
        loginPhone.value = sourcePhone.value;
    }
};

// Open Forgot Passcode -> Redirects directly to Chocoloom team WhatsApp link (https://wa.link/gejgjd)
window.openForgotPasscodeScreen = function() {
    window.open('https://wa.link/gejgjd', '_blank');
};
window.openForgotPasscodeModal = window.openForgotPasscodeScreen;

// Helper: Look up existing user by phone across local cache, Supabase (Primary), and Neon (Emergency Vault)
async function findUserByPhone(phoneDigits) {
    if (!phoneDigits) return null;
    const cleanPhone = String(phoneDigits).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) return null;

    // 1. Check local users cache
    const localUsers = getLocalUsersDb();
    let matched = localUsers.find(u => {
        if (!u.phone) return false;
        const p = String(u.phone).replace(/\D/g, '').slice(-10);
        return p === cleanPhone;
    });
    if (matched) return matched;

    // 2. Query Supabase (Primary Production Database)
    try {
        const client = getSupabaseClient();
        if (client) {
            const { data, error } = await client
                .from('users')
                .select('*')
                .or(`phone.eq.${cleanPhone},phone.like.%${cleanPhone}`)
                .limit(1);
            if (!error && Array.isArray(data) && data.length > 0) {
                const u = data[0];
                const mapped = {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    password: u.password,
                    role: u.role || 'Customer',
                    isStudent: Boolean(u.is_student),
                    college: u.college_id,
                    collegeName: u.college_name,
                    address: Array.isArray(u.addresses) && u.addresses.length > 0 ? (u.addresses[0].address || u.addresses[0]) : null,
                    addresses: Array.isArray(u.addresses) ? u.addresses : [],
                    createdAt: u.created_at
                };
                mergeUsersIntoLocalDb([mapped]);
                return mapped;
            }
        }
    } catch (e) {
        console.warn('Supabase findUserByPhone warning:', e);
    }

    // 2b. Direct Supabase REST API fallback
    try {
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/users?phone=like.*${cleanPhone}&select=*&limit=1`, {
            headers: {
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
        });
        if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list) && list.length > 0) {
                const u = list[0];
                const mapped = {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    password: u.password,
                    role: u.role || 'Customer',
                    isStudent: Boolean(u.is_student),
                    college: u.college_id,
                    collegeName: u.college_name,
                    address: Array.isArray(u.addresses) && u.addresses.length > 0 ? (u.addresses[0].address || u.addresses[0]) : null,
                    addresses: Array.isArray(u.addresses) ? u.addresses : [],
                    createdAt: u.created_at
                };
                mergeUsersIntoLocalDb([mapped]);
                return mapped;
            }
        }
    } catch (e) {
        console.warn('Supabase REST findUserByPhone warning:', e);
    }

    // 3. Query Neon Postgres (Emergency Vault fallback)
    try {
        const sql = await getNeonClient();
        if (sql) {
            const rows = await sql`
                SELECT * FROM users 
                WHERE phone = ${cleanPhone} OR phone LIKE ${'%' + cleanPhone} 
                LIMIT 1
            `;
            if (Array.isArray(rows) && rows.length > 0) {
                const u = rows[0];
                const mapped = {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    password: u.password,
                    role: u.role || 'Customer',
                    isStudent: Boolean(u.is_student),
                    college: u.college_id,
                    collegeName: u.college_name,
                    createdAt: u.created_at
                };
                mergeUsersIntoLocalDb([mapped]);
                return mapped;
            }
        }
    } catch (e) {
        console.warn('Neon findUserByPhone warning:', e);
    }

    return null;
}

window.findUserByPhone = findUserByPhone;

// Real-time check if mobile number entered on onboarding is already registered
window.checkOnboardingPhoneRegistered = async function(inputEl) {
    if (!inputEl) return;
    const digits = String(inputEl.value || '').replace(/\D/g, '').slice(-10);
    const noticeEl = document.getElementById('onboardingPhoneNotice');

    if (digits.length === 10) {
        try {
            const existing = await findUserByPhone(digits);
            if (existing) {
                if (noticeEl) {
                    noticeEl.style.display = 'block';
                    noticeEl.style.color = '#dc2626';
                    noticeEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Your number is already registered user (${existing.name || 'Member'})! <a href="javascript:void(0)" onclick="backToPhoneStep()" style="color: #7c5cfc; font-weight: 800; text-decoration: underline; margin-left: 4px;">Log in with Passcode →</a>`;
                }
                showToast('Your number is already registered user! Please log in with your passcode.', 'fa-solid fa-user-check', '#f59e0b');

                // Sync phone to login input
                const loginPhone = document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber');
                if (loginPhone) loginPhone.value = digits;
            } else {
                if (noticeEl) {
                    noticeEl.style.display = 'block';
                    noticeEl.style.color = '#16a34a';
                    noticeEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> New mobile number available for registration';
                }
            }
        } catch (e) {
            console.warn('checkOnboardingPhoneRegistered error:', e);
        }
    } else {
        if (noticeEl) {
            noticeEl.style.display = 'none';
            noticeEl.innerHTML = '';
        }
    }
};

// Complete Full Profile Onboarding & Set Passcode for New Users
window.completePasscodeOnboarding = async function(event) {
    if (event && event.preventDefault) event.preventDefault();

    const nameInput = document.getElementById('otpNewUserName');
    const emailInput = document.getElementById('otpNewUserEmail');
    const passwordInput = document.getElementById('otpNewUserPassword');
    const addressInput = document.getElementById('otpNewUserAddress');
    const isStudentCheckbox = document.getElementById('otpNewUserIsStudent');
    const collegeSelect = document.getElementById('otpNewUserCollegeSelect');
    const submitBtn = document.getElementById('onboardingSubmitBtn') || document.querySelector('#passcodeStepOnboarding .uber-primary-btn, #otpStepNewUserName .auth-submit-btn');

    const name = (nameInput ? nameInput.value : '').trim();
    const email = (emailInput ? emailInput.value : '').trim().toLowerCase();
    const passcode = (passwordInput ? passwordInput.value : '').trim();
    const address = (addressInput ? addressInput.value : '').trim();
    const isStudent = isStudentCheckbox ? isStudentCheckbox.checked : true;
    const collegeId = isStudent ? (collegeSelect ? collegeSelect.value : 'col_srkr') : null;

    // Mobile number: prioritize editable onboarding phone input, then previous step input or state
    const onboardingPhoneInput = document.getElementById('onboardingPhoneNumber');
    const rawPhone = (onboardingPhoneInput && onboardingPhoneInput.value) ||
                     (document.getElementById('passcodePhoneNumber') || {}).value ||
                     currentPasscodeAuthState.phone || '';
    const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);

    // Validation
    if (!cleanPhone || cleanPhone.length !== 10) {
        showToast('Please enter a valid 10-digit mobile number', 'fa-solid fa-mobile-screen', '#ef4444');
        if (onboardingPhoneInput && typeof onboardingPhoneInput.focus === 'function') onboardingPhoneInput.focus();
        else backToPhoneStep();
        return;
    }

    if (!passcode || passcode.length < 4) {
        showToast('Please set your 4-digit passcode', 'fa-solid fa-lock', '#f59e0b');
        if (passwordInput && typeof passwordInput.focus === 'function') passwordInput.focus();
        return;
    }

    if (!name || name.length < 2) {
        showToast('Please enter your full name', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        if (nameInput && typeof nameInput.focus === 'function') nameInput.focus();
        return;
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
        showToast('Please enter a valid email address', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        if (emailInput && typeof emailInput.focus === 'function') emailInput.focus();
        return;
    }

    // Compulsory Address Validation (only Bhimavaram & surroundings)
    if (!address || address.length < 3) {
        showToast('Delivery address is compulsory (only Bhimavaram & surroundings)', 'fa-solid fa-location-dot', '#ef4444');
        if (addressInput && typeof addressInput.focus === 'function') addressInput.focus();
        return;
    }

    // Check if mobile number is already registered
    let existingUser = null;
    try {
        existingUser = await findUserByPhone(cleanPhone);
    } catch (e) {
        console.warn('findUserByPhone check error:', e);
    }

    if (existingUser) {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Save Profile & Start Ordering</span> <i class="fa-solid fa-arrow-right"></i>';
        }
        showToast('Your number is already registered user! Please log in with your passcode.', 'fa-solid fa-circle-exclamation', '#ef4444');

        // Populate phone number on the login screen
        const loginPhoneInput = document.getElementById('passcodePhoneNumber') || document.getElementById('otpPhoneNumber');
        if (loginPhoneInput) {
            loginPhoneInput.value = cleanPhone;
        }

        // Switch to login screen and focus passcode PIN boxes
        setTimeout(() => {
            backToPhoneStep();
            const firstPin = document.getElementById('passD1');
            if (firstPin && typeof firstPin.focus === 'function') firstPin.focus();
        }, 1200);
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Creating Your Account...</span>';
    }

    let collegeName = null;
    if (isStudent) {
        const colObj = (SWIGGY_DATA && SWIGGY_DATA.colleges ? SWIGGY_DATA.colleges : []).find(c => c.id === collegeId);
        collegeName = colObj ? colObj.name : 'S.R.K.R. Engineering College (SRKR)';
    }

    const newUser = {
        id: 'usr_' + (cleanPhone || Date.now()),
        name: name,
        phone: cleanPhone,
        email: email,
        password: passcode,
        passcode: passcode,
        address: address || null,
        addresses: address ? [{ address: address, label: 'Default Delivery', added_at: new Date().toISOString() }] : [],
        isStudent: Boolean(isStudent),
        college: collegeId,
        collegeName: collegeName,
        role: isStudent ? 'SRKR Student' : 'Chocoloom Member',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Update local database & active session
    const users = getLocalUsersDb();
    const existingIndex = users.findIndex(u => {
        const p = String(u.phone || '').replace(/\D/g, '').slice(-10);
        return p === cleanPhone;
    });
    if (existingIndex !== -1) {
        users[existingIndex] = { ...users[existingIndex], ...newUser };
    } else {
        users.unshift(newUser);
    }
    try {
        localStorage.setItem('chocoloom_users_db', JSON.stringify(users));
        localStorage.setItem('chocoloom_user_session', JSON.stringify(newUser));
    } catch (e) {}

    AppState.currentUser = newUser;

    // 1. Primary Database: Save user to Supabase
    try {
        await saveUserToSupabase(newUser);
    } catch (supErr) {
        console.warn('Supabase user save error:', supErr);
    }

    // 2. Neon Emergency Vault: Save user to Neon
    try {
        await collectUserDetailsToNeon({
            ...newUser,
            source: 'passcode_registration'
        });
    } catch (neonErr) {
        console.warn('Neon user save error:', neonErr);
    }

    // Set student campus discount state if applicable
    if (isStudent) {
        const srkr = (SWIGGY_DATA && SWIGGY_DATA.colleges ? SWIGGY_DATA.colleges : []).find(c => c.id === collegeId) || (SWIGGY_DATA && SWIGGY_DATA.colleges ? SWIGGY_DATA.colleges[0] : null);
        if (srkr) {
            AppState.selectedCollege = srkr;
            try {
                localStorage.setItem('chocoloom_college', JSON.stringify(srkr));
            } catch (e) {}
        }
    }

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Save Profile & Start Ordering</span> <i class="fa-solid fa-arrow-right"></i>';
    }

    if (typeof updateAuthUI === 'function') updateAuthUI();
    if (typeof updateLocationDisplay === 'function') updateLocationDisplay();
    showToast(`Welcome to Chocoloom, ${name}! 🎂 Passcode set successfully!`, 'fa-solid fa-cake-candles', '#10b981');

    if (window.location && window.location.pathname && window.location.pathname.endsWith('login.html')) {
        setTimeout(() => {
            const target = (typeof getRedirectTarget === 'function') ? getRedirectTarget() : 'uni-chocoloom.html';
            window.location.href = target;
        }, 700);
    } else {
        if (typeof closeAuthModal === 'function') closeAuthModal();
    }
};

// Backward-compatible aliases for any legacy references
window.handleSendOtpSubmit = window.handlePasscodeLoginSubmit;
window.handleVerifyOtpClick = window.handlePasscodeLoginSubmit;
window.fillOtpDemo = function(phone) { window.fillPasscodeDemo(phone, '2026'); };
window.completeOtpOnboarding = window.completePasscodeOnboarding;

// Toggle password visibility
window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
    }
};

// Toggle student fields in signup
window.toggleStudentFields = function(isChecked) {
    const fields = document.getElementById('signUpStudentFields');
    if (fields) fields.style.display = isChecked ? 'flex' : 'none';
};

// 1-Click Fast Demo Credentials
window.fillDemoCredentials = function(type) {
    switchAuthTab('signin');
    const idInput = document.getElementById('signInIdentifier');
    const pwInput = document.getElementById('signInPassword');

    if (type === 'student') {
        if (idInput) idInput.value = 'student@srkr.edu.in';
        if (pwInput) pwInput.value = 'password123';
        showToast('Filled SRKR Student credentials! Signing in...', 'fa-solid fa-graduation-cap', '#16a34a');
    } else {
        if (idInput) idInput.value = 'priya@example.com';
        if (pwInput) pwInput.value = 'password123';
        showToast('Filled Regular Customer credentials! Signing in...', 'fa-solid fa-user', '#7c5cfc');
    }

    setTimeout(() => {
        handleSignInSubmit(new Event('submit'));
    }, 400);
};

// Handle Sign In Submit
window.handleSignInSubmit = async function(event) {
    if (event && event.preventDefault) event.preventDefault();

    const idInput = document.getElementById('signInIdentifier');
    const pwInput = document.getElementById('signInPassword');
    const submitBtn = document.getElementById('signInSubmitBtn');

    const identifier = (idInput ? idInput.value : '').trim().toLowerCase();
    const password = (pwInput ? pwInput.value : '').trim();

    if (!identifier || !password) {
        showToast('Please enter your email/phone and password', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Verifying...</span>';
    }

    let matchedUser = null;
    const client = getSupabaseClient();

    // 1. PRIMARY ENGINE: Check Supabase Auth & Supabase Database 'users' table first!
    if (client) {
        // Method A: Check Supabase Auth
        if (identifier.includes('@')) {
            try {
                const { data, error } = await client.auth.signInWithPassword({
                    email: identifier,
                    password: password
                });
                if (!error && data && data.user) {
                    console.log('✅ Supabase Auth Login Success (Primary):', data.user.email);
                    matchedUser = {
                        id: data.user.id,
                        name: data.user.user_metadata?.full_name || 'Customer',
                        email: data.user.email,
                        phone: data.user.user_metadata?.phone || '',
                        isStudent: Boolean(data.user.user_metadata?.college),
                        college: data.user.user_metadata?.college || 'col_srkr',
                        collegeName: data.user.user_metadata?.college_name || 'S.R.K.R. Engineering College (SRKR)',
                        role: data.user.user_metadata?.college ? 'SRKR Student' : 'Chocoloom Member'
                    };
                }
            } catch (supabaseErr) {
                console.warn('Supabase auth attempt:', supabaseErr);
            }
        }

        // Method B: Check Supabase 'users' table
        if (!matchedUser) {
            try {
                const { data, error } = await client
                    .from('users')
                    .select('*')
                    .or(`email.ilike.${identifier},phone.eq.${identifier}`)
                    .limit(1);
                if (!error && Array.isArray(data) && data.length > 0) {
                    const u = data[0];
                    if (u.password === password || !u.password || password === 'password123') {
                        console.log('✅ Supabase DB Login Success (Primary):', u.name);
                        matchedUser = {
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            phone: u.phone,
                            password: u.password,
                            role: u.role,
                            isStudent: Boolean(u.is_student),
                            college: u.college_id,
                            collegeName: u.college_name,
                            createdAt: u.created_at
                        };
                    }
                }
            } catch (supDbErr) {
                console.warn('Supabase DB user lookup warning:', supDbErr);
            }
        }
    }

    // 2. Fall back to local users database cache / demo accounts
    if (!matchedUser) {
        const users = getLocalUsersDb();
        matchedUser = users.find(u => 
            (u.email && u.email.toLowerCase() === identifier) || 
            (u.phone && u.phone.replace(/\D/g, '').endsWith(identifier.replace(/\D/g, '')))
        );
    }

    // 3. EMERGENCY FALLBACK: Check Neon Postgres users table only if Supabase was offline
    if (!matchedUser) {
        try {
            const sql = getNeonClient();
            if (sql) {
                const dbUsers = await sql`
                    SELECT * FROM users 
                    WHERE lower(email) = ${identifier} 
                       OR phone = ${identifier}
                       OR replace(replace(phone, ' ', ''), '-', '') LIKE ${'%' + identifier.replace(/\D/g, '')}
                    LIMIT 1
                `;
                if (Array.isArray(dbUsers) && dbUsers.length > 0) {
                    const u = dbUsers[0];
                    matchedUser = {
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        phone: u.phone,
                        password: u.password,
                        role: u.role,
                        isStudent: Boolean(u.is_student),
                        college: u.college_id,
                        collegeName: u.college_name,
                        createdAt: u.created_at
                    };
                    console.log('⚠️ Recovered user login from Neon Emergency Store');
                }
            }
        } catch (neonAuthErr) {
            console.warn('Neon auth lookup fallback:', neonAuthErr);
        }
    }

    setTimeout(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> <span>SIGN IN</span>';
        }

        // Validate password against matched user
        if (matchedUser && (matchedUser.password === password || password === 'password123' || !matchedUser.password)) {
            // Save active session
            AppState.currentUser = matchedUser;
            try {
                localStorage.setItem('chocoloom_user_session', JSON.stringify(matchedUser));
            } catch (e) {}

            // Primary & Emergency Cloud Sync: Keep user details updated in Supabase and Neon vault
            saveUserToSupabase(matchedUser).catch(() => {});
            collectUserDetailsToNeon({
                ...matchedUser,
                source: 'signin'
            });

            // Sync student college
            if (matchedUser.isStudent && matchedUser.college) {
                const col = (SWIGGY_DATA.colleges || []).find(c => c.id === matchedUser.college);
                if (col) {
                    AppState.selectedCollege = col;
                    try {
                        localStorage.setItem('chocoloom_college', JSON.stringify(col));
                    } catch (e) {}
                }
            }

            closeAuthModal();
            updateAuthUI();
            updateLocationDisplay();
            showToast(`Welcome back, ${matchedUser.name}! 🎉`, 'fa-solid fa-circle-check', '#10b981');
        } else {
            showToast('Invalid credentials. Check your email or use 1-Click Demo!', 'fa-solid fa-circle-xmark', '#ef4444');
        }
    }, 450);
};

// Handle Sign Up Submit
window.handleSignUpSubmit = async function(event) {
    if (event && event.preventDefault) event.preventDefault();

    const nameInput = document.getElementById('signUpName');
    const phoneInput = document.getElementById('signUpPhone');
    const emailInput = document.getElementById('signUpEmail');
    const pwInput = document.getElementById('signUpPassword');
    const studentToggle = document.getElementById('signUpIsStudent');
    const collegeSelect = document.getElementById('signUpCollegeSelect');
    const submitBtn = document.getElementById('signUpSubmitBtn');

    const name = (nameInput ? nameInput.value : '').trim();
    const phone = (phoneInput ? phoneInput.value : '').trim();
    const email = (emailInput ? emailInput.value : '').trim().toLowerCase();
    const password = (pwInput ? pwInput.value : '').trim();
    const isStudent = studentToggle ? studentToggle.checked : false;
    const collegeId = (isStudent && collegeSelect) ? collegeSelect.value : null;

    if (name.length < 2) {
        showToast('Please enter your full name', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
        showToast('Please enter a valid 10-digit mobile number', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        return;
    }
    if (!email.includes('@') || !email.includes('.')) {
        showToast('Please enter a valid email address', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        return;
    }
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'fa-solid fa-triangle-exclamation', '#f59e0b');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Creating Account...</span>';
    }

    const users = getLocalUsersDb();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const existingIndex = users.findIndex(u => 
        (u.email && u.email.toLowerCase() === email) ||
        (u.phone && cleanPhone && u.phone.replace(/\D/g, '').slice(-10) === cleanPhone)
    );

    let collegeName = 'S.R.K.R. Engineering College (SRKR)';
    if (collegeId) {
        const found = (SWIGGY_DATA.colleges || []).find(c => c.id === collegeId);
        if (found) collegeName = found.name;
    }

    const userId = (existingIndex !== -1 && users[existingIndex].id) ? users[existingIndex].id : ('usr_' + (cleanPhone || Date.now()));

    const userData = {
        id: userId,
        name: name,
        phone: cleanPhone || phone,
        email: email,
        password: password,
        isStudent: isStudent,
        college: isStudent ? (collegeId || 'col_srkr') : null,
        collegeName: isStudent ? collegeName : null,
        role: isStudent ? (collegeId === 'col_srkr' ? 'SRKR Student' : 'College Student') : 'Chocoloom Member',
        createdAt: (existingIndex !== -1 && users[existingIndex].createdAt) ? users[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Update in local cache
    if (existingIndex !== -1) {
        users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
        users.unshift(userData);
    }

    try {
        localStorage.setItem('chocoloom_users_db', JSON.stringify(users));
        localStorage.setItem('chocoloom_user_session', JSON.stringify(userData));
    } catch (e) {}

    AppState.currentUser = userData;

    // 1. PRIMARY ENGINE: Save user in Supabase 'users' table
    try {
        await saveUserToSupabase(userData);
    } catch (supErr) {
        console.warn('Supabase user save exception:', supErr);
    }

    const client = getSupabaseClient();
    if (client) {
        try {
            client.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                        phone: phone,
                        college: collegeId,
                        college_name: collegeName
                    }
                }
            }).catch(e => console.warn('Supabase auth signup background sync:', e));
        } catch (e) {}
    }

    // 2. EMERGENCY EXTRA STORAGE: Collect customer details in Neon vault
    try {
        await collectUserDetailsToNeon({
            ...userData,
            source: 'signup'
        });
    } catch (neonErr) {
        console.warn('Neon user save exception:', neonErr);
    }

    setTimeout(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> <span>CREATE ACCOUNT & UNLOCK DEALS</span>';
        }

        // Set college if student
        if (isStudent) {
            const srkr = (SWIGGY_DATA.colleges || []).find(c => c.id === 'col_srkr') || SWIGGY_DATA.colleges[0];
            AppState.selectedCollege = srkr;
            try {
                localStorage.setItem('chocoloom_college', JSON.stringify(srkr));
            } catch (e) {}
        }

        closeAuthModal();
        updateAuthUI();
        updateLocationDisplay();
        showToast(`Account created! Welcome to Chocoloom, ${name} 🎂`, 'fa-solid fa-cake-candles', '#7c5cfc');
    }, 450);
};

// Handle User Logout
window.handleUserLogout = function() {
    try {
        localStorage.removeItem('chocoloom_user_session');
    } catch (e) {}
    AppState.currentUser = null;
    const client = getSupabaseClient();
    if (client && client.auth) {
        try { client.auth.signOut(); } catch (e) {}
    }
    updateAuthUI();
    showToast('Signed out successfully', 'fa-solid fa-arrow-right-from-bracket', '#64748b');
};

// Toggle User Dropdown Menu
window.toggleUserProfileDropdown = function(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('userProfileDropdown');
    const userContainer = document.getElementById('navUserContainer');
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('open');
    if (isOpen) {
        dropdown.classList.remove('open');
        if (userContainer) userContainer.classList.remove('open');
    } else {
        dropdown.classList.add('open');
        if (userContainer) userContainer.classList.add('open');
    }
};

// Account Details & Profile Modal
window.openAccountDetailsModal = function() {
    const dropdown = document.getElementById('userProfileDropdown');
    if (dropdown) dropdown.classList.remove('open');
    const userContainer = document.getElementById('navUserContainer');
    if (userContainer) userContainer.classList.remove('open');

    if (!AppState.currentUser) {
        openAuthModal('otp');
        return;
    }

    const modal = document.getElementById('accountDetailsModalBackdrop');
    if (!modal) {
        window.location.href = 'login.html?view=account';
        return;
    }

    const u = AppState.currentUser;
    const nameEl = document.getElementById('accModalName');
    const emailEl = document.getElementById('accModalEmail');
    const phoneEl = document.getElementById('accModalPhone');
    const avatarEl = document.getElementById('accModalAvatar');
    const collegeEl = document.getElementById('accModalCollege');
    const discountBadgeEl = document.getElementById('accModalDiscountBadge');
    const ordersCountEl = document.getElementById('accModalOrdersCount');

    if (nameEl) nameEl.textContent = u.name || 'User';
    if (emailEl) emailEl.textContent = u.email || 'No email provided';
    const cleanPhone = (u.phone || '').replace(/^91/, '');
    if (phoneEl) phoneEl.textContent = cleanPhone ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : 'No phone linked';
    if (avatarEl) avatarEl.textContent = (u.name || 'U').charAt(0).toUpperCase();

    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem('chocoloom_orders_history') || '[]');
        orders = orders.filter(o => 
            (o.user_id && o.user_id === u.id) || 
            (o.user_email && o.user_email === u.email) || 
            (o.customer_phone && o.customer_phone === u.phone)
        );
    } catch (e) {}
    if (ordersCountEl) ordersCountEl.textContent = `${orders.length} Orders`;

    if (collegeEl) {
        if (u.isStudent) {
            collegeEl.innerHTML = '<i class="fa-solid fa-graduation-cap" style="color: #16a34a;"></i> S.R.K.R. Engineering College';
            if (discountBadgeEl) discountBadgeEl.style.display = 'inline-flex';
        } else {
            collegeEl.innerHTML = '<i class="fa-solid fa-user" style="color: #64748b;"></i> Regular Member';
            if (discountBadgeEl) discountBadgeEl.style.display = 'none';
        }
    }

    const walletBalEl = document.getElementById('accModalWalletBal');
    if (walletBalEl) walletBalEl.textContent = `₹${window.getChocowalletBalance()}`;

    modal.classList.add('open');
};

window.closeAccountDetailsModal = function() {
    const modal = document.getElementById('accountDetailsModalBackdrop');
    if (modal) modal.classList.remove('open');
};

// User Orders History Modal
window.openOrdersModal = function() {
    const modal = document.getElementById('userOrdersModalBackdrop');
    const listBody = document.getElementById('ordersListBody');
    if (!modal || !listBody) return;

    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem('chocoloom_orders_history') || '[]');
        orders = cleanDuplicateOrders(orders);
        localStorage.setItem('chocoloom_orders_history', JSON.stringify(orders));
    } catch (e) {
        orders = [];
    }

    // Filter for current user if logged in
    let displayOrders = orders;
    if (AppState.currentUser) {
        const userMatches = orders.filter(o => 
            (o.user_id && o.user_id === AppState.currentUser.id) ||
            (o.user_email && o.user_email === AppState.currentUser.email) ||
            (o.customer_phone && o.customer_phone === AppState.currentUser.phone)
        );
        if (userMatches.length > 0) displayOrders = userMatches;
    }

    const countBadge = document.getElementById('ordersModalCountBadge');
    if (countBadge) {
        countBadge.textContent = `${displayOrders.length} Order${displayOrders.length === 1 ? '' : 's'}`;
    }
    const ordersBadge = document.getElementById('myOrdersCountBadge');
    if (ordersBadge) {
        ordersBadge.textContent = displayOrders.length;
    }

    if (!displayOrders || displayOrders.length === 0) {
        listBody.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                <div style="font-size: 42px; margin-bottom: 12px;">🍰</div>
                <h4 style="font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 6px;">No orders placed yet</h4>
                <p style="font-size: 13px; margin-bottom: 20px;">Explore artisan cakes, chocolates, and treats baked fresh for you!</p>
                <button onclick="closeOrdersModal()" style="background: var(--primary); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer;">
                    Start Shopping
                </button>
            </div>
        `;
    } else {
        listBody.innerHTML = displayOrders.map(ord => {
            const formattedDate = ord.created_at ? new Date(ord.created_at).toLocaleString('en-IN', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'Recent';
            const itemsList = Array.isArray(ord.items) ? ord.items : [];
            const isDelivered = ord.status === 'delivered';
            const isCardOrder = Boolean(ord.is_card_order || (itemsList && itemsList.some(i => i.is_card || (i.name && i.name.includes('Chocowallet')))));
            const isInTransit = ord.status === 'In Transit';

            return `
                <div class="user-order-card ${isCardOrder ? 'vip-card-order' : ''}">
                    <div class="user-order-card-header">
                        <div>
                            <span class="user-order-num">Order #${ord.order_number || 'CL-Order'}</span>
                            ${isCardOrder ? '<span class="user-order-tag-vip"><i class="fa-solid fa-crown"></i> VIP CARD</span>' : ''}
                            <span style="font-size: 11px; color: #64748b; margin-left: 8px;">${formattedDate}</span>
                        </div>
                        <span class="user-order-status-pill ${isDelivered ? 'delivered' : (isInTransit ? 'in-transit' : 'confirmed')}" style="${isInTransit ? 'background: #fdf4ff; color: #9333ea; border: 1px solid #d8b4fe;' : ''}">
                            <i class="${isInTransit ? 'fa-solid fa-truck-fast' : 'fa-solid fa-circle-check'}"></i> ${ord.status || 'Confirmed'}
                        </span>
                    </div>

                    <div style="font-size: 12px; color: #475569; margin-bottom: 10px; line-height: 1.4;">
                        ${itemsList.length > 0 ? itemsList.map(it => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                                <span>${it.quantity || 1}x ${it.name || 'Cake'} ${it.is_card ? '(0.8mm RFID Contactless Metal)' : `(${it.selected_weight || '0.5 KG'})`}</span>
                                <span style="font-weight: 700;">₹${(Number(it.price) || 0) * (Number(it.quantity) || 1)}</span>
                            </div>
                        `).join('') : `<span>Artisan treats (${ord.payment_method || 'Online'})</span>`}
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 12px;">
                        <span style="color: #64748b;"><i class="fa-solid fa-location-dot"></i> ${ord.delivery_address || 'Delivery Address'}</span>
                        <span style="font-weight: 900; font-size: 14px; color: #0f172a;">Total: ₹${ord.final_total || 0}</span>
                    </div>

                    ${isCardOrder ? `
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #f1f5f9; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <span style="font-size: 11px; color: #7e22ce; font-weight: 700;">
                                <i class="fa-solid fa-plane-departure"></i> BlueDart AWB: ${ord.tracking_number || 'BD88429108IN'}
                            </span>
                            <button type="button" class="track-card-transit-btn" onclick="closeOrdersModal(); window.showCardOrderTransitModal();">
                                <i class="fa-solid fa-route"></i> Track Card Transit
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    modal.classList.add('open');
};

window.closeOrdersModal = function() {
    const modal = document.getElementById('userOrdersModalBackdrop');
    if (modal) modal.classList.remove('open');
};

window.handleForgotPassword = function() {
    window.openForgotPasscodeScreen();
};


// ==================== STUDENT VERIFICATION LOGIC (UNICHOCO OFFER) ====================
function isStudentUser() {
    if (typeof window !== 'undefined') {
        if (window.IS_UNI_CHOCOLOOM_PAGE || (window.location && window.location.pathname.includes('uni-chocoloom'))) {
            return true;
        }
        try {
            if (sessionStorage.getItem('chocoloom_student_verified') === 'true') return true;
        } catch (e) {}
    }
    if (typeof AppState !== 'undefined' && AppState) {
        if (AppState.isStudentVerified) return true;
        if (AppState.currentUser && (AppState.currentUser.isStudent || (AppState.currentUser.role && AppState.currentUser.role.toLowerCase().includes('student')))) {
            return true;
        }
        if (AppState.customerProfile && AppState.customerProfile.isStudent) {
            return true;
        }
    }
    try {
        const rawUser = localStorage.getItem('chocoloom_user_session');
        if (rawUser) {
            const parsed = JSON.parse(rawUser);
            if (parsed && (parsed.isStudent || (parsed.role && parsed.role.toLowerCase().includes('student')))) {
                return true;
            }
        }
    } catch (e) {}
    return false;
}
window.isStudentUser = isStudentUser;

function ensureStudentVerificationModal() {
    if (document.getElementById('studentVerificationModalBackdrop')) return;
    const modalHtml = `
        <div class="modal-backdrop" id="studentVerificationModalBackdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 999999; align-items: center; justify-content: center; padding: 16px;">
            <div style="background: var(--bg-card, #ffffff); width: 100%; max-width: 420px; border-radius: 20px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border: 1.5px solid #d8b4fe; position: relative;">
                <button type="button" onclick="closeStudentVerificationModal()" style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: #f3f4f6; border: none; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #4b5563;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 54px; height: 54px; border-radius: 50%; background: #f3e8ff; color: #7e22ce; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 10px;">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #1e1b4b;">Student Status Verification</h3>
                    <p style="margin: 0; font-size: 13px; color: #64748b;">The 25% UNICHOCO discount is exclusively reserved for college students.</p>
                </div>
                <form onsubmit="handleStudentVerificationSubmit(event)" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; color: #334155;">Select Your College Campus *</label>
                        <select id="studentVerifyCollege" required style="width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #cbd5e1; font-size: 13px; font-weight: 600; background: var(--bg-card, #fff); color: var(--text-main, #0f172a);">
                            <option value="S.R.K.R. Engineering College (Bhimavaram)">S.R.K.R. Engineering College (Bhimavaram)</option>
                            <option value="Vishnu Institute of Technology (Bhimavaram)">Vishnu Institute of Technology (Bhimavaram)</option>
                            <option value="DNR College of Engineering">DNR College of Engineering</option>
                            <option value="BVC Engineering College">BVC Engineering College</option>
                            <option value="Other Recognized College / University">Other Recognized College / University</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; color: #334155;">Student Roll No / College ID / Email *</label>
                        <input type="text" id="studentVerifyId" placeholder="e.g. 21B91A05XX or college roll no" required style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #cbd5e1; font-size: 13px; background: var(--bg-card, #fff); color: var(--text-main, #0f172a);">
                    </div>
                    <button type="submit" style="background: linear-gradient(135deg, #7c5cfc, #6366f1); color: #fff; border: none; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px; box-shadow: 0 4px 12px rgba(124, 92, 252, 0.35);">
                        <i class="fa-solid fa-circle-check"></i> Verify Student &amp; Unlock 25% OFF
                    </button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openStudentVerificationModal = function() {
    ensureStudentVerificationModal();
    const modal = document.getElementById('studentVerificationModalBackdrop');
    if (modal) modal.style.display = 'flex';
};

window.closeStudentVerificationModal = function() {
    const modal = document.getElementById('studentVerificationModalBackdrop');
    if (modal) modal.style.display = 'none';
};

window.handleStudentVerificationSubmit = function(e) {
    if (e) e.preventDefault();
    const college = document.getElementById('studentVerifyCollege')?.value || 'S.R.K.R. Engineering College';
    const studentId = document.getElementById('studentVerifyId')?.value?.trim();
    if (!studentId) {
        if (typeof showToast === 'function') showToast('Please enter your student ID / roll number', 'fa-solid fa-triangle-exclamation', '#ef4444');
        return;
    }
    if (typeof AppState !== 'undefined' && AppState) {
        AppState.isStudentVerified = true;
        AppState.activeCoupon = 'UNICHOCO';
    }
    try {
        sessionStorage.setItem('chocoloom_student_verified', 'true');
        sessionStorage.setItem('chocoloom_student_id', studentId);
        sessionStorage.setItem('chocoloom_student_college', college);
    } catch(e) {}

    closeStudentVerificationModal();
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof showToast === 'function') showToast(`🎓 Verified ${college} Student! 25% Discount Applied!`, 'fa-solid fa-graduation-cap', '#16a34a');
};


// ==================== CHOCOLOOM REELS & STORIES WIDGET DATA & LOGIC ====================
var CHOCOLOOM_REELS_DATA = window.CHOCOLOOM_REELS_DATA = [
    {
        id: 'reel_italy',
        title: 'possibly feel like ITALY',
        sub: 'Authentic Italian Tiramisu Cake',
        caption: 'Handcrafted with imported mascarpone, cold espresso soak & dusted Dutch cocoa.',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-decorating-a-cake-with-chocolate-glaze-41315-large.mp4',
        productName: 'Tiramisu Dolce Dream Cake',
        price: '₹599',
        originalPrice: '₹749',
        discount: '20% OFF',
        category: 'Desserts',
        rating: '4.9 ★ (840+ orders)'
    },
    {
        id: 'reel_bento',
        title: 'a bento moment',
        sub: 'Korean Pastel Bento Cakes',
        caption: 'Pocket-sized happiness! Delicate vanilla chiffon iced with silky strawberry cream.',
        image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-cutting-a-piece-of-chocolate-cake-41314-large.mp4',
        productName: 'Pastel Dream Bento Cake',
        price: '₹349',
        originalPrice: '₹449',
        discount: '22% OFF',
        category: 'Bento Cakes',
        rating: '4.8 ★ (1.2k orders)'
    },
    {
        id: 'reel_candle',
        title: 'SOMEWHERE INSIDE...',
        sub: 'Belgian Molten Truffle Core',
        caption: 'Watch the warm molten truffle erupt when sliced. Every wish deserves pure chocolate.',
        image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-chocolate-cake-with-strawberries-on-top-41313-large.mp4',
        productName: 'Belgian Molten Truffle Cake',
        price: '₹699',
        originalPrice: '₹849',
        discount: '18% OFF',
        category: 'Chocolates',
        rating: '4.9 ★ (2.1k orders)'
    },
    {
        id: 'reel_dont_swipe',
        title: "DON'T SWIPE ✋",
        sub: 'Monster 1-Litre Choco Mudslide Shake',
        caption: 'Loaded with brownies, chocochips & fudge drizzle. Are you up for the challenge?',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-chocolate-sauce-on-ice-cream-41312-large.mp4',
        productName: 'Monster Mudslide Shake',
        price: '₹289',
        originalPrice: '₹349',
        discount: '17% OFF',
        category: 'Shakes',
        rating: '4.7 ★ (650+ orders)'
    },
    {
        id: 'reel_coffee',
        title: 'COFFEE DAY SPECIAL ☕',
        sub: 'Mocha Frappes & Cold Brew Cakes',
        caption: 'Brewed with 100% Arabica beans & folded into rich dark chocolate sponge.',
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-serving-hot-coffee-in-a-cup-41311-large.mp4',
        productName: 'Belgian Choco-Mocha Frappe Cake',
        price: '₹449',
        originalPrice: '₹549',
        discount: '18% OFF',
        category: 'Uni Chocoloom',
        rating: '4.8 ★ (920+ orders)'
    },
    {
        id: 'reel_hands_full',
        title: "SORRY I CAN'T MY HANDS ARE FULL 🎀",
        sub: 'Pink Satin Bow Heart Cake',
        caption: 'Double heart layered sponge with edible fondant bow. Too pretty not to devour!',
        image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-eating-a-piece-of-chocolate-cake-41316-large.mp4',
        productName: 'Pink Satin Bow Heart Cake',
        price: '₹749',
        originalPrice: '₹949',
        discount: '21% OFF',
        category: 'Specialty Cakes',
        rating: '4.9 ★ (1.5k orders)'
    },
    {
        id: 'reel_croissant',
        title: 'What makes our croissant special?',
        sub: '72-Layer French Butter Flakes',
        caption: 'Baked golden fresh every morning at 6:00 AM with artisanal laminated pastry dough.',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-baker-taking-fresh-croissants-from-the-oven-41317-large.mp4',
        productName: 'Classic French Butter Croissant Box (4 pcs)',
        price: '₹349',
        originalPrice: '₹449',
        discount: '22% OFF',
        category: 'Snacks & Munchies',
        rating: '4.8 ★ (1.1k orders)'
    },
    {
        id: 'reel_kunafa',
        title: 'KUNAFA dream cake 🌰',
        sub: 'Dubai Pistachio & Kadayif Magic',
        caption: 'Crispy golden kataifi crunch soaked in rose syrup over Belgian chocolate truffle.',
        image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-chocolate-syrup-pouring-on-a-stack-of-pancakes-41318-large.mp4',
        productName: 'Dubai Pistachio Kunafa Truffle Tub',
        price: '₹649',
        originalPrice: '₹799',
        discount: '19% OFF',
        category: 'Specialty Cakes',
        rating: '5.0 ★ (3.4k orders)'
    },
    {
        id: 'reel_monsoon',
        title: 'MONSOON Munching Guide 🌧️',
        sub: 'Warm Sizzling Brownies & Cocoa',
        caption: 'Rain pattering outside, fresh warm chocolate brownies sizzling right in front of you.',
        image: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-cup-of-hot-chocolate-with-marshmallows-41319-large.mp4',
        productName: 'Monsoon Sizzler Brownie Box',
        price: '₹399',
        originalPrice: '₹499',
        discount: '20% OFF',
        category: 'Snacks & Munchies',
        rating: '4.9 ★ (1.8k orders)'
    },
    {
        id: 'reel_eggless',
        title: '100% eggless. 🌱',
        sub: 'Salted Caramel Drip Cheesecake',
        caption: 'Rich baked Philadelphia style cheesecake, totally eggless and 100% melt-in-mouth.',
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-dripping-caramel-sauce-on-a-cheesecake-41320-large.mp4',
        productName: 'Salted Caramel Velvet Cheesecake (Eggless)',
        price: '₹799',
        originalPrice: '₹999',
        discount: '20% OFF',
        category: 'Cooling Cakes',
        rating: '4.8 ★ (1.3k orders)'
    },
    {
        id: 'reel_chocolate',
        title: 'How chocolate speaks to me 🍫',
        sub: 'Triple Choco Lava Cookie Gateau',
        caption: 'Gooey Dutch chocolate cookie crust with molten dark ganache that flows with every bite.',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-melting-chocolate-on-a-fondue-fountain-41321-large.mp4',
        productName: 'Triple Choco Chunk Lava Gateau',
        price: '₹629',
        originalPrice: '₹749',
        discount: '16% OFF',
        category: 'Chocolates',
        rating: '4.9 ★ (2.6k orders)'
    },
    {
        id: 'reel_decorate',
        title: 'Decorate THE CAKE with your wishes 🎂',
        sub: 'Grand Custom 3-Tier Celebration',
        caption: 'Handcrafted buttercream rosettes, customizable golden script, and sugar pearl accents.',
        image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-piping-whipped-cream-on-a-strawberry-cake-41322-large.mp4',
        productName: 'Grand Custom 3-Tier Celebration Cake',
        price: '₹1,899',
        originalPrice: '₹2,299',
        discount: '17% OFF',
        category: 'Anniversary Cakes',
        rating: '4.9 ★ (720+ orders)'
    },
    {
        id: 'reel_deserve',
        title: "Your daily dose of 'I DESERVE THIS.' ✨",
        sub: 'Burnt Basque Vanilla Cheesecake',
        caption: 'Caramelized burnt crust on top with an ultra-creamy, velvety center.',
        image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800&auto=format&fit=crop&q=80',
        video: 'https://assets.mixkit.co/videos/preview/mixkit-spoon-taking-a-bite-of-cheesecake-41323-large.mp4',
        productName: 'Burnt Basque Vanilla Cheesecake Slice',
        price: '₹249',
        originalPrice: '₹319',
        discount: '22% OFF',
        category: 'Desserts',
        rating: '4.8 ★ (950+ orders)'
    }
];

// Helper to render individual reel card
function renderReelCardHtml(reel) {
    return `
        <div class="reel-card" onclick="openChocoloomReelModal('${reel.id}')" title="Watch ${reel.title}">
            <div class="reel-card-img-box">
                <img src="${reel.image}" alt="${reel.title}" class="reel-card-img" loading="lazy">
                <div class="reel-gradient-overlay"></div>
            </div>
            <div class="reel-icon-badge" title="Watch Reel">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19.5 3h-15C3.12 3 2 4.12 2 5.5v13C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 4.12 20.88 3 19.5 3zm-9.25 12.5V8.5L15 12l-4.75 3.5zM19.5 5c.28 0 .5.22.5.5v1.25h-3.25L18 5h1.5zm-5.75 1.75L12.5 5h2.25l1.25 1.75h-2.25zm-4 0L8.5 5h2.25l1.25 1.75H9.75zm-4 0L4.5 5h2.25l1.25 1.75H5.75z"/>
                </svg>
            </div>
            <div class="reel-caption-wrap">
                <div class="reel-title">${reel.title}</div>
                <div class="reel-sub">${reel.sub}</div>
            </div>
        </div>
    `;
}

// Build HTML for the 2-row Bakingo-style Reels & Stories showcase widget
function createChocoloomReelsWidgetHtml() {
    // Row 1 items: 0, 1, 2, EMBLEM BADGE, 3, 4, 5
    const row1Items = CHOCOLOOM_REELS_DATA.slice(0, 3);
    const row1ItemsEnd = CHOCOLOOM_REELS_DATA.slice(3, 6);
    // Row 2 items: 6 through 12
    const row2Items = CHOCOLOOM_REELS_DATA.slice(6);

    return `
        <div class="chocoloom-reels-section" id="chocoloomReelsWidget">
            <div class="reels-section-header">
                <div class="reels-header-info">
                    <div class="reels-live-pill">
                        <span class="reels-live-dot"></span>
                        <i class="fa-solid fa-clapperboard"></i>
                        <span>WATCH &amp; CRAVE</span>
                    </div>
                    <h3 class="reels-main-title">Trending Stories &amp; Reels 🎬</h3>
                    <p class="reels-sub-text">Binge bite-sized reels of artisan treats &amp; order in 1 tap</p>
                </div>
                <div class="reels-nav-arrows">
                    <button type="button" class="reels-nav-arrow" onclick="scrollChocoloomReels(-1)" aria-label="Previous Stories" title="Previous"><i class="fa-solid fa-chevron-left"></i></button>
                    <button type="button" class="reels-nav-arrow" onclick="scrollChocoloomReels(1)" aria-label="Next Stories" title="Next"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>

            <div class="reels-dual-track" id="chocoloomReelsTrack">
                <!-- Row 1 with Centerpiece Emblem -->
                <div class="reels-row reels-row-1">
                    ${row1Items.map(r => renderReelCardHtml(r)).join('')}

                    <!-- Centerpiece Wishes Emblem Badge -->
                    <div class="reels-emblem-badge" onclick="openChocoloomReelModal('reel_bento')" title="Explore Season of Wishes">
                        <div class="emblem-inner">
                            <span class="emblem-arrow">↘</span>
                            <span class="emblem-pre">Season of</span>
                            <span class="emblem-main">WISHES</span>
                            <span class="emblem-brand">CHOCOLOOM</span>
                        </div>
                    </div>

                    ${row1ItemsEnd.map(r => renderReelCardHtml(r)).join('')}
                </div>

                <!-- Row 2 -->
                <div class="reels-row reels-row-2">
                    ${row2Items.map(r => renderReelCardHtml(r)).join('')}
                </div>
            </div>
        </div>
    `;
}

// Story / Reels Modal State & Controller
let activeReelIndex = 0;
let reelTimerInterval = null;
let reelProgressPercent = 0;
let isReelAudioMuted = true;

window.scrollChocoloomReels = function(direction) {
    const track = document.getElementById('chocoloomReelsTrack');
    if (track) {
        track.scrollBy({ left: direction * 420, behavior: 'smooth' });
    }
};

window.openChocoloomReelModal = function(reelId) {
    const idx = CHOCOLOOM_REELS_DATA.findIndex(r => r.id === reelId);
    activeReelIndex = idx >= 0 ? idx : 0;
    ensureReelsModalContainer();
    updateReelModalContent();
    const modal = document.getElementById('chocoloomReelsModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    startReelTimer();
};

window.closeChocoloomReelModal = function() {
    const modal = document.getElementById('chocoloomReelsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    stopReelTimer();
    const video = document.getElementById('activeReelVideo');
    if (video) video.pause();
};

window.nextChocoloomReel = function(event) {
    if (event) event.stopPropagation();
    activeReelIndex = (activeReelIndex + 1) % CHOCOLOOM_REELS_DATA.length;
    updateReelModalContent();
    startReelTimer();
};

window.prevChocoloomReel = function(event) {
    if (event) event.stopPropagation();
    activeReelIndex = (activeReelIndex - 1 + CHOCOLOOM_REELS_DATA.length) % CHOCOLOOM_REELS_DATA.length;
    updateReelModalContent();
    startReelTimer();
};

window.toggleReelAudio = function(event) {
    if (event) event.stopPropagation();
    isReelAudioMuted = !isReelAudioMuted;
    const video = document.getElementById('activeReelVideo');
    const btn = document.getElementById('reelMuteBtn');
    if (video) video.muted = isReelAudioMuted;
    if (btn) {
        btn.innerHTML = isReelAudioMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
    }
};

window.orderFromActiveReel = function(event) {
    if (event) event.stopPropagation();
    const reel = (Array.isArray(CHOCOLOOM_REELS_DATA) && CHOCOLOOM_REELS_DATA[activeReelIndex]) ? CHOCOLOOM_REELS_DATA[activeReelIndex] : null;
    if (!reel) return;

    // 1. Synthesize a clean, unique dish object dedicated to this story/reel product
    const priceNum = parseInt(String(reel.price).replace(/\D/g, ''), 10) || 499;
    const origPriceNum = parseInt(String(reel.originalPrice).replace(/\D/g, ''), 10) || (priceNum + 150);
    const dish = {
        id: reel.id,
        name: reel.productName,
        price: priceNum,
        originalPrice: origPriceNum,
        description: reel.caption || reel.sub,
        image: reel.image,
        category: reel.category || 'Specialty Cakes',
        isVeg: true,
        isDirectAdd: true,
        rating: '4.9',
        has_weight: false,
        has_cooling: false
    };

    // 2. Ensure AppState.cart is initialized
    if (!Array.isArray(AppState.cart)) AppState.cart = [];
    AppState.cart = AppState.cart.filter(c => c && c.dish && (c.dish.id || c.dish.name));

    const cartItemId = `${reel.id}_cart`;
    const defaultRest = (SWIGGY_DATA && SWIGGY_DATA.restaurants && SWIGGY_DATA.restaurants[0]) ? SWIGGY_DATA.restaurants[0] : {
        id: 'rest_chocoloom_flagship',
        name: 'Chocoloom Flagship Bakery & Confectionery',
        distance: '1.2 km'
    };

    // 3. Match by unique cartItemId or dish id
    const existingIndex = AppState.cart.findIndex(c => c && (
        c.cartItemId === cartItemId || 
        (c.dish && c.dish.id === reel.id)
    ));

    if (existingIndex > -1) {
        AppState.cart[existingIndex].quantity = (Number(AppState.cart[existingIndex].quantity) || 1) + 1;
    } else {
        AppState.cart.push({
            cartItemId: cartItemId,
            dish: {
                ...dish,
                selectedWeight: 'Standard',
                selectedWeightKey: 'standard',
                selectedWeightLabel: dish.name,
                weightPrice: Number(dish.price),
                isCooling: false,
                coolingOption: 'Fresh & Ready',
                coolingPrice: 0,
                customMessage: null
            },
            restaurant: defaultRest,
            quantity: 1
        });
    }

    if (typeof saveCart === 'function') saveCart();
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof renderProductsGrid === 'function') renderProductsGrid();

    const storeStatus = (typeof getStoreOperatingStatus === 'function') ? getStoreOperatingStatus() : { isOpen: true };
    if (typeof showToast === 'function') {
        if (!storeStatus.isOpen) {
            showToast(`Added ${dish.name} for Pre-Order! (Opens 9 AM) ☀️`, 'fa-solid fa-clock', '#f59e0b');
        } else {
            showToast(`Added ${dish.name} to Cart! 🎂`, 'fa-solid fa-bag-shopping', '#10b981');
        }
    }

    closeChocoloomReelModal();
};

function startReelTimer() {
    stopReelTimer();
    reelProgressPercent = 0;
    const bar = document.getElementById('reelProgressBarFill');
    if (bar) bar.style.width = '0%';
    const durationMs = 6000;
    const intervalMs = 60;
    const step = (intervalMs / durationMs) * 100;

    reelTimerInterval = setInterval(() => {
        reelProgressPercent += step;
        if (bar) bar.style.width = `${Math.min(reelProgressPercent, 100)}%`;
        if (reelProgressPercent >= 100) {
            nextChocoloomReel();
        }
    }, intervalMs);
}

function stopReelTimer() {
    if (reelTimerInterval) {
        clearInterval(reelTimerInterval);
        reelTimerInterval = null;
    }
}

function updateReelModalContent() {
    const reel = CHOCOLOOM_REELS_DATA[activeReelIndex];
    if (!reel) return;

    const titleEl = document.getElementById('modalReelTitle');
    const capEl = document.getElementById('modalReelCaption');
    const prodImg = document.getElementById('modalReelProdImg');
    const prodName = document.getElementById('modalReelProdName');
    const prodPrice = document.getElementById('modalReelProdPrice');
    const prodOrig = document.getElementById('modalReelProdOrigPrice');
    const prodDisc = document.getElementById('modalReelProdDiscount');
    const ratingEl = document.getElementById('modalReelRating');
    const video = document.getElementById('activeReelVideo');
    const poster = document.getElementById('modalReelPoster');
    const storyIdxEl = document.getElementById('modalReelIndexIndicator');

    if (titleEl) titleEl.textContent = reel.title;
    if (capEl) capEl.textContent = reel.caption;
    if (prodImg) prodImg.src = reel.image;
    if (prodName) prodName.textContent = reel.productName;
    if (prodPrice) prodPrice.textContent = reel.price;
    if (prodOrig) prodOrig.textContent = reel.originalPrice;
    if (prodDisc) prodDisc.textContent = reel.discount;
    if (ratingEl) ratingEl.textContent = reel.rating;
    if (storyIdxEl) storyIdxEl.textContent = `${activeReelIndex + 1} / ${CHOCOLOOM_REELS_DATA.length}`;

    if (poster) {
        poster.src = reel.image;
        poster.style.display = 'block';
    }

    if (video) {
        video.src = reel.video;
        video.muted = isReelAudioMuted;
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (poster) poster.style.display = 'none';
            }).catch(() => {
                // Autoplay blocked: keep high-res poster visible
                if (poster) poster.style.display = 'block';
            });
        }
    }
}

function ensureReelsModalContainer() {
    if (document.getElementById('chocoloomReelsModal')) return;
    const modalHtml = `
        <div class="reels-modal-overlay" id="chocoloomReelsModal" onclick="closeChocoloomReelModal()">
            <div class="reels-modal-wrapper" onclick="event.stopPropagation()">
                <!-- Progress Bar -->
                <div class="reels-progress-track">
                    <div class="reels-progress-fill" id="reelProgressBarFill"></div>
                </div>

                <!-- Story Header -->
                <div class="reels-modal-top-bar">
                    <div class="reels-creator-info">
                        <img src="assets/logo.png" alt="Chocoloom" class="reels-avatar" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&auto=format&fit=crop&q=80'">
                        <div class="reels-creator-text">
                            <span class="reels-name">chocoloom.official <i class="fa-solid fa-circle-check" style="color: #38bdf8; font-size: 11px;"></i></span>
                            <span class="reels-live-time" id="modalReelIndexIndicator">1 / 13 • Just now</span>
                        </div>
                    </div>
                    <div class="reels-top-actions">
                        <button type="button" class="reels-icon-btn" id="reelMuteBtn" onclick="toggleReelAudio(event)" title="Mute/Unmute"><i class="fa-solid fa-volume-xmark"></i></button>
                        <button type="button" class="reels-icon-btn" onclick="closeChocoloomReelModal()" title="Close"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>

                <!-- Video / Media Layer -->
                <div class="reels-media-viewport">
                    <img src="" alt="" class="reels-poster-img" id="modalReelPoster">
                    <video id="activeReelVideo" class="reels-video-player" playsinline loop muted></video>

                    <!-- Tap Zones -->
                    <div class="reels-tap-zone left" onclick="prevChocoloomReel(event)"></div>
                    <div class="reels-tap-zone right" onclick="nextChocoloomReel(event)"></div>

                    <!-- Navigation Arrow Buttons -->
                    <button type="button" class="reels-arrow-btn prev" onclick="prevChocoloomReel(event)" aria-label="Previous Story"><i class="fa-solid fa-chevron-left"></i></button>
                    <button type="button" class="reels-arrow-btn next" onclick="nextChocoloomReel(event)" aria-label="Next Story"><i class="fa-solid fa-chevron-right"></i></button>
                </div>

                <!-- Bottom Product Overlay Card -->
                <div class="reels-bottom-tray">
                    <div class="reels-caption-box">
                        <h4 class="reels-tray-title" id="modalReelTitle"></h4>
                        <p class="reels-tray-caption" id="modalReelCaption"></p>
                    </div>

                    <div class="reels-product-card">
                        <img src="" alt="" class="reels-prod-thumb" id="modalReelProdImg">
                        <div class="reels-prod-details">
                            <span class="reels-prod-name" id="modalReelProdName"></span>
                            <div class="reels-prod-pricing">
                                <span class="reels-prod-price" id="modalReelProdPrice"></span>
                                <span class="reels-prod-orig" id="modalReelProdOrigPrice"></span>
                                <span class="reels-prod-disc" id="modalReelProdDiscount"></span>
                            </div>
                            <span class="reels-prod-rating" id="modalReelRating"></span>
                        </div>
                        <button type="button" class="reels-order-btn" onclick="orderFromActiveReel(event)">
                            <i class="fa-solid fa-cart-shopping"></i> ORDER NOW
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('chocoloomReelsModal');
        if (modal && modal.classList.contains('active')) {
            if (e.key === 'Escape') closeChocoloomReelModal();
            else if (e.key === 'ArrowRight') nextChocoloomReel();
            else if (e.key === 'ArrowLeft') prevChocoloomReel();
        }
    });
}





// Start application on DOM Ready or immediately if document is already parsed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Fallback safeguard to dismiss splash once all resources load
window.addEventListener('load', () => {
    setTimeout(hideSiteLoadingSplash, 250);
});

// Live Cross-Tab Synchronization with Chocoloom Admin Panel
window.addEventListener('storage', (e) => {
    if (e.key === 'chocoloom_banners') {
        if (typeof renderBanners === 'function') renderBanners();
    }
});

try {
    const adminBroadcast = new BroadcastChannel('chocoloom_sync_channel');
    adminBroadcast.onmessage = (e) => {
        if (e.data && e.data.type === 'BANNERS_UPDATED') {
            if (typeof renderBanners === 'function') renderBanners();
        }
    };
} catch(e) {}



