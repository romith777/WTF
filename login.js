const API_URI = window.location.origin;

document.addEventListener('DOMContentLoaded', ()=>{
    window.addEventListener("load", function() {
        document.querySelector(".loader-wrapper").style.display = "none";
        document.querySelector(".new-body").classList.remove("filter-blur");
    });

    // slider animation & toggles
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
        // Clear signup token when switching to login
        sessionStorage.removeItem('signupToken');
        document.querySelector(".slider-change").style.animationName = 'slideChange';
        setTimeout(slideChanger2, 500);
    });

    const urlParams = new URLSearchParams(window.location.search);

    // Check for signup token in sessionStorage
    const signupToken = sessionStorage.getItem('signupToken');
    if (signupToken) {
        try {
            const signupData = JSON.parse(signupToken);
            
            // Show signup box
            document.querySelector(".login-box").style.display = 'none';
            document.querySelector(".signup-box").style.display = 'block';
            
            // If OTP was sent, show OTP form
            if (signupData.otpSent) {
                document.getElementById('requestOtpForm').style.display = 'none';
                document.getElementById('verifyOtpForm').style.display = 'flex';
                
                // Show info message
                document.getElementById('signup-message').style.display = 'block';
                document.getElementById('signup-message').style.backgroundColor = '#d4edda';
                document.getElementById('signup-message').style.color = '#155724';
                document.getElementById('signup-message').innerHTML = 'OTP sent to ' + signupData.email;
            } else {
                // Show request form with saved data
                document.getElementById('requestOtpForm').style.display = 'flex';
                document.getElementById('verifyOtpForm').style.display = 'none';
                
                // Populate form fields
                if (signupData.username) {
                    document.querySelector('#requestOtpForm input[name="username"]').value = signupData.username;
                }
                if (signupData.email) {
                    document.querySelector('#requestOtpForm input[name="email"]').value = signupData.email;
                }
                if (signupData.password) {
                    document.querySelector('#requestOtpForm input[name="password"]').value = signupData.password;
                }
            }
        } catch (e) {
            console.error('Error parsing signup token:', e);
            sessionStorage.removeItem('signupToken');
        }
    }

    // common css for error messages
    if(urlParams.get('signup') === 'exists' || urlParams.get('login') === 'nouser'){
        let css = '';
        if(urlParams.get('signup') === 'exists') {
            css = "signup-message";
            document.querySelector(".login-box").style.display = 'none';
            document.querySelector(".signup-box").style.display = 'block';
        }
        else if(urlParams.get('login') === 'nouser') css = "login-message";
        
        document.getElementById(css).style.display = 'block';
        document.getElementById(css).style.backgroundColor = 'rgb(238, 82, 82)';
        document.getElementById(css).style.color = 'white';
        
        setTimeout(() => {
            document.getElementById(css).style.display = 'none';
        }, 4000);
    }

    // for login
    if(urlParams.get('login') === 'nouser'){
        document.getElementById('login-message').innerHTML = 'Login Failed. Password or Username might be incorrect.';
    }

    // for signup
    if(urlParams.get('signup') === 'success'){
        // Clear signup token on successful signup
        sessionStorage.removeItem('signupToken');
        
        document.getElementById('login-message').style.display = 'block';
        document.getElementById('login-message').style.backgroundColor = '#d4edda';
        document.getElementById('login-message').style.color = '#155724';
        document.getElementById('login-message').innerHTML = 'Signup successful! Please login.';
        setTimeout(() => {
            document.getElementById('login-message').style.display = 'none';
        }, 4000);
    }
    else if(urlParams.get('signup') === 'exists'){
        sessionStorage.removeItem('signupToken');
        document.querySelector(".login-box").style.display = 'none';
        document.querySelector(".signup-box").style.display = 'block';
        document.getElementById('signup-message').innerHTML = 'Username or Email already exists';
    }

    //login js
    let loginform = document.getElementById('loginForm');
    loginform.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            username: loginform.username.value,
            password: loginform.password.value
        };
        try {
            const res = await fetch(`${API_URI}/login`, {
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
                alert('Error logging in');
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    });

    // Step 1: Request OTP
    let requestOtpForm = document.getElementById('requestOtpForm');
    requestOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Store signup data in sessionStorage
        const signupData = {
            username: requestOtpForm.username.value,
            email: requestOtpForm.email.value,
            password: requestOtpForm.password.value,
            otpSent: false
        };
        
        sessionStorage.setItem('signupToken', JSON.stringify(signupData));
        
        try {
            const res = await fetch(`${API_URI}/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: signupData.username,
                    email: signupData.email
                })
            });
            
            const result = await res.json();
            
            if (result.status === 'success') {
                // Update token with otpSent flag
                signupData.otpSent = true;
                sessionStorage.setItem('signupToken', JSON.stringify(signupData));
                
                // Show OTP form, hide request form
                document.getElementById('requestOtpForm').style.display = 'none';
                document.getElementById('verifyOtpForm').style.display = 'flex';
                
                document.getElementById('signup-message').style.display = 'block';
                document.getElementById('signup-message').style.backgroundColor = '#d4edda';
                document.getElementById('signup-message').style.color = '#155724';
                document.getElementById('signup-message').innerHTML = 'OTP sent to your email!';
                
                setTimeout(() => {
                    document.getElementById('signup-message').style.display = 'none';
                }, 4000);
            } else if (result.status === 'exists') {
                sessionStorage.removeItem('signupToken');
                
                document.getElementById('signup-message').style.display = 'block';
                document.getElementById('signup-message').style.backgroundColor = 'rgb(238, 82, 82)';
                document.getElementById('signup-message').style.color = 'white';
                document.getElementById('signup-message').innerHTML = 'Username or Email already exists';
                
                setTimeout(() => {
                    document.getElementById('signup-message').style.display = 'none';
                }, 4000);
            } else {
                alert('Error sending OTP');
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    });

    // Step 2: Verify OTP
    let verifyOtpForm = document.getElementById('verifyOtpForm');
    verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const otp = verifyOtpForm.otp.value;
        const signupToken = sessionStorage.getItem('signupToken');
        
        if (!signupToken) {
            alert('Session expired. Please start again.');
            location.reload();
            return;
        }
        
        const signupData = JSON.parse(signupToken);
        
        try {
            const res = await fetch(`${API_URI}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: signupData.username,
                    email: signupData.email,
                    password: signupData.password,
                    otp
                })
            });
            
            const result = await res.json();
            
            if (result.status === 'success') {
                sessionStorage.removeItem('signupToken');
                window.location.href = 'login.html?signup=success';
            } else if (result.status === 'invalid') {
                document.getElementById('signup-message').style.display = 'block';
                document.getElementById('signup-message').style.backgroundColor = 'rgb(238, 82, 82)';
                document.getElementById('signup-message').style.color = 'white';
                document.getElementById('signup-message').innerHTML = 'Invalid or expired OTP';
                
                setTimeout(() => {
                    document.getElementById('signup-message').style.display = 'none';
                }, 4000);
            } else {
                alert('Error verifying OTP');
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    });

    // Resend OTP
    document.getElementById('resendOtpBtn').addEventListener('click', async () => {
        const signupToken = sessionStorage.getItem('signupToken');
        
        if (!signupToken) {
            alert('Session expired. Please start again.');
            location.reload();
            return;
        }
        
        const signupData = JSON.parse(signupToken);
        
        try {
            const res = await fetch(`${API_URI}/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: signupData.username,
                    email: signupData.email
                })
            });
            
            const result = await res.json();
            
            if (result.status === 'success') {
                document.getElementById('signup-message').style.display = 'block';
                document.getElementById('signup-message').style.backgroundColor = '#d4edda';
                document.getElementById('signup-message').style.color = '#155724';
                document.getElementById('signup-message').innerHTML = 'New OTP sent!';
                
                setTimeout(() => {
                    document.getElementById('signup-message').style.display = 'none';
                }, 4000);
            }
        } catch (err) {
            console.error(err);
            alert('Error resending OTP');
        }
    });

    // Back button in OTP form
    const backToFormBtn = document.getElementById('backToFormBtn');
    if (backToFormBtn) {
        backToFormBtn.addEventListener('click', () => {
            const signupToken = sessionStorage.getItem('signupToken');
            if (signupToken) {
                const signupData = JSON.parse(signupToken);
                signupData.otpSent = false;
                sessionStorage.setItem('signupToken', JSON.stringify(signupData));
            }
            
            document.getElementById('verifyOtpForm').style.display = 'none';
            document.getElementById('requestOtpForm').style.display = 'flex';
        });
    }
});
