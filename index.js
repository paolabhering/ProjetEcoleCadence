const express = require('express');
const { engine } = require('express-handlebars');
const hbs = require('express-handlebars');
const db = require("./db");
const app = express();

const path = require('path');

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', function (req, res) {
res.render('catalogue')
})


app.listen(3000, function() {
console.log(`Serveur sur le port 3000`)
})