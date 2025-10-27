const API_URI = window.location.origin;

let logintoken = localStorage.getItem('login-token');
let username;
let cartCount = parseInt(localStorage.getItem('cartCount')) || 0;
let cart = JSON.parse(localStorage.getItem('cart')) || {};

function formatCurrency(priceCents){
    return (priceCents/100).toFixed(2);
}

function calculateTotalQuantity(cartObj) {
    let total = 0;
    for (const key in cartObj) {
        total += cartObj[key].quantity || 1;
    }
    return total;
}

function calculateTotalPrice(cartObj) {
    let total = 0;
    for (const key in cartObj) {
        const item = cartObj[key];
        total += (item.priceCents || 0) * (item.quantity || 1);
    }
    return total;
}

function updateCartCount() {
    let total = 0;
    Object.keys(cart).forEach(id => {
        total += cart[id].quantity || 1;
    });
    
    cartCount = total;
    localStorage.setItem('cartCount', cartCount);
    
    const cartCountElement = document.querySelector('.js-cart-count');
    const favCountElement = document.querySelector('.js-favourites-count');
    
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
    if (favCountElement) {
        favCountElement.textContent = localStorage.getItem('favCount') || 0;
    }
}

function updateCheckoutSummary() {
    const itemCount = calculateTotalQuantity(cart);
    const subtotal = calculateTotalPrice(cart);
    const shipping = itemCount > 0 ? 500 : 0;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + shipping + tax;
    
    const itemCountEl = document.getElementById('itemCount');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    
    if (itemCountEl) itemCountEl.textContent = itemCount;
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (shippingEl) shippingEl.textContent = formatCurrency(shipping);
    if (taxEl) taxEl.textContent = formatCurrency(tax);
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

function renderProducts(cartObj){
    let innerHtml = "";
    // console.log('Rendering cart:', cartObj);
    if(!cartObj || Object.keys(cartObj).length === 0){
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

    for (const cartKey in cartObj) {
        const product = cartObj[cartKey];
        const quantity = product.quantity || 1;
        const size = product.selectedSize || 'M';
        
        innerHtml += `
            <div class="browse-card js-card-${cartKey}">
                <a href="../product_pages/productSinglePage.html?id=${product.id}" style="cursor: pointer;">
                    <div class="browse-card-img">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                </a>
                <div class="browse-card-information">
                    <div class="browse-card-details">
                        <div class="browse-card-information-area-text">
                            <p class="browse-card-brand">${product.brandName}</p>
                            <p class="browse-card-about">${product.about}</p>
                            <p class="browse-card-size">Size: <strong>${size}</strong></p>
                            <p class="browse-card-price">$${formatCurrency(product.priceCents)}</p>
                        </div>
                    </div>
                    <div class="browse-card-actions">
                        <div class="cart-action-row">
                            <div class="quantity-display">
                                <span>Quantity: <strong>${quantity}</strong></span>
                            </div>
                            <div class="quantity-controls">
                                <button class="quantity-btn minus-btn" data-cart-key="${cartKey}">−</button>
                                <input type="number" class="quantity-input" value="${quantity}" min="1" data-cart-key="${cartKey}" readonly>
                                <button class="quantity-btn plus-btn" data-cart-key="${cartKey}">+</button>
                            </div>
                        </div>
                        <div class="cart-buttons">
                            <button class="remove-product-cart-button" data-cart-key="${cartKey}">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    document.querySelector(".cart-render").innerHTML = innerHtml;
    
    attachQuantityListeners();
    attachRemoveListeners();
    updateCheckoutSummary();
}

function attachQuantityListeners() {
    document.querySelectorAll('.plus-btn').forEach(button => {
        button.addEventListener('click', () => {
            const cartKey = button.dataset.cartKey;
            if (cart[cartKey]) {
                cart[cartKey].quantity++;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                sendCartToBackend();
                renderProducts(cart);
            }
        });
    });
    
    document.querySelectorAll('.minus-btn').forEach(button => {
        button.addEventListener('click', () => {
            const cartKey = button.dataset.cartKey;
            if (cart[cartKey] && cart[cartKey].quantity > 1) {
                cart[cartKey].quantity--;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                sendCartToBackend();
                renderProducts(cart);
            }
        });
    });
}

function attachRemoveListeners() {
    document.querySelectorAll('.remove-product-cart-button').forEach(button => {
        button.addEventListener('click', () => {
            const cartKey = button.dataset.cartKey;
            
            if (cart[cartKey]) {
                delete cart[cartKey];
                localStorage.setItem('cart', JSON.stringify(cart));
                
                let totalCartCount = 0;
                Object.keys(cart).forEach(key => {
                    totalCartCount += cart[key].quantity || 1;
                });
                localStorage.setItem('cartCount', totalCartCount);
                
                updateCartCount();
                sendCartToBackend();
                renderProducts(cart);
            }
        });
    });
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

function sendCartToBackend() {
    const username = getUsername();
    
    if (!username) {
        return false;
    }
    
    const cartItems = [];
    Object.keys(cart).forEach(cartKey => {
        const item = cart[cartKey];
        
        cartItems.push({
            cartKey: cartKey,
            id: item.id,
            name: item.name,
            image: item.image,
            brandName: item.brandName,
            about: item.about,
            priceCents: item.priceCents,
            keyword: item.keyword,
            quantity: item.quantity || 1,
            selectedSize: item.selectedSize
        });
    });

    const payload = { username, items: cartItems };
    
    fetch(`${API_URI}/api/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .catch(error => {
        console.error('Error syncing cart:', error);
    });
    
    return true;
}

async function fetchCartFromBackend() {
    const username = getUsername();
    
    if (!username) {
        console.log('No username');
        return null;
    }

    try {
        const url = `${API_URI}/api/cart/${username}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.log('Response not OK');
            return null;
        }

        const data = await response.json();
        
        return data.items || [];
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
}

function mergeCart(){
    
}

async function initializeCart() {
    const username = getUsername();
    
    if (username) {
        const backendItems = await fetchCartFromBackend();
        // console.log('Fetched backend cart items:', backendItems);
        
        cart = {};
        
        if (backendItems && backendItems.length > 0) {
            backendItems.forEach(item => {
                const cartKey = item.cartKey;
                const size = item.selectedSize;
                // console.log(cartKey, size);
                if (cartKey && size && item.id) {
                    cart[cartKey] = {
                        id: item.id,
                        name: item.name,
                        image: item.image,
                        brandName: item.brandName,
                        about: item.about,
                        priceCents: item.priceCents,
                        keyword: item.keyword,
                        quantity: item.quantity || 1,
                        selectedSize: size
                    };
                }
            });
        }
    } else {
        cart = getCart();
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Initialized cart:', cart);
    updateCartCount();
    renderProducts(cart);
}


document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (Object.keys(cart).length === 0) {
                alert('Your cart is empty!');
                return;
            }
            
            alert('Proceeding to checkout...');
        });
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('login') === 'success'){
        localStorage.setItem('login-token', true);
        localStorage.setItem('wt_user', JSON.stringify({
            name: urlParams.get('wt_user'),
            email: urlParams.get('email')
        }));
    }

    const loginLinks = document.querySelectorAll('a[href="../login.html"]');
    if(localStorage.getItem('login-token') === 'true'){
        loginLinks.forEach(link => {
            const pTag = link.querySelector('p');
            if(pTag && pTag.textContent.trim() === 'Sign in/up'){
                link.href = "../user/user.html";
                pTag.textContent = "My Account";
            }
        });
    }
});

window.addEventListener('load', initializeCart);

window.addEventListener('storage', (e) => {
    if (e.key === 'cart' || e.key === 'cartCount') {
        cart = getCart();
        updateCartCount();
        renderProducts(cart);
    }
});
