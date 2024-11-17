const express = require("express");
const router = express.Router();
const db = require("./db");
const { ensureAuthenticated, restrictToRole } = require("./session");

router.get("/suggestions", async function(req, res) {
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
        const { rows: listeSuggestions } = await db.execute(`
            SELECT s.*, u.username AS professeur
            FROM suggestions s
            JOIN users u ON s.user_id = u.user_id
        `);
        if (listeSuggestions.length > 0) {
            if (userLangue === 'fr') {
                res.render("listeSuggestions", { suggestions: listeSuggestions });
            } else {
                res.render("listeSuggestionsEN", { suggestions: listeSuggestions });
            }
        } else {
            if (userLangue === 'fr') {
                res.render("listeSuggestions", { suggestions: [] });
            } else {
                res.render("listeSuggestionsEN", { suggestions: [] }); 
            }
        }
    
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des suggestions");
    }
    
});

router.delete("/suggestions", async function(req, res) {
    const suggestionsToDelete = req.body.suggestions; 
    if (!Array.isArray(suggestionsToDelete) || suggestionsToDelete.length === 0) {
        return res.status(400).send("Aucune suggestion à supprimer");
    }

    // Utilisation d'une query préparée pour supprimer les suggestions
    const placeholders = suggestionsToDelete.map(() => '?').join(',');
    console.log(suggestionsToDelete);
    const query = `DELETE FROM suggestions WHERE suggestion_id IN (${placeholders})`;
    
    try {
        await db.execute(query, suggestionsToDelete); 
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression des suggestions");
    }
});


module.exports = router;