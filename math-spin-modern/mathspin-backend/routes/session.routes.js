const express = require("express")
const router = express.Router()
const sessionController = require("../controllers/session.controller")

router.post("/save-session", sessionController.saveSession)
router.get("/sessions/:userId", sessionController.getSessionsByUser)

module.exports = router
