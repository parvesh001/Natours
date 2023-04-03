const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    tour:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Tour',
        required:[true,'Booking must has tour']
    },
    startDate:{
       type:Date,
       required:[true,'Booking must has date']
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true,'Booking must has user']
    },
    price:{
        type:String,
        required:[true,'Booking must has price']
    }
}, {timestamps:true})

module.exports = mongoose.model('Booking', bookingSchema)