function ensureAuthenticated(req, res, next) {
    if (req.session.user && req.session.user.role) {
        return next();
    }
    res.redirect('/connexion'); // Redirect to login if not authenticated
}

function restrictToRole(role) {
    return (req, res, next) => {
        if (req.session.user && req.session.user.role === role) {
            return next();
        }
        res.status(403).send("Accès refusé"); // Access denied
    };
}

module.exports = { ensureAuthenticated, restrictToRole };
