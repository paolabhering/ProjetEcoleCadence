const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js
const { ensureAuthenticated, restrictToRole } = require("./session"); // Import the functions from session.js
const routerLogOut = require('./routerLogOut');

const exphbs = require("express-handlebars");
router.use(express.urlencoded({ extended: true }));

router.get("/admin", ensureAuthenticated, restrictToRole("administrateur"), async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        console.log("User id stored in session is", userId); 
        const query = await db.execute(
            `SELECT langue FROM users WHERE user_id = ?`,
            [userId] 
        );

        const result = query.rows[0];
        const userLangue = result.langue;
        console.log("User's chosen language is:", userLangue);

        if (userLangue === 'fr') {
            
            res.render("admin", { userLangue });
        } else {
            res.render("adminEN", { userLangue });
        }
    } catch (error) {
        console.error("Error fetching language preference:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.use('/', routerLogOut);

module.exports = router;
