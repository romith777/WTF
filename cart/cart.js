let logintoken = localStorage.getItem('login-token');
let username;
console.log(logintoken);
let cartCount = parseInt(localStorage.getItem('cartCount')) || 0;
let cart = JSON.parse(localStorage.getItem('cart')) || {};

// Normalize cart structure - fix the quantity issue
Object.keys(cart).forEach(productId => {
    const item = cart[productId];
    
    // If it's in old array format, fix it
    if (Array.isArray(item)) {
        cart[productId] = { ...item[0], quantity: item.quantity || 1 };
    }
    
    // Ensure quantity exists and is valid
    if (!cart[productId].quantity || cart[productId].quantity < 1) {
        cart[productId].quantity = 1;
    }
});

// Save the corrected cart back
localStorage.setItem('cart', JSON.stringify(cart));

function formatCurrency(priceCents){
    return (priceCents/100).toFixed(2);
}

// Calculate total items in cart
function calculateTotalQuantity(cartObj) {
    let total = 0;
    for (const key in cartObj) {
        total += cartObj[key].quantity || 1;
    }
    return total;
}

// Calculate total price
function calculateTotalPrice(cartObj) {
    let total = 0;
    for (const key in cartObj) {
        const item = cartObj[key];
        total += (item.priceCents || 0) * (item.quantity || 1);
    }
    return total;
}

// Update cart count
function updateCartCount() {
    cartCount = calculateTotalQuantity(cart);
    localStorage.setItem('cartCount', cartCount);
    
    // Update the display
    const countElement = document.querySelector('.js-favourites-count');
    if (countElement) {
        countElement.textContent = localStorage.getItem('favCount') || 0;
    }
}

// Update checkout summary
function updateCheckoutSummary() {
    const itemCount = calculateTotalQuantity(cart);
    const subtotal = calculateTotalPrice(cart);
    const shipping = itemCount > 0 ? 500 : 0; // $5 flat shipping
    const tax = Math.round(subtotal * 0.1); // 10% tax
    const total = subtotal + shipping + tax;
    
    document.getElementById('itemCount').textContent = itemCount;
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('shipping').textContent = formatCurrency(shipping);
    document.getElementById('tax').textContent = formatCurrency(tax);
    document.getElementById('total').textContent = formatCurrency(total);
}

