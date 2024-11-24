import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
    name : {
        type : String,
        default : ""
    },
    name : {
        type : String,
        ref : "category"
    },
},{
    timestamps : true
})

const subCategoryModel = mongoose.model('SubCategory',subCategorySchema)

export default subCategoryModel 