const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js
const { ensureAuthenticated, restrictToRole } = require("./session");

// Middleware to parse URL-encoded data
router.use(express.urlencoded({ extended: true }));

// Route to render the account modification form
router.get("/modifierCompte", ensureAuthenticated, restrictToRole("administrateur"), async (req, res) => {
    const userIdSession = req.session.user.user_id;
    console.log("User id stored in session is", userIdSession); 
    const userId = req.params.id;
    console.log("User ID:", userId); // Vérification de l'ID

    try {
        // Obtenir les informations de l'utilisateur et du groupe directement
        const user = await db.execute("SELECT * FROM users WHERE user_id = ?", [userIdSession]);
        const groups = await db.execute("SELECT nom FROM groupes WHERE user_id = ?", [userIdSession]);
        
        const userResult = user.rows[0];
        const groupResults = groups.rows.map(row => row.nom);
        
        console.log("user result is ", userResult);
        console.log("group results are ", groupResults);
        
        const query = await db.execute(
            `SELECT langue, role FROM users WHERE user_id = ?`,
            [userIdSession] 
        );

        const result = query.rows[0];
        const userLangue = result.langue;
        const userRole = result.role;
        console.log("User's chosen language is:", userLangue);
        if (userLangue === 'fr') {
            res.render("modifierCompte", {
                userResult,
                group: groupResults,
                userRole
            });
        } else {
            res.render("modifierCompteEN", {
                userResult,
                group: groupResults,
                userRole
            });
        }
    } catch (error) {
        console.error("Erreur pendant l'opération DB :", error);
        res.status(500).send("Erreur lors de la récupération des données utilisateur");
    }
});

// Route for updating an existing user
router.post("/modifier-user/:id", async (req, res) => {
    const userIdSession = req.session.user.user_id;
    const { username, email, password, role, language } = req.body;
    const groups = req.body.groups; // This will be an array
    console.log("User ID in POST:", userIdSession);
    console.log("Form data:", req.body);

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
        const userParams = hashedPassword
            ? [username, email, hashedPassword, role, language, userIdSession]
            : [username, email, role, language, userIdSession];

        console.log("User update parameters:", userParams);
        await db.execute(userSql, userParams);

        // Delete existing groups for the user
        await db.execute("DELETE FROM groupes WHERE user_id = ?", [userIdSession]);

        // Insert each group into the "groupes" table
        const groupSql = `INSERT INTO groupes (nom, user_id) VALUES (?, ?)`;
        for (const groupName of groups) {
            await db.execute(groupSql, [groupName, userIdSession]);
        }

        res.status(200).redirect("/admin");
    } catch (error) {
        console.error("Error updating user and group:", error);
        res.status(500).send("Error updating user and group");
    }
});

module.exports = router;
