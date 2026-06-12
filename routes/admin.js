const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('../config/db');
const { isAuthenticated, isSuperAdmin } = require('../middleware/auth');

// Global admin middleware: ensure non-login admin routes redirect to login/dashboard
router.use((req, res, next) => {
  // allow access to login, logout and static resources
  if (req.path === '/login' || req.path === '/logout' || req.path.startsWith('/assets') || req.path.startsWith('/uploads')) {
    return next();
  }

  // if not authenticated, remember target and send to login
  if (!req.session || !req.session.userId) {
    req.session.redirectTo = req.originalUrl;
    return res.redirect('/admin/login');
  }

  // otherwise continue
  next();
});

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp, gif) are allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// =========================================================================
// AUTHENTICATION
// =========================================================================

// GET Admin root -> redirects to dashboard
router.get('/', (req, res) => {
  res.redirect('/admin/dashboard');
});

// GET Login Page
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/admin/dashboard');
  }
  const errorMsg = req.query.error ? 'Invalid username or password' : null;
  res.render('admin/login', { title: 'Admin Login', error: errorMsg });
});

// POST Login Action
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.redirect('/admin/login?error=true');
  }

  try {
    const queryText = 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(queryText, [username]);

    if (result.rows.length === 0) {
      return res.redirect('/admin/login?error=true');
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.redirect('/admin/login?error=true');
    }

    // Set Session Variables
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.userRole = user.role;

    // Redirect to requested page if any, else dashboard
    const redirectTo = req.session.redirectTo || '/admin/dashboard';
    delete req.session.redirectTo;
    res.redirect(redirectTo);
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/admin/login?error=true');
  }
});

// GET Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
});

// =========================================================================
// DASHBOARD & POST CRUD (Authenticated Users)
// =========================================================================

// GET Dashboard Home
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const queryText = `
      SELECT p.*, u.username as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(queryText);
    res.render('admin/dashboard', { 
      title: 'Admin Dashboard', 
      posts: result.rows,
      currentUser: { username: req.session.username, role: req.session.userRole }
    });
  } catch (error) {
    console.error('Dashboard rendering error:', error);
    res.status(500).render('404', { title: 'Server Error', message: 'Could not render admin dashboard.' });
  }
});

// GET New Post Form
router.get('/posts/new', isAuthenticated, (req, res) => {
  res.render('admin/edit-post', { 
    title: 'Create Blog Post', 
    post: null,
    currentUser: { username: req.session.username, role: req.session.userRole }
  });
});

// POST New Post Action
router.post('/posts', isAuthenticated, upload.single('coverImage'), async (req, res) => {
  const { title, content, status, publishedAtManual } = req.body;
  const authorId = req.session.userId;
  const coverImage = req.file ? `/uploads/${req.file.filename}` : null;
  const postStatus = status === 'published' ? 'published' : 'draft';

  const publishedAt =
    postStatus === 'published'
      ? publishedAtManual
        ? new Date(publishedAtManual)
        : new Date()
      : null;

  // Automatically generate excerpt from the content by stripping HTML tags
  const cleanContent = content
    ? content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  const excerpt =
    cleanContent.length > 180
      ? cleanContent.substring(0, 177) + '...'
      : cleanContent;

  if (!title || !content) {
    return res.status(400).render('404', {
      title: 'Validation Error',
      message: 'Title and content are required.'
    });
  }

  // Generate unique slug
  let slug = slugify(title, { lower: true, strict: true });

  try {
    // Check if slug exists, append random suffix if it does
    const slugCheck = await db.query('SELECT id FROM posts WHERE slug = $1', [slug]);

    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Math.round(Math.random() * 10000)}`;
    }

    const queryText = `
      INSERT INTO posts (
        title,
        slug,
        excerpt,
        content,
        cover_image,
        status,
        author_id,
        published_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await db.query(queryText, [
      title,
      slug,
      excerpt,
      content,
      coverImage,
      postStatus,
      authorId,
      publishedAt
    ]);

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error creating post:', error);

    res.status(500).render('404', {
      title: 'Server Error',
      message: 'Failed to create post.'
    });
  }
});

// GET Edit Post Form
router.get('/posts/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const queryText = 'SELECT * FROM posts WHERE id = $1';
    const result = await db.query(queryText, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).render('404', { title: 'Post Not Found', message: 'The post you are trying to edit does not exist.' });
    }

    res.render('admin/edit-post', { 
      title: 'Edit Blog Post', 
      post: result.rows[0],
      currentUser: { username: req.session.username, role: req.session.userRole }
    });
  } catch (error) {
    console.error('Error fetching post edit form:', error);
    res.status(500).render('404', { title: 'Server Error', message: 'Could not load the post form.' });
  }
});

// POST Edit Post Action
router.post('/posts/:id/edit', isAuthenticated, upload.single('coverImage'), async (req, res) => {
  const { title, content, status, publishedAtManual } = req.body;
  const postStatus = status === 'published' ? 'published' : 'draft';
  const postId = req.params.id;

  // Automatically generate excerpt from the content by stripping HTML tags
  const cleanContent = content ? content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const excerpt = cleanContent.length > 180 ? cleanContent.substring(0, 177) + '...' : cleanContent;

  if (!title || !content) {
    return res.status(400).render('404', { title: 'Validation Error', message: 'Title and content are required.' });
  }

  try {
    // Get existing post details
    const existingPostQuery = await db.query('SELECT cover_image, status, published_at FROM posts WHERE id = $1', [postId]);
    if (existingPostQuery.rows.length === 0) {
      return res.status(404).render('404', { title: 'Post Not Found', message: 'The post you are trying to update does not exist.' });
    }

    const existingPost = existingPostQuery.rows[0];
    const coverImage = req.file ? `/uploads/${req.file.filename}` : existingPost.cover_image;

    // Calculate published_at date
    // Calculate published_at date
    let publishedAt = existingPost.published_at;

    if (postStatus === 'draft') {
      publishedAt = null;
    } else if (postStatus === 'published') {
      if (publishedAtManual) {
        publishedAt = new Date(publishedAtManual);
      } else if (existingPost.published_at) {
        publishedAt = existingPost.published_at;
      } else {
        publishedAt = new Date();
      }
    }

    // Generate unique slug if title has changed
    let slug = slugify(title, { lower: true, strict: true });
    const slugCheck = await db.query('SELECT id FROM posts WHERE slug = $1 AND id != $2', [slug, postId]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Math.round(Math.random() * 10000)}`;
    }

    const queryText = `
      UPDATE posts 
      SET title = $1, slug = $2, excerpt = $3, content = $4, cover_image = $5, status = $6, published_at = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `;
    await db.query(queryText, [title, slug, excerpt, content, coverImage, postStatus, publishedAt, postId]);
    
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).render('404', { title: 'Server Error', message: 'Failed to update post.' });
  }
});

