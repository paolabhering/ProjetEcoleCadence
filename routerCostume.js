const express = require("express");
const router = express.Router();
const db = require("./db");

//pour importer la liste des costumes du fichier costume
const { groupeCostume } = require('./costume');

router.get("/groupes", async function(req, res) {
  const { user } = req.session;
  const userId = user ? user.user_id : null;
  
  if (!userId) {
      return res.status(403).json({ message: "Utilisateur non connecté." });
  }

  try {
      const { rows: groupes } = await db.execute(`
          SELECT  nom, groupe_id
          FROM groupes
          WHERE user_id = :user_id`, { user_id: userId });

      res.json(groupes);
      console.log("Groupes utilisateur:", groupes);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des groupes." });
  }
});

router.get("/catalogue", async function(req,res) {
  try{ 
    const { user } = req.session;
    const userId = user ? user.user_id : null; 
    console.log(userId);

    const {rows} = await db.execute (`
       SELECT c.*, SUM(g.quantity) AS quantite_totale 
        FROM costumes c
        LEFT JOIN grandeurs g ON c.costume_id = g.costume_id
        GROUP BY c.costume_id`)

        let groupesUser = [];
        // Si l'utilisateur est connecté, récupérez ses groupes
        if(userId) {
          const { rows: groupes } = await db.execute(`
            SELECT nom
            FROM groupes
            WHERE user_id = :user_id`, { user_id: userId });
          groupesUser = groupes.map(groupe => groupe.nom);
        }
        console.log("Nom des groupes:", groupesUser);

        let likedCostumeIds = [];
        // Si l'utilisateur est connecté, récupérez ses likes
        if(userId) {
        const { rows: likes } = await db.execute(`
          SELECT costume_id 
          FROM likes
          WHERE user_id = :user_id`, { user_id: userId });
        likedCostumeIds = likes.map(like => like.costume_id);
    }
    console.log("Liked Costume IDs:", likedCostumeIds);
    console.log("Nom des groupes:", groupesUser);
      res.render("catalogue", {groupeCostume: rows, likedCostumeIds, groupesUser, userId});
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
             g.quantity AS quantite,
             SUM(g.quantity) OVER (PARTITION BY c.costume_id) AS quantite_totale
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
    let quantiteTotale = 0;

    costume.forEach(item => {
      if (item.grandeur) {
        quantitesParGrandeur[item.grandeur] = item.quantite;
      }
      quantiteTotale += item.quantite;
    });
    

    res.render("detailsCostume", { costume: costume[0], quantites: quantitesParGrandeur, quantiteTotale });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération du costume");
  }
});

// Ajouter un like
router.post("/ajouterLike", async function(req, res) {
  console.log(req.body);
  try {
    const { user_id, costume_id } = req.body;
    if (!user_id || !costume_id) {
      console.error("User ID ou Costume ID est manquant");
      return; // Ou retournez une réponse indiquant l'erreur
  }
    await db.execute(`
      INSERT INTO likes (user_id, costume_id) 
      VALUES (:user_id, :costume_id)`, { user_id, costume_id });

    res.status(200).json({ message: "Like ajouté avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'ajout du like" });
  }
});

// Enlever un like
router.post("/enleverLike", async function(req, res) {
  console.log(req.body);
  try {
    const { user_id, costume_id } = req.body;

    if (!user_id || !costume_id) {
      console.error("User ID ou Costume ID est manquant");
      return; 
  }
    await db.execute(`
      DELETE FROM likes 
      WHERE user_id = :user_id AND costume_id = :costume_id`,
       { user_id, costume_id });

    res.status(200).json({ message: "Like enlevé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors du retrait du like" });
  }
});

// Ajouter un favori
router.post("/ajouterFavori", async function(req, res) {
    console.log(req.body);
    try {
        const { costume_id, group_id } = req.body;
        if (!costume_id || !group_id) {
            console.error("Costume ID ou Group ID est manquant");
            return;
        }
        await db.execute(`
            INSERT INTO favorites (costume_id, group_id) 
            VALUES (:costume_id, :group_id)`, { costume_id, group_id });

        res.status(200).json({ message: "Favori ajouté avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de l'ajout du favori" });
    }
});

module.exports = router;