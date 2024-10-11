
// server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MySQL Database connection (replace 'your_mysql_ip' with your MySQL server's public IP)
const db = mysql.createConnection({
    host: '3.79.156.2', // MySQL server IP address
    user: 'hofman',
    password: 'NewP4ssword_',
    database: 'Blog_database',
    port:3306
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// API endpoint to get all blog posts
app.get('/api/getBlogs', (req, res) => {
    const query = `
        SELECT Blog.title, Blog.content, Author.name AS author_name, Author.surname AS author_surname
        FROM Blog
        JOIN Author ON Blog.author_id = Author.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Database query error' });
            return;
        }
        // Send the results as JSON to the frontend
        res.json(results);
    });
});


// API endpoint to add a new blog post
app.post('/api/addBlog', (req, res) => {
    const { title, content, author_name, author_surname } = req.body;

    // Check if author exists first
    const checkAuthorQuery = 'SELECT id FROM Author WHERE name = ? AND surname = ?';
    db.query(checkAuthorQuery, [author_name, author_surname], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database query error' });
        }

        if (results.length === 0) {
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

// API endpoint to check if the author exists
app.post('/api/checkAuthor', (req, res) => {
    const { author_name, author_surname } = req.body;
    const query = 'SELECT id FROM Author WHERE name = ? AND surname = ?';

    db.query(query, [author_name, author_surname], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database query error' });
        }
        if (results.length > 0) {
            // Author exists
            res.json({ exists: true, author_id: results[0].id });
        } else {
            // Author does not exist
            res.json({ exists: false });
        }
    });
});


// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on the current IP with port:{port}`);
});
