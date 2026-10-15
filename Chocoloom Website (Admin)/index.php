<?php
/**
 * The main template file for Chocoloom Theme
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/logo.png">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

    <!-- Navigation Header -->
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
                            <span class="loc-type" id="currentLocType">Indiranagar</span>
                            <i class="fa-solid fa-chevron-down loc-arrow"></i>
                        </div>
                        <span class="loc-name" id="currentLocName">Bengaluru, Karnataka</span>
                    </div>
                </div>
            </div>

            <div class="nav-right">
                <div class="nav-item" id="navSearchTrigger">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span class="nav-text">Search</span>
                </div>
                <a href="<?php echo home_url('/uni-chocoloom.html'); ?>" class="nav-item nav-item-uni" id="navOffersTrigger" title="Uni Chocoloom - Campus Store for College Students" style="text-decoration: none; color: inherit;">
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
        </section>

        <!-- Main Products Catalog Section (Direct on Home Page) -->
        <section class="products-catalog-section" id="productsCatalogSection">
            <div class="section-header catalog-header">
                <div class="catalog-header-text">
                    <h2 class="section-title" id="catalogSectionTitle">Artisan Cakes & Sweet Delights</h2>
                    <p class="section-subtitle" id="catalogItemCountSubtitle">Showing all handcrafted cakes & desserts</p>
                </div>
            </div>



            <!-- Direct Home Page Products Grid -->
            <div class="direct-products-grid" id="productsGrid">
                <!-- Dynamic Product Cards with Direct ADD-to-cart buttons -->
            </div>

            <!-- Game Zone View (When Game Zone Tab clicked) -->
            <div id="instamartView" style="display: none; padding: 20px 0 60px;">
                <div class="section-header">
                    <h2 class="section-title">🎮 Chocoloom Game Zone & Fun Challenges</h2>
                </div>
                <div class="restaurants-grid" id="instamartGrid">
                    <!-- Dynamic Game Zone items -->
                </div>
            </div>
        </section>
    </main>

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

                <div class="location-divider-text"><span>OR SEARCH AREA MANUALLY</span></div>

                <div style="margin-bottom: 16px;">
                    <input type="text" id="locationSearchInput" placeholder="Search area or street name..." style="width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 14px;">
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
                        <div class="uni-perk-item" onclick="copyStudentCode(this)" title="Click to copy coupon code">
                            <span class="uni-perk-label">CODE:</span>
                            <span class="uni-perk-code">UNICHOCO</span>
                            <span class="uni-copy-hint"><i class="fa-regular fa-copy"></i> Auto-Applied</span>
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
    </div>

    <!-- Cart Slide-Out Drawer -->
    <div class="cart-drawer-overlay" id="cartOverlay" onclick="closeCart()"></div>
    <div class="cart-drawer" id="cartDrawer">
        <div class="cart-header">
            <div class="cart-title">
                <i class="fa-solid fa-bag-shopping" style="color: var(--primary);"></i>
                <span>Your Food Cart</span>
            </div>
            <button class="modal-close-btn" id="closeCartBtn" onclick="closeCart()">
                <i class="fa-solid fa-xmark"></i>
            </button>
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
                    <div style="font-size: 13px; color: #64748b;">© <?php echo date('Y'); ?> Chocoloom Technologies Pvt. Ltd. All rights reserved.</div>
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
                        <li><a href="#">Bengaluru</a></li>
                        <li><a href="#">Mumbai</a></li>
                        <li><a href="#">Delhi NCR</a></li>
                        <li><a href="#">Hyderabad</a></li>
                        <li><a href="#">Pune</a></li>
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
        <button class="mobile-nav-item" id="mobileNavInstamart">
            <i class="fa-solid fa-gamepad"></i>
            <span>Game Zone</span>
        </button>
        <button class="mobile-nav-item" id="mobileNavSearch">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>Search</span>
        </button>
        <a href="<?php echo home_url('/uni-chocoloom.html'); ?>" class="mobile-nav-item" id="mobileNavOffers" title="Uni Chocoloom Campus Store" style="text-decoration: none; color: inherit;">
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
