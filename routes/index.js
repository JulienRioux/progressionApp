let express = require("express");
let router  = express.Router();

// GET Homepage
router.get("/", (req, res)=>{
    res.render("index");
});


module.exports = router;
