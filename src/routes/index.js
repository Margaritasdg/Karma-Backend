const express = require('express');
const homeRoutes = require('./home.js');
const userRoutes = require('./user.js');
const productRoutes = require('./product.js'); 
const categoryRoutes = require('./category.js');
const orderRoutes = require('./order.js');
const shoppingCartRoutes = require ('./shoppingCart.js');
const commentsRaitingRoutes = require ('./commentsRaiting.js');
const laptopRoutes = require('./laptop.js')
const tabletRoutes = require('./tablet.js')
const tvRoutes = require('./tv.js')
const  CellPhoneRoutes  = require('./cellPhone.js');

const app = express();

app.use('/', homeRoutes);
app.use('/user', userRoutes);
app.use('/product', productRoutes);
app.use('/category', categoryRoutes);
app.use('/order', orderRoutes);
app.use('/shoppingCart',shoppingCartRoutes);
app.use('/commentsRaiting',commentsRaitingRoutes);
app.use('/laptop', laptopRoutes);
app.use('/tablet', tabletRoutes);
app.use('/tv',tvRoutes)
app.use('/cellPhone',CellPhoneRoutes);


module.exports = app;