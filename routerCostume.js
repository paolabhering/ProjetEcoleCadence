const express = require("express");
const router = express.Router();
const db = require("./db");

//pour importer la liste des produits du fichier produits.handlebars
const { groupeCostume } = require('./costume');

// pour afficher les détails de chaque produit
router.get("/detailsCostume/:id", async function (req, res) {
 const costume = await db.execute({sql:"SELECT * FROM costumes WHERE id = :id",
    args: {id: req.params.id} });

  if (!costume) {
    res.status(404).send("Costume non trouvé");
    return;
  }
  res.render("detailsCostumes", { produit: produit.rows[0] });
});  

module.exports = router;