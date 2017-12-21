var express = require("express");
var router  = express.Router();

// When the / route is requested - render the index page.
router.get("/", function(req, res){
    res.render("index");
})

module.exports = router;