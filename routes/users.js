// importing modules
const express = require("express"),
      router = express.Router(),
      middleware = require("../middleware");

// importing controller
const userController = require('../controllers/user');

// user -> dashboard
router.get("/user/:page", userController.getUserDashboard);

// user -> profile
router.get("/user/:page/profile", userController.getUserProfile);

//user -> upload image
router.post("/user/1/image", userController.postUploadUserImage);

//user -> update password
router.put("/user/1/update-password", userController.putUpdatePassword);

//user -> update profile
router.put("/user/1/update-profile", userController.putUpdateUserProfile);

//user -> notification
router.get("/user/1/notification", userController.getNotification);


//user -> issue a project
router.post("/projects/:project_id/issue/:user_id", userController.postIssueProject);

//user -> show return-renew page
router.get("/projects/return-renew", userController.getShowRenewReturn);

//user -> renew project
router.post("/projects/:project_id/renew", middleware.isLoggedIn, userController.postRenewProject);

// user -> return project

router.post("/projects/:project_id/return", userController.postReturnProject);

//user -> create new comment
router.post("/projects/details/:project_id/comment", userController.postNewComment);

//user -> update existing comment
router.post("/projects/details/:project_id/:comment_id", userController.postUpdateComment);

//user -> delete existing comment
router.delete("/projects/details/:project_id/:comment_id", userController.deleteComment);

// user -> delete user account
router.delete("/user/1/delete-profile", userController.deleteUserAccount);

module.exports = router;