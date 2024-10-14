const express = require('express');
const { engine } = require('express-handlebars');
const db = require("./db");
const app = express();
const path = require('path');

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static(path.join(__dirname, 'static')));

app.use(express.urlencoded({extended: true}));

// pour lier les routers
const routerAjoutCostume = require("./routerAjoutCostume");
const routerCostume = require("./routerCostume");


// pour utiliser les routers
app.use("/", routerAjoutCostume);
app.use("/catalogue", routerCostume);



app.listen(3000, function() {
console.log(`Serveur sur le port 3000`);
});