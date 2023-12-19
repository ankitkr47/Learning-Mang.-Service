const Course = require("../models/course.model");
const AppError = require("../utils/appError");
const cloudinary = require("cloudinary");
const fs = require("fs/promises");
const path = require("path");
const { findById } = require("../models/user.model");

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({}).select("-lectures");
    res.status(200).json({
      success: true,
      message: "All courses",
      courses,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};
const getLecturesByCourseId = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError("Invalid Course ID", 400));
    }

    res.status(200).json({
      success: true,
      message: "Course Lectures fetched successful",
      lectures: course.lectures,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const createCourse = async (req, res, next) => {
//   try {
    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy) {
      return next(new AppError("All feild are required", 400));
    }
    const course = await Course.create({
      title,
      description,
      // description,
      category,
      createdBy,
      thumbnail: {
        public_id: "Dummy",
        secure_url: "Dummy",
      },
    });
    if (!course) {
      return next(
        new AppError("Course could not be created, please try again", 400)
      );
    }
    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
        });
        if (result) {
          course.thumbnail.public_id = result.public_id;
          course.thumbnail.secure_url = result.secure_url;
        }
        fs.rm(`uploads/${req.file.filename}`);
      } 
      catch (error) {
        // Empty the uploads directory without deleting the uploads directory
        for (const file of await fs.readdir("uploads/")) {
          await fs.unlink(path.join("uploads/", file));
        }

        // Send the error message
        return next(
          new AppError(
            JSON.stringify(error) || "File not uploaded, please try again",
            400
          )
        );
        
      }
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course created successfully!",
      course,
    });
//   }
//    catch (error) {
//     return next(new AppError("e.message", 500));
//   }
};

const updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        $set: req.body
      },
      {
        runValidators: true
      }
    )
    const courseTemp = await Course.findById(courseId);
    //for returning purpose only.
    // return updated values.

    if(!course){
      return next(
        new AppError('Course does not exists',400)
      );
    }

    res.status(200).json({
      success:true,
      message:'Course updated successfully',
      courseTemp
    })

  } catch (error) {
    return next(
      new AppError(e.message,500)
    );
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if(!course){
      return next(new AppError("Course does not exist with given id", 500));
    }

    await Course.findByIdAndDelete(courseId);
    res.status(200).json({
      success:true,
      message:"Course deleted successfully"
    })
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const addLecturesToCourseById = async (req,res,next)=>{
  try {
    const { title,description } = req.body;
    const { courseId } = req.params;

    if(!title || !description){
      return next(
        new AppError('All Fields are required',400)
      );
    }
    const course = await Course.findById(courseId);

    if(!course){
      return next(
        new AppError('Course with given id does not exist!',400)
      )
    }

    const lectureData = {
      title,
      description,
      lecture:{}
    }

    if(req.file){
      const result = await cloudinary.v2.uploader.upload(req.file.path,{
        floder:'lms',
        resource_type:'video'
      });
      // console.log(result);
      if(result){
        lectureData.lecture.public_id =result.public_id;
        lectureData.lecture.secure_url=result.secure_url;
      }

      fs.rm(`uploads/${req.file.filename}`);
    }

    course.lectures.push(lectureData);
    course.numbersOfLectures = course.lectures.length;
    // console.log(course.numberOfLectures);

    await course.save();

    // console.log(course.numberOfLectures);
    res.status(200).json({
      success: true,
      message:'Lectures addad Successfully',
      course
    })


  } catch (e) {
    return new AppError(e.message,500);
  }
}

const removeLecturesFromCourse = async (req,res,next) => {

}


module.exports = {
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourse,
  deleteCourse,
  addLecturesToCourseById
};
