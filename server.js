// server.js

const express = require('express');
const path    = require('path');
const mysql   = require('mysql2');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Serve all frontend files from the project root
app.use(express.static(__dirname));

// Redirect root “/” to login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// MySQL connection pool
const pool = mysql.createPool({
  host:     'localhost',
  user:     'root',
  password: '',
  database: 'student_register'
});

// Helper to normalize incoming field names
function normalizeData(data) {
  if (data.facNumber) {
    data.facultyNumber = data.facNumber;
    delete data.facNumber;
  }
  if (data.group) {
    data.groupNumber = data.group;
    delete data.group;
  }
  return data;
}

const ALLOWED = [
  'firstName','middleName','lastName',
  'facultyNumber','birthDate','city','address',
  'egn','phone','email','specialty','course','groupNumber'
];

// CREATE student with uniqueness checks and event log
app.post('/students', (req, res) => {
  let data = normalizeData({ ...req.body });
  const fields = Object.keys(data).filter(f => ALLOWED.includes(f));
  if (!fields.length) {
    return res.status(400).json({ error: 'No valid fields provided.' });
  }

  const facNum = data.facultyNumber || null;
  const egn    = data.egn           || null;
  const phone  = data.phone         || null;

  // check uniqueness
  pool.query(
    `SELECT facultyNumber, egn, phone FROM students
     WHERE facultyNumber = ? OR egn = ? OR phone = ?`,
    [facNum, egn, phone],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length) {
        const ex = rows[0], cf = [];
        if (facNum && ex.facultyNumber === facNum) cf.push('Faculty Number');
        if (egn    && ex.egn           === egn)    cf.push('EGN');
        if (phone  && ex.phone         === phone)  cf.push('Phone');
        const msg = cf.length > 1
          ? `${cf.join(' and ')} already exist`
          : `${cf[0]} already exists`;
        return res.status(400).json({ error: msg });
      }
      // insert student
      const cols   = fields.map(f => `\`${f}\``).join(',');
      const marks  = fields.map(() => '?').join(',');
      const params = fields.map(f => data[f]);
      const sql    = `INSERT INTO students (${cols}) VALUES (${marks})`;
      pool.query(sql, params, (e2, result) => {
        if (e2) return res.status(500).json({ error: e2.message });
        const sid = result.insertId;
        // log Created event
        pool.query(
          `INSERT INTO events
             (egn, firstName, middleName, lastName, facultyNumber, specialty, course, action)
           SELECT egn, firstName, middleName, lastName, facultyNumber, specialty, course, 'Created'
           FROM students WHERE id = ?`,
          [sid]
        );
        res.json({ message: 'Student added', id: sid });
      });
    }
  );
});

// SEARCH students by name, egn, facultyNumber or phone
app.get('/students/search', (req, res) => {
  const { name = '', egn, facultyNumber, phone } = req.query;
  let sql, params = [];

  if (name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      sql    = 'SELECT * FROM students WHERE firstName = ?';
      params = [parts[0]];
    } else if (parts.length === 2) {
      sql    = 'SELECT * FROM students WHERE firstName = ? AND middleName = ?';
      params = [parts[0], parts[1]];
    } else {
      const [first, middle, ...rest] = parts;
      const last = rest.join(' ');
      sql    = 'SELECT * FROM students WHERE firstName = ? AND middleName = ? AND lastName = ?';
      params = [first, middle, last];
    }
  } else if (egn) {
    sql    = 'SELECT * FROM students WHERE egn = ?';
    params = [egn];
  } else if (facultyNumber) {
    sql    = 'SELECT * FROM students WHERE facultyNumber = ?';
    params = [facultyNumber];
  } else if (phone) {
    sql    = 'SELECT * FROM students WHERE phone = ?';
    params = [phone];
  } else {
    return res.status(400).json({ error: 'Search parameter is required' });
  }

  pool.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// UPDATE student with uniqueness check and event log
app.put('/students/update', (req, res) => {
  let data = normalizeData({ ...req.body });
  const originalEgn = data.egn;
  if (!originalEgn) {
    return res.status(400).json({ error: 'EGN is required for update.' });
  }

  const fields = Object.keys(data).filter(f => f !== 'egn' && ALLOWED.includes(f));
  if (!fields.length) {
    return res.status(400).json({ error: 'No valid fields to update.' });
  }

  const facNum = data.facultyNumber || null;
  const newEgn = data.egn           || null;
  const phone  = data.phone         || null;

  const checks = [], params = [];
  if (facNum) { checks.push('facultyNumber = ?'); params.push(facNum); }
  if (newEgn) { checks.push('egn = ?');            params.push(newEgn); }
  if (phone)  { checks.push('phone = ?');          params.push(phone); }

  function doUpdate() {
    const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');
    const ps         = fields.map(f => data[f]).concat(originalEgn);
    const sql        = `UPDATE students SET ${setClause} WHERE egn = ?`;
    pool.query(sql, ps, err => {
      if (err) return res.status(500).json({ error: err.message });
      // log Updated event
      pool.query(
        `INSERT INTO events
           (egn, firstName, middleName, lastName, facultyNumber, specialty, course, action)
         SELECT egn, firstName, middleName, lastName, facultyNumber, specialty, course, 'Updated'
         FROM students WHERE egn = ?`,
        [originalEgn]
      );
      res.json({ message: 'Student updated' });
    });
  }

  if (checks.length) {
    const uniqSql = `
      SELECT facultyNumber, egn, phone FROM students
      WHERE (${checks.join(' OR ')}) AND egn != ?`;
    params.push(originalEgn);
    pool.query(uniqSql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length) {
        const ex = rows[0], cf = [];
        if (facNum && ex.facultyNumber === facNum) cf.push('Faculty Number');
        if (newEgn && ex.egn           === newEgn)    cf.push('EGN');
        if (phone  && ex.phone         === phone)    cf.push('Phone');
        const msg = cf.length > 1
          ? `${cf.join(' and ')} already exist`
          : `${cf[0]} already exists`;
        return res.status(400).json({ error: msg });
      }
      doUpdate();
    });
  } else {
    doUpdate();
  }
});

// DELETE student by EGN with event log
app.delete('/students/:egn', (req, res) => {
  const targetEgn = req.params.egn;
  pool.query(
    'DELETE FROM students WHERE egn = ?',
    [targetEgn],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      // log Deleted event
      pool.query(
        `INSERT INTO events
           (egn, action, timestamp)
         VALUES (?, 'Deleted', NOW())`,
        [targetEgn]
      );
      res.json({ message: 'Student deleted' });
    }
  );
});

// GET events (history) with optional date and/or EGN filters
app.get('/events', (req, res) => {
  const { limit = 10, offset = 0, date, egn } = req.query;
  const cond  = [], params = [];

  if (date) {
    cond.push('DATE(timestamp) = ?');
    params.push(date);
  }
  if (egn) {
    cond.push('egn = ?');
    params.push(egn);
  }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  const sql   = `
    SELECT * FROM events
    ${where}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  pool.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
