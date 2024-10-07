const express = require('express');
const app = express();
const path = require('path');
const body= require('body-parser')
//const adminRouter=require('./routes/admin/admin');
const adminRouter = require('./routes/admin/admin')
const dotenv=require('dotenv');
const mongoose=require('mongoose')
dotenv.config()
app.use(express.urlencoded({extended:true}));
app.use(express.json())
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Middleware to serve static files (like CSS, images)
app.use(express.static(path.join(__dirname, 'public')))
mongoose.connect('mongodb://localhost:27017/userDB').then(()=>{
  console.log('connected to mongoDb')
}).catch(err=>{
  console.log('error connected to mongodb',err)
})





app.get('/admin/customers', (req, res) => {
  const customers = [
    { firstName: 'Vishnu', lastName: 'V S', email: 'vr@gmail.com', phone: '276538924', address: 'Rose villa', isBlocked: false },
    { firstName: 'Jhon', lastName: 'Rust', email: 'rr@gmail.com', phone: '276538914', address: 'Bekon Street', isBlocked: true },
    { firstName: 'Peter', lastName: 'Parker', email: 'yr@gmail.com', phone: '276538984', address: 'Bangalore', isBlocked: false }
  ];
res.render('admin/adminCustomer',{customers})

});

  // Render the customers view with title and customers array
  // res.render('admin/adminCustomer', { 
  //   customers, 
  //   title: 'Customers',
  //   body: '<%- body %>' // Pass the body to layout
  

app.use('/admin',adminRouter)
 
const port = process.env.PORT
app.listen(3000, () => {
  console.log(`server is running on http://localhost:${port}`);
});
