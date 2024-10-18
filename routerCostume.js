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
})



// pour afficher les détails de chaque costume
// router.get("/detailsCostume/:id", async function (req, res) {
//  const result = await db.execute({sql:"SELECT * FROM costumes WHERE id = :id",
//     args: {id: req.params.id} });

//   const costume = result[0]?.rows[0];

//   if (!costume) {
//     res.status(404).send("Costume non trouvé");
//     return;
//   }
//   res.render("detailsCostumes", { costume: costume });
// });  

module.exports = router;