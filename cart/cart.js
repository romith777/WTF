let logintoken = localStorage.getItem('login-token');
let username;
console.log(logintoken);
let cartCount = parseInt(localStorage.getItem('cartCount')) || 0;
let cart = JSON.parse(localStorage.getItem('cart')) || {};

function formatCurrency(priceCents){
    return (priceCents/100).toFixed(2);
}

// Helper function to calculate total quantity
function calculateTotalQuantity(cartObj) {
    let total = 0;
    for (const key in cartObj) {
        const item = cartObj[key];
        // Handle both old array format and new object format
        total += item.quantity || 1;
    }
    return total;
}

// Helper function to update cart count
function updateCartCount() {
    cartCount = calculateTotalQuantity(cart);
    localStorage.setItem('cartCount', cartCount);
}

// Helper function to normalize cart structure from old format to new format
function normalizeCartItem(item) {
    // If it's already in new format (has product property)
    if (item.product && item.quantity) {
        return item;
    }
    
    // If it's in old array format: [{...productData}] with quantity property on array
    if (Array.isArray(item) && item[0]) {
        return {
            product: item[0],
            quantity: item.quantity || 1
        };
    }
    
    // If it's just a product object without wrapper
    if (item.id) {
        return {
            product: item,
            quantity: 1
        };
    }
    
    return null;
}

