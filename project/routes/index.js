var express         = require("express"),
    multer          = require("multer"),
    upload          = multer(),
    router          = express.Router(),
    cookieParser    = require("cookie-parser"),
    User            = require("../models/user.js"),
    crypto          = require("crypto");


// When the / route is requested - render the index page.
router.get("/", function(req, res){
    res.redirect("/chat");
    
});
/*  When the chat route is requested - render the chat page.
    The authentication is handled in the view's logic */
router.get("/chat", function(req, res){
    res.render("index")
});

/*  When the /login route is requested, 
    send all users to the login page
*/
router.get("/login", function(req, res){
    User.find({}, function(err, users){
        if(err){return console.log(err)}
    
        
        res.render('login', {users: users});
    });
    

});
/*
    When the /login route is POST requested
    login the user
*/
router.post("/login", upload.array() ,function(req, res, next){
    User.findById(req.body.id, function(err, data){
        if(err){ return console.log(err) }
        res.cookie('userName', data.username);
        res.cookie('authKey', data.authenticationKey);
        res.cookie('userID', data.id);
        res.redirect("/chat");
    });
    // If userID supplied in req corresponds with an already create userID
    // Set the authentication cookie and redirect to the /chat route
    
    
});

/* 
    When the /signup route is POST requested
    create a new user with the data passed to the request
*/
router.post("/signup", upload.array() ,function(req, res, next){
    var newUser = new User({
        username: req.body.username,
        authenticationKey: crypto.randomBytes(12).toString("hex")
    });
    
    newUser.save(function(err, data){
        if(err) {return console.log(data)}
    });
    
    res.redirect("/login");
    // If userID supplied in req corresponds with an already create userID
    // Set the authentication cookie and redirect to the /chat route
    
    
});

/* 
    When the logout route is requested, 
    remove all cookies from the user and redirect to the login route
*/
router.get("/logout", function(req, res){
    //unset the cookies and redirect to the login page
    
    res.clearCookie("authKey");
    res.clearCookie("userName");
    res.clearCookie("userID");
    res.redirect("/login");
});


module.exports = router; // Export the routes file to the main file(server.js)