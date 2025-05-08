// menu.js
// Ако не е логнато, редирект към login
if (localStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'login.html';
  }
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('loggedIn');
    window.location.href = 'login.html';
  });
  