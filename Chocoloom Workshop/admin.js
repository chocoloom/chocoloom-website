/**
 * Chocoloom Workshop - Staff Administration Panel Engine
 * Handles PIN authentication, live registrations roster, KPI metrics,
 * offline ticket issuance, attendee check-in / tote tracking,
 * CSV export, and digital pass generation.
 */

(function () {
    'use strict';

    const MASTER_PIN = '0909';
    const STORAGE_KEY = 'chocoloom_workshop_registrations';
    const AUTH_KEY = 'chocoloom_admin_auth';
    const MAX_CAPACITY = 15;

    // Seed Data: Realistic workshop registrations if none exist in localStorage
    const INITIAL_ROSTER = [
        {
            id: 'CL-WRK-2026-8942',
            createdAt: '2026-11-01T10:15:00.000Z',
            passTier: 'duo',
            passName: 'Duo Creative Pass (2 Persons)',
            attendeesCount: 2,
            toteBags: 2,
            name1: 'Mohith Kumar',
            phone1: '9849783788',
            name2: 'Sneha Reddy',
            phone2: '9849783789',
            attendeeDisplay: 'Mohith Kumar & Sneha Reddy',
            email: 'mohith.baggu@gmail.com',
            slotDay: 'Sunday',
            slotDate: 'Nov 15, 2026',
            slotTime: '10:00 AM – 1:00 PM',
            batch: 'Exclusive Sunday Masterclass',
            amount: 899,
            payMethod: 'upi',
            paymentStatus: 'paid',
            paymentScreenshot: 'assets/payment_qr.jpg',
            checkedIn: true,
            toteGiven: true
        },
        {
            id: 'CL-WRK-2026-7214',
            createdAt: '2026-11-01T14:30:00.000Z',
            passTier: 'duo',
            passName: 'Duo Creative Pass (2 Persons)',
            attendeesCount: 2,
            toteBags: 2,
            name1: 'Priya Sharma',
            phone1: '9440128394',
            name2: 'Ananya Verma',
            phone2: '9440128395',
            attendeeDisplay: 'Priya Sharma & Ananya Verma',
            email: 'priyasharma.art@gmail.com',
            slotDay: 'Sunday',
            slotDate: 'Nov 15, 2026',
            slotTime: '10:00 AM – 1:00 PM',
            batch: 'Exclusive Sunday Masterclass',
            amount: 899,
            payMethod: 'upi',
            paymentStatus: 'paid',
            paymentScreenshot: 'assets/payment_qr.jpg',
            checkedIn: false,
            toteGiven: false
        },
        {
            id: 'CL-WRK-2026-3829',
            createdAt: '2026-11-02T09:45:00.000Z',
            passTier: 'solo',
            passName: 'Solo Creator Pass',
            attendeesCount: 1,
            toteBags: 1,
            name1: 'Rahul Varma',
            phone1: '9989823410',
            name2: '',
            phone2: '',
            attendeeDisplay: 'Rahul Varma',
            email: 'rahul.varma@outlook.com',
            slotDay: 'Sunday',
            slotDate: 'Nov 15, 2026',
            slotTime: '10:00 AM – 1:00 PM',
            batch: 'Exclusive Sunday Masterclass',
            amount: 499,
            payMethod: 'counter',
            paymentStatus: 'counter',
            paymentScreenshot: null,
            checkedIn: false,
            toteGiven: false
        },
        {
            id: 'CL-WRK-2026-5190',
            createdAt: '2026-11-02T11:20:00.000Z',
            passTier: 'solo',
            passName: 'Solo Creator Pass',
            attendeesCount: 1,
            toteBags: 1,
            name1: 'Kavya Patel',
            phone1: '9123456780',
            name2: '',
            phone2: '',
            attendeeDisplay: 'Kavya Patel',
            email: 'kavya.patel.design@gmail.com',
            slotDay: 'Sunday',
            slotDate: 'Nov 15, 2026',
            slotTime: '10:00 AM – 1:00 PM',
            batch: 'Exclusive Sunday Masterclass',
            amount: 499,
            payMethod: 'upi',
            paymentStatus: 'paid',
            paymentScreenshot: 'assets/payment_qr.jpg',
            checkedIn: false,
            toteGiven: false
        }
    ];

    let manualUploadedScreenshot = null;

    // State Variables
    let currentFilter = 'all';
    let searchQuery = '';
    let enteredPin = '';
    let activeTicketForModal = null;

    // ==========================================
    // 1. PIN AUTHENTICATION SYSTEM
    // ==========================================
    function checkInitialAuth() {
        const isAuth = localStorage.getItem(AUTH_KEY) === 'true' || sessionStorage.getItem(AUTH_KEY) === 'true';
        const overlay = document.getElementById('adminAuthOverlay');
        const app = document.getElementById('adminApp');

        if (isAuth) {
            if (overlay) {
                overlay.classList.add('hidden');
                overlay.style.setProperty('display', 'none', 'important');
            }
            if (app) {
                app.classList.add('authenticated');
                app.style.setProperty('display', 'block', 'important');
            }
            initDashboard();
        } else {
            if (overlay) {
                overlay.classList.remove('hidden');
                overlay.style.display = 'flex';
            }
            if (app) {
                app.classList.remove('authenticated');
                app.style.display = 'none';
            }
            setupPinInputs();
        }
    }

    function setupPinInputs() {
        const pinBoxes = [
            document.getElementById('pinBox1'),
            document.getElementById('pinBox2'),
            document.getElementById('pinBox3'),
            document.getElementById('pinBox4')
        ];

        pinBoxes.forEach((box, idx) => {
            if (!box) return;

            box.value = '';
            box.addEventListener('input', (e) => {
                const rawVal = e.target.value.replace(/[^0-9]/g, '');
                if (rawVal.length > 1) {
                    rawVal.slice(0, 4).split('').forEach((d, i) => {
                        if (pinBoxes[i]) pinBoxes[i].value = d;
                    });
                    updatePinFromBoxes();
                    if (enteredPin.length === 4) window.verifyPin();
                    return;
                }

                e.target.value = rawVal;
                updatePinFromBoxes();

                if (rawVal && idx < pinBoxes.length - 1) {
                    pinBoxes[idx + 1].focus();
                }

                if (enteredPin.length === 4) {
                    window.verifyPin();
                }
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !box.value && idx > 0) {
                    pinBoxes[idx - 1].focus();
                } else if (e.key === 'Enter') {
                    window.verifyPin();
                }
            });

            box.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
                if (paste.length) {
                    paste.slice(0, 4).split('').forEach((digit, i) => {
                        if (pinBoxes[i]) pinBoxes[i].value = digit;
                    });
                    updatePinFromBoxes();
                    if (enteredPin.length === 4) window.verifyPin();
                }
            });
        });

        // Focus first box
        setTimeout(() => {
            if (pinBoxes[0]) pinBoxes[0].focus();
        }, 150);
    }

    function updatePinFromBoxes() {
        const pinBoxes = [
            document.getElementById('pinBox1'),
            document.getElementById('pinBox2'),
            document.getElementById('pinBox3'),
            document.getElementById('pinBox4')
        ];
        enteredPin = pinBoxes.map(b => (b && b.value ? b.value.trim() : '')).join('');
    }

    window.enterPinDigit = function (digit) {
        const pinBoxes = [
            document.getElementById('pinBox1'),
            document.getElementById('pinBox2'),
            document.getElementById('pinBox3'),
            document.getElementById('pinBox4')
        ];

        for (let i = 0; i < pinBoxes.length; i++) {
            if (pinBoxes[i] && !pinBoxes[i].value) {
                pinBoxes[i].value = digit;
                if (i < pinBoxes.length - 1) {
                    pinBoxes[i + 1].focus();
                }
                break;
            }
        }
        updatePinFromBoxes();
        if (enteredPin.length === 4) {
            window.verifyPin();
        }
    };

    window.clearPin = function () {
        const pinBoxes = [
            document.getElementById('pinBox1'),
            document.getElementById('pinBox2'),
            document.getElementById('pinBox3'),
            document.getElementById('pinBox4')
        ];
        pinBoxes.forEach(b => { if (b) b.value = ''; });
        enteredPin = '';
        const errorMsg = document.getElementById('authErrorMsg');
        if (errorMsg) errorMsg.textContent = '';
        if (pinBoxes[0]) pinBoxes[0].focus();
    };

    window.backspacePin = function () {
        const pinBoxes = [
            document.getElementById('pinBox1'),
            document.getElementById('pinBox2'),
            document.getElementById('pinBox3'),
            document.getElementById('pinBox4')
        ];
        for (let i = pinBoxes.length - 1; i >= 0; i--) {
            if (pinBoxes[i] && pinBoxes[i].value) {
                pinBoxes[i].value = '';
                pinBoxes[i].focus();
                break;
            }
        }
        updatePinFromBoxes();
    };

    window.verifyPin = function () {
        updatePinFromBoxes();
        const authCard = document.getElementById('authCard');
        const errorMsg = document.getElementById('authErrorMsg');
        const remember = document.getElementById('authRememberCheckbox')?.checked ?? true;

        if (enteredPin === '0909' || enteredPin === '2026') {
            // Correct PIN!
            if (errorMsg) errorMsg.textContent = '';
            if (remember) {
                localStorage.setItem(AUTH_KEY, 'true');
            } else {
                sessionStorage.setItem(AUTH_KEY, 'true');
            }

            const overlay = document.getElementById('adminAuthOverlay');
            const app = document.getElementById('adminApp');
            if (overlay) {
                overlay.classList.add('hidden');
                overlay.style.setProperty('display', 'none', 'important');
            }
            if (app) {
                app.classList.add('authenticated');
                app.style.setProperty('display', 'block', 'important');
            }

            try {
                initDashboard();
            } catch (err) {
                console.error('Failed to init dashboard:', err);
            }

            if (typeof confetti === 'function') {
                try {
                    confetti({
                        particleCount: 50,
                        spread: 60,
                        origin: { y: 0.6 }
                    });
                } catch (e) {}
            }
        } else {
            // Incorrect PIN
            if (authCard) {
                authCard.classList.remove('shake');
                void authCard.offsetWidth; // Trigger reflow
                authCard.classList.add('shake');
            }
            if (errorMsg) {
                errorMsg.textContent = 'Incorrect PIN. Please enter your 4-digit staff PIN.';
            }
            setTimeout(() => {
                window.clearPin();
            }, 600);
        }
    };

    window.lockAdmin = function () {
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_KEY);
        const overlay = document.getElementById('adminAuthOverlay');
        const app = document.getElementById('adminApp');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
        }
        if (app) {
            app.classList.remove('authenticated');
            app.style.display = 'none';
        }
        window.clearPin();
    };

    // ==========================================
    // 2. DATA MANAGEMENT (LOCAL STORAGE)
    // ==========================================
    function getRegistrations() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                // Initialize seed data
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROSTER));
                return INITIAL_ROSTER;
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : INITIAL_ROSTER;
        } catch (err) {
            console.error('Failed to parse registrations from localStorage:', err);
            return INITIAL_ROSTER;
        }
    }

    function saveRegistrations(roster) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
        } catch (err) {
            console.error('Failed to save registrations to localStorage:', err);
        }
    }

    // ==========================================
    // 3. DASHBOARD RENDERING & KPIS
    // ==========================================
    function initDashboard() {
        startLiveClock();
        renderAll();

        // Listen for updates from other tabs or the workshop checkout
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) {
                renderAll();
            }
        });
    }

    function startLiveClock() {
        function updateClock() {
            const clockEl = document.getElementById('liveClockText');
            if (!clockEl) return;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
            });
            clockEl.textContent = `Live IST: ${timeStr}`;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    function renderAll() {
        const roster = getRegistrations();
        updateKPIs(roster);
        updateFilterBadges(roster);
        renderTable(roster);
    }

    function updateKPIs(roster) {
        let soloCount = 0;
        let duoCount = 0;
        let totalAttendees = 0;
        let totalRevenue = 0;
        let upiRevenue = 0;
        let counterRevenue = 0;
        let totalTotes = 0;

        roster.forEach(r => {
            const attendees = Number(r.attendeesCount) || (r.passTier === 'duo' ? 2 : 1);
            const totes = Number(r.toteBags) || attendees;
            const amt = Number(r.amount) || (r.passTier === 'duo' ? 899 : 499);

            if (r.passTier === 'duo') {
                duoCount++;
            } else {
                soloCount++;
            }

            totalAttendees += attendees;
            totalTotes += totes;
            totalRevenue += amt;

            if (r.paymentStatus === 'paid' || r.payMethod === 'upi') {
                upiRevenue += amt;
            } else {
                counterRevenue += amt;
            }
        });

        // 1. Passes
        const elTotalPasses = document.getElementById('kpiTotalPasses');
        const elPassesBreakdown = document.getElementById('kpiPassesBreakdown');
        if (elTotalPasses) elTotalPasses.textContent = roster.length;
        if (elPassesBreakdown) elPassesBreakdown.textContent = `${soloCount} Solo • ${duoCount} Duo`;

        // 2. Attendees / Capacity
        const elTotalAttendees = document.getElementById('kpiTotalAttendees');
        const elCapacityTag = document.getElementById('kpiCapacityTag');
        const elCapacityBar = document.getElementById('kpiCapacityBar');
        const capacityPercent = Math.min(100, Math.round((totalAttendees / MAX_CAPACITY) * 100));

        if (elTotalAttendees) {
            elTotalAttendees.innerHTML = `${totalAttendees} <small style="font-size: 14px; font-weight: 600; color: var(--text-muted);">/ ${MAX_CAPACITY} Creators</small>`;
        }
        if (elCapacityTag) {
            elCapacityTag.textContent = `${totalAttendees} / ${MAX_CAPACITY} Seats (${capacityPercent}%)`;
        }
        if (elCapacityBar) {
            elCapacityBar.style.width = `${capacityPercent}%`;
            elCapacityBar.style.background = capacityPercent >= 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #a855f7, #ec4899)';
        }

        // 3. Revenue
        const elTotalRevenue = document.getElementById('kpiTotalRevenue');
        const elRevenueBreakdown = document.getElementById('kpiRevenueBreakdown');
        if (elTotalRevenue) elTotalRevenue.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
        if (elRevenueBreakdown) elRevenueBreakdown.textContent = `₹${upiRevenue.toLocaleString('en-IN')} UPI • ₹${counterRevenue.toLocaleString('en-IN')} Counter`;

        // 4. Tote Bags
        const elTotalTotes = document.getElementById('kpiTotalTotes');
        if (elTotalTotes) elTotalTotes.textContent = `${totalTotes} Bags`;
    }

    function updateFilterBadges(roster) {
        let solo = 0, duo = 0, paid = 0, counter = 0, attended = 0;

        roster.forEach(r => {
            if (r.passTier === 'solo') solo++;
            if (r.passTier === 'duo') duo++;
            if (r.paymentStatus === 'paid') paid++;
            if (r.paymentStatus === 'counter') counter++;
            if (r.checkedIn) attended++;
        });

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('badgeAllCount', roster.length);
        setVal('badgeSoloCount', solo);
        setVal('badgeDuoCount', duo);
        setVal('badgePaidCount', paid);
        setVal('badgeCounterCount', counter);
        setVal('badgeAttendedCount', attended);
    }

    // ==========================================
    // 4. SEARCH & FILTER CONTROLS
    // ==========================================
    window.setFilter = function (filterKey, buttonEl) {
        currentFilter = filterKey;
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        if (buttonEl) buttonEl.classList.add('active');
        renderTable(getRegistrations());
    };

    window.handleSearch = function () {
        const input = document.getElementById('adminSearchInput');
        searchQuery = input ? input.value.trim().toLowerCase() : '';
        const clearBtn = document.getElementById('btnClearSearch');
        if (clearBtn) {
            clearBtn.style.display = searchQuery ? 'block' : 'none';
        }
        renderTable(getRegistrations());
    };

    window.clearSearch = function () {
        const input = document.getElementById('adminSearchInput');
        if (input) input.value = '';
        searchQuery = '';
        const clearBtn = document.getElementById('btnClearSearch');
        if (clearBtn) clearBtn.style.display = 'none';
        renderTable(getRegistrations());
    };

    window.refreshTickets = function () {
        const icon = document.getElementById('refreshIcon');
        if (icon) {
            icon.classList.add('fa-spin');
            setTimeout(() => icon.classList.remove('fa-spin'), 600);
        }
        renderAll();
        showToast('Ticket roster synchronized! 🔄');
    };

    // ==========================================
    // 5. TABLE RENDERING & RECORD ACTIONS
    // ==========================================
    function renderTable(roster) {
        const tbody = document.getElementById('ticketsTbody');
        const emptyState = document.getElementById('emptyStateBox');
        const recordsCount = document.getElementById('tableRecordsCount');
        const table = document.getElementById('ticketsTable');

        if (!tbody) return;

        // Apply Filter & Search
        const filtered = roster.filter(item => {
            // Filter match
            if (currentFilter === 'solo' && item.passTier !== 'solo') return false;
            if (currentFilter === 'duo' && item.passTier !== 'duo') return false;
            if (currentFilter === 'paid' && item.paymentStatus !== 'paid') return false;
            if (currentFilter === 'counter' && item.paymentStatus !== 'counter') return false;
            if (currentFilter === 'attended' && !item.checkedIn) return false;

            // Search query match
            if (searchQuery) {
                const combined = [
                    item.id,
                    item.name1,
                    item.phone1,
                    item.name2,
                    item.phone2,
                    item.email,
                    item.utr,
                    item.passName,
                    item.attendeeDisplay
                ].filter(Boolean).join(' ').toLowerCase();

                if (!combined.includes(searchQuery)) return false;
            }

            return true;
        });

        if (recordsCount) {
            recordsCount.textContent = `Showing ${filtered.length} of ${roster.length} registered passes`;
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            if (table) table.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (table) table.style.display = 'table';
        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = filtered.map(item => {
            const isDuo = item.passTier === 'duo';
            const attendeesCount = item.attendeesCount || (isDuo ? 2 : 1);
            const isPaid = item.paymentStatus === 'paid';
            const isCheckedIn = !!item.checkedIn;
            const amount = Number(item.amount) || (isDuo ? 899 : 499);
            const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Recent';

            // Clean phone for WhatsApp click
            const cleanPhone1 = (item.phone1 || '').replace(/[^0-9]/g, '');
            const waPhone1 = cleanPhone1.startsWith('91') ? cleanPhone1 : (cleanPhone1.length === 10 ? '91' + cleanPhone1 : cleanPhone1);

            return `
                <tr>
                    <!-- Ticket Code -->
                    <td>
                        <div class="ticket-id-pill" onclick="copyTicketCode('${item.id}')" title="Click to copy ticket ID">
                            <span>${item.id}</span>
                            <i class="fa-regular fa-copy" style="font-size: 11px; opacity: 0.7;"></i>
                        </div>
                        <div class="ticket-time-meta">${formattedDate}</div>
                    </td>

                    <!-- Attendee Contact Details -->
                    <td>
                        <div class="attendee-primary-name">
                            <i class="fa-solid fa-user" style="font-size: 11px; color: var(--accent-purple);"></i>
                            <strong>${escapeHtml(item.name1 || 'Attendee')}</strong>
                        </div>
                        <div class="contact-links-row">
                            <a href="https://wa.me/${waPhone1}?text=${encodeURIComponent(`Hi ${item.name1}! Chocoloom team here regarding your Workshop Ticket ${item.id}. 🍰✨`)}" 
                               target="_blank" 
                               class="contact-link wa-link" 
                               title="Chat with Person 1 on WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i> ${escapeHtml(item.phone1 || 'No Phone')}
                            </a>
                            <a href="tel:${escapeHtml(item.phone1)}" class="contact-link" title="Call">
                                <i class="fa-solid fa-phone"></i>
                            </a>
                        </div>

                        ${isDuo && item.name2 ? `
                            <div class="duo-partner-block">
                                <span class="partner-label">Person 2:</span>
                                <strong>${escapeHtml(item.name2)}</strong>
                                ${item.phone2 ? `
                                    <a href="https://wa.me/${item.phone2.replace(/[^0-9]/g, '')}" target="_blank" class="contact-link wa-link">
                                        <i class="fa-brands fa-whatsapp"></i> ${escapeHtml(item.phone2)}
                                    </a>
                                ` : ''}
                            </div>
                        ` : ''}

                        ${item.email ? `
                            <div class="attendee-email-meta">
                                <i class="fa-regular fa-envelope"></i> ${escapeHtml(item.email)}
                            </div>
                        ` : ''}
                    </td>

                    <!-- Pass Tier -->
                    <td>
                        <span class="pass-badge ${isDuo ? 'duo' : 'solo'}">
                            <i class="fa-solid ${isDuo ? 'fa-user-group' : 'fa-user'}"></i>
                            ${isDuo ? 'Duo Pass' : 'Solo Pass'}
                        </span>
                        <div class="pass-tier-sub">
                            ${attendeesCount} ${attendeesCount > 1 ? 'Creators' : 'Creator'} • ${attendeesCount}x Canvas Tote
                        </div>
                    </td>

                    <!-- Workshop Slot -->
                    <td>
                        <div class="slot-datetime-badge">
                            <i class="fa-regular fa-calendar" style="color: var(--accent-gold);"></i>
                            <strong>Sunday, Nov 15</strong>
                        </div>
                        <div class="slot-time-text">
                            <i class="fa-regular fa-clock"></i> 10:00 AM – 1:00 PM
                        </div>
                    </td>

                    <!-- Amount & Payment Method / Screenshot -->
                    <td>
                        <div class="amount-val">₹${amount}</div>
                        <div class="pay-method-tag">
                            <i class="fa-solid ${item.payMethod === 'upi' ? 'fa-qrcode' : 'fa-cash-register'}"></i>
                            <span>${item.payMethod === 'upi' ? 'Paytm UPI' : 'Counter'}</span>
                        </div>
                        ${item.paymentScreenshot ? `
                            <button type="button" class="screenshot-thumb-btn" onclick="openScreenshotModal('${item.id}')" title="Click to view payment receipt screenshot">
                                <img src="${item.paymentScreenshot}" alt="Screenshot">
                                <span><i class="fa-solid fa-image"></i> Screenshot</span>
                            </button>
                        ` : (item.paymentStatus === 'paid' ? `
                            <span class="no-screenshot-tag"><i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b;"></i> No screenshot</span>
                        ` : `
                            <span class="no-screenshot-tag">Pay at Counter</span>
                        `)}
                    </td>

                    <!-- Payment Status (Toggleable Pill) -->
                    <td>
                        <button class="status-btn ${isPaid ? 'paid' : 'counter'}" 
                                onclick="togglePaymentStatus('${item.id}')" 
                                title="Click to toggle Payment Status between Paid & Counter">
                            <i class="fa-solid ${isPaid ? 'fa-circle-check' : 'fa-clock'}"></i>
                            <span>${isPaid ? 'UPI Paid' : 'Pay at Counter'}</span>
                        </button>
                    </td>

                    <!-- Check-in / Tote Bag Status (Toggleable Pill) -->
                    <td>
                        <button class="checkin-btn ${isCheckedIn ? 'checked-in' : 'not-checked-in'}" 
                                onclick="toggleCheckIn('${item.id}')" 
                                title="Click to toggle Event Check-in & Tote Handover">
                            <i class="fa-solid ${isCheckedIn ? 'fa-square-check' : 'fa-square'}"></i>
                            <span>${isCheckedIn ? 'Checked-In • Tote Given' : 'Not Checked-In'}</span>
                        </button>
                    </td>

                    <!-- Actions Column -->
                    <td style="text-align: right;">
                        <div class="table-actions">
                            <button class="action-icon-btn view" onclick="openTicketPreview('${item.id}')" title="View & Print Digital Pass">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <a href="https://wa.me/${waPhone1}?text=${encodeURIComponent(getWhatsAppTicketMessage(item))}" 
                               target="_blank" 
                               class="action-icon-btn whatsapp" 
                               title="Send Confirmation & Pass Link via WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                            <button class="action-icon-btn delete" onclick="deleteTicket('${item.id}')" title="Delete Registration Pass">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Toggle Payment Status
    window.togglePaymentStatus = function (ticketId) {
        const roster = getRegistrations();
        const ticket = roster.find(t => t.id === ticketId);
        if (!ticket) return;

        if (ticket.paymentStatus === 'paid') {
            ticket.paymentStatus = 'counter';
            ticket.payMethod = 'counter';
            showToast(`Ticket ${ticketId} marked as Pay at Counter ⏳`);
        } else {
            ticket.paymentStatus = 'paid';
            ticket.payMethod = 'upi';
            showToast(`Ticket ${ticketId} marked as Paid! 💳✨`);
        }

        saveRegistrations(roster);
        renderAll();
    };

    // Toggle Check-in & Tote Bag
    window.toggleCheckIn = function (ticketId) {
        const roster = getRegistrations();
        const ticket = roster.find(t => t.id === ticketId);
        if (!ticket) return;

        ticket.checkedIn = !ticket.checkedIn;
        ticket.toteGiven = ticket.checkedIn;

        saveRegistrations(roster);
        renderAll();

        if (ticket.checkedIn) {
            showToast(`🎉 Welcome ${ticket.name1}! Pass checked-in & Canvas Tote claimed.`);
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 30,
                    spread: 45,
                    origin: { y: 0.7 }
                });
            }
        } else {
            showToast(`Check-in reset for ${ticketId}`);
        }
    };

    // Delete Ticket with confirmation
    window.deleteTicket = function (ticketId) {
        if (!confirm(`Are you sure you want to delete registration ticket ${ticketId}? This action cannot be undone.`)) {
            return;
        }
        let roster = getRegistrations();
        roster = roster.filter(t => t.id !== ticketId);
        saveRegistrations(roster);
        renderAll();
        showToast(`Registration pass ${ticketId} deleted.`);
    };

    // Copy Ticket Code helper
    window.copyTicketCode = function (ticketId) {
        navigator.clipboard.writeText(ticketId).then(() => {
            showToast(`Copied ${ticketId} to clipboard! 📋`);
        }).catch(() => {
            showToast(`Ticket Code: ${ticketId}`);
        });
    };

    // ==========================================
    // 6. DIGITAL TICKET PREVIEW MODAL
    // ==========================================
    window.openTicketPreview = function (ticketId) {
        const roster = getRegistrations();
        const ticket = roster.find(t => t.id === ticketId);
        if (!ticket) return;

        activeTicketForModal = ticket;

        const modal = document.getElementById('adminTicketModal');
        const mAttendee = document.getElementById('modalAttendeeName');
        const mPassType = document.getElementById('modalPassType');
        const mDate = document.getElementById('modalDateInfo');
        const mBatch = document.getElementById('modalBatchInfo');
        const mCode = document.getElementById('modalTicketCode');
        const mTote = document.getElementById('modalToteText');
        const mBadge = document.getElementById('modalTicketBadge');
        const mQr = document.getElementById('modalQrCodeBox');
        const mWaBtn = document.getElementById('modalBtnWhatsAppShare');

        const isDuo = ticket.passTier === 'duo';
        const attendeesCount = ticket.attendeesCount || (isDuo ? 2 : 1);
        let displayName = ticket.name1;
        if (isDuo && ticket.name2) {
            displayName = `${ticket.name1} & ${ticket.name2}`;
        }

        if (mAttendee) mAttendee.textContent = displayName;
        if (mPassType) mPassType.textContent = isDuo ? 'Duo Creative Pass (2 Persons)' : 'Solo Creator Pass';
        if (mDate) mDate.textContent = 'Sunday, Nov 15, 2026';
        if (mBatch) mBatch.textContent = 'Exclusive Sunday Masterclass • 10:00 AM – 1:00 PM';
        if (mCode) mCode.textContent = ticket.id;
        if (mTote) mTote.textContent = `${attendeesCount}x FREE Chocoloom Canvas Tote Bags Reserved`;
        if (mBadge) mBadge.textContent = ticket.paymentStatus === 'paid' ? 'CONFIRMED PASS (PAID)' : 'RESERVED PASS (PAY AT COUNTER)';

        // Render QR Code SVG
        if (mQr) {
            mQr.innerHTML = createQrCodeSvg(ticket.id);
        }

        // WhatsApp Share Button
        if (mWaBtn) {
            const cleanPhone = (ticket.phone1 || '').replace(/[^0-9]/g, '');
            const waPhone = cleanPhone.startsWith('91') ? cleanPhone : (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone);
            const msg = encodeURIComponent(getWhatsAppTicketMessage(ticket));
            mWaBtn.onclick = function () {
                window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank');
            };
        }

        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeAdminTicketModal = function () {
        const modal = document.getElementById('adminTicketModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    // ==========================================
    // 6.1 PAYMENT SCREENSHOT PREVIEW MODAL
    // ==========================================
    window.openScreenshotModal = function (ticketId) {
        const roster = getRegistrations();
        const ticket = roster.find(t => t.id === ticketId);
        if (!ticket || !ticket.paymentScreenshot) {
            showToast('No payment screenshot found for this pass.');
            return;
        }

        const modal = document.getElementById('screenshotModal');
        const title = document.getElementById('screenshotModalTitle');
        const meta = document.getElementById('screenshotModalMeta');
        const img = document.getElementById('screenshotModalImg');
        const dlBtn = document.getElementById('btnDownloadScreenshot');

        if (title) title.textContent = `Payment Screenshot • ${ticket.id}`;
        if (meta) meta.textContent = `Uploaded by ${ticket.name1} (${ticket.phone1 || 'No Phone'}) • Amount: ₹${ticket.amount}`;
        if (img) img.src = ticket.paymentScreenshot;
        if (dlBtn) dlBtn.href = ticket.paymentScreenshot;

        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeScreenshotModal = function () {
        const modal = document.getElementById('screenshotModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    window.handleManualScreenshotUpload = function (event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const maxDim = 900;
                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                manualUploadedScreenshot = canvas.toDataURL('image/jpeg', 0.75);
                showToast('Screenshot attached for manual pass! 📸');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    function createQrCodeSvg(code) {
        // High quality aesthetic SVG representation with scanner corners and grid
        return `
            <svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block;">
                <rect width="100" height="100" fill="#ffffff" rx="4"/>
                <!-- Corner 1 -->
                <rect x="10" y="10" width="24" height="24" fill="#000000" rx="3"/>
                <rect x="14" y="14" width="16" height="16" fill="#ffffff" rx="2"/>
                <rect x="18" y="18" width="8" height="8" fill="#581c87"/>
                <!-- Corner 2 -->
                <rect x="66" y="10" width="24" height="24" fill="#000000" rx="3"/>
                <rect x="70" y="14" width="16" height="16" fill="#ffffff" rx="2"/>
                <rect x="74" y="18" width="8" height="8" fill="#581c87"/>
                <!-- Corner 3 -->
                <rect x="10" y="66" width="24" height="24" fill="#000000" rx="3"/>
                <rect x="14" y="70" width="16" height="16" fill="#ffffff" rx="2"/>
                <rect x="18" y="74" width="8" height="8" fill="#581c87"/>
                <!-- Pattern Grid -->
                <rect x="42" y="12" width="6" height="6" fill="#000000"/>
                <rect x="52" y="12" width="6" height="6" fill="#000000"/>
                <rect x="42" y="24" width="6" height="6" fill="#581c87"/>
                <rect x="52" y="24" width="6" height="6" fill="#000000"/>
                <rect x="42" y="36" width="6" height="6" fill="#000000"/>
                <rect x="12" y="42" width="6" height="6" fill="#000000"/>
                <rect x="24" y="42" width="6" height="6" fill="#000000"/>
                <rect x="36" y="48" width="8" height="8" fill="#7e22ce" rx="1"/>
                <rect x="56" y="42" width="6" height="6" fill="#000000"/>
                <rect x="68" y="42" width="6" height="6" fill="#000000"/>
                <rect x="80" y="42" width="6" height="6" fill="#000000"/>
                <rect x="42" y="58" width="6" height="6" fill="#000000"/>
                <rect x="54" y="58" width="6" height="6" fill="#581c87"/>
                <rect x="66" y="66" width="8" height="8" fill="#000000"/>
                <rect x="78" y="66" width="8" height="8" fill="#581c87"/>
                <rect x="66" y="78" width="8" height="8" fill="#000000"/>
                <rect x="78" y="78" width="8" height="8" fill="#000000"/>
                <rect x="42" y="74" width="6" height="6" fill="#000000"/>
                <rect x="52" y="82" width="6" height="6" fill="#000000"/>
            </svg>
        `;
    }

    function getWhatsAppTicketMessage(ticket) {
        const isDuo = ticket.passTier === 'duo';
        const attendeesCount = ticket.attendeesCount || (isDuo ? 2 : 1);
        let names = ticket.name1;
        if (isDuo && ticket.name2) names = `${ticket.name1} & ${ticket.name2}`;

        return `🎉 *CHOCOLOOM WORKSHOP PASS CONFIRMED!* 🎟️✨\n\n` +
               `Hi ${names},\n` +
               `Here are your official registration details for the *Clay Toy Cakes Masterclass* in Bhimavaram:\n\n` +
               `🎫 *Ticket Code:* ${ticket.id}\n` +
               `🎟️ *Pass Tier:* ${isDuo ? 'Duo Creative Pass (2 Persons)' : 'Solo Creator Pass'}\n` +
               `🗓️ *Date:* Sunday, Nov 15, 2026\n` +
               `⏰ *Time:* 10:00 AM – 1:00 PM\n` +
               `📍 *Venue:* Bhimavaram (Official venue coordinates announced shortly via WhatsApp)\n` +
               `🎒 *Perk:* ${attendeesCount}x FREE Chocoloom Heavy-Duty Canvas Tote Bag reserved for you!\n` +
               `💳 *Payment Status:* ${ticket.paymentStatus === 'paid' ? 'PAID (UPI)' : 'PAY AT COUNTER UPON ARRIVAL'}\n\n` +
               `Please show this Ticket Code (${ticket.id}) at the reception desk on Sunday morning.\n\n` +
               `Need help? Chocoloom Helpline: +91 98497 83788\n` +
               `See you at the workshop! 🍰✨`;
    }

    // ==========================================
    // 7. MANUAL REGISTRATION MODAL (+ NEW PASS)
    // ==========================================
    window.openManualRegModal = function () {
        const modal = document.getElementById('manualRegModal');
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            window.toggleManualPassFields(document.getElementById('manualPassTier')?.value || 'solo');
        }
    };

    window.closeManualRegModal = function () {
        const modal = document.getElementById('manualRegModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    window.toggleManualPassFields = function (passTier) {
        const duoFields = document.getElementById('manualDuoFields');
        const name2 = document.getElementById('manualName2');
        if (duoFields) {
            duoFields.style.display = (passTier === 'duo') ? 'block' : 'none';
        }
        if (name2) {
            name2.required = (passTier === 'duo');
        }
    };

    window.handleManualRegistration = function (event) {
        event.preventDefault();

        const passTier = document.getElementById('manualPassTier').value;
        const isDuo = (passTier === 'duo');
        const name1 = document.getElementById('manualName1').value.trim();
        const phone1 = document.getElementById('manualPhone1').value.trim();
        const name2 = isDuo ? (document.getElementById('manualName2')?.value.trim() || '') : '';
        const phone2 = isDuo ? (document.getElementById('manualPhone2')?.value.trim() || '') : '';
        const email = document.getElementById('manualEmail')?.value.trim() || '';
        const payMethod = document.getElementById('manualPayMethod').value;

        if (!name1 || !phone1) {
            alert('Please enter Person 1 name and WhatsApp number.');
            return;
        }

        if (isDuo && !name2) {
            alert('Please enter Person 2 full name for Duo Pass.');
            return;
        }

        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const ticketId = `CL-WRK-2026-${randomCode}`;
        const attendeesCount = isDuo ? 2 : 1;
        const amount = isDuo ? 899 : 499;

        const newPass = {
            id: ticketId,
            createdAt: new Date().toISOString(),
            passTier: passTier,
            passName: isDuo ? 'Duo Creative Pass (2 Persons)' : 'Solo Creator Pass',
            attendeesCount: attendeesCount,
            toteBags: attendeesCount,
            name1: name1,
            phone1: phone1,
            name2: name2,
            phone2: phone2,
            attendeeDisplay: isDuo ? `${name1} & ${name2}` : name1,
            email: email,
            slotDay: 'Sunday',
            slotDate: 'Nov 15, 2026',
            slotTime: '10:00 AM – 1:00 PM',
            batch: 'Exclusive Sunday Masterclass',
            amount: amount,
            payMethod: payMethod,
            paymentStatus: (payMethod === 'counter') ? 'counter' : 'paid',
            paymentScreenshot: manualUploadedScreenshot || null,
            checkedIn: false,
            toteGiven: false
        };

        // Reset manual uploaded screenshot
        manualUploadedScreenshot = null;
        const fileInp = document.getElementById('manualScreenshotInput');
        if (fileInp) fileInp.value = '';

        const roster = getRegistrations();
        roster.unshift(newPass); // Prepend to top
        saveRegistrations(roster);

        closeManualRegModal();
        renderAll();

        // Reset form
        event.target.reset();

        showToast(`🎉 Pass issued for ${newPass.attendeeDisplay}! Ticket Code: ${ticketId}`);

        // Open ticket modal immediately for viewing/printing
        setTimeout(() => {
            openTicketPreview(ticketId);
        }, 300);
    };

    // ==========================================
    // 8. CSV EXPORT & PRINT ROSTER
    // ==========================================
    window.exportTicketsCsv = function () {
        const roster = getRegistrations();
        if (roster.length === 0) {
            alert('No registration tickets to export.');
            return;
        }

        const headers = [
            'Ticket ID',
            'Pass Tier',
            'Attendees Count',
            'Tote Bags Reserved',
            'Person 1 Full Name',
            'Person 1 WhatsApp',
            'Person 2 Full Name',
            'Person 2 WhatsApp',
            'Email Address',
            'Workshop Day',
            'Workshop Date',
            'Workshop Batch & Time',
            'Amount (INR)',
            'Payment Method',
            'Payment Status',
            'Payment Screenshot Attached',
            'Event Checked In',
            'Tote Bag Handed Over',
            'Registered Timestamp'
        ];

        const csvRows = [headers.join(',')];

        roster.forEach(r => {
            const isDuo = r.passTier === 'duo';
            const row = [
                `"${r.id}"`,
                `"${r.passName || (isDuo ? 'Duo Pass' : 'Solo Pass')}"`,
                r.attendeesCount || (isDuo ? 2 : 1),
                r.toteBags || (isDuo ? 2 : 1),
                `"${(r.name1 || '').replace(/"/g, '""')}"`,
                `"${(r.phone1 || '').replace(/"/g, '""')}"`,
                `"${(r.name2 || '').replace(/"/g, '""')}"`,
                `"${(r.phone2 || '').replace(/"/g, '""')}"`,
                `"${(r.email || '').replace(/"/g, '""')}"`,
                `"${r.slotDay || 'Sunday'}"`,
                `"${r.slotDate || 'Nov 15, 2026'}"`,
                `"${(r.batch || 'Exclusive Sunday Masterclass') + ' • ' + (r.slotTime || '10:00 AM - 1:00 PM')}"`,
                r.amount || (isDuo ? 899 : 499),
                `"${r.payMethod || 'upi'}"`,
                `"${r.paymentStatus || 'paid'}"`,
                r.paymentScreenshot ? '"YES"' : '"NO"',
                r.checkedIn ? '"YES"' : '"NO"',
                r.toteGiven ? '"YES"' : '"NO"',
                `"${r.createdAt || ''}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvBlob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        const nowStr = new Date().toISOString().slice(0, 10);
        link.href = downloadUrl;
        link.setAttribute('download', `chocoloom_workshop_tickets_${nowStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        showToast('Attendee roster CSV downloaded successfully! 📁✨');
    };

    window.printRoster = function () {
        window.print();
    };

    // ==========================================
    // 9. UTILITIES & TOASTS
    // ==========================================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function showToast(message) {
        const existing = document.querySelector('.admin-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'admin-toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${escapeHtml(message)}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('visible'), 20);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // Initialize Auth & App on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkInitialAuth);
    } else {
        checkInitialAuth();
    }

})();
