const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://evanshiu:aFCORAABYcoGog8C@cluster0.km0xmbl.mongodb.net/?retryWrites=true&w=majority');
    } catch (err){
        console.log(err)
    }
}

module.exports = connectDB