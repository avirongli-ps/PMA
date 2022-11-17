const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
   title : String,
   ISBN : String,
   stock : Number,
   author : String,
   description : String,
   category : String, 
   comments : [{
       type : mongoose.Schema.Types.ObjectId,
       ref : "Comment",
    }],
});

module.exports =  mongoose.model("Project", projectSchema);