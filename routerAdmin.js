const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js
const { ensureAuthenticated, restrictToRole } = require("./session"); // Import the functions from session.js
const routerLogOut = require('./routerLogOut');

const exphbs = require("express-handlebars");
router.use(express.urlencoded({ extended: true }));

router.get("/admin", ensureAuthenticated, restrictToRole("administrateur"), (req, res) => {
    res.render("admin");
});

router.use('/', routerLogOut);

module.exports = router;
