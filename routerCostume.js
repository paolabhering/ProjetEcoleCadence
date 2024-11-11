const express = require("express");
const router = express.Router();
const db = require("./db");
const { ensureAuthenticated, restrictToRole } = require("./session");

//pour importer la liste des costumes du fichier costume
const { groupeCostume } = require('./costume');

router.get("/catalogue", ensureAuthenticated, async function(req,res) {
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
        // Si l'utilisateur est connecté, récupérer ses likes
        if(userId) {
        const { rows: likes } = await db.execute(`
          SELECT costume_id 
          FROM likes
          WHERE user_id = :user_id`, { user_id: userId });
        likedCostumeIds = likes.map(like => like.costume_id);
        }

        let favoriteCostumeIds = [];
        // si l'utilsateur est connecté, récupérer ses favoris
        if(userId) {
          const { rows: favorites } = await db.execute(`
            SELECT f.costume_id
            FROM favorites f
            JOIN costumes c ON f.costume_id = c.costume_id
            JOIN groupes g ON f.group_id = g.groupe_id
            WHERE g.user_id = :user_id`, {user_id: userId});
          
          favoriteCostumeIds = favorites.map(favorite => favorite.costume_id);
        }
    console.log("Costumes favoris:", favoriteCostumeIds);
    console.log("Liked Costume IDs:", likedCostumeIds);


      const userIdSession = req.session.user.user_id;
      console.log("User id is", userIdSession);
        const query = await db.execute(
            `SELECT langue,role FROM users WHERE user_id = ?`,
            [userIdSession] 
        );

        const result = query.rows[0];
        const userLangue = result.langue;
        const userRole = result.role;
        console.log("User's chosen language is:", userLangue);
        console.log("User role is:", userRole);
        if (userLangue === 'fr') {
          res.render("catalogue", {groupeCostume: rows, likedCostumeIds, userId, userLangue, userRole});  
          
      } else {
        res.render("catalogueEN", {groupeCostume: rows, likedCostumeIds, userId, userLangue, favoriteCostumeIds,userRole});
      }


      
  } catch (error) {
      console.error(error);
      res.status(500).send("Erreur interne du serveur");
  }
});

// pour afficher les détails de chaque costume
router.get("/detailsCostume/:costume_id", ensureAuthenticated, async function (req, res) {
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
    
    const userId = req.session.user.user_id;
        console.log("User id is", userId); 
        const query = await db.execute(
            `SELECT langue,role FROM users WHERE user_id = ?`,
            [userId] 
        );

        const result = query.rows[0];
        const userLangue = result.langue;
        const userRole = result.role;
        console.log("User's chosen language is:", userLangue);

        if (userLangue === 'fr') {
          res.render("detailsCostume", { costume: costume[0], quantites: quantitesParGrandeur, quantiteTotale, userLangue,userRole });

        } else {
          res.render("detailsCostumeEN", { costume: costume[0], quantites: quantitesParGrandeur, quantiteTotale, userLangue,userRole });
        }


    




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

module.exports = router;
