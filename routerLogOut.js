// routerLogOut.js
const express = require('express');
const router = express.Router();

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Erreur lors de la déconnexion.");
        }
        res.redirect('/connexion'); 
    });
});

module.exports = router;
