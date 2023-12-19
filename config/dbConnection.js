const mongoose = require("mongoose");

const dotenv = require("dotenv")
dotenv.config();

mongoose.set('strictQuery',false);

const connectToDB = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.MONGODB_URL);

        if(connection){
            console.log(`Connection to MongoDB : ${connection.host}`);
        }
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = connectToDB;