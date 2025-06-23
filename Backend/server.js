const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path =require('path');
const cookieParser = require('cookie-parser');
const productsRoutes=require('./routes/productsRoutes');
const UserRoutes=require('./routes/userRoutes');
const cartRoutes=require('./routes/cartRoutes');
const orderRoutes=require('./routes/orderRoute');
const paymentRoutes=require('./routes/paymentRoutes');
const middleware=require('./middleware/errorHandler');

dotenv.config({ path: './config/config.env' });
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/products', productsRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/cart',cartRoutes );
app.use('/api/payment',paymentRoutes );
app.use('/api/order',orderRoutes );
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.get('/', (req, res) => {
  res.send('API is running...');
});

mongoose.connect(process.env.DB_URL).then(()=>console.log('MongoDB is connected')).catch((err)=>console.log(err));

 
const PORT=process.env.PORT
app.use(middleware);
 
app.listen(PORT,()=>{
    console.log(`server is running on ${PORT}`)
})

