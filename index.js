require('dotenv').config({ path: 'variables.env' });
const express = require('express');
const { engine } = require('express-handlebars');
const db = require("./db");
const app = express();
const path = require('path');
const session = require('express-session');
const secretKey = process.env.SECRET_KEY;

const exphbs = require('express-handlebars');

// Ajout de tous les helpers
const helpers = {
    includes: function(array, value) {
        return array.includes(value);
    },
    split: function(string, delimiter) {
        return string.split(delimiter);
    },
    eq: function(a, b) {
        return a === b;
    },
    not: function(value) {
        return !value;
    },
    json: function(context) {
        return JSON.stringify(context);
    }
};

// Configuration du moteur de rendu Handlebars avec les helpers
app.engine('handlebars', engine({ helpers }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.urlencoded({extended: true}));

app.use(express.urlencoded({extended: true}));

app.use(session({
    secret: secretKey, 
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // true if using HTTPS
        maxAge: 1800000 
    }
}));

app.use(express.json());

// pour lier les routers
const routerAjoutCostume = require("./routerAjoutCostume");
const routerCostume = require("./routerCostume");
//const routerAccueil = require("./routerAccueil");
const routerConnexion = require("./routerConnexion");
const routerCreerCompte = require("./routerCreerCompte");
const routerAdmin = require("./routerAdmin");
const routerModifCostume = require("./routerModifCostume");
const routerFiltreCatalogue = require("./routerFiltreCatalogue");
const routerModifierCompte = require("./routerModifierCompte");
const routerMonCompte = require("./routerMonCompte");
const routerLikes = require("./routerLikes");
const routerFavoris = require("./routerFavoris");
const routerSuggestions = require("./routerSuggestions");


app.use("/", routerAdmin);
app.use("/", routerConnexion);
app.use("/", routerCreerCompte);
app.use("/", routerAjoutCostume);
app.use("/", routerCostume);
app.use("/", routerModifCostume);
app.use("/", routerModifierCompte);
app.use("/", routerFiltreCatalogue);
app.use("/", routerMonCompte);
app.use("/", routerLikes);
app.use("/", routerFavoris);
app.use("/", routerSuggestions);

app.listen(3001, function() {
console.log(`Serveur sur le port 3001`);
});
