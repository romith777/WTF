// let API_URI = window.location.origin;

let currentProduct = null;
let selectedSize = 'M';
let quantity = 1;
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let favList = JSON.parse(localStorage.getItem('favList')) || {};

let allProducts = [];
let productsInitialized = false;

function formatCurrency(priceCents){
    return (priceCents/100).toFixed(2);
}

// Mobile menu toggle
function toggleMobileMenu(){
    const navDropDown = document.getElementById('navDropDown');
    navDropDown.classList.toggle('open');
}

function getProductFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId && allProducts.length > 0) {
        currentProduct = allProducts.find(p => p.id === productId);
    }
    
    if (!currentProduct) {
        const storedProduct = localStorage.getItem('currentProduct');
        if (storedProduct) {
            currentProduct = JSON.parse(storedProduct);
        }
    }
    
    return currentProduct;
}

function renderProductDetail(product) {
    if (!product) {
        document.querySelector('.new-body').innerHTML = `
            <div style="text-align: center; padding: 100px 20px;">
                <h1>Product not found</h1>
                <p style="margin: 20px 0;">The product you're looking for doesn't exist.</p>
                <a href="./productsPage.html"><button class="add-to-cart-btn">Back to Products</button></a>
            </div>
        `;
        return;
    }
    
    const isFavorite = localStorage.getItem(`${product.id}-fav-status`) === 'checked';
    
    const html = `
        <div class="product-detail-container">
            <div class="product-image-section">
                <img src="${product.image}" alt="${product.name}" class="product-main-image" id="mainImage">
                <div class="product-thumbnails">
                    <img src="${product.image}" alt="Thumbnail 1" class="product-thumbnail active" onclick="changeMainImage('${product.image}', this)">
                    ${product.additionalImages ? product.additionalImages.map(img => 
                        `<img src="${img}" alt="Thumbnail" class="product-thumbnail" onclick="changeMainImage('${img}', this)">`
                    ).join('') : ''}
                </div>
            </div>
            
            <div class="product-info-section">
                <p class="product-brand">${product.brandName}</p>
                <h1 class="product-name">${product.about}</h1>
                <div class="product-price">$${formatCurrency(product.priceCents)}</div>
                
                <p class="product-description">
                    ${product.description || 'High-quality product made with premium materials. Perfect for everyday wear and designed for maximum comfort and style.'}
                </p>
                
                <div class="size-selection">
                    <h3>Select Size</h3>
                    <div class="size-options">
                        <button class="size-option" data-size="XS" onclick="selectSize('XS')">XS</button>
                        <button class="size-option" data-size="S" onclick="selectSize('S')">S</button>
                        <button class="size-option selected" data-size="M" onclick="selectSize('M')">M</button>
                        <button class="size-option" data-size="L" onclick="selectSize('L')">L</button>
                        <button class="size-option" data-size="XL" onclick="selectSize('XL')">XL</button>
                        <button class="size-option" data-size="XXL" onclick="selectSize('XXL')">XXL</button>
                    </div>
                </div>
                
                <div class="quantity-selection">
                    <h3>Quantity</h3>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="decreaseQuantity()">−</button>
                        <input type="number" class="quantity-input" id="quantityInput" value="1" min="1" readonly>
                        <button class="quantity-btn" onclick="increaseQuantity()">+</button>
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="add-to-cart-btn" onclick="addToCart()">Add to Cart</button>
                    <button class="add-to-favorites-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite()" id="favBtn">
                        <span>${isFavorite ? '❤' : '♡'}</span> ${isFavorite ? 'Favorited' : 'Favorite'}
                    </button>
                </div>
                
                <div class="product-features">
                    <h3>Product Features</h3>
                    <ul>
                        <li>Premium quality fabric</li>
                        <li>Comfortable fit</li>
                        <li>Machine washable</li>
                        <li>Durable and long-lasting</li>
                        <li>Available in multiple sizes</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('.new-body').innerHTML = html;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function renderRelatedProducts(currentProduct) {
    if (!currentProduct || allProducts.length === 0) return;
    
    let availableProducts = allProducts.filter(p => p.id !== currentProduct.id);
    let randomizedProducts = shuffleArray(availableProducts);
    let relatedProducts = randomizedProducts.slice(0, 10);
    
    const html = `
        <div class="related-products-wrapper">
            <div class="related-products-header">
                <h2 class="section-title">You May Also Like</h2>
                <div class="slider-controls">
                    <button class="slider-btn" id="prevBtn">‹</button>
                    <button class="slider-btn" id="nextBtn">›</button>
                </div>
            </div>
            <div class="related-products-container">
                ${relatedProducts.map(product => `
                    <div class="related-product-card" onclick="goToProduct('${product.id}')">
                        <div class="related-product-img">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="related-product-info">
                            <h4>${product.brandName}</h4>
                            <p>${product.about}</p>
                            <p class="related-product-price">$${formatCurrency(product.priceCents)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    const relatedSection = document.createElement('div');
    relatedSection.className = 'related-products-section';
    relatedSection.innerHTML = html;
    document.querySelector('.new-body').appendChild(relatedSection);
    
    initializeSlider();
}

function initializeSlider() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const container = document.querySelector('.related-products-container');
    
    if (!prevBtn || !nextBtn || !container) return;
    
    prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -300, behavior: 'smooth' });
    });
    
    nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: 300, behavior: 'smooth' });
    });
    
    function updateSliderButtons() {
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (container.scrollLeft <= 0) {
            prevBtn.style.opacity = '0.3';
            prevBtn.style.pointerEvents = 'none';
        } else {
            prevBtn.style.opacity = '1';
            prevBtn.style.pointerEvents = 'auto';
        }
        
        if (container.scrollLeft >= maxScroll - 5) {
            nextBtn.style.opacity = '0.3';
            nextBtn.style.pointerEvents = 'none';
        } else {
            nextBtn.style.opacity = '1';
            nextBtn.style.pointerEvents = 'auto';
        }
    }
    
    container.addEventListener('scroll', updateSliderButtons);
    updateSliderButtons();
}

function renderFooter() {
    const footerHTML = `
        <footer class="footer">
            <div class="footer-content">
                <div class="footer-brand">
                    <h2><span class="brand-highlight">WT</span>PRINTS</h2>
                    <p>Your trusted fashion destination for bold, expressive, and stylish clothing. Stay unique. Stay printed.</p>
                </div>
                <div class="footer-links">
                    <div>
                        <h4>Men</h4>
                        <ul>
                            <li><a href="#">Oversized T-Shirts</a></li>
                            <li><a href="#">T-Shirts</a></li>
                            <li><a href="#">Joggers</a></li>
                            <li><a href="#">Cargos</a></li>
                            <li><a href="#">Caps</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4>Women</h4>
                        <ul>
                            <li><a href="#">Oversized T-Shirts</a></li>
                            <li><a href="#">T-Shirts</a></li>
                            <li><a href="#">Crop Tops</a></li>
                            <li><a href="#">Co-ord Sets</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4>About</h4>
                        <ul>
                            <li><a href="#">Our Story</a></li>
                            <li><a href="#">Sustainability</a></li>
                            <li><a href="#">Careers</a></li>
                        </ul>
                    </div>  
                    <div>
                        <h4>Follow Us</h4>
                        <ul>
                            <li><a href="#">Instagram</a></li>
                            <li><a href="#">Facebook</a></li>
                            <li><a href="#">Twitter</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 WTPRINTS. All rights reserved.</p>
            </div>
        </footer>
    `;
    
    document.querySelector('.new-body').insertAdjacentHTML('beforeend', footerHTML);
}

function initializeProductPage() {
    if (productsInitialized) return;
    
    allProducts = [...tees, ...hoodies, ...cargos];
    
    const product = getProductFromURL();
    
    if (product) {
        currentProduct = product;
        // console.log('Displaying product:', product);
        const titleElement = document.querySelector('.js-product-type-product');
        if (titleElement) {
            titleElement.textContent = `${product.brandName} - WTP`;
        }
        renderProductDetail(product);
        renderRelatedProducts(product);
        renderFooter();
        updateCounts();
        selectedSize = 'M';
        productsInitialized = true;
    }
}

window.addEventListener('productsLoaded', (event) => {
    initializeProductPage();
});

document.addEventListener('DOMContentLoaded', () => {
    if (tees.length > 0 || hoodies.length > 0 || cargos.length > 0) {
        initializeProductPage();
    } else {
        setTimeout(() => {
            if (tees.length > 0 || hoodies.length > 0 || cargos.length > 0) {
                initializeProductPage();
            }
        }, 1000);
    }
});

window.changeMainImage = function(imageSrc, thumbnailElement) {
    document.getElementById('mainImage').src = imageSrc;
    
    document.querySelectorAll('.product-thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnailElement.classList.add('active');
}

window.selectSize = function(size) {
    selectedSize = size;
    
    document.querySelectorAll('.size-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const clickedButton = document.querySelector(`[data-size="${size}"]`);
    if (clickedButton) {
        clickedButton.classList.add('selected');
    }
}

window.increaseQuantity = function() {
    quantity++;
    document.getElementById('quantityInput').value = quantity;
}

window.decreaseQuantity = function() {
    if (quantity > 1) {
        quantity--;
        document.getElementById('quantityInput').value = quantity;
    }
}

window.addToCart = function() {
    // console.log(currentProduct);
    if (!currentProduct) return;
    
    const productId = currentProduct.id;
    const freshCart = JSON.parse(localStorage.getItem('cart')) || {};
    const cartKey = `${productId}-${selectedSize}`;
    
    if (!freshCart[cartKey]) {
        freshCart[cartKey] = { 
            ...currentProduct,
            quantity: quantity,
            selectedSize: selectedSize
        };
    } else {
        freshCart[cartKey].quantity += quantity;
    }
    
    localStorage.setItem('cart', JSON.stringify(freshCart));
    cart = freshCart;
    // console.log('Updated cart:', freshCart);
    
    let totalCartCount = 0;
    Object.keys(freshCart).forEach(key => {
        totalCartCount += freshCart[key].quantity || 1;
    });
    localStorage.setItem('cartCount', totalCartCount);
    
    sendCartToBackend(freshCart);
    updateCounts();
    
    quantity = 1;
    document.getElementById('quantityInput').value = 1;
    
    const btn = document.querySelector('.add-to-cart-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Added';
    
    setTimeout(() => {
        btn.textContent = originalText;
    }, 1500);
}


window.toggleFavorite = function() {
    if (!currentProduct) return;
    
    const productId = currentProduct.id;
    const isFavorite = localStorage.getItem(`${productId}-fav-status`) === 'checked';
    const btn = document.getElementById('favBtn');
    
    if (isFavorite) {
        localStorage.setItem(`${productId}-fav-status`, 'unchecked');
        delete favList[productId];
        
        let favCount = parseInt(localStorage.getItem('favCount') || 0);
        favCount--;
        localStorage.setItem('favCount', favCount);
        
        btn.classList.remove('active');
        btn.innerHTML = '<span>♡</span> Favorite';
    } else {
        localStorage.setItem(`${productId}-fav-status`, 'checked');
        favList[productId] = [currentProduct];
        
        let favCount = parseInt(localStorage.getItem('favCount') || 0);
        favCount++;
        localStorage.setItem('favCount', favCount);
        
        btn.classList.add('active');
        btn.innerHTML = '<span>❤</span> Favorited';
    }
    
    localStorage.setItem('favList', JSON.stringify(favList));
    updateCounts();
}

window.goToProduct = function(productId) {
    window.location.href = `productSinglePage.html?id=${productId}`;
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

window.blackscreen = function(){
    const mainElement = document.getElementById("main");
    if (mainElement) {
        mainElement.style.opacity = 0.5;
    }
}

window.blackscreenout = function(){
    const mainElement = document.getElementById("main");
    if (mainElement) {
        mainElement.style.opacity = 1;
    }
}

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

function sendCartToBackend(cartToSend) {
    const username = getUsername();
    
    if (!username) {
        return false;
    }
    
    const cartItems = [];
    // console.log("cartToSend",cartToSend);
    Object.keys(cartToSend).forEach(cartKey => {
        const item = cartToSend[cartKey];
        // console.log('Cart item to send:', cartKey);
        // console.log("inside sendcart",item);
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
    // console.log("cartItems",cartItems);
    const payload = { username, items: cartItems };
    // console.log("payload",payload);
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

// Login token handling
const urlParams = new URLSearchParams(window.location.search);
if(urlParams.get('login') === 'success'){
    localStorage.setItem('login-token', true);
    localStorage.setItem('wt_user', JSON.stringify({
        name: urlParams.get('wt_user'),
        email: urlParams.get('email')
    }));
    
    const loginTokenEl = document.querySelector(".login-token");
    const loginTokenInfoEl = document.querySelector(".login-token-info");
    
    if (loginTokenEl) loginTokenEl.href = "../user/user.html";
    if (loginTokenInfoEl) loginTokenInfoEl.innerHTML = "My Account";
}

if(localStorage.getItem('login-token') === 'true'){
    const loginTokenEl = document.querySelector(".login-token");
    const loginTokenInfoEl = document.querySelector(".login-token-info");
    
    if (loginTokenEl) loginTokenEl.href = "../user/user.html";
    if (loginTokenInfoEl) loginTokenInfoEl.innerHTML = "My Account";
}
else{
    const loginTokenEl = document.querySelector(".login-token");
    const loginTokenInfoEl = document.querySelector(".login-token-info");
    
    if (loginTokenEl) loginTokenEl.href = "../login.html";
    if (loginTokenInfoEl) loginTokenInfoEl.innerHTML = "Sign in/up";
}