function renderProducts(cartObj){
    let innerHtml = "";
    
    if(!cartObj || Object.keys(cartObj).length === 0){
        console.log("No products found");
        innerHtml+=`
            <div class="no-fav-div">
                <div class="no-fav">
                    <img src="../assets/cart-icon.png" alt="hrt-img">
                </div>
                <div class="no-fav">
                    <h1>Add Products to Display</h1>
                </div>
            </div>
        `
        document.getElementById('main').innerHTML = innerHtml;
        return;
    }

    for (const productId in cartObj) {
        const item = normalizeCartItem(cartObj[productId]);
        
        if (!item || !item.product) {
            console.error('Invalid cart item:', cartObj[productId]);
            continue;
        }
        
        const product = item.product;
        const quantity = item.quantity;
        
        console.log('Rendering:', { productId, product, quantity });
        
        innerHtml+=
        `
            <div class="browse-card js-card-${product.id}">
                <div class="browse-card-img">
                    <a href="./productSinglePage.html" style="cursor: pointer;">
                        <img src="${product.image}" alt="${product.name}">
                    </a>
                </div>
                <div class="browse-card-information">
                    <div>
                        <div class="browse-card-information-area">
                            <div class="browse-card-information-area-text">
                                <p class="browse-card-information-text" style="color: black;font-weight: 500;">${product.brandName}</p>
                                <p class="browse-card-information-text">${product.about}</p>
                                <p class="browse-card-information-text">Price : $<span class="browse-card-information-price">${formatCurrency(product.priceCents)}</span></p>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px;flex-direction: column">
                        <div class="js-cart-quantity">
                            <p>Quantity: <b>${quantity}</b></p>
                        </div>
                        <div>
                            <button class="js-cart-quantity-update cart-update-button"> Update </button>
                            <button class="remove-product-cart-button cart-update-button" data-product-id="${product.id}">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    document.querySelector(".cart-render").innerHTML = innerHtml;
    
    // Re-attach event listeners after rendering
    attachRemoveListeners();
}

function attachRemoveListeners() {
    document.querySelectorAll('.remove-product-cart-button').forEach(button=>{
        button.addEventListener('click',()=>{
            const productId = button.dataset.productId;
            
            if(cart[productId]){
                const parent = document.querySelector('.cart-render');
                const child = document.querySelector(`.js-card-${productId}`);
                if (parent && child) {
                    parent.removeChild(child);
                }
                delete cart[productId];
                localStorage.setItem('cart',JSON.stringify(cart));
                
                // Update cart count based on total quantity
                updateCartCount();
                
                saveCart();
                // Save to backend immediately when item is removed
                sendCartToBackend();
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

function getCartArray(cartObj) {
  const arr = [];
  for (const key in cartObj) {
    const item = normalizeCartItem(cartObj[key]);
    if (item && item.product) {
        arr.push({
            ...item.product,
            quantity: item.quantity
        });
    }
  }
  return arr;
}

function sendCartToBackend() {
  const username = getUsername();
  
  if (!username) {
    console.log("No user logged in, skipping cart save");
    return false;
  }
  
  const cart = getCart();
  const items = getCartArray(cart);
  
  console.log("Preparing to send cart:", { username, itemCount: items.length });

  const payload = { username, items };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = 'http://127.0.0.1:3000/cart';

  const ok = navigator.sendBeacon(url, blob);
  console.log('sendBeacon returned', ok, 'for user:', username, 'with', items.length, 'items');
  return ok;
}

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
  
  // Get current local cart
  const localCart = getCart();
  console.log('Local cart before merge:', localCart);
  
  if (!backendItems || backendItems.length === 0) {
    console.log('No backend cart data, using local cart');
    cart = localCart;
    updateCartCount();
    renderProducts(cart);
    return;
  }

  // Start with local cart as base (normalize it first)
  cart = {};
  for (const key in localCart) {
    const normalized = normalizeCartItem(localCart[key]);
    if (normalized) {
      cart[key] = normalized;
    }
  }
  
  // Merge backend items (use new object format)
  backendItems.forEach(item => {
    if (item.id) {
      // If item exists in local cart, keep the local version (it's more recent)
      if (!cart[item.id]) {
        // Only add from backend if not in local cart
        cart[item.id] = {
          product: {
            id: item.id,
            name: item.name,
            image: item.image,
            brandName: item.brandName,
            about: item.about,
            priceCents: item.priceCents,
            keyword: item.keyword
          },
          quantity: item.quantity || 1
        };
      }
    }
  });

  console.log('Cart after merge:', cart);

  // Save merged cart to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart count based on total quantity
  updateCartCount();
  
  console.log('Cart merged. Total items:', cartCount);
  
  // Re-render products with merged data
  renderProducts(cart);
  
  // Sync back to backend if we merged new local items
  if (Object.keys(localCart).length > 0) {
    console.log('Syncing merged cart back to backend');
    sendCartToBackend();
  }
}

async function refreshCartDisplay() {
  console.log('Refreshing cart display...');
  
  // Reload cart from localStorage
  cart = getCart();
  
  // Update cart count based on total quantity
  updateCartCount();
  
  console.log('Current cart:', cart);
  console.log('Cart count:', cartCount);
  
  // Re-render
  renderProducts(cart);
}

async function initializeCart() {
  const username = getUsername();
  
  if (username) {
    console.log("User logged in:", username);
    console.log("Fetching cart from backend on page load");
    
    const backendItems = await fetchCartFromBackend();
    mergeCartData(backendItems);
  } else {
    console.log("No user logged in");
    // Load from local storage only
    cart = getCart();
    updateCartCount();
    renderProducts(cart);
  }
}

// Listen for localStorage changes from other tabs/pages
window.addEventListener('storage', (e) => {
  if (e.key === 'cart' || e.key === 'cartCount') {
    console.log('Cart updated in another tab/page, refreshing...');
    refreshCartDisplay();
  }
});

// Listen for focus event - refresh cart when user returns to this tab
window.addEventListener('focus', () => {
  console.log('Tab focused, refreshing cart display...');
  refreshCartDisplay();
});

// Listen for visibility change
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('Page became visible, refreshing cart...');
    refreshCartDisplay();
  } else {
    // Save when hiding
    sendCartToBackend();
  }
});

// Refresh cart every 30 seconds to catch any updates
setInterval(() => {
  refreshCartDisplay();
}, 30000);

// Call initialize on load
window.addEventListener('load', initializeCart);

// Save on beforeunload
window.addEventListener('beforeunload', (e) => {
  sendCartToBackend();
});

// Save on pagehide
window.addEventListener('pagehide', (e) => {
  sendCartToBackend();
});

// Periodic backend save every 5 minutes
setInterval(() => {
  const username = getUsername();
  if (username) {
    console.log("Auto-saving cart to backend...");
    sendCartToBackend();
  }
}, 300000);