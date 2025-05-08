// login.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) Фиксирани потребители
  const validUsers = [
    { username: 'Stivan Banev',   password: '1234' },
    { username: 'Pavel Vasilev',  password: '4321' }
  ];

  // 2) Инжектиране на модал
  injectAlertModal();

  // 3) Логика на формата
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();

    const inputUsername = document.getElementById('username').value.trim();
    const inputPassword = document.getElementById('password').value;

    const user = validUsers.find(u =>
      u.username === inputUsername && u.password === inputPassword
    );

    if (!user) {
      // грешка
      showAlert('Incorrect username or password');
      return;
    }

    // успешен login
    showAlert(
      `Login successful. Welcome ${user.username}!`,
      () => window.location.href = 'menu.html'
    );
  });
});

// --------------
// Създава и вкарва модал в DOM
function injectAlertModal() {
  const modalHtml = `
    <div id="alertModal" style="
      display:none;
      position:fixed; top:0; left:0; right:0; bottom:0;
      background:rgba(0,0,0,0.5);
      align-items:center; justify-content:center;
      z-index:1000;
    ">
      <div style="
        background:#2a2a2a;
        padding:20px;
        border-radius:8px;
        max-width:90%; width:300px;
        text-align:center;
      ">
        <p id="alertMessage" style="margin-bottom:20px; color:#fff;"></p>
        <button id="alertOk" style="
          padding:8px 16px;
          background:#dc3545;
          color:#fff;
          border:none;
          border-radius:4px;
          cursor:pointer;
        ">OK</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// --------------
// Показва модала и при OK изпълнява onOk (ако е подаден)
function showAlert(message, onOk) {
  const modal    = document.getElementById('alertModal');
  const msgP     = document.getElementById('alertMessage');
  const oldOkBtn = document.getElementById('alertOk');

  // клонираме бутона, за да махнем стари слушатели
  const newOkBtn = oldOkBtn.cloneNode(true);
  oldOkBtn.parentNode.replaceChild(newOkBtn, oldOkBtn);

  msgP.textContent = message;
  modal.style.display = 'flex';

  newOkBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    if (typeof onOk === 'function') onOk();
  });
}

document.getElementById('helpBtn').addEventListener('click', () => {
  document.getElementById('helpModal').style.display = 'flex';
});
document.getElementById('helpOk').addEventListener('click', () => {
  document.getElementById('helpModal').style.display = 'none';
});
// Затваряме при клик извън съдържанието
document.getElementById('helpModal').addEventListener('click', e => {
  if (e.target.id === 'helpModal') {
    document.getElementById('helpModal').style.display = 'none';
  }
});