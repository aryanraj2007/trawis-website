function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  // Remember original URL to redirect back after login
  req.session.redirectTo = req.originalUrl;
  res.redirect('/admin/login');
}

function isSuperAdmin(req, res, next) {
  if (req.session && req.session.userRole === 'superadmin') {
    return next();
  }
  res.status(403).render('404', { 
    title: '403 Forbidden', 
    message: 'Access Denied: You do not have permissions to manage users.' 
  });
}

module.exports = {
  isAuthenticated,
  isSuperAdmin
};
