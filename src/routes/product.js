const { Router } = require('express');

const { createProduct, getProducts, getProduct, getProductsByCategory, getProductsByInput, getProductsFromUserShoppingCart, updateProduct, deleteProduct } = require('../controllers/products.controllers.js');

const router = Router();

//GET
router.get("/getProducts", getProducts);
router.get("/getProduct", getProduct);
router.get("/getProductsByCategory", getProductsByCategory)
router.get("/getProductsByInput", getProductsByInput)
router.get("/getProductsFromUserShoppingCart", getProductsFromUserShoppingCart)

//POST
router.post("/createProduct", createProduct);

//PUT
router.put("/updateProduct", updateProduct);

//DELETE
router.delete("/deleteProduct", deleteProduct);

module.exports = router;