// const express = require('express');
// or the import express from 'express';
import express from 'express';
import authRoutes from './routes/auth.route.js';
import dotenv from 'dotenv';
import connectDB from './lib/db.js';
const app = express();
dotenv.config();
const PORT = process.env.PORT
    // middlewares to extract json data from request body
app.use(express.json());
// routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log('Server is running on port:' + PORT);
    connectDB();

})