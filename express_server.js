// All the requirments 
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); 
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session');

const PORT = 8080; // default port 8080


// this tells the Express app to use EJS as its templating engine
app.set('view engine', 'ejs'); 
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

app.use(cookieSession({
    name: 'session',
    keys: ['randomString']
}));


// The Databases
// The URL Database
const urlDatabase = {};

// Users Database
const usersDB = {};

// The Functions
//Generate random string to create new tiny URL
function generateRandomString() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
};

// Create Random User ID
function generateRandomUserID() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
};

// Find User ID
function userIdCheck(email) {
    for (let id in usersDB) {
        if (email === usersDB[id].email) {
            return id;
        }
    }
};

// Email Lookup Helper Function 
function emailLookup(email) {
    for (let id in usersDB) {
        if (email === usersDB[id].email) {
            return true;
        }
    } 
};

// Root URL with proper redirects
app.get('/', (req, res) => {
    if (req.session.user_id) {
        res.redirect('/urls');
    } else {
        res.redirect('/login');
    }
});

app.listen(PORT, () => {});

//Home Page -- lists all URLS & login/logout
app.get('/urls', (req, res) => {
    let templateVars = {
        urls: urlDatabase,
        cookie: req.session.user_id,
        email: usersDB[req.cookies['user_id']],
        user: req.cookies['user_id'],
        username: req.session.user_id,
        longURL: req.body.longURL 
    };
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
        let templateVars = { 
            urls: urlDatabase,
            cookie: req.session.user_id,
            shortURL: req.params.shortURL,
            email: usersDB[req.cookies['user_id']],
            user: req.cookies['user_id'],
            username: req.session.user_id
        };
        res.render('urls_show', templateVars);    
});


// Link short url to long URL
app.get('/u/:shortURL', (req, res) => {
    if (req.params.shortURL) {
        const longURL = urlDatabase[req.params.shortURL].longURL;
        res.redirect(longURL);
    } else {
        res.redirect('/error404');
    }
});

// Delete Short URL
app.post('/urls/:shortURL/delete', (req, res) => {
    if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
        delete urlDatabase[req.params.shortURL];
    }
    res.redirect('/urls');
});

// Only allow user who created URL to delete it and redirect
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

// Registration Handler
app.post('/register', (req, res) => {
    const newUser = generateRandomUserID(); // Generates random string for new userID
    const userEmail = req.body.email; // User enters email and desired password
    const userPW = req.body.password;
    let hashedPassword = bcrypt.hashSync(userPW, 10); // Has the new user's password
    // If empty strings are passed, redirect to error page
    // If email already exists in user database, redirect to error page
    if (userEmail === '' || userPW === '' || emailLookup(userEmail)) {
        res.redirect('/error400');
    } else { // Successful registration
        usersDB[newUser] = {
            id: newUser, 
            email: userEmail,
            password: hashedPassword
        } // Create session cookie after successful registration & redirect to home
        req.session.user_id = newUser;
        res.cookie('user_id', userIdCheck(userEmail));
        res.redirect('/urls');
    }
});

// Login Page Handler
app.post('/login', (req, res) => {
    // const newUser = generateRandomUserID();
    const userEmail = req.body.email;
    const userPW = req.body.password;
    let userID = userIdCheck(userEmail);
    let hashedPassword = usersDB[userID].password
    // Check if email and password match and make sure no empty strings passed
    if (!userEmail || userEmail === "" && !userPW || userPW === "") {
        res.redirect('/error403');
    } else if (emailLookup(userEmail)) { // If email is found is user database, check if password matches
        if (bcrypt.compareSync(userPW, hashedPassword)) {
            // If email is found and password matches, create hashed cookie and redirect
            res.cookie('user_id', userIdCheck(userEmail));
            req.session.user_id = 'some value';
            res.redirect('/urls');
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