let favList = JSON.parse(localStorage.getItem('favList')) || {};

function formatCurrency(priceCents){
    return (priceCents/100).toFixed(2);
}

function updateFavCount(){
    document.querySelector(".js-favourites-count").innerHTML = localStorage.getItem('favCount') || 0;
}

updateFavCount();

console.log(favList);

function renderProducts(products){
    if(!products || products.length === 0) return;

    let innerHtml = "";
    products.forEach(element => {
        element.forEach(product => {
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
                        </div>
                        <button class="add-to-cart-button">Add To Cart</button>
                    </div>
                </div>
            `;
        });
    });

    document.querySelector(".js-favourites-body").innerHTML = innerHtml;
}

if(Object.keys(favList).length > 0){
    renderProducts(Object.values(favList));
}
