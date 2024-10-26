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

router.get("/ajout", function (req, res) {   
    res.render("ajoutCostume");
});

 router.get("/modif", function (req, res) {    
    res.render("modifCostume");
 });

router.get("/confirmation", function (req,res) {
    res.render("confirmation")
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
    console.log("Couleurs sélectionnées:", colorString);
    
    console.log({
        titre: req.body.titre, 
        category: req.body.category,
        age_group: req.body.age_group,
        couleurs: colorString,
        notes: req.body.notes,
        localisation: req.body.localisation,
        boite: req.body.boite,
        image: req.file.filename,
    })
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
            { taille: "XXp_enfant", quantite: req.body.XXp_enfant || 0 },
            { taille: "Xp_enfant", quantite: req.body.Xp_enfant || 0},
            { taille: "p_enfant", quantite: req.body.p_enfant || 0},
            { taille: "m_enfant", quantite: req.body.m_enfant || 0},
            { taille: "g_enfant", quantite: req.body.g_enfant || 0},
            { taille: "Xg_enfant", quantite: req.body.Xg_enfant || 0},
            { taille: "XXg_enfant", quantite: req.body.XXg_enfant || 0},
            { taille: "oneSize_enfant", quantite: req.body.oneSize_enfant || 0},
            { taille: "XXp_adulte", quantite: req.body.XXp_adulte || 0},
            { taille: "Xp_adulte", quantite: req.body.Xp_adulte || 0},
            { taille: "p_adulte", quantite: req.body.p_adulte || 0},
            { taille: "m_adulte", quantite: req.body.m_adulte || 0 },
            { taille: "g_adulte", quantite: req.body.g_adulte || 0},
            { taille: "Xg_adulte", quantite: req.body.Xg_adulte || 0},
            { taille: "XXg_adulte", quantite: req.body.XXg_adulte || 0},
            { taille: "oneSize_adulte", quantite: req.body.oneSize_adulte || 0 },
            { taille: "oneSize", quantite: req.body.oneSize|| 0},         
        ];

        for (const taille of grandeurs) {
           
            if (parseInt(taille.quantite) > 0) { 

                console.log({
                    costume_id: Number(costumeId), 
                    grandeur: taille.taille,
                    quantity: taille.quantite,
                })
    
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