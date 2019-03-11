const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); 
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session');

const PORT = 8080; // default port 8080

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
  });

// this tells the Express app to use EJS as its templating engine
app.set('view engine', 'ejs'); 
app.use(bodyParser.urlencoded({extended: true}));

// Cookie Business
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: ['randomString']
}));

/* The Databases */
// URL Database
const urlDatabase = {};

// Users Database
const usersDB = {};

/* Functions */
//Generate random string to create new tiny URL
function generateRandomString() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
};

// Create Random User ID
function generateRandomUserID() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

// Find User ID
function userIdCheck(email) {
    for (var id in usersDB) {
        if (email === usersDB[id].email) {
            return id
        }
    }
}


// Root URL with proper redirects
app.get('/', (req, res) => {
    if (req.session.user_id) {
        res.redirect('/urls');
    } else {
        res.redirect('/login');
    }
});

//Home Page -- lists all URLS & login/logout
app.get('/urls', (req, res) => {
    let templateVars = {
        urls: urlDatabase,
        cookie: req.session.user_id,
        email: usersDB[req.cookies['user_id']],
        username: req.session.user_id,
        longURL: req.body.longURL };
    res.render('urls_index', templateVars);
});

//Create New Tiny URL Page
app.get('/urls/new', (req, res) => {
    let templateVars = {
        email: usersDB[req.cookies['user_id']],
        username: req.session.user_id };
    res.render('urls_new', templateVars);
});

// Create New Tiny URL & Add to URL Datbase
app.post('/urls', (req, res) => {
    const newShortURL = generateRandomString();
    const userID = req.session.user_id;
    // Add Date of Creation
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1; 
    let yyyy = today.getFullYear();
    today = mm + '/' + dd + '/' + yyyy;
    urlDatabase[newShortURL] = {
        longURL: req.body.longURL,
        userID: userID,
        date: today
    };
    res.redirect('/urls/' + newShortURL);
});


// Short URL Page - can edit/update on this page
app.get('/urls/:shortURL', (req, res) => {
    if (req.params.shortURL) { // If the short URL exists
        let templateVars = { 
            urls: urlDatabase,
            shortURL: req.params.shortURL,
            userID: urlDatabase[req.params.shortURL].userID,
            cookie: req.session.user_id,
            email: usersDB[req.cookies['user_id']]
        };
        res.render('urls_show', templateVars);  
    }  else { // If it doesn't exist redirect
        res.redirect('/error404');
    }
});


// Link short url to long URL
app.get('/u/:shortURL', (req, res) => {
    if (req.params.shortURL) { // If the short URL exists
        const longURL = urlDatabase[req.params.shortURL].longURL;
        res.redirect(longURL);
    } else { // Else redirect
        res.redirect('/error404');
    }
});

// Delete Short URL
app.post('/urls/:shortURL/delete', (req, res) => {
    // If the user created that URL, only they can delete it
    if (req.session.user_id === urlDatabase[req.params.shortURL].userID) { 
        delete urlDatabase[req.params.shortURL];
    }
    res.redirect('/urls');
});

app.get('/urls/:shortURL/delete', (req, res) => {
    if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
        delete urlDatabase[req.params.shortURL];
        res.redirect('/urls');
    } else {
        res.redirect('/error404');
    }
})

// Updates Short URL in the database
app.post('/urls/:shortURL/update', (req, res) => {
    if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
        urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    }
    res.redirect('/urls');
})


// Registration Page
app.get('/register', (req, res) => {
    // we need this for header login
    const templateVars = {
        email: usersDB[req.session['user_id']],
        username: req.session.user_id 
    };
    res.render('urls_register', templateVars);
});


// Error Page 400
app.get('/error400', (req, res) => {
    const templateVars = { 
        email: usersDB[req.cookies['user_id']],
        username: req.session.user_id
    }
    res.render('urls_error400', templateVars);
});

// Error Page 403
app.get('/error403', (req, res) => {
    const templateVars = { 
        email: usersDB[req.cookies['user_id']],
        username: req.session.user_id ,
    }
    res.render('urls_error403', templateVars);
});

// Error Page 404
app.get('/error404', (req, res) => {
    const templateVars = { 
        email: usersDB[req.cookies['user_id']],
        username: req.session.user_id ,
    }
    res.render('urls_error404', templateVars);
});

// Login Page
app.get('/login', (req, res) => {
    // we need these for the header
    const templateVars = {
        email: usersDB[req.session['user_id']],
        username: req.session.user_id 
    }; 
    res.render('urls_login', templateVars);
});

// Email Lookup Helper Function 
function emailLookup(email) {
    for (var id in usersDB) {
        if (email === usersDB[id].email) {
            return true;
        }
    } 
}

// Registration Handler
app.post('/register', (req, res) => {
    const newUser = generateRandomUserID();
    const userEmail = req.body.email;
    const userPW = req.body.password;
    let hashedPassword = bcrypt.hashSync(userPW, 10);
    // If empty strings are passed, redirect to error page
    if (userEmail === '' || userPW === '' || emailLookup(userEmail)) {
        res.redirect('/error400');
    } else {
        usersDB[newUser] = {
            id: newUser, 
            email: userEmail,
            password: hashedPassword
        }
        req.session.user_id = newUser;
        res.cookie('user_id', userIdCheck(userEmail));
        res.redirect('/urls');
    }
});

// Login Page Handler
app.post('/login', (req, res) => {
    const userEmail = req.body.email;
    const userPW = req.body.password;
    console.log(userPW)
    let userID = userIdCheck(userEmail);
    // Check email and password match
    if (!userEmail || userEmail === "" || !userPW || userPW === "") {
        res.redirect('/error403');
    } else if (emailLookup(userEmail)) {
    let hashedPassword = usersDB[userID].password
        if (bcrypt.compareSync(userPW, hashedPassword)) {
            res.cookie('user_id', userIdCheck(userEmail));
            req.session.user_id = usersDB[userID].id;
            res.redirect('/urls')
        } else {
            res.redirect('/error403');
        }
    } else {
        res.redirect('/error403');
    }
});

// Clear Cookie & Logout
app.post('/logout', (req, res) => {
    req.session = null;
    res.clearCookie('user_id');
    res.redirect('/urls');
});