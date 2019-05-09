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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

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

const emaillookup = (email,password) => {
let checker = "";


  if (email) {
    for (const key in users) {
      if (email === users[key].email) {
        
        return users[key];
      }
    }
  }
  
  return "Not Found";
}

app.post("/urls", (req, res) => {

  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;

  res.redirect("/urls/" + randomString);

});

app.post("/login", function (req, res) {
  let error = "n";
  let templateVars = { type: "login", user:users[req.cookies["user_id"]], error: "n" };
  let user = emaillookup(req.body.email);
//  console.log(req.body.email)
//  console.log(req.body.password)
//  console.log(user["id"])
//  console.log(user)
 
  if (req.body.email && req.body.password && user !== "Not Found" && user["password"] === req.body.password) {
  
    res.cookie("user_id", user["id"]);
    res.redirect(`http://localhost:8080/urls`)
  
  } 


  else {

    
    
    if(!req.body.password || !req.body.email) {
      error = "Status Code:400 // Both fields are required"
    } else if (user === "Not Found") {
      error = "Status Code:403 // Email id doesnt exist"
    } else {
      error = "Status Code:403 // Password is wrong"
    }

    templateVars.error = error;
    
    res.render("urls_register", templateVars);
  }
});

app.post("/register", function (req, res) {

  if (req.body.email && req.body.password && emaillookup(req.body.email) === "Not Found") {
    
    const uniqueId = generateRandomString();
    users[uniqueId] = {};
    users[uniqueId]["id"] = uniqueId;
    users[uniqueId]["email"] = req.body.email
    users[uniqueId]["password"] = req.body.password
    res.cookie("user_id", uniqueId);
    res.redirect(`http://localhost:8080/urls`)
   

  }
  else {
    let error = "";
    
    if(!req.body.password || !req.body.email) {
      error = "Status Code:400 // Both fields are required"
    } else {
      error = "Status Code:400 // Email is already registered"
    }

    
    let templateVars = { type: "register", user: users[req.cookies["user_id"]], error: error };
    res.render("urls_register", templateVars);


  }
//console.log(users);
});

app.post("/logout", function (req, res) {
  //curl -X POST -i localhost:8080/logoutconst value = req.body.user_id;
  //res.clearCookie('name',
  //console.log()
  res.clearCookie("user_id");
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

app.get("/register", (req, res) => {
  let templateVars = { type: "register", user: users[req.cookies["user_id"]], error: "n" };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { type: "login", user: users[req.cookies["user_id"]], error: "n" };
  res.render("urls_register", templateVars);
});

app.get("/urls", (req, res) => {
  
  let templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
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
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});



app.get("/urls/404", (req, res) => {
  res.render("urls_error");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  templateVars.longURL ? res.render("urls_show", templateVars) : res.redirect(`http://localhost:8080/urls/404`);
});

app.get("/u/:shortURL", (req, res) => {

  const longURL = urlDatabase[req.params.shortURL];
  longURL ? res.redirect(longURL) : res.redirect(`http://localhost:8080/urls/404`)

});





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


