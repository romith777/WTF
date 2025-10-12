let favList = JSON.parse(localStorage.getItem('favList')) || {};

function formatCurrency(priceCents){
    return (priceCents/100).toFixed(2);
}

function renderProducts(products){
    let innerHtml = "";
    
    if(!products || products.length === 0){
        console.log("No products found");
        innerHtml+=`
            <div>
                <div class="no-fav">
                    <img src="../assets/favourites-icon.png" alt="hrt-img">
                </div>
                <div class="no-fav">
                    <h1>Add Favourites to Display</h1>
                </div>

            </div>
        `
    }

    else
    products.forEach(element => {
        element.forEach(product => {
            innerHtml+=
            `
                <div class="browse-card js-card-${product.id}">
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
                        </div>
                        <button class="add-to-cart-button js-fav-remove" data-product-id="${product.id}">Remove</button>
                        <button class="add-to-cart-button">Add To Cart</button>
                    </div>
                </div>
            `;
        });
    });

    document.querySelector(".js-favourites-body").innerHTML = innerHtml;
}

if(Object.keys(favList).length > -1){
    renderProducts(Object.values(favList));
}

function saveFavList(){
    localStorage.setItem("favList", JSON.stringify(favList));
    if(Object.keys(favList).length == 0){
        renderProducts(Object.values(favList));
    }
}

document.querySelectorAll('.js-fav-remove').forEach(fav=>{
    fav.addEventListener('click',()=>{
        let productId = fav.dataset.productId;
        delete favList[productId];
        let parent = document.getElementById('main');
        let child = document.querySelector(`.js-card-${productId}`);
        if(child){
            console.log(child);
            parent.removeChild(child);
        }
        localStorage.setItem(`${productId}-fav-status`,'unchecked');
        let favCount = localStorage.getItem('favCount')||0;
        favCount--;
        localStorage.setItem('favCount',favCount);
        saveFavList();
    });
});