import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Category} from "../models/Category.js"

const  createCategory = asyncHandler(async (req , res) =>{
     const {name , description} = req.body;
      console.log("req.body ",req.body)
     if([name , description].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required")
     }

     const categoryDetails = await Category.create({
        name:name,
        description:description
     })
     console.log("categoryDetails : ",categoryDetails)

     return res
     .status(200)
     .json(
        new ApiResponse(201,null,"Category created successfully")
     )
})

const getAllCategory = asyncHandler(async(req , res)=>{
    const allCategories = await Category.find({} , {name:true , description:true})
     console.log("all categories; ",allCategories)
    res.status(200)
    .json(
        new ApiResponse(201, allCategories, "All category returnd successfully")
    )
})

const categoryPageDetails = asyncHandler(async(req ,  res)=>{
          // get category id 
          const {categoryId} = req.body;
          //get courses for specific categoryid
          const selectedCategory = await Category.findById(categoryId)
                                                         .populate({
                                                            path :"courses",
                                                            match:{status:"Published"},
                                                            populate:"ratingAndReviews"
                                                         }).exec()

                                                                            
          //validations
          if(!selectedCategory){
            return res
            .status(404)
            .json(
              new response(404, null, "selected category not found")
            )
          }
          // Handle the case when there are no courses
          if(selectedCategory.courses.length === 0){
            console.log("no course found for the selected category")
            throw new ApiError(404,"no course found for the selected category")
          }
          // get courses for differrent categories
         
          const categoriesExcepSelected = await Category.find({
            _id:{$ne:categoryId},
          })

          let differentCategory = await Category.findOne(
              categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
          ._id
          ).populate({
          path: "courses",
          match: { status: "Published" },
        })
        .exec()
   console.log("Diiferent category _> ",differentCategory)

     // Get top-selling courses across all categories

       const allCategories = await Category.find()
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec()

         const allCourses = allCategories.flatMap((category) => category.courses)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
        console.log("mostSellingCourses COURSE", mostSellingCourses)










     

       return res
       .status(200)
       .json(
         new ApiResponse(200,{
                           selectedCategory,
                            differentCategory,
                            mostSellingCourses
                        },"fetch the category of courses")
       )


})
export {createCategory , getAllCategory , categoryPageDetails}