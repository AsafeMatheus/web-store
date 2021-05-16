const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const lodash = require('lodash')
const ejs = require('ejs')

function findProductAndRenderPage(page, res){
    Products.find((err, allProducts) => {
        if (err){
            console.log(err)
        } else{
            Orders.find((err, allOrders) => {
                if (err){
                    console.log(err)
                } else{
                    res.render(page, {allProducts: allProducts, allOrders: allOrders})
                }
            })    
        }
    })
}

app = express()

app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended: true}))

app.set('view engine', 'ejs')

mongoose.connect('mongodb://localhost:27017/webstoreDB', {useNewUrlParser: true})

const productsSchema = new mongoose.Schema({
    name: String,
    price: Number,
    stock: Number,
    description: String,
    image: String,
    reviews: [
        {
            reviewTitle: String,
            reviewBody: String
        }
    ]
})
const orderSchema = new mongoose.Schema({
    email: String,
    money: Number,
    city: String,
    street: String,
    houseNumber: Number,
    amount: Number,
    date: String
})

const Products = new mongoose.model('product', productsSchema)
const Orders = new mongoose.model('order', orderSchema)

app.get('/', (req, res) => {
    Products.find((err, allProducts) => {
        if (err){
            console.log(err)
        } else{
            res.render('home', {
                allProducts: allProducts
            })
        }
    })
})

app.get('/admin', (req, res) => {
    return res.render('login-admin')
})

app.get('/products/:product', (req, res) => {
    const requiredProduct = lodash.lowerCase(req.params.product)
    
    Products.find((err, allProducts) => {
        if (err){
            console.log(err)
        } else{
            allProducts.forEach((content) => {
                if (lodash.lowerCase(content.name) == requiredProduct){
                    res.render('product', {product: content})
                }
            })
        }
    })
})

app.post('/admin', (req, res) => {
    const userAdmin = req.body.userAdmin
    const passwordAdmin = req.body.passwordAdmin

    if(passwordAdmin == '663700as' && userAdmin == '454f3'){
        Products.find((err, allProducts) => {
            if (err){
                console.log(err)
            } else {
                Orders.find((err, allOrders) => {
                    if (err){
                        console.log(err)
                    } else{
                        res.render('admin-page', {
                            allProducts: allProducts,
                            allOrders: allOrders
                        })
                    }
                })
            }
        })
    } else{
        return res.redirect('/admin')
    }   
})

app.post('/delete', (req, res) => {
    const itemToDelete = req.body.itemToDelete

    console.log(req.body)

    Products.findByIdAndDelete(itemToDelete, (err) => {
        if (err){
            console.log(err)
        } else{
            console.log('item deleted')
            return findProductAndRenderPage('admin-page', res)
        }
    })
})

app.post('/compose', (req, res) => {
    const newProduct = new Products({
        name: req.body.newProductName,
        price: req.body.newProductPrice,
        stock: req.body.newProductStock,
        description: req.body.newProductDescription,
        image: req.body.newProductImage
    })

    newProduct.save()
    
    setTimeout(() => {
        findProductAndRenderPage('admin-page', res)
    }, 1000)
})

app.post('/review', (req, res) => {
    const reviewPost = {
        reviewTitle: req.body.postTitle,
        reviewBody: req.body.postContent,
        productId: req.body.productId
    }

    Products.updateOne({_id: reviewPost.productId}, { $push: { reviews: {
        reviewTitle: reviewPost.reviewTitle,
        reviewBody: reviewPost.reviewBody
    }} }, (err) => {
        if (err){
            console.log(err)
        }
    })

    res.redirect('localhost:3000/' + req.url)
})

app.post('/order', (req, res) => { 
    Products.find({_id: req.body.whatProduct}, (err, productData) => {
        if (err){
            console.log(err)
        } else{
            const today = new Date()
            const day = today.getDate()
            const year = today.getFullYear()
            const month = today.getMonth() + 1

            const completeDate = `${day}/${month}/${year}`

            const productStock = Number((productData[0].stock))
            const productPrice = Number((productData[0].price))

            const orderStock = Number(req.body.orderStock)

            // Asafe u no longer have newOrder

            if (productStock < orderStock || orderStock <= 0){
                console.log('fail')
                res.redirect('localhost:3000/' + req.url)
            } else{
                const newOrder = new Orders({
                    email: req.body.orderEmail,
                    money: Number(req.body.orderStock) * productPrice,
                    city: req.body.orderCity,
                    street: req.body.orderStreet,
                    houseNumber: req.body.orderNumber,
                    amount: orderStock,
                    date: completeDate
                })
            
                newOrder.save()
                
                setTimeout(() => {
                    res.redirect('localhost:3000/' + req.url)
                }, 1000)
            }
        }
    })
})

app.post('/delete-order', (req, res) => {
    const orderToDelete = req.body.orderToDelete

    Orders.findByIdAndDelete(orderToDelete, (err) => {
        if (err){
            console.log(err)
        } else{
            console.log('item deleted')

            Products.find((err, allProducts) => {
                if (err){
                    console.log(err)
                } else {
                    Orders.find((err, allOrders) => {
                        if (err){
                            console.log(err)
                        } else{
                            res.render('admin-page', {
                                allProducts: allProducts,
                                allOrders: allOrders
                            })
                        }
                    })
                }
            })
        }
    })
})

app.listen(3000, () => {
    console.log("server is running on port 3000")
})