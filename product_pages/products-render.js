// Import statement commented out - now using global variables from products.js
// import {tees,cargos,hoodies} from '../data/products.js';
// let API_URI = window.location.origin;

let type = JSON.parse(localStorage.getItem('product_type'));
let favList = JSON.parse(localStorage.getItem("favList")) || {};
let cart = JSON.parse(localStorage.getItem('cart')) || {};

// Normalize cart data structure
Object.keys(cart).forEach(productId => {
    if (Array.isArray(cart[productId])) {
        cart[productId] = { ...cart[productId][0], quantity: 1 };
    }
    if (!cart[productId].quantity) {
        cart[productId].quantity = 1;
    }
});

localStorage.setItem('cart', JSON.stringify(cart));

// Get all product types for related products
let allProductTypes = [];
let otherProducts = [];

// Function to initialize products after they're loaded
function initializeProducts() {
    allProductTypes = [tees, cargos, hoodies];
    
    // Filter to get products from other categories
    allProductTypes.forEach(productType => {
        if (productType && productType.length > 0 && type && type.length > 0) {
            if (productType[0].name !== type[0].name) {
                otherProducts = [...otherProducts, ...productType];
            }
        }
    });
}

// Shuffle array for random suggestions
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Wait for products to load before initializing
function startApp() {
    if (!type || type.length === 0) {
        console.error('No product type selected');
        return;
    }

    // Check if products are loaded
    if (tees.length === 0 && hoodies.length === 0 && cargos.length === 0) {
        // console.log('Waiting for products to load...');
        // Wait for products loaded event
        window.addEventListener('productsLoaded', () => {
            // console.log('Products loaded event received, initializing app...');
            initializeProducts();
            initializeApp();
        });
    } else {
        // Products already loaded
        // console.log('Products already loaded, initializing app...');
        initializeProducts();
        initializeApp();
    }
}

