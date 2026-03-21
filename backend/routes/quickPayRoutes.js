const express     = require("express");
const router      = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
  getQuickPay,
  addWalletMoney,
  addCard,
  setPrimaryCard,
  removeCard,
  addUPI,
  removeUPI,
  getTransactions,
} = require("../controllers/quickPayController");

router.get ("/",           verifyToken, getQuickPay);
router.post("/wallet/add", verifyToken, addWalletMoney);

router.post  ("/cards",                 verifyToken, addCard);
router.put   ("/cards/:cardId/primary", verifyToken, setPrimaryCard);
router.delete("/cards/:cardId",         verifyToken, removeCard);

router.post  ("/upi", verifyToken, addUPI);
router.delete("/upi/:upiDocId", verifyToken, removeUPI);

router.get("/transactions", verifyToken, getTransactions);

module.exports = router;