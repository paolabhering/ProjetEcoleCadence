
const {createClient} = require("@libsql/client");
const path = require("path");

module.exports = createClient({
    url: `file:${path.join(__dirname, 'catalogue.db')}`
});