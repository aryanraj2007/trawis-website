const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: null });
});

app.get('/product', (req, res) => {
  res.render('product', { title: 'Product' });
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

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
