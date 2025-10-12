// import {tees,cargos,hoodies} from '../data/products.js';

let type = JSON.parse(localStorage.getItem('product_type'));
let favList = JSON.parse(localStorage.getItem("favList")) || {};
let cart = JSON.parse(localStorage.getItem('cart')) || {};
console.log(cart);

document.addEventListener('DOMContentLoaded',()=>{
    function formatCurrency(priceCents){
        return (priceCents/100).toFixed(2);
    }

    let favCount = localStorage.getItem('favCount')||0;
    let cartCount = localStorage.getItem('cartCount')||0;
    localStorage.setItem('favCount',localStorage.getItem('favCount')||0);

    function renderProducts(type){
        let innerHtml = "";
        type.forEach(product => {
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
                                <p class="browse-card-information-text" style="color: black;font-weight: 500;">${product.brandName}</p>
                                <p class="browse-card-information-text">${product.about}</p>
                                <p class="browse-card-information-text">Price : $<span class="browse-card-information-price">${formatCurrency(product.priceCents)}</span></p>
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
        document.querySelector(".js-product-type").innerHTML = type[0].name.charAt(0).toUpperCase() + type[0].name.slice(1) + " - WTP";
    }

    renderProducts(type);

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
                console.log("hooo");
            }
        });
    }

    renderFavStatus();
    document.querySelectorAll('.js-browse-card').forEach((element)=>{
        element.addEventListener('click',()=>{
            document.body.innerHTML = '';
        });
    });
    function saveFavList(){
        localStorage.setItem("favList", JSON.stringify(favList));
    }
    document.querySelectorAll(".browse-card-wishlist").forEach((element)=>{
        element.addEventListener('click',()=>{
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
                console.log("added");
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
                console.log("removed");
            }
        });
    });

    function saveCart(){
        localStorage.setItem("cart", JSON.stringify(cart));
    }
    document.querySelectorAll('.js-cart-button').forEach(button=>{
        button.addEventListener('click',()=>{
            productId = button.dataset.productId;
            cartCount++;
            localStorage.setItem('cartCount',cartCount);
            updateFavCartCount();
            button.innerHTML = "Added";
            setTimeout(()=>{button.innerHTML = "Add To Cart";},1000);
            const result = type.filter(item => item.id === productId);
            if(!cart[productId]){
                cart[productId] = { ...result, quantity: 1 };
            }
            else{
                cart[productId].quantity++;
            }
            saveCart();
            console.log(cart);
        });
    });
});