const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db'); // Replace with your DB connection file
const { ensureAuthenticated, restrictToRole } = require('./session'); // Middleware for authentication and role restriction

const router = express.Router();

router.get('/gestion-utilisateurs', ensureAuthenticated, restrictToRole('administrateur'), async (req, res) => {
    try {
        const users = await db.execute('SELECT user_id, username, email, role FROM users');
        const userRole = req.session.user.role;
        const connectedUserId = req.session.user.user_id;
        const userId = req.session.user.user_id;

            // Récupère la langue de l'utilisateur connecté
            const query = await db.execute(
                `SELECT langue FROM users WHERE user_id = ?`,
                [userId]
            );

            const result = query.rows[0];
            const userLangue = result.langue;

        if (userLangue === 'fr') {
            return res.render('gestionUtilisateurs', {
                users: users.rows,
                userRole,
                connectedUserId,
                userLangue
            });
        } else {
            return res.render('gestionUtilisateursEN', {
                users: users.rows,
                userRole,
                connectedUserId,
                userLangue
            });
        }
        
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error);
        res.status(500).send('Erreur interne du serveur');
    }
});


router.get('/modifier-user/:id', ensureAuthenticated, restrictToRole('administrateur'), async (req, res) => {
    const userIdSession = req.session.user.user_id;
    const { id } = req.params;

    try {
        const query = await db.execute('SELECT langue, role FROM users WHERE user_id = ?', [userIdSession]);
        const { langue: userLangue } = query.rows[0];

        const user = await db.execute('SELECT * FROM users WHERE user_id = ?', [id]);
        const groups = await db.execute('SELECT nom FROM groupes WHERE user_id = ?', [id]);

        if (user.rows.length === 0) {
            return res.status(404).send('Utilisateur non trouvé');
        }

        const userResult = user.rows[0];
        const groupResults = groups.rows.map(row => row.nom);

        if (userLangue === 'fr') {
            res.render('modifierCompte', { userResult, group: groupResults, userRole: req.session.user.role });
        } else {
            res.render('modifierCompteEN', { userResult, group: groupResults, userRole: req.session.user.role });
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



router.post('/supprimer-user/:id', ensureAuthenticated, restrictToRole('administrateur'), async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.execute('DELETE FROM groupes WHERE user_id = ?', [id]);
        await db.execute('DELETE FROM users WHERE user_id = ?', [id]);

        res.redirect('/gestion-utilisateurs');
    } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur :", error);
        res.status(500).send("Erreur lors de la suppression de l'utilisateur");
    }
});


module.exports = router;
