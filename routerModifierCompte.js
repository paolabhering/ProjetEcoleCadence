const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js
const { ensureAuthenticated, restrictToRole } = require("./session");

// Middleware to parse URL-encoded data
router.use(express.urlencoded({ extended: true }));

// Route to render the account modification form
router.get("/modifierCompte", ensureAuthenticated,restrictToRole("administrateur"), async (req, res) => {
    const userIdSession = req.session.user.user_id;
    console.log("User id stored in session is", userIdSession); 
    const userId = req.params.id;
    console.log("User ID:", userId); // Vérification de l'ID

    try {
        // Obtenir les informations de l'utilisateur et du groupe directement
        const user = await db.execute("SELECT * FROM users WHERE user_id = ?", [userIdSession]);
        const group = await db.execute("SELECT * FROM groupes WHERE user_id = ?", [userIdSession]);
        
        const userResult = user.rows[0];
        const groupResult = group.rows[0];
        
        console.log("user result is ", userResult);
        console.log("user result is ", groupResult);
        
        

        const query = await db.execute(
            `SELECT langue,role FROM users WHERE user_id = ?`,
            [userIdSession] 
        );

        const result = query.rows[0];
        const userLangue = result.langue;
        const userRole = result.role;
        console.log("User's chosen language is:", userLangue);
        if (userLangue === 'fr') {
            res.render("modifierCompte", {
                userResult,
                group: groupResult.nom,
                userRole
            });
          
      } else {
        res.render("modifierCompteEN", {
            userResult,
            group: groupResult.nom,
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
    const { username, email, password, role, language, groupName } = req.body;
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

        // Check if the group exists for the user and either update or insert accordingly
        const groupExists = await db.execute("SELECT * FROM groupes WHERE user_id = ?", [userIdSession]);

        if (groupExists.rows.length > 0) {
            // If group already exists, perform an update
            const updateGroupSql = `
                UPDATE groupes SET nom = ? WHERE user_id = ?`;
            await db.execute(updateGroupSql, [groupName, userIdSession]);
        } else {
            // If group doesn't exist, perform an insert
            const insertGroupSql = `
                INSERT INTO groupes (nom, user_id) VALUES (?, ?)`;
            await db.execute(insertGroupSql, [groupName, userIdSession]);
        }
        res.status(200).redirect("/admin");
    } catch (error) {
        console.error("Error updating user and group:", error);
        res.status(500).send("Error updating user and group");
    }
});


module.exports = router;
