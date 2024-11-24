const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js

router.use(express.urlencoded({ extended: true }));

// Route to render the login form
router.get("/connexion", (req, res) => {
    res.render("connexion"); 
});

// Route to render the reset password form

// Route for login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = "SELECT * FROM users WHERE username = ?";
        const result = await db.execute(query, [username]);

        if (result.rows.length === 0) {
            return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect");
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).send("Nom d'utilisateur ou mot de passe incorrect");
        }

        // Save user details in the session
        req.session.user = {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            langue: user.langue
        };

        // Redirect based on user role
        if (user.role === "administrateur") {
            res.redirect("/admin");
        } else if (user.role === "professeur") {
            res.redirect("/catalogue");
        } else {
            res.status(400).send("Role non reconnu");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la connexion");
    }
});

// Route to render the reset password form
// Route to render the reset password form
router.get("/reset-password", (req, res) => {
    res.render("reset-password-email");
});

// Route for handling the reset password logic
// Route for handling the reset password logic
router.post("/reset-password", async (req, res) => {
    const { email } = req.body;  // Get the email from the form submission

    console.log("Email is ", email);  // Log the email value to make sure it's passed in the request body

    if (!email) {
        return res.status(400).send("Veuillez entrer un email");
    }

    try {
        const query = "SELECT * FROM users WHERE email = ?";
        const result = await db.execute(query, [email]);

        if (result.rows.length === 0) {
            return res.status(400).send("Email non trouvé");
        }

        const user = result.rows[0];

        // Render the reset password form with the secret question
        res.render("reset-password-form", {
            secretQuestion: user.secret_question,
            email  // Pass the secret question to the next form
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des informations utilisateur");
    }
});




router.post("/reset-password-form", async (req, res) => {
    const { email, secretQuestion, secretAnswer, newPassword, confirmNewPassword } = req.body;
   
    if (!email || !secretQuestion || !secretAnswer || !newPassword || !confirmNewPassword) {
        return res.status(400).send("Tous les champs sont obligatoires");
    }

    // Vérifier si les mots de passe correspondent
    if (newPassword !== confirmNewPassword) {
        return res.status(400).send("Les mots de passe ne correspondent pas");
    }

    try {
        const query = "SELECT * FROM users WHERE email = ?";
        const result = await db.execute(query, [email]);

        if (result.rows.length === 0) {
            return res.status(400).send("Email non trouvé");
        }

        const user = result.rows[0];

        // Vérification de la question secrète
        if (user.secret_question !== secretQuestion) {
            return res.status(400).send("Question secrète incorrecte");
        }

        // Vérification de la réponse secrète
        const answerMatch = await bcrypt.compare(secretAnswer, user.secret_answer_hash);
        if (!answerMatch) {
            return res.status(400).send("Réponse secrète incorrecte");
        }
       
        // Hash du nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mise à jour du mot de passe dans la base de données
        const updateSql = "UPDATE users SET password = ? WHERE email = ?";
        await db.execute(updateSql, [hashedPassword, email]);

        res.status(200).send("Mot de passe réinitialisé avec succès");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la réinitialisation du mot de passe");
    }
});



module.exports = router;
