const path = require("path");


require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoute = require('./routes/authRoute');
const managerRoute = require('./routes/managerRoute');
const videoRoutes = require('./routes/videoRoutes.js');
const uploadRoutes = require('./routes/upload.js');
const adminRoute = require('./routes/adminRoute.js');
const importUserRoute = require('./routes/importUsers.js');

require('./db/db');

const app = express();

// ✅ Simple CORS for local
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes
app.use('/auth', authRoute);
app.use('/api', adminRoute);
app.use('/api', managerRoute);
app.use('/api', videoRoutes);
app.use('/api', uploadRoutes);
app.use('/api', importUserRoute);

// ✅ Test route
app.get('/', (req, res) => {
  res.send('hii cipla backend made by pratik 🚀');
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong",
  });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});