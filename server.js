const express = require('express');
const pool = require('./database');
const cors = require('cors')
const port = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());


// fetching all posts
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM posttable ORDER BY date DESC"
    );
    
    const formattedPosts = result.rows.map(row => ({
      ...row,
      date: row.date.toISOString()
    }));
    
    res.json(formattedPosts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// fetching post by ID
app.get('/api/posts/:id', async(req, res) => {
    try {
        console.log("get a post with route parameter  request has arrived");
        // The req.params property is an object containing properties mapped to the named route "parameters". 
        // For example, if you have the route /posts/:id, then the "id" property is available as req.params.id.
        const { id } = req.params; // assigning all route "parameters" to the id "object"
        const posts = await pool.query( // pool.query runs a single query on the database.
            //$1 is mapped to the first element of { id } (which is just the value of id). 
            "SELECT * FROM posttable WHERE id = $1", [id]
        );
        res.json(posts.rows[0]); // we already know that the row array contains a single element, and here we are trying to access it
        // The res.json() function sends a JSON response. 
        // This method sends a response (with the correct content-type) that is the parameter converted to a JSON string using the JSON.stringify() method.
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }
        const post = {
            ...result.rows[0],
            date: result.rows[0].date.toISOString()
        };
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
}); 


// update post by ID
app.put('/api/posts/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const { title, body, urllink } = req.body;
        console.log("update request has arrived");
        const updatepost = await pool.query(
            "UPDATE posttable SET (title, body, urllink) = ($2, $3, $4) WHERE id = $1", [title, body, urllink]
        );
        if (updatepost.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json(updatepost.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});


// deleting post by ID
app.delete('/api/posts/:id', async(req, res) => {
    try {
        const { id } = req.params;
        //const post = req.body; // we do not need a body for a delete request
        console.log("delete a post request has arrived");
        const deletepost = await pool.query(
            "DELETE FROM posttable WHERE id = $1", [id]
        );
        if (deletepost.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }
        const post = {
            ...result.rows[0],
            date: result.rows[0].date.toISOString()  // Nüüd vormindatud!
        };
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// adding new post
app.post('/api/posts', async(req, res) => {
    try {
        console.log("a post request has arrived");
        const { title, body, urllink, author } = req.body;
        const newpost = await pool.query(
            "INSERT INTO posttable(title, body, urllink, author) values ($1, $2, $3, $4) RETURNING*", 
            [title, body, urllink, author] // Lisa author req.body'st
        );
        const createdPost = {
            ...newpost.rows[0],
            date: newpost.rows[0].date.toISOString()
        };
        res.status(201).json(createdPost);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});


app.listen(port, () => {
    console.log("Server is listening to port " + port)
});