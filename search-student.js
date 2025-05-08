// search-student.js

const API_BASE = 'http://localhost:3000';

// upon script load, inject the alert modal into the document
createAlertModal();

document.getElementById('searchBtn').addEventListener('click', () => {
  const filter = document.getElementById('searchFilter').value;
  const query  = document.getElementById('searchInput').value.trim();
  if (!query) {
    showAlert('Please enter a search value.');
    return;
  }
  fetch(`${API_BASE}/students/search?${filter}=${encodeURIComponent(query)}`)
    .then(res =>
      res.json().then(data => {
        if (!res.ok) throw new Error(data.error || 'Search failed');
        return data;
      })
    )
    .then(students => renderResults(students))
    .catch(err => showAlert(err.message));
});

function renderResults(students) {
  const container = document.getElementById('resultsContainer');
  container.innerHTML = '';

  if (students.length === 0) {
    container.textContent = 'No students found.';
    return;
  }

  students.forEach(student => {
    const entry = document.createElement('div');
    entry.className = 'student-entry';
    entry._original = { ...student };

    let html = '<table class="student-table"><tbody>';
    Object.keys(student)
      .filter(k => k !== 'id')
      .forEach(key => {
        let val = student[key] || '';
        if (key === 'birthDate') {
          const raw = val.split('T')[0];              // "YYYY-MM-DD"
          const [y, m, d] = raw.split('-');
          val = `${d}.${m}.${y}`;
        }
        html += `<tr>
            <th>${toLabel(key)}</th>
            <td class="${key}">${val}</td>
          </tr>`;
        if (key === 'birthDate') {
          const age = calculateAge(val);             // val is "DD.MM.YYYY"
          html += `<tr>
            <th>Age</th>
            <td>${age}</td>
          </tr>`;
        }
      });
    html += '</tbody></table>';

    html += `
      <div class="actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>`;

    entry.innerHTML = html;
    container.appendChild(entry);

    entry.querySelector('.edit-btn')
         .addEventListener('click', () => onEdit(entry));
    entry.querySelector('.delete-btn')
         .addEventListener('click', () => onDelete(entry));
  });
}

