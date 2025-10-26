// Black screen effect functions

function blackscreen(){
    document.getElementById("main").style.opacity = 0.5;
}

function blackscreenout(){
    document.getElementById("main").style.opacity = 1;
}

// Mobile menu toggle
function toggleMobileMenu(){
    const navDropDown = document.getElementById('navDropDown');
    navDropDown.classList.toggle('open');
}

// Slider functionality
document.addEventListener("DOMContentLoaded", function() {
    const slidesContainer = document.querySelector(".slides");
    const slides = document.querySelectorAll(".slides img");
    const navDots = document.querySelectorAll(".slider-nav div");
    let currentIndex = 0;
    let slideTimer;
    let gap, slideWidth;

    // Read measurements
    function updateMeasurements() {
        gap = parseInt(
            window.getComputedStyle(slidesContainer).getPropertyValue("gap"),
            10
        );
        slideWidth = slides[0].offsetWidth;
    }

    function moveSlide(index) {
        slidesContainer.scrollLeft = index * (slideWidth + gap);
    }

    function resetDots() {
        navDots.forEach(dot => {
            dot.style.opacity = "0.5";
            dot.style.backgroundColor = "white";
        });
    }

    function updateSlide(index) {
        navDots[index].style.opacity = "1";
        navDots[index].style.backgroundColor = "#ee0652";
    }

    function startSlideshow() {
        slideTimer = setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            resetDots();
            updateSlide(currentIndex);
            moveSlide(currentIndex);
        }, 3000);
    }

    // Initial measurements and slideshow kickoff
    updateMeasurements();
    startSlideshow();

    // Recalculate on resize
    window.addEventListener("resize", () => {
        clearInterval(slideTimer);
        updateMeasurements();
        moveSlide(currentIndex);
        startSlideshow();
    });

    // Manual navigation
    navDots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            clearInterval(slideTimer);
            currentIndex = index;
            resetDots();
            updateSlide(currentIndex);
            moveSlide(currentIndex);
            startSlideshow();
        });
    });

    // Update favourites count
    document.querySelector(".js-favourites-count").innerHTML = localStorage.getItem('favCount') || 0;
    
    // Update cart count if available
    const cartCountElement = document.querySelector(".js-cart-count");
    if(cartCountElement){
        cartCountElement.innerHTML = localStorage.getItem('cartCount') || 0;
    }
});

// Loader removal
window.addEventListener("load", function() {
    document.querySelector(".loader-wrapper").style.display = "none";
    document.querySelector(".filter-blur").classList.remove("filter-blur");
});

// Login token handling
const urlParams = new URLSearchParams(window.location.search);
if(urlParams.get('login') === 'success'){
    localStorage.setItem('login-token', true);
    localStorage.setItem('wt_user', JSON.stringify({
        name: urlParams.get('wt_user'),
        email: urlParams.get('email')
    }));
    console.log(JSON.parse(localStorage.getItem('wt_user')));
    document.querySelector(".login-token").href = "./user/user.html";
    document.querySelector(".login-token-info").innerHTML = "My Account";
}

if(localStorage.getItem('login-token') === 'true'){
    document.querySelector(".login-token").href = "./user/user.html";
    document.querySelector(".login-token-info").innerHTML = "My Account";
}
else{
    document.querySelector(".login-token").href = "login.html";
    document.querySelector(".login-token-info").innerHTML = "Sign in/up";
}

// Check login status and update the login section
function updateLoginSection() {
    const loginSection = document.querySelector('.login-to-access');
    const loginSectionTitle = document.querySelector('.login-to-access h1');
    const loginSectionText = document.querySelector('.login-to-access p');
    const loginButton = document.querySelector('.login-to-access-button');
    
    if(localStorage.getItem('login-token') === 'true'){
        // User is logged in
        loginSectionTitle.textContent = 'LOGOUT TO !SEE YOUR DESIGNS';
        loginSectionText.textContent = 'Logout to !access your account and to see your designs, favourites and cart. And many more Designs.';
        loginButton.innerHTML = '<span class="login-token-info">LOGOUT</span>';
        loginButton.style.backgroundColor = '#ee0652';
        loginButton.style.color = 'white';
        
        // Add logout functionality
        loginButton.parentElement.onclick = function(e) {
            e.preventDefault();
            localStorage.setItem('login-token', 'false');
            localStorage.removeItem('wt_user');
            window.location.href = 'index.html';
        };
    } else {
        // User is not logged in (default state)
        loginSectionTitle.textContent = 'LOGIN TO SEE YOUR DESIGNS';
        loginSectionText.textContent = 'Login to access your account and to see your designs, favourites and cart. And many more Designs.';
        loginButton.innerHTML = '<span class="login-token-info">LOGIN</span>';
        loginButton.style.backgroundColor = 'white';
        loginButton.style.color = 'black';
        
        // Normal login link
        loginButton.parentElement.onclick = null;
        loginButton.parentElement.href = 'login.html';
    }
}

// Call the function when page loads
window.addEventListener('load', function() {
    updateLoginSection();
});