const express = require("express");
const router  = express.Router();

// GET Progression
router.get("/", (req, res)=>{
    res.render("progression");
});


module.exports = router;
