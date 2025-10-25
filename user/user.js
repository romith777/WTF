// Check if logged in
const user = JSON.parse(localStorage.getItem('wt_user'));

if(!user){
  window.location.href = '/login.html';
} else {
  localStorage.setItem('username', user.name);
  console.log(user);
  
  // Update profile information
  document.getElementById('sidebar-username').textContent = user.name;
  document.getElementById('display-name').textContent = user.name;
  document.getElementById('display-email').textContent = user.email || 'N/A';
  
  // Set avatar to first letter of username
  const avatar = document.getElementById('avatar-initial');
  if (user.name) {
    avatar.textContent = user.name.charAt(0).toUpperCase();
  }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  // Confirm logout
  if(confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('wt_user');
    localStorage.setItem('login-token', false);
    localStorage.removeItem('username');
    localStorage.removeItem('cart');
    localStorage.removeItem('cartCount');
    window.location.href = '/login.html';
  }
});