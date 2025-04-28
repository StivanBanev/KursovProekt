const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',  // <-- Тук сложи твоята парола за MySQL
    database: 'student_register'
});

db.connect(error => {
    if (error) {
        console.error('Database connection error:', error);
    } else {
        console.log('Connected to the MySQL database.');
    }
});

app.post('/students', (req, res) => {
    const student = req.body;
    const sql = `
        INSERT INTO students (firstName, middleName, lastName, birthDate, city, address, egn, phone, email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        student.firstName,
        student.middleName,
        student.lastName,
        student.birthDate,
        student.city,
        student.address,
        student.egn,
        student.phone,
        student.email
    ], (error, results) => {
        if (error) {
            console.error('Error inserting student:', error);
            res.status(500).send('Error saving student to the database.');
        } else {
            res.send('Student saved successfully!');
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
