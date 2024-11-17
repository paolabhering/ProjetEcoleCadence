const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db"); // Import the db client from db.js
const { ensureAuthenticated } = require("./session");

// Middleware to parse URL-encoded data
router.use(express.urlencoded({ extended: true }));

// Route to render the "Mon Compte" page
router.get("/monCompte", ensureAuthenticated, async (req, res) => {
    const userId = req.session.user.user_id;

    try {
        const userQuery = await db.execute("SELECT * FROM users WHERE user_id = ?", [userId]);
        const groupsQuery = await db.execute("SELECT nom FROM groupes WHERE user_id = ?", [userId]);
        const favoritesQuery = await db.execute(`
            SELECT f.favorite_id, c.titre AS costume_name, g.nom AS group_name
            FROM favorites f
            JOIN costumes c ON f.costume_id = c.costume_id
            JOIN groupes g ON f.group_id = g.groupe_id
            WHERE g.user_id = ?`, [userId]);
        const likesQuery = await db.execute(`
            SELECT l.like_id, c.titre AS costume_name
            FROM likes l
            JOIN costumes c ON l.costume_id = c.costume_id
            WHERE l.user_id = ?`, [userId]);
        const suggestionsQuery = await db.execute(`
            SELECT suggestion_id, suggestion_text
            FROM suggestions
            WHERE user_id = ?`, [userId]);

        const user = userQuery.rows[0];
        const groups = groupsQuery.rows.map(row => row.nom);
        const favorites = favoritesQuery.rows;
        const likes = likesQuery.rows;
        const suggestions = suggestionsQuery.rows;

        res.render("monCompte", {
            user,
            groups,
            favorites,
            likes,
            suggestions,
            userRole: req.session.user.role
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Error fetching user data");
    }
});

// Route to handle password modification
router.post("/modifier-mot-de-passe", ensureAuthenticated, async (req, res) => {
    const userId = req.session.user.user_id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).send("New passwords do not match");
    }

    try {
        const userQuery = await db.execute("SELECT password FROM users WHERE user_id = ?", [userId]);
        const user = userQuery.rows[0];

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(400).send("Current password is incorrect");
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await db.execute("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, userId]);

        res.status(200).redirect("/monCompte");
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).send("Error updating password");
    }
});

// Route to handle suggestions
router.post("/envoyer-suggestion", ensureAuthenticated, async (req, res) => {
    const userId = req.session.user.user_id;
    const { suggestion } = req.body;

    try {
        await db.execute("INSERT INTO suggestions (user_id, suggestion_text) VALUES (?, ?)", [userId, suggestion]);
        res.status(200).redirect("/monCompte");
    } catch (error) {
        console.error("Error sending suggestion:", error);
        res.status(500).send("Error sending suggestion");
    }
});

// Route to handle deleting a favorite
router.delete("/supprimer-favori/:id", ensureAuthenticated, async (req, res) => {
    const favoriteId = req.params.id;

    try {
        await db.execute("DELETE FROM favorites WHERE favorite_id = ?", [favoriteId]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting favorite:", error);
        res.status(500).json({ success: false });
    }
});

// Route to handle deleting a like
router.delete("/supprimer-like/:id", ensureAuthenticated, async (req, res) => {
    const likeId = req.params.id;

    try {
        await db.execute("DELETE FROM likes WHERE like_id = ?", [likeId]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting like:", error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
