// Check if logged in
const user = JSON.parse(localStorage.getItem('wt_user'));

if(!user){
  window.location.href = '../login.html';
} else {
  localStorage.setItem('username', user.name);
  
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

// Update stats
function updateStats() {
  const favCount = localStorage.getItem('favCount') || 0;
  const cartCount = localStorage.getItem('cartCount') || 0;
  
  document.getElementById('stat-orders').textContent = '0';
  document.getElementById('stat-cart').textContent = cartCount;
  document.getElementById('stat-favorites').textContent = favCount;
}

updateStats();

// Logout
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  if(confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('wt_user');
    localStorage.setItem('login-token', 'false');
    localStorage.removeItem('username');
    window.location.href = '../login.html';
  }
});