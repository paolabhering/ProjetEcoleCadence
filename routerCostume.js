const express = require("express");
const router = express.Router();
const db = require("./db");

//pour importer la liste des costumes du fichier costume
const { groupeCostume } = require('./costume');


router.get("/catalogue", async function(req,res) {
  try{
      const {rows} = await db.execute (`
       SELECT c.*, SUM(g.quantity) AS quantite_totale 
        FROM costumes c
        LEFT JOIN grandeurs g ON c.costume_id = g.costume_id
        GROUP BY c.costume_id`)
      res.render("catalogue", {groupeCostume: rows});
  } catch (error) {
      console.error(error);
      res.status(500).send("Erreur interne du serveur");
  }
});

// pour afficher les détails de chaque costume
router.get("/detailsCostume/:costume_id", async function (req, res) {
  try {
    const { rows: costume } = await db.execute(`
      SELECT c.*, 
             g.grandeur AS grandeur, 
             g.quantity AS quantite 
      FROM costumes c
      LEFT JOIN grandeurs g ON c.costume_id = g.costume_id
      WHERE c.costume_id = :costume_id
    `, { costume_id: req.params.costume_id });

    console.log(costume);
   
    if (costume.length === 0) {
      res.status(404).send("Costume non trouvé");
      return;
    }

    // Séparez les grandeurs et quantités pour le rendu
    const quantitesParGrandeur = {};
    costume.forEach(item => {
      if (item.grandeur) {
        quantitesParGrandeur[item.grandeur] = item.quantite;
      }
    });

    res.render("detailsCostume", { costume: costume[0], quantites: quantitesParGrandeur });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération du costume");
  }
});

module.exports = router;