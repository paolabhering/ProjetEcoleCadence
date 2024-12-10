const express = require("express");
const router = express.Router();
const db = require("./db");
const { ensureAuthenticated, restrictToRole } = require("./session");

//pour importer la liste des costumes du fichier costume
const { groupeCostume } = require('./costume');

router.get("/groupes", async function(req, res) {
   const { user } = req.session;
   const userid = user ? user.user_id : null;
  
   if (!userid) {
       return res.status(403).json({ message: "utilisateur non connecté." });
   }

   try {
       const { rows: groupes } = await db.execute(`
           select  nom, groupe_id
           from groupes
           where user_id = :user_id`, { user_id: userid });

       res.json(groupes);

   } catch (error) {
       console.error(error);
          res.status(500).json({ message: "erreur lors de la récupération des groupes." });
   }
});

router.get("/catalogue", ensureAuthenticated, async function(req,res) {
  try{ 
        
    const { user } = req.session;
    const userId = user ? user.user_id : null; 

    const {rows} = await db.execute (`
       SELECT c.*, SUM(g.quantity) AS quantite_totale 
        FROM costumes c
        LEFT JOIN grandeurs g ON c.costume_id = g.costume_id
        GROUP BY c.costume_id`)

        let groupesUser = [];
        // Si l'utilisateur est connecté, récupérer ses groupes
        if(userId) {
          const { rows: groupes } = await db.execute(`
            SELECT nom, groupe_id
            FROM groupes
            WHERE user_id = :user_id`, { user_id: userId });

          groupesUser = groupes.map(groupe => groupe.nom);

          // Récupérer uniquement les Ids de groupe
          const IdsDeGroupes = groupes.map(groupe => groupe.groupe_id);
        }

        let likedCostumeIds = [];
        // Si l'utilisateur est connecté, récupérer ses likes
        if(userId) {
        const { rows: likes } = await db.execute(`
          SELECT costume_id 
          FROM likes
          WHERE user_id = :user_id`, { user_id: userId });
        likedCostumeIds = likes.map(like => like.costume_id);
        }

        let favoriteCostumeGroups = [];
        // si l'utilsateur est connecté, récupérer ses favoris
        if(userId) {
          const { rows: favorites } = await db.execute(`
            SELECT f.costume_id, f.group_id, g.nom AS group_name
            FROM favorites f
            JOIN costumes c ON f.costume_id = c.costume_id
            JOIN groupes g ON f.group_id = g.groupe_id
            WHERE g.user_id = :user_id`, {user_id: userId});
          
          favoriteCostumeGroups = favorites.reduce((acc,favorite) => {
            acc[favorite.costume_id] = {
              group_id: favorite.group_id,
              group_name: favorite.group_name
            };
            return acc;
          }, {});
        }


      const userIdSession = req.session.user.user_id;
      
        const query = await db.execute(
            `SELECT langue,role FROM users WHERE user_id = ?`,
            [userIdSession] 
        );

        const result = query.rows[0];
        const userLangue = result.langue;
        const userRole = result.role;

        if (userLangue === 'fr') {
          res.render("catalogue", {groupeCostume: rows, likedCostumeIds, userId, groupesUser, userLangue,  favoriteCostumeGroups, userRole});  
          
      } else {
        res.render("catalogueEN", {groupeCostume: rows, likedCostumeIds, userId, groupesUser, userLangue,  favoriteCostumeGroups,userRole});
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

   
    if (costume.length === 0) {
      res.status(404).send("Costume non trouvé");
      return;
    }

    // Séparer les grandeurs et quantités pour le rendu
    const quantitesParGrandeur = {};
    let quantiteTotale = 0;

    costume.forEach(item => {
      if (item.grandeur) {
        quantitesParGrandeur[item.grandeur] = item.quantite;
      }
      quantiteTotale += item.quantite;
    });
    
    const userId = req.session.user.user_id;
        const query = await db.execute(
            `SELECT langue,role FROM users WHERE user_id = ?`,
            [userId] 
        );

        const result = query.rows[0];
        const userLangue = result.langue;
        const userRole = result.role;

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
  try {
    const { user_id, costume_id } = req.body;
    if (!user_id || !costume_id) {
      console.error("User ID ou Costume ID est manquant");
      return; 
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

// Enlever un favori
router.post("/enleverFavori", async function(req, res) {
  try {
    const { group_id, costume_id } = req.body;

    if (!group_id || !costume_id) {
      console.error("Group ID ou Costume ID est manquant");
      return res.status(400).json({ message: "Group ID ou Costume ID est manquant" });
      return; 
  }
    await db.execute(`
      DELETE FROM favorites 
      WHERE group_id = :group_id AND costume_id = :costume_id`,
       { group_id, costume_id });

    res.status(200).json({ message: "Favori enlevé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors du retrait du favori" });
  }
});

module.exports = router;
