const birthDateInput = document.getElementById('birthDate');
const ageDisplay = document.getElementById('ageDisplay');

birthDateInput.addEventListener('input', function() {
    const birthDate = new Date(birthDateInput.value);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (!isNaN(age)) {
        ageDisplay.textContent = `Age: ${age} years`;
    } else {
        ageDisplay.textContent = '';
    }
});

document.getElementById('studentForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const student = {
        firstName: document.getElementById('firstName').value,
        middleName: document.getElementById('middleName').value,
        lastName: document.getElementById('lastName').value,
        birthDate: document.getElementById('birthDate').value,
        city: document.getElementById('city').value,
        address: document.getElementById('address').value,
        egn: document.getElementById('egn').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value
    };

    fetch('http://localhost:3000/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
    })
    .then(response => response.text())
    .then(message => {
        alert(message);
        document.getElementById('studentForm').reset();
        document.getElementById('ageDisplay').textContent = '';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while saving the student.');
    });
});
