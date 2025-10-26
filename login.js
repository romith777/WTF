const API_URI = window.location.origin;

document.addEventListener('DOMContentLoaded', ()=>{
    window.addEventListener("load", function() {
        document.querySelector(".loader-wrapper").style.display = "none";
        document.querySelector(".new-body").classList.remove("filter-blur");
    });

    // slider animation & toggles (kept from your original)
    function sliderChangerAni(){ document.querySelector(".slider-change").style.animationName = 'none'; }
    function slideChanger(){
        document.querySelector(".login-box").style.display = 'none';
        document.querySelector(".signup-box").style.display = 'block';
        setTimeout(sliderChangerAni,500);
    }
    document.querySelector(".in-login-signup-button").addEventListener('click', ()=>{
        document.querySelector(".slider-change").style.animationName = 'slideChange';
        setTimeout(slideChanger, 500);
    });

    function slideChanger2(){
        document.querySelector(".login-box").style.display = 'block';
        document.querySelector(".signup-box").style.display = 'none';
        setTimeout(sliderChangerAni, 500);
    }
    document.querySelector(".in-signup-login-button").addEventListener('click', ()=>{
        document.querySelector(".slider-change").style.animationName = 'slideChange';
        setTimeout(slideChanger2, 500);
    });

    const urlParams = new URLSearchParams(window.location.search);

    // common css
    if(urlParams.get('signup') === 'exists' || urlParams.get('login') === 'nouser'){
        let css = '';
        if(urlParams.get('signup') === 'exists')    css = "signup-message";
        else if(urlParams.get('login') === 'nouser') css = "login-message";
        
        document.getElementById(css).style.display = 'block';
        document.getElementById(css).style.backgroundColor = 'rgb(238, 82, 82)';
        document.getElementById(css).style.color = 'black';
        
        setTimeout(() => {
            document.getElementById(css).style.display = 'none';
        }, 4000);
    }

    // for login
    if(urlParams.get('login') === 'nouser'){
        document.getElementById('login-message').innerHTML = 'Login False. Password or Username might be incorrect.';
    }

    // for signup
    if(urlParams.get('signup') === 'success'){
        document.getElementById('login-message').style.display = 'block';
        setTimeout(() => {
            document.getElementById('login-message').style.display = 'none';
        }, 4000);
    }
    else if(urlParams.get('signup') === 'exists'){
        document.querySelector(".login-box").style.display = 'none';
        document.querySelector(".signup-box").style.display = 'block';
        document.getElementById('signup-message').innerHTML = 'Username or Email already exists';
    }

    // signup js
    let form = document.getElementById('signupForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            username: form.username.value,
            email: form.email.value,
            password: form.password.value
        };
        try {
            const res = await fetch(`${API_URI}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === 'success') {
            window.location.href = 'login.html?signup=success';
            } else if (result.status === 'exists') {
            window.location.href = 'login.html?signup=exists';
            } else {
            alert('Error signing up');
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    });

    //login js
    let loginform = document.getElementById('loginForm');
    loginform.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            username: loginform.username.value,
            password: loginform.password.value
        };
        try {
            const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === 'success') {
            window.location.href = `index.html?login=success&wt_user=${result.wt_user}&email=${result.email}`;
            } else if (result.status === 'nouser') {
            window.location.href = 'login.html?login=nouser';
            } else {
            alert('Error signing up');
            }
            console.log(result);
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    });
});
