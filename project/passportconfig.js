var localStrategy   = require("passport-local"),
    User            = require("./models/user.js"),
    crypto          = require("crypto")
    
module.exports = function(passport){
    // Allow passport to serialize and deserlialize from the session
    
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        });
    });
    
    
    /*  local-signup strategy
        Create a new user with the given details, as longas one does not already exist
    */
    passport.use('local-signup', new localStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, username ,password,done){
        process.nextTick(function(){
            // Check that there is not already a user created
            User.findOne({'username': username}, function(err, user){
                if (err) return done(err);
                
                if (user) {
                    return done(null, false);
                } else {
                    // If there is no user already created, create a new one
                    
                    var newUser = new User();
                    
                    newUser.username = username;
                    // Generate Hashed Password
                    newUser.password = newUser.generateHash(password);
                    newUser.authenticationKey = crypto.randomBytes(12).toString("hex");
                    
                    newUser.save(function(err){
                        if (err) throw err;
                        
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
    
    passport.use('local-login', new localStrategy({
        // Define the names of the form inputs
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
        
    },
    function(req, username, password, done){
        User.findOne({ 'username' : username}, function(err, user){
            if (err) return done(err);
            // If there is not a user with this name, fail
            if (!user){
                return done(null, false)
            }
            // If the password is incorrect, fail
            console.log(user.validPassword)
            if (!user.validPassword(password)){
                return done(null, false)
            }
            
            // If there is no issue, pass and continue
            return done(null, user)
        })
    }))
    
};