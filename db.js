
const {createClient} = require("@libsql/client")

module.exports = createClient({
    url: `file:${path.join(__dirname, 'var/www/projetecolecadence/ProjetEcoleCadence/catalogue.db')}`
});