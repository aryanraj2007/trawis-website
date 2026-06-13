const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Parser middleware for URL-encoded forms and JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'trawis-secret-key-123456789',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if running over HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Share session info with all EJS templates
app.use((req, res, next) => {
  res.locals.userId = req.session.userId || null;
  res.locals.username = req.session.username || null;
  res.locals.userRole = req.session.userRole || null;
  next();
});


app.get('/', (req, res) => {
  res.render('index', { title: null });
});

app.get('/product', (req, res) => {
  res.render('product', { title: 'Product' });
});

app.get('/solutions', (req, res) => {
  res.render('solutions', {
    title: 'Solutions | TraWis'
  });
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

app.get('/leadership', (req, res) => {
  res.render('leadership', { title: 'Leadership' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

app.get('/coming-soon', (req, res) => {
  res.render('coming_soon', { title: 'Coming Soon' });
});

app.get('/resources/faq', (req, res) => {
  res.render('coming_soon', { title: 'FAQ' });
});

app.get('/pricing', (req, res) => {
  res.render('coming_soon', { title: 'Pricing' });
});

app.get('/demo', (req, res) => {
  res.render('coming_soon', { title: 'Schedule Demo' });
});


// Register new routes for blog and admin
const adminRouter = require('./routes/admin');
const blogRouter = require('./routes/blog');

app.use('/admin', adminRouter);
app.use('/resources/blog', blogRouter);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
