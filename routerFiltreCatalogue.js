const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/filtre", function (req,res) {
    
    res.render("filtreCatalogue");
 });

 router.post("/filtre", async function(req, res) {
    
    const { category, quantityMin, age_group, filtreMot, color = [] } = req.body;

    let query = `SELECT c.*, 
        SUM(g.quantity) AS quantite_totale 
        FROM costumes c 
        LEFT JOIN grandeurs g 
        ON c.costume_id = g.costume_id WHERE 1=1`;

    let params = [];

    if (quantityMin && !isNaN(quantityMin)) {
        query += " AND g.quantity >= ?";
        params.push(quantityMin);
    }

    if (category) {
        query += " AND c.category = ?";
        params.push(category);
    }

    if (age_group) {
        query += " AND c.age_group = ?";
        params.push(age_group);
    }

    if (filtreMot) {
        query += " AND c.titre LIKE ?";
        params.push('%' + filtreMot + '%');
    }

    if (Array.isArray(color) && color.length > 0) {
        let colorConditions = color.map(c => `c.color LIKE ?`).join(' AND ');
        
        query += ` AND (${colorConditions})`;
        params.push(...color.map(c => `%${c}%`));
        console.log(colorConditions);
        console.log(query);
    }
    
    query += " GROUP BY c.costume_id";
    
    try {
        const { rows } = await db.execute(query, params);
        const { user } = req.session;
        let likedCostumeIds = [];

        if (user) {
            const userId = user.user_id;
            const { rows: likes } = await db.execute(`
                SELECT costume_id
                FROM likes
                WHERE user_id = :user_id`, { user_id: userId});
            likedCostumeIds = likes.map(like => like.costume_id);
        }
        res.render("catalogue", { 
            groupeCostume: rows,
            likedCostumeIds,
            userId: user ? user.user_id : null,
            filters: {
                category,
                quantityMin,
                age_group,
                filtreMot,
                color: color.join(', ')
            },
            hasFilters: rows.length > 0
         });
         console.log("SQL Params:", params);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur interne du serveur");
    }
});

module.exports = router;