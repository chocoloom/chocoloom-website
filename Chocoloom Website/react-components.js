/**
 * Chocoloom Official React 18 Interactive Component Suite
 * Progressive React islands for Custom Cake Studio, Dynamic Pricing, and Realtime Cart
 */
(function(window) {
    'use strict';

    // Verify React runtime availability
    if (typeof window.React === 'undefined' || typeof window.ReactDOM === 'undefined') {
        console.warn('Chocoloom React: React or ReactDOM is not loaded yet.');
        return;
    }

    const { createElement: e, useState, useEffect, useMemo } = window.React;
    const { createRoot } = window.ReactDOM;

    // Helper for asset URLs
    const getAsset = function(path) {
        return (typeof window.getThemeAssetUrl === 'function') ? window.getThemeAssetUrl(path) : path;
    };

    // ==========================================
    // 1. REACT INTERACTIVE CAKE CUSTOMIZER STUDIO
    // ==========================================
    function ReactCakeCustomizer(props) {
        const dish = props.dish || {};
        const onAdd = props.onAdd || window.confirmAddCustomizedItem;
        const onClose = props.onClose || window.closeCustomizationModal;

        const [weightKey, setWeightKey] = useState(props.initialWeightKey || 'half_kg');
        const [isCooling, setIsCooling] = useState(Boolean(props.initialCooling));
        const [isEggless, setIsEggless] = useState(Boolean(props.initialEggless));
        const autoInitialFlavour = props.initialFlavour || ((typeof window.detectDefaultFlavour === 'function') ? window.detectDefaultFlavour(dish, !props.initialCooling) : 'Chocolate');
        const [flavour, setFlavour] = useState(autoInitialFlavour);
        const [message, setMessage] = useState('');
        const [addedAnim, setAddedAnim] = useState(false);

        const weights = [
            { key: 'half_kg', label: '0.5 kg', serves: '2-4 Guests', icon: '🎂' },
            { key: '1kg', label: '1.0 kg', serves: '6-8 Guests', icon: '🎉' },
            { key: '1_5kg', label: '1.5 kg', serves: '10-12 Guests', icon: '✨' },
            { key: '2kg', label: '2.0 kg', serves: '16-18 Guests', icon: '👑' },
            { key: '3kg', label: '3.0 kg', serves: '20+ Grand Celebration', icon: '🏆' }
        ];

        const normalFlavoursList = [
            { id: 'vanilla', name: 'Vanilla', icon: '🍦', tag: 'Classic', extraPrice: 0, tier: 'Classic' },
            { id: 'butterscotch', name: 'Butterscotch', icon: '🧈', tag: 'Crunch', extraPrice: 0, tier: 'Classic' },
            { id: 'strawberry', name: 'Strawberry', icon: '🍓', tag: 'Fresh', extraPrice: 50, tier: 'Deluxe' },
            { id: 'pineapple', name: 'Pineapple', icon: '🍍', tag: 'Tropical', extraPrice: 0, tier: 'Classic' },
            { id: 'chocolate', name: 'Chocolate', icon: '🍫', tag: 'Signature', extraPrice: 0, tier: 'Classic' }
        ];

        const coolingFlavoursList = [
            { id: 'vanilla', name: 'Vanilla', icon: '🍦', tag: 'Classic', extraPrice: 0, tier: 'Classic' },
            { id: 'butterscotch', name: 'Butterscotch', icon: '🧈', tag: 'Crunch', extraPrice: 0, tier: 'Classic' },
            { id: 'strawberry', name: 'Strawberry', icon: '🍓', tag: 'Fresh', extraPrice: 50, tier: 'Deluxe' },
            { id: 'pineapple', name: 'Pineapple', icon: '🍍', tag: 'Tropical', extraPrice: 0, tier: 'Classic' },
            { id: 'blueberry', name: 'Blueberry', icon: '🫐', tag: 'Berry', extraPrice: 50, tier: 'Deluxe' },
            { id: 'black_currant', name: 'Black Currant', icon: '🍇', tag: 'Berry', extraPrice: 50, tier: 'Deluxe' },
            { id: 'chocolate', name: 'Chocolate', icon: '🍫', tag: 'Signature', extraPrice: 0, tier: 'Classic' },
            { id: 'black_forest', name: 'Black Forest', icon: '🍒', tag: 'Classic', extraPrice: 0, tier: 'Classic' },
            { id: 'milk_badam', name: 'Milk Badam', icon: '🥛', tag: 'Royal', extraPrice: 100, tier: 'Royal' },
            { id: 'honey_almond', name: 'Honey Almond', icon: '🍯', tag: 'Gourmet', extraPrice: 100, tier: 'Royal' },
            { id: 'red_velvet', name: 'Red Velvet', icon: '❤️', tag: 'Luxe', extraPrice: 50, tier: 'Deluxe' },
            { id: 'white_forest', name: 'White Forest', icon: '🍰', tag: 'Delight', extraPrice: 0, tier: 'Classic' },
            { id: 'caramel', name: 'Caramel', icon: '🍮', tag: 'Sweet', extraPrice: 50, tier: 'Deluxe' },
            { id: 'milky_butterscotch', name: 'Milky Butterscotch', icon: '🍨', tag: 'Creamy', extraPrice: 50, tier: 'Deluxe' },
            { id: 'nutty_bubble', name: 'Nutty Bubble', icon: '🫧', tag: 'Special', extraPrice: 100, tier: 'Royal' }
        ];

        const activeFlavoursList = isCooling ? coolingFlavoursList : normalFlavoursList;

        const handleToggleCooling = (newCooling) => {
            setIsCooling(newCooling);
            const targetList = newCooling ? coolingFlavoursList : normalFlavoursList;
            if (flavour && !targetList.some(f => f.name.toLowerCase() === flavour.toLowerCase())) {
                const newDefault = (typeof window.detectDefaultFlavour === 'function') ? window.detectDefaultFlavour(dish, !newCooling) : 'Chocolate';
                setFlavour(newDefault);
            }
        };

        // Dynamic price calculation
        const basePrice = useMemo(() => {
            const hasWeight = dish.has_weight !== false;
            if (!hasWeight) return Number(dish.price || 499);
            const priceMap = {
                'half_kg': Number(dish.price_half_kg || dish.price || 499),
                '1kg': Number(dish.price_1kg || (dish.price ? dish.price * 1.85 : 899)),
                '1_5kg': Number(dish.price_1_5kg || (dish.price ? dish.price * 2.7 : 1299)),
                '2kg': Number(dish.price_2kg || (dish.price ? dish.price * 3.5 : 1699)),
                '3kg': Number(dish.price_3kg || (dish.price ? dish.price * 5.0 : 2399))
            };
            return priceMap[weightKey] || 499;
        }, [dish, weightKey]);

        const coolingPrice = useMemo(() => {
            if (!isCooling || dish.has_cooling === false) return 0;
            const coolingMap = { 'half_kg': 40, '1kg': 70, '1_5kg': 90, '2kg': 120, '3kg': 160 };
            return coolingMap[weightKey] || 40;
        }, [isCooling, dish, weightKey]);

        const flavourPrice = useMemo(() => {
            if (!flavour) return 0;
            if (typeof window.getFlavourExtraPrice === 'function') {
                return window.getFlavourExtraPrice(dish, flavour, weightKey);
            }
            if (dish && dish.flavour_prices && typeof dish.flavour_prices === 'object') {
                if (dish.flavour_prices[flavour] !== undefined) return Number(dish.flavour_prices[flavour]) || 0;
                const fKey = flavour.toLowerCase().replace(/\s+/g, '_');
                if (dish.flavour_prices[fKey] !== undefined) return Number(dish.flavour_prices[fKey]) || 0;
            }
            const activeItem = activeFlavoursList.find(f => f.name.toLowerCase() === flavour.toLowerCase());
            return (activeItem && activeItem.extraPrice) ? Number(activeItem.extraPrice) : 0;
        }, [flavour, dish, activeFlavoursList, weightKey]);

        const egglessPrice = isEggless ? (weightKey === 'half_kg' ? 30 : 50) : 0;

        const totalPrice = Math.round(basePrice + coolingPrice + flavourPrice + egglessPrice);

        const hasFlavours = dish.has_flavours !== false;
        const isFlavourChosen = !hasFlavours || Boolean(flavour);

        const handleAddToCart = () => {
            if (!isFlavourChosen) {
                if (typeof window.showToast === 'function') {
                    window.showToast('Please select a cake flavour before adding to cart!', 'fa-solid fa-wand-magic-sparkles', '#ef4444');
                }
                const sec = document.getElementById('reactFlavoursSection');
                if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            setAddedAnim(true);
            setTimeout(() => setAddedAnim(false), 1000);

            // Update global AppState / Customization
            if (typeof window.confirmAddCustomizedItemWithDetails === 'function') {
                window.confirmAddCustomizedItemWithDetails({
                    dish: dish,
                    selectedWeightKey: weightKey,
                    selectedFlavour: flavour,
                    isCooling: isCooling,
                    isEggless: isEggless,
                    customMessage: message,
                    unitPrice: totalPrice
                });
            } else if (typeof onAdd === 'function') {
                onAdd({
                    dish: dish,
                    selectedWeightKey: weightKey,
                    selectedFlavour: flavour,
                    isCooling: isCooling,
                    isEggless: isEggless,
                    customMessage: message,
                    unitPrice: totalPrice
                });
            }
        };

        const dishImg = getAsset(dish.image || 'assets/logo.png');

        return e('div', { className: 'react-cake-studio-card', style: { padding: '16px', background: '#ffffff', borderRadius: '16px' } },
            // Header summary
            e('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' } },
                e('img', {
                    src: dishImg,
                    alt: dish.name || 'Cake',
                    style: { width: '70px', height: '70px', borderRadius: '14px', objectFit: 'cover', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
                    onError: (ev) => { ev.target.src = getAsset('assets/logo.png'); }
                }),
                e('div', { style: { flex: 1 } },
                    e('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' } },
                        e('span', { style: { fontSize: '10px', fontWeight: '800', background: 'rgba(124, 92, 252, 0.1)', color: '#7c5cfc', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase' } },
                            dish.category || 'Artisan Cake'
                        ),
                        e('span', { style: { fontSize: '10px', fontWeight: '800', background: isEggless ? '#dcfce7' : '#fef3c7', color: isEggless ? '#15803d' : '#b45309', padding: '2px 8px', borderRadius: '999px' } },
                            isEggless ? '🌱 100% Eggless' : '🥚 With Egg'
                        )
                    ),
                    e('h3', { style: { margin: '0 0 2px', fontSize: '17px', fontWeight: '800', color: '#0f172a' } }, dish.name || 'Artisan Celebration Cake'),
                    e('div', { style: { fontSize: '12px', color: '#64748b' } }, 'Handcrafted fresh per order in Bhimavaram')
                )
            ),

            // Section 1: Weight Selector
            dish.has_weight !== false && e('div', { style: { marginBottom: '18px' } },
                e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } },
                    e('span', { style: { fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' } },
                        '⚖️ Choose Cake Weight / Size'
                    ),
                    e('span', { style: { fontSize: '11px', color: '#64748b', fontWeight: '600' } }, 'Select portion size')
                ),
                e('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' } },
                    weights.map(w => {
                        const isSelected = weightKey === w.key;
                        return e('button', {
                            key: w.key,
                            type: 'button',
                            onClick: () => setWeightKey(w.key),
                            style: {
                                padding: '10px 8px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid #7c5cfc' : '1.5px solid #e2e8f0',
                                background: isSelected ? 'linear-gradient(135deg, #faf5ff, #f3e8ff)' : '#ffffff',
                                color: isSelected ? '#581c87' : '#334155',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? '0 4px 12px rgba(124, 92, 252, 0.15)' : 'none'
                            }
                        },
                            e('div', { style: { fontSize: '14px', marginBottom: '2px' } }, w.icon),
                            e('div', { style: { fontSize: '13px', fontWeight: '800' } }, w.label),
                            e('div', { style: { fontSize: '10px', color: isSelected ? '#7c5cfc' : '#94a3b8', marginTop: '2px' } }, w.serves),
                            e('div', { style: { fontSize: '11px', fontWeight: '800', color: isSelected ? '#581c87' : '#0f172a', marginTop: '3px' } }, '₹' + ((typeof window.getDishFlavourPrice === 'function' && flavour) ? window.getDishFlavourPrice(dish, flavour, w.key) : ((typeof window.getWeightPrice === 'function') ? window.getWeightPrice(dish, w.key) : Number(dish.price || 499))))
                        );
                    })
                )
            ),

            // Section 2: Preferences (Eggless & Cooling Cake)
            e('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' } },
                // Eggless Card
                e('div', {
                    onClick: () => setIsEggless(!isEggless),
                    style: {
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: isEggless ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                        background: isEggless ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }
                },
                    e('div', null,
                        e('div', { style: { fontSize: '12px', fontWeight: '800', color: isEggless ? '#15803d' : '#334155' } }, '🌱 100% Eggless'),
                        e('div', { style: { fontSize: '10px', color: '#64748b' } }, isEggless ? '+₹30 included' : 'Tap to enable')
                    ),
                    e('input', { type: 'checkbox', checked: isEggless, readOnly: true, style: { accentColor: '#16a34a' } })
                ),

                // Cooling Cake Card
                e('div', {
                    onClick: () => handleToggleCooling(!isCooling),
                    style: {
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: isCooling ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                        background: isCooling ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }
                },
                    e('div', null,
                        e('div', { style: { fontSize: '12px', fontWeight: '800', color: isCooling ? '#0369a1' : '#334155' } }, '❄️ Cooling Cake'),
                        e('div', { style: { fontSize: '10px', color: '#64748b' } }, isCooling ? `+₹${coolingPrice} (15 Flavours)` : 'Tap for Chilled (15 Flavours)')
                    ),
                    e('input', { type: 'checkbox', checked: isCooling, readOnly: true, style: { accentColor: '#0284c7' } })
                )
            ),

            // Section 3: Flavour Selector
            dish.has_flavours !== false && e('div', { id: 'reactFlavoursSection', style: { marginBottom: '18px' } },
                e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } },
                    e('span', { style: { fontSize: '13px', fontWeight: '800', color: '#1e293b' } }, '🍫 Choose Cake Flavour'),
                    e('span', {
                        style: {
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: !flavour ? '#fef2f2' : (isCooling ? '#e0f2fe' : '#fdf2f8'),
                            color: !flavour ? '#dc2626' : (isCooling ? '#0284c7' : '#db2777'),
                            border: !flavour ? '1px solid #fecaca' : 'none'
                        }
                    }, !flavour ? '⚠️ Required: Choose 1 Flavour' : (isCooling ? '❄️ 15 Cooling Flavours' : '🎂 5 Normal Flavours'))
                ),
                !flavour && e('div', {
                    style: {
                        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                        border: '1.5px dashed #f59e0b',
                        borderRadius: '10px',
                        padding: '9px 12px',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#92400e'
                    }
                },
                    e('span', { style: { fontSize: '16px' } }, '👉'),
                    e('span', null, 'Please tap your favourite flavour below to enable Add to Cart!')
                ),
                e('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' } },
                    activeFlavoursList.map(f => {
                        const isSelected = flavour && (flavour.toLowerCase() === f.name.toLowerCase());
                        const fExtra = (typeof window.getFlavourExtraPrice === 'function') 
                            ? window.getFlavourExtraPrice(dish, f.name, weightKey) 
                            : (f.extraPrice || 0);
                        const fTotal = Math.round(basePrice + coolingPrice + fExtra + egglessPrice);
                        return e('div', {
                            key: f.name,
                            onClick: () => setFlavour(f.name),
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 10px',
                                borderRadius: '10px',
                                border: isSelected ? '1.5px solid #7c5cfc' : '1px solid #e2e8f0',
                                background: isSelected ? '#faf5ff' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }
                        },
                            e('span', { style: { fontSize: '18px' } }, f.icon || '🎂'),
                            e('div', { style: { flex: 1, minWidth: 0 } },
                                e('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                                    e('span', { style: { fontSize: '12px', fontWeight: isSelected ? '800' : '700', color: isSelected ? '#6b21a8' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, f.name),
                                    e('span', { style: { fontSize: '9px', fontWeight: '800', padding: '1px 4px', borderRadius: '4px', background: isSelected ? '#f3e8ff' : '#f1f5f9', color: isSelected ? '#7c3aed' : '#64748b' } }, f.tier || f.tag)
                                ),
                                e('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' } },
                                    e('span', { style: { fontSize: '10px', fontWeight: '800', color: fExtra > 0 ? '#db2777' : '#16a34a', background: fExtra > 0 ? '#fdf2f8' : '#dcfce7', padding: '1px 5px', borderRadius: '4px' } }, fExtra > 0 ? `+₹${fExtra}` : 'FREE (+₹0)'),
                                    e('span', { style: { fontSize: '10.5px', fontWeight: '800', color: '#0f172a' } }, `₹${fTotal}`)
                                )
                            ),
                            e('input', {
                                type: 'radio',
                                name: 'reactFlavourPicker',
                                checked: Boolean(isSelected),
                                readOnly: true,
                                style: { accentColor: '#7c5cfc' }
                            })
                        );
                    })
                )
            ),

            // Section 4: Live Message Preview on Cake Icing
            e('div', { style: { marginBottom: '16px' } },
                e('label', { style: { display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' } },
                    '✍️ Message on Cake Icing (Complimentary)'
                ),
                e('input', {
                    type: 'text',
                    value: message,
                    maxLength: 35,
                    placeholder: 'e.g. Happy Birthday Rahul! 🎂',
                    onChange: (ev) => setMessage(ev.target.value),
                    style: {
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }
                }),
                message.trim() && e('div', {
                    style: {
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #fdf4ff, #fae8ff)',
                        border: '1px dashed #d946ef',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#86198f',
                        fontWeight: '700'
                    }
                }, `✨ Preview on Cake: "${message.trim()}"`)
            ),

            // Section 5: Live Price Breakdown with Flavour Included
            e('div', {
                style: {
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginBottom: '16px'
                }
            },
                e('div', { style: { fontSize: '11.5px', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' } },
                    e('span', null, `🎂 Base Cake (${weightKey.replace('_', '.').toUpperCase()}): `, e('strong', { style: { color: '#0f172a' } }, `₹${basePrice}`)),
                    e('span', null, '•'),
                    e('span', null, `✨ Flavour (${flavour || 'None'}): `, e('strong', { style: { color: !flavour ? '#dc2626' : (flavourPrice > 0 ? '#db2777' : '#16a34a') } }, !flavour ? 'Not Selected (Required)' : (flavourPrice > 0 ? `+₹${flavourPrice}` : 'FREE (+₹0)'))),
                    coolingPrice > 0 && e('span', null, '•'),
                    coolingPrice > 0 && e('span', null, '❄️ Cooling: ', e('strong', { style: { color: '#0284c7' } }, `+₹${coolingPrice}`)),
                    egglessPrice > 0 && e('span', null, '•'),
                    egglessPrice > 0 && e('span', null, '🌱 Eggless: ', e('strong', { style: { color: '#16a34a' } }, `+₹${egglessPrice}`))
                ),
                e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '4px', fontSize: '12.5px', fontWeight: '800', color: '#1e293b' } },
                    e('span', null, !flavour ? 'Total Price (Select flavour below):' : `Total Price (with ${flavour} flavour):`),
                    e('span', { style: { fontSize: '16px', fontWeight: '900', color: '#7c5cfc' } }, !flavour ? `₹${totalPrice} + Flavour` : `₹${totalPrice}`)
                )
            ),

            // Footer with Live React Price and Add to Cart
            e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f1f5f9' } },
                e('div', null,
                    e('div', { style: { fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' } }, 'Customized Total'),
                    e('div', { style: { fontSize: '22px', fontWeight: '900', color: '#0f172a' } }, !flavour ? `₹${totalPrice}` : `₹${totalPrice}`)
                ),
                e('button', {
                    type: 'button',
                    disabled: !isFlavourChosen,
                    onClick: handleAddToCart,
                    style: {
                        background: !isFlavourChosen ? '#94a3b8' : (addedAnim ? '#16a34a' : 'linear-gradient(135deg, #7c5cfc, #6366f1)'),
                        color: '#ffffff',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '800',
                        cursor: !isFlavourChosen ? 'not-allowed' : 'pointer',
                        opacity: !isFlavourChosen ? '0.7' : '1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: !isFlavourChosen ? 'none' : '0 4px 16px rgba(124, 92, 252, 0.3)',
                        transition: 'all 0.2s ease',
                        transform: addedAnim ? 'scale(0.97)' : 'scale(1)'
                    }
                },
                    e('i', { className: !isFlavourChosen ? 'fa-solid fa-wand-magic-sparkles' : (addedAnim ? 'fa-solid fa-check' : 'fa-solid fa-cart-plus') }),
                    e('span', null, !isFlavourChosen ? 'CHOOSE A FLAVOUR' : (addedAnim ? 'ADDED TO CART!' : `ADD CUSTOM CAKE • ₹${totalPrice}`))
                )
            )
        );
    }

    // ==========================================
    // 2. REACT LIVE FLOATING CART STATUS ISLAND (Permanently disabled to eliminate duplicate small View Cart pill)
    // ==========================================
    function ReactCartIsland() {
        return null;
    }

    function purgeSmallCartIsland() {
        if (typeof document === 'undefined') return;
        const root = document.getElementById('reactCartIslandRoot');
        if (root) root.remove();
        document.querySelectorAll('[data-react-cart-island]').forEach(el => el.remove());
    }

    // Active immediate and deferred purge
    purgeSmallCartIsland();
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', purgeSmallCartIsland);
        }
        window.addEventListener('load', purgeSmallCartIsland);
    }

    // ==========================================
    // 3. PUBLIC CHOCOLOOM REACT MOUNTING API
    // ==========================================
    window.ChocoloomReact = {
        CakeCustomizer: ReactCakeCustomizer,
        CartIsland: ReactCartIsland,

        mountCakeCustomizer: function(containerId, dishData, onAddCallback) {
            const container = document.getElementById(containerId);
            if (!container) return;
            const root = createRoot(container);
            root.render(e(ReactCakeCustomizer, { dish: dishData, onAdd: onAddCallback }));
            return root;
        },

        mountCartIsland: function(containerId = 'reactCartIslandRoot') {
            purgeSmallCartIsland();
            return null;
        }
    };

})(window);
