const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js

// Middleware to parse URL-encoded data
router.use(express.urlencoded({ extended: true }));

// Route to render the account creation form
router.get("/creerCompte", (req, res) => {
    res.render("creerCompte"); // Renders the "creerCompte" view
});

// Route for creating a new user
router.post("/add-user", async (req, res) => {
    const { username, email, password, role, language, secretQuestion, secretAnswer } = req.body;
    const groups = req.body.groups; // This will be an array

    // Log the request body for debugging
    console.log("Request Body:", req.body);

    // Validate the request body
    if (!username || !email || !password || !role || !language || !secretQuestion || !secretAnswer || !groups || groups.length === 0) {
        return res.status(400).send("All fields are required");
    }

    try {
        // Hash the password and the secret answer
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const hashedSecretAnswer = await bcrypt.hash(secretAnswer, saltRounds);

        // Insert the user into the database
        const userSql = `INSERT INTO users (username, email, password, role, langue, secret_question, secret_answer_hash) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const result = await db.execute(userSql, [username, email, hashedPassword, role, language, secretQuestion, hashedSecretAnswer]);

        // Get the newly created user's ID
        const userId = result.lastInsertRowid;

        // Insert each group into the "groupes" table
        const groupSql = `INSERT INTO groupes (nom, user_id) VALUES (?, ?)`;
        for (const groupName of groups) {
            if (groupName) { // Ensure groupName is not undefined or empty
                await db.execute(groupSql, [groupName, userId]);
            }
        }

        // Redirect to login page with success message
        res.status(201).redirect("/connexion?userCreated=true");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating user and group");
    }
});

module.exports = router;
