const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js

// Middleware to parse URL-encoded data
router.use(express.urlencoded({ extended: true }));

// Route to render the account modification form
router.get("/modifierCompte/:id", async (req, res) => {
    const userId = req.params.id;
    console.log("User ID:", userId); // Vérification de l'ID

    try {
        // Obtenir les informations de l'utilisateur et du groupe directement
        //const userResult = await db.execute("SELECT * FROM users WHERE user_id = ?", [userId]);
        //const groupResult = await db.execute("SELECT * FROM groupes WHERE user_id = ?", [userId]);
        const userResult = await db.execute({
            sql: `SELECT * FROM users WHERE user_id = :userId`,
            args: {
                userId: userId,
            },
        });
        
        console.log("user result is " + userResult[0]);
        // Vérifiez si des utilisateurs ont été trouvés
        if (!userResult || userResult.length === 0 || !userResult[0].length) {
            console.error("Utilisateur non trouvé pour ID :", userId);
            return res.status(404).send("Utilisateur non trouvé");
        }

        // Récupération des données utilisateur et groupe
        const user = userResult[0][0]; // Premier utilisateur trouvé
        const group = groupResult[0].length ? groupResult[0][0].nom : "";

        // Rendu de la page avec les données récupérées
        res.render("modifierCompte", {
            user,
            group
        });
    } catch (error) {
        console.error("Erreur pendant l'opération DB :", error);
        res.status(500).send("Erreur lors de la récupération des données utilisateur");
    }
});

// Route for updating an existing user
router.post("/modifier-user/:id", async (req, res) => {
    const userId = req.params.id;
    const { username, email, password, role, language, groupName } = req.body;

    try {
        let hashedPassword = null;
        if (password) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(password, saltRounds);
        }

        // Update the user's information
        const userSql = `
            UPDATE users SET 
                username = ?, 
                email = ?, 
                ${hashedPassword ? "password = ?," : ""} 
                role = ?, 
                langue = ? 
            WHERE user_id = ?`;
        const userParams = hashedPassword ? [username, email, hashedPassword, role, language, userId] : [username, email, role, language, userId];

        await db.execute(userSql, userParams);

        // Update or insert the group
        const groupSql = `
            INSERT INTO groupes (nom, user_id) VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET nom = excluded.nom`;
        await db.execute(groupSql, [groupName, userId]);

        res.status(200).redirect("/users?userUpdated=true");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating user and group");
    }
});

module.exports = router;
