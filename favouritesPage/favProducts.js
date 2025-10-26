const API_URL = window.location.origin;

let favList = JSON.parse(localStorage.getItem('favList')) || {};
let cart = JSON.parse(localStorage.getItem('cart')) || {};

function formatCurrency(priceCents){
    return (priceCents/100).toFixed(2);
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

function renderProducts(products){
    let innerHtml = "";
    
    if(!products || products.length === 0){
        console.log("No products found");
        innerHtml = `
            <div class="no-fav-container">
                <div class="no-fav">
                    <img src="../assets/favourites-icon.png" alt="heart-img">
                    <h1>Your Favorites is Empty</h1>
                    <p>Start adding products you love!</p>
                    <a href="../index.html"><button class="shop-now-btn">Shop Now</button></a>
                </div>
            </div>
        `;
        document.querySelector(".js-favourites-body").innerHTML = innerHtml;
        return;
    }

    // Add title
    innerHtml += `<h1 class="fav-page-title">My Favorites</h1>`;

    products.forEach(element => {
        element.forEach(product => {
            innerHtml += `
                <div class="browse-card js-card-${product.id}">
                    <div class="browse-card-img">
                        <a href="../product_pages/productSinglePage.html" style="cursor: pointer;">
                            <img src="${product.image}" alt="${product.name}">
                        </a>
                    </div>
                    <div class="browse-card-information">
                        <div class="browse-card-information-area">
                            <div class="browse-card-information-area-text">
                                <p class="browse-card-information-text">${product.brandName}</p>
                                <p class="browse-card-information-text">${product.about}</p>
                                <p class="browse-card-information-text">Price: $<span class="browse-card-information-price">${formatCurrency(product.priceCents)}</span></p>
                            </div>
                        </div>
                        <button class="add-to-cart-button js-fav-remove" data-product-id="${product.id}">Remove from Favorites</button>
                        <button class="add-to-cart-button js-add-to-cart" data-product-id="${product.id}">Add To Cart</button>
                    </div>
                </div>
            `;
        });
    });

    document.querySelector(".js-favourites-body").innerHTML = innerHtml;
    
    // Re-attach event listeners
    attachRemoveListeners();
    attachCartListeners();
    updateCounts();
}

function saveFavList(){
    localStorage.setItem("favList", JSON.stringify(favList));
    if(Object.keys(favList).length == 0){
        renderProducts(Object.values(favList));
    }
    // Send to backend
    sendFavoritesToBackend();
}

function attachRemoveListeners() {
    document.querySelectorAll('.js-fav-remove').forEach(fav => {
        fav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            let productId = fav.dataset.productId;
            
            // Remove from favList
            delete favList[productId];
            
            // Update localStorage
            localStorage.setItem(`${productId}-fav-status`, 'unchecked');
            let favCount = parseInt(localStorage.getItem('favCount') || 0);
            favCount--;
            localStorage.setItem('favCount', favCount);
            
            saveFavList();
            
            // Re-render
            renderProducts(Object.values(favList));
        });
    });
}

function attachCartListeners() {
    document.querySelectorAll('.js-add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            let productId = button.dataset.productId;
            
            // Find product in favList
            let product = null;
            Object.values(favList).forEach(items => {
                items.forEach(item => {
                    if (item.id === productId) {
                        product = item;
                    }
                });
            });
            
            if (product) {
                // Add to cart
                if (!cart[productId]) {
                    cart[productId] = { ...product, quantity: 1 };
                } else {
                    cart[productId].quantity++;
                }
                
                localStorage.setItem('cart', JSON.stringify(cart));
                
                // Update cart count
                let cartCount = parseInt(localStorage.getItem('cartCount') || 0);
                cartCount++;
                localStorage.setItem('cartCount', cartCount);
                
                // Visual feedback
                button.innerHTML = "Added ✓";
                button.style.backgroundColor = "#4CAF50";
                setTimeout(() => {
                    button.innerHTML = "Add To Cart";
                    button.style.backgroundColor = "";
                }, 1500);
                
                updateCounts();
            }
        });
    });
}

