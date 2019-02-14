var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
const bodyParser = require("body-parser");

var PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
//Cookie Business
app.post('/login', (req, res) => {
    // set a cookie named username to the value submitted 
    // in the request body via the login form
    // // after the server has set the cookie, redirect to the /urls
    res.cookie("username", req.body.username)
    res.redirect('/urls');
});


// this tells the Express app to use EJS as its templating engine
app.set("view engine", "ejs"); 

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b> World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
    let templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars)
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

function generateRandomString() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

app.post("/urls", (req, res) => {
    // console.log(req.body);  // Log the POST request body to the console
    // res.send("Ok");         // Respond with 'Ok' (we will replace this)
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = req.body.longURL;
    console.log(urlDatabase);
    res.redirect("/urls/" + newShortURL)
});

app.get("/urls/:shortURL", (req, res) => {
    let templateVars = { shortURL: req.params.shortURL, 
        longURL: urlDatabase[req.params.shortURL]};
    res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
    const longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
});

app.post('/urls/:shortURL/update', (req, res) => {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
})
