let cart = JSON.parse(localStorage.getItem('cart')) || {};
let cartCount = parseInt(localStorage.getItem('cartCount')) || 0;

function formatCurrency(priceCents){
    return (priceCents/100).toFixed(2);
}

function renderProducts(products){
    let innerHtml = "";
    
    if(!products || products.length === 0){
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

    else
    products.forEach(product => {
            innerHtml+=
            `
                <div class="browse-card js-card-${product[0].id}">
                    <div class="browse-card-img">
                        <a href="./productSinglePage.html" style="cursor: pointer;">
                            <img src="${product[0].image}" alt="${product[0].name}">
                        </a>
                    </div>
                    <div class="browse-card-information">
                        <div>
                            <div class="browse-card-information-area">
                                <div class="browse-card-information-area-text">
                                    <p class="browse-card-information-text" style="color: black;font-weight: 500;">${product[0].brandName}</p>
                                    <p class="browse-card-information-text">${product[0].about}</p>
                                    <p class="browse-card-information-text">Price : $<span class="browse-card-information-price">${formatCurrency(product[0].priceCents)}</span></p>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 20px;flex-direction: column">
                            <div class="js-cart-quantity">
                                <p>Quantity: <b>${product.quantity}</b></p>
                            </div>
                            <div>
                                <button class="js-cart-quantity-update cart-update-button"> Update </button>
                                <button class="remove-product-cart-button cart-update-button" data-product-id="${product[0].id}">Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

    document.querySelector(".cart-render").innerHTML = innerHtml;
}

renderProducts(Object.values(cart));

function saveCart(){
    localStorage.setItem("cart", JSON.stringify(cart));
    if(Object.keys(cart).length == 0){
        renderProducts(Object.values(cart));
    }
}

document.querySelectorAll('.remove-product-cart-button').forEach(button=>{
    button.addEventListener('click',()=>{
        productId = button.dataset.productId;
        cartCount--;
        localStorage.setItem('cartCount',cartCount);
        if(cart[productId]){
            parent = document.querySelector('.cart-render');
            child = document.querySelector(`.js-card-${productId}`);
            parent.removeChild(child);
            delete cart[productId];
            saveCart();
            // Save to backend immediately when item is removed
            sendCartToBackend();
        }
    });
});

function getCart() {
    console.log("Getting cart from localStorage");
    return JSON.parse(localStorage.getItem('cart') || '{}');
}

function getUsername() {
    console.log("Getting username from localStorage");
    const wtUser = localStorage.getItem('wt_user');
    if (!wtUser) return null;
    try {
        return JSON.parse(wtUser);
    } catch (e) {
        return wtUser;
    }
}

function getCartArray(cartObj) {
  const arr = [];
  for (const key in cartObj) {
    const item = cartObj[key];
    const base = item[0] || item;
    arr.push({
      ...base,
      quantity: item.quantity || 1
    });
  }
  return arr;
}

function sendCartToBackend() {
  const wt_user = getUsername();
  
  if (!wt_user) {
    console.log("No user logged in, skipping cart save");
    return false;
  }

  const username = typeof wt_user === 'string' ? wt_user : (wt_user.name || wt_user.username);
  
  if (!username) {
    console.log("Username not found");
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

// Method 1: Save on visibility change (when switching tabs)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    sendCartToBackend();
  }
});

// Method 2: Save on beforeunload (when closing tab - attempt)
window.addEventListener('beforeunload', (e) => {
  sendCartToBackend();
  // Note: Some browsers may block this, but we try anyway
});

// Method 3: Save on pagehide (more reliable for mobile/some browsers)
window.addEventListener('pagehide', (e) => {
  sendCartToBackend();
});

// Method 4: Periodic auto-save every 30 seconds
setInterval(() => {
  const wt_user = getUsername();
  if (wt_user) {
    console.log("Auto-saving cart...");
    sendCartToBackend();
  }
}, 30000); // 30 seconds

// Method 5: Save immediately when page loads (ensures cart is synced)
window.addEventListener('load', () => {
  const wt_user = getUsername();
  if (wt_user) {
    console.log("Initial cart sync on page load");
    sendCartToBackend();
  }
});