function calculateAge(dateDDMMYYYY) {
  const [d, m, y] = dateDDMMYYYY.split('.').map(Number);
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

function toLabel(key) {
  return {
    firstName:     'First Name',
    middleName:    'Middle Name',
    lastName:      'Last Name',
    facultyNumber: 'Faculty Number',
    birthDate:     'Birth Date',
    city:          'City',
    address:       'Address',
    egn:           'EGN',
    phone:         'Phone',
    email:         'Email',
    specialty:     'Specialty',
    course:        'Course',
    groupNumber:   'Group Number'
  }[key] || key;
}

function onEdit(entry) {
  const table     = entry.querySelector('.student-table');
  const editBtn   = entry.querySelector('.edit-btn');
  const deleteBtn = entry.querySelector('.delete-btn');
  let cancelBtn   = entry.querySelector('.cancel-btn');
  const rows      = Array.from(table.querySelectorAll('tbody tr'));

  if (editBtn.textContent === 'Edit') {
    deleteBtn.style.display = 'none';

    cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.marginLeft = '6px';
    entry.querySelector('.actions').append(cancelBtn);

    rows.forEach(row => {
      const thText = row.querySelector('th').textContent;
      if (thText === 'EGN' || thText === 'Age') return;
      const td  = row.querySelector('td');
      const key = td.className;
      let val   = td.textContent;

      if (key === 'birthDate') {
        const [d, m, y] = val.split('.');
        val = `${y}-${m}-${d}`; // YYYY-MM-DD for input
        td.innerHTML = `<input type="date" class="edit-${key}" value="${val}">`;
      } else {
        td.innerHTML = `<input type="text" class="edit-${key}" value="${val}">`;
      }
    });

    editBtn.textContent = 'Save';

    cancelBtn.addEventListener('click', () => {
      rows.forEach(row => {
        const thText = row.querySelector('th').textContent;
        const td = row.querySelector('td');
        const key = td.className;
        if (thText === 'EGN' || thText === 'Age') {
          // restore Age separately
        } else {
          const orig = entry._original[key] || '';
          let display = orig;
          if (key === 'birthDate' && orig.includes('T')) {
            const [y, m, d] = orig.split('T')[0].split('-');
            display = `${d}.${m}.${y}`;
          }
          td.textContent = display;
        }
      });
      editBtn.textContent = 'Edit';
      deleteBtn.style.display = '';
      cancelBtn.remove();
    });
  } else {
    const updated = {};
    rows.forEach(row => {
      const thText = row.querySelector('th').textContent;
      const td     = row.querySelector('td');
      const key    = td.className;
      if (thText === 'EGN' || thText === 'Age') return;
      const inp = entry.querySelector(`.edit-${key}`);
      updated[key] = inp.value.trim();
    });

    // keep existing EGN for URL
    updated.egn = entry._original.egn;

    fetch(`${API_BASE}/students/update`, {
      method:  'PUT',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify(updated)
    })
      .then(res =>
        res.json().then(data => {
          if (!res.ok) throw new Error(data.error || 'Update failed');
          return data;
        })
      )
      .then(() => {
        entry._original = { ...entry._original, ...updated };
        // re-render this entry
        renderResults([entry._original]);
      })
      .catch(err => showAlert(err.message));
  }
}

function onDelete(entry) {
  const egn = entry.querySelector('td.egn').textContent;

  // Create a local modal
  const modal = document.createElement('div');
  modal.style = `
    position:fixed; top:0; left:0; right:0; bottom:0;
    background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center;
    z-index:1000;
  `;
  modal.innerHTML = `
    <div style="
      background:#2a2a2a;
      padding:20px; border-radius:8px;
      max-width:90%; width:300px; text-align:center;
    ">
      <p style="margin-bottom:20px; color:#fff;">
        Are you sure you want to delete this student?
      </p>
      <button id="modalYes" style="
        margin-right:10px; padding:8px 16px;
        background:#dc3545; color:#fff;
        border:none; border-radius:4px; cursor:pointer;
      ">Yes</button>
      <button id="modalNo" style="
        padding:8px 16px;
        background:#6c757d; color:#fff;
        border:none; border-radius:4px; cursor:pointer;
      ">No</button>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector('#modalNo').addEventListener('click', () => modal.remove());
  modal.querySelector('#modalYes').addEventListener('click', () => {
    fetch(`${API_BASE}/students/${egn}`, { method: 'DELETE' })
      .then(res =>
        res.json().then(data => {
          if (!res.ok) throw new Error(data.error || 'Delete failed');
          return data;
        })
      )
      .then(() => {
        entry.remove();
        modal.remove();
      })
      .catch(err => {
        showAlert(err.message);
        modal.remove();
      });
  });
}

// injects a reusable alert modal into the page
function createAlertModal() {
  const modalHtml = `
    <div id="alertModal" style="
      display: none;
      position: fixed; top:0; left:0; right:0; bottom:0;
      background:rgba(0,0,0,0.5);
      align-items:center; justify-content:center;
      z-index:1000;
    ">
      <div style="
        background:#2a2a2a;
        padding:20px; border-radius:8px;
        max-width:90%; width:300px; text-align:center;
      ">
        <p id="alertMessage" style="margin-bottom:20px; color:#fff;"></p>
        <button id="alertOk" style="
          padding:8px 16px; background:#dc3545; color:#fff;
          border:none; border-radius:4px; cursor:pointer;
        ">OK</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('alertOk')
          .addEventListener('click', () => {
            document.getElementById('alertModal').style.display = 'none';
          });
}

// shows the alert modal with the given message
function showAlert(message) {
  document.getElementById('alertMessage').textContent = message;
  document.getElementById('alertModal').style.display = 'flex';
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