const cookieParser = require("cookie-parser");
const express = require("express");
const userRoutes = require('./routes/user-routes');
const courseRoutes = require('./routes/course-routes');
const cors = require('cors');
const errorMiddleware = require('./middlewares/error.middleware')
const dotenv = require('dotenv');

dotenv.config();
const app = express();



app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials:true
}));

// morgan toDO

app.use(cookieParser());

app.use('/ping',(req,res) => {
    res.send("pong");
});

app.use("/api/v1/user",userRoutes);
app.use("/api/v1/courses",courseRoutes);


app.all('*',(req,res) => {
    res.status(404).send("OOPS!! 404 page not found");
});

app.use(errorMiddleware);



// app.get("/home", (request, response) => {
//   // response.send("hi there, welcome to get");
//   response.json({
//     message: "OK get",
//   });
// });

// app.post("/home", (request, response) => {
//   response.json({
//     message: "OK post",
//   });
// //   response.send("hi there, welcome to post");

// });

module.exports = app;