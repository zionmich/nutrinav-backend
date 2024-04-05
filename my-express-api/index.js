// Import required modules
const express = require("express");
const { VercelRequest, VercelResponse } = require('@vercel/node');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const supabaseClient = require('./my-express-api/supabaseClient');

// Initialize Express app
const app = express();

// Initialize supabase client
const supabase = supabaseClient();

// Define middleware to handle JSON bodies
app.use(express.json());

// Define the handler function
async function handler(req, res) {
    try {
        const { name = 'World' } = req.query;
        return res.json({
            message: `Hello ${name}!`,
        });
    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).json({ error: 'An error occurred while processing data.' });
    }
}

// Define a route to handle the processing of data
app.post("/process-data", async (req, res) => {
    try {
        // Your existing code for processing data goes here...
        res.status(200).json({ message: "Data processed successfully." });
    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).json({ error: 'An error occurred while processing data.' });
    }
});

// Define the endpoint using the handler function
app.get("/api/data", handler);

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
