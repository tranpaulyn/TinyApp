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
        username: req.cookies.username };
    res.render('urls_index', templateVars)
});

//Create New Tiny URL Page
app.get('/urls/new', (req, res) => {
    let templateVars = {
        username: req.cookies.username };
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

//Cookie Business -- create a cookie
app.post('/login', (req, res) => {
    res.cookie('username', req.body.username)
    res.redirect('/urls');
});

// Clear Cookie & Logout
app.post('/logout', (req, res) => {
    res.clearCookie('username')
    res.redirect('/urls');
});


// Short URL Page - can edit/update on this page
app.get('/urls/:shortURL', (req, res) => {
    let templateVars = { shortURL: req.params.shortURL, 
        longURL: urlDatabase[req.params.shortURL],
        username: req.cookies.username };
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