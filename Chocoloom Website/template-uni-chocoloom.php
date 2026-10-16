<?php
/**
 * Template Name: Uni Chocoloom Campus Store
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/logo.png">
    
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
        // Flag this page as the dedicated Uni Chocoloom store
        window.IS_UNI_CHOCOLOOM_PAGE = true;
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

    <!-- Navigation Header -->
    <header class="navbar" id="catalogNavbar">
        <div class="container nav-inner">
            <div class="nav-left">
                <a href="<?php echo home_url('/'); ?>" class="brand-logo" id="brandLogoBtn" title="Back to Chocoloom Home">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/logo.png" alt="Chocoloom Logo" class="brand-logo-img">
                </a>

                <div class="location-picker" id="locationPickerBtn" title="Delivering to SRKR Engineering College, Bhimavaram">
                    <div class="loc-icon-pill" style="background: rgba(22, 163, 74, 0.12); color: #16a34a;">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div class="loc-text-group">
                        <div class="loc-header-line">
                            <span class="loc-type" id="currentLocType">SRKR College</span>
                            <i class="fa-solid fa-chevron-down loc-arrow"></i>
                        </div>
                        <span class="loc-name" id="currentLocName">Bhimavaram</span>
                    </div>
                </div>
            </div>

            <div class="nav-right">
                <div class="nav-item" id="navSearchTrigger">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span class="nav-text">Search</span>
                </div>
                <div class="nav-item nav-item-uni" id="navOffersTrigger" title="Uni Chocoloom Campus Store" style="background: rgba(22, 163, 74, 0.08); border-color: rgba(22, 163, 74, 0.4);">
                    <div class="uni-nav-glow-wrap">
                        <i class="fa-solid fa-graduation-cap uni-nav-icon" style="color: #16a34a;"></i>
                    </div>
                    <span class="nav-text" style="color: #16a34a; font-weight: 800;">Uni Chocoloom</span>
                    <span class="nav-uni-badge" style="background: #16a34a; color: #fff;">25% OFF ACTIVE</span>
                </div>
                <a href="<?php echo home_url('/'); ?>" class="nav-item" title="Browse full bakery catalog" style="text-decoration: none; color: inherit;">
                    <i class="fa-solid fa-store" style="color: var(--primary);"></i>
                    <span class="nav-text">Full Store Menu</span>
                </a>

                <div class="nav-item" id="navHelpTrigger">
                    <i class="fa-regular fa-circle-question"></i>
                    <span class="nav-text">Help</span>
                </div>

                <!-- User Sign In / Profile Navigation Trigger -->
                <a href="<?php echo chocoloom_get_page_url('login'); ?>?redirect=uni-chocoloom.html" class="nav-item-auth" id="navAuthBtn" title="Account Login & Sign Up" style="text-decoration: none;" onclick="if(typeof openAuthModal === 'function'){ openAuthModal('passcode'); return false; }">
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
                                <span class="dropdown-badge" id="dropdownBadge"><i class="fa-solid fa-graduation-cap"></i> SRKR Student • 25% OFF</span>
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

        <!-- Live Exclusive Campus Availability Banner Strip (Controlled Dynamically based on selected college) -->
        <div class="campus-exclusive-banner-strip" id="campusExclusiveBannerStrip" style="display: none; border-radius: var(--radius-md); padding: 14px 18px; margin: 18px 0 24px; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
            <!-- Injected dynamically by updateCampusAvailabilityBanner() only when an unavailable college is selected -->
        </div>

        <!-- "What's on your mind?" Category Slider -->
        <section class="mind-category-section">
            <div class="section-header">
                <h2 class="section-title">What's on your campus mind? 🎓</h2>
                <div class="carousel-nav-btns">
                    <button class="carousel-nav-btn" id="catScrollLeftBtn"><i class="fa-solid fa-arrow-left"></i></button>
                    <button class="carousel-nav-btn" id="catScrollRightBtn"><i class="fa-solid fa-arrow-right"></i></button>
                </div>
            </div>
            <div class="category-scroll-container" id="categoryScrollContainer">
                <!-- Dynamic categories loaded from data.js -->
            </div>
        </section>

        <!-- ==================== BESPOKE STUDIO & CUSTOM CREATIONS ==================== -->
        <section class="bespoke-custom-section" id="bespokeCustomSection">
            <div class="bespoke-section-header">
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
                    </div>
                    <div class="bespoke-card-arrow wave-arrow">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        </section>

        <!-- Main Products Catalog Section (Direct on Page) -->
        <section class="products-catalog-section" id="productsCatalogSection">
            <div class="section-header catalog-header">
                <div class="catalog-header-text">
                    <button type="button" class="category-back-nav-btn" id="categoryBackNavBtn" onclick="resetCategoryFilter()" style="display: none;" title="Back to All Campus Treats">
                        <i class="fa-solid fa-arrow-left"></i>
                        <span>All Campus Treats</span>
                    </button>
                    <h2 class="section-title" id="catalogSectionTitle">Uni Chocoloom Campus Treats 🎓</h2>
                    <p class="section-subtitle" id="catalogItemCountSubtitle">Currently available at S.R.K.R. Engineering College only! Handcrafted chocolates, bento cakes, desserts & midnight snacks with Flat 25% Student Discount (Code: UNICHOCO)</p>
                </div>
            </div>



            <!-- Direct Products Grid -->
            <div class="direct-products-grid" id="productsGrid">
                <!-- Dynamic Uni Chocoloom Product Cards with Direct ADD buttons -->
            </div>

            <!-- Game Zone View -->
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
            <div style="font-size: 12px; opacity: 0.9;" id="floatingItemTotal">View cart to checkout (25% Student OFF Active)</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 800;">
            <span>VIEW CART</span>
            <i class="fa-solid fa-arrow-right"></i>
        </div>
    </div>

    <!-- College & University Selector Modal -->
    <div class="modal-backdrop" id="locationModalBackdrop">
        <div class="menu-modal-container" style="max-width: 520px; height: auto; max-height: 88vh; border-radius: var(--radius-lg); overflow: hidden;">
            <div class="menu-header" style="align-items: flex-start; padding: 18px 20px 14px; border-bottom: 1px solid var(--border-color); background: #fff;">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 30px; height: 30px; border-radius: 8px; background: rgba(22, 163, 74, 0.12); color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 15px;">
                            <i class="fa-solid fa-graduation-cap"></i>
                        </div>
                        <h3 style="font-size: 18px; font-weight: 800; color: var(--dark); margin: 0;">Select Your College or University</h3>
                    </div>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 5px 0 0 38px;">Choose your campus or hostel for direct gate delivery with 25% student OFF</p>
                </div>
                <button class="modal-close-btn" id="closeLocationModalBtn" style="margin-top: -2px;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="padding: 20px; overflow-y: auto; max-height: calc(88vh - 75px);">
                <!-- Live Exclusive Campus Availability Notice -->
                <div style="background: linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(34, 197, 94, 0.05)); border: 1.5px solid rgba(22, 163, 74, 0.4); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 12px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #16a34a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 1px; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 800; font-size: 13.5px; color: #15803d; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <span>Currently Available At SRKR Engineering College Only</span>
                            <span style="background: #16a34a; color: #fff; font-size: 9.5px; font-weight: 800; padding: 1px 6px; border-radius: 999px;">EXCLUSIVE</span>
                        </div>
                        <div style="font-size: 12px; color: #475569; margin-top: 3px; line-height: 1.4;">
                            Uni Chocoloom is live exclusively at <strong>S.R.K.R. Engineering College</strong> (Chinna Amiram / Sriramapuram). Fast delivery to SRKR Hostels & Campus Main Gate in 15–20 mins. Other campuses are launching soon!
                        </div>
                    </div>
                </div>

                <!-- Locate using GPS Button -->
                <button class="use-gps-btn" id="useGpsLocationBtn" onclick="detectGPSLocation()" style="background: linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(37, 99, 235, 0.05)); border: 1.5px solid rgba(22, 163, 74, 0.35); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 16px; width: 100%; display: flex; align-items: center; gap: 14px; cursor: pointer; text-align: left; transition: all 0.2s;" onmouseover="this.style.background='rgba(22, 163, 74, 0.12)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(37, 99, 235, 0.05))'">
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
                </button>

                <div class="location-divider-text" style="display: flex; align-items: center; text-align: center; margin: 14px 0 16px; color: var(--text-muted); font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">
                    <span style="flex: 1; border-bottom: 1px solid var(--border-color);"></span>
                    <span style="padding: 0 10px; text-transform: uppercase;">OR SEARCH COLLEGE / CAMPUS</span>
                    <span style="flex: 1; border-bottom: 1px solid var(--border-color);"></span>
                </div>

                <div style="margin-bottom: 14px; position: relative;">
                    <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 14px;"></i>
                    <input type="text" id="locationSearchInput" placeholder="Search college name, university, or area (e.g. SRKR, Vishnu, DNR)..." style="width: 100%; padding: 12px 14px 12px 40px; border: 1.5px solid var(--border-color); border-radius: var(--radius-sm); font-size: 14px; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#16a34a'" onblur="this.style.borderColor='var(--border-color)'">
                </div>
                <div id="locationsList" style="display: flex; flex-direction: column; gap: 10px; max-height: 48vh; overflow-y: auto; padding-right: 4px;">
                    <!-- Colleges populated via JS -->
                </div>
            </div>
        </div>
    </div>

    <!-- Dedicated Search Page Overlay -->
    <div class="search-page-overlay" id="searchPageOverlay">
        <div class="search-page-container">
            <div class="search-page-header">
                <button class="search-back-btn" id="searchPageBackBtn" onclick="closeSearchPage()" title="Back to menu">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="search-page-input-wrap">
                    <i class="fa-solid fa-magnifying-glass search-page-icon"></i>
                    <input type="text" id="searchPageInput" placeholder="Search chocolates, brownies, bento cakes, cookies..." autocomplete="off">
                    <button class="search-page-clear-btn" id="searchPageClearBtn" onclick="clearSearchPageInput()" title="Clear">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </button>
                </div>
                <button class="search-filter-toggle-btn" id="searchVegToggleBtn" onclick="toggleSearchVegFilter()">
                    <span>🌱</span> <span class="veg-text">Veg Only</span>
                </button>
            </div>

            <div class="search-page-body" id="searchPageBody">
                <div class="search-suggestions-view" id="searchSuggestionsView">
                    <div class="search-section-block">
                        <div class="search-section-title">
                            <i class="fa-solid fa-fire-flame-curved" style="color: #f97316;"></i>
                            <span>Trending Campus Searches</span>
                        </div>
                        <div class="search-trending-tags" id="searchTrendingTags"></div>
                    </div>

                    <div class="search-section-block">
                        <div class="search-section-title">
                            <i class="fa-solid fa-layer-group" style="color: var(--primary);"></i>
                            <span>Campus Categories</span>
                        </div>
                        <div class="search-popular-cats-grid" id="searchPopularCatsGrid"></div>
                    </div>

                    <div class="search-section-block">
                        <div class="search-section-title">
                            <i class="fa-solid fa-crown" style="color: #eab308;"></i>
                            <span>Top Student Delights</span>
                        </div>
                        <div class="search-bestsellers-grid" id="searchBestsellersGrid"></div>
                    </div>
                </div>

                <div class="search-results-view" id="searchResultsView" style="display: none;">
                    <div class="search-results-header">
                        <div class="search-results-count" id="searchResultsCount">Found 0 items</div>
                        <div class="search-results-pills" id="searchResultsCategoryPills"></div>
                    </div>
                    <div class="search-results-grid" id="searchResultsGrid"></div>
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
                <i class="fa-solid fa-bag-shopping" style="color: var(--primary);"></i>
                <span>Your Campus Cart</span>
            </div>
            <button class="modal-close-btn" id="closeCartBtn" onclick="closeCart()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <!-- Cart User Auth Status Banner -->
        <div class="cart-auth-prompt" id="cartAuthPrompt" onclick="openAuthModal('otp')">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-user-lock" style="color: var(--primary); font-size: 14px;"></i>
                <div style="display: flex; flex-direction: column; text-align: left;">
                    <span style="font-size: 11.5px; font-weight: 800; color: #1e293b;">Sign in to proceed to buy</span>
                    <span style="font-size: 10.5px; color: #64748b;">Sign in is required to checkout & place orders</span>
                </div>
            </div>
            <button class="auth-prompt-btn" type="button">Sign In</button>
        </div>
        <div class="cart-auth-logged" id="cartAuthLogged" style="display: none;">
            <i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 13px;"></i>
            <span>Ordering as <strong id="cartLoggedUserName">User</strong> (<span id="cartLoggedUserRole">SRKR Student</span>)</span>
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

            <div class="customization-modal-body" id="customizationModalBody"></div>

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

            <div style="width: 68px; height: 68px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 4px solid #d1fae5;">
                <i class="fa-solid fa-check" style="color: #10b981; font-size: 30px;"></i>
            </div>

            <div class="track-header" style="margin-bottom: 18px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                    <span id="trackOrderNumBadge" style="font-size: 12px; font-weight: 800; background: rgba(124, 92, 252, 0.1); color: var(--primary); padding: 4px 14px; border-radius: var(--radius-full); border: 1px solid rgba(124, 92, 252, 0.25);">Order #CL-...</span>
                </div>
                <h3 class="track-status-title" id="trackStatusTitle" style="font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 6px;">Campus Order Placed! 🎉</h3>
                <p class="track-subtext" id="trackSubtext" style="font-size: 13px; color: var(--text-muted); margin-bottom: 0;">25% student discount applied. Fast delivery dispatching to your campus gate / hostel.</p>
            </div>

            <div id="orderSuccessDetailsCard" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 700; color: #475569;">Order Status</span>
                    <span style="font-size: 11px; background: #ecfdf5; color: #059669; font-weight: 700; padding: 2px 8px; border-radius: 4px;"><i class="fa-solid fa-circle-check"></i> Confirmed & Saved</span>
                </div>
            </div>

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

            <!-- Tab Switcher (Hidden: Single OTP Authentication Mode) -->
            <div class="auth-tabs-bar" style="display: none !important;">
                <button class="auth-tab-btn active" id="authTabOtpBtn" onclick="switchAuthTab('otp')"><i class="fa-solid fa-mobile-screen-button"></i> Mobile OTP</button>
            </div>

            <!-- Body -->
            <div class="auth-body">
                <!-- 1. Fast Mobile OTP Flow -->
                <form class="auth-form active" id="otpForm" onsubmit="handleSendOtpSubmit(event)">
                    <!-- Step 1: Mobile Number & Channel -->
                    <div id="otpStepPhone">
                        <div class="auth-field-group">
                            <label class="auth-field-label" for="otpPhoneNumber">
                                <span>Enter Mobile Number</span>
                                <span style="font-size: 10.5px; color: #16a34a; font-weight: 700;"><i class="fa-solid fa-bolt"></i> Instant 2-sec Delivery</span>
                            </label>
                            <div class="auth-input-wrapper">
                                <div class="otp-country-code">+91</div>
                                <input type="tel" id="otpPhoneNumber" class="auth-input otp-phone-input" placeholder="10-digit mobile number" maxlength="10" required autocomplete="tel">
                            </div>
                        </div>

                        <!-- Channel Preference (WhatsApp / SMS) -->
                        <div style="margin: 10px 0 6px;">
                            <label style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; display: block;">Send OTP via:</label>
                            <div class="otp-channel-picker">
                                <div class="otp-channel-pill active whatsapp" id="channelWhatsappPill" onclick="selectOtpChannel('whatsapp')">
                                    <i class="fa-brands fa-whatsapp" style="font-size: 15px;"></i>
                                    <span>WhatsApp OTP</span>
                                    <span style="font-size: 9px; background: #16a34a; color: #fff; padding: 1px 5px; border-radius: 4px; font-weight: 800;">FASTEST</span>
                                </div>
                                <div class="otp-channel-pill sms" id="channelSmsPill" onclick="selectOtpChannel('sms')">
                                    <i class="fa-solid fa-comment-sms" style="font-size: 14px;"></i>
                                    <span>SMS OTP</span>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="auth-submit-btn" id="sendOtpSubmitBtn">
                            <i class="fa-solid fa-paper-plane"></i>
                            <span>GET VERIFICATION CODE</span>
                        </button>

                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 10.5px; color: #64748b; margin-top: 10px;">
                            <i class="fa-solid fa-shield-halved" style="color: #10b981;"></i>
                            <span>Protected by Chocoloom Passcode Shield</span>
                        </div>

                        <!-- Quick Test Chips -->
                        <div class="auth-demo-section">
                            <span class="auth-demo-label">⚡ Fast 1-Click Demo Numbers</span>
                            <div class="auth-demo-chips">
                                <button type="button" class="auth-demo-chip student-demo" onclick="fillOtpDemo('9494768069')">
                                    <i class="fa-solid fa-graduation-cap"></i> Mohith (94947 68069)
                                </button>
                                <button type="button" class="auth-demo-chip student-demo" onclick="fillOtpDemo('9876543210')">
                                    <i class="fa-solid fa-graduation-cap"></i> Student (98765 43210)
                                </button>
                                <button type="button" class="auth-demo-chip" onclick="fillOtpDemo('9988776655')">
                                    <i class="fa-solid fa-user-plus"></i> New Number Test
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Enter OTP PIN -->
                    <div id="otpStepVerify" style="display: none;">
                        <div style="text-align: center; margin-bottom: 14px;">
                            <div style="width: 44px; height: 44px; border-radius: 50%; background: #ecfdf5; color: #10b981; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 20px;">
                                <i class="fa-solid fa-shield-cat"></i>
                            </div>
                            <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Enter 4-Digit OTP</h4>
                            <p style="font-size: 12px; color: #64748b; margin: 0;">Sent via <strong id="otpSentChannelText">WhatsApp</strong> to <strong id="otpDisplayPhone">+91 ...</strong> <button type="button" onclick="backToPhoneStep()" style="background: none; border: none; color: var(--primary); font-size: 11px; font-weight: 700; cursor: pointer; text-decoration: underline;">Change</button></p>
                        </div>

                        <div class="otp-digits-row">
                            <input type="text" maxlength="1" class="otp-digit-box" id="otpD1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code">
                            <input type="text" maxlength="1" class="otp-digit-box" id="otpD2" inputmode="numeric" pattern="[0-9]*">
                            <input type="text" maxlength="1" class="otp-digit-box" id="otpD3" inputmode="numeric" pattern="[0-9]*">
                            <input type="text" maxlength="1" class="otp-digit-box" id="otpD4" inputmode="numeric" pattern="[0-9]*">
                        </div>


                        <div class="otp-timer-row">
                            <span id="otpCountdownText">Resend code in <strong id="otpTimerSeconds">30s</strong></span>
                            <div style="display: flex; gap: 8px;">
                                <a href="javascript:void(0)" class="otp-resend-link disabled" id="resendOtpWhatsappBtn" onclick="resendOtp('whatsapp')"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>
                                <a href="javascript:void(0)" class="otp-resend-link disabled" id="resendOtpSmsBtn" onclick="resendOtp('sms')"><i class="fa-solid fa-comment-sms"></i> SMS</a>
                            </div>
                        </div>

                        <button type="button" class="auth-submit-btn" id="verifyOtpBtn" onclick="handleVerifyOtpClick()" style="margin-top: 14px;">
                            <i class="fa-solid fa-circle-check"></i>
                            <span>VERIFY & CONTINUE</span>
                        </button>
                    </div>

                    <!-- Step 3: Complete Profile for First-time Unregistered Numbers -->
                    <div id="otpStepNewUserName" style="display: none;">
                        <div style="text-align: center; margin-bottom: 12px;">
                            <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Complete Your Profile 🎉</h4>
                            <p style="font-size: 12px; color: #64748b; margin: 0;">Please enter your details to create your Chocoloom account.</p>
                        </div>

                        <!-- Locked Verified Phone -->
                        <div style="display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 7px 12px; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #166534;">
                                <i class="fa-solid fa-mobile-screen"></i>
                                <span id="onboardingVerifiedPhone">+91 ...</span>
                            </div>
                            <span style="font-size: 10px; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 2px 6px; border-radius: 999px;">
                                <i class="fa-solid fa-check"></i> Verified
                            </span>
                        </div>

                        <div class="auth-field-group" style="margin-bottom: 8px;">
                            <label class="auth-field-label" for="otpNewUserName">Full Name *</label>
                            <div class="auth-input-wrapper">
                                <i class="fa-regular fa-user auth-input-icon"></i>
                                <input type="text" id="otpNewUserName" class="auth-input" placeholder="e.g. Mohith Kumar" required>
                            </div>
                        </div>

                        <div class="auth-field-group" style="margin-bottom: 8px;">
                            <label class="auth-field-label" for="otpNewUserEmail">Email Address *</label>
                            <div class="auth-input-wrapper">
                                <i class="fa-regular fa-envelope auth-input-icon"></i>
                                <input type="email" id="otpNewUserEmail" class="auth-input" placeholder="e.g. name@example.com" required>
                            </div>
                        </div>

                        <div class="auth-field-group" style="margin-bottom: 8px;">
                            <label class="auth-field-label" for="otpNewUserPassword">4-Digit Passcode *</label>
                            <div class="auth-input-wrapper">
                                <i class="fa-solid fa-lock auth-input-icon"></i>
                                <input type="password" id="otpNewUserPassword" class="auth-input" placeholder="Create 4-digit PIN" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 4)">
                                <button type="button" class="auth-pw-toggle" onclick="togglePasswordVisibility('otpNewUserPassword', this)">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div class="auth-field-group" style="margin-bottom: 8px;">
                            <label class="auth-field-label" for="otpNewUserAddress">Delivery Address / Room (Optional)</label>
                            <div class="auth-input-wrapper">
                                <i class="fa-solid fa-location-dot auth-input-icon"></i>
                                <input type="text" id="otpNewUserAddress" class="auth-input" placeholder="e.g. SRKR Hostel Room 204 or Home address">
                            </div>
                        </div>

                        <div class="auth-student-card" style="margin-top: 6px; margin-bottom: 10px;">
                            <div class="auth-student-toggle-row">
                                <div class="auth-student-toggle-label">
                                    <i class="fa-solid fa-graduation-cap"></i>
                                    <span>I am a College Student (25% OFF)</span>
                                </div>
                                <label class="auth-student-switch">
                                    <input type="checkbox" id="otpNewUserIsStudent" checked onchange="document.getElementById('uniOtpCollegeSelectWrap').style.display = this.checked ? 'block' : 'none'">
                                    <span class="auth-student-slider"></span>
                                </label>
                            </div>
                            <div id="uniOtpCollegeSelectWrap" style="margin-top: 8px;">
                                <select id="otpNewUserCollegeSelect" style="width: 100%; border-radius: 6px; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; outline: none;">
                                    <option value="col_srkr" selected>S.R.K.R. Engineering College (SRKR) - 25% OFF</option>
                                    <option value="col_vishnu">Vishnu Engineering College (Bhimavaram)</option>
                                    <option value="col_gitam">GITAM University</option>
                                    <option value="col_andhra">Andhra University</option>
                                    <option value="col_other">Other College / University</option>
                                </select>
                            </div>
                        </div>

                        <button type="button" class="auth-submit-btn" id="onboardingSubmitBtn" onclick="completeOtpOnboarding(event)" style="margin-top: 10px;">
                            <i class="fa-solid fa-arrow-right"></i>
                            <span>SAVE PROFILE & CONTINUE</span>
                        </button>
                    </div>
                </form>

                <!-- 2. Sign In Form (Password) -->
                <form class="auth-form" id="signInForm" onsubmit="handleSignInSubmit(event)">
                    <div class="auth-field-group">
                        <label class="auth-field-label" for="signInIdentifier">Email or Mobile Number</label>
                        <div class="auth-input-wrapper">
                            <i class="fa-regular fa-envelope auth-input-icon"></i>
                            <input type="text" id="signInIdentifier" class="auth-input" placeholder="e.g. mohith@srkr.edu.in or 9876543210" required autocomplete="username">
                        </div>
                    </div>

                    <div class="auth-field-group">
                        <label class="auth-field-label" for="signInPassword">
                            <span>Password</span>
                            <a href="javascript:void(0)" onclick="handleForgotPassword()" style="color: var(--primary); text-decoration: none; font-size: 11px; font-weight: 700;">Forgot?</a>
                        </label>
                        <div class="auth-input-wrapper">
                            <i class="fa-solid fa-lock auth-input-icon"></i>
                            <input type="password" id="signInPassword" class="auth-input" placeholder="Enter your password" required autocomplete="current-password">
                            <button type="button" class="auth-pw-toggle" onclick="togglePasswordVisibility('signInPassword', this)">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: #64748b; margin: 2px 0;">
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                            <input type="checkbox" id="rememberMeCheckbox" checked style="accent-color: var(--primary);">
                            <span>Remember me</span>
                        </label>
                        <span style="color: #10b981; font-weight: 700;"><i class="fa-solid fa-shield-halved"></i> 100% Secure</span>
                    </div>

                    <button type="submit" class="auth-submit-btn" id="signInSubmitBtn">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i>
                        <span>SIGN IN</span>
                    </button>

                    <!-- Quick Demo Credentials for Fast Testing -->
                    <div class="auth-demo-section">
                        <span class="auth-demo-label">⚡ Fast 1-Click Demo Login</span>
                        <div class="auth-demo-chips">
                            <button type="button" class="auth-demo-chip student-demo" onclick="fillDemoCredentials('student')">
                                <i class="fa-solid fa-graduation-cap"></i> SRKR Student Demo
                            </button>
                            <button type="button" class="auth-demo-chip" onclick="fillDemoCredentials('customer')">
                                <i class="fa-solid fa-user"></i> Regular Customer
                            </button>
                        </div>
                    </div>
                </form>

                <!-- Sign Up Form -->
                <form class="auth-form" id="signUpForm" onsubmit="handleSignUpSubmit(event)">
                    <div class="auth-field-group">
                        <label class="auth-field-label" for="signUpName">Full Name</label>
                        <div class="auth-input-wrapper">
                            <i class="fa-regular fa-user auth-input-icon"></i>
                            <input type="text" id="signUpName" class="auth-input" placeholder="e.g. Mohith Kumar" required autocomplete="name">
                        </div>
                    </div>

                    <div class="auth-field-group">
                        <label class="auth-field-label" for="signUpPhone">Mobile Phone (+91)</label>
                        <div class="auth-input-wrapper">
                            <i class="fa-solid fa-phone auth-input-icon"></i>
                            <input type="tel" id="signUpPhone" class="auth-input" placeholder="10-digit mobile number" maxlength="10" required autocomplete="tel">
                        </div>
                    </div>

                    <div class="auth-field-group">
                        <label class="auth-field-label" for="signUpEmail">Email Address</label>
                        <div class="auth-input-wrapper">
                            <i class="fa-regular fa-envelope auth-input-icon"></i>
                            <input type="email" id="signUpEmail" class="auth-input" placeholder="name@domain.com" required autocomplete="email">
                        </div>
                    </div>

                    <div class="auth-field-group">
                        <label class="auth-field-label" for="signUpPassword">Create 4-Digit Passcode *</label>
                        <div class="auth-input-wrapper">
                            <i class="fa-solid fa-lock auth-input-icon"></i>
                            <input type="password" id="signUpPassword" class="auth-input" placeholder="Create 4-digit PIN" maxlength="4" inputmode="numeric" pattern="[0-9]*" required autocomplete="new-password" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 4)">
                            <button type="button" class="auth-pw-toggle" onclick="togglePasswordVisibility('signUpPassword', this)">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <!-- College Student Perk Toggle -->
                    <div class="auth-student-card">
                        <div class="auth-student-toggle-row">
                            <div class="auth-student-toggle-label">
                                <i class="fa-solid fa-graduation-cap"></i>
                                <span>I am a College Student</span>
                            </div>
                            <label class="auth-student-switch">
                                <input type="checkbox" id="signUpIsStudent" checked onchange="toggleStudentFields(this.checked)">
                                <span class="auth-student-slider"></span>
                            </label>
                        </div>
                        <div id="signUpStudentFields" style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="font-size: 11px; font-weight: 700; color: #166534;">Select Campus (Currently Active at SRKR):</label>
                            <select id="signUpCollegeSelect" class="auth-college-select">
                                <option value="col_srkr" selected>S.R.K.R. Engineering College (SRKR) - Active (25% OFF)</option>
                                <option value="col_vishnu">Vishnu Engineering College (Bhimavaram)</option>
                                <option value="col_gitam">GITAM University</option>
                                <option value="col_andhra">Andhra University</option>
                                <option value="col_other">Other College / University</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" class="auth-submit-btn" id="signUpSubmitBtn">
                        <i class="fa-solid fa-user-plus"></i>
                        <span>CREATE ACCOUNT & UNLOCK DEALS</span>
                    </button>
                </form>
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
                        <span style="font-size: 11px; font-weight: 800; background: #16a34a; color: #fff; padding: 2px 6px; border-radius: 4px;">CAMPUS HUB</span>
                    </div>
                    <p class="footer-tagline">
                        Official student delivery service bringing chocolates, bento cakes, desserts, and midnight munchies to university hostels with flat 25% student savings.
                    </p>
                    <div style="font-size: 13px; color: #64748b;">© 2026 Chocoloom Technologies Pvt. Ltd. All rights reserved.</div>
                </div>
                <div>
                    <h4 class="footer-heading">Uni Chocoloom</h4>
                    <ul class="footer-links">
                        <li><a href="<?php echo chocoloom_get_page_url('uni-chocoloom'); ?>">Campus Store</a></li>
                        <li><a href="<?php echo home_url('/'); ?>">Full Bakery Store</a></li>
                        <li><a href="<?php echo home_url('/'); ?>">Main Home</a></li>
                        <li><a href="#">Student Perks FAQ</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="footer-heading">Campus Support</h4>
                    <ul class="footer-links">
                        <li><a href="#">Hostel Gate Delivery Info</a></li>
                        <li><a href="#">Student ID Verification</a></li>
                        <li><a href="#">Terms & Conditions</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="footer-heading">Delivering Near Campuses:</h4>
                    <ul class="footer-links">
                        <li><a href="#">S.R.K.R. Engineering College (Live)</a></li>
                        <li><a href="#">Vishnu Institute of Tech (VITB)</a></li>
                        <li><a href="#">Shri Vishnu Engineering for Women (SVECW)</a></li>
                        <li><a href="#">D.N.R. College & Balusumudi Campuses</a></li>
                        <li><a href="#">B.V. Raju College & West Godavari Campuses</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <div>Made with ❤️ for students, late-night crammers & dessert lovers</div>
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
        <button class="mobile-nav-item" id="mobileNavFood">
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
        <button class="mobile-nav-item active" id="mobileNavOffers" title="Uni Chocoloom Campus Store">
            <i class="fa-solid fa-graduation-cap"></i>
            <span>Uni Chocoloom</span>
        </button>
        <button class="mobile-nav-item" id="mobileNavCart" onclick="openCart()">
            <div style="position: relative; display: inline-block;">
                <i class="fa-solid fa-bag-shopping"></i>
                <span class="mobile-cart-badge" id="mobileCartBadge">0</span>
            </div>
            <span>Cart</span>
        </button>
    </nav>

    <!-- Razorpay Checkout, Supabase SDK & React Suite -->
    <?php wp_footer(); ?>
</body>
</html>
