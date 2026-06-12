const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Renders the public blog cards feed list
router.get('/', async (req, res) => {
  try {
    const queryText = `
      SELECT p.*, u.username as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      WHERE p.status = 'published' 
      ORDER BY p.published_at DESC
    `;
    const result = await db.query(queryText);
    res.render('blog_index', { title: 'Blog & Resources', posts: result.rows });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).render('404', { title: 'Error', message: 'Failed to retrieve blog posts.' });
  }
});

// Renders a single blog post by its slug
router.get('/:slug', async (req, res) => {
  try {
    const queryText = `
      SELECT p.*, u.username as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      WHERE p.slug = $1 AND p.status = 'published'
    `;
    const result = await db.query(queryText, [req.params.slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).render('404', { title: 'Post Not Found', message: 'The article you are looking for does not exist.' });
    }
    
    res.render('blog_post', { title: result.rows[0].title, post: result.rows[0] });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).render('404', { title: 'Error', message: 'Failed to retrieve the blog post.' });
  }
});

module.exports = router;
