const express = require("express");
const router = express.Router();
const db = require("./db");
const { ensureAuthenticated, restrictToRole } = require("./session");

router.get("/likes", async function(req, res) {
    const userId = req.session.user.user_id;

    if (!userId) {
        return res.status(401).send("Utilisateur non authentifié"); // Ajouter un contrôle d'authentification
    }

    const query = await db.execute(
        `SELECT langue, role FROM users WHERE user_id = ?`, 
        [userId] 
    );

    const result = query.rows[0];
    const userLangue = result.langue;

    try {
        const { rows: listeLikes } = await db.execute(`
            SELECT l.*, c.titre AS costume, u.username AS professeur
            FROM likes l
            JOIN costumes c ON l.costume_id = c.costume_id
            JOIN users u ON l.user_id = u.user_id
        `);
    
        if (listeLikes.length > 0) {
            if (userLangue === 'fr') {
                res.render("listeLikes", { likes: listeLikes });
            } else {
                res.render("listeLikesEN", { likes: listeLikes });
            }
        } else {
            if (userLangue === 'fr') {
                res.render("listeLikes", { likes: [] });
            } else {
                res.render("listeLikesEN", { likes: [] }); 
            }
        }
    
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des ♥");
    }
    
});

router.delete("/likes", async function(req, res) {
    const likesToDelete = req.body.likes; 
   
    if (!Array.isArray(likesToDelete) || likesToDelete.length === 0) {
        return res.status(400).send("Aucun ♥ à supprimer");
    }

    // Utilisation d'une query préparée pour supprimer les likes
    const placeholders = likesToDelete.map(() => '?').join(',');
    const query = `DELETE FROM likes WHERE like_id IN (${placeholders})`;

    try {
        await db.execute(query, likesToDelete); 
        res.status(204).send(); 
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression des ♥");
    }
});


module.exports = router;