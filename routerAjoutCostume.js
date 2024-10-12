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

router.use(express.urlencoded({extended: true}));

router.get("/ajout", function (req, res) {    
    res.render("confirmation");
});

 router.get("/modif", function (req, res) {    
    res.render("modifCostume");
 });

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
        image: "/img" + req.file.filename,
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
            image: "/img" + req.file.filename,
        },
    })
    res.redirect("/confirmation");
})

module.exports = router;