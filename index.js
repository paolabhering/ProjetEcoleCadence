const express = require('express');
const { engine } = require('express-handlebars');

const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', function (req, res) {
res.render('catalogue')
})


app.listen(3000, function() {
console.log(`Serveur sur le port 3000`)
})