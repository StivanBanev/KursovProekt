// add-student.js

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:3000';
  
    // Inject alert modal into the page
    createAlertModal();
  
    // Map form field IDs → preview table cell IDs
    const previewMap = {
      firstName:     'previewFirstName',
      middleName:    'previewMiddleName',
      lastName:      'previewLastName',
      facNumber:     'previewFacNumber',
      birthDate:     'previewBirthDate',
      birthDateAge:  'previewAge',
      city:          'previewCity',
      address:       'previewAddress',
      egn:           'previewEGN',
      phone:         'previewPhone',
      email:         'previewEmail',
      specialty:     'previewSpecialty',
      course:        'previewCourse',
      group:         'previewGroup'
    };
  
    // Calculate age (years) from ISO date "YYYY-MM-DD"
    function calculateAge(isoDate) {
      const [y, m, d] = isoDate.split('-').map(Number);
      const today = new Date();
      let age = today.getFullYear() - y;
      if (
        today.getMonth() + 1 < m ||
        (today.getMonth() + 1 === m && today.getDate() < d)
      ) {
        age--;
      }
      return age;
    }
  
    // Update a single preview cell
    function updatePreview(field, value) {
      const cellId = previewMap[field];
      if (cellId) {
        document.getElementById(cellId).textContent = value;
      }
    }
  
    // Wire up inputs to update preview in real time
    Object.keys(previewMap).forEach(field => {
      const input = document.getElementById(field);
      if (!input) return;
      input.addEventListener('input', () => {
        let val = input.value.trim();
        if (field === 'birthDate') {
          const ageDisplay = document.getElementById('ageDisplay');
          if (val) {
            // format date for display
            const [y, m, d] = val.split('-');
            updatePreview('birthDate', `${d}.${m}.${y}`);
            const age = calculateAge(val);
            updatePreview('birthDateAge', `${age} years`);
          } else {
            updatePreview('birthDate', '');
            updatePreview('birthDateAge', '');
          }
          return;
        }
        updatePreview(field, val);
      });
    });
  
    // Handle form submission
    document.getElementById('addForm').addEventListener('submit', e => {
      e.preventDefault();
  
      const student = {
        firstName:  document.getElementById('firstName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        lastName:   document.getElementById('lastName').value.trim(),
        facNumber:  document.getElementById('facNumber').value.trim(),
        birthDate:  document.getElementById('birthDate').value,
        city:       document.getElementById('city').value.trim(),
        address:    document.getElementById('address').value.trim(),
        egn:        document.getElementById('egn').value.trim(),
        phone:      document.getElementById('phone').value.trim(),
        email:      document.getElementById('email').value.trim(),
        specialty:  document.getElementById('specialty').value.trim(),
        course:     document.getElementById('course').value
                      ? parseInt(document.getElementById('course').value)
                      : null,
        group:      document.getElementById('group').value.trim()
      };
  
      fetch(`${API_BASE}/students`, {
        method:  'POST',
        headers: {'Content-Type': 'application/json'},
        body:    JSON.stringify(student)
      })
        .then(res =>
          res.json().then(data => {
            if (!res.ok) throw new Error(data.error || 'Error saving student.');
            return data;
          })
        )
        .then(data => {
          showAlert(`Student added successfully (ID: ${data.id})`);
          // reset form and preview
          document.getElementById('addForm').reset();
          document.getElementById('ageDisplay').textContent = '';
          Object.values(previewMap).forEach(id => {
            document.getElementById(id).textContent = '';
          });
        })
        .catch(err => {
          showAlert(`Error: ${err.message}`);
        });
    });
  });
  
  // Creates and injects the alert modal into the page
  function createAlertModal() {
    const modalHtml = `
      <div id="alertModal" style="
        display: none;
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        align-items: center; justify-content: center;
        z-index: 1000;
      ">
        <div style="
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          max-width: 90%; width: 300px;
          text-align: center;
        ">
          <p id="alertMessage" style="margin-bottom: 20px; color: #fff;"></p>
          <button id="alertOk" style="
            padding: 8px 16px;
            background: #dc3545;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">OK</button>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('alertOk').addEventListener('click', () => {
      document.getElementById('alertModal').style.display = 'none';
    });
  }
  
  // Shows the alert modal with the given message
  function showAlert(message) {
    const modal = document.getElementById('alertModal');
    document.getElementById('alertMessage').textContent = message;
    modal.style.display = 'flex';
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