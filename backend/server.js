require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// CORS: allow local dev + the deployed Render frontend
const allowedOrigins = [
    'http://localhost:5173',
    'https://pro-tasker-2.onrender.com',
];
// Also honor a CLIENT_URL env var if you set one (optional now)
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

const corsOptions = {
    origin: function (origin, callback) {
        // allow non-browser tools (curl, server-to-server) that send no origin
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('Not allowed by CORS'), false);
        }
        return callback(null, true);
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('Pro-Tasker API is running'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));