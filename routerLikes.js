const express = require("express");
const router = express.Router();
const db = require("./db");
const { ensureAuthenticated, restrictToRole } = require("./session");

router.get("/likes", async function(req, res) {
    const userId = req.session.user.user_id;
    console.log("User id is", userId); 

    if (!userId) {
        return res.status(401).send("Utilisateur non authentifié"); // Ajouter un contrôle d'authentification
    }

    const query = await db.execute(
        `SELECT langue, role FROM users WHERE user_id = ?`, 
        [userId] 
    );

    const result = query.rows[0];
    const userLangue = result.langue;
    const userRole = result.role;
    console.log("User's chosen language is:", userLangue);

    try {
        const { rows: listeLikes } = await db.execute(`
            SELECT l.*, c.titre AS costume, u.username AS professeur
            FROM likes l
            JOIN costumes c ON l.costume_id = c.costume_id
            JOIN users u ON l.user_id = u.user_id
        `);
    
        if (listeLikes.length > 0) {
            // Rending après avoir récupéré tous les likes
            if (userLangue === 'fr') {
                res.render("listeLikes", { likes: listeLikes });
            } else {
                res.render("listeLikesEN", { likes: listeLikes });
            }
        } else {
            res.send("Aucun like trouvé");
        }
    
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des likes");
    }
    
});

router.delete("/likes", async function(req, res) {
    const likesToDelete = req.body.likes; // Récupérer la liste des likes à supprimer

    if (!Array.isArray(likesToDelete) || likesToDelete.length === 0) {
        return res.status(400).send("Aucun like à supprimer");
    }

    // Utilisation d'une query préparée pour supprimer les likes
    const placeholders = likesToDelete.map(() => '?').join(',');
    const query = `DELETE FROM likes WHERE like_id IN (${placeholders})`;

    try {
        await db.execute(query, likesToDelete); // Exécution de la requête
        res.status(204).send(); // Envoie une réponse avec le code 204 (No Content)
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression des likes");
    }
});


module.exports = router;