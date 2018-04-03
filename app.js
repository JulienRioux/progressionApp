const express = require("express"),
      path = require("path"),
      cookieParser = require("cookie-parser"),
      bodyParser = require("body-parser"),
      ejs = require("ejs"),
      expressValidator = require("express-validator"),
      flash = require("connect-flash"),
      session = require("express-session"),
      passport = require("passport"),
      LocalStrategy = require("passport-local").Strategy,
      mongo = require("mongodb"),
      mongoose = require("mongoose"),
      methodOverride = require("method-override");

// // Adding some middlewares
// let middleware = require("../middlewares");

// Init the app
const app = express();

// Init the DB
mongoose.connect("mongodb://localhost/progressapp");
var db = mongoose.connection;

// Set the View Engine
app.set("views", path.join(__dirname, "views"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// BodyParser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, "public")));

// middleware for express SESSION
app.use(session({
    secret: "Yetitherunningandwildcat",
    saveUninitialized: true,
    resave: true
}));

// PASSPORT init
app.use(passport.initialize());
app.use(passport.session());

// middleware for the Express-validator
app.use(expressValidator({
  errorFormatter: (param, msg, value) => {
      var   namespace = param.split('.'),
            root      = namespace.shift(),
            formParam = root;

    while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
    }
    return {
        param : formParam,
        msg   : msg,
        value : value
    };
  }
}));

// connect flash middleware
app.use(flash());

// Globals Variables for flash
app.use((req, res, next)=>{
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    res.locals.errors = req.flash("errors");
    // if there is a user logged in, return the user, else return null
    res.locals.user = req.user || null;
    next();
});


// Setup the routes
let index = require("./routes/index");
let users = require("./routes/users");
let categories = require("./routes/categories");
let exercices = require("./routes/exercices");


// Middleware for routes files
app.use("/", index);
app.use("/users", users);
app.use("/categories", categories);
app.use("/exercices", exercices);


// set the port
app.set("port", (process.env.PORT || 3000));

app.listen(app.get("port"), ()=>{
    console.log("Serving on port " + app.get("port"));
});
