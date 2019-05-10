var express = require("express");
var cookieSession = require('cookie-session');
var app = express();
var PORT = 8080; // default port 8080
//var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

//app.use(cookieParser())
app.use(cookieSession({
  name: 'session',
  keys: ['abc', 'cde', 'efg', 'hij']
}))
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs")


const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW", visits: 0, uniqueVisitors:[]  },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW", visits: 0, uniqueVisitors: [] }
};

const visitorsData = {};



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
  let data = {};
  //console.log(user)
  for (let key in urlDatabase) {
    if (urlDatabase[key]["userID"] === user) {
      data[key] = {
        longURL: urlDatabase[key]["longURL"],
        visits: urlDatabase[key]["visits"],
        uniqueVisits: urlDatabase[key]["uniqueVisitors"].length
      }

    }

  }
  return data;
}

app.post("/urls", (req, res) => {

  const randomString = generateRandomString();
  urlDatabase[randomString] = { longURL: req.body.longURL, userID: req.session.user_id, visits: 0,uniqueVisitors: [] };
  visitorsData[randomString] = [];
  // urlDatabase[randomString]["longURL"]=req.body.longURL;
  // urlDatabase[randomString]["userID"]=req.session.user_id;//req.cookies["user_id"];
  res.redirect("/urls/" + randomString);

});

app.post("/login", function (req, res) {

  let error = "n";
  let user = emaillookup(req.body.email);
  if (user["password"]) {
    var passwordChecker = bcrypt.compareSync(req.body.password, user["password"]);
  }

  if (req.body.email && req.body.password && user !== "Not Found" && passwordChecker) {
    req.session.user_id = user["id"];
    
     
    //console.log(req.session.user_id,req.session);
    //res.cookie("user_id", user["id"])
    res.redirect(`/urls`)
  }
  else {
    if (!req.body.password || !req.body.email) {
      error = "Status Code:400 // Both fields are required"
    } else if (user === "Not Found") {
      error = "Status Code:403 // Email id doesnt exist"
    } else {
      error = "Status Code:403 // Password is wrong"
    }

    let templateVars = { type: "login", user: users[req.session.user_id/*req.cookies["user_id"]*/], error: error };

    res.render("urls_register", templateVars);
  }
});

app.post("/register", function (req, res) {

  if (req.body.email && req.body.password && emaillookup(req.body.email) === "Not Found") {
    const uniqueId = generateRandomString();
    users[uniqueId] = {
      id: uniqueId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    // users[uniqueId]["id"] = uniqueId;
    // users[uniqueId]["email"] = req.body.email


    // const password = req.body.password; // found in the req.params object
    //  //const hashedPassword = bcrypt.hashSync(password, 10);
    //  users[uniqueId]["password"] = bcrypt.hashSync(password, 10);


    req.session.user_id = uniqueId;
    //res.cookie("user_id", uniqueId);
    res.redirect(`/urls`)
  } else {
    let error = "";
    if (!req.body.password || !req.body.email) {
      error = "Status Code:400 // Both fields are required"
    } else {
      error = "Status Code:400 // Email is already registered"
    }
    //let templateVars = { type: "register", user: users[req.cookies["user_id"]], error: error };
    let templateVars = { type: "register", user: users[req.session.user_id], error: error };
    res.render("urls_register", templateVars);
  }

});

app.post("/logout", function (req, res) {
  //res.clearCookie("user_id");
  req.session = null;
  res.redirect(`/urls`)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL
  let cookie = req.session.user_id;//req.cookies["user_id"]

  //let templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]["longURL"], user: users[cookie]};
  //console.log("in")
  if (Object.keys(filterUrls(cookie)).includes(shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls`)
  } else {
    res.send("you dont have access!!")
  }


});

app.post("/urls/:id", (req, res) => {

  urlDatabase[req.params.id]["longURL"] = req.body.longURL;
  res.redirect(`/urls`)
});

app.get("/register", (req, res) => {
  if (!users[req.session.user_id]) {
    let templateVars = { type: "register", user: users[req.session.user_id/*req.cookies["user_id"]*/], error: "n" };
    res.render("urls_register", templateVars);
  } else {
    res.redirect(`/urls`)
  }

});

app.get("/login", (req, res) => {
  if (!users[req.session.user_id]) {
    let templateVars = { type: "login", user: users[req.session.user_id/*req.cookies["user_id"]*/], error: "n" };
    res.render("urls_register", templateVars);
  } else {
    res.redirect(`/urls`)
  }

});



app.get("/urls", (req, res) => {
  const userID = req.session.user_id//req.cookies["user_id"];
  let templateVars = { urls: filterUrls(userID), user: users[userID], userID: userID };
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  req.session.user_id ? res.redirect(`/urls`) : res.redirect(`/login`)

  //res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {

  if (users[req.session.user_id/*req.cookies["user_id"]*/]) {
    let templateVars = { user: users[req.session.user_id/*req.cookies["user_id"]*/] };
    res.render("urls_new", templateVars);
  } else {

    res.redirect(`/login`)
  }


});



app.get("/urls/404", (req, res) => {
  res.render("urls_error");
});

app.get("/urls/:shortURL", (req, res) => {
  //console.log(req.cookies["user_id"])
  //let access = filterUrls(req.cookies["user_id"]);
  //console.log(access);
  let shortURL = req.params.shortURL
  let cookie = req.session.user_id//req.cookies["user_id"]

  if (urlDatabase[shortURL]) {


    let templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]["longURL"], user: users[cookie], visitors: visitorsData[shortURL] };

    templateVars.show = Object.keys(filterUrls(cookie)).includes(shortURL);
    //console.log(Object.keys(filterUrls(cookie)).includes(shortURL))
    // if (access === {}) {
    //   res.redirect(`/urls/404`)
    // } else {
    res.render("urls_show", templateVars)
    // }
  } else {
    res.redirect(`/urls/404`)

  }



});

app.get("/u/:shortURL", (req, res) => {

  //console.log(req.cookies["user_id"])

  //const longURL = urlDatabase[req.params.shortURL]["longURL"];

  if (!urlDatabase[req.params.shortURL]["uniqueVisitors"].includes(req.session.user_id)) {
    urlDatabase[req.params.shortURL]["uniqueVisitors"].push(req.session.user_id);
  }

  if (urlDatabase[req.params.shortURL]) {

    
    urlDatabase[req.params.shortURL]["visits"] += 1;
    
    visitorsData[req.params.shortURL].push({timeStamp: Date(), userID: req.session.user_id});
    res.redirect(urlDatabase[req.params.shortURL]["longURL"])

  } else {
    res.redirect(`/urls/404`)
  }




});

app.listen(PORT, () => {
  console.log(`TinyAPP listening on port ${PORT}!`);
});


