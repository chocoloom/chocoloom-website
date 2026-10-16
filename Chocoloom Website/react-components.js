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
        const [flavour, setFlavour] = useState(props.initialFlavour || 'Dutch Truffle Classic');
        const [message, setMessage] = useState('');
        const [addedAnim, setAddedAnim] = useState(false);

        const weights = [
            { key: 'half_kg', label: '0.5 kg', serves: '2-4 Guests', icon: '🎂' },
            { key: '1kg', label: '1.0 kg', serves: '6-8 Guests', icon: '🎉' },
            { key: '1_5kg', label: '1.5 kg', serves: '10-12 Guests', icon: '✨' },
            { key: '3kg', label: '3.0 kg', serves: '20+ Grand Celebration', icon: '🏆' }
        ];

        const normalFlavoursList = [
            { id: 'vanilla', name: 'Vanilla', icon: '🍦', tag: 'Classic' },
            { id: 'butterscotch', name: 'Butterscotch', icon: '🧈', tag: 'Crunch' },
            { id: 'strawberry', name: 'Strawberry', icon: '🍓', tag: 'Fresh' },
            { id: 'pineapple', name: 'Pineapple', icon: '🍍', tag: 'Tropical' },
            { id: 'chocolate', name: 'Chocolate', icon: '🍫', tag: 'Signature' }
        ];

        const coolingFlavoursList = [
            { id: 'vanilla', name: 'Vanilla', icon: '🍦', tag: 'Classic' },
            { id: 'butterscotch', name: 'Butterscotch', icon: '🧈', tag: 'Crunch' },
            { id: 'strawberry', name: 'Strawberry', icon: '🍓', tag: 'Fresh' },
            { id: 'pineapple', name: 'Pineapple', icon: '🍍', tag: 'Tropical' },
            { id: 'blueberry', name: 'Blueberry', icon: '🫐', tag: 'Berry' },
            { id: 'black_currant', name: 'Black Currant', icon: '🍇', tag: 'Berry' },
            { id: 'chocolate', name: 'Chocolate', icon: '🍫', tag: 'Signature' },
            { id: 'black_forest', name: 'Black Forest', icon: '🍒', tag: 'Classic' },
            { id: 'milk_badam', name: 'Milk Badam', icon: '🥛', tag: 'Royal' },
            { id: 'honey_almond', name: 'Honey Almond', icon: '🍯', tag: 'Gourmet' },
            { id: 'red_velvet', name: 'Red Velvet', icon: '❤️', tag: 'Luxe' },
            { id: 'white_forest', name: 'White Forest', icon: '🍰', tag: 'Delight' },
            { id: 'caramel', name: 'Caramel', icon: '🍮', tag: 'Sweet' },
            { id: 'milky_butterscotch', name: 'Milky Butterscotch', icon: '🍨', tag: 'Creamy' },
            { id: 'nutty_bubble', name: 'Nutty Bubble', icon: '🫧', tag: 'Special' }
        ];

        const activeFlavoursList = isCooling ? coolingFlavoursList : normalFlavoursList;

        const handleToggleCooling = (newCooling) => {
            setIsCooling(newCooling);
            const targetList = newCooling ? coolingFlavoursList : normalFlavoursList;
            if (!targetList.some(f => f.name.toLowerCase() === flavour.toLowerCase())) {
                setFlavour('Chocolate');
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
            if (dish && dish.flavour_prices && typeof dish.flavour_prices === 'object') {
                if (dish.flavour_prices[flavour] !== undefined) return Number(dish.flavour_prices[flavour]) || 0;
                const fKey = flavour.toLowerCase().replace(/\s+/g, '_');
                if (dish.flavour_prices[fKey] !== undefined) return Number(dish.flavour_prices[fKey]) || 0;
            }
            return 0;
        }, [flavour, dish]);

        const egglessPrice = isEggless ? (weightKey === 'half_kg' ? 30 : 50) : 0;

        const totalPrice = Math.round(basePrice + coolingPrice + flavourPrice + egglessPrice);

        const handleAddToCart = () => {
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
                            e('div', { style: { fontSize: '10px', color: isSelected ? '#7c5cfc' : '#94a3b8', marginTop: '2px' } }, w.serves)
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
            dish.has_flavours !== false && e('div', { style: { marginBottom: '18px' } },
                e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } },
                    e('span', { style: { fontSize: '13px', fontWeight: '800', color: '#1e293b' } }, '🍫 Choose Cake Flavour'),
                    e('span', {
                        style: {
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isCooling ? '#e0f2fe' : '#fdf2f8',
                            color: isCooling ? '#0284c7' : '#db2777'
                        }
                    }, isCooling ? '❄️ 15 Cooling Flavours' : '🎂 5 Normal Flavours')
                ),
                e('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' } },
                    activeFlavoursList.map(f => {
                        const isSelected = flavour.toLowerCase() === f.name.toLowerCase();
                        return e('div', {
                            key: f.name,
                            onClick: () => setFlavour(f.name),
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 10px',
                                borderRadius: '10px',
                                border: isSelected ? '1.5px solid #7c5cfc' : '1px solid #f1f5f9',
                                background: isSelected ? '#faf5ff' : '#f8fafc',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }
                        },
                            e('span', { style: { fontSize: '16px' } }, f.icon || '🎂'),
                            e('div', { style: { flex: 1, minWidth: 0 } },
                                e('div', { style: { fontSize: '12px', fontWeight: isSelected ? '800' : '600', color: isSelected ? '#6b21a8' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, f.name),
                                e('div', { style: { fontSize: '10px', color: isSelected ? '#7c5cfc' : '#94a3b8' } }, f.tag)
                            ),
                            e('input', {
                                type: 'radio',
                                name: 'reactFlavourPicker',
                                checked: isSelected,
                                readOnly: true,
                                style: { accentColor: '#7c5cfc' }
                            })
                        );
                    })
                )
            ),

            // Section 4: Live Message Preview on Cake Icing
            e('div', { style: { marginBottom: '20px' } },
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

            // Footer with Live React Price and Add to Cart
            e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f1f5f9' } },
                e('div', null,
                    e('div', { style: { fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' } }, 'Customized Total'),
                    e('div', { style: { fontSize: '22px', fontWeight: '900', color: '#0f172a' } }, `₹${totalPrice}`)
                ),
                e('button', {
                    type: 'button',
                    onClick: handleAddToCart,
                    style: {
                        background: addedAnim ? '#16a34a' : 'linear-gradient(135deg, #7c5cfc, #6366f1)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 16px rgba(124, 92, 252, 0.3)',
                        transition: 'all 0.2s ease',
                        transform: addedAnim ? 'scale(0.97)' : 'scale(1)'
                    }
                },
                    e('i', { className: addedAnim ? 'fa-solid fa-check' : 'fa-solid fa-cart-plus' }),
                    e('span', null, addedAnim ? 'ADDED TO CART!' : 'ADD CUSTOM CAKE')
                )
            )
        );
    }

    // ==========================================
    // 2. REACT LIVE FLOATING CART STATUS ISLAND (Disabled to prevent duplicate View Cart button)
    // ==========================================
    function ReactCartIsland() {
        // Chocoloom's primary #floatingCartBar handles the unified Swiggy/Zomato bottom cart preview bar.
        return null;
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
            return null;
        }
    };

})(window);
