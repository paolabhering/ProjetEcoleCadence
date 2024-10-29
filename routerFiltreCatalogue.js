const express = require("express");
const router = express.Router();
const db = require("./db");

//pour importer la liste des costumes du fichier costume
//const { groupeCostume } = require('./costume');

router.get("/filtre", function (req,res) {
    console.log("Formulaire de filtre affiché");
    res.render("filtreCatalogue");
 });

 router.post("/filtre", async function(req, res) {
    console.log("Requête de filtre reçue avec : ", req.body);
    const { category, quantityMin, age_group, filtreMot, couleurs = [] } = req.body;

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

    if (Array.isArray(couleurs) && couleurs.length > 0) {
        // Vérifier si le costume a au moins toutes les couleurs cochées
        query += ` AND c.costume_id IN (
            SELECT costume_id 
            FROM costumes 
            WHERE color IN (${couleurs.map(() => "?").join(", ")}) 
            GROUP BY costume_id 
            HAVING COUNT(DISTINCT color) >= ?
        )`;
        
        params.push(...couleurs);
        params.push(couleurs.length); // Vérifie que le costume a au moins le nombre de couleurs cochées
    }

    query += " GROUP BY c.costume_id";

    console.log(query)

    try {
        const { rows } = await db.execute(query, params);
        res.render("catalogue", { 
            groupeCostume: rows,
            filters: {
                category,
                quantityMin,
                age_group,
                filtreMot,
                couleurs: couleurs.join(', ')
            },
            hasFilters: rows.length > 0
         });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur interne du serveur");
    }
});

module.exports = router;