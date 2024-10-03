
const {createClient} = require("@libsql/client")

module.exports = createClient({
    url: "file:catalogue.db"
})