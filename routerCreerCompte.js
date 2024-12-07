const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js

// Middleware to parse URL-encoded data
router.use(express.urlencoded({ extended: true }));

// Route to render the account creation form
router.get("/creerCompte", async (req, res) => {
    try {
        if (req.session && req.session.user) { // Vérifie si une session active existe
            const userId = req.session.user.user_id;

            // Récupère la langue de l'utilisateur connecté
            const query = await db.execute(
                `SELECT langue FROM users WHERE user_id = ?`,
                [userId]
            );

            const result = query.rows[0];
            const userLangue = result.langue;

            // Rend la page avec la langue de l'utilisateur
            if (userLangue === 'fr') {
                return res.render("creerCompte", { userLangue });
            } else {
                return res.render("creerCompteEN", { userLangue });
            }
        }

        // Si aucune session n'est active, affiche la page par défaut (en français)
        res.render("creerCompte", { userLangue: 'fr' });
    } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        res.status(500).send('Erreur interne du serveur');
    }
});

router.get("/confirmation", (req, res) => {
    res.render("confirmation"); 
});

// Route for creating a new user
router.post("/add-user", async (req, res) => {
    const { username, email, password, role, language, secretQuestion, secretAnswer } = req.body;
    const groups = req.body.groups; // This will be an array

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
        res.redirect("confirmation");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating user and group");
    }
});

module.exports = router;
