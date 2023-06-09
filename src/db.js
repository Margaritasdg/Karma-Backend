require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const {
  DB_USER, DB_PASSWORD, DB_HOST,DB_PORT, DB_NAME
} = process.env;

  const sequelize = new Sequelize(`postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
  logging: false, // set to console.log to see the raw SQL queries
  native: false, // lets Sequelize know we can use pg-native for ~30% more speed
}); 
 
const basename = path.basename(__filename);

const modelDefiners = [];

// Leemos todos los archivos de la carpeta Models, los requerimos y agregamos al arreglo modelDefiners
fs.readdirSync(path.join(__dirname, '/models'))
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, '/models', file)));
  });

// Injectamos la conexion (sequelize) a todos los modelos
modelDefiners.forEach(model => model(sequelize));
// Capitalizamos los nombres de los modelos ie: product => Product
let entries = Object.entries(sequelize.models);
let capsEntries = entries.map((entry) => [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]]);
sequelize.models = Object.fromEntries(capsEntries);

// En sequelize.models están todos los modelos importados como propiedades
// Para relacionarlos hacemos un destructuring

const { User, ShoppingCart, Order, CommentsRating,  Product, Laptop, Tablet,Television ,CellPhone, Comment, ProductDiscount} = sequelize.models;

// Aca vendrian las relaciones
User.hasMany(ShoppingCart)
ShoppingCart.belongsTo(User)

Product.hasOne(Laptop, { onDelete: 'CASCADE' })
Laptop.belongsTo(Product, { onDelete: 'CASCADE' })

Product.hasOne(Tablet, { onDelete: 'CASCADE' })
Tablet.belongsTo(Product, { onDelete: 'CASCADE' })

Product.hasOne(CellPhone, { onDelete: 'CASCADE' })
CellPhone.belongsTo(Product, { onDelete: 'CASCADE' })

Product.hasOne(Television, { onDelete: 'CASCADE' })
Television.belongsTo(Product, { onDelete: 'CASCADE' })

User.hasMany(CommentsRating)
CommentsRating.belongsTo(User)

Product.hasMany(ShoppingCart)
ShoppingCart.belongsTo(Product)

Product.hasMany(CommentsRating)
CommentsRating.belongsTo(Product)

User.hasMany(Order)
Order.belongsTo(User)

Order.hasMany(ShoppingCart, { foreignKey: 'OrderId' });
ShoppingCart.belongsTo(Order, { foreignKey: 'OrderId' });

User.hasOne(Comment)
Comment.belongsTo(User)

Product.hasOne(ProductDiscount)
ProductDiscount.belongsTo(Product)

User.belongsToMany(Product,{through:'UserProduct',  timestamps: false } )
Product.belongsToMany(User,{through:'UserProduct',  timestamps: false } )

module.exports = {
  ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
  conn: sequelize,     // para importart la conexión { conn } = require('./db.js');
};




//Order.hasMany(ShoppingCart)
//ShoppingCart.belongsTo(Order)