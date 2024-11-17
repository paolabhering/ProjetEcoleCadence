const express = require("express");
const multer = require('multer'); // pour télécharger des fichiers
const db = require("./db");
const { ensureAuthenticated, restrictToRole } = require("./session");

const router = express.Router();

 const exphbs = require("express-handlebars");


const storage =  multer.diskStorage({   
    destination : (req, file, cb) => {
        cb(null, './static/img/')           //télécharge le fichier en l'envoyant dans la destination (fichier) précisée
    },
    filename : (req, file, cb) => {
        cb(null, file.originalname);        //fonction callback qui le fichier avec le nom du fichier
    }                                   
})

const upload = multer({storage : storage});

router.get("/ajout", ensureAuthenticated, restrictToRole("administrateur"), async (req, res) => {   
    try {
        const userId = req.session.user.user_id;
        const query = await db.execute(
            `SELECT langue,role FROM users WHERE user_id = ?`,
            [userId] 
        );

        const result = query.rows[0];
        const userLangue = result.langue;
        const userRole = result.role;

        if (userLangue === 'fr') {
            
            res.render("ajoutCostume", { userLangue, userRole });
        } else {
            res.render("ajoutCostumeEN", { userLangue, userRole });
        }
    } catch (error) {
        console.error("Error fetching language preference:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/confirmation", async (req,res) => {
    const userIdSession = req.session.user.user_id;
        const query = await db.execute(
            `SELECT langue,role FROM users WHERE user_id = ?`,
            [userIdSession] 
        );

        const result = query.rows[0];
        const userLangue = result.langue;
        const userRole = result.role;
        
        if (userLangue === 'fr') {
          res.render("confirmation", {userLangue, userRole});  
          
      } else {
        res.render("confirmationEN", {userLangue,userRole});
      }

 })

router.post("/ajout", upload.single('upload_photo'), async function(req,res) {
    let couleurs = [];
        if (req.body.brun) couleurs.push("brun");
        if (req.body.rouge) couleurs.push("rouge");
        if (req.body.rose) couleurs.push("rose");
        if (req.body.mauve) couleurs.push("mauve");
        if (req.body.bleu) couleurs.push("bleu");
        if (req.body.vert) couleurs.push("vert");
        if (req.body.jaune) couleurs.push("jaune");
        if (req.body.orange) couleurs.push("orange");
        if (req.body.noir) couleurs.push("noir");
        if (req.body.gris) couleurs.push("gris");
        if (req.body.blanc) couleurs.push("blanc");
        if (req.body.multicolore) couleurs.push("multicolore");

    let colorString = couleurs.length > 0 ? couleurs.join(", "): null;
    
    const result = await db.execute({
        sql: "INSERT INTO costumes(titre, category, age_group, color, notes, localisation, boite, image) VALUES(:titre, :category, :age_group, :color, :notes, :localisation, :boite,:image)",
        args:{
            titre: req.body.titre, 
            category: req.body.category,
            age_group: req.body.age_group,
            color: colorString,
            notes: req.body.notes,
            localisation: req.body.localisation,
            boite: req.body.boite,
            image: req.file.filename,
        },
    }).then(async(result) => {

        const costumeId = Number(result.lastInsertRowid);
    
        const grandeurs = [
            { taille: "XXpetit_enfant", quantite: req.body.XXpetit_enfant || 0 },
            { taille: "Xpetit_enfant", quantite: req.body.Xpetit_enfant || 0},
            { taille: "petit_enfant", quantite: req.body.petit_enfant || 0},
            { taille: "moyen_enfant", quantite: req.body.moyen_enfant || 0},
            { taille: "grand_enfant", quantite: req.body.grand_enfant || 0},
            { taille: "Xgrand_enfant", quantite: req.body.Xgrand_enfant || 0},
            { taille: "XXgrand_enfant", quantite: req.body.XXgrand_enfant || 0},
            { taille: "sansGrandeur_enfant", quantite: req.body.sansGrandeur_enfant || 0},
            { taille: "XXpetit_adulte", quantite: req.body.XXpetit_adulte || 0},
            { taille: "Xpetit_adulte", quantite: req.body.Xpetit_adulte || 0},
            { taille: "petit_adulte", quantite: req.body.petit_adulte || 0},
            { taille: "moyen_adulte", quantite: req.body.moyen_adulte || 0 },
            { taille: "grand_adulte", quantite: req.body.grand_adulte || 0},
            { taille: "Xgrand_adulte", quantite: req.body.Xgrand_adulte || 0},
            { taille: "XXgrand_adulte", quantite: req.body.XXgrand_adulte || 0},
            { taille: "sansGrandeur_adulte", quantite: req.body.sansGrandeur_adulte || 0 },
            { taille: "sansGrandeur", quantite: req.body.sansGrandeur|| 0},         
        ];

        for (const taille of grandeurs) {
           
            if (parseInt(taille.quantite) > 0) {
                try{
                    await db.execute({
                        sql: "INSERT INTO grandeurs(costume_id, grandeur, quantity) VALUES(:costume_id, :grandeur, :quantity)",
                        args: {
                            costume_id: costumeId,
                            grandeur: taille.taille,
                            quantity: taille.quantite
                        },
                    });
                }catch (error) {
                    console.error(`Erreur lors de l'insertion de la grandeur: ${error.message}`);
                }
            }
        }   
        res.redirect("/confirmation");
    }).catch(error => {
        console.error(error);
        res.status(500).send("Erreur lors de l'ajout du costume");
    });
});

module.exports = router;
