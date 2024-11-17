const express = require("express");
const router = express.Router();
const db = require("./db");
const { ensureAuthenticated } = require("./session"); // correction: assurez-vous que vous importez la fonction correcte

async function getUserLanguage(userId) {
    const query = await db.execute(`SELECT langue FROM users WHERE user_id = ?`, [userId]);
    const result = query.rows[0];
    if (result) {
        return result.langue; // Renvoie la langue si l'utilisateur existe
    }
    return null; // ou une valeur par défaut
}

router.get("/filtre", ensureAuthenticated, async (req, res) => {
    const { user } = req.session;
    const userId = user ? user.user_id : null; 

    const userLangue = await getUserLanguage(userId);

    if (userLangue === 'fr') {
        res.render("filtreCatalogue", { userLangue });
    } else {
        res.render("filtreCatalogueEN", { userLangue });
    }
});

router.post("/filtre", ensureAuthenticated, async (req, res) => {
    const { category, quantityMin, age_group, filtreMot, color = [] } = req.body;

    let costumeQuery = `SELECT c.*, 
        SUM(g.quantity) AS quantite_totale 
        FROM costumes c 
        LEFT JOIN grandeurs g 
        ON c.costume_id = g.costume_id WHERE 1=1`;

    let params = [];

    if (quantityMin && !isNaN(quantityMin)) {
        costumeQuery += " AND g.quantity >= ?";
        params.push(quantityMin);
    }

    if (category) {
        costumeQuery += " AND c.category = ?";
        params.push(category);
    }

    if (age_group) {
        costumeQuery += " AND c.age_group = ?";
        params.push(age_group);
    }

    if (filtreMot) {
        costumeQuery += " AND c.titre LIKE ?";
        params.push('%' + filtreMot + '%');
    }

    if (Array.isArray(color) && color.length > 0) {
        let colorConditions = color.map(c => `c.color LIKE ?`).join(' OR '); // Changed AND to OR to allow any matching color
        costumeQuery += ` AND (${colorConditions})`;
        params.push(...color.map(c => `%${c}%`));
    }

    costumeQuery += " GROUP BY c.costume_id";

    try {
        const { rows } = await db.execute(costumeQuery, params); // Use the correct costumeQuery here
        const { user } = req.session;
        let likedCostumeIds = [];

        if (user) {
            const userId = user.user_id;
            const { rows: likes } = await db.execute(`
                SELECT costume_id
                FROM likes
                WHERE user_id = ?`, [userId]); // Correction de la liaison de paramètres
            likedCostumeIds = likes.map(like => like.costume_id);
        }
        if (user) {
            const userId = user.user_id;
            
            const { rows: favorites } = await db.execute(`
                SELECT f.costume_id, f.group_id, g.nom AS group_name
                FROM favorites f
                JOIN groupes g ON f.group_id = g.groupe_id
                WHERE g.user_id = ?`, [userId]);
            
            favoriteCostumeGroups = favorites.reduce((acc, favorite) => {
                acc[favorite.costume_id] = {
                    group_id: favorite.group_id,
                    group_name: favorite.group_name
                };
                return acc;
            }, {});
        }

        const userLangue = await getUserLanguage(user.user_id); // Appel correct pour récupérer la langue

        if (userLangue === 'fr') {
            res.render("catalogue", { 
                groupeCostume: rows,
                likedCostumeIds,
                favoriteCostumeGroups,
                userId: user ? user.user_id : null,
                filters: { category, quantityMin, age_group, filtreMot, color: color.join(', ') },
                hasFilters: rows.length > 0
            });
        } else {
            res.render("catalogueEN", { 
                groupeCostume: rows,
                likedCostumeIds,
                favoriteCostumeGroups,
                userId: user ? user.user_id : null,
                filters: { category, quantityMin, age_group, filtreMot, color: color.join(', ') },
                hasFilters: rows.length > 0
            });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur interne du serveur");
    }
});



module.exports = router;