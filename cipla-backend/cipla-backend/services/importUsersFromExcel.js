const xlsx = require('xlsx');
const path = require('path');
const bcrypt = require('bcryptjs');
const { registerUser } = require('../services/userService'); // reuse your logic

async function importUsers() {
  const filePath = path.join(__dirname, 'users.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet); // parsed rows

  for (let row of rows) {
    // Safely extract first name for username
    const displayName = (row['Display Name'] || '').trim();
    const firstName = displayName.split(' ')[0].toLowerCase();

    const username = firstName;
    const password = row['Emp Code']?.toString();
    const role = 'field_manager'; // or 'manager', change as needed
    const full_name = displayName.replace(/[.]+$/, '').replace(/\s+/g, ' ').trim();
    const location = row['ZBM HQ'] || row['RBM HQ'] || null;
    const emp_code = row['Emp Code']?.toString();

    console.log("Display Name:", username);
    console.log("Password:", password);
    console.log("Full Name:", full_name);
    console.log("Location:", location);
    // Check if required fields exist
    if (!username || !password || !full_name) {
      console.log(`❌ Skipped row due to missing required fields:`, row);
      continue;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await registerUser({
      username,
      password: hashedPassword,
      role,
      full_name,
      emp_code
    });

    console.log(`[${result.status}] ${username}: ${result.message}`);
  }
}

importUsers();
