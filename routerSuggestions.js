const express = require("express");
const router = express.Router();
const db = require("./db");
const { ensureAuthenticated, restrictToRole } = require("./session");

router.get("/suggestions", async function(req, res) {
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

    try {
        const { rows: listeSuggestions } = await db.execute(`
            SELECT s.*, u.username AS professeur
            FROM suggestions s
            JOIN users u ON s.user_id = u.user_id
        `);
    
        if (listeSuggestions.length > 0) {
            // Rending après avoir récupéré tous les likes
            if (userLangue === 'fr') {
                res.render("listeSuggestions", { suggestions: listeSuggestions });
            } else {
                res.render("listeSuggestionsEN", { suggestions: listeSuggestions });
            }
        } else {
            res.send("Aucune suggestion trouvée");
        }
    
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des suggestions");
    }
    
});

router.delete("/suggestion", async function(req, res) {
    const suggestionToDelete = req.body.suggestion; // Récupérer la liste des suggestions à supprimer

    if (!Array.isArray(suggestionsToDelete) || suggestionsToDelete.length === 0) {
        return res.status(400).send("Aucune suggestion à supprimer");
    }

    // Utilisation d'une query préparée pour supprimer les suggestions
    const placeholders = suggestionsToDelete.map(() => '?').join(',');
    const query = `DELETE FROM suggestions WHERE suggestion_id IN (${placeholders})`;

    try {
        await db.execute(query, suggestionsToDelete); // Exécution de la requête
        res.status(204).send(); // Envoie une réponse avec le code 204 (No Content)
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression des suggestions");
    }
});


module.exports = router;