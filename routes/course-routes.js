const express = require('express');
const { getAllCourses,getLecturesByCourseId,createCourse,updateCourse,deleteCourse, addLecturesToCourseById } = require('../controllers/course.controller');
const { isLoggedIn, authorizedRoles } = require('../middlewares/auth.middleware');
const upload = require("../middlewares/multer.middleware")
const router = express.Router();


// test the routes => TODO 
router.route('/')
      .get(getAllCourses)
      .post(
            isLoggedIn,
            authorizedRoles('ADMIN'),
            upload.single('thumbnail'),
            createCourse
            );


router
  .route("/:courseId")
  .get(isLoggedIn, getLecturesByCourseId)
  .put(isLoggedIn, authorizedRoles("ADMIN"), updateCourse)
  .delete(isLoggedIn, authorizedRoles("ADMIN"), deleteCourse)
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("lecture"),
    addLecturesToCourseById
  );

module.exports = router;

// 38