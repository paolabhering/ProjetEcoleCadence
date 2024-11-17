const express = require("express");
const router = express.Router();
const db = require("./db");
const { ensureAuthenticated, restrictToRole } = require("./session");

router.get("/favoris", async function(req, res) {
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
        const { rows: listeFavoris } = await db.execute(`
            SELECT f.*, c.titre AS costume, u.username AS professeur, g.nom AS groupe
            FROM favorites f
            JOIN costumes c ON f.costume_id = c.costume_id
            JOIN groupes g ON  f.group_id = g.groupe_id
            JOIN users u ON g.user_id = u.user_id
        `);
        
        if (listeFavoris.length > 0) {
            if (userLangue === 'fr') {
                res.render("listeFavoris", { favoris: listeFavoris });
            } else {
                res.render("listeFavorisEN", { favoris: listeFavoris });
            }
        } else {
            if (userLangue === 'fr') {
                res.render("listeFavoris", { favoris: [] });
            } else {
                res.render("listeFavorisEN", { favoris: [] }); 
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des favoris");
    }
    
});

router.delete("/favoris", async function(req, res) {
    const favoritesToDelete = req.body.favoris;

    if (!Array.isArray(favoritesToDelete) || favoritesToDelete.length === 0) {
        return res.status(400).send("Aucun favori à supprimer");
    }

    // Utilisation d'une query préparée pour supprimer les favoris
    const placeholders = favoritesToDelete.map(() => '?').join(',');
    const query = `DELETE FROM favorites WHERE favorite_id IN (${placeholders})`;

    try {
        await db.execute(query, favoritesToDelete);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression des favoris");
    }
});


module.exports = router;