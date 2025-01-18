const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const path = require('path');

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MySQL Database connection
const db = mysql.createConnection({
    host: 'blog-database.crcsee06oz8d.eu-central-1.rds.amazonaws.com', // RDS endpoint
    user: 'admin', // Master username
    password: 'jakojajedujako', // Password
    database: 'Blogs', // Database name
    port: 3306 // Port for MySQL
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// REST API

// GET /api/about - Retrieve API documentation HTML page with all available URI options so you would know how it works
app.get('/api/about', (req, res) => {
        res.sendFile(path.join(__dirname, 'html', 'api_documentation.html'));
});

//GET /api/blog - Retrieve all blog posts
app.get('/api/blog', (req, res) => {
    const query = `
        SELECT Blog.id, Blog.title, Blog.content, Blog.timestamp,
               Author.name AS author_name, Author.surname AS author_surname
        FROM Blog
        JOIN Author ON Blog.author_id = Author.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Database query error' });
            return;
        }
        res.json(results);
    });
});

// POST /api/blog - Create a new blog post
app.post('/api/blog', (req, res) => {
    const { title, content, author_name, author_surname } = req.body;

    console.log('Received data to add blog:', req.body);

    // Check if author exists first
    const checkAuthorQuery = 'SELECT id FROM Author WHERE name = ? AND surname = ?';
    db.query(checkAuthorQuery, [author_name, author_surname], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database query error' });
        }

        if (results.length === 0) {
            console.log('Author not found:', author_name, author_surname);
            return res.status(400).json({ message: 'Author does not exist. Please add the author first.' });
        }

        const author_id = results[0].id;
        const insertBlogQuery = 'INSERT INTO Blog (title, content, author_id) VALUES (?, ?, ?)';
        db.query(insertBlogQuery, [title, content, author_id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Database insert error' });
            }
            res.json({ message: 'Blog added successfully', postId: result.insertId });
        });
    });
});

/*// API endpoint to check if the author exists
app.post('/api/checkAuthor', (req, res) => {
    const { author_name, author_surname } = req.body;
    const query = 'SELECT id FROM Author WHERE name = ? AND surname = ?';

    db.query(query, [author_name, author_surname], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database query error' });
        }
        res.json({ exists: results.length > 0 });
    });
});*/

// GET /api/blog/:id - Retrieve a blog post by ID
app.get('/api/blog/:id', (req, res) => {
    const blogId = req.params.id;
    const query = `
        SELECT Blog.id, Blog.title, Blog.content, Author.name AS author_name, Author.surname AS author_surname
        FROM Blog
        JOIN Author ON Blog.author_id = Author.id
        WHERE Blog.id = ?
    `;
db.query(query, [blogId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database query error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.json(results[0]);
    });
});

// DELETE /api/blog/:id - Delete a blog post by ID
app.delete('/api/blog/:id', (req, res) => {
    const blogId = req.params.id;
    const deleteQuery = 'DELETE FROM Blog WHERE id = ?';

    db.query(deleteQuery, [blogId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database delete error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.json({ message: 'Blog post deleted successfully' });
    });
});

// PATCH /api/blog/:id - Partially update a blog post by ID
app.patch('/api/blog/:id', (req, res) => {
    const blogId = req.params.id;
    const { title, content } = req.body;
    let updateFields = [];
    let updateValues = [];

    // Construct dynamic update query based on provided fields
    if (title) {
        updateFields.push('title = ?');
        updateValues.push(title);
    }
    if (content) {
        updateFields.push('content = ?');
        updateValues.push(content);
    }
    updateValues.push(blogId); // Add ID to the end of the values array

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update' });
    }

    const updateQuery = `UPDATE Blog SET ${updateFields.join(', ')} WHERE id = ?`;
    db.query(updateQuery, updateValues, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database update error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.json({ message: 'Blog post updated successfully' });
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://54.93.165.202:${port}`);
});
