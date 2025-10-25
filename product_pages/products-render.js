// import {tees,cargos,hoodies} from '../data/products.js';

let type = JSON.parse(localStorage.getItem('product_type'));
let favList = JSON.parse(localStorage.getItem("favList")) || {};
let cart = JSON.parse(localStorage.getItem('cart')) || {};

// Normalize cart data structure
Object.keys(cart).forEach(productId => {
    // If the cart item is an array (old bug), fix it
    if (Array.isArray(cart[productId])) {
        cart[productId] = { ...cart[productId][0], quantity: 1 };
    }
    // Ensure quantity exists
    if (!cart[productId].quantity) {
        cart[productId].quantity = 1;
    }
});

localStorage.setItem('cart', JSON.stringify(cart));

// Get all product types for related products
let allProductTypes = [tees, cargos, hoodies];
let otherProducts = [];

// Filter to get products from other categories
allProductTypes.forEach(productType => {
    if (productType[0].name !== type[0].name) {
        otherProducts = [...otherProducts, ...productType];
    }
});

// Shuffle array for random suggestions
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

document.addEventListener('DOMContentLoaded',()=>{
    let currentProducts = [...type]; // Store current filtered products
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
        document.getElementById('brandFilters').innerHTML = brandHTML;
        attachBrandFilters();
    }

    // Render main products
    function renderProducts(productsToRender){
        let innerHtml = "";
        productsToRender.forEach(product => {
            innerHtml+=
            `
                <div class="browse-card">
                    <div class="browse-card-img">
                        <a href="./productSinglePage.html" style="cursor: pointer;">
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
        document.querySelector(".browsing-section").innerHTML = innerHtml;
        document.querySelector(".js-products-title").innerHTML = type[0].name.charAt(0).toUpperCase() + type[0].name.slice(1);
        document.getElementById('productCount').textContent = productsToRender.length;
        
        // Re-attach event listeners after rendering
        attachCartButtons();
        attachWishlistButtons();
        renderFavStatus();
    }

    // Render related products
    function renderRelatedProducts() {
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
        
        document.querySelector('.related-products-container').innerHTML = relatedHTML;
    }

    // Initial render
    renderProducts(type);
    renderRelatedProducts();
    extractBrands();

    function updateFavCartCount(){
        document.querySelector(".js-favourites-count").innerHTML = localStorage.getItem('favCount') || 0;
        document.querySelector(".js-cart-count").innerHTML = localStorage.getItem('cartCount') || 0;
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
    
    priceSlider.addEventListener('input', function() {
        const maxPrice = this.value;
        maxPriceDisplay.textContent = '$' + formatCurrency(maxPrice);
        
        // Update slider background
        const percentage = (maxPrice / 10000) * 100;
        this.style.background = `linear-gradient(to right, #ee0652 0%, #ee0652 ${percentage}%, #e0e0e0 ${percentage}%)`;
        
        applyFilters();
    });

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
    document.getElementById('sortSelect').addEventListener('change', function() {
        const sortBy = this.value;
        sortProducts(sortBy);
    });

    // Apply all filters
    function applyFilters() {
        const maxPrice = parseInt(priceSlider.value);
        const selectedBrands = Array.from(document.querySelectorAll('.brand-filter:checked')).map(cb => cb.value);
        const selectedSizes = Array.from(document.querySelectorAll('.size-filter:checked')).map(cb => cb.value);
        
        filteredProducts = type.filter(product => {
            const priceMatch = product.priceCents <= maxPrice;
            const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brandName);
            // Size filter would need size property in product data
            const sizeMatch = selectedSizes.length === 0; // Modify when you have size data
            
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
    document.getElementById('clearFilters').addEventListener('click', function() {
        priceSlider.value = 10000;
        maxPriceDisplay.textContent = '$100.00';
        priceSlider.style.background = 'linear-gradient(to right, #ee0652 0%, #ee0652 100%, #e0e0e0 100%)';
        
        document.querySelectorAll('.brand-filter').forEach(cb => cb.checked = false);
        document.querySelectorAll('.size-filter').forEach(cb => cb.checked = false);
        document.getElementById('sortSelect').value = 'featured';
        
        filteredProducts = [...type];
        renderProducts(filteredProducts);
    });

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
                
                if(!cart[productId]){
                    cart[productId] = { ...result, quantity: 1 };
                }
                else{
                    cart[productId].quantity++;
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
        console.log(JSON.parse(localStorage.getItem('wt_user')));
        document.querySelector(".login-token").href = "../user/user.html";
        document.querySelector(".login-token-info").innerHTML = "My Account";
    }

    if(localStorage.getItem('login-token') === 'true'){
        document.querySelector(".login-token").href = "../user/user.html";
        document.querySelector(".login-token-info").innerHTML = "My Account";
    }
    else{
        document.querySelector(".login-token").href = "login.html";
        document.querySelector(".login-token-info").innerHTML = "Sign in/up";
    }
    // Related products slider
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const container = document.querySelector('.related-products-container');
    
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

    // Black screen effect for navigation hover
    window.blackscreen = function(){
        document.getElementById("main").style.opacity = 0.5;
    }
    
    window.blackscreenout = function(){
        document.getElementById("main").style.opacity = 1;
    }
});