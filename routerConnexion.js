const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js

router.use(express.urlencoded({ extended: true }));

// Route to render the login form
router.get("/connexion", (req, res) => {
    res.render("connexion"); 
});

// Route to handle login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the user exists in the database
        const query = "SELECT * FROM users WHERE username = ?";
        const result = await db.execute(query, [username]);

        if (result.rows.length === 0) {
            return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect");
        }

        const user = result.rows[0];

        // Verify the password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect");
        }

        // Check the role and redirect accordingly
        if (user.role === "administrateur") {
            res.redirect("/admin"); // Redirect to admin page
        } else if (user.role === "professeur") {
            res.redirect("/professeur"); // Redirect to professor page
        } else {
            res.status(400).send("Role non reconnu");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la connexion");
    }
});

module.exports = router;
