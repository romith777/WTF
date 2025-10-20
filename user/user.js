// Check if logged in
const user = JSON.parse(localStorage.getItem('wt_user'));
localStorage.setItem('username', user.name);
console.log(user);
if(!user){
  window.location.href = '/login.html';
} else {
    document.getElementById('username').textContent = user.name;
    document.getElementById('email').textContent = user.email || 'N/A';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  localStorage.removeItem('wt_user');
  localStorage.setItem('login-token', false);
  window.location.href = '/login.html';
});
