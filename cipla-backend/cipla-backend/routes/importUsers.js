const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { registerUser } = require('../services/userService');

const router = express.Router();

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

router.post('/import-users', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Excel file is required' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const results = [];

    for (let row of rows) {
      const displayName = (row['Display Name'] || '').trim();
      const full_name = displayName.replace(/[.]+$/, '').replace(/\s+/g, ' ').trim();
      const firstName = full_name.split(' ')[0].toLowerCase();
      const username = firstName;
      const passwordPlain = row['Emp Code']?.toString();
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);
      const location = row['ZBM HQ'] || row['RBM HQ'] || null;
      const emp_code = passwordPlain;
      const role = 'field_manager';

      console.log("Localtion:",location);
      if (!username || !passwordPlain || !full_name) {
        results.push({ username, status: 400, message: 'Missing required fields' });
        continue;
      }

      const result = await registerUser({
        username,
        password: hashedPassword,
        role,
        full_name,
        location,
        emp_code,
      });

      results.push({ username, ...result });
    }

    fs.unlinkSync(req.file.path); // cleanup uploaded file
    return res.status(200).json({ message: 'Import completed', results });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ message: 'Server error during import' });
  }
});

module.exports = router;