function renderProducts(cartObj){
    let innerHtml = "";
    
    if(!cartObj || Object.keys(cartObj).length === 0){
        console.log("No products found");
        innerHtml = `
            <div class="no-cart-div">
                <div class="no-cart-icon">
                    <img src="../assets/cart-icon.png" alt="cart-img">
                </div>
                <div class="no-cart-text">
                    <h1>Your Cart is Empty</h1>
                    <p>Add some products to get started!</p>
                    <a href="../index.html"><button class="shop-now-btn">Shop Now</button></a>
                </div>
            </div>
        `;
        document.querySelector('.cart-render').innerHTML = innerHtml;
        updateCheckoutSummary();
        return;
    }

    for (const productId in cartObj) {
        const product = cartObj[productId];
        const quantity = product.quantity || 1;
        
        console.log('Rendering:', { productId, product, quantity });
        
        innerHtml += `
            <div class="browse-card js-card-${product.id}">
                <div class="browse-card-img">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="browse-card-information">
                    <div class="browse-card-details">
                        <div class="browse-card-information-area-text">
                            <p class="browse-card-brand">${product.brandName}</p>
                            <p class="browse-card-about">${product.about}</p>
                            <p class="browse-card-price">$${formatCurrency(product.priceCents)}</p>
                        </div>
                    </div>
                    <div class="browse-card-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn minus-btn" data-product-id="${product.id}">−</button>
                            <input type="number" class="quantity-input" value="${quantity}" min="1" data-product-id="${product.id}" readonly>
                            <button class="quantity-btn plus-btn" data-product-id="${product.id}">+</button>
                        </div>
                        <div class="cart-buttons">
                            <button class="remove-product-cart-button" data-product-id="${product.id}">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    document.querySelector(".cart-render").innerHTML = innerHtml;
    
    // Re-attach event listeners after rendering
    attachQuantityListeners();
    attachRemoveListeners();
    updateCheckoutSummary();
}

function attachQuantityListeners() {
    // Plus buttons
    document.querySelectorAll('.plus-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.productId;
            if (cart[productId]) {
                cart[productId].quantity++;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                renderProducts(cart);
            }
        });
    });
    
    // Minus buttons
    document.querySelectorAll('.minus-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.productId;
            if (cart[productId] && cart[productId].quantity > 1) {
                cart[productId].quantity--;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                renderProducts(cart);
            }
        });
    });
}

function attachRemoveListeners() {
    document.querySelectorAll('.remove-product-cart-button').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.productId;
            
            if (cart[productId]) {
                delete cart[productId];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                renderProducts(cart);
            }
        });
    });
}

function saveCart(){
    if(Object.keys(cart).length == 0){
        renderProducts(cart);
    }
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '{}');
}

function getUsername() {
    const wtUser = localStorage.getItem('wt_user');
    if (!wtUser) return null;
    try {
        const parsed = JSON.parse(wtUser);
        return typeof parsed === 'string' ? parsed : (parsed.name || parsed.username || parsed);
    } catch (e) {
        return wtUser;
    }
}

// Checkout button
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (Object.keys(cart).length === 0) {
                alert('Your cart is empty!');
                return;
            }
            
            // Here you can add your checkout logic
            alert('Proceeding to checkout... (Add your checkout logic here)');
        });
    }
});

// Initialize cart display
async function initializeCart() {
    const username = getUsername();
    
    if (username) {
        console.log("User logged in:", username);
        console.log("Fetching cart from backend...");
        
        // Fetch from backend
        const backendItems = await fetchCartFromBackend();
        
        if (backendItems && backendItems.length > 0) {
            console.log("Backend cart loaded:", backendItems);
            mergeCartData(backendItems);
        } else {
            console.log("No backend cart, using local");
            cart = getCart();
            updateCartCount();
            renderProducts(cart);
        }
    } else {
        console.log("No user logged in, using local cart");
        cart = getCart();
        updateCartCount();
        renderProducts(cart);
    }
}

// Call initialize on load
window.addEventListener('load', initializeCart);

async function fetchCartFromBackend() {
    const username = getUsername();
    
    if (!username) {
        console.log("No user logged in, can't fetch cart");
        return null;
    }

    try {
        const url = `http://127.0.0.1:3000/cart/${username}`;
        console.log("Fetching from:", url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch cart:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Cart fetched from backend:', data);
        return data.items || [];
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
}

function mergeCartData(backendItems) {
    console.log('Merging cart data. Backend items:', backendItems);
    
    const localCart = getCart();
    console.log('Local cart before merge:', localCart);
    
    if (!backendItems || backendItems.length === 0) {
        console.log('No backend cart data, using local cart');
        cart = localCart;
        updateCartCount();
        renderProducts(cart);
        return;
    }

    // Start with empty cart
    cart = {};
    
    // Add backend items first
    backendItems.forEach(item => {
        if (item.id) {
            cart[item.id] = {
                id: item.id,
                name: item.name,
                image: item.image,
                brandName: item.brandName,
                about: item.about,
                priceCents: item.priceCents,
                keyword: item.keyword,
                quantity: item.quantity || 1
            };
        }
    });
    
    // Merge local items (local takes priority if exists)
    Object.keys(localCart).forEach(productId => {
        const localItem = localCart[productId];
        if (!cart[productId]) {
            cart[productId] = localItem;
        }
    });

    console.log('Cart after merge:', cart);

    // Save merged cart
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderProducts(cart);
    
    // Sync back to backend
    if (Object.keys(localCart).length > 0) {
        console.log('Syncing merged cart back to backend');
        sendCartToBackend();
    }
}

function sendCartToBackend() {
    const username = getUsername();
    
    if (!username) {
        console.log("No user logged in, skipping cart save");
        return false;
    }
    
    const cartItems = [];
    Object.keys(cart).forEach(productId => {
        const item = cart[productId];
        cartItems.push({
            id: item.id,
            name: item.name,
            image: item.image,
            brandName: item.brandName,
            about: item.about,
            priceCents: item.priceCents,
            keyword: item.keyword,
            quantity: item.quantity || 1
        });
    });
    
    console.log("Sending cart to backend:", { username, itemCount: cartItems.length });

    const payload = { username, items: cartItems };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = 'http://127.0.0.1:3000/cart';

    const ok = navigator.sendBeacon(url, blob);
    console.log('sendBeacon returned', ok);
    return ok;
}

// Listen for storage changes
window.addEventListener('storage', (e) => {
    if (e.key === 'cart' || e.key === 'cartCount') {
        console.log('Cart updated in another tab/page, refreshing...');
        cart = getCart();
        updateCartCount();
        renderProducts(cart);
    }
});

