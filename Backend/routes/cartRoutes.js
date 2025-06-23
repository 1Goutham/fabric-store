const express = require("express");
const {isAuthenticated}=require('../middleware/isAuthenticated');
const {
  addOrUpdateCartItem,
  getUserCart,
  removeCartItem,
  clearCart
} = require("../controller/cartController");

const router = express.Router();

router.post("/add", isAuthenticated,addOrUpdateCartItem);
router.get("/", isAuthenticated,getUserCart);
router.post("/remove", isAuthenticated,removeCartItem);
router.post("/clear", isAuthenticated, clearCart);

module.exports = router;
