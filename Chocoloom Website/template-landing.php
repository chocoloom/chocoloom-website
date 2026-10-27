<?php
/**
 * Template Name: Chocoloom Landing Page
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/logo.png">
    
    
    <?php wp_head(); ?>
</head>
<body class="landing-body">

    <!-- ==================== 1. STARTING CINEMATIC LANDING HERO (IMAGE 1) ==================== -->
    <section class="landing-hero" id="landingHeroSection">
        <div class="landing-hero-overlay"></div>
        
        <!-- Top Landing Nav -->
        <div class="container landing-top-nav">
            <div class="landing-top-left">
                <a href="#landingShowcaseSection" class="landing-nav-link"><i class="fa-solid fa-mobile-screen-button"></i> Get the App</a>
                <div class="landing-location-badge" id="landingLocationChip" onclick="window.location.href='<?php echo home_url('/'); ?>'" title="Delivery Location (Click to view menu)">
                    <i class="fa-solid fa-location-dot"></i>
                    <span id="landingLocText">Detecting location...</span>
                </div>
            </div>
            <div class="landing-top-right">
                <a href="<?php echo chocoloom_get_page_url('uni-chocoloom'); ?>" class="landing-nav-link uni-landing-top-btn" style="background: linear-gradient(135deg, rgba(124, 92, 252, 0.4), rgba(236, 72, 153, 0.4)); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 999px; padding: 5px 14px; font-weight: 700; color: #fff; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-graduation-cap" style="color: #fbbf24;"></i>
                    <span>Uni Chocoloom (25% OFF)</span>
                </a>
                <a href="<?php echo chocoloom_get_page_url('chocowallet'); ?>" class="landing-nav-link" style="background: linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(79, 14, 138, 0.4)); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 999px; padding: 5px 14px; font-weight: 700; color: #fff; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-credit-card" style="color: #facc15;"></i>
                    <span>Chocowallet Card</span>
                </a>
                <a href="#landingShowcaseSection" class="landing-nav-link">About Us</a>
                <a href="<?php echo chocoloom_get_page_url('login'); ?>" class="landing-nav-link" style="background: rgba(255, 255, 255, 0.15); border-radius: 999px; padding: 5px 14px; font-weight: 700; color: #fff; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fa-regular fa-user"></i>
                    <span>Sign In</span>
                </a>
                <a href="#" class="landing-nav-link" onclick="showToast('Partner registration open!')">Add Restaurant</a>
            </div>
        </div>

        <!-- Center Hero Content -->
        <div class="landing-hero-content">
            <div class="landing-logo-box">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/logo-white.png" alt="Chocoloom Logo" class="landing-logo-img">
            </div>
            
            <h1 class="landing-hero-title">Food & Dessert Delivery App</h1>
            <p class="landing-hero-sub">Experience fast & easy online ordering on Chocoloom</p>

            <!-- Action Order Now Button redirecting to order.html -->
            <div style="margin: 24px 0 16px;">
                <a href="<?php echo home_url('/'); ?>" class="hero-primary-order-btn">
                    <span>ORDER NOW</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>

            <!-- Uni Chocoloom Campus Store Showcase Chip -->
            <div style="margin-bottom: 24px;">
                <a href="<?php echo chocoloom_get_page_url('uni-chocoloom'); ?>" style="display: inline-flex; align-items: center; gap: 10px; background: rgba(36, 11, 67, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(251, 191, 36, 0.6); padding: 8px 16px; border-radius: 999px; text-decoration: none; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                    <span style="background: #fbbf24; color: #1e1035; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px;"><i class="fa-solid fa-graduation-cap"></i></span>
                    <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.3px;">Uni Chocoloom</span>
                    <span style="font-size: 12px; color: #e9d5ff; opacity: 0.9;">College Student Store • Chocolates, Cakes & Snacks</span>
                    <span style="background: #ec4899; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px; text-transform: uppercase;">25% OFF</span>
                    <i class="fa-solid fa-arrow-right" style="font-size: 11px; color: #fbbf24;"></i>
                </a>
            </div>

            <!-- App Store Badges -->
            <div class="app-badges-row">
                <a href="#" class="app-badge" onclick="showToast('Downloading Chocoloom on Google Play Store!')">
                    <i class="fa-brands fa-google-play app-badge-icon"></i>
                    <div>
                        <div class="app-badge-sub">GET IT ON</div>
                        <div class="app-badge-title">Google Play</div>
                    </div>
                </a>
                <a href="javascript:void(0)" class="app-badge app-badge-coming-soon" onclick="showToast('Chocoloom iOS App is coming soon to the Apple App Store!', 'fa-brands fa-apple', '#c084fc')">
                    <i class="fa-brands fa-apple app-badge-icon" style="font-size: 26px;"></i>
                    <div>
                        <div class="app-badge-sub">COMING SOON ON</div>
                        <div class="app-badge-title">App Store</div>
                    </div>
                </a>
            </div>

            <!-- Scroll Down Indicator -->
            <a href="#landingShowcaseSection" class="scroll-down-indicator" id="scrollDownBtn">
                <span>Scroll down</span>
                <i class="fa-solid fa-chevron-down scroll-bounce-icon"></i>
            </a>
        </div>
    </section>

    <!-- ==================== 2. SHOWCASE & STATS SECTION (IMAGE 2) ==================== -->
    <section class="showcase-section" id="landingShowcaseSection">
        <!-- Floating Appetizing Food Items with CSS Animation -->
        <div class="floating-food-item float-burger" title="Choco Passion Delight">
            <img src="chocoloom%20desert/WhatsApp%20Image%202026-08-13%20at%2019.27.18.jpeg" alt="Choco Passion Delight">
        </div>
        <div class="floating-food-item float-dimsum" title="Fresh Strawberry Mousse">
            <img src="desserts/WhatsApp%20Image%202026-08-08%20at%2018.04.03.jpeg" alt="Fresh Strawberry Mousse">
        </div>
        <div class="floating-food-item float-pizza" title="Golden Heart Anniversary Cake">
            <img src="Anniversary%20Cakes/Screenshot%202026-08-15%20at%2012.11.50%E2%80%AFPM.png" alt="Anniversary Cake">
        </div>
        <div class="floating-food-item float-choco" title="Teddy Bear Half Birthday Cake">
            <img src="Half%20Birthday%20Cakes/Screenshot%202026-08-15%20at%201.58.59%E2%80%AFPM.png" alt="Half Birthday Cake">
        </div>
        <div class="floating-food-item float-tomato-1">
            <div class="food-particle">🍅</div>
        </div>
        <div class="floating-food-item float-tomato-2">
            <div class="food-particle">🍃</div>
        </div>

        <!-- Center Value Proposition -->
        <div class="container showcase-content">
            <h2 class="showcase-title">Better food for<br>more people</h2>
            <p class="showcase-description">
                For over a decade, we’ve enabled our customers to discover new tastes, artisan desserts, and gourmet cuisines, delivered right to their doorstep.
            </p>

            <!-- Order Now CTA Redirecting to order.html (Image 3) -->
            <div style="margin: 32px 0 48px;">
                <a href="<?php echo home_url('/'); ?>" class="showcase-order-btn">
                    <span>ORDER NOW</span>
                    <i class="fa-solid fa-utensils"></i>
                </a>
            </div>

            <!-- Stats Bar Pill -->
            <div class="stats-bar-card">
                <div class="stat-item">
                    <div class="stat-num-box">
                        <span class="stat-num">3,00,000+</span>
                        <span class="stat-label">restaurants & bakeries</span>
                    </div>
                    <div class="stat-icon-wrapper">
                        <i class="fa-solid fa-store" style="color: #7c5cfc;"></i>
                    </div>
                </div>

                <div class="stat-divider"></div>

                <div class="stat-item">
                    <div class="stat-num-box">
                        <span class="stat-num">800+</span>
                        <span class="stat-label">cities across India</span>
                    </div>
                    <div class="stat-icon-wrapper">
                        <i class="fa-solid fa-location-dot" style="color: #e11d48;"></i>
                    </div>
                </div>

                <div class="stat-divider"></div>

                <div class="stat-item">
                    <div class="stat-num-box">
                        <span class="stat-num">3 billion+</span>
                        <span class="stat-label">orders delivered</span>
                    </div>
                    <div class="stat-icon-wrapper">
                        <i class="fa-solid fa-bag-shopping" style="color: #10b981;"></i>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Landing Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div>
                    <div class="footer-brand" style="display: flex; align-items: center; gap: 10px;">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/logo.png" alt="Chocoloom Logo" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover; box-shadow: 0 4px 10px rgba(124, 92, 252, 0.4);">
                        <span>chocoloom</span>
                        <span style="font-size: 11px; font-weight: 700; background: #7c5cfc; color: #fff; padding: 2px 6px; border-radius: 4px;">OFFICIAL</span>
                    </div>
                    <p class="footer-tagline">
                        Order delicious meals, artisanal desserts, and daily grocery essentials with superfast lightning delivery across top cities in India.
                    </p>
                    <div style="font-size: 13px; color: #64748b;">© 2026 Chocoloom Technologies Pvt. Ltd. All rights reserved.</div>
                </div>
                <div>
                    <h4 class="footer-heading">Company</h4>
                    <ul class="footer-links">
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">Chocoloom Corporate</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Team & Culture</a></li>
                        <li><a href="<?php echo home_url('/'); ?>">Order Online</a></li>
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
                        <li><a href="<?php echo home_url('/'); ?>">Bhimavaram Town</a></li>
                        <li><a href="<?php echo home_url('/'); ?>">SRKR Campus (Chinna Amiram)</a></li>
                        <li><a href="<?php echo home_url('/'); ?>">Vishnupur (VITB & SVECW)</a></li>
                        <li><a href="<?php echo home_url('/'); ?>">Balusumudi & Somavaram</a></li>
                        <li><a href="<?php echo home_url('/'); ?>">Palakollu & Undi Road Surroundings</a></li>
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

    <script>
        function showToast(message, icon = 'fa-solid fa-circle-check', color = '#7c5cfc') {
            // Toast notifications removed
        }

        // Automatic Location Detection on Site Load
        async function autoDetectLandingLocation() {
            const chipText = document.getElementById('landingLocText');
            
            // 1. Check if user already has a saved location - return immediately if found!
            const saved = localStorage.getItem('chocoloom_location');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && (parsed.name || parsed.city)) {
                        if (chipText) chipText.textContent = `${parsed.name}, ${parsed.city || ''}`;
                        return; // Zero network delay!
                    }
                } catch (e) {}
            }

            function applyLandingLocation(locName, cityName, fullLoc, showNotification = true) {
                if (chipText) chipText.textContent = `${locName}, ${cityName}`;
                try {
                    localStorage.setItem('chocoloom_location', JSON.stringify(fullLoc));
                } catch (e) {}
                if (showNotification && typeof showToast === 'function') {
                    showToast(`📍 Delivering to ${locName}, ${cityName}!`, 'fa-solid fa-location-dot', '#10b981');
                }
            }

            // Set instant default while detecting
            if (chipText && chipText.textContent === 'Detecting location...') {
                chipText.textContent = 'SRKR Campus, Bhimavaram';
            }

            // 2. Browser GPS Geolocation (fast non-blocking)
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        try {
                            const geoCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
                            const geoTimer = geoCtrl ? setTimeout(() => geoCtrl.abort(), 6000) : null;
                            let res;
                            try {
                                res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                                    headers: { 'Accept-Language': 'en' },
                                    signal: geoCtrl ? geoCtrl.signal : undefined
                                });
                            } finally {
                                if (geoTimer) clearTimeout(geoTimer);
                            }

                            if (res && res.ok) {
                                const data = await res.json();
                                const addr = data.address || {};
                                const area = data.name || addr.amenity || addr.building || addr.college || addr.suburb || addr.neighbourhood || addr.village || addr.residential || addr.road || 'Current Location';
                                const city = addr.city || addr.town || addr.county || addr.municipality || addr.state_district || 'Bhimavaram';
                                const state = addr.state || 'Andhra Pradesh';
                                applyLandingLocation(area, city, {
                                    id: `loc_gps_${Date.now()}`,
                                    name: area,
                                    city: city,
                                    state: state,
                                    landmark: `Live GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
                                    lat: lat,
                                    lng: lng,
                                    isGPS: true
                                }, false);
                                return;
                            }
                        } catch (e) {}

                        applyLandingLocation('Current Location', 'Bhimavaram', {
                            id: `loc_gps_${Date.now()}`,
                            name: 'Current Location',
                            city: 'Bhimavaram',
                            state: 'Andhra Pradesh',
                            landmark: `GPS Coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                            lat: lat,
                            lng: lng,
                            isGPS: true
                        }, false);
                    },
                    async () => {
                        await detectLandingViaIP();
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                detectLandingViaIP();
            }

            async function detectLandingViaIP() {
                try {
                    const ipCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
                    const ipTimer = ipCtrl ? setTimeout(() => ipCtrl.abort(), 2000) : null;
                    let res;
                    try {
                        res = await fetch('https://ipwho.is/', { signal: ipCtrl ? ipCtrl.signal : undefined });
                    } finally {
                        if (ipTimer) clearTimeout(ipTimer);
                    }

                    if (res && res.ok) {
                        const data = await res.json();
                        if (data.success && data.city) {
                            applyLandingLocation(data.city, data.region || data.country, {
                                id: `loc_ip_${Date.now()}`,
                                name: data.city,
                                city: data.region || data.city,
                                state: data.country || 'India',
                                landmark: `Auto IP: ${data.city}`,
                                lat: data.latitude,
                                lng: data.longitude,
                                isIP: true
                            }, false);
                            return;
                        }
                    }
                } catch (e) {}

                if (chipText && chipText.textContent === 'Detecting location...') {
                    chipText.textContent = 'SRKR Campus, Bhimavaram';
                }
            }
        }

        document.addEventListener('DOMContentLoaded', autoDetectLandingLocation);
    </script>
<?php wp_footer(); ?>
</body>
</html>
