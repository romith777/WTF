let cart = JSON.parse(localStorage.getItem('cart')) || {};
let cartCount = parseInt(localStorage.getItem('cartCount')) || 0;
// console.log(cart);

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
        }
    });
});