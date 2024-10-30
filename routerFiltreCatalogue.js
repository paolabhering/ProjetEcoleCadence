const express = require("express");
const router = express.Router();
const db = require("./db");

//pour importer la liste des costumes du fichier costume
//const { groupeCostume } = require('./costume');

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

    // Validation de quantityMin
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

    // if (Array.isArray(color) && color.length > 0) {
        
    //     query += ` AND c.costume_id IN (
    //         SELECT costume_id 
    //         FROM costumes 
    //         WHERE color IN (${color.map(() => "?").join(', ')}) 
    //         GROUP BY costume_id 
    //         HAVING COUNT(DISTINCT color) >= ?
    //     )`;
        
    //     params.push(...color);
    //     params.push(color.length); 
    // }
    if (Array.isArray(color) && color.length > 0) {
        let colorConditions = color.map(c => `c.color LIKE ?`).join(' AND ');
        
        query += ` AND (${colorConditions})`;
        params.push(...color.map(c => `%${c}%`));  // Cela recherchera les chaînes contenant les couleurs
        console.log(colorConditions);
        console.log(query);
    }
    
    query += " GROUP BY c.costume_id";
    
    try {
        const { rows } = await db.execute(query, params);
        res.render("catalogue", { 
            groupeCostume: rows,
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