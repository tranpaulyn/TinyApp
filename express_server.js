var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
const bodyParser = require('body-parser');

var PORT = 8080; // default port 8080


// this tells the Express app to use EJS as its templating engine
app.set('view engine', 'ejs'); 
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

var urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};


app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/hello', (req, res) => {
    res.send('<html><body>Hello <b> World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Home Page -- lists all URLS & login/logout
app.get('/urls', (req, res) => {
    let templateVars = {
        urls: urlDatabase,
        email: usersDB[req.cookies['user_id']],
        username: req.cookies.user_id };
    res.render('urls_index', templateVars)
});

//Create New Tiny URL Page
app.get('/urls/new', (req, res) => {
    let templateVars = {
        email: usersDB[req.cookies['user_id']],
        username: req.cookies.user_id };
    res.render('urls_new', templateVars)
});

//Generate random string to create new tiny URL
function generateRandomString() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

// Create New Tiny URL & Add to URL Datbase
app.post('/urls', (req, res) => {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = req.body.longURL;
    console.log(urlDatabase);
    res.redirect('/urls/' + newShortURL)
});


// Short URL Page - can edit/update on this page
app.get('/urls/:shortURL', (req, res) => {
    let templateVars = { shortURL: req.params.shortURL, 
        longURL: urlDatabase[req.params.shortURL],
        email: usersDB[req.cookies['user_id']],
        username: req.cookies.user_id };
    res.render('urls_show', templateVars);
});

// Link short url to long URL
app.get('/u/:shortURL', (req, res) => {
    const longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});

// Delete Short URL
app.post('/urls/:shortURL/delete', (req, res) => {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
});

// Updates Short URL in the database
app.post('/urls/:shortURL/update', (req, res) => {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
})


// Create Random User ID
function generateRandomUserID() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

// Users Database
const usersDB = {
    'userRandomID': {
        id: 'userRandomID',
        email: 'user@example.com',
        password: 'purple-monkey-dinosaur'
    },
    'user2RandomID': {
        id: 'userRandomID',
        email: 'user2@example.com',
        password: 'dishwasher-funk'
    }
};

// Registration Page
app.get('/register', (req, res) => {
    const templateVars = {
        email: usersDB[req.cookies['user_id']],
        username: req.cookies.user_id // we need this for header login
    };
    res.render('urls_register', templateVars)
});

// Email Lookup Helper Function 
function emailLookup(email) {
    for (var id in usersDB) {
        if (email === usersDB[id].email) {
            return true
        }
    } 
}
// PW lookup function
function passwordCheck(password) {
    for (var id in usersDB) {
        if (password === usersDB[id].password) {
            return true
        }
    }
}

// Find User ID
function userIdCheck(email) {
    for (var id in usersDB) {
        if (email === usersDB[id].email) {
            return id
        }
    }
}

// Registration Handler
app.post('/register', (req, res) => {
    const newUser = generateRandomUserID();
    const userEmail = req.body.email;
    const userPW = req.body.password;
    console.log(emailLookup(userEmail));
    // If empty strings are passed, redirect to error page
    if (userEmail === '' || userPW === '' || emailLookup(userEmail) ) {
        res.redirect('/error');
    } else {
        usersDB[newUser] = {
            id: newUser, 
            email: userEmail,
            password: userPW
        }
        console.log(usersDB);
        res.cookie('user_id', newUser)
        res.redirect('/urls');
    }
});

// Error Page
app.get('/error', (req, res) => {
    const templateVars = { 
        username: req.cookies.user_id,
        email: usersDB[req.cookies['user_id']],
    }
    res.render('urls_error', templateVars)
})

// Login Page
app.get('/login', (req, res) => {
    // we need these for the header
    const templateVars = {
        email: usersDB[req.cookies['user_id']],
        username: req.cookies.user_id 
    }; 
    res.render('urls_login', templateVars)
});

// Login Page Handler
app.post('/login', (req, res) => {
    // const newUser = generateRandomUserID();
    const userEmail = req.body.email;
    const userPW = req.body.password;
    console.log(emailLookup(userEmail));
    // Check email and password match
    if (emailLookup(userEmail) && passwordCheck(userPW)) {
        res.cookie('user_id', userIdCheck(userEmail))
        res.redirect('/urls')
    // If empty strings are passed or email does not match redirect to error page
    } else {
        res.redirect('/error');
    } console.log(usersDB)
});

// Clear Cookie & Logout
app.post('/logout', (req, res) => {
    res.clearCookie('user_id')
    res.redirect('/urls');
});