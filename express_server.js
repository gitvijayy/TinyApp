var express = require("express");
var cookieSession = require('cookie-session');
var app = express();
var PORT = 8080; // default port 8080
var bodyParser = require("body-parser");
var bcrypt = require('bcrypt');
var moment = require('moment')
var methodOverride = require('method-override')

// override with the X-HTTP-Method-Override header in the request
app.use(methodOverride('_method'))

app.use(cookieSession({
  name: 'session',
  keys: ['abc', 'cde', 'efg', 'hij']
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const urlDatabase = {};
const visitorsData = {};
const users = {};
const helperfunctions = {

  generateRandomString: () => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "1234567890"
    let randomString = "";
    for (let i = 0; i < 3; i++) {
      randomString += letters.charAt(Math.floor(Math.random() * 26));
      randomString += numbers.charAt(Math.floor(Math.random() * 10));
    }
    return randomString;
  },
  // to check if a email has been registerd already
  emaillookup: (email) => {
    if (email) {
      for (const key in users) {
        if (email === users[key].email) {
          return users[key];
        }
      }
    }
    return "Not Found";
  },

  filterUrls: (user) => {
    let data = {};
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
  },
  // SOURCE StackOverFlow - Checks if a URL is valid or not
  validURL: (str) => {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
  }

};

app.post("/urls", (req, res) => {

  if (helperfunctions.validURL(req.body.longURL)) {

    const randomString = helperfunctions.generateRandomString();
    urlDatabase[randomString] = { longURL: req.body.longURL, userID: req.session.user_id, visits: 0, uniqueVisitors: [] };
    visitorsData[randomString] = [];
    res.redirect("/urls/" + randomString);

  } else {

    let templateVars = { user: users[req.session.user_id], error: "y" };
    res.render("urls_new", templateVars);

  }

});

app.post("/login", function (req, res) {

  let error = "n";

  let user = helperfunctions.emaillookup(req.body.email);
  if (user["password"]) {
    var passwordChecker = bcrypt.compareSync(req.body.password, user["password"]);
  }
  if (req.body.email && req.body.password && user !== "Not Found" && passwordChecker) {
    req.session.user_id = user["id"];
    req.session.visitorID = user["id"];
    res.redirect(`/urls`)
  } else {
    if (!req.body.password || !req.body.email) {
      error = `404: Both fields are required`
    } else {
      error = "404: Email or Password wrong"
    } 
    let templateVars = { type: "login", user: users[req.session.user_id], error: error };
    res.render("urls_register", templateVars);
  }

});

app.post("/register", function (req, res) {

  if (req.body.email && req.body.password && helperfunctions.emaillookup(req.body.email) === "Not Found") {
    const uniqueId = helperfunctions.generateRandomString();
    users[uniqueId] = {
      id: uniqueId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = uniqueId;
    res.redirect(`/urls`)
  } else {
    let error = "";
    if (!req.body.password || !req.body.email) {
      error = `400: Both fields are required`
    } else {
      error = `400: Email is already registered`
    }
    let templateVars = { type: "register", user: users[req.session.user_id], error: error };
    res.render("urls_register", templateVars);
  }

});

app.post("/logout", function (req, res) {
  req.session = null;
  res.redirect(`/urls`)
});

app.delete("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL
  let cookie = req.session.user_id;
// to change //////// can be shortercd 
  if (Object.keys(helperfunctions.filterUrls(cookie)).includes(shortURL)) {
    delete urlDatabase[req.params.shortURL];

    res.redirect(`/urls`)
  } else {
    res.send("401: You are not authorized to access this page!!")
  }

});
//// needs to be prtected can be accesed from curl

app.put("/urls/:id", (req, res) => {

  if (!helperfunctions.validURL(req.body.longURL)) {
    res.redirect("/urls/" + req.params.id)
  } else if (req.session.user_id) {
    urlDatabase[req.params.id]["longURL"] = req.body.longURL;
    res.redirect(`/urls`)
  } else {
    res.redirect("/urls/404")
  }
});

app.get("/register", (req, res) => {
  if (!users[req.session.user_id]) {
    let templateVars = { type: "register", user: users[req.session.user_id], error: "n" };
    res.render("urls_register", templateVars);
  } else {
    res.redirect(`/urls`)
  }

});

app.get("/login", (req, res) => {

  if (!users[req.session.user_id]) {
    let templateVars = { type: "login", user: users[req.session.user_id], error: "n" };
    res.render("urls_register", templateVars);
  } else {
    res.redirect(`/urls`)
  }

});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id
  let templateVars = { urls: helperfunctions.filterUrls(userID), user: users[userID], userID: userID };
  res.render("urls_index", templateVars);
});

app.get("/:urls", (req, res) => {
  res.redirect("/urls/404")
});

app.get("/", (req, res) => {
  req.session.user_id ? res.redirect(`/urls`) : res.redirect(`/login`)
});

app.get("/urls/new", (req, res) => {

  if (users[req.session.user_id]) {
    //error value for displaying appropriate template based on usesrs login status
    let templateVars = { user: users[req.session.user_id], error: "n" };
    res.render("urls_new", templateVars);
  } else {
    res.redirect(`/login`)
  }

});

app.get("/urls/404", (req, res) => {
  res.render("urls_error");
});

app.get("/urls/:shortURL", (req, res) => {

  let shortURL = req.params.shortURL
  let cookie = req.session.user_id
  if (urlDatabase[shortURL]) {
    let templateVars = {
      shortURL: shortURL,
      longURL: urlDatabase[shortURL]["longURL"],
      user: users[cookie],
      visitors: visitorsData[shortURL],
      visits: urlDatabase[shortURL]["visits"],
      uniqueVisits: urlDatabase[shortURL]["uniqueVisitors"].length
    };
    //to check if the shorturl belongs to the logged in user
    templateVars.show = Object.keys(helperfunctions.filterUrls(cookie)).includes(shortURL);
    res.render("urls_show", templateVars)
  } else {
    res.redirect(`/urls/404`)
  }

});

app.get("/u/:shortURL", (req, res) => {

  if (!urlDatabase[req.params.shortURL]) {
    res.redirect(`/urls/404`);
  }

  if (!req.session.visitorID) {
    req.session.visitorID = helperfunctions.generateRandomString();
  }

  if (!urlDatabase[req.params.shortURL]["uniqueVisitors"].includes(req.session.visitorID)) {
    urlDatabase[req.params.shortURL]["uniqueVisitors"].push(req.session.visitorID);
  }

  if (urlDatabase[req.params.shortURL]) {
    urlDatabase[req.params.shortURL]["visits"] += 1;
    visitorsData[req.params.shortURL].push({
      timeStamp: moment().format('MMMM Do YYYY, hh:mm:ss a'),
      userID: req.session.visitorID,
      visits: urlDatabase[req.params.shortURL]["visits"],
      uniqueVisits: urlDatabase[req.params.shortURL]["uniqueVisitors"].length
    });
    res.redirect(urlDatabase[req.params.shortURL]["longURL"])
  } else {
    res.redirect(`/urls/404`)
  }

});

app.listen(PORT, () => {
  console.log(`TinyAPP listening on port ${PORT}!`);
});