    const axios = require("axios")
    const { Order, User, Product, ShoppingCart, ProductDiscount } = require('../../db.js');
    const { removeItemsFromProductStock, ChangeOrderStatus, emptyUserShoppingCart, returnProductsToStock, DeleteOrderById, deleteUserShoppingCart, setPurchaseOrder, stockReserveTimeInterval, cancelTimer } = require('../../utils/functions.js')
    const {  sendConfirmationEmail } = require('../../utils/emailer.js')


    const { HOST_BACK, HOST_FRONT, PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_API } = process.env

    const createOrderPaypal = async (req, res ) =>{

      const { userId, orderId } = req.body

      await ChangeOrderStatus(orderId, "Procesando Orden")
      await removeItemsFromProductStock(orderId)
      await stockReserveTimeInterval(1, orderId)

      let itemsConvertProperties = []
      let orderTotalValue = 0
      const user = await User.findByPk(userId, { include:{model: Order, include: ShoppingCart } })
      const userOrder = await user.Orders.find(order => order.id === orderId)

      if(!user){
        return res.status(400).send(`El usuario con la id ${userId} no existe`)
      }if(!userOrder || userOrder.length === 0){
        return res.status(400).send(`No se encontro ninguna orden con la id ${orderId}`)
      }else{
        const order = await Order.findByPk(orderId)
        if(!order){
          return res.status(404).send("La orden no se encontro en la base de datos")
        }else{
          try {

            itemsConvertProperties = await Promise.all(userOrder.ShoppingCarts.map( async (shopCart) => {
              const productInShoppingCart = await Product.findByPk(shopCart.ProductId, {include: {model: ProductDiscount}})
              const price = productInShoppingCart.price
              const productQuantity = shopCart.dataValues.amount
              
              if(productInShoppingCart.ProductDiscount !== null){
                const discountVal = productInShoppingCart.ProductDiscount.discountValue
                const discount = (price * discountVal) / 100

                const priceWithDiscount = price - discount

                orderTotalValue = orderTotalValue + (priceWithDiscount * productQuantity)
                return {
                  id: productInShoppingCart.id,
                  name: `${productInShoppingCart.brand} ${productInShoppingCart.model}`,
                  category_id: productInShoppingCart.constructor.name,
                  quantity: productQuantity,
                  unit_amount: {
                   currency_code: 'USD',
                   value: priceWithDiscount,
                 },
                 discount: {
                  currency_code: "USD",
                  value: discountVal
                }
               }
               
              }else{
                orderTotalValue = orderTotalValue + (price * productQuantity)

                return {
                   id: productInShoppingCart.id,
                   name: `${productInShoppingCart.brand} ${productInShoppingCart.model}`,
                   category_id: productInShoppingCart.constructor.name,
                   quantity: shopCart.dataValues.amount,
                   unit_amount: {
                    currency_code: 'USD',
                    value: productInShoppingCart.price,
                  },
                }
              }
  
            }))

            const paypalOrder = {
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: orderTotalValue,
                    breakdown: {
                      item_total: {
                        currency_code: 'USD',
                        value: orderTotalValue
                      },
                      discount: {
                        currency_code: 'USD',
                        value: 0 
                      }
                  }
                  },
                  items: itemsConvertProperties
                },
              ],
              application_context: {
                brand_name: `${HOST_FRONT}`,
                landing_page: "NO_PREFERENCE",
                user_action: "PAY_NOW",
                return_url: `${HOST_BACK}/payments/captureOrderPaypal?orderId=${orderId}`,
                cancel_url: `${HOST_BACK}/payments/cancelOrderPaypal?orderId=${orderId}`,
              },
            }
              const params = new URLSearchParams();
              params.append("grant_type", "client_credentials")
          
              const { data: { access_token },} = await axios.post(
                `${PAYPAL_API}/v1/oauth2/token`,
                params,
                {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  auth: {
                    username: PAYPAL_CLIENT_ID,
                    password: PAYPAL_SECRET,
                  },
                }
              );

              //Enviar la orden
              const response = await axios.post(
                `${PAYPAL_API}/v2/checkout/orders`,
                paypalOrder,
                {
                  headers: {
                    Authorization: `Bearer ${access_token}`,
                  },
                }
              );

              return res.json(response.data.links[1])
    
          } catch (error) {
            console.log(error)
            return res.status(400).json({message: error.message})
          } 
        }
      }
    }

    const captureOrderPaypal = async (req, res ) =>{
      const order = await Order.findOne({ 
        where: { orderStatus: 'Procesando Orden'},
        include:[{ model: User }]
      });
      const { token, orderId } = req.query

      if(!token ){

        return res.status(400).send("Parametros por query faltantes o incorrectos")

      }else{

        try {

          const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders/${token}/capture`,
            {},
            {
              auth: {
                username: PAYPAL_CLIENT_ID,
                password: PAYPAL_SECRET,
              },
            }
          )
          if(response.data.status === 'COMPLETED'){
  
            await cancelTimer(orderId)
            const email = order.User.email;
            await sendConfirmationEmail({ email });
            await ChangeOrderStatus(orderId, "Orden Pagada")
            await setPurchaseOrder(orderId)
            await deleteUserShoppingCart(orderId)

            return res.redirect(`${HOST_FRONT}/profile/orders`)
            
          }else{
            return res.status(400).send(`PAGO PENDIENTE`)
          }
        } catch (error) {
          return res.status(500).json({message: error.message})
        }
      }

    };
     
    const cancelOrderPaypal = async (req, res ) =>{
 
      try {
        const { orderId } = req.query
        
        await cancelTimer(orderId)
        await ChangeOrderStatus(orderId, "Orden Rechazada")
        await returnProductsToStock(orderId)
        await DeleteOrderById( orderId )

        return res.redirect(`${HOST_FRONT}/profile/orders`)

      } catch (error) {
        return res.status(500).json({message: error.message})
      }
      
    }

module.exports = {
    createOrderPaypal,
    captureOrderPaypal,
    cancelOrderPaypal
  }