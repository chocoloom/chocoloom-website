<?php
/**
 * Template Name: Chocoloom Orders & Menu
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/logo.png">
    <!-- Instant Centered Plain Logo Splash Preloader CSS (Zero-delay, Plain logo, no box) -->
    <style>
        #siteLoadingSplash {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #ffffff;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 0;
            opacity: 1;
            visibility: visible;
            transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s ease;
        }
        #siteLoadingSplash.splash-hidden {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }
        .splash-plain-logo {
            width: 72px;
            height: auto;
            max-width: 80px;
            object-fit: contain;
            display: block;
            animation: splashLogoBreathe 1.5s ease-in-out infinite;
        }
        @keyframes splashLogoBreathe {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.05); opacity: 1; }
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

    <!-- Instant Centered Plain Logo Splash Screen (Plain logo only, no box) -->
    <div id="siteLoadingSplash" class="site-loading-splash">
        <img src="<?php echo get_template_directory_uri(); ?>/assets/logo.png" alt="Chocoloom" class="splash-plain-logo">
    </div>
    <header class="navbar" id="catalogNavbar">
        <div class="container nav-inner">
            <div class="nav-left">
                <a href="<?php echo home_url('/'); ?>" class="brand-logo" id="brandLogoBtn" title="Back to Chocoloom Home">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/logo.png" alt="Chocoloom Logo" class="brand-logo-img">
                </a>

                <div class="location-picker" id="locationPickerBtn" title="Change delivery location">
                    <div class="loc-icon-pill">
                        <i class="fa-solid fa-location-dot"></i>
                    </div>
                    <div class="loc-text-group">
                        <div class="loc-header-line">
                            <span class="loc-type" id="currentLocType">SRKR Campus / Amiram</span>
                            <i class="fa-solid fa-chevron-down loc-arrow"></i>
                        </div>
                        <span class="loc-name" id="currentLocName">Bhimavaram, Andhra Pradesh</span>
                    </div>
                </div>
            </div>

            <div class="nav-right">
                <div class="nav-item" id="navSearchTrigger">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span class="nav-text">Search</span>
                </div>
                <a href="<?php echo chocoloom_get_page_url('uni-chocoloom'); ?>" class="nav-item nav-item-uni" id="navOffersTrigger" title="Uni Chocoloom - Campus Store for College Students" style="text-decoration: none; color: inherit;">
                    <div class="uni-nav-glow-wrap">
                        <i class="fa-solid fa-graduation-cap uni-nav-icon"></i>
                    </div>
                    <span class="nav-text">Uni Chocoloom</span>
                    <span class="nav-uni-badge">25% OFF</span>
                </a>

                <div class="nav-item" id="navHelpTrigger">
                    <i class="fa-regular fa-circle-question"></i>
                    <span class="nav-text">Help</span>
                </div>

                <!-- User Sign In / Profile Navigation Trigger -->
                <a href="<?php echo chocoloom_get_page_url('login'); ?>?redirect=order" class="nav-item-auth" id="navAuthBtn" title="Account Login & Sign Up" style="text-decoration: none;">
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
                                <span class="menu-badge" id="dropdownWalletBadge" style="background: #f59e0b; color: #ffffff; font-weight: 800;">Coming Soon</span>
                            </a>
                            <button class="user-menu-item" onclick="openOrdersModal()"><i class="fa-solid fa-receipt"></i> <span>My Orders</span> <span class="menu-badge" id="myOrdersCountBadge">0</span></button>
                            <button class="user-menu-item" onclick="openAccountDetailsModal()"><i class="fa-solid fa-user-gear"></i> <span>Account Details</span></button>
                            <div class="user-dropdown-divider"></div>
                            <button class="user-menu-item logout" onclick="handleUserLogout()"><i class="fa-solid fa-arrow-right-from-bracket"></i> <span>Sign Out</span></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Top Full-Width Edge-to-Edge Hero Advertisement Showcase Billboard -->
    <section class="hero-ad-section full-bleed">
        <div class="hero-ad-billboard" id="heroAdWrapper">
            <div class="hero-ad-track" id="bannersContainer">
                <!-- Dynamic Full Advertisement Banners populated via JS -->
            </div>

            <!-- Fullscreen Mode Toggle Button -->
            <button class="hero-ad-fullscreen-btn" id="heroAdFullscreenBtn" onclick="toggleHeroAdFullscreen(event)" title="Toggle Fullscreen Mode" aria-label="Toggle Fullscreen">
                <i class="fa-solid fa-expand" id="heroAdFullscreenIcon"></i>
                <span class="fs-text">Full Screen</span>
            </button>

            <!-- Carousel Navigation Arrows -->
            <button class="hero-ad-arrow prev" id="heroAdPrevBtn" aria-label="Previous Offer" onclick="prevAdSlide(event)">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button class="hero-ad-arrow next" id="heroAdNextBtn" aria-label="Next Offer" onclick="nextAdSlide(event)">
                <i class="fa-solid fa-chevron-right"></i>
            </button>

            <!-- Indicator Dots -->
            <div class="hero-ad-dots" id="heroAdIndicators">
                <!-- Dynamic Dots populated via JS -->
            </div>
        </div>
    </section>

    <!-- Main Content Container -->
    <main class="container">

        <!-- "What's on your mind?" Category Slider -->
        <section class="mind-category-section">
            <div class="section-header">
                <h2 class="section-title">What's on your mind?</h2>
                <div class="carousel-nav-btns">
                    <button class="carousel-nav-btn" id="catScrollLeftBtn"><i class="fa-solid fa-arrow-left"></i></button>
                    <button class="carousel-nav-btn" id="catScrollRightBtn"><i class="fa-solid fa-arrow-right"></i></button>
                </div>
            </div>
            <div class="category-scroll-container" id="categoryScrollContainer">
                <!-- Dynamic categories loaded from data.js -->
            </div>
            <!-- Swipe for more indicator -->
            <div class="category-swipe-wrapper" id="categorySwipeWrapper" title="Swipe to explore all categories">
                <div class="category-swipe-indicator">
                    <span class="category-swipe-track">
                        <span class="category-swipe-thumb" id="categorySwipeThumb"></span>
                    </span>
                    <span class="category-swipe-text">
                        <span>Swipe for more</span>
                        <i class="fa-solid fa-arrow-right-long category-swipe-arrow"></i>
                    </span>
                </div>
            </div>
            <!-- Left-aligned bold quote caption (2 lines) -->
            <div class="mind-quote-wrapper">
                <p class="mind-quote-caption">
                    <span class="mind-quote-line">"Special person ki special cake —</span>
                    <span class="mind-quote-line">idi kada real love!"</span>
                </p>
            </div>

            <!-- Quick Add Mini Item Cards Strip (Under Quote) -->
            <div class="quote-quick-cards-wrapper" id="quoteQuickCardsWrapper">
                <div class="quote-quick-cards-track" id="quoteQuickCardsTrack">
                    <div class="quote-mini-card" onclick="window.handleQuoteCardAdd(event, 'quick_assorted_truffies')" title="Add Assorted Truffies to cart">
                        <div class="quote-mini-card-img-wrap">
                            <img src="assets/categories/truffle_cakes.webp" alt="Assorted Truffies" class="quote-mini-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1548741487-18d363dc4469?w=300&auto=format&fit=crop&q=80'">
                        </div>
                        <div class="quote-mini-card-content">
                            <h4 class="quote-mini-card-title">Assorted Truffies</h4>
                            <div class="quote-mini-card-bottom">
                                <span class="quote-mini-card-price">₹199</span>
                                <button type="button" class="quote-mini-card-btn" onclick="window.handleQuoteCardAdd(event, 'quick_assorted_truffies')">ADD +</button>
                            </div>
                        </div>
                    </div>
                    <div class="quote-mini-card" onclick="window.handleQuoteCardAdd(event, 'quick_midnight_cake')" title="Add Midnight Cake to cart">
                        <div class="quote-mini-card-img-wrap">
                            <img src="assets/categories/curated_bento_cake.jpg" alt="Midnight Cake" class="quote-mini-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop&q=80'">
                        </div>
                        <div class="quote-mini-card-content">
                            <h4 class="quote-mini-card-title">Midnight Cake</h4>
                            <div class="quote-mini-card-bottom">
                                <span class="quote-mini-card-price">₹199</span>
                                <button type="button" class="quote-mini-card-btn" onclick="window.handleQuoteCardAdd(event, 'quick_midnight_cake')">ADD +</button>
                            </div>
                        </div>
                    </div>
                    <div class="quote-mini-card" onclick="window.handleQuoteCardAdd(event, 'uni_choco_1')" title="Add Belgian Dark Silk to cart">
                        <div class="quote-mini-card-img-wrap">
                            <img src="assets/categories/chocolates.webp" alt="Belgian Dark Silk" class="quote-mini-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&auto=format&fit=crop&q=80'">
                        </div>
                        <div class="quote-mini-card-content">
                            <h4 class="quote-mini-card-title">Belgian Dark Silk</h4>
                            <div class="quote-mini-card-bottom">
                                <span class="quote-mini-card-price">₹179</span>
                                <button type="button" class="quote-mini-card-btn" onclick="window.handleQuoteCardAdd(event, 'uni_choco_1')">ADD +</button>
                            </div>
                        </div>
                    </div>
                    <div class="quote-mini-card" onclick="window.handleQuoteCardAdd(event, 'uni_choco_3')" title="Add Truffle Gift Box to cart">
                        <div class="quote-mini-card-img-wrap">
                            <img src="https://images.unsplash.com/photo-1548741487-18d363dc4469?w=300&auto=format&fit=crop&q=80" alt="Truffle Gift Box" class="quote-mini-card-img" loading="lazy">
                        </div>
                        <div class="quote-mini-card-content">
                            <h4 class="quote-mini-card-title">Truffle Gift Box</h4>
                            <div class="quote-mini-card-bottom">
                                <span class="quote-mini-card-price">₹199</span>
                                <button type="button" class="quote-mini-card-btn" onclick="window.handleQuoteCardAdd(event, 'uni_choco_3')">ADD +</button>
                            </div>
                        </div>
                    </div>
                    <div class="quote-mini-card" onclick="window.handleQuoteCardAdd(event, 'quick_choco_fudge_tub')" title="Add Choco Fudge Tub to cart">
                        <div class="quote-mini-card-img-wrap">
                            <img src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&auto=format&fit=crop&q=80" alt="Choco Fudge Tub" class="quote-mini-card-img" loading="lazy">
                        </div>
                        <div class="quote-mini-card-content">
                            <h4 class="quote-mini-card-title">Choco Fudge Tub</h4>
                            <div class="quote-mini-card-bottom">
                                <span class="quote-mini-card-price">₹199</span>
                                <button type="button" class="quote-mini-card-btn" onclick="window.handleQuoteCardAdd(event, 'quick_choco_fudge_tub')">ADD +</button>
                            </div>
                        </div>
                    </div>
                    <div class="quote-mini-card" onclick="window.handleQuoteCardAdd(event, 'quick_dutch_truffle_bento')" title="Add Dutch Truffle Bento to cart">
                        <div class="quote-mini-card-img-wrap">
                            <img src="assets/categories/bento_cakes.webp" alt="Dutch Truffle Bento" class="quote-mini-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=300&auto=format&fit=crop&q=80'">
                        </div>
                        <div class="quote-mini-card-content">
                            <h4 class="quote-mini-card-title">Dutch Truffle Bento</h4>
                            <div class="quote-mini-card-bottom">
                                <span class="quote-mini-card-price">₹199</span>
                                <button type="button" class="quote-mini-card-btn" onclick="window.handleQuoteCardAdd(event, 'quick_dutch_truffle_bento')">ADD +</button>
                            </div>
                        </div>
                    </div>
                    <div class="quote-mini-card" onclick="window.handleQuoteCardAdd(event, 'quick_black_forest_mini')" title="Add Black Forest Mini to cart">
                        <div class="quote-mini-card-img-wrap">
                            <img src="assets/categories/cooling_cake.webp" alt="Black Forest Mini" class="quote-mini-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=300&auto=format&fit=crop&q=80'">
                        </div>
                        <div class="quote-mini-card-content">
                            <h4 class="quote-mini-card-title">Black Forest Mini</h4>
                            <div class="quote-mini-card-bottom">
                                <span class="quote-mini-card-price">₹199</span>
                                <button type="button" class="quote-mini-card-btn" onclick="window.handleQuoteCardAdd(event, 'quick_black_forest_mini')">ADD +</button>
                            </div>
                        </div>
                    </div>
                    <div class="quote-mini-card" onclick="window.handleQuoteCardAdd(event, 'quick_hazelnut_praline')" title="Add Hazelnut Praline to cart">
                        <div class="quote-mini-card-img-wrap">
                            <img src="assets/categories/chocolates_box.webp" alt="Hazelnut Praline" class="quote-mini-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&auto=format&fit=crop&q=80'">
                        </div>
                        <div class="quote-mini-card-content">
                            <h4 class="quote-mini-card-title">Hazelnut Praline</h4>
                            <div class="quote-mini-card-bottom">
                                <span class="quote-mini-card-price">₹169</span>
                                <button type="button" class="quote-mini-card-btn" onclick="window.handleQuoteCardAdd(event, 'quick_hazelnut_praline')">ADD +</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ==================== BESPOKE STUDIO & CUSTOM CREATIONS ==================== -->
        <section class="bespoke-custom-section" id="bespokeCustomSection">
            <div class="bespoke-section-header">
                <div class="bespoke-pill-badge">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Bespoke Studio & Custom Creations</span>
                </div>
                <h2 class="bespoke-section-title">Design Your Custom Celebrations 🎂</h2>
                <p class="bespoke-section-subtitle">
                    Turn your vision into reality: upload reference photos from Pinterest or Instagram, build multi-step tiered cakes, or curate a luxury Chocoloom Wave Box.
                </p>
            </div>

            <div class="bespoke-cards-grid">
                <!-- 1. Share Reference Photo -->
                <div class="bespoke-card bespoke-photo-card" onclick="openPhotoReferenceModal()">
                    <div class="bespoke-card-thumb">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/categories/specialty_cakes.webp" alt="Order by Reference Photo" class="bespoke-card-img" loading="lazy">
                        <span class="bespoke-thumb-badge photo-thumb-badge"><i class="fa-solid fa-camera-retro"></i></span>
                    </div>
                    <div class="bespoke-card-info">
                        <div class="bespoke-card-badge-row">
                            <span class="bespoke-card-badge photo-badge">100% CUSTOM DESIGN</span>
                        </div>
                        <h3 class="bespoke-card-title">Order by Reference Photo</h3>
                        <div class="bespoke-sparkle-tag">
                            <i class="fa-solid fa-bolt"></i> Recreate Any Design • 12+ Flavors
                        </div>
                        <div class="bespoke-card-cta photo-cta">
                            <span>Upload Reference</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                    <div class="bespoke-card-arrow photo-arrow">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>

                <!-- 2. Customise Step Cake -->
                <div class="bespoke-card bespoke-step-card" onclick="openStepCakeModal()">
                    <div class="bespoke-card-thumb">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/categories/wedding_cakes.webp" alt="Customise Step Cake" class="bespoke-card-img" loading="lazy">
                        <span class="bespoke-thumb-badge step-thumb-badge"><i class="fa-solid fa-layer-group"></i></span>
                    </div>
                    <div class="bespoke-card-info">
                        <div class="bespoke-card-badge-row">
                            <span class="bespoke-card-badge step-badge">GRAND CELEBRATIONS</span>
                        </div>
                        <h3 class="bespoke-card-title">Customise Step Cake</h3>
                        <div class="bespoke-sparkle-tag">
                            <i class="fa-solid fa-crown"></i> 2 & 3 Step Tiered • Mix Flavors
                        </div>
                        <div class="bespoke-card-cta step-cta">
                            <span>Build Tier Cake</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                    <div class="bespoke-card-arrow step-arrow">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>

                <!-- 3. Chocoloom Wave Box -->
                <div class="bespoke-card bespoke-wave-card" onclick="openWaveBoxModal()">
                    <div class="bespoke-card-thumb">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/categories/wave_box.jpg" alt="Chocoloom Wave Box" class="bespoke-card-img" loading="lazy">
                        <span class="bespoke-thumb-badge wave-thumb-badge"><i class="fa-solid fa-box-open"></i></span>
                    </div>
                    <div class="bespoke-card-info">
                        <div class="bespoke-card-badge-row">
                            <span class="bespoke-card-badge wave-badge">SIGNATURE LUXE HAMPER</span>
                        </div>
                        <h3 class="bespoke-card-title">Chocoloom Wave Box</h3>
                        <div class="bespoke-sparkle-tag">
                            <i class="fa-solid fa-star"></i> Curate Your Box • 12 Treats
                        </div>
                        <div class="bespoke-card-cta wave-cta">
                            <span>Curate Wave Box</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                    <div class="bespoke-card-arrow wave-arrow">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        </section>

        <!-- Main Products Catalog Section (Direct on Home Page) -->
        <section class="products-catalog-section" id="productsCatalogSection">
            <div class="section-header catalog-header">
                <div class="catalog-header-text">
                    <button type="button" class="category-back-nav-btn" id="categoryBackNavBtn" onclick="resetCategoryFilter()" style="display: none;" title="Back to All Menu">
                        <i class="fa-solid fa-arrow-left"></i>
                        <span>All Menu</span>
                    </button>
                    <h2 class="section-title" id="catalogSectionTitle">Artisan Cakes & Sweet Delights</h2>
                    <p class="section-subtitle" id="catalogItemCountSubtitle">Showing all handcrafted cakes & desserts</p>
                </div>
            </div>



            <!-- Direct Home Page Products Grid -->
            <div class="direct-products-grid" id="productsGrid">
                <!-- 80 Dynamic Product Cards with Direct ADD-to-cart buttons -->
            </div>

        </section>
    </main>

    <!-- ==================== CHOCOLOOM TAMBOLA - BINGO GAME ARENA ==================== -->
    <!-- ==================== CHOCOLOOM GAME ZONE PLAY ARENA ==================== -->
    <!-- ==================== CHOCOLOOM GAME ZONE PLAY ARENA ==================== -->
    <div id="gameZoneMainSection" class="gamezone-main-section tambola-white-theme" style="display: none;">
        
        <!-- 1. Sleek Compact Game Zone Top Header -->
        <section class="gamezone-top-header">
            <div class="container">
                <div class="gamezone-header-card">
                    <div class="gamezone-header-info">
                        <div class="gamezone-header-badge-row">
                            <span class="gamezone-pill-live"><span class="pulse-dot"></span> LIVE PLAY ARENA</span>
                            <span class="gamezone-pill-tag"><i class="fa-solid fa-cake-candles"></i> WIN FRESH CAKES</span>
                        </div>
                        <h1 class="gamezone-header-title">Game Zone 🎮</h1>
                        <p class="gamezone-header-sub">Play dessert challenges, spin the daily wheel, join nightly 8 PM Tambola &amp; win luxury cakes!</p>
                    </div>
                    <div class="gamezone-header-stats">
                        <div class="gamezone-quick-chip coins" onclick="claimDailyCoinBonus()" title="Tap to Claim Coins">
                            <i class="fa-solid fa-coins"></i>
                            <div>
                                <span class="chip-val" id="gameZoneWalletCoins">250 ⭐</span>
                                <span class="chip-lbl">Choco-Coins</span>
                            </div>
                        </div>
                        <div class="gamezone-quick-chip tambola" onclick="filterGameZoneCategory('tombola')" title="Live Tambola 8:00 PM">
                            <i class="fa-solid fa-ticket"></i>
                            <div>
                                <span class="chip-val" id="tambolaLiveCountdown">8:00 PM</span>
                                <span class="chip-lbl">Live Tambola</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 2. Game Zone Categories Scroll Bar -->
        <section class="gamezone-categories-section">
            <div class="container">
                <div class="game-category-scroll-wrapper">
                    <button type="button" class="cat-nav-btn prev" onclick="scrollGameZoneCategories(-1)" title="Scroll Left"><i class="fa-solid fa-chevron-left"></i></button>
                    <div class="game-category-pills" id="gameZoneCategoryPills">
                        <button type="button" class="game-filter-pill active" onclick="filterGameZoneCategory('all', this)">
                            <i class="fa-solid fa-border-all"></i> All Games (3)
                        </button>
                        <button type="button" class="game-filter-pill highlight-pill" onclick="filterGameZoneCategory('tombola', this)">
                            <i class="fa-solid fa-ticket"></i> Tambola - Bingo 🎟️
                        </button>
                        <button type="button" class="game-filter-pill" onclick="filterGameZoneCategory('lucky_number', this)">
                            <i class="fa-solid fa-clover"></i> Lucky Number Draw 🍀
                        </button>
                        <button type="button" class="game-filter-pill" onclick="filterGameZoneCategory('diwali_draw', this)">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Diwali Draw Game 🪔
                        </button>
                    </div>
                    <button type="button" class="cat-nav-btn next" onclick="scrollGameZoneCategories(1)" title="Scroll Right"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>
        </section>

        <!-- 3. Primary Playable Games Cards Grid (Visible Immediately Above The Fold) -->
        <section class="products-catalog-section" id="gameZoneCardsSection" style="padding: 16px 0 32px;">
            <div class="container">
                <div class="direct-products-grid" id="gameZoneCardsGrid">
                    <!-- Populated via renderGameZoneContent() in app.js with 8 playable games -->
                </div>
            </div>
        </section>

        <!-- 4. Interactive Tambola - Bingo Arena (Shows when Tambola category is selected or opened) -->
        <div id="tambolaCategoryView" style="display: none;">
            <div class="container tambola-main-container">

                <!-- "How to Play Tambola - Bingo" in 3 Steps -->
                <section class="bespoke-custom-section tambola-steps-section">
                    <div class="bespoke-section-header">
                        <h2 class="bespoke-section-title">Tambola - Bingo: How to Play &amp; Win 🎂</h2>
                        <p class="bespoke-section-subtitle">
                            Tambola (Indian Housie / Bingo) is 100% free for all Chocoloom customers and college students.
                        </p>
                    </div>

                    <div class="bespoke-cards-grid">
                        <!-- Step 1 -->
                        <div class="bespoke-card bespoke-photo-card" onclick="scrollToTambolaTicket()" style="cursor: pointer;">
                            <div class="bespoke-card-thumb" style="background: #f5f3ff; display: flex; align-items: center; justify-content: center;">
                                <img src="<?php echo get_template_directory_uri(); ?>/assets/tombola-banner.png" alt="Free Tambola Ticket" class="bespoke-card-img" loading="lazy">
                                <span class="bespoke-thumb-badge photo-thumb-badge"><i class="fa-solid fa-1"></i></span>
                            </div>
                            <div class="bespoke-card-info">
                                <div class="bespoke-card-badge-row">
                                    <span class="bespoke-card-badge photo-badge">STEP 1 • 100% FREE</span>
                                </div>
                                <h3 class="bespoke-card-title">Get Your Digital Ticket</h3>
                                <div class="bespoke-sparkle-tag">
                                    <i class="fa-solid fa-ticket"></i> Verified 3×9 Ticket • Unique Serial
                                </div>
                            </div>
                            <div class="bespoke-card-arrow photo-arrow">
                                <i class="fa-solid fa-arrow-right"></i>
                            </div>
                        </div>

                        <!-- Step 2 -->
                        <div class="bespoke-card bespoke-step-card" onclick="scrollToTambolaTicket()" style="cursor: pointer;">
                            <div class="bespoke-card-thumb" style="background: #fdf4ff; display: flex; align-items: center; justify-content: center;">
                                <img src="<?php echo get_template_directory_uri(); ?>/assets/tombola-wide-banner.png" alt="Live Tambola Draw" class="bespoke-card-img" loading="lazy">
                                <span class="bespoke-thumb-badge step-thumb-badge"><i class="fa-solid fa-2"></i></span>
                            </div>
                            <div class="bespoke-card-info">
                                <div class="bespoke-card-badge-row">
                                    <span class="bespoke-card-badge step-badge">STEP 2 • LIVE 8:00 PM</span>
                                </div>
                                <h3 class="bespoke-card-title">Match Numbers Live</h3>
                                <div class="bespoke-sparkle-tag">
                                    <i class="fa-solid fa-bullhorn"></i> Numbers Called Live • Tap to Mark
                                </div>
                            </div>
                            <div class="bespoke-card-arrow step-arrow">
                                <i class="fa-solid fa-arrow-right"></i>
                            </div>
                        </div>

                        <!-- Step 3 -->
                        <div class="bespoke-card bespoke-wave-card" onclick="scrollToTambolaTicket()" style="cursor: pointer;">
                            <div class="bespoke-card-thumb" style="background: #eff6ff; display: flex; align-items: center; justify-content: center;">
                                <img src="<?php echo get_template_directory_uri(); ?>/assets/categories/curated_gift_hamper.jpg" alt="Win Cakes &amp; Hampers" class="bespoke-card-img" loading="lazy">
                                <span class="bespoke-thumb-badge wave-thumb-badge"><i class="fa-solid fa-3"></i></span>
                            </div>
                            <div class="bespoke-card-info">
                                <div class="bespoke-card-badge-row">
                                    <span class="bespoke-card-badge wave-badge">STEP 3 • WIN PRIZES</span>
                                </div>
                                <h3 class="bespoke-card-title">Claim Fresh Cakes</h3>
                                <div class="bespoke-sparkle-tag">
                                    <i class="fa-solid fa-crown"></i> 1kg Truffle Cakes, Bento &amp; Vouchers
                                </div>
                            </div>
                            <div class="bespoke-card-arrow wave-arrow">
                                <i class="fa-solid fa-arrow-right"></i>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Interactive Live Ticket & Prize Arena Grid -->
                <section class="products-catalog-section tambola-arena-section" id="tambolaArenaSection">
                    <div class="section-header catalog-header">
                        <div class="catalog-header-text">
                            <h2 class="section-title">Your Live Tambola Ticket &amp; Prize Board 🎟️</h2>
                            <p class="section-subtitle">Tap numbers on your ticket to mark them as called • Verified digital slip for tonight's 8 PM draw</p>
                        </div>
                        <div class="catalog-header-actions">
                            <button type="button" class="catalog-shuffle-btn" onclick="generateNewLuckyTambolaTicket()" title="Generate New Lucky Ticket Numbers">
                                <i class="fa-solid fa-dice"></i>
                                <span>New Lucky Numbers</span>
                            </button>
                        </div>
                    </div>

                    <div class="tambola-interactive-grid">
                        <!-- Left: Interactive Digital Ticket Card -->
                        <div class="tambola-ticket-interactive-card" id="tambolaTicketCard">
                            <div class="tambola-ticket-top-bar">
                                <div class="ticket-brand-badge">
                                    <img src="<?php echo get_template_directory_uri(); ?>/assets/logo.png" alt="Chocoloom Logo" class="ticket-logo-small">
                                    <div>
                                        <h4 class="ticket-brand-name">Chocoloom Community Tambola</h4>
                                        <span class="ticket-serial-tag" id="ticketSerialDisplay">TICKET #CL-89241 • 8:00 PM LIVE DRAW</span>
                                    </div>
                                </div>
                                <span class="ticket-verified-chip"><i class="fa-solid fa-circle-check"></i> VERIFIED ENTRY</span>
                            </div>

                            <!-- 3x9 Ticket Grid -->
                            <div class="tambola-board-wrapper">
                                <div class="tambola-numbers-grid" id="mainTambolaTicketGrid">
                                    <!-- 27 interactive cells generated via JS -->
                                </div>
                            </div>

                            <div class="tambola-ticket-footer">
                                <div class="ticket-hint-text">
                                    <i class="fa-solid fa-hand-pointer"></i> Tap any number on your ticket to dab / mark it!
                                </div>
                                <div class="ticket-actions">
                                    <button type="button" class="ticket-btn secondary" onclick="resetTicketMarks()">
                                        <i class="fa-solid fa-eraser"></i> Clear Marks
                                    </button>
                                    <button type="button" class="ticket-btn primary" onclick="saveTambolaTicketReminder()">
                                        <i class="fa-solid fa-bell"></i> Set 8 PM Reminder
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Live Prize Distribution & Claim Rules Card -->
                        <div class="tambola-prizes-card" id="tambolaPrizesCard">
                            <div class="prizes-card-header">
                                <h3 class="prizes-title"><i class="fa-solid fa-award" style="color: #7c5cfc;"></i> Tonight's Winning Prizes</h3>
                                <span class="prizes-badge">5 REWARDS</span>
                            </div>

                            <div class="prizes-list">
                                <!-- Prize 1: Early Five -->
                                <div class="prize-row-item">
                                    <div class="prize-rank-pill">1</div>
                                    <div class="prize-info">
                                        <div class="prize-name">Early Five (Any 5 Numbers)</div>
                                        <div class="prize-reward"><i class="fa-solid fa-cake-candles" style="color: #7c5cfc;"></i> Complimentary Chocoloom Bento Cake</div>
                                    </div>
                                    <span class="prize-status-chip">1 Winner</span>
                                </div>

                                <!-- Prize 2: Top Line -->
                                <div class="prize-row-item">
                                    <div class="prize-rank-pill">2</div>
                                    <div class="prize-info">
                                        <div class="prize-name">Top Line (All 5 in Row 1)</div>
                                        <div class="prize-reward"><i class="fa-solid fa-gift" style="color: #7c5cfc;"></i> ₹200 Chocoloom Bakery Cash Voucher</div>
                                    </div>
                                    <span class="prize-status-chip">1 Winner</span>
                                </div>

                                <!-- Prize 3: Middle Line -->
                                <div class="prize-row-item">
                                    <div class="prize-rank-pill">3</div>
                                    <div class="prize-info">
                                        <div class="prize-name">Middle Line (All 5 in Row 2)</div>
                                        <div class="prize-reward"><i class="fa-solid fa-cookie" style="color: #7c5cfc;"></i> Box of 4 Belgian Truffle Brownies</div>
                                    </div>
                                    <span class="prize-status-chip">1 Winner</span>
                                </div>

                                <!-- Prize 4: Bottom Line -->
                                <div class="prize-row-item">
                                    <div class="prize-rank-pill">4</div>
                                    <div class="prize-info">
                                        <div class="prize-name">Bottom Line (All 5 in Row 3)</div>
                                        <div class="prize-reward"><i class="fa-solid fa-bars" style="color: #7c5cfc;"></i> 70% Dark Cocoa Artisan Chocolate Slab</div>
                                    </div>
                                    <span class="prize-status-chip">1 Winner</span>
                                </div>

                                <!-- Prize 5: Full House -->
                                <div class="prize-row-item grand-prize">
                                    <div class="prize-rank-pill grand">🏆</div>
                                    <div class="prize-info">
                                        <div class="prize-name grand">FULL HOUSE (All 15 Numbers)</div>
                                        <div class="prize-reward grand"><i class="fa-solid fa-crown" style="color: #f59e0b;"></i> 1kg Signature Dutch Truffle Celebration Cake</div>
                                    </div>
                                    <span class="prize-status-chip grand">GRAND PRIZE</span>
                                </div>
                            </div>

                            <!-- Practice Caller Box -->
                            <div class="practice-caller-box">
                                <div class="practice-caller-header">
                                    <div>
                                        <strong style="color: #0f172a; font-size: 14px;">Live Number Caller Preview</strong>
                                        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">Practice matching numbers before 8:00 PM</p>
                                    </div>
                                    <button type="button" class="caller-draw-btn" id="practiceCallerBtn" onclick="drawPracticeNumber()">
                                        <i class="fa-solid fa-dice"></i> Call Number
                                    </button>
                                </div>
                                <div class="practice-current-number-display">
                                    <span class="caller-num-bubble" id="lastCalledNumberBubble">?</span>
                                    <div class="caller-recent-calls">
                                        <span class="recent-lbl">Recently Called:</span>
                                        <div class="recent-nums-wrap" id="recentNumbersWrap">
                                            <span class="empty-hint">Click "Call Number" to test!</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

    </div>

    <!-- Floating Sticky Cart Preview Bar -->
    <div class="floating-cart-bar" id="floatingCartBar" onclick="openCart()">
        <div>
            <div style="font-weight: 800; font-size: 15px;" id="floatingItemCount">0 Items</div>
            <div style="font-size: 12px; opacity: 0.9;" id="floatingItemTotal">View cart to checkout</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 800;">
            <span>VIEW CART</span>
            <i class="fa-solid fa-arrow-right"></i>
        </div>
    </div>

    <!-- Restaurant Menu Modal / Overlay -->
    <div class="modal-backdrop" id="menuModalBackdrop">
        <div class="menu-modal-container">
            <div class="menu-header">
                <div>
                    <h2 id="modalRestName" style="font-size: 22px; font-weight: 800; margin-bottom: 4px;">Restaurant Name</h2>
                    <div id="modalRestCuisines" style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">Cuisines</div>
                    <div style="display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 700;">
                        <span class="rating-badge" id="modalRestRating"><i class="fa-solid fa-star"></i> 4.5</span>
                        <span id="modalRestTime"><i class="fa-regular fa-clock"></i> 25 mins</span>
                        <span id="modalRestCost">₹400 for two</span>
                    </div>
                </div>
                <button class="modal-close-btn" id="closeMenuModalBtn">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="menu-body" id="menuDishesContainer">
                <!-- Menu Dishes dynamically generated -->
            </div>
        </div>
    </div>

    <!-- Location Selector Modal -->
    <div class="modal-backdrop" id="locationModalBackdrop">
        <div class="menu-modal-container" style="max-width: 500px; height: auto; max-height: 85vh;">
            <div class="menu-header">
                <h3 style="font-size: 18px; font-weight: 800;">Select Delivery Location</h3>
                <button class="modal-close-btn" id="closeLocationModalBtn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="padding: 20px;">
                <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #a7f3d0; border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-shield-halved" style="color: #059669; font-size: 16px;"></i>
                    <div style="font-size: 12px; color: #065f46; font-weight: 700; line-height: 1.4;">
                        Delivering exclusively in <strong>Bhimavaram & surroundings</strong> (SRKR, Vishnu, DNR & nearby within 8 km).
                    </div>
                </div>

                <!-- Locate using GPS Button -->
                <button class="use-gps-btn" id="useGpsLocationBtn" onclick="detectGPSLocation()">
                    <div class="gps-btn-icon">
                        <i class="fa-solid fa-crosshairs"></i>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-weight: 800; font-size: 14px; color: var(--primary);">Use Current Location</div>
                        <div style="font-size: 12px; color: var(--text-muted);">Using GPS for precise delivery address</div>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color: var(--primary); margin-left: auto;"></i>
                </button>

                <div class="location-divider-text"><span>OR SEARCH BHIMAVARAM AREA</span></div>

                <div style="margin-bottom: 16px;">
                    <input type="text" id="locationSearchInput" placeholder="Search Bhimavaram area, campus, or landmark..." style="width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 14px;">
                </div>
                <div id="locationsList" style="display: flex; flex-direction: column; gap: 10px;">
                    <!-- Locations populated via JS -->
                </div>
            </div>
        </div>
    </div>

    <!-- Dedicated Modern Search Page Overlay -->
    <div class="search-page-overlay" id="searchPageOverlay">
        <div class="search-page-container">
            <!-- Search Top Bar -->
            <div class="search-page-header">
                <button class="search-back-btn" id="searchPageBackBtn" onclick="closeSearchPage()" title="Back to menu">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="search-page-input-wrap">
                    <i class="fa-solid fa-magnifying-glass search-page-icon"></i>
                    <input type="text" id="searchPageInput" placeholder="Search for cakes, chocolate truffles, bento..." autocomplete="off">
                    <button class="search-page-clear-btn" id="searchPageClearBtn" onclick="clearSearchPageInput()" title="Clear">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </button>
                </div>
                <button class="search-filter-toggle-btn" id="searchVegToggleBtn" onclick="toggleSearchVegFilter()">
                    <span>🌱</span> <span class="veg-text">Veg Only</span>
                </button>
            </div>

            <!-- Search Content Area -->
            <div class="search-page-body" id="searchPageBody">
                <!-- Initial State: Suggestions & Trending -->
                <div class="search-suggestions-view" id="searchSuggestionsView">
                    <!-- Trending Searches -->
                    <div class="search-section-block">
                        <div class="search-section-title">
                            <i class="fa-solid fa-fire-flame-curved" style="color: #f97316;"></i>
                            <span>Trending Searches</span>
                        </div>
                        <div class="search-trending-tags" id="searchTrendingTags">
                            <!-- Populated dynamically via JS -->
                        </div>
                    </div>

                    <!-- Popular Categories -->
                    <div class="search-section-block">
                        <div class="search-section-title">
                            <i class="fa-solid fa-layer-group" style="color: var(--primary);"></i>
                            <span>Popular Categories</span>
                        </div>
                        <div class="search-popular-cats-grid" id="searchPopularCatsGrid">
                            <!-- Category tiles populated dynamically via JS -->
                        </div>
                    </div>

                    <!-- Bestselling Delights Showcase -->
                    <div class="search-section-block">
                        <div class="search-section-title">
                            <i class="fa-solid fa-crown" style="color: #eab308;"></i>
                            <span>Top Delights & Bestsellers</span>
                        </div>
                        <div class="search-bestsellers-grid" id="searchBestsellersGrid">
                            <!-- Curated bestselling product cards with direct ADD -->
                        </div>
                    </div>
                </div>

                <!-- Dynamic Live Results View -->
                <div class="search-results-view" id="searchResultsView" style="display: none;">
                    <div class="search-results-header">
                        <div class="search-results-count" id="searchResultsCount">Found 0 items</div>
                        <div class="search-results-pills" id="searchResultsCategoryPills"></div>
                    </div>
                    <div class="search-results-grid" id="searchResultsGrid">
                        <!-- Dynamic matching cards populated via JS -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ==================== UNI CHOCOLOOM CAMPUS STORE MODAL ==================== -->
    <div class="modal-backdrop" id="studentOfferModalBackdrop">
        <div class="menu-modal-container uni-chocoloom-modal" id="uniChocoloomModalContainer">
            <!-- Modal Header / Hero Banner -->
            <div class="uni-modal-hero">
                <button class="modal-close-btn uni-close-btn" id="closeStudentModalBtn" onclick="closeStudentOfferModal()" aria-label="Close Uni Chocoloom">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="uni-hero-content">
                    <div class="uni-hero-badge-row">
                        <span class="uni-cap-pill"><i class="fa-solid fa-graduation-cap"></i> UNI CHOCOLOOM</span>
                        <span class="uni-discount-pill">FLAT 25% OFF FOR STUDENTS</span>
                    </div>
                    <h2 class="uni-hero-title">Campus Hub & Student Store 🎓⚡</h2>
                    <p class="uni-hero-sub">
                        Order late night study munchies, birthday cakes, chocolates & desserts delivered hot & fresh to your campus or hostel in 20 mins!
                    </p>

                    <!-- Campus Delivery & Promo Pill Bar -->
                    <div class="uni-perks-bar">
                        <div class="uni-perk-item" title="SRKR Student Discount">
                            <i class="fa-solid fa-graduation-cap" style="color: #4ade80;"></i>
                            <span class="uni-perk-code" style="color: #ffffff; font-weight: 800;">Flat 25% Student Discount</span>
                            <span class="uni-copy-hint" style="color: #4ade80;"><i class="fa-solid fa-check"></i> Auto-Applied</span>
                        </div>
                        <div class="uni-perk-pill">
                            <i class="fa-solid fa-bolt" style="color: #fbbf24;"></i>
                            <span>20-Min Campus Delivery</span>
                        </div>
                        <div class="uni-perk-pill">
                            <i class="fa-solid fa-wallet" style="color: #4ade80;"></i>
                            <span>Pocket-Friendly Student Rates</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Search & Category Filter Tabs -->
            <div class="uni-modal-toolbar">
                <div class="uni-category-tabs" id="uniCategoryTabs">
                    <button class="uni-tab-btn active" onclick="filterUniModalCategory('all', this)">
                        <span>🌟 All Favorites</span>
                    </button>
                    <button class="uni-tab-btn" onclick="filterUniModalCategory('Chocolates', this)">
                        <span>🍫 Chocolates</span>
                    </button>
                    <button class="uni-tab-btn" onclick="filterUniModalCategory('Cakes', this)">
                        <span>🎂 Cakes</span>
                    </button>
                    <button class="uni-tab-btn" onclick="filterUniModalCategory('Desserts', this)">
                        <span>🍮 Desserts</span>
                    </button>
                    <button class="uni-tab-btn" onclick="filterUniModalCategory('Snacks', this)">
                        <span>🍿 Snacks</span>
                    </button>
                    <button class="uni-tab-btn" onclick="filterUniModalCategory('Combos', this)">
                        <span>🎁 Combos</span>
                    </button>
                </div>

                <div class="uni-search-wrap">
                    <i class="fa-solid fa-magnifying-glass uni-search-icon"></i>
                    <input type="text" id="uniModalSearchInput" placeholder="Search student chocolates, cakes, snacks..." oninput="handleUniModalSearch(this.value)">
                </div>
            </div>

            <!-- Scrollable Products Grid inside Modal -->
            <div class="uni-modal-body" id="uniModalBody">
                <div class="uni-products-grid" id="uniProductsGrid">
                    <!-- Populated dynamically via JS -->
                </div>
            </div>

            <!-- Sticky Bottom Checkout Bar -->
            <div class="uni-modal-footer" id="uniModalFooter">
                <div class="uni-footer-info">
                    <div class="uni-footer-cart-text" id="uniFooterCartText">
                        <i class="fa-solid fa-bag-shopping" style="color: var(--primary);"></i>
                        <span id="uniFooterCount">0 Items</span> • <span id="uniFooterPrice" style="font-weight: 800; color: #0f172a;">₹0</span>
                        <span class="uni-coupon-tag">25% OFF Active</span>
                    </div>
                    <div style="font-size: 11px; color: #64748b;">Show student ID on delivery</div>
                </div>
                <div class="uni-footer-actions">
                    <button class="uni-secondary-btn" onclick="closeStudentOfferModal(); filterMainCatalogByUni();">
                        <span>Browse in Main Catalog</span>
                    </button>
                    <button class="uni-primary-order-btn" onclick="openCartFromUniModal()">
                        <span>VIEW CART & CHECKOUT</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- ==================== TOMBOLA COMMUNITY LUCKY DRAW & GAME MODAL ==================== -->
    <div class="modal-backdrop tombola-modal-backdrop" id="tombolaModalBackdrop" onclick="if(event.target === this) closeTombolaGameModal();">
        <div class="tombola-coming-soon-card" onclick="event.stopPropagation()">
            <button class="modal-close-btn" onclick="closeTombolaGameModal()" aria-label="Close Tombola" style="position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,0.12); color: #fff; width: 34px; height: 34px; border-radius: 50%; border: none; font-size: 14px; cursor: pointer;">
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
                We are currently crafting Chocoloom's lucky draw experience! Every prize will be a guaranteed winner with free artisan desserts, chocolates & up to 50% discount codes. Stay tuned!
            </p>
            <div class="coming-soon-perks-list">
                <div class="coming-soon-perk-item"><i class="fa-solid fa-ticket"></i> Only £1 / ₹50 a strip</div>
                <div class="coming-soon-perk-item"><i class="fa-solid fa-award"></i> Every single prize a guaranteed winner!</div>
                <div class="coming-soon-perk-item"><i class="fa-solid fa-gift"></i> Win free Belgian desserts & celebration cakes</div>
            </div>
            <div class="coming-soon-btn-group">
                <button type="button" class="btn-coming-soon-preview" onclick="closeTombolaGameModal(); if(typeof scrollToOrderingCatalog === 'function') scrollToOrderingCatalog();">
                    <i class="fa-solid fa-cake-candles"></i> Explore Delicious Desserts
                </button>
                <button type="button" class="btn-coming-soon-close" onclick="closeTombolaGameModal()">
                    Got it, Can't Wait!
                </button>
            </div>
        </div>
    </div>

    <!-- Cart Slide-Out Drawer -->
    <div class="cart-drawer-overlay" id="cartOverlay" onclick="closeCart()"></div>
    <div class="cart-drawer" id="cartDrawer">
        <div class="cart-header">
            <div class="cart-title">
                <div class="cart-title-icon-wrap">
                    <i class="fa-solid fa-bag-shopping"></i>
                </div>
                <span>Your Food Cart</span>
                <span class="cart-header-badge" id="cartHeaderBadge">0 items</span>
            </div>
            <button class="modal-close-btn" id="closeCartBtn" onclick="closeCart()" aria-label="Close Cart">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <!-- Cart User Auth Status Banner -->
        <div class="cart-auth-prompt" id="cartAuthPrompt" onclick="redirectToLoginPage('cart')">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-user-lock" style="color: var(--primary); font-size: 14px;"></i>
                <div style="display: flex; flex-direction: column; text-align: left;">
                    <span style="font-size: 11.5px; font-weight: 800; color: #1e293b;">Sign in to proceed to buy</span>
                    <span style="font-size: 10.5px; color: #64748b;">Sign in is required to checkout & place orders</span>
                </div>
            </div>
            <button class="auth-prompt-btn" type="button" onclick="redirectToLoginPage('cart')">Sign In</button>
        </div>
        <div class="cart-auth-logged" id="cartAuthLogged" style="display: none;">
            <i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 13px;"></i>
            <span>Ordering as <strong id="cartLoggedUserName">User</strong> (<span id="cartLoggedUserRole">Member</span>)</span>
        </div>

        <div class="cart-body" id="cartBodyContent">
            <!-- Items or Empty Cart State -->
        </div>

        <div class="cart-footer" id="cartFooter" style="display: none;">
            <button class="checkout-btn" id="proceedToPayBtn">
                <span>PROCEED TO PAY</span>
                <span id="cartCheckoutTotal">₹0</span>
            </button>
        </div>
    </div>

    <!-- Cake Customization Modal (Weight & Cooling Selection) -->
    <div class="modal-backdrop" id="cakeCustomizationModalBackdrop">
        <div class="customization-modal-container">
            <div class="customization-modal-header">
                <h3><i class="fa-solid fa-cake-candles" style="color: var(--primary);"></i> Customize Cake</h3>
                <button class="modal-close-btn" onclick="closeCustomizationModal()" title="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="customization-modal-body" id="customizationModalBody">
                <!-- Dynamically populated via app.js -->
            </div>

            <div class="customization-modal-footer">
                <div class="custom-total-preview">
                    <span class="custom-total-label">Total Price</span>
                    <span class="custom-total-amount" id="customModalTotalPrice">₹0</span>
                </div>
                <button class="custom-add-btn" id="customModalAddBtn" onclick="confirmAddCustomizedItem()">
                    <i class="fa-solid fa-cart-plus"></i>
                    <span id="customModalAddBtnText">ADD ITEM</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Order Placed Success Confirmation Modal -->
    <div class="modal-backdrop" id="trackingModalBackdrop">
        <div class="tracking-card" style="max-width: 480px; text-align: center; padding: 28px 24px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);">
            <button class="modal-close-btn" id="closeTrackingModalBtn" style="position: absolute; top: 16px; right: 16px;" onclick="closeOrderSuccessModal()">
                <i class="fa-solid fa-xmark"></i>
            </button>

            <!-- Success Icon -->
            <div style="width: 68px; height: 68px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 4px solid #d1fae5;">
                <i class="fa-solid fa-check" style="color: #10b981; font-size: 30px;"></i>
            </div>

            <div class="track-header" style="margin-bottom: 18px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                    <span id="trackOrderNumBadge" style="font-size: 12px; font-weight: 800; background: rgba(124, 92, 252, 0.1); color: var(--primary); padding: 4px 14px; border-radius: var(--radius-full); border: 1px solid rgba(124, 92, 252, 0.25);">Order #CL-...</span>
                </div>
                <h3 class="track-status-title" id="trackStatusTitle" style="font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 6px;">Order Placed Successfully! 🎉</h3>
                <p class="track-subtext" id="trackSubtext" style="font-size: 13px; color: var(--text-muted); margin-bottom: 0;">Thank you for your order. Our master bakers are freshly crafting your delicious treats.</p>
            </div>

            <!-- Order Details Summary Card -->
            <div id="orderSuccessDetailsCard" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 700; color: #475569;">Order Status</span>
                    <span style="font-size: 11px; background: #ecfdf5; color: #059669; font-weight: 700; padding: 2px 8px; border-radius: 4px;"><i class="fa-solid fa-circle-check"></i> Confirmed & Saved</span>
                </div>
            </div>

            <!-- Continue Shopping Button -->
            <button onclick="closeOrderSuccessModal()" style="width: 100%; background: var(--primary); color: #fff; border: none; padding: 13px 20px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(124, 92, 252, 0.3);">
                <i class="fa-solid fa-bag-shopping"></i> Continue Shopping
            </button>
        </div>
    </div>

    <!-- User Login & Signup Modal -->
    <div class="modal-backdrop" id="authModalBackdrop">
        <div class="auth-modal-card">
            <!-- Header -->
            <div class="auth-header">
                <button class="auth-close-btn" onclick="closeAuthModal()" title="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="auth-header-brand">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/logo-white.png" alt="Chocoloom Logo" class="auth-header-logo">
                </div>
                <h3 class="auth-header-title" id="authModalTitle">Welcome to Chocoloom</h3>
                <p class="auth-header-sub" id="authModalSub">Login or create an account for express checkout & exclusive student deals</p>
            </div>

            <!-- Body -->
            <div class="auth-body">
                <!-- SCREEN 0: ACTIVE ACCOUNT DETAILS (WHEN LOGGED IN) -->
                <div id="loggedInProfileScreen" class="uber-screen-section" style="display: none;">
                    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 18px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #7c5cfc, #ec4899); color: #fff; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(124, 92, 252, 0.3);" id="modalLoggedInAvatar">U</div>
                            <div>
                                <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;" id="modalLoggedInName">User</h3>
                                <span id="modalLoggedInRoleBadge" style="display: inline-flex; align-items: center; gap: 5px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px;">
                                    <i class="fa-solid fa-graduation-cap"></i> SRKR Student • 25% OFF
                                </span>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12.5px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #64748b; font-weight: 600;">Mobile</span>
                                <span style="font-weight: 700; color: #0f172a;" id="modalLoggedInPhone">+91 ...</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #64748b; font-weight: 600;">Email</span>
                                <span style="font-weight: 700; color: #0f172a;" id="modalLoggedInEmail">...</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #64748b; font-weight: 600;">Campus</span>
                                <span style="font-weight: 700; color: #0f172a;" id="modalLoggedInCampus">S.R.K.R. Engineering College</span>
                            </div>
                        </div>
                    </div>

                    <!-- Continue to Store -->
                    <button type="button" class="uber-primary-btn" onclick="closeAuthModal()" style="margin-top: 0; margin-bottom: 10px;">
                        <span>Continue Shopping</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>

                    <!-- Sign Out & Switch Account -->
                    <button type="button" class="uber-alt-btn" onclick="handleUserLogout(); backToPhoneStep();" style="color: #dc2626; border-color: #fca5a5; background: #fef2f2;">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                        <span>Sign Out & Switch Account</span>
                    </button>
                </div>

                <!-- SCREEN 1: PASSCODE LOGIN -->
                <div id="passcodeStepLogin" class="uber-screen-section">
                    <form onsubmit="handlePasscodeLoginSubmit(event)" id="passcodeLoginForm">
                        <!-- Mobile Number Label Row -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label style="font-size: 12px; font-weight: 700; color: #1e293b; margin: 0;">Enter Mobile Number</label>
                            <span style="font-size: 11px; color: #16a34a; font-weight: 800;"><i class="fa-solid fa-bolt"></i> Instant 2-sec Delivery</span>
                        </div>

                        <!-- Mobile Number Box -->
                        <div class="uber-phone-box" style="margin-bottom: 14px; border: 2px solid #8b5cf6; border-radius: 14px;">
                            <div class="uber-country-code">
                                <span class="uber-flag-icon">🇮🇳</span>
                                <span>+91</span>
                                <i class="fa-solid fa-chevron-down" style="font-size: 10px; color: #9ca3af; margin-left: 2px;"></i>
                            </div>
                            <input type="tel" id="passcodePhoneNumber" class="uber-phone-input" placeholder="10-digit mobile number" maxlength="10" required autocomplete="tel" autofocus>
                        </div>

                        <!-- 4-Digit Passcode Header & Helper -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; margin-bottom: 6px;">
                            <label style="font-size: 12.5px; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid fa-shield-halved" style="color: #7c5cfc;"></i>
                                <span>4-Digit Passcode *</span>
                            </label>
                            <a href="https://wa.link/gejgjd" target="_blank" rel="noopener noreferrer" style="font-size: 11.5px; font-weight: 700; color: #7c5cfc; text-decoration: none; display: flex; align-items: center; gap: 4px;">
                                <i class="fa-brands fa-whatsapp" style="color: #25d366; font-size: 13px;"></i>
                                <span>Forgot Passcode?</span>
                            </a>
                        </div>

                        <!-- 4 Tactile Passcode Digits Box -->
                        <div class="uber-otp-row" style="margin: 6px 0 10px;">
                            <input type="password" maxlength="1" class="uber-otp-box passcode-box" id="passD1" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                            <input type="password" maxlength="1" class="uber-otp-box passcode-box" id="passD2" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                            <input type="password" maxlength="1" class="uber-otp-box passcode-box" id="passD3" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                            <input type="password" maxlength="1" class="uber-otp-box passcode-box" id="passD4" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                        </div>

                        <!-- Mask Toggle & Security Note -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 12px;">
                            <span style="color: #64748b; font-size: 11.5px;">Enter your 4-digit security PIN</span>
                            <button type="button" onclick="togglePasscodeMask()" style="background: none; border: none; font-size: 12px; color: #4b5563; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 0;" id="passcodeMaskToggleBtn">
                                <i class="fa-regular fa-eye"></i> <span>Show Passcode</span>
                            </button>
                        </div>

                        <!-- Primary Continue Button -->
                        <button type="submit" class="uber-primary-btn" id="passcodeLoginSubmitBtn">
                            <span>Log In with Passcode</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>

                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; color: #64748b; margin-top: 12px;">
                            <i class="fa-solid fa-shield-halved" style="color: #10b981;"></i>
                            <span>Protected by Chocoloom Passcode Shield</span>
                        </div>
                    </form>

                    <!-- Create Account Link -->
                    <div style="text-align: center; margin-top: 14px;">
                        <button type="button" onclick="openNewUserOnboardingScreen()" style="background: none; border: none; color: #7c5cfc; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: underline;">
                            New to Chocoloom? Create Account & Set Passcode
                        </button>
                    </div>

                    <!-- Terms Footer -->
                    <p class="uber-terms" style="margin-top: 14px; margin-bottom: 4px;">
                        By continuing, you agree to Chocoloom's Terms & Privacy.<br>
                        SRKR Engineering College students automatically receive a flat 25% campus discount!
                    </p>
                </div>

                <!-- SCREEN 2: FIRST-TIME USER ONBOARDING -->
                <div id="passcodeStepOnboarding" class="uber-screen-section" style="display: none;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                        <button type="button" class="uber-card-back-btn" onclick="backToPhoneStep()" title="Back" style="margin-bottom: 0;">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        <div>
                            <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0;">Create Account</h4>
                            <p style="font-size: 11.5px; color: #64748b; margin: 0;">Set your 4-digit passcode & delivery details</p>
                        </div>
                    </div>

                    <form onsubmit="completePasscodeOnboarding(event)" id="passcodeOnboardingForm">
                        <!-- Mobile Number -->
                        <div style="margin-bottom: 10px;">
                            <label style="font-size: 11.5px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Mobile Number *</label>
                            <div class="uber-phone-box" style="height: 46px; padding: 0 12px; margin-bottom: 0;">
                                <div class="uber-country-code" style="margin-right: 8px; border-right: 1.5px solid #e2e8f0; padding-right: 8px;">
                                    <span class="uber-flag-icon">🇮🇳</span>
                                    <span>+91</span>
                                </div>
                                <input type="tel" id="onboardingPhoneNumber" class="uber-phone-input" style="padding-left: 0; font-size: 14px;" placeholder="98765 43210" maxlength="10" required autocomplete="tel" oninput="checkOnboardingPhoneRegistered(this)">
                            </div>
                            <div id="onboardingPhoneNotice" style="display: none; font-size: 11.5px; margin-top: 5px; font-weight: 700;"></div>
                        </div>

                        <!-- Set 4-Digit Passcode -->
                        <div style="margin-bottom: 10px;">
                            <label style="font-size: 11.5px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Set 4-Digit Passcode *</label>
                            <div class="uber-phone-box" style="height: 46px; padding: 0 12px; margin-bottom: 0; position: relative;">
                                <input type="password" id="otpNewUserPassword" class="uber-phone-input" style="padding-left: 0; font-size: 14px; padding-right: 32px; letter-spacing: 2px;" placeholder="Create 4-digit PIN" maxlength="4" inputmode="numeric" pattern="[0-9]*" required autocomplete="new-password" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 4)">
                                <button type="button" class="auth-pw-toggle" onclick="togglePasswordVisibility('otpNewUserPassword', this)" style="position: absolute; right: 12px; background: none; border: none; color: #9ca3af; cursor: pointer;">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Full Name -->
                        <div style="margin-bottom: 10px;">
                            <label style="font-size: 11.5px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Full Name *</label>
                            <div class="uber-phone-box" style="height: 46px; padding: 0 12px; margin-bottom: 0;">
                                <input type="text" id="otpNewUserName" class="uber-phone-input" style="padding-left: 0; font-size: 14px;" placeholder="e.g. Mohith Kumar" required autocomplete="name">
                            </div>
                        </div>

                        <!-- Email Address -->
                        <div style="margin-bottom: 10px;">
                            <label style="font-size: 11.5px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Email Address *</label>
                            <div class="uber-phone-box" style="height: 46px; padding: 0 12px; margin-bottom: 0;">
                                <input type="email" id="otpNewUserEmail" class="uber-phone-input" style="padding-left: 0; font-size: 14px;" placeholder="name@example.com" required autocomplete="email">
                            </div>
                        </div>

                        <!-- Delivery Address (Compulsory) -->
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <label style="font-size: 11.5px; font-weight: 700; color: #374151;">Delivery Address * <span style="color: #dc2626; font-size: 10.5px; font-weight: 800;">(Compulsory)</span></label>
                                <span style="font-size: 10px; color: #7c5cfc; font-weight: 700; background: #f3e8ff; padding: 2px 6px; border-radius: 999px;">Bhimavaram only</span>
                            </div>
                            <div class="uber-phone-box" style="height: 46px; padding: 0 12px; margin-bottom: 0;">
                                <input type="text" id="otpNewUserAddress" class="uber-phone-input" style="padding-left: 0; font-size: 13.5px;" placeholder="Hostel room or Home address (Bhimavaram)" required>
                            </div>
                        </div>

                        <!-- SRKR College Student Perk -->
                        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 10px 12px; margin-bottom: 14px;">
                            <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; margin-bottom: 4px;">
                                <div style="font-size: 12.5px; font-weight: 800; color: #14532d;">
                                    <i class="fa-solid fa-graduation-cap"></i> I am a College Student
                                </div>
                                <input type="checkbox" id="otpNewUserIsStudent" checked onchange="document.getElementById('modalCollegeSelectWrapper').style.display = this.checked ? 'block' : 'none'" style="width: 17px; height: 17px; accent-color: #16a34a; cursor: pointer;">
                            </label>
                            <div id="modalCollegeSelectWrapper">
                                <select id="otpNewUserCollegeSelect" style="width: 100%; border-radius: 8px; border: 1px solid #86efac; padding: 6px 8px; font-size: 11.5px; background: #fff; outline: none; cursor: pointer;">
                                    <option value="col_srkr" selected>S.R.K.R. Engineering College (SRKR) - Active (25% OFF)</option>
                                    <option value="col_vishnu">Vishnu Engineering College (Bhimavaram)</option>
                                    <option value="col_gitam">GITAM University</option>
                                    <option value="col_andhra">Andhra University</option>
                                    <option value="col_other">Other College / University</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" class="uber-primary-btn" id="onboardingSubmitBtn" style="margin-top: 0;">
                            <span>Save Profile & Start Ordering</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- User Orders & History Modal -->
    <div class="modal-backdrop" id="userOrdersModalBackdrop">
        <div class="orders-modal-card">
            <div class="orders-modal-header">
                <div class="orders-modal-title">
                    <i class="fa-solid fa-receipt" style="color: var(--primary);"></i>
                    <span>My Orders</span>
                    <span class="menu-badge" id="ordersModalCountBadge">0 Orders</span>
                </div>
                <button class="modal-close-btn" onclick="closeOrdersModal()" title="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="orders-list-body" id="ordersListBody">
                <!-- Dynamically rendered past orders -->
            </div>
        </div>
    </div>

    <!-- User Account Details & Profile Modal -->
    <div class="modal-backdrop" id="accountDetailsModalBackdrop">
        <div class="orders-modal-card" style="max-width: 440px;">
            <div class="orders-modal-header">
                <div class="orders-modal-title">
                    <i class="fa-solid fa-id-card" style="color: var(--primary);"></i>
                    <span>Account Details</span>
                </div>
                <button class="modal-close-btn" onclick="closeAccountDetailsModal()" title="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div style="padding: 22px 24px;">
                <!-- Profile Avatar & Name Header -->
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #ec4899); color: #fff; font-size: 20px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(124, 92, 252, 0.3);" id="accModalAvatar">M</div>
                    <div>
                        <h4 style="font-size: 17px; font-weight: 900; color: #0f172a; margin: 0 0 4px;" id="accModalName">Mohith Kumar</h4>
                        <span id="accModalDiscountBadge" style="display: inline-flex; align-items: center; gap: 5px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px;">
                            <i class="fa-solid fa-graduation-cap"></i> 25% SRKR Student OFF Active
                        </span>
                    </div>
                </div>

                <!-- Info Cards -->
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <span style="font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Mobile Phone</span>
                            <span style="font-size: 14px; font-weight: 700; color: #0f172a;" id="accModalPhone">+91 98765 43210</span>
                        </div>
                        <span style="font-size: 11px; color: #16a34a; font-weight: 800; background: #dcfce7; padding: 3px 8px; border-radius: 999px;"><i class="fa-solid fa-circle-check"></i> Verified</span>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
                        <span style="font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Email Address</span>
                        <span style="font-size: 14px; font-weight: 700; color: #0f172a;" id="accModalEmail">student@srkr.edu.in</span>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
                        <span style="font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Campus / University</span>
                        <span style="font-size: 13.5px; font-weight: 700; color: #0f172a;" id="accModalCollege"><i class="fa-solid fa-graduation-cap" style="color: #16a34a;"></i> S.R.K.R. Engineering College</span>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <span style="font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Orders Placed</span>
                            <span style="font-size: 14px; font-weight: 700; color: #0f172a;" id="accModalOrdersCount">0 Orders</span>
                        </div>
                        <button type="button" onclick="closeAccountDetailsModal(); openOrdersModal();" style="background: none; border: none; color: var(--primary); font-size: 12px; font-weight: 800; cursor: pointer; text-decoration: underline;">
                            View Orders <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>

                    <!-- Chocowallet VIP Card Profile Row -->
                    <div style="background: linear-gradient(135deg, #090314, #1f0b38, #3b0d66); color: #fff; border-radius: 14px; padding: 13px 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 20px -4px rgba(59, 13, 102, 0.35);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; font-size: 17px;">
                                💳
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">CHOCOWALLET VIP CARD</span>
                                    <span style="background: #facc15; color: #713f12; font-size: 9px; font-weight: 900; padding: 1px 5px; border-radius: 4px;">VIP</span>
                                </div>
                                <span style="font-size: 15px; font-weight: 900; color: #4ade80;" id="accModalWalletBal">VIP Status</span>
                            </div>
                        </div>
                        <a href="<?php echo chocoloom_get_page_url('chocowallet'); ?>" style="background: #ffffff; color: #581c87; text-decoration: none; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
                            View Card <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i>
                        </a>
                    </div>
                </div>

                <!-- Actions -->
                <div style="display: flex; gap: 10px;">
                    <button type="button" onclick="closeAccountDetailsModal()" style="flex: 1; height: 44px; background: #0f172a; color: #fff; border: none; border-radius: 12px; font-size: 13.5px; font-weight: 800; cursor: pointer;">
                        Done
                    </button>
                    <button type="button" onclick="handleUserLogout(); closeAccountDetailsModal();" style="height: 44px; padding: 0 16px; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; border-radius: 12px; font-size: 13.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div>
                    <div class="footer-brand" style="display: flex; align-items: center; gap: 10px;">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/logo.png" alt="Chocoloom Logo" style="height: 32px; width: auto; object-fit: contain;">
                    </div>
                    <p class="footer-tagline">
                        Order delicious meals, artisanal desserts, and daily grocery essentials with superfast lightning delivery across top cities in India.
                    </p>
                    <div style="font-size: 13px; color: #64748b;">© 2026 Chocoloom Technologies Pvt. Ltd. All rights reserved.</div>
                </div>
                <div>
                    <h4 class="footer-heading">Company</h4>
                    <ul class="footer-links">
                        <li><a href="<?php echo home_url('/'); ?>">About Us</a></li>
                        <li><a href="<?php echo home_url('/'); ?>">Chocoloom Corporate</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Team & Culture</a></li>
                        <li><a href="#">Chocoloom One VIP</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="footer-heading">Contact & Help</h4>
                    <ul class="footer-links">
                        <li><a href="#">Help & Support</a></li>
                        <li><a href="#">Partner with us</a></li>
                        <li><a href="#">Ride with us</a></li>
                        <li><a href="#">Terms & Conditions</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="footer-heading">We Deliver To:</h4>
                    <ul class="footer-links">
                        <li><a href="#">Bhimavaram Town</a></li>
                        <li><a href="#">SRKR Campus (Chinna Amiram)</a></li>
                        <li><a href="#">Vishnupur (VITB & SVECW)</a></li>
                        <li><a href="#">Balusumudi & Somavaram</a></li>
                        <li><a href="#">Palakollu & Undi Road Surroundings</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <div>Made with ❤️ for food & chocolate lovers</div>
                <div style="display: flex; gap: 16px; font-size: 18px;">
                    <a href="#"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#"><i class="fa-brands fa-facebook"></i></a>
                    <a href="#"><i class="fa-brands fa-twitter"></i></a>
                    <a href="#"><i class="fa-brands fa-linkedin"></i></a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Mobile App Bottom Navigation Bar -->
    <nav class="mobile-bottom-nav">
        <button class="mobile-nav-item active" id="mobileNavFood">
            <i class="fa-solid fa-utensils"></i>
            <span>Food</span>
        </button>
        <button class="mobile-nav-item" id="mobileNavInstamart" onclick="switchToGameZone()" title="Chocoloom Game Zone - Play & Win Rewards!">
            <i class="fa-solid fa-gamepad"></i>
            <span>Game Zone</span>
        </button>
        <button class="mobile-nav-item" id="mobileNavSearch">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>Search</span>
        </button>
        <a href="<?php echo chocoloom_get_page_url('uni-chocoloom'); ?>" class="mobile-nav-item" id="mobileNavOffers" title="Uni Chocoloom Campus Store" style="text-decoration: none; color: inherit;">
            <i class="fa-solid fa-graduation-cap"></i>
            <span>Uni Chocoloom</span>
        </a>
        <button class="mobile-nav-item" id="mobileNavCart" onclick="openCart()">
            <div style="position: relative; display: inline-block;">
                <i class="fa-solid fa-bag-shopping"></i>
                <span class="mobile-cart-badge" id="mobileCartBadge">0</span>
            </div>
            <span>Cart</span>
        </button>
    </nav>

    <?php wp_footer(); ?>
</body>
</html>
