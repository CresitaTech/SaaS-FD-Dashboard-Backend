const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const excelRoute = require('./routes/excelRoutes');
const superRoute = require('./routes/superAdminRoute');

dotenv.config({});

require("./db/db")
require("./db/exceldb");
const app = express();

app.use(cors({
  origin:"*",
  methods: ["GET","DELETE", "POST","PATCH","PUT"], 
  credentials:true
}))

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get('/',async(req,res)=>{
    res.send("Hello inventory backend");
})

//api
app.use('/auth',authRoutes);
app.use('/api',excelRoute);
app.use('/api',superRoute);

const PORT = process.env.PORT
app.listen(PORT,()=>{
    console.log(`server is running at port ${PORT}`)
})