require('dotenv').config({ path: 'variables.env' });
const express = require('express');
const { engine } = require('express-handlebars');
const db = require("./db");
const app = express();
const path = require('path');
const session = require('express-session');
const secretKey = process.env.SECRET_KEY;


app.engine('handlebars', engine({
  helpers: {
      split: function(string, delimiter) {
          return string.split(delimiter);
      },
      eq: function(a, b) {
          return a === b;
      }
  }
}));

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

// pour lier les routers
const routerAjoutCostume = require("./routerAjoutCostume");
const routerCostume = require("./routerCostume");
//const routerAccueil = require("./routerAccueil");
const routerConnexion = require("./routerConnexion");
const routerCreerCompte = require("./routerCreerCompte");
const routerAdmin = require("./routerAdmin");

app.use("/", routerAdmin);
app.use("/", routerConnexion);
app.use("/", routerCreerCompte);
app.use("/", routerAjoutCostume);
app.use("/", routerCostume);





app.listen(3001, function() {
console.log(`Serveur sur le port 3001`);
});
