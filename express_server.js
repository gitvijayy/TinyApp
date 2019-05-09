var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs")


const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
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

const emaillookup = (email) => {
  if (email) {
    for (const key in users) {
      if (email === users[key].email) {
        return users[key];
      }
    }
  }
  return "Not Found";
}

const filterUrls = (user) => {
  let data = {}
  console.log(user)
  for (let key in urlDatabase) {
    if (urlDatabase[key]["userID"] === user) {
      data[key] = urlDatabase[key]["longURL"];
    }
    
  }
  return data;
}

app.post("/urls", (req, res) => {

  const randomString = generateRandomString();
  urlDatabase[randomString] = {};
  urlDatabase[randomString]["longURL"]=req.body.longURL;
  urlDatabase[randomString]["userID"]=req.cookies["user_id"];
  res.redirect("/urls/" + randomString);

});

app.post("/login", function (req, res) {

  let error = "n";
  let user = emaillookup(req.body.email);
  if (req.body.email && req.body.password && user !== "Not Found" && user["password"] === req.body.password) {
    res.cookie("user_id", user["id"]);
    res.redirect(`http://localhost:8080/urls`)
  }
  else {
    if (!req.body.password || !req.body.email) {
      error = "Status Code:400 // Both fields are required"
    } else if (user === "Not Found") {
      error = "Status Code:403 // Email id doesnt exist"
    } else {
      error = "Status Code:403 // Password is wrong"
    }

    let templateVars = { type: "login", user: users[req.cookies["user_id"]], error: error };

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
  } else {
    let error = "";
    if (!req.body.password || !req.body.email) {
      error = "Status Code:400 // Both fields are required"
    } else {
      error = "Status Code:400 // Email is already registered"
    }
    let templateVars = { type: "register", user: users[req.cookies["user_id"]], error: error };
    res.render("urls_register", templateVars);
  }

});

app.post("/logout", function (req, res) {
  res.clearCookie("user_id");
  res.redirect(`http://localhost:8080/urls`)
});

app.post("/urls/:shortURL/delete", (req, res) => {

  delete urlDatabase[req.params.shortURL];
  res.redirect(`http://localhost:8080/urls`)
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id]["longURL"] = req.body.longURL;
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
  const userID = req.cookies["user_id"];
  let templateVars = { urls: filterUrls(userID), user: users[userID], userID: userID };
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

  if (users[req.cookies["user_id"]]) {
    let templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  } else {

    res.redirect(`http://localhost:8080/urls`)
  }


});



app.get("/urls/404", (req, res) => {
  res.render("urls_error");
});

app.get("/urls/:shortURL", (req, res) => {
  //console.log(req.cookies["user_id"])
  //let access = filterUrls(req.cookies["user_id"]);
  //console.log(access);
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], user: users[req.cookies["user_id"]] };
  // if (access === {}) {
  //   res.redirect(`http://localhost:8080/urls/404`)
  // } else {
    res.render("urls_show", templateVars) 
  // }
   
    
  });

app.get("/u/:shortURL", (req, res) => {

  //console.log(req.cookies["user_id"])
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  longURL ? res.redirect(longURL) : res.redirect(`http://localhost:8080/urls/404`)
  



});

app.listen(PORT, () => {
  console.log(`TinyAPP listening on port ${PORT}!`);
});


