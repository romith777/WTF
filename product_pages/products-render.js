function formatCurrency(priceCents){
    return (priceCents/100).toFixed(2);
}

let favCount = localStorage.getItem('favCount')||0;
localStorage.setItem('favCount',localStorage.getItem('favCount')||0);

function renderProducts(type){
    innerHtml = "";
    type.forEach(product => {
        innerHtml+=
        `
            <div class="browse-card">
                <div class="browse-card-img">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="browse-card-information">
                    <div class="browse-card-information-area">
                        <div class="browse-card-information-area-text">
                            <p class="browse-card-information-text" style="color: black;font-weight: 500;">${product.brandName}</p>
                            <p class="browse-card-information-text">${product.about}</p>
                            <p class="browse-card-information-text">Price : $<span class="browse-card-information-price">${formatCurrency(product.priceCents)}</span></p>
                        </div>
                        <div class="browse-card-information-area-wishlist">
                            <img src="../assets/favourites-icon-unclick.png" class="browse-card-wishlist" data-product-id="${product.id}" data-is-checked="unchecked">
                        </div>
                    </div>
                    <button class="add-to-cart-button">Add To Cart</button>
                </div>
            </div>
        `
    });
    document.querySelector(".browsing-section").innerHTML = innerHtml;
}

function updateFavCount(){
    document.querySelector(".js-favourites-count").innerHTML = localStorage.getItem('favCount') || 0;
}

updateFavCount();

document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll(".browse-card-wishlist").forEach((element)=>{
        element.addEventListener('click',()=>{
            let isChecked = element.dataset.isChecked;
            console.log(isChecked);
            if(isChecked == 'unchecked'){
                let productId = element.dataset.productId;
                favCount++;
                localStorage.setItem('favCount',favCount);
                element.dataset.isChecked = "checked";
                updateFavCount();
                element.src="../assets/favourites-icon.png";
                console.log(element.src);
            }
            else if(isChecked == 'checked'){
                element.dataset.isChecked = "unchecked"
                favCount--;
                localStorage.setItem('favCount',favCount);
                updateFavCount();
                element.src="../assets/favourites-icon-unclick.png";
                console.log(element.src);
            }
        });
    });
});