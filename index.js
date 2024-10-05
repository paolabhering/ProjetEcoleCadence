const express = require('express');
const { engine } = require('express-handlebars');
const db = require("./db");
const app = express();
const path = require('path');

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static(path.join(__dirname, 'static')));

// pour lier les routers
const routerAjoutCostume = require("./routerAjoutCostume");

// pour utiliser les routers
app.use("/", routerAjoutCostume);

// pour envoyer la liste des produits à la page catalogue.handlebars
// app.get("/", async function(req,res) {
//     const {rows} = await db.execute ("SELECT * FROM costumes")
//    res.render("catalogue", {listeCostumes: rows});
//    console.log(rows);
// })



// router.get("/ajout", function (req, res) {    
//     res.render("ajoutCostume");
// });

//  app.get('/', function (req, res) {
//  res.render('ajoutCostume');
//  });


app.listen(3001, function() {
console.log(`Serveur sur le port 3001`);
});