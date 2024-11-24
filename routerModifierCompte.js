const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db'); // Replace with your DB connection file
const { ensureAuthenticated, restrictToRole } = require('./session'); // Middleware for authentication and role restriction

const router = express.Router();

// Route to render modifierCompte page
router.get('/modifierCompte', ensureAuthenticated, restrictToRole('administrateur'), async (req, res) => {
    const userIdSession = req.session.user.user_id;

    try {
        // Fetch user and groups
        const user = await db.execute('SELECT * FROM users WHERE user_id = ?', [userIdSession]);
        const groups = await db.execute('SELECT nom FROM groupes WHERE user_id = ?', [userIdSession]);

        const userResult = user.rows[0];
        const groupResults = groups.rows.map(row => row.nom);

        const query = await db.execute('SELECT langue, role FROM users WHERE user_id = ?', [userIdSession]);
        const { langue: userLangue, role: userRole } = query.rows[0];

        if (userLangue === 'fr') {
            res.render('modifierCompte', { userResult, group: groupResults, userRole });
        } else {
            res.render('modifierCompteEN', { userResult, group: groupResults, userRole });
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Erreur lors de la récupération des données utilisateur');
    }
});

// Route to handle form submission
router.post('/modifier-user/:id', ensureAuthenticated, restrictToRole('administrateur'), async (req, res) => {
    const { id } = req.params;
    const {
        username,
        email,
        password,
        role,
        language,
        secretQuestion,
        secretAnswer,
        groupName,
    } = req.body;

    try {
        // Update user data
        await db.execute(
            `UPDATE users SET username = ?, email = ?, role = ?, langue = ?, secret_question = ?, secret_answer_hash = ?
             WHERE user_id = ?`,
            [
                username,
                email,
                role,
                language,
                secretQuestion,
                bcrypt.hashSync(secretAnswer, 10),
                id,
            ]
        );

        // Update groups
        await db.execute('DELETE FROM groupes WHERE user_id = ?', [id]); // Clear existing groups

        if (Array.isArray(groupName)) {
            for (const group of groupName) {
                await db.execute('INSERT INTO groupes (nom, user_id) VALUES (?, ?)', [group, id]);
            }
        }

        res.redirect(`/modifierCompte?id=${id}`);
    } catch (error) {
        console.error('Error updating user and groups:', error);
        res.status(500).send("Erreur lors de la modification de l'utilisateur");
    }
});

module.exports = router;
