<?php
/**
 * Template Name: Chocowallet VIP Card
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/logo.png">
    
    <style>
        .wallet-page-wrapper {
            max-width: 960px;
            margin: 32px auto 80px;
            padding: 0 20px;
        }

        .wallet-hero-header {
            text-align: center;
            margin-bottom: 32px;
        }

        .wallet-hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, #fdf4ff, #fae8ff);
            color: #86198f;
            border: 1px solid #f0abfc;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }

        .wallet-hero-title {
            font-size: 32px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.8px;
            margin-bottom: 8px;
        }

        .wallet-hero-sub {
            font-size: 15px;
            color: #64748b;
            max-width: 580px;
            margin: 0 auto;
            line-height: 1.5;
        }

        /* 2-Column Dashboard Grid */
        .wallet-grid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 24px;
            align-items: start;
        }

        @media (max-width: 860px) {
            .wallet-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Big Standalone Card Showcase */
        .chocowallet-featured-card {
            max-width: 460px;
            margin: 0 auto 20px;
        }

        .wallet-card-actions-bar {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 24px;
        }

        .wallet-action-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            padding: 9px 16px;
            border-radius: 10px;
            font-size: 12.5px;
            font-weight: 700;
            color: #334155;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .wallet-action-btn:hover {
            border-color: #9333ea;
            color: #9333ea;
            background: #faf5ff;
            transform: translateY(-1px);
        }

        /* Perks Grid */
        .wallet-perks-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 24px;
        }

        @media (max-width: 540px) {
            .wallet-perks-grid {
                grid-template-columns: 1fr;
            }
        }

        .perk-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 14px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            transition: all 0.2s ease;
        }

        .perk-card:hover {
            border-color: #d8b4fe;
            box-shadow: 0 4px 14px rgba(147, 51, 234, 0.08);
            transform: translateY(-2px);
        }

        .perk-icon-wrap {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 17px;
            flex-shrink: 0;
        }

        /* Recharge Console Card */
        .recharge-console-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }

        .recharge-console-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
            padding-bottom: 14px;
            border-bottom: 1px solid #f1f5f9;
        }

        .recharge-balance-pill {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            border: 1px solid #86efac;
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 18px;
        }

        /* Activity / History List */
        .wallet-activity-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            margin-top: 24px;
        }

        .activity-item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
        }

        .activity-item-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
    </style>
    <script>
        try {
            if (localStorage.getItem('chocoloom_user_session')) {
                document.documentElement.classList.add('user-logged-in');
            }
        } catch(e) {}
    </script>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

    <!-- Navigation Header -->
    <header class="navbar" id="catalogNavbar">
        <div class="container nav-inner">
            <div class="nav-left">
                <a href="<?php echo home_url('/'); ?>" class="brand-logo" title="Back to Chocoloom Store">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/logo.png" alt="Chocoloom Logo" class="brand-logo-img">
                </a>

                <a href="<?php echo home_url('/'); ?>" style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #475569; text-decoration: none; padding: 6px 12px; background: #f1f5f9; border-radius: 8px;">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Back to Cakes Menu</span>
                </a>
            </div>

            <div class="nav-right">
                <a href="<?php echo chocoloom_get_page_url('uni-chocoloom'); ?>" class="nav-item nav-item-uni" title="Uni Chocoloom - Student Store" style="text-decoration: none; color: inherit;">
                    <div class="uni-nav-glow-wrap">
                        <i class="fa-solid fa-graduation-cap uni-nav-icon"></i>
                    </div>
                    <span class="nav-text">Uni Chocoloom</span>
                    <span class="nav-uni-badge">25% OFF</span>
                </a>

                <!-- User Sign In / Profile Navigation Trigger -->
                <a href="login.html?redirect=chocowallet.html" class="nav-item-auth" id="navAuthBtn" title="Account Login & Sign Up" style="text-decoration: none;">
                    <i class="fa-regular fa-user"></i>
                    <span class="nav-text">Sign In</span>
                </a>

                <!-- Logged In User Pill & Profile Dropdown -->
                <div class="nav-user-container" id="navUserContainer" style="display: none;">
                    <div class="nav-user-pill" id="navUserPill" onclick="toggleUserProfileDropdown(event)">
                        <div class="user-avatar-circle" id="userAvatarCircle">M</div>
                        <div class="user-pill-text">
                            <span class="user-pill-greeting">Hi, <strong id="userPillName">User</strong></span>
                        </div>
                        <i class="fa-solid fa-chevron-down user-pill-chevron"></i>
                    </div>

                    <div class="user-profile-dropdown" id="userProfileDropdown">
                        <div class="user-dropdown-header">
                            <div class="dropdown-avatar" id="dropdownAvatar">M</div>
                            <div class="dropdown-info">
                                <div class="dropdown-name" id="dropdownName">Mohith Kumar</div>
                                <div class="dropdown-sub" id="dropdownSub">student@srkr.edu.in</div>
                                <span class="dropdown-badge" id="dropdownBadge"><i class="fa-solid fa-star"></i> Chocoloom VIP</span>
                            </div>
                        </div>
                        <div class="user-dropdown-divider"></div>
                        <div class="user-dropdown-menu">
                            <a href="<?php echo chocoloom_get_page_url('chocowallet'); ?>" class="user-menu-item" style="text-decoration: none; color: inherit; background: linear-gradient(135deg, #fdf4ff, #fae8ff); border: 1px solid #f0abfc; margin-bottom: 6px; border-radius: 10px;">
                                <i class="fa-solid fa-credit-card" style="color: #9333ea;"></i>
                                <span style="font-weight: 800; color: #581c87;">Chocowallet VIP Card</span>
                                <span class="menu-badge" id="dropdownWalletBadge" style="background: #f59e0b; color: #ffffff; font-weight: 900;">Coming Soon</span>
                            </a>
                            <button class="user-menu-item" onclick="openOrdersModal()"><i class="fa-solid fa-receipt"></i> <span>My Orders</span> <span class="menu-badge" id="myOrdersCountBadge">0</span></button>
                            <button class="user-menu-item" onclick="openAccountDetailsModal()"><i class="fa-solid fa-user-gear"></i> <span>Account Details</span></button>
                            <div class="user-dropdown-divider"></div>
                            <button class="user-menu-item logout" onclick="handleUserLogout()"><i class="fa-solid fa-arrow-right-from-bracket"></i> <span>Sign Out</span></button>
                        </div>
                    </div>
                </div>

                <a href="<?php echo home_url('/'); ?>" class="nav-item" style="text-decoration: none; color: inherit; background: var(--primary); color: #fff; padding: 7px 16px; border-radius: 10px; font-weight: 800; font-size: 13px;">
                    <i class="fa-solid fa-bag-shopping"></i> Order Now
                </a>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="wallet-page-wrapper" id="walletPageWrapper">

        <!-- Prominent ChocoWallet Coming Soon Announcement -->
        <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1.5px solid #fde047; border-radius: 16px; padding: 18px 24px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 4px 16px -2px rgba(245, 158, 11, 0.15);">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: #f59e0b; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                    <i class="fa-solid fa-clock"></i>
                </div>
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap;">
                        <h3 style="font-size: 16px; font-weight: 800; color: #92400e; margin: 0;">ChocoWallet & VIP Card — Coming Soon!</h3>
                        <span style="background: #f59e0b; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">Launch In Progress</span>
                    </div>
                    <p style="font-size: 13px; color: #b45309; margin: 0; line-height: 1.45;">
                        We are currently preparing ChocoWallet and contactless physical card payments. Meanwhile, online ordering via UPI and Cash on Delivery is active!
                    </p>
                </div>
            </div>
            <a href="<?php echo home_url('/'); ?>" style="background: #92400e; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 12.5px; padding: 10px 18px; border-radius: 10px; white-space: nowrap; transition: transform 0.2s;">
                Back to Menu
            </a>
        </div>

        <!-- ==================== VIEW A: UNPURCHASED (BUY PHYSICAL CARD) ==================== -->
        <div id="walletUnpurchasedView" style="display: none;">
            <!-- Hero Header -->
            <div class="wallet-hero-header">
                <div class="wallet-hero-badge">
                    <i class="fa-solid fa-crown" style="color: #eab308;"></i> CHOCOLOOM VIP MEMBERSHIP • PHYSICAL NFC & DIGITAL CARD
                </div>
                <h1 class="wallet-hero-title">Order Your Chocowallet Physical VIP Card</h1>
                <p class="wallet-hero-sub">
                    Get your custom laser-embossed physical contactless card delivered straight to your doorstep. Unlocks instant 1-click checkout, 0% payment gateway downtime, and lifetime VIP cashbacks.
                </p>
            </div>

            <!-- 2-Column Grid -->
            <div class="wallet-grid">
                <!-- Left Column: Live Interactive Card Preview & Unboxing Showcase -->
                <div>
                    <!-- 3D Card Live Preview -->
                    <div class="chocowallet-featured-card">
                        <div class="luxury-card-showcase" id="unpurchasedCardPreview" style="box-shadow: 0 25px 50px -12px rgba(59, 13, 102, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.18) inset;">
                            <div class="luxury-card-sheen"></div>
                            <div class="luxury-card-glow-orb"></div>
                            <div class="luxury-card-pattern"></div>

                            <!-- Header -->
                            <div class="luxury-card-header">
                                <div class="luxury-card-brand">
                                    <div class="luxury-card-brand-logo">🍫</div>
                                    <div class="luxury-card-brand-text">
                                        <span class="luxury-card-brand-name">CHOCOLOOM</span>
                                        <span class="luxury-card-tier-label" id="previewTierLabel">BLACK VIP PREPAID</span>
                                    </div>
                                </div>
                                <div class="luxury-card-contactless">
                                    <span class="luxury-tier-badge">👑 ELITE</span>
                                    <i class="fa-solid fa-wifi contactless-wave-icon"></i>
                                </div>
                            </div>

                            <!-- Mid: EMV Chip & Number -->
                            <div class="luxury-card-mid">
                                <div class="emv-gold-chip">
                                    <div class="emv-chip-grid"></div>
                                </div>
                                <div class="luxury-card-number-wrapper">
                                    <div class="luxury-card-number">•••• •••• •••• 8842</div>
                                </div>
                            </div>

                            <!-- Bottom Metadata -->
                            <div class="luxury-card-bottom">
                                <div class="card-meta-group">
                                    <span class="card-meta-label">CARDHOLDER (EMBOSSED)</span>
                                    <span class="card-meta-value" id="previewHolderName">MOHITH KUMAR</span>
                                </div>
                                <div class="card-meta-group" style="text-align: center;">
                                    <span class="card-meta-label">EXPIRES</span>
                                    <span class="card-meta-value" style="font-family: monospace; font-size: 11px;">12/30</span>
                                </div>
                                <div class="card-balance-highlight">
                                    <span class="card-meta-label">WELCOME BONUS</span>
                                    <span class="card-balance-amount" style="color: #facc15;">+₹250</span>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: center; font-size: 11.5px; color: #7e22ce; font-weight: 700; margin-top: 4px;">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Live Preview: Name above updates as you type below
                        </div>
                    </div>

                    <!-- Luxury Physical Unboxing Feature Box -->
                    <div class="physical-card-unboxing-box">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/physical_card_box.jpg" alt="Chocowallet Physical VIP Card in Velvet Presentation Box" class="physical-card-unboxing-img">
                        <div class="physical-unboxing-caption">
                            <div class="physical-unboxing-title">
                                <i class="fa-solid fa-box-open" style="color: #facc15;"></i>
                                <span>Luxury Velvet Unboxing Experience</span>
                                <span style="background: rgba(250, 204, 21, 0.2); color: #fde047; font-size: 10px; padding: 2px 8px; border-radius: 999px; margin-left: auto;">INCLUDED</span>
                            </div>
                            <p class="physical-unboxing-sub">
                                Delivered to your address in a high-density midnight-velvet presentation box with gold foil lettering. Includes your personalized 0.8mm RFID/NFC smart card, Chocoloom sticker collection, and ₹250 bonus credit already preloaded!
                            </p>
                        </div>
                    </div>

                    <!-- Perks Grid -->
                    <div class="wallet-perks-grid">
                        <div class="perk-card">
                            <div class="perk-icon-wrap" style="background: #fdf4ff; color: #a21caf;">
                                <i class="fa-solid fa-truck-fast"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">Free Express Shipping</h4>
                                <p style="font-size: 11.5px; color: #64748b; margin: 0;">Dispatched via BlueDart Express courier with real-time tracking.</p>
                            </div>
                        </div>

                        <div class="perk-card">
                            <div class="perk-icon-wrap" style="background: #eff6ff; color: #2563eb;">
                                <i class="fa-solid fa-bolt"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">1-Click Instant Pay</h4>
                                <p style="font-size: 11.5px; color: #64748b; margin: 0;">Instant checkout on Chocoloom without waiting for bank SMS or OTPs.</p>
                            </div>
                        </div>

                        <div class="perk-card">
                            <div class="perk-icon-wrap" style="background: #f0fdf4; color: #16a34a;">
                                <i class="fa-solid fa-wifi"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">Offline Tap-to-Pay</h4>
                                <p style="font-size: 11.5px; color: #64748b; margin: 0;">Tap your physical NFC card on counters across Chocoloom bakeries.</p>
                            </div>
                        </div>

                        <div class="perk-card">
                            <div class="perk-icon-wrap" style="background: #fffbeb; color: #d97706;">
                                <i class="fa-solid fa-gift"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">₹250 Welcome Credit</h4>
                                <p style="font-size: 11.5px; color: #64748b; margin: 0;">Immediately preloaded into your wallet upon card activation.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Card Customization & Physical Delivery Order Form -->
                <div>
                    <div class="buy-card-console-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #f1f5f9;">
                            <div>
                                <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 4px;">Order Physical VIP Card</h3>
                                <span style="font-size: 12px; color: #64748b;">Delivered right to your doorstep + Digital 1-click access</span>
                            </div>
                            <span style="background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 6px;">
                                <i class="fa-solid fa-gift"></i> ₹250 Bonus Included
                            </span>
                        </div>

                        <!-- Price Banner -->
                        <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 1.5px solid #d8b4fe; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-size: 11px; font-weight: 800; color: #7e22ce; text-transform: uppercase; display: block; margin-bottom: 2px;">One-Time Card Issuance Fee</span>
                                <div style="display: flex; align-items: baseline; gap: 8px;">
                                    <span style="font-size: 26px; font-weight: 900; color: #581c87;">₹199</span>
                                    <span style="font-size: 14px; color: #94a3b8; text-decoration: line-through;">₹499</span>
                                    <span style="background: #e9d5ff; color: #6b21a8; font-size: 10.5px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">60% OFF</span>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <span style="font-size: 11px; color: #15803d; font-weight: 800; display: block;">✓ Physical Metal Card</span>
                                <span style="font-size: 11px; color: #15803d; font-weight: 800;">✓ Free Courier Delivery</span>
                            </div>
                        </div>

                        <!-- Form -->
                        <form id="orderPhysicalCardForm" onsubmit="handleOrderPhysicalCardSubmit(event)">
                            <!-- Step 1: Embossed Name -->
                            <div style="margin-bottom: 16px;">
                                <label style="font-size: 12px; font-weight: 800; color: #334155; display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span>Cardholder Name to Emboss (Gold Laser Foil)</span>
                                    <span style="color: #9333ea; font-size: 11px;">Max 22 chars</span>
                                </label>
                                <div style="position: relative;">
                                    <i class="fa-solid fa-signature" style="position: absolute; left: 12px; top: 12px; color: #94a3b8;"></i>
                                    <input type="text" id="orderFormHolderName" maxlength="22" placeholder="e.g. MOHITH KUMAR" required oninput="updateLiveCardPreview(this.value)" style="width: 100%; padding: 10px 12px 10px 34px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                                </div>
                            </div>

                            <!-- Step 2: Card Edition -->
                            <div style="margin-bottom: 16px;">
                                <label style="font-size: 12px; font-weight: 800; color: #334155; display: block; margin-bottom: 6px;">
                                    Select Card Edition Finish
                                </label>
                                <div style="display: flex; gap: 10px;">
                                    <div class="card-edition-pill selected" id="editionPillBlack" onclick="selectCardEdition('Matte Black Titanium VIP', this)">
                                        <div style="width: 20px; height: 20px; border-radius: 50%; background: #0f172a; border: 2px solid #fff; box-shadow: 0 0 0 1px #000;"></div>
                                        <div>
                                            <div style="font-size: 12px; font-weight: 800; color: #0f172a;">Matte Black</div>
                                            <div style="font-size: 10px; color: #64748b;">Titanium Laser Foil</div>
                                        </div>
                                    </div>
                                    <div class="card-edition-pill" id="editionPillGold" onclick="selectCardEdition('Royal Cocoa Gold VIP', this)">
                                        <div style="width: 20px; height: 20px; border-radius: 50%; background: #ca8a04; border: 2px solid #fff; box-shadow: 0 0 0 1px #ca8a04;"></div>
                                        <div>
                                            <div style="font-size: 12px; font-weight: 800; color: #0f172a;">Cocoa Gold</div>
                                            <div style="font-size: 10px; color: #64748b;">Holographic Glaze</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 3: Shipping Address for Physical Delivery -->
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; font-weight: 800; color: #334155; display: block; margin-bottom: 6px;">
                                    Physical Delivery Address
                                </label>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                                    <input type="tel" id="orderFormPhone" placeholder="Mobile No. (for Courier SMS)" required style="padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-weight: 700; color: #0f172a;">
                                    <input type="text" id="orderFormCity" placeholder="City (e.g. Bhimavaram)" value="Bhimavaram" required style="padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-weight: 700; color: #0f172a;">
                                </div>
                                <input type="text" id="orderFormStreet" placeholder="Flat No. / House, Building, Street, Landmark (Bhimavaram)" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">
                                <input type="text" id="orderFormPincode" placeholder="Postal Pincode (e.g. 534204)" value="534204" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-weight: 700; color: #0f172a;">
                            </div>

                            <!-- Submit -->
                            <button type="submit" class="order-physical-submit-btn" id="orderCardSubmitBtn">
                                <span><i class="fa-solid fa-truck-fast"></i> Pay ₹199 & Order Physical Card</span>
                            </button>

                            <div style="text-align: center; margin-top: 12px; font-size: 11.5px; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <span><i class="fa-solid fa-shield-halved" style="color: #10b981;"></i> 100% Free Replacements</span>
                                <span>•</span>
                                <span><i class="fa-solid fa-box" style="color: #9333ea;"></i> BlueDart Express Delivery</span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== VIEW B: PURCHASED / ACTIVE VIP DASHBOARD ==================== -->
        <div id="walletPurchasedView" style="display: none;">
            <!-- Hero Header -->
            <div class="wallet-hero-header">
                <div class="wallet-hero-badge">
                    <i class="fa-solid fa-crown" style="color: #eab308;"></i> CHOCOLOOM ACTIVE VIP PREPAID CARD
                </div>
                <h1 class="wallet-hero-title">Chocowallet Black VIP Card</h1>
                <p class="wallet-hero-sub">
                    Your luxury physical card and instant digital wallet are active. Instant 1-click checkout, zero payment gateway downtime, and contactless in-store tap-to-pay.
                </p>
            </div>

            <!-- 2-Column Grid -->
            <div class="wallet-grid">
                <!-- Left Column: The Active 3D Luxury Card Showcase -->
                <div>
                    <div class="chocowallet-featured-card">
                        <div class="luxury-card-showcase" id="activeLuxuryCard" style="box-shadow: 0 25px 50px -12px rgba(59, 13, 102, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.18) inset;">
                            <div class="luxury-card-sheen"></div>
                            <div class="luxury-card-glow-orb"></div>
                            <div class="luxury-card-pattern"></div>

                            <!-- Header -->
                            <div class="luxury-card-header">
                                <div class="luxury-card-brand">
                                    <div class="luxury-card-brand-logo">🍫</div>
                                    <div class="luxury-card-brand-text">
                                        <span class="luxury-card-brand-name">CHOCOLOOM</span>
                                        <span class="luxury-card-tier-label" id="pageCardTierLabel">BLACK VIP PREPAID</span>
                                    </div>
                                </div>
                                <div class="luxury-card-contactless">
                                    <span class="luxury-tier-badge">👑 ELITE</span>
                                    <i class="fa-solid fa-wifi contactless-wave-icon"></i>
                                </div>
                            </div>

                            <!-- Mid: EMV Chip & Number -->
                            <div class="luxury-card-mid">
                                <div class="emv-gold-chip">
                                    <div class="emv-chip-grid"></div>
                                </div>
                                <div class="luxury-card-number-wrapper">
                                    <div class="luxury-card-number" id="pageCardNumberDisplay">•••• •••• •••• 8842</div>
                                </div>
                            </div>

                            <!-- Bottom Metadata -->
                            <div class="luxury-card-bottom">
                                <div class="card-meta-group">
                                    <span class="card-meta-label">CARDHOLDER</span>
                                    <span class="card-meta-value" id="pageCardHolderName">Mohith Kumar</span>
                                </div>
                                <div class="card-meta-group" style="text-align: center;">
                                    <span class="card-meta-label">EXPIRES</span>
                                    <span class="card-meta-value" style="font-family: monospace; font-size: 11px;">12/30</span>
                                </div>
                                <div class="card-balance-highlight">
                                    <span class="card-meta-label">AVAILABLE BALANCE</span>
                                    <span class="card-balance-amount" id="pageCardBalanceDisplay">₹250</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card Quick Actions -->
                    <div class="wallet-card-actions-bar">
                        <button class="wallet-action-btn" onclick="copyCardNumber(this)">
                            <i class="fa-regular fa-copy"></i> <span>Copy Card No.</span>
                        </button>
                        <button class="wallet-action-btn" onclick="toggleFreezeCard(this)" id="freezeCardBtn">
                            <i class="fa-solid fa-lock-open"></i> <span>Card Active</span>
                        </button>
                        <a href="<?php echo home_url('/'); ?>" class="wallet-action-btn" style="text-decoration: none; background: #0f172a; color: #fff; border-color: #0f172a;">
                            <i class="fa-solid fa-bag-shopping"></i> <span>Pay with Card</span>
                        </a>
                    </div>

                    <!-- Physical Unboxing Small Preview -->
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/physical_card_box.jpg" alt="Physical VIP Card Box" style="width: 75px; height: 55px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">
                        <div>
                            <div style="font-size: 13px; font-weight: 800; color: #0f172a;">Physical Collector's Edition</div>
                            <div style="font-size: 11.5px; color: #64748b;">Heavyweight matte black card in luxury velvet unboxing presentation kit.</div>
                        </div>
                    </div>

                    <!-- Perks Grid -->
                    <div class="wallet-perks-grid">
                        <div class="perk-card">
                            <div class="perk-icon-wrap" style="background: #fdf4ff; color: #a21caf;">
                                <i class="fa-solid fa-bolt"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">1-Click Instant Pay</h4>
                                <p style="font-size: 11.5px; color: #64748b; margin: 0;">Skip bank OTPs & payment gateway queues with instant deduction.</p>
                            </div>
                        </div>

                        <div class="perk-card">
                            <div class="perk-icon-wrap" style="background: #eff6ff; color: #2563eb;">
                                <i class="fa-solid fa-rotate-left"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">3-Sec Auto Refunds</h4>
                                <p style="font-size: 11.5px; color: #64748b; margin: 0;">Order adjustments or cancellations reflect back on your card in 3 seconds.</p>
                            </div>
                        </div>

                        <div class="perk-card">
                            <div class="perk-icon-wrap" style="background: #fdf2f8; color: #db2777;">
                                <i class="fa-solid fa-graduation-cap"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">25% Campus Discount</h4>
                                <p style="font-size: 11.5px; color: #64748b; margin: 0;">Fully compatible with Uni Chocoloom student promo codes.</p>
                            </div>
                        </div>

                        <div class="perk-card">
                            <div class="perk-icon-wrap" style="background: #f0fdf4; color: #16a34a;">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">Bank-Grade Security</h4>
                                <p style="font-size: 11.5px; color: #64748b; margin: 0;">256-bit tokenized encrypted data backed by Supabase & Neon.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Physical Card Tracker & Recharge Console -->
                <div>
                    <!-- PHYSICAL CARD DELIVERY TRACKER -->
                    <div class="physical-tracker-card" id="physicalTrackerCard">
                        <!-- On The Way Live Banner -->
                        <div class="tracker-live-alert-banner">
                            <div class="tracker-live-alert-icon">
                                <i class="fa-solid fa-truck-fast"></i>
                            </div>
                            <div class="tracker-live-alert-content" style="flex: 1;">
                                <div class="tracker-live-alert-title">YOUR CARD IS ON THE WAY • IN TRANSIT</div>
                                <div class="tracker-live-alert-sub" id="trackerOrderPlacedSub">Order placed successfully. Dispatched via BlueDart Express Air Priority.</div>
                            </div>
                            <button type="button" class="tracker-view-modal-btn" onclick="window.showCardOrderTransitModal()">
                                <i class="fa-solid fa-route"></i> Live Transit Route
                            </button>
                        </div>

                        <div class="physical-tracker-header">
                            <div>
                                <h3 style="font-size: 16px; font-weight: 900; color: #0f172a; margin: 0 0 2px;">
                                    <i class="fa-solid fa-box-open" style="color: #9333ea; margin-right: 4px;"></i> Physical VIP Card Tracker
                                </h3>
                                <span style="font-size: 11.5px; color: #64748b;" id="trackerOrderRef">Order #CL-VIP-8842 • Laser-embossed card</span>
                            </div>
                            <span class="tracker-badge-live" id="trackerLiveBadge">
                                <i class="fa-solid fa-truck-fast"></i> In Transit
                            </span>
                        </div>

                        <!-- Progress Steps with Animated Cruiser Truck -->
                        <div class="tracker-steps-container">
                            <div class="tracker-steps-line">
                                <div class="tracker-steps-line-progress" style="width: 70%; position: relative;">
                                    <span class="tracker-line-truck-marker" title="Package in transit">🚚</span>
                                </div>
                            </div>
                            <div class="tracker-steps-row">
                                <div class="tracker-step-item done">
                                    <div class="tracker-step-circle"><i class="fa-solid fa-check"></i></div>
                                    <span class="tracker-step-label">Order Placed</span>
                                </div>
                                <div class="tracker-step-item done">
                                    <div class="tracker-step-circle"><i class="fa-solid fa-check"></i></div>
                                    <span class="tracker-step-label">Laser Embossed</span>
                                </div>
                                <div class="tracker-step-item active">
                                    <div class="tracker-step-circle"><i class="fa-solid fa-truck"></i></div>
                                    <span class="tracker-step-label">Dispatched (In Transit)</span>
                                </div>
                                <div class="tracker-step-item">
                                    <div class="tracker-step-circle"><i class="fa-solid fa-house"></i></div>
                                    <span class="tracker-step-label">Delivered</span>
                                </div>
                            </div>
                        </div>

                        <!-- Delivery Details Strip -->
                        <div class="delivery-details-strip">
                            <div class="delivery-detail-row">
                                <span style="color: #64748b; font-weight: 600;">Courier Partner:</span>
                                <span style="font-weight: 800; color: #0f172a;" id="trackerCourier">BlueDart Express Air Priority</span>
                            </div>
                            <div class="delivery-detail-row">
                                <span style="color: #64748b; font-weight: 600;">Tracking Number:</span>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-weight: 800; color: #9333ea; font-family: monospace;" id="trackerCode">BD88429108IN</span>
                                    <button type="button" class="dossier-copy-btn" onclick="const code = document.getElementById('trackerCode').textContent; navigator.clipboard.writeText(code); showToast('Tracking code copied! 📋', 'fa-regular fa-copy', '#10b981');" title="Copy tracking code">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="delivery-detail-row">
                                <span style="color: #64748b; font-weight: 600;">Recipient:</span>
                                <span style="font-weight: 800; color: #0f172a;" id="trackerRecipient">Mohith Kumar</span>
                            </div>
                            <div class="delivery-detail-row">
                                <span style="color: #64748b; font-weight: 600;">Delivery Address:</span>
                                <span style="font-weight: 700; color: #0f172a; max-width: 250px; text-align: right;" id="trackerAddress">Bhimavaram, 534204</span>
                            </div>
                            <div class="delivery-detail-row">
                                <span style="color: #64748b; font-weight: 600;">Estimated Delivery:</span>
                                <span style="font-weight: 800; color: #16a34a;" id="trackerEta">Within 2-3 Business Days</span>
                            </div>
                        </div>

                        <div style="margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap;">
                            <button type="button" class="tracker-view-modal-btn" style="flex: 1; padding: 10px; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; background: #faf5ff;" onclick="window.showCardOrderTransitModal()">
                                <i class="fa-solid fa-route"></i> View Interactive Live Transit Route
                            </button>
                        </div>

                        <div style="margin-top: 12px; background: #faf5ff; border: 1px dashed #d8b4fe; border-radius: 10px; padding: 10px 12px; font-size: 11.5px; color: #6b21a8; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-wifi" style="font-size: 16px;"></i>
                            <span><strong>In-Store Tap-to-Pay:</strong> Once your physical card arrives, tap it directly on our bakery checkout POS for instant touchless payment!</span>
                        </div>
                    </div>

                    <!-- RECHARGE CONSOLE CARD -->
                    <div class="recharge-console-card">
                        <div class="recharge-console-header">
                            <div>
                                <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">Recharge Chocowallet</h3>
                                <span style="font-size: 12px; color: #64748b;">Instant top-up with zero processing fees</span>
                            </div>
                            <span style="font-size: 11px; background: #ecfdf5; color: #059669; font-weight: 800; padding: 4px 8px; border-radius: 6px;">
                                <i class="fa-solid fa-shield-halved"></i> 100% Safe
                            </span>
                        </div>

                        <div class="recharge-balance-pill">
                            <div>
                                <span style="font-size: 11px; color: #15803d; font-weight: 700; text-transform: uppercase; display: block;">Current Card Balance</span>
                                <span style="font-size: 24px; font-weight: 900; color: #166534;" id="consoleBalanceDisplay">₹250</span>
                            </div>
                            <i class="fa-solid fa-circle-check" style="font-size: 22px; color: #16a34a;"></i>
                        </div>

                        <!-- 1-Tap Quick Recharge Chips -->
                        <div style="margin-bottom: 16px;">
                            <label style="font-size: 11.5px; font-weight: 800; color: #475569; display: block; margin-bottom: 8px;">Quick 1-Tap Top-Up</label>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                                <button type="button" class="topup-chip-btn" onclick="executePageTopUp(200)" style="padding: 10px 0; font-size: 12.5px;">+ ₹200</button>
                                <button type="button" class="topup-chip-btn" onclick="executePageTopUp(500)" style="padding: 10px 0; font-size: 12.5px;">+ ₹500</button>
                                <button type="button" class="topup-chip-btn" onclick="executePageTopUp(1000)" style="padding: 10px 0; font-size: 12.5px;">+ ₹1,000</button>
                                <button type="button" class="topup-chip-btn" onclick="executePageTopUp(2000)" style="padding: 10px 0; font-size: 12.5px;">+ ₹2,000</button>
                            </div>
                        </div>

                        <!-- Custom Amount Input -->
                        <div style="margin-bottom: 20px;">
                            <label style="font-size: 11.5px; font-weight: 800; color: #475569; display: block; margin-bottom: 6px;">Or Enter Custom Amount</label>
                            <div style="display: flex; gap: 8px;">
                                <div style="position: relative; flex: 1;">
                                    <span style="position: absolute; left: 12px; top: 10px; font-weight: 800; color: #64748b;">₹</span>
                                    <input type="number" id="pageCustomRechargeInput" placeholder="e.g. 750" min="10" style="width: 100%; padding: 10px 12px 10px 28px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 14px; font-weight: 700; color: #0f172a;">
                                </div>
                                <button type="button" onclick="const v = Number(document.getElementById('pageCustomRechargeInput').value); if (v > 0) executePageTopUp(v);" style="background: linear-gradient(135deg, #9333ea, #7e22ce); color: #fff; border: none; padding: 0 20px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.35);">
                                    Add Funds
                                </button>
                            </div>
                        </div>

                        <!-- Payment Mode Supported -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; font-size: 11.5px; color: #64748b; line-height: 1.4;">
                            <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px;">Top-Up Payment Options:</div>
                            <div style="display: flex; gap: 12px; align-items: center; margin-top: 6px;">
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-brands fa-google-pay" style="color: #4285f4; font-size: 18px;"></i> GPay</span>
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-mobile-screen-button" style="color: #6366f1;"></i> PhonePe</span>
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-building-columns" style="color: #10b981;"></i> Netbanking</span>
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-regular fa-credit-card" style="color: #eab308;"></i> Cards</span>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity / History -->
                    <div class="wallet-activity-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0;">Recent Card Activity</h4>
                            <span style="font-size: 11px; color: #64748b; font-weight: 600;">Live Feed</span>
                        </div>

                        <div id="walletActivityList">
                            <!-- Injected via script -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Testing / Demo Reset Toolbar -->
        <div style="text-align: center; margin-top: 40px; padding: 14px 20px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 14px; font-size: 12px; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap;">
            <span><i class="fa-solid fa-vial"></i> <strong>Chocowallet Demo Switcher:</strong></span>
            <button type="button" onclick="const cd = window.buyChocowalletCard(); refreshPageWalletUI(); window.showCardOrderTransitModal(cd);" style="background: #9333ea; color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 11.5px; cursor: pointer;">
                ⚡ Instantly Buy & Activate Card
            </button>
            <button type="button" onclick="window.resetChocowalletCardForDemo(); refreshPageWalletUI();" style="background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 11.5px; cursor: pointer;">
                🔄 Reset to Unpurchased State
            </button>
        </div>

    </main>

    <!-- Modals -->
    <div class="modal-backdrop" id="userOrdersModalBackdrop">
        <div class="user-orders-modal" style="max-width: 600px; width: 100%; background: #fff; border-radius: 20px; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-size: 18px; font-weight: 800; margin: 0;"><i class="fa-solid fa-receipt" style="color: var(--primary);"></i> My Orders</h3>
                <button onclick="closeOrdersModal()" style="border: none; background: none; font-size: 18px; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="ordersListBody" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
    </div>

    <!-- Scripts -->
    <script>
        let selectedEdition = 'Matte Black Titanium VIP';

        function selectCardEdition(edition, pill) {
            selectedEdition = edition;
            document.querySelectorAll('.card-edition-pill').forEach(p => p.classList.remove('selected'));
            if (pill) pill.classList.add('selected');

            const tierEl = document.getElementById('previewTierLabel');
            if (tierEl) {
                tierEl.textContent = edition.includes('Gold') ? 'ROYAL GOLD PREPAID' : 'BLACK VIP PREPAID';
            }
        }

        function updateLiveCardPreview(name) {
            const previewEl = document.getElementById('previewHolderName');
            if (previewEl) {
                previewEl.textContent = (name || 'MOHITH KUMAR').trim().toUpperCase();
            }
        }

        function handleOrderPhysicalCardSubmit(e) {
            e.preventDefault();
            alert('ChocoWallet & Physical VIP Card are coming soon! Online food and cake ordering via UPI / Cash on Delivery is 100% active.');
            return;
        }

        function refreshPageWalletUI() {
            const hasCard = window.hasChocowalletCard();
            const unpurchasedView = document.getElementById('walletUnpurchasedView');
            const purchasedView = document.getElementById('walletPurchasedView');

            if (!hasCard) {
                if (unpurchasedView) unpurchasedView.style.display = 'block';
                if (purchasedView) purchasedView.style.display = 'none';

                // Pre-fill inputs with profile info if available
                const defaultHolder = (AppState.currentUser?.name || AppState.customerProfile?.name || 'Mohith Kumar').trim();
                const nameInput = document.getElementById('orderFormHolderName');
                if (nameInput && !nameInput.value) {
                    nameInput.value = defaultHolder.toUpperCase();
                    updateLiveCardPreview(defaultHolder);
                }
                const phoneInput = document.getElementById('orderFormPhone');
                if (phoneInput && !phoneInput.value) {
                    phoneInput.value = AppState.currentUser?.phone || AppState.customerProfile?.phone || '';
                }
                const cityInput = document.getElementById('orderFormCity');
                if (cityInput && !cityInput.value) {
                    cityInput.value = AppState.customerProfile?.city || 'Bhimavaram';
                }
                const streetInput = document.getElementById('orderFormStreet');
                if (streetInput && !streetInput.value) {
                    streetInput.value = AppState.customerProfile?.street || '';
                }
                const pinInput = document.getElementById('orderFormPincode');
                if (pinInput && !pinInput.value) {
                    pinInput.value = AppState.customerProfile?.pincode || '';
                }
                return;
            }

            // Purchased View is active
            if (unpurchasedView) unpurchasedView.style.display = 'none';
            if (purchasedView) purchasedView.style.display = 'block';

            const cardData = window.getChocowalletCardData() || {};
            const bal = window.getChocowalletBalance();
            const holder = cardData.cardHolderName || (AppState.currentUser?.name || AppState.customerProfile?.name || 'Mohith Kumar').trim();

            const balEl = document.getElementById('pageCardBalanceDisplay');
            if (balEl) balEl.textContent = `₹${bal}`;
            const consoleBalEl = document.getElementById('consoleBalanceDisplay');
            if (consoleBalEl) consoleBalEl.textContent = `₹${bal}`;
            const holderEl = document.getElementById('pageCardHolderName');
            if (holderEl) holderEl.textContent = holder;
            const numberEl = document.getElementById('pageCardNumberDisplay');
            if (numberEl && cardData.maskedNumber) numberEl.textContent = cardData.maskedNumber;

            // Physical Tracker Details
            const physical = cardData.physicalCard || {};
            const trackerRecipient = document.getElementById('trackerRecipient');
            if (trackerRecipient) trackerRecipient.textContent = physical.recipientName || holder;
            const trackerAddress = document.getElementById('trackerAddress');
            if (trackerAddress) trackerAddress.textContent = physical.shippingAddress || 'Bhimavaram, 534204';
            const trackerCode = document.getElementById('trackerCode');
            if (trackerCode) trackerCode.textContent = physical.trackingNumber || 'BD88429108IN';
            const trackerCourier = document.getElementById('trackerCourier');
            if (trackerCourier) trackerCourier.textContent = physical.courier || 'BlueDart Express';
            const trackerEta = document.getElementById('trackerEta');
            const trackerOrderRef = document.getElementById('trackerOrderRef');
            if (trackerOrderRef) trackerOrderRef.textContent = `Order #${cardData.orderNumber || physical.orderNumber || 'CL-VIP-8842'} • Laser-embossed card`;
            if (trackerEta) trackerEta.textContent = physical.estimatedDelivery || 'Within 2-3 Business Days';

            // Render Activity
            renderWalletActivity();
        }

        function executePageTopUp(amount) {
            window.topUpChocowallet(amount);
            refreshPageWalletUI();
            const inp = document.getElementById('pageCustomRechargeInput');
            if (inp) inp.value = '';
        }

        function copyCardNumber(btn) {
            const cardData = window.getChocowalletCardData() || {};
            const fullNum = cardData.cardNumber || '8842 4112 9081 8842';
            navigator.clipboard.writeText(fullNum).then(() => {
                showToast('Chocowallet Card Number copied to clipboard! 📋', 'fa-regular fa-copy', '#10b981');
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = `<i class="fa-solid fa-check" style="color: #10b981;"></i> <span>Copied!</span>`;
                    setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                }
            }).catch(() => {
                showToast(`Card Number: ${fullNum}`, 'fa-solid fa-credit-card', '#7c5cfc');
            });
        }

        let isCardFrozen = false;
        function toggleFreezeCard(btn) {
            isCardFrozen = !isCardFrozen;
            if (isCardFrozen) {
                showToast('Chocowallet Card locked for security. Tap again to unlock.', 'fa-solid fa-lock', '#ef4444');
                btn.innerHTML = `<i class="fa-solid fa-lock" style="color: #ef4444;"></i> <span>Locked</span>`;
                btn.style.borderColor = '#fca5a5';
            } else {
                showToast('Chocowallet Card unlocked and active! Ready to pay.', 'fa-solid fa-lock-open', '#10b981');
                btn.innerHTML = `<i class="fa-solid fa-lock-open" style="color: #10b981;"></i> <span>Active</span>`;
                btn.style.borderColor = '#86efac';
            }
        }

        function renderWalletActivity() {
            const container = document.getElementById('walletActivityList');
            if (!container) return;

            let transactions = [];
            try {
                transactions = JSON.parse(localStorage.getItem('chocoloom_wallet_transactions') || '[]');
            } catch (e) {}

            let orders = [];
            try {
                orders = JSON.parse(localStorage.getItem('chocoloom_orders_history') || '[]');
                if (typeof window.cleanDuplicateOrders === 'function') {
                    orders = window.cleanDuplicateOrders(orders);
                }
            } catch (e) {}

            const walletOrders = orders.filter(o => o.payment_method === 'Chocowallet Card');

            let rows = '';

            if (transactions.length > 0) {
                rows += transactions.slice(0, 3).map(t => `
                    <div class="activity-item-row">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${t.type === 'credit' ? '#ecfdf5' : '#fdf4ff'}; color: ${t.type === 'credit' ? '#059669' : '#9333ea'}; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                                <i class="${t.type === 'credit' ? 'fa-solid fa-gift' : 'fa-solid fa-credit-card'}"></i>
                            </div>
                            <div>
                                <div style="font-weight: 700; color: #0f172a;">${t.title}</div>
                                <div style="font-size: 11px; color: #64748b;">${t.desc || t.date}</div>
                            </div>
                        </div>
                        <span style="font-weight: 800; color: ${t.type === 'credit' ? '#16a34a' : '#0f172a'};">${t.amount > 0 ? '+' : ''}₹${Math.abs(t.amount)}</span>
                    </div>
                `).join('');
            } else {
                rows += `
                    <div class="activity-item-row">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                                <i class="fa-solid fa-gift"></i>
                            </div>
                            <div>
                                <div style="font-weight: 700; color: #0f172a;">Welcome VIP Promo Credit</div>
                                <div style="font-size: 11px; color: #64748b;">Card activation bonus</div>
                            </div>
                        </div>
                        <span style="font-weight: 800; color: #16a34a;">+ ₹250</span>
                    </div>
                `;
            }

            if (walletOrders.length > 0) {
                rows += walletOrders.slice(0, 3).map(o => `
                    <div class="activity-item-row">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: #faf5ff; color: #9333ea; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                                <i class="fa-solid fa-bag-shopping"></i>
                            </div>
                            <div>
                                <div style="font-weight: 700; color: #0f172a;">Order #${o.order_number || 'CL-Order'}</div>
                                <div style="font-size: 11px; color: #64748b;">Chocoloom Bakery & Cakes</div>
                            </div>
                        </div>
                        <span style="font-weight: 800; color: #dc2626;">- ₹${o.final_total || 0}</span>
                    </div>
                `).join('');
            }

            container.innerHTML = rows;
        }

        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(refreshPageWalletUI, 200);
        });
    </script>
<?php wp_footer(); ?>
</body>
</html>
