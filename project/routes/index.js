var express         = require("express"),
    multer          = require("multer"),
    upload          = multer(), 
    cookieParser    = require("cookie-parser"),
    User            = require("../models/user.js"),
    crypto          = require("crypto");

module.exports = function(app, passport){
    

// When the / route is requested - render the index page.
app.get("/", function(req, res){
    res.redirect("/chat");
    
});
/*  When the chat route is requested - render the chat page.
    Only allow access if the user is logged in
    The authentication is handled in the view's logic */
app.get("/chat", isLoggedIn ,function(req, res){
    res.render("index")
});

/*  When the /login route is requested, 
    send all users to the login page
*/
app.get("/login", function(req, res){
    User.find({}, function(err, users){
        if(err){return console.log(err)}
    
        
        res.render('login', {users: users});
    });
    

});
/*
    When the /login route is POST requested
    Run the 'local-login' strategy
*/
app.post("/login", upload.array(), passport.authenticate('local-login', {
    successRedirect: "/authorise",
    failureRedirect: "/login"
}))

/* 
    When the /signup route is POST requested
    Run the 'local-signup' strategy
*/
app.post("/signup", upload.array() , passport.authenticate('local-signup', {
    successRedirect: "/authorise",
    failureRedirect: "/login"
}))

app.get("/authorise", function(req, res, next){
    // Route to allow the cookies to be set
    res.cookie('userName', req.user.username);
    res.cookie('authKey', req.user.authenticationKey);
    res.cookie('userID', req.user.id);
    res.redirect("/chat")
})


app.get("/logout", function(req, res){
    // Unauthenticate the user, clear the cookies and redirect to the login page
    req.logout()
    res.clearCookie("authKey");
    res.clearCookie("userName");
    res.clearCookie("userID");
    res.redirect("/login");
});

};
// Middleware function to check if the user is currently authenticated
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