function initializeApp() {
    let currentProducts = [...type];
    let filteredProducts = [...type];
    
    function formatCurrency(priceCents){
        return (priceCents/100).toFixed(2);
    }

    let favCount = localStorage.getItem('favCount')||0;
    let cartCount = localStorage.getItem('cartCount')||0;
    localStorage.setItem('favCount',localStorage.getItem('favCount')||0);

    // Extract unique brands from products
    function extractBrands() {
        const brands = [...new Set(type.map(product => product.brandName))];
        let brandHTML = '';
        brands.forEach(brand => {
            brandHTML += `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${brand}" class="brand-filter">
                    <span>${brand}</span>
                </label>
            `;
        });
        const brandFiltersEl = document.getElementById('brandFilters');
        if (brandFiltersEl) {
            brandFiltersEl.innerHTML = brandHTML;
            attachBrandFilters();
        }
    }

    function navigateToProduct(product) {
        localStorage.setItem('currentProduct', JSON.stringify(product));
        window.location.href = `./productSinglePage.html?id=${product.id}`;
    }

    function storeProduct(productId) {
        const product = type.find(p => p.id === productId);
        if (product) {
            localStorage.setItem('currentProduct', JSON.stringify(product));
        }
    }

    // Render main products
    function renderProducts(productsToRender){
        let innerHtml = "";
        productsToRender.forEach(product => {
            innerHtml+=
            `
                <div class="browse-card">
                    <div class="browse-card-img">
                        <a href="./productSinglePage.html?id=${product.id}" style="cursor: pointer;" onclick="storeProduct('${product.id}')">
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
                            <div class="browse-card-information-area-wishlist">
                                <img src="../assets/favourites-icon-unclick.png" class="browse-card-wishlist" data-product-id="${product.id}" data-is-checked="${localStorage.getItem(`${product.id}-fav-status`)||"unchecked"}" >
                            </div>
                        </div>
                        <button class="add-to-cart-button js-cart-button" data-product-id=${product.id}>Add To Cart</button>
                    </div>
                </div>
            `
        });
        
        const browsingSectionEl = document.querySelector(".browsing-section");
        if (browsingSectionEl) {
            browsingSectionEl.innerHTML = innerHtml;
        }
        
        const productsTitleEl = document.querySelector(".js-products-title");
        if (productsTitleEl && type && type.length > 0) {
            productsTitleEl.innerHTML = type[0].name.charAt(0).toUpperCase() + type[0].name.slice(1);
        }
        
        const productCountEl = document.getElementById('productCount');
        if (productCountEl) {
            productCountEl.textContent = productsToRender.length;
        }
        
        attachCartButtons();
        attachWishlistButtons();
        renderFavStatus();
    }

    // Render related products
    function renderRelatedProducts() {
        if (otherProducts.length === 0) {
            console.log('No related products available');
            return;
        }
        
        const shuffled = shuffleArray([...otherProducts]).slice(0, 8);
        let relatedHTML = '';
        
        shuffled.forEach(product => {
            relatedHTML += `
                <div class="related-product-card" data-product-id="${product.id}">
                    <div class="related-product-img">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="related-product-info">
                        <h4>${product.brandName}</h4>
                        <p>${product.about}</p>
                        <p class="related-product-price">$${formatCurrency(product.priceCents)}</p>
                    </div>
                </div>
            `;
        });
        
        const relatedContainerEl = document.querySelector('.related-products-container');
        if (relatedContainerEl) {
            relatedContainerEl.innerHTML = relatedHTML;
        }
    }

    // Initial render
    renderProducts(type);
    renderRelatedProducts();
    extractBrands();

    function updateFavCartCount(){
        const favCountEl = document.querySelector(".js-favourites-count");
        const cartCountEl = document.querySelector(".js-cart-count");
        
        if (favCountEl) {
            favCountEl.innerHTML = localStorage.getItem('favCount') || 0;
        }
        if (cartCountEl) {
            cartCountEl.innerHTML = localStorage.getItem('cartCount') || 0;
        }
    }

    updateFavCartCount();

    function renderFavStatus(){
        document.querySelectorAll(".browse-card-wishlist").forEach(element=>{
            let productId = element.dataset.productId;
            if(localStorage.getItem(`${productId}-fav-status`) == 'checked'){
                element.src="../assets/favourites-icon.png";
            }
        });
    }

    // Price filter
    const priceSlider = document.getElementById('priceSlider');
    const maxPriceDisplay = document.getElementById('maxPrice');
    
    if (priceSlider && maxPriceDisplay) {
        priceSlider.addEventListener('input', function() {
            const maxPrice = this.value;
            maxPriceDisplay.textContent = '$' + formatCurrency(maxPrice);
            
            const percentage = (maxPrice / 10000) * 100;
            this.style.background = `linear-gradient(to right, #ee0652 0%, #ee0652 ${percentage}%, #e0e0e0 ${percentage}%)`;
            
            applyFilters();
        });
    }

    // Brand filter
    function attachBrandFilters() {
        document.querySelectorAll('.brand-filter').forEach(checkbox => {
            checkbox.addEventListener('change', applyFilters);
        });
    }

    // Size filter
    document.querySelectorAll('.size-filter').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // Sort functionality
    const sortSelectEl = document.getElementById('sortSelect');
    if (sortSelectEl) {
        sortSelectEl.addEventListener('change', function() {
            const sortBy = this.value;
            sortProducts(sortBy);
        });
    }

    // Apply all filters
    function applyFilters() {
        const maxPrice = priceSlider ? parseInt(priceSlider.value) : 10000;
        const selectedBrands = Array.from(document.querySelectorAll('.brand-filter:checked')).map(cb => cb.value);
        const selectedSizes = Array.from(document.querySelectorAll('.size-filter:checked')).map(cb => cb.value);
        
        filteredProducts = type.filter(product => {
            const priceMatch = product.priceCents <= maxPrice;
            const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brandName);
            const sizeMatch = selectedSizes.length === 0;
            
            return priceMatch && brandMatch && sizeMatch;
        });
        
        renderProducts(filteredProducts);
    }

    // Sort products
    function sortProducts(sortBy) {
        let sorted = [...filteredProducts];
        
        switch(sortBy) {
            case 'price-low':
                sorted.sort((a, b) => a.priceCents - b.priceCents);
                break;
            case 'price-high':
                sorted.sort((a, b) => b.priceCents - a.priceCents);
                break;
            case 'newest':
                sorted.reverse();
                break;
            default:
                sorted = [...filteredProducts];
        }
        
        renderProducts(sorted);
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            if (priceSlider) {
                priceSlider.value = 10000;
            }
            if (maxPriceDisplay) {
                maxPriceDisplay.textContent = '$100.00';
            }
            if (priceSlider) {
                priceSlider.style.background = 'linear-gradient(to right, #ee0652 0%, #ee0652 100%, #e0e0e0 100%)';
            }
            
            document.querySelectorAll('.brand-filter').forEach(cb => cb.checked = false);
            document.querySelectorAll('.size-filter').forEach(cb => cb.checked = false);
            
            if (sortSelectEl) {
                sortSelectEl.value = 'featured';
            }
            
            filteredProducts = [...type];
            renderProducts(filteredProducts);
        });
    }

    // Wishlist functionality
    function saveFavList(){
        localStorage.setItem("favList", JSON.stringify(favList));
    }

    function attachWishlistButtons() {
        document.querySelectorAll(".browse-card-wishlist").forEach((element)=>{
            element.addEventListener('click',(e)=>{
                e.preventDefault();
                e.stopPropagation();
                let productId = element.dataset.productId;
                let isChecked = element.dataset.isChecked;
                if(isChecked == 'unchecked'){
                    localStorage.setItem(`${productId}-fav-status`,'checked');
                    favCount++;
                    localStorage.setItem('favCount',favCount);
                    element.dataset.isChecked = "checked";
                    updateFavCartCount();
                    element.src="../assets/favourites-icon.png";
                    const result = type.filter(item => item.id === productId);
                    favList[productId] = result;
                    saveFavList();
                }
                else if(isChecked == 'checked'){
                    element.dataset.isChecked = "unchecked";
                    localStorage.setItem(`${productId}-fav-status`,'unchecked');
                    favCount--;
                    localStorage.setItem('favCount',favCount);
                    updateFavCartCount();
                    element.src="../assets/favourites-icon-unclick.png";
                    if(favList[productId]){
                        delete favList[productId];
                        saveFavList();
                    }
                }
            });
        });
    }

    // function getUsername() {
    //     const wtUser = localStorage.getItem('wt_user');
    //     if (!wtUser) return null;
    //     try {
    //         const parsed = JSON.parse(wtUser);
    //         return typeof parsed === 'string' ? parsed : (parsed.name || parsed.username || parsed);
    //     } catch (e) {
    //         return wtUser;
    //     }
    // }

    // async function fetchCartFromBackend() {
    //     const username = getUsername();
        
    //     if (!username) {
    //         console.log('No username');
    //         return null;
    //     }

    //     try {
    //         const url = `${API_URI}/api/cart/${username}`;
            
    //         const response = await fetch(url, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         });
            
    //         if (!response.ok) {
    //             console.log('Response not OK');
    //             return null;
    //         }

    //         const data = await response.json();
            
    //         return data.items || [];
    //     } catch (error) {
    //         console.error('Error fetching cart:', error);
    //         return null;
    //     }
    // }



    // Cart functionality
    function saveCart(){
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    function attachCartButtons() {
        document.querySelectorAll('.js-cart-button').forEach(button=>{
            button.addEventListener('click',(e)=>{
                e.preventDefault();
                e.stopPropagation();
                let productId = button.dataset.productId;
                
                const result = type.find(item => item.id === productId);
                
                // Create unique cartKey with default size M for quick-add
                const defaultSize = 'M';
                const cartKey = `${productId}-${defaultSize}`;
                
                if(!cart[cartKey]){
                    cart[cartKey] = { 
                        ...result, 
                        quantity: 1,
                        selectedSize: defaultSize
                    };
                }
                else{
                    cart[cartKey].quantity++;
                }
                
                cartCount++;
                localStorage.setItem('cartCount',cartCount);
                updateFavCartCount();
                saveCart();
                
                button.innerHTML = "Added";
                setTimeout(()=>{
                    button.innerHTML = "Add To Cart";
                    button.style.backgroundColor = "";
                },1500);
            });
        });
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

    // Related products slider
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const container = document.querySelector('.related-products-container');
    
    if (prevBtn && nextBtn && container) {
        prevBtn.addEventListener('click', () => {
            container.scrollBy({ left: -300, behavior: 'smooth' });
        });
        
        nextBtn.addEventListener('click', () => {
            container.scrollBy({ left: 300, behavior: 'smooth' });
        });

        // Auto-hide slider buttons based on scroll position
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

    // Black screen effect for navigation hover
    window.blackscreen = function(){
        const mainEl = document.getElementById("main");
        if (mainEl) {
            mainEl.style.opacity = 0.5;
        }
    }
    
    window.blackscreenout = function(){
        const mainEl = document.getElementById("main");
        if (mainEl) {
            mainEl.style.opacity = 1;
        }
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', startApp);

console.log(JSON.parse(localStorage.getItem('cart')));