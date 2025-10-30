const API_URI = window.location.origin;

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

// Sidebar Navigation
const menuItems = document.querySelectorAll('.menu-item:not([href^="../"])');
const contentSections = document.querySelectorAll('.content-section');

menuItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    
    const section = item.getAttribute('data-section');
    
    // Update active menu item
    menuItems.forEach(mi => mi.classList.remove('active'));
    item.classList.add('active');
    
    // Show corresponding section
    contentSections.forEach(cs => cs.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
  });
});

// Change Password Form
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = changePasswordForm.currentPassword.value;
    const newPassword = changePasswordForm.newPassword.value;
    const confirmPassword = changePasswordForm.confirmPassword.value;

    // Client-side validation
    if (newPassword !== confirmPassword) {
      showMessage('password-message', 'Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('password-message', 'Password must be at least 8 characters', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URI}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.name,
          currentPassword,
          newPassword
        })
      });

      const result = await res.json();

      if (result.status === 'success') {
        showMessage('password-message', 'Password changed successfully! Redirecting to login...', 'success');
        changePasswordForm.reset();

        // Logout after 2 seconds
        setTimeout(() => {
          localStorage.removeItem('wt_user');
          localStorage.setItem('login-token', 'false');
          localStorage.removeItem('username');
          window.location.href = '../login.html';
        }, 2000);
      } else if (result.status === 'incorrect') {
        showMessage('password-message', 'Current password is incorrect', 'error');
      } else if (result.status === 'same') {
        showMessage('password-message', 'New password must be different from current password', 'error');
      } else if (result.status === 'weak') {
        showMessage('password-message', result.message, 'error');
      } else {
        showMessage('password-message', 'Error changing password', 'error');
      }
    } catch (err) {
      console.error(err);
      showMessage('password-message', 'Server error. Please try again later.', 'error');
    }
  });
}

function showMessage(elementId, message, type) {
  const messageBox = document.getElementById(elementId);
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;
  messageBox.style.display = 'block';

  setTimeout(() => {
    messageBox.style.display = 'none';
  }, 5000);
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  if(confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('wt_user');
    localStorage.setItem('login-token', 'false');
    localStorage.removeItem('username');
    window.location.href = '../login.html';
  }
});
