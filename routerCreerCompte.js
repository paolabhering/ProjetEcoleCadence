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
    const { username, email, password, role, language } = req.body;
    const groups = req.body.groups; // This will be an array

    // Log the request body
    console.log("Request Body:", req.body);

    // Validate the request body
    if (!username || !email || !password || !role || !language || !groups || groups.length === 0) {
        return res.status(400).send("All fields are required");
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the user into the database
        const userSql = `INSERT INTO users (username, email, password, role, langue) VALUES (?, ?, ?, ?, ?)`;
        const result = await db.execute(userSql, [username, email, hashedPassword, role, language]);

        // Get the newly created user's ID
        const userId = result.lastInsertRowid;

        // Insert each group into the "groupes" table
        const groupSql = `INSERT INTO groupes (nom, user_id) VALUES (?, ?)`;
        for (const groupName of groups) {
            await db.execute(groupSql, [groupName, userId]);
        }

        res.status(201).redirect("/connexion?userCreated=true");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating user and group");
    }
});

module.exports = router;
