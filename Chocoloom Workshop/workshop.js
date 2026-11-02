/**
 * Chocoloom Workshop - Interactive Event Engine
 * Handles slot picking, ticket pass tier selection, coupon engine,
 * interactive pass generation, QR code, search modal, and location picker.
 */

(function () {
    'use strict';

    // Application State
    const WorkshopState = {
        selectedPass: {
            id: 'solo',
            name: 'Solo Creator Pass',
            basePrice: 499,
            originalPrice: 999,
            attendees: 1,
            toteBags: 1
        },
        selectedSlot: {
            day: 'Sunday',
            date: 'Nov 15, 2026',
            time: '10:00 AM - 1:00 PM',
            batch: 'Exclusive Sunday Masterclass'
        },
        attendee: {
            name: '',
            phone: '',
            name2: '',
            phone2: '',
            email: ''
        },
        appliedCoupon: null,
        discountAmount: 0,
        currentLocation: {
            type: 'Simhadri Appana temple',
            name: 'Bhimavaram, Andhra Pradesh'
        }
    };

    // Pass definitions
    const PASS_TIERS = {
        solo: {
            id: 'solo',
            name: 'Solo Creator Pass',
            basePrice: 499,
            originalPrice: 999,
            attendees: 1,
            toteBags: 1
        },
        duo: {
            id: 'duo',
            name: 'Duo Creative Pass (2 Persons)',
            basePrice: 899,
            originalPrice: 1999,
            attendees: 2,
            toteBags: 2
        }
    };

    // Coupons
    const COUPONS = {
        'UNI25': { discountPercent: 25, label: 'Uni Chocoloom Student 25% OFF' },
        'EARLYBIRD': { discountPercent: 15, label: 'Early Bird 15% OFF' },
        'CHOCOLOOM': { flatDiscount: 150, label: 'Chocoloom Community ₹150 OFF' }
    };

    // DOM Ready
    document.addEventListener('DOMContentLoaded', () => {
        initCategoryCarousel();
        initSlotSelection();
        initFaqAccordion();
        initSearchShortcut();
        initPaymentMethodListeners();
        updateModalSummary();
    });

    // 2. Category Carousel Scroll
    function initCategoryCarousel() {
        const container = document.getElementById('categoryScrollContainer');
        const leftBtn = document.getElementById('catScrollLeftBtn');
        const rightBtn = document.getElementById('catScrollRightBtn');

        if (!container) return;

        if (leftBtn) {
            leftBtn.addEventListener('click', () => {
                container.scrollBy({ left: -260, behavior: 'smooth' });
            });
        }

        if (rightBtn) {
            rightBtn.addEventListener('click', () => {
                container.scrollBy({ left: 260, behavior: 'smooth' });
            });
        }
    }

    // 3. Slot Card Selection
    function initSlotSelection() {
        const slotCards = document.querySelectorAll('.slot-card');
        slotCards.forEach(card => {
            card.addEventListener('click', () => {
                slotCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                WorkshopState.selectedSlot = {
                    day: card.dataset.day || 'Sunday',
                    date: card.dataset.date || 'Nov 15, 2026',
                    time: card.dataset.time || '10:00 AM - 1:00 PM',
                    batch: card.dataset.batch || 'Exclusive Sunday Masterclass'
                };

                const slotSelect = document.getElementById('regBatchSelect');
                if (slotSelect) {
                    slotSelect.value = card.dataset.slotId || 'batch1';
                }

                showToast(`Selected: ${WorkshopState.selectedSlot.day} (${WorkshopState.selectedSlot.time})`);
            });
        });
    }

    // 4. FAQ Accordion
    function initFaqAccordion() {
        const faqCards = document.querySelectorAll('.faq-card');
        faqCards.forEach(card => {
            const questionBtn = card.querySelector('.faq-question');
            if (questionBtn) {
                questionBtn.addEventListener('click', () => {
                    const isOpen = card.classList.contains('open');
                    faqCards.forEach(c => c.classList.remove('open'));
                    if (!isOpen) {
                        card.classList.add('open');
                    }
                });
            }
        });
    }

    // 5. Pass Selector & Registration Modal
    window.selectPassAndOpenModal = function (passTierKey) {
        // Default to solo pass automatically
        const tierKey = (passTierKey && PASS_TIERS[passTierKey]) ? passTierKey : 'solo';
        WorkshopState.selectedPass = PASS_TIERS[tierKey];

        const tierSelect = document.getElementById('regPassTierSelect');
        if (tierSelect) {
            tierSelect.value = tierKey;
        }

        updateModalSummary();
        openRegistrationModal();
    };

    window.openRegistrationModal = function () {
        const modal = document.getElementById('registrationModal');
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeRegistrationModal = function () {
        const modal = document.getElementById('registrationModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    window.handlePassTierChange = function (val) {
        if (PASS_TIERS[val]) {
            WorkshopState.selectedPass = PASS_TIERS[val];
            updateModalSummary();
        }
    };

    window.handleBatchChange = function (val) {
        const slotEl = document.querySelector(`.slot-card[data-slot-id="${val}"]`);
        if (slotEl) {
            document.querySelectorAll('.slot-card').forEach(c => c.classList.remove('selected'));
            slotEl.classList.add('selected');
            WorkshopState.selectedSlot = {
                day: slotEl.dataset.day,
                date: slotEl.dataset.date,
                time: slotEl.dataset.time,
                batch: slotEl.dataset.batch
            };
        }
    };

    // 6. Modal Summary Updater
    function updateModalSummary() {
        const pass = WorkshopState.selectedPass;
        const discount = WorkshopState.discountAmount;
        const total = Math.max(0, pass.basePrice - discount);

        // Update selected pass banner
        const modalPassTitle = document.getElementById('modalPassTitle');
        const modalPassPrice = document.getElementById('modalPassPrice');
        const modalPassDate = document.getElementById('modalPassDate');

        if (modalPassTitle) modalPassTitle.textContent = pass.name;
        if (modalPassPrice) modalPassPrice.textContent = `₹${pass.basePrice}`;
        if (modalPassDate) {
            modalPassDate.innerHTML = `<i class="fa-solid fa-calendar-check"></i> ${WorkshopState.selectedSlot.day}, ${WorkshopState.selectedSlot.date} • ${WorkshopState.selectedSlot.time}`;
        }

        // Update Duo Pass conditional fields (two names & two numbers)
        const isDuo = (pass.id === 'duo');
        const duoFieldsWrap = document.getElementById('duoFieldsWrap');
        const lblRegName = document.getElementById('lblRegName');
        const lblRegPhone = document.getElementById('lblRegPhone');
        const regName2 = document.getElementById('regName2');
        const regPhone2 = document.getElementById('regPhone2');

        if (duoFieldsWrap) {
            duoFieldsWrap.style.display = isDuo ? 'block' : 'none';
        }
        if (lblRegName) {
            lblRegName.textContent = isDuo ? 'Person 1 Full Name *' : 'Full Name *';
        }
        if (lblRegPhone) {
            lblRegPhone.textContent = isDuo ? 'Person 1 WhatsApp Number *' : 'WhatsApp Phone Number *';
        }
        if (regName2) {
            regName2.required = isDuo;
        }
        if (regPhone2) {
            regPhone2.required = isDuo;
        }

        // Update summary box
        const passNameEl = document.getElementById('sumPassName');
        const passPriceEl = document.getElementById('sumPassPrice');
        const totalEl = document.getElementById('sumTotalPrice');
        const toteBagCountEl = document.getElementById('sumToteCount');

        if (passNameEl) passNameEl.textContent = pass.name;
        if (passPriceEl) passPriceEl.textContent = `₹${pass.basePrice}`;
        if (toteBagCountEl) toteBagCountEl.textContent = pass.toteBags;
        if (totalEl) totalEl.textContent = `₹${total}`;

        // Update CTA button amount and payment modal amount
        const btnPayAmount = document.getElementById('btnPayAmount');
        if (btnPayAmount) btnPayAmount.textContent = `₹${total}`;

        const payModalAmount = document.getElementById('payModalAmount');
        if (payModalAmount) payModalAmount.textContent = `₹${total}`;

        const btnUpiDirect = document.getElementById('btnPayUpiDirect');
        if (btnUpiDirect) {
            btnUpiDirect.href = `upi://pay?pa=paytm.s2spcov@pty&pn=Chocoloom%20Workshop&mc=5462&am=${total}&cu=INR&tn=Workshop%20Pass%20Booking`;
        }
    }

    // 7. Handle Registration Submit -> Proceed to Payment
    window.handleRegistrationSubmit = function (e) {
        if (e && e.preventDefault) e.preventDefault();

        const nameInput = document.getElementById('regName');
        const phoneInput = document.getElementById('regPhone');
        const name2Input = document.getElementById('regName2');
        const phone2Input = document.getElementById('regPhone2');
        const emailInput = document.getElementById('regEmail');
        const isDuo = (WorkshopState.selectedPass.id === 'duo');

        if (!nameInput || !nameInput.value.trim()) {
            showToast(isDuo ? 'Please enter Person 1 full name' : 'Please enter your full name');
            return;
        }

        if (!phoneInput || !phoneInput.value.trim()) {
            showToast(isDuo ? 'Please enter Person 1 WhatsApp number' : 'Please enter your WhatsApp phone number');
            return;
        }

        if (isDuo) {
            if (!name2Input || !name2Input.value.trim()) {
                showToast('Please enter Person 2 full name');
                return;
            }
            if (!phone2Input || !phone2Input.value.trim()) {
                showToast('Please enter Person 2 WhatsApp number');
                return;
            }
        }

        if (!emailInput || !emailInput.value.trim()) {
            showToast('Please enter your email address');
            return;
        }

        // Store attendee details (supporting two names & two phone numbers for Duo)
        WorkshopState.attendee = {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            name2: (isDuo && name2Input) ? name2Input.value.trim() : '',
            phone2: (isDuo && phone2Input) ? phone2Input.value.trim() : '',
            email: emailInput.value.trim()
        };

        // Close registration form modal & open secure payment modal
        closeRegistrationModal();
        openPaymentModal();
    };

    // 8. Payment Modal Flow
    function initPaymentMethodListeners() {
        const payOpts = document.querySelectorAll('.pay-method-opt');
        payOpts.forEach(opt => {
            opt.addEventListener('click', () => {
                payOpts.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                const radio = opt.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    if (typeof selectPaymentMethodTab === 'function') {
                        selectPaymentMethodTab(radio.value);
                    }
                }
            });
        });
    }

    window.selectPaymentMethodTab = function (method) {
        const upiSec = document.getElementById('upiPaymentSection');
        const counterSec = document.getElementById('counterPaymentSection');
        const btnPay = document.getElementById('btnCompletePayment');

        if (method === 'upi') {
            if (upiSec) upiSec.style.display = 'block';
            if (counterSec) counterSec.style.display = 'none';
            if (btnPay) btnPay.innerHTML = '<span>I Have Paid • Confirm Booking 🎟️✨</span>';
        } else {
            if (upiSec) upiSec.style.display = 'none';
            if (counterSec) counterSec.style.display = 'block';
            if (btnPay) btnPay.innerHTML = '<span>Reserve Seat • Pay at Counter 🎟️✨</span>';
        }
    };

    window.copyUpiId = function (upiId) {
        const text = upiId || 'paytm.s2spcov@pty';
        const fallbackCopy = (val) => {
            const temp = document.createElement('textarea');
            temp.value = val;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            showToast(`UPI ID copied: ${val} 📋`);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`UPI ID copied: ${text} 📋`);
                const icon = document.getElementById('copyUpiIcon');
                if (icon) {
                    icon.className = 'fa-solid fa-check uip-icon';
                    icon.style.color = '#10b981';
                    setTimeout(() => {
                        icon.className = 'fa-regular fa-copy uip-icon';
                        icon.style.color = '';
                    }, 2000);
                }
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    };

    window.openPaymentModal = function () {
        updateModalSummary();
        const payModal = document.getElementById('paymentModal');
        if (payModal) {
            payModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closePaymentModal = function () {
        const payModal = document.getElementById('paymentModal');
        if (payModal) {
            payModal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    // 9. Complete Payment & Generate Workshop Pass
    window.completePaymentAndGetTicket = function () {
        const utrInput = document.getElementById('upiUtrInput');
        const utrVal = utrInput ? utrInput.value.trim() : '';
        const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'upi';
        WorkshopState.payment = {
            method: payMethod,
            utr: utrVal,
            amount: WorkshopState.totalPrice || 499
        };
        const isDuo = (WorkshopState.selectedPass.id === 'duo');
        let attendeeDisplay = WorkshopState.attendee.name || 'Creative Creator';
        if (isDuo && WorkshopState.attendee.name2) {
            attendeeDisplay = `${WorkshopState.attendee.name} & ${WorkshopState.attendee.name2}`;
        }

        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const ticketId = `CL-WRK-2026-${randomCode}`;

        // Populate Digital Pass
        const tAttendee = document.getElementById('ticketAttendeeName');
        const tBatch = document.getElementById('ticketBatchInfo');
        const tDate = document.getElementById('ticketDateInfo');
        const tPass = document.getElementById('ticketPassType');
        const tId = document.getElementById('ticketCodeDisplay');
        const tTote = document.getElementById('ticketToteText');

        if (tAttendee) tAttendee.textContent = attendeeDisplay;
        if (tBatch) tBatch.textContent = `${WorkshopState.selectedSlot.batch} • ${WorkshopState.selectedSlot.time}`;
        if (tDate) tDate.textContent = `${WorkshopState.selectedSlot.day}, ${WorkshopState.selectedSlot.date}`;
        if (tPass) tPass.textContent = WorkshopState.selectedPass.name;
        if (tId) tId.textContent = ticketId;
        if (tTote) tTote.textContent = `${WorkshopState.selectedPass.toteBags}x FREE Chocoloom Canvas Tote Bags Reserved`;

        // Close payment modal and open ticket pass
        closePaymentModal();

        const passModal = document.getElementById('passModal');
        if (passModal) {
            passModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        // Trigger celebratory confetti
        triggerConfetti();
        showToast('Payment Successful & Pass Confirmed! 🎟️✨');
    };

    window.closePassModal = function () {
        const passModal = document.getElementById('passModal');
        if (passModal) {
            passModal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    // 8. Download / Print Ticket
    window.downloadTicket = function () {
        window.print();
    };

    window.shareToWhatsApp = function () {
        const pass = WorkshopState.selectedPass;
        const slot = WorkshopState.selectedSlot;
        const text = encodeURIComponent(`🎉 I just registered for Chocoloom's Clay Toy Cakes Masterclass in Bhimavaram!\n\n🗓️ Date: ${slot.day}, ${slot.date} (${slot.time})\n📍 Venue: Bhimavaram (Location will be announced soon!)\n🍰 Custom Clay Toy Cake Keepsake + 🎒 FREE Chocoloom Signature Canvas Tote Bag Included!\n📞 Helpline WhatsApp: +91 98497 83788\n\nJoin me at Chocoloom Workshop: ${window.location.href}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    // 9. Location Picker
    window.openLocationModal = function () {
        const locModal = document.getElementById('locationModal');
        if (locModal) {
            locModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeLocationModal = function () {
        const locModal = document.getElementById('locationModal');
        if (locModal) {
            locModal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    window.selectLocation = function (type, name) {
        WorkshopState.currentLocation = { type, name };
        const locType = document.getElementById('currentLocType');
        const locName = document.getElementById('currentLocName');
        if (locType) locType.textContent = type;
        if (locName) locName.textContent = name;
        closeLocationModal();
        showToast(`Location set to: ${type}, ${name}`);
    };

    // 10. Search Modal (⌘K)
    function initSearchShortcut() {
        window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                openSearchModal();
            }
            if (e.key === 'Escape') {
                closeSearchModal();
                closeRegistrationModal();
                closePaymentModal();
                closePassModal();
                closeLocationModal();
            }
        });
    }

    window.openSearchModal = function () {
        const searchModal = document.getElementById('searchModal');
        const searchInput = document.getElementById('searchModalInput');
        if (searchModal) {
            searchModal.classList.add('open');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 50);
            }
        }
    };

    window.closeSearchModal = function () {
        const searchModal = document.getElementById('searchModal');
        if (searchModal) {
            searchModal.classList.remove('open');
        }
    };

    window.handleSearchFilter = function () {
        const input = document.getElementById('searchModalInput');
        if (!input) return;
        const query = input.value.toLowerCase().trim();
        const items = document.querySelectorAll('.search-result-item');

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    };

    // 11. Toast Helper
    window.showToast = function (msg) {
        let toast = document.getElementById('toastNotification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toastNotification';
            toast.className = 'toast-msg';
            document.body.appendChild(toast);
        }

        toast.innerHTML = `<i class="fa-solid fa-sparkles" style="color: #fbbf24;"></i> <span>${msg}</span>`;
        toast.classList.add('show');

        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    };

    // 12. Confetti Particle Effect
    function triggerConfetti() {
        if (window.confetti) {
            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            setTimeout(() => {
                window.confetti({
                    particleCount: 60,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                window.confetti({
                    particleCount: 60,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 250);
        }
    }



    // ==================== 13. ENTRY ADVERTISEMENT MODAL ====================
    window.openAdvertisementModal = function () {
        const modal = document.getElementById('advertisementModal');
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeAdvertisementModal = function () {
        const modal = document.getElementById('advertisementModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    window.handleAdModalCta = function () {
        window.closeAdvertisementModal();
        const target = document.getElementById('passesSection') || document.getElementById('craftingSection') || document.getElementById('aboutSection');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (typeof showToast === 'function') {
            showToast('Explore creative passes & crafting kits below! 🎒🎨');
        }
    };



    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('advertisementModal');
            if (modal && modal.classList.contains('open')) {
                window.closeAdvertisementModal();
            }
        }
    });

})();
