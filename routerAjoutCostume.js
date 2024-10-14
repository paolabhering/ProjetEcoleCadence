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

router.post("/ajout", upload.single('upload_photo'), function(req,res) {
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
        if (req.body.multi) couleurs.push("multi");
    console.log({
        titre: req.body.titre, 
        category: req.body.category,
        age_group: req.body.age_group,
        couleurs: couleurs.join(", "),
        notes: req.body.notes,
        localisation: req.body.localisation,
        boite: req.body.boite,
        image: req.file.filename,
    })
    db.execute({
        sql: "INSERT INTO costumes(titre, category, age_group, color, notes, localisation, boite, image) VALUES(:titre, :category, :age_group, :couleurs, :notes, :localisation, :boite,:image)",
        args:{
            titre: req.body.titre, 
            category: req.body.category,
            age_group: req.body.age_group,
            color: couleurs.join(", "),
            notes: req.body.notes,
            localisation: req.body.localisation,
            boite: req.body.boite,
            image: req.file.filename,
        },
    }).then(async(result) => {
        const costumeId = result.lastInsertRowid;

        const grandeurs = [
            { taille: "XX-petitE", quantite: req.body.XXp_enfant || 0, type: "enfant" },
            { taille: "X-petitE", quantite: req.body.Xp_enfant || 0, type: "enfant" },
            { taille: "petitE", quantite: req.body.p_enfant || 0, type: "enfant" },
            { taille: "moyenE", quantite: req.body.m_enfant || 0, type: "enfant" },
            { taille: "grandE", quantite: req.body.g_enfant || 0, type: "enfant" },
            { taille: "X-grandE", quantite: req.body.Xg_enfant || 0, type: "enfant" },
            { taille: "XX-grandE", quantite: req.body.XXg_enfant || 0, type: "enfant" },
            { taille: "sans grandeurE", quantite: req.body.oneSize_enfant || 0, type: "enfant" },
            { taille: "XX-petitA", quantite: req.body.XXp_adulte || 0, type: "adulte" },
            { taille: "X-petitA", quantite: req.body.Xp_adulte || 0, type: "adulte" },
            { taille: "petitA", quantite: req.body.p_adulte || 0, type: "adulte" },
            { taille: "moyenA", quantite: req.body.m_adulte || 0, type: "adulte" },
            { taille: "grandA", quantite: req.body.g_adulte || 0, type: "adulte" },
            { taille: "X-grandA", quantite: req.body.Xg_adulte || 0, type: "adulte" },
            { taille: "XX-grandA", quantite: req.body.XXg_adulte || 0, type: "adulte" },
            { taille: "sans grandeurA", quantite: req.body.oneSize_adulte || 0, type: "adulte" },
            { taille: "sans grandeur", quantite: req.body.oneSize|| 0, type: "N/A" },         
        ];

        for (const grandeur of grandeurs) {
            if (grandeur.quantity > 0) { 
                await db.execute({
                    sql: "INSERT INTO grandeurs(costume_id, grandeur, quantity) VALUES(:costume_id, :grandeur, :quantity)",
                    args: {
                        costume_id: costumeId,
                        grandeur: grandeur.taille,
                        quantity: grandeur.quantity
                    },
                });
            }
        }

        res.redirect("/confirmation");
    }).catch(error => {
        console.error(error);
        res.status(500).send("Erreur lors de l'ajout du costume");
    });
});

module.exports = router;