var express = require("express");
var multer  = require("multer");
var upload  = multer();
var router  = express.Router();
var cookieParser = require("cookie-parser")
var User    = require("../models/user.js");


// When the / route is requested - render the index page.
router.get("/", function(req, res){
    res.redirect("/chat")
    
})

router.get("/chat", function(req, res){
    // If cookie has been set
    // Allow access
    res.render("index")
})

router.get("/login", function(req, res){
    User.find({}, function(err, users){
        if(err){return console.log(err)}
    
        
        res.render('login', {users: users})
    })
    

})

router.post("/login", upload.array() ,function(req, res, next){
    User.findById(req.body.id, function(err, data){
        if(err){ return console.log(err) }
        res.cookie('userName', data.username)
        res.cookie('authKey', data.authenticationKey)
        res.cookie('userID', data.id)
        res.redirect("/login")
    })
    
    // If userID supplied in req corresponds with an already create userID
    // Set the authentication cookie and redirect to the /chat route
    
    
});

router.post("/signup", function(req, res){
    res.send("Signup post route logic goes here")
    // create a new user with the username supplied
    // redirect to /login
})

router.get("/logout", function(req, res){
    //unset the cookies and redirect to the login page
    
    res.clearCookie("authKey")
    res.clearCookie("userName")
    res.clearCookie("userID")
    res.redirect("/login")
})

module.exports = router;