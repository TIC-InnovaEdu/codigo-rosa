const express = require("express")
const router = express.Router()
const gameController = require("../controllers/game.controller")

router.post("/save-session", gameController.saveSession)
router.get("/sessions/:userId", gameController.getSessionsByUser)

module.exports = router
