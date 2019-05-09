var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs")


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "1234567890"
  let randomString = "";
  for (let i = 0; i < 3; i++) {
    randomString += letters.charAt(Math.floor(Math.random() * 26));
    randomString += numbers.charAt(Math.floor(Math.random() * 10));
  }
  return randomString;
}

app.post("/urls", (req, res) => {

  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;

  res.redirect("/urls/" + randomString);

});

app.post("/login", function (req, res) {
   const value = req.body.username;
  res.cookie("username",value,);
  res.redirect(`http://localhost:8080/urls`)

});

app.post("/logout", function (req, res) {
  //curl -X POST -i localhost:8080/logoutconst value = req.body.username;
  //res.clearCookie('name',
 res.clearCookie("username",);
 res.redirect(`http://localhost:8080/urls`)

});

app.post("/urls/:shortURL/delete", (req, res) => {

  delete urlDatabase[req.params.shortURL];
  res.redirect(`http://localhost:8080/urls`)
  });

  app.post("/urls/:id", (req, res) => {
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect(`http://localhost:8080/urls`)
    });

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"]};
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  let templateVars ={username: req.cookies["username"]};
  res.render("urls_new",templateVars );
});

app.get("/urls/404", (req, res) => {
  res.render("urls_error");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  templateVars.longURL ? res.render("urls_show", templateVars) : res.redirect(`http://localhost:8080/urls/404`);
});

app.get("/u/:shortURL", (req, res) => {
  
  const longURL = urlDatabase[req.params.shortURL];
  longURL ? res.redirect(longURL) : res.redirect(`http://localhost:8080/urls/404`)
  
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


