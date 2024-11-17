//  Router en stand by pour l'instant 
//     Il n'est peut-être pas pertinent
//     Donc je ne met pas plus d'énergie dessus pour l'instant
//     Il n'est pas encore fonctionnel 

const express = require("express");
const multer = require('multer'); // pour télécharger des fichiers
const db = require("./db");

const router = express.Router();

 const exphbs = require("express-handlebars");


const storage =  multer.diskStorage({   
    destination : (req, file, cb) => {
        cb(null, './static/img/')           //télcharge le fichier en l'envoyant dans la destination (fichier) précisée
    },
    filename : (req, file, cb) => {
        cb(null, file.originalname);        //fonction callback qui le fichier avec le nom du fichier
    }                                   
})

const upload = multer({storage : storage});

 router.get("/confirmation", function (req,res) {
     res.render("confirmation")
  })

router.get("/modif2", async function (req, res) { 
    const titre = req.query.titre; // Récupère le titre de la requête

    if (!titre) {
        return res.status(400).send("Titre manquant");
    }

    try {
        const { rows: costumes } = await db.execute(`
            SELECT c.*,
                g.grandeur AS grandeur,
                g.quantity AS quantite
            FROM costumes c 
            LEFT JOIN grandeurs g ON c.costume_id = g.costume_id
            WHERE c.titre = :titre`,
            { titre: titre });

        if (costumes.length === 0) {
            return res.status(404).send("Costume non trouvé");
        }

        const costume = costumes[0];
        // Montre le chemin d'image
        costume.imagePath = `/static/img/${costume.image}`;

        const couleurArray = costume.color ? costume.color.split(", ") : [];

        const quantitesParGrandeur = {};
        let quantiteTotale = 0;

        costumes.forEach(item => {
            if (item.grandeur) {
                quantitesParGrandeur[item.grandeur] = item.quantite;
                quantiteTotale += item.quantite;
            }
        });

        res.render("modif2Costume", { 
            costume,
            couleurs: couleurArray, 
            quantites: quantitesParGrandeur, 
            quantiteTotale });

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération du costume");
    }
});

router.post("/modif2/:costume_id", upload.single('upload_photo'), async function(req,res) {
    try {
         // Affichez le contenu de req.body et req.file pour le débogage
         console.log(req.body);
         console.log(req.file);

        const { costume_id } = req.params;
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

        let colorString = couleurs.length > 0 ? couleurs.join(", ") : null;

        // Mettre à jour le costume
        await db.execute(
            `UPDATE costumes SET 
            titre = :titre, 
            category = :category, 
            age_group = :age_group, 
            color = :color, 
            notes = :notes, 
            localisation = :localisation, 
            boite = :boite 
            WHERE costume_id = :costume_id`,
             {
                titre: req.body.titre,
                category: req.body.category,
                age_group: req.body.age_group,
                color: colorString,
                notes: req.body.notes,
                localisation: req.body.localisation,
                boite: req.body.boite,
                costume_id: costume_id,
            },
        );

        // Mise à jour de l'image si elle a été modifiée
        if (req.file) {
            await db.execute({
                sql: `UPDATE costumes SET image = :image WHERE costume_id = :costume_id`,
                args: {
                    image: req.file.filename,
                    costume_id: costume_id,
                },
            });
        }
         // Mettre à jour les grandeurs
         const grandeurs = [
            { taille: "XXpetit_enfant", quantite: req.body.XXpetit_enfant || 0 },
            { taille: "Xpetit_enfant", quantite: req.body.Xpetit_enfant || 0 },
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

         // Supprimez les précédentes grandeurs du costume avant d'ajouter les nouvelles
         await db.execute({
            sql: "DELETE FROM grandeurs WHERE costume_id = :costume_id",
            args: { costume_id: costume_id },
        });

        for (const taille of grandeurs) {
            if (parseInt(taille.quantite) > 0) {
                await db.execute({
                    sql: "INSERT INTO grandeurs(costume_id, grandeur, quantity) VALUES(:costume_id, :grandeur, :quantity)",
                    args: {
                        costume_id: costume_id,
                        grandeur: taille.taille,
                        quantity: taille.quantite,
                    },
                });
            }
        }
        res.redirect("/confirmation");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la mise à jour du costume");
    }
})
module.exports = router;