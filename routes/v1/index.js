const express = require("express");
const router = express.Router();

const authRouter = require("./auth.route");
const landingPageRouter = require("./landingPage.route");
router.use("/", authRouter);
router.use("/", landingPageRouter);

module.exports = router;
