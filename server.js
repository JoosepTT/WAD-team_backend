const express = require('express');
const pool = require('./database');
const cors = require('cors')
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 3000;

const app = express();

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));

app.use(express.json());
app.use(cookieParser());

const secret = "gdgdhdbcb770785rgdzqws";
const maxAge = 60 * 60; //the expiresIn in jwt token is calculated in seconds

const generateJWT = (id) => {
    return jwt.sign({ id }, secret, { expiresIn: maxAge })
        //jwt.sign(payload, secret, [options, callback]), and it returns the JWT as string
}

app.get('/api/auth', async(req, res) => {
    console.log('authentication request has been arrived');
    const token = req.cookies.jwt; // assign the token named jwt to the token const
    //console.log("token " + token);
    let authenticated = false; // a user is not authenticated until proven the opposite
    try {
        if (token) { //checks if the token exists
            //jwt.verify(token, secretOrPublicKey, [options, callback]) verify a token
            jwt.verify(token, secret, (err) => { //token exists, now we try to verify it
                if (err) { // not verified, redirect to login page
                    console.log(err.message);
                    console.log('token is not verified');
                    res.send({ "authenticated": authenticated }); // authenticated = false
                } else { // token exists and it is verified 
                    console.log('author is authinticated');
                    authenticated = true;
                    res.send({ "authenticated": authenticated }); // authenticated = true
                }
            })
        } else { //applies when the token does not exist
            console.log('author is not authinticated');
            res.send({ "authenticated": authenticated }); // authenticated = false
        }
    } catch (err) {
        console.error(err.message);
        res.status(400).send(err.message);
    }
});

//logout a user = deletes the jwt
app.post('/api/logout', (req, res) => {
    console.log('delete jwt request arrived');
    res.status(202).clearCookie('jwt').json({ "Msg": "cookie cleared" }).send()
});

// fetching all posts
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.title, p.body, p.urllink, p.date, u.username
      FROM posttable p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.date DESC`
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

// signup a user
app.post('/api/signup', async(req, res) => {
    try {
        console.log("a signup request has arrived");
        //console.log(req.body);
        const { username, email, password } = req.body;

        const salt = await bcrypt.genSalt(); //  generates the salt, i.e., a random string
        const bcryptPassword = await bcrypt.hash(password, salt) // hash the password and the salt 
        const authUser = await pool.query( // insert the user and the hashed password into the database
            "INSERT INTO users(email, password, username) values ($1, $2, $3) RETURNING*", [email, bcryptPassword, username]
        );
        console.log(authUser.rows[0].id);
        const token = generateJWT(authUser.rows[0].id); // generates a JWT by taking the user id as an input (payload)
        //console.log(token);
        //res.cookie("isAuthorized", true, { maxAge: 1000 * 60, httpOnly: true });
        //res.cookie('jwt', token, { maxAge: 6000000, httpOnly: true });
        res.status(201)
            .cookie('jwt', token, { maxAge: 6000000, httpOnly: true })
    } catch (err) {
        console.error(err.message);
        res.status(400).send(err.message);
    }
});

app.post('/api/login', async(req, res) => {
    try {
        console.log("a login request has arrived");
        const { email, password } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(401).json({ error: "User is not registered" });

        /* 
        To authenticate users, you will need to compare the password they provide with the one in the database. 
        bcrypt.compare() accepts the plain text password and the hash that you stored, along with a callback function. 
        That callback supplies an object containing any errors that occurred, and the overall result from the comparison. 
        If the password matches the hash, the result is true.

        bcrypt.compare method takes the first argument as a plain text and the second argument as a hash password. 
        If both are equal then it returns true else returns false.
        */

        //Checking if the password is correct
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        //console.log("validPassword:" + validPassword);
        if (!validPassword) return res.status(401).json({ error: "Incorrect password" });

        const token = generateJWT(user.rows[0].id);
        const data = {
            id: user.rows[0].id,
            email: user.rows[0].email,
            username: user.rows[0].username
        }
        res.status(201)
            .cookie('jwt', token, { maxAge: 6000000, httpOnly: true })
            .json(data)
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ err: err.message });
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
        if (posts.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }
        //res.json(posts.rows[0]); // we already know that the row array contains a single element, and here we are trying to access it
        // The res.json() function sends a JSON response. 
        // This method sends a response (with the correct content-type) that is the parameter converted to a JSON string using the JSON.stringify() method.

        const post = {
            ...posts.rows[0],
            date: posts.rows[0].date.toISOString()
        };
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
}); 

// update post by ID
app.put('/api/posts/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const { title, body, urllink, user_id } = req.body;
        console.log("update request has arrived");
        const updatepost = await pool.query(
            "UPDATE posttable SET (title, body, urllink, user_id) = ($2, $3, $4, $5) WHERE id = $1 RETURNING *", [id, title, body, urllink, user_id]
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
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// deleting post by ID
app.delete('/api/posts', async(req, res) => {
    try {
        console.log("delete all posts request has arrived");
        await pool.query("DELETE FROM posttable")
        res.json({ message: "Posts deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// adding new post
app.post('/api/posts', async(req, res) => {
    try {
        console.log("a post request has arrived");
        const { title, body, urllink, user_id } = req.body;
        const newpost = await pool.query(
            "INSERT INTO posttable(title, body, urllink, user_id) values ($1, $2, $3, $4) RETURNING*", 
            [title, body, urllink, user_id] // Lisa author req.body'st
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