// POST Delete Post Action
router.post('/posts/:id/delete', isAuthenticated, async (req, res) => {
  try {
    const queryText = 'DELETE FROM posts WHERE id = $1';
    await db.query(queryText, [req.params.id]);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).render('404', { title: 'Server Error', message: 'Failed to delete post.' });
  }
});

// =========================================================================
// USER MANAGEMENT (Superadmin Only)
// =========================================================================

// GET User Management Portal
router.get('/users', isAuthenticated, isSuperAdmin, async (req, res) => {
  try {
    const queryText = 'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC';
    const result = await db.query(queryText);
    
    // Check parameters for message boxes
    let errorMsg = null;
    if (req.query.error === 'self_delete') {
      errorMsg = 'You cannot delete your own logged-in account.';
    } else if (req.query.error === 'username_exists') {
      errorMsg = 'Username is already taken.';
    } else if (req.query.error === 'fields_required') {
      errorMsg = 'Username, password, and role are required.';
    }
    
    let successMsg = null;
    if (req.query.success === 'user_created') {
      successMsg = 'Admin user created successfully.';
    } else if (req.query.success === 'user_deleted') {
      successMsg = 'Admin user deleted successfully.';
    }

    res.render('admin/users', {
      title: 'Manage User Permissions',
      users: result.rows,
      error: errorMsg,
      success: successMsg,
      currentUser: { id: req.session.userId, username: req.session.username, role: req.session.userRole }
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).render('404', { title: 'Server Error', message: 'Could not fetch admin users list.' });
  }
});

// POST Create User Action
router.post('/users', isAuthenticated, isSuperAdmin, async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.redirect('/admin/users?error=fields_required');
  }

  try {
    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE username = $1';
    const checkResult = await db.query(checkQuery, [username]);
    
    if (checkResult.rows.length > 0) {
      return res.redirect('/admin/users?error=username_exists');
    }

    // Hash password and insert
    const passwordHash = await bcrypt.hash(password, 10);
    const insertQuery = 'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)';
    await db.query(insertQuery, [username, passwordHash, role]);

    res.redirect('/admin/users?success=user_created');
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).render('404', { title: 'Server Error', message: 'Failed to create user.' });
  }
});

// POST Delete User Action
router.post('/users/:id/delete', isAuthenticated, isSuperAdmin, async (req, res) => {
  const userIdToDelete = parseInt(req.params.id, 10);
  const currentLoggedInUserId = req.session.userId;

  // Prevent deleting self
  if (userIdToDelete === currentLoggedInUserId) {
    return res.redirect('/admin/users?error=self_delete');
  }

  try {
    const queryText = 'DELETE FROM users WHERE id = $1';
    await db.query(queryText, [userIdToDelete]);
    res.redirect('/admin/users?success=user_deleted');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).render('404', { title: 'Server Error', message: 'Failed to delete user.' });
  }
});

module.exports = router;
