<?php
/**
 * Template Name: Chocoloom Login & Account
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <!-- Progressive Web App & Chrome Mobile App Installability -->
    <link rel="manifest" href="<?php echo get_template_directory_uri(); ?>/manifest.json">
    <meta name="theme-color" content="#7c5cfc">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Chocoloom">
    <meta name="application-name" content="Chocoloom">
    <link rel="apple-touch-icon" href="<?php echo get_template_directory_uri(); ?>/assets/icons/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="192x192" href="<?php echo get_template_directory_uri(); ?>/assets/icons/icon-192x192.png">
    <link rel="apple-touch-icon" sizes="512x512" href="<?php echo get_template_directory_uri(); ?>/assets/icons/icon-512x512.png">
    <link rel="icon" type="image/png" sizes="192x192" href="<?php echo get_template_directory_uri(); ?>/assets/icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="<?php echo get_template_directory_uri(); ?>/assets/icons/icon-512x512.png">
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/logo.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    
    <?php wp_head(); ?>
    <style>
        body.uber-login-page {
            background: #ffffff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
        }

        .uber-header-strip {
            width: 100%;
            background: #ffffff;
            border-bottom: 1px solid #f1f5f9;
            padding: 16px 36px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 14px;
        }

        .uber-header-back-btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #f1f5f9;
            border: none;
            color: #0f172a;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s ease;
        }

        .uber-header-back-btn:hover {
            background: #e2e8f0;
            transform: translateX(-2px);
        }

        .uber-header-brand-logo {
            height: 36px;
            width: auto;
            object-fit: contain;
        }

        .uber-auth-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 28px 20px 48px;
            box-sizing: border-box;
            width: 100%;
        }

        .uber-auth-card {
            width: 100%;
            max-width: 440px;
            background: #ffffff;
            border-radius: 24px;
            padding: 34px 32px 30px;
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
            box-sizing: border-box;
            position: relative;
        }

        .auth-mode-tabs {
            display: flex;
            background: #f1f5f9;
            padding: 4px;
            border-radius: 12px;
            margin-bottom: 22px;
            gap: 4px;
        }

        .auth-mode-tab {
            flex: 1;
            padding: 9px 12px;
            border: none;
            background: transparent;
            color: #64748b;
            font-weight: 700;
            font-size: 13.5px;
            border-radius: 9px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .auth-mode-tab.active {
            background: #0f172a;
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
        }

        .uber-title {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.4px;
            margin: 0 0 8px;
            line-height: 1.25;
        }

        .uber-sub {
            font-size: 14.5px;
            color: #64748b;
            line-height: 1.45;
            margin: 0 0 22px;
        }

        .uber-phone-box {
            display: flex;
            align-items: center;
            background: #ffffff;
            border: 2px solid #8b5cf6;
            border-radius: 14px;
            padding: 0 16px;
            height: 56px;
            transition: all 0.2s ease;
            box-sizing: border-box;
            margin-bottom: 16px;
        }

        .uber-phone-box:focus-within {
            border-color: #7c5cfc;
            box-shadow: 0 0 0 4px rgba(124, 92, 252, 0.16);
        }

        .uber-country-code {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
            padding-right: 12px;
            margin-right: 12px;
            border-right: 1.5px solid #e2e8f0;
            user-select: none;
        }

        .uber-country-code .flag {
            font-size: 18px;
        }

        .uber-phone-input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 16px;
            font-weight: 600;
            color: #0f172a;
            padding: 0;
        }

        .uber-phone-input::placeholder {
            color: #94a3b8;
            font-weight: 500;
        }

        .passcode-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .passcode-label {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 0;
        }

        .passcode-forgot-link {
            font-size: 12px;
            font-weight: 700;
            color: #7c5cfc;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .passcode-forgot-link:hover {
            text-decoration: underline;
        }

        .uber-otp-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 10px;
        }

        .uber-otp-box {
            flex: 1;
            height: 58px;
            border-radius: 14px;
            border: 1.5px solid #cbd5e1;
            background: #ffffff;
            font-size: 24px;
            font-weight: 800;
            text-align: center;
            color: #0f172a;
            outline: none;
            transition: all 0.2s ease;
            box-sizing: border-box;
        }

        .uber-otp-box:focus {
            border-color: #7c5cfc;
            box-shadow: 0 0 0 3px rgba(124, 92, 252, 0.18);
        }

        .passcode-meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 22px;
            font-size: 12px;
        }

        .passcode-meta-hint {
            color: #64748b;
            font-size: 11.5px;
        }

        .passcode-mask-btn {
            background: none;
            border: none;
            font-size: 12px;
            color: #4b5563;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 0;
        }

        .uber-primary-btn {
            width: 100%;
            height: 52px;
            border-radius: 14px;
            background: #0f172a;
            color: #ffffff;
            font-size: 15px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15);
        }

        .uber-primary-btn:hover {
            background: #1e293b;
            transform: translateY(-1px);
        }

        .create-acc-link-btn {
            background: none;
            border: none;
            color: #7c5cfc;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: underline;
        }

        .uber-terms {
            margin-top: 18px;
            text-align: center;
            font-size: 11.5px;
            color: #64748b;
            line-height: 1.55;
            margin-bottom: 0;
        }

        .uber-terms a {
            color: #64748b;
            text-decoration: underline;
        }

        @media (max-width: 480px) {
            .uber-header-strip {
                padding: 12px 20px;
            }
            .uber-auth-card {
                padding: 24px 18px 22px;
                border-radius: 20px;
                box-shadow: none;
                border: 1px solid #f1f5f9;
            }
            .uber-otp-box {
                height: 52px;
                font-size: 20px;
            }
        }
    </style>
</head>
<body class="uber-login-page">

    <!-- Minimalist Top Header -->
    <header class="uber-header-strip">
        <a href="javascript:void(0)" onclick="goBackToStore()" class="uber-header-back-btn" id="loginBackBtn" title="Back to Store">
            <i class="fa-solid fa-arrow-left"></i>
        </a>
        <a href="<?php echo home_url('/'); ?>" style="display: flex; align-items: center; text-decoration: none;">
            <img src="<?php echo get_template_directory_uri(); ?>/assets/logo.png" alt="Chocoloom Logo" class="uber-header-brand-logo">
        </a>
    </header>

    <!-- Centered Auth Card Container -->
    <main class="uber-auth-wrapper">
        <div class="uber-auth-card">
            <!-- Mode Switcher Tabs (Login / Sign Up) -->
            <div class="auth-mode-tabs" id="authModeTabs">
                <button type="button" class="auth-mode-tab active" id="tabBtnLogin" onclick="openScreen('passcodeStepLogin')">Log In</button>
                <button type="button" class="auth-mode-tab" id="tabBtnSignup" onclick="openScreen('passcodeStepOnboarding')">Sign Up</button>
            </div>

            <!-- ==================== SCREEN 0: ACTIVE ACCOUNT DETAILS (WHEN LOGGED IN) ==================== -->
            <div id="loggedInProfileScreen" class="uber-screen-section" style="display: none;">
                <h1 class="uber-title">Account Details</h1>
                <p class="uber-sub">You are currently signed in to Chocoloom</p>

                <!-- Profile Card -->
                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 20px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0;">
                        <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #7c5cfc, #ec4899); color: #fff; font-size: 20px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(124, 92, 252, 0.3);" id="loggedInAvatar">M</div>
                        <div>
                            <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px;" id="loggedInName">Mohith Kumar</h3>
                            <span id="loggedInRoleBadge" style="display: inline-flex; align-items: center; gap: 5px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11.5px; font-weight: 800; padding: 2px 8px; border-radius: 999px;">
                                <i class="fa-solid fa-graduation-cap"></i> SRKR Student • 25% OFF
                            </span>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #64748b; font-weight: 600;">Mobile</span>
                            <span style="font-weight: 700; color: #0f172a;" id="loggedInPhone">+91 98765 43210</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #64748b; font-weight: 600;">Email</span>
                            <span style="font-weight: 700; color: #0f172a;" id="loggedInEmail">student@srkr.edu.in</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #64748b; font-weight: 600;">Campus</span>
                            <span style="font-weight: 700; color: #0f172a;" id="loggedInCampus">S.R.K.R. Engineering College</span>
                        </div>
                    </div>
                </div>

                <!-- Continue to Store -->
                <button type="button" class="uber-primary-btn" onclick="goBackToStore()" style="margin-top: 0; margin-bottom: 12px;">
                    <span>Continue to Store</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </button>

                <!-- Sign Out & Switch Account -->
                <button type="button" class="uber-alt-btn" onclick="handleLogoutOnLoginPage()" style="color: #dc2626; border-color: #fca5a5; background: #fef2f2; width: 100%; justify-content: center; padding: 12px; border-radius: 12px; font-weight: 700; border: 1.5px solid #fca5a5; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Sign Out & Switch Account</span>
                </button>
            </div>

            <!-- ==================== SCREEN 1: PASSCODE LOGIN ==================== -->
            <div id="passcodeStepLogin" class="uber-screen-section">
                <h1 class="uber-title" id="loginCardTitle">Login with Passcode</h1>
                <p class="uber-sub" id="loginCardSub">Enter your mobile number and 4-digit passcode to sign in</p>

                <form onsubmit="handlePasscodeLoginSubmit(event)" id="passcodeLoginForm">
                    <!-- Mobile Number Box -->
                    <div class="uber-phone-box">
                        <div class="uber-country-code">
                            <span class="flag">🇮🇳</span>
                            <span>+91</span>
                            <i class="fa-solid fa-chevron-down" style="font-size: 10px; color: #9ca3af; margin-left: 2px;"></i>
                        </div>
                        <input type="tel" id="passcodePhoneNumber" class="uber-phone-input" placeholder="98765 43210" maxlength="10" required autocomplete="tel" autofocus>
                    </div>

                    <!-- 4-Digit Passcode Header & Helper -->
                    <div class="passcode-header-row">
                        <label class="passcode-label">
                            <i class="fa-solid fa-shield-halved" style="color: #7c5cfc;"></i>
                            <span>4-Digit Passcode *</span>
                        </label>
                        <a href="https://wa.link/gejgjd" target="_blank" rel="noopener noreferrer" class="passcode-forgot-link">
                            <i class="fa-brands fa-whatsapp" style="color: #25d366; font-size: 13px;"></i>
                            <span>Forgot Passcode?</span>
                        </a>
                    </div>

                    <!-- 4 Tactile Passcode Digits Box -->
                    <div class="uber-otp-row">
                        <input type="password" maxlength="1" class="uber-otp-box passcode-box" id="passD1" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                        <input type="password" maxlength="1" class="uber-otp-box passcode-box" id="passD2" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                        <input type="password" maxlength="1" class="uber-otp-box passcode-box" id="passD3" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                        <input type="password" maxlength="1" class="uber-otp-box passcode-box" id="passD4" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                    </div>

                    <!-- Mask Toggle & Security Note -->
                    <div class="passcode-meta-row">
                        <span class="passcode-meta-hint">Enter your 4-digit security PIN</span>
                        <button type="button" onclick="togglePasscodeMask()" class="passcode-mask-btn" id="passcodeMaskToggleBtn">
                            <i class="fa-regular fa-eye"></i> <span>Show Passcode</span>
                        </button>
                    </div>

                    <!-- Primary Continue Button -->
                    <button type="submit" class="uber-primary-btn" id="passcodeLoginSubmitBtn">
                        <span>Log In with Passcode</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </form>

                <!-- Create Account Link -->
                <div style="text-align: center; margin-top: 18px;">
                    <button type="button" onclick="openScreen('passcodeStepOnboarding')" class="create-acc-link-btn">
                        New to Chocoloom? Create Account & Set Passcode
                    </button>
                </div>

                <!-- Terms Footer -->
                <p class="uber-terms">
                    By continuing, you agree to Chocoloom's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.<br>
                    SRKR Engineering College students automatically receive a flat 25% campus discount!
                </p>
            </div>

            <!-- Compatibility elements -->
            <div id="otpStepPhone" style="display: none;"></div>
            <div id="otpStepVerify" style="display: none;"></div>

            <!-- ==================== SCREEN 2: FIRST-TIME USER FULL DETAILS ONBOARDING (SIGN UP) ==================== -->
            <div id="passcodeStepOnboarding" class="uber-screen-section" style="display: none;">
                <h1 class="uber-title">Create Account</h1>
                <p class="uber-sub">Set your 4-digit passcode & details to register</p>

                <form onsubmit="completePasscodeOnboarding(event)" id="passcodeOnboardingForm">
                    <!-- Mobile Number -->
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Mobile Number *</label>
                        <div class="uber-phone-box" style="height: 48px; padding: 0 14px; margin-bottom: 0;">
                            <div class="uber-country-code" style="margin-right: 8px; border-right: 1.5px solid #e2e8f0; padding-right: 8px;">
                                <span class="flag">🇮🇳</span>
                                <span>+91</span>
                            </div>
                            <input type="tel" id="onboardingPhoneNumber" class="uber-phone-input" style="font-size: 15px;" placeholder="98765 43210" maxlength="10" required autocomplete="tel" oninput="checkOnboardingPhoneRegistered(this)">
                        </div>
                        <div id="onboardingPhoneNotice" style="display: none; font-size: 11.5px; margin-top: 5px; font-weight: 700;"></div>
                    </div>

                    <!-- Set 4-Digit Passcode -->
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Set 4-Digit Passcode *</label>
                        <div class="uber-phone-box" style="height: 48px; padding: 0 14px; margin-bottom: 0; position: relative;">
                            <input type="password" id="otpNewUserPassword" class="uber-phone-input" style="font-size: 15px; padding-right: 32px; letter-spacing: 2px;" placeholder="Create 4-digit PIN" maxlength="4" inputmode="numeric" pattern="[0-9]*" required autocomplete="new-password" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 4)">
                            <button type="button" class="auth-pw-toggle" onclick="togglePasswordVisibility('otpNewUserPassword', this)" style="position: absolute; right: 12px; background: none; border: none; color: #9ca3af; cursor: pointer;">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Full Name -->
                    <div style="margin-bottom: 10px;">
                        <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Full Name *</label>
                        <div class="uber-phone-box" style="height: 48px; padding: 0 14px; margin-bottom: 0;">
                            <input type="text" id="otpNewUserName" class="uber-phone-input" style="font-size: 15px;" placeholder="Mohith Kumar" required autocomplete="name">
                        </div>
                    </div>

                    <!-- Email Address -->
                    <div style="margin-bottom: 10px;">
                        <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Email Address *</label>
                        <div class="uber-phone-box" style="height: 48px; padding: 0 14px; margin-bottom: 0;">
                            <input type="email" id="otpNewUserEmail" class="uber-phone-input" style="font-size: 15px;" placeholder="name@example.com" required autocomplete="email">
                        </div>
                    </div>

                    <!-- Delivery Address (Compulsory) -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <label style="font-size: 12px; font-weight: 700; color: #374151;">Delivery Address * <span style="color: #dc2626; font-size: 11px; font-weight: 800;">(Compulsory)</span></label>
                            <span style="font-size: 10.5px; color: #7c5cfc; font-weight: 700; background: #f3e8ff; padding: 2px 7px; border-radius: 999px;">Bhimavaram only</span>
                        </div>
                        <div class="uber-phone-box" style="height: 48px; padding: 0 14px; margin-bottom: 0;">
                            <input type="text" id="otpNewUserAddress" class="uber-phone-input" style="font-size: 14px;" placeholder="only Bhimavaram , surroundings" required>
                        </div>
                    </div>

                    <!-- SRKR College Student Perk -->
                    <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 12px 14px; margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; margin-bottom: 6px;">
                            <div style="font-size: 13px; font-weight: 800; color: #14532d;">
                                <i class="fa-solid fa-graduation-cap"></i> I am a College Student
                            </div>
                            <input type="checkbox" id="otpNewUserIsStudent" checked onchange="document.getElementById('otpCollegeSelectWrapper').style.display = this.checked ? 'block' : 'none'" style="width: 18px; height: 18px; accent-color: #16a34a; cursor: pointer;">
                        </label>
                        <div id="otpCollegeSelectWrapper">
                            <select id="otpNewUserCollegeSelect" style="width: 100%; border-radius: 8px; border: 1px solid #86efac; padding: 8px 10px; font-size: 12px; background: #fff; outline: none; cursor: pointer;">
                                <option value="col_srkr" selected>S.R.K.R. Engineering College (SRKR) - Active (25% OFF)</option>
                                <option value="col_vishnu">Vishnu Engineering College (Bhimavaram)</option>
                                <option value="col_gitam">GITAM University</option>
                                <option value="col_andhra">Andhra University</option>
                                <option value="col_other">Other College / University</option>
                            </select>
                            <div style="font-size: 11px; color: #166534; margin-top: 4px; font-weight: 600;">
                                ⚡ Unlocks automatic 25% discount on all campus deliveries!
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="uber-primary-btn" id="onboardingSubmitBtn">
                        <span>Save Profile & Start Ordering</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </form>

                <!-- Switch back to Login -->
                <div style="text-align: center; margin-top: 18px;">
                    <button type="button" onclick="openScreen('passcodeStepLogin')" class="create-acc-link-btn">
                        Already have an account? Log In with Passcode
                    </button>
                </div>
            </div>

            <!-- Compatibility alias for otpStepNewUserName -->
            <div id="otpStepNewUserName" style="display: none;"></div>

        </div>
    </main>

    <!-- Supabase SDK & Core Engine -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <?php wp_footer(); ?>

    <script>
        // Screen Navigation Controller
        function openScreen(screenId) {
            const allScreens = [
                'loggedInProfileScreen',
                'passcodeStepLogin',
                'passcodeStepOnboarding',
                'otpStepPhone',
                'otpStepVerify',
                'otpStepNewUserName'
            ];
            allScreens.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            // Map old screen names if passed
            let mappedId = screenId;
            if (screenId === 'otpStepPhone' || screenId === 'otpStepVerify') mappedId = 'passcodeStepLogin';
            if (screenId === 'otpStepNewUserName') mappedId = 'passcodeStepOnboarding';

            const target = document.getElementById(mappedId);
            if (target) {
                target.style.display = 'block';

                // Update tabs active state
                const tabLogin = document.getElementById('tabBtnLogin');
                const tabSignup = document.getElementById('tabBtnSignup');
                const tabsWrapper = document.getElementById('authModeTabs');
                if (tabsWrapper) {
                    if (mappedId === 'loggedInProfileScreen') {
                        tabsWrapper.style.display = 'none';
                    } else {
                        tabsWrapper.style.display = 'flex';
                        if (mappedId === 'passcodeStepLogin') {
                            if (tabLogin) tabLogin.className = 'auth-mode-tab active';
                            if (tabSignup) tabSignup.className = 'auth-mode-tab';
                        } else if (mappedId === 'passcodeStepOnboarding') {
                            if (tabSignup) tabSignup.className = 'auth-mode-tab active';
                            if (tabLogin) tabLogin.className = 'auth-mode-tab';
                        }
                    }
                }

                // Focus first input
                setTimeout(() => {
                    const firstInput = target.querySelector('input:not([type="checkbox"]):not([type="radio"])');
                    if (firstInput) firstInput.focus();
                }, 100);
            }
        }

        // Back to Login Step Helper
        window.backToPhoneStep = function() {
            openScreen('passcodeStepLogin');
        };

        // Redirect Target Management
        function getRedirectTarget() {
            try {
                const params = new URLSearchParams(window.location.search);
                let redirect = params.get('redirect');
                if (redirect) {
                    redirect = decodeURIComponent(redirect);
                    if (redirect.endsWith('.html')) redirect = redirect.replace(/\.html$/, '');
                    if (redirect === 'index' || redirect === 'index.html' || redirect === '/' || redirect === 'cart' || redirect === 'order' || redirect === 'order.html') {
                        return '<?php echo chocoloom_get_page_url('order'); ?>?openCart=true';
                    }
                    if (redirect.includes('uni-chocoloom')) return '<?php echo chocoloom_get_page_url('uni-chocoloom'); ?>?openCart=true';
                    if (redirect.includes('openOrders') || redirect.includes('openCart')) return redirect;
                    return redirect.includes('?') ? (redirect + '&openCart=true') : (redirect + '?openCart=true');
                }
            } catch (e) {}
            return '<?php echo chocoloom_get_page_url('order'); ?>?openCart=true';
        }

        window.getRedirectTarget = getRedirectTarget;

        function goBackToStore() {
            const target = getRedirectTarget();
            window.location.href = (typeof window.getAppUrl === 'function') ? window.getAppUrl(target) : target;
        }
        window.goBackToStore = goBackToStore;

        // Check active session on load
        function checkLoggedInStateOnPage() {
            let u = (window.AppState && window.AppState.currentUser) || null;
            if (!u) {
                try {
                    const raw = localStorage.getItem('chocoloom_user_session');
                    if (raw) {
                        u = JSON.parse(raw);
                        if (window.AppState) window.AppState.currentUser = u;
                    }
                } catch(e) {}
            }
            if (u && (u.phone || u.name)) {
                const nameEl = document.getElementById('loggedInName');
                const phoneEl = document.getElementById('loggedInPhone');
                const emailEl = document.getElementById('loggedInEmail');
                const avatarEl = document.getElementById('loggedInAvatar');
                const campusEl = document.getElementById('loggedInCampus');
                const roleEl = document.getElementById('loggedInRoleBadge');

                if (nameEl) nameEl.textContent = u.name || 'User';
                const cleanPhone = (u.phone || '').replace(/^91/, '');
                if (phoneEl) phoneEl.textContent = cleanPhone ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : 'Not linked';
                if (emailEl) emailEl.textContent = u.email || 'Not provided';
                if (avatarEl) avatarEl.textContent = (u.name || 'U').charAt(0).toUpperCase();
                if (campusEl) campusEl.textContent = u.isStudent ? 'S.R.K.R. Engineering College' : 'General Customer';
                if (roleEl) {
                    roleEl.innerHTML = u.isStudent ? '<i class="fa-solid fa-graduation-cap"></i> SRKR Student • 25% OFF' : '<i class="fa-solid fa-user"></i> Member';
                }

                // Show ONLY the profile screen
                openScreen('loggedInProfileScreen');
                return true;
            }
            return false;
        }
        window.checkLoggedInStateOnPage = checkLoggedInStateOnPage;

        function handleLogoutOnLoginPage() {
            if (typeof handleUserLogout === 'function') {
                handleUserLogout();
            }
            openScreen('passcodeStepLogin');
            if (typeof showToast === 'function') {
                showToast('Signed out. You can now log in with another account.', 'fa-solid fa-arrow-right-from-bracket', '#64748b');
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            const target = getRedirectTarget();
            const backBtn = document.getElementById('loginBackBtn');
            if (backBtn) {
                if (target.includes('uni-chocoloom')) backBtn.title = 'Back to Uni Chocoloom';
                else if (target.includes('order')) backBtn.title = 'Back to Bakery Menu';
                else backBtn.title = 'Back to Store';
            }

            // If user is already logged in, show their account details screen
            if (checkLoggedInStateOnPage()) {
                return;
            }

            // Check if arriving via signup intent
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('tab') === 'signup' || window.location.hash === '#signup') {
                openScreen('passcodeStepOnboarding');
            } else {
                openScreen('passcodeStepLogin');
            }

            // Initialize 4-digit passcode tactile auto-tabbing & paste
            if (typeof setupPasscodeInputs === 'function') {
                setupPasscodeInputs();
            }
        });

        // Intercept closeAuthModal on dedicated page to redirect to source
        const origClose = window.closeAuthModal;
        window.closeAuthModal = function() {
            if (window.AppState && window.AppState.currentUser) {
                setTimeout(() => {
                    const target = getRedirectTarget();
                    window.location.href = (typeof window.getAppUrl === 'function') ? window.getAppUrl(target) : target;
                }, 750);
            } else if (typeof origClose === 'function') {
                origClose();
            }
        };
    </script>
    <script src="<?php echo get_template_directory_uri(); ?>/pwa.js" defer></script>
</body>
</html>