function updateCounts() {
    const favCountElement = document.querySelector('.js-favourites-count');
    const cartCountElement = document.querySelector('.js-cart-count');
    
    if (favCountElement) {
        favCountElement.textContent = localStorage.getItem('favCount') || 0;
    }
    if (cartCountElement) {
        cartCountElement.textContent = localStorage.getItem('cartCount') || 0;
    }
}

// Backend functions
async function sendFavoritesToBackend() {
    const username = getUsername();
    
    if (!username) {
        console.log("No user logged in, skipping favorites save");
        return false;
    }
    
    const favItems = [];
    Object.values(favList).forEach(items => {
        items.forEach(item => {
            favItems.push({
                id: item.id,
                name: item.name,
                image: item.image,
                brandName: item.brandName,
                about: item.about,
                priceCents: item.priceCents,
                keyword: item.keyword
            });
        });
    });
    
    console.log("Sending favorites to backend:", { username, itemCount: favItems.length });

    const payload = { username, items: favItems };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = `${API_URI}/favorites`;

    const ok = navigator.sendBeacon(url, blob);
    console.log('sendBeacon returned', ok);
    return ok;
}

async function fetchFavoritesFromBackend() {
    const username = getUsername();
    
    if (!username) {
        console.log("No user logged in, can't fetch favorites");
        return null;
    }

    try {
        const url = `http://127.0.0.1:3000/favorites/${username}`;
        console.log("Fetching favorites from:", url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch favorites:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Favorites fetched from backend:', data);
        return data.items || [];
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return null;
    }
}

function mergeFavoritesData(backendItems) {
    console.log('Merging favorites data. Backend items:', backendItems);
    
    const localFavList = JSON.parse(localStorage.getItem('favList')) || {};
    console.log('Local favorites before merge:', localFavList);
    
    if (!backendItems || backendItems.length === 0) {
        console.log('No backend favorites data, using local');
        favList = localFavList;
        renderProducts(Object.values(favList));
        return;
    }

    // Start with local favorites
    favList = { ...localFavList };
    
    // Add backend items
    backendItems.forEach(item => {
        if (item.id && !favList[item.id]) {
            favList[item.id] = [item];
            localStorage.setItem(`${item.id}-fav-status`, 'checked');
        }
    });

    console.log('Favorites after merge:', favList);

    // Save merged favorites
    localStorage.setItem('favList', JSON.stringify(favList));
    
    // Update count
    let favCount = 0;
    Object.keys(favList).forEach(key => {
        favCount++;
    });
    localStorage.setItem('favCount', favCount);
    
    console.log('Favorites merged. Total items:', favCount);
    
    // Re-render
    renderProducts(Object.values(favList));
    
    // Sync back to backend if we merged new local items
    if (Object.keys(localFavList).length > 0) {
        console.log('Syncing merged favorites back to backend');
        sendFavoritesToBackend();
    }
}

async function initializeFavorites() {
    const username = getUsername();
    
    if (username) {
        console.log("User logged in:", username);
        console.log("Fetching favorites from backend...");
        
        const backendItems = await fetchFavoritesFromBackend();
        mergeFavoritesData(backendItems);
    } else {
        console.log("No user logged in");
        favList = JSON.parse(localStorage.getItem('favList')) || {};
        renderProducts(Object.values(favList));
    }
    
    updateCounts();
}

// Initialize on load
window.addEventListener('load', initializeFavorites);

// Save on beforeunload
window.addEventListener('beforeunload', () => {
    sendFavoritesToBackend();
});

// Update login status
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('login') === 'success'){
        localStorage.setItem('login-token', true);
        localStorage.setItem('wt_user', JSON.stringify({
            name: urlParams.get('wt_user'),
            email: urlParams.get('email')
        }));
    }

    const loginLinks = document.querySelectorAll('a[href="login.html"]');
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