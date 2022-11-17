const express = require("express"),
      router = express.Router(),
      passport = require("passport"),
      // fs = require("fs"),
      // path = require("path"),
      middleware = require("../middleware"),
      User = require("../models/user"),
      Project = require("../models/project"),
      Activity = require("../models/activity"),
      Issue = require("../models/issue"),
      Comment = require("../models/comment");

// importing controller
const adminController = require('../controllers/admin');

//admin -> dashboard
router.get("/admin",  adminController.getDashboard);

//admin -> find activities of all users on admin dashboard
router.post("/admin",  adminController.postDashboard);

//admin -> delete profile
router.delete("/admin/delete-profile",  adminController.deleteAdminProfile);

//admin project inventory
router.get("/admin/projectInventory/:filter/:value/:page",  adminController.getAdminProjectInventory);

// admin -> show searched projects
router.post("/admin/projectInventory/:filter/:value/:page",  adminController.postAdminProjectInventory);

//admin -> show projects to be updated
router.get("/admin/project/update/:project_id",  adminController.getUpdateProject);

//admin -> update project
router.post("/admin/project/update/:project_id", adminController.postUpdateProject);

//admin -> delete project
router.get("/admin/project/delete/:project_id", adminController.getDeleteProject);

//admin -> users list 
router.get("/admin/users/:page", adminController.getUserList);

//admin -> show searched user
router.post("/admin/users/:page", adminController.postShowSearchedUser);

//admin -> flag/unflag user
router.get("/admin/users/flagged/:user_id", adminController.getFlagUser);

//admin -> show one user
router.get("/admin/users/profile/:user_id", adminController.getUserProfile);

//admin -> show all activities of one user
router.get("/admin/users/activities/:user_id", adminController.getUserAllActivities);

//admin -> show activities by category
router.post("/admin/users/activities/:user_id", adminController.postShowActivitiesByCategory);

// admin -> delete a user
router.get("/admin/users/delete/:user_id", adminController.getDeleteUser);

//admin -> add new project
router.get("/admin/projects/add",  adminController.getAddNewProject);

router.post("/admin/projects/add",  adminController.postAddNewProject);

//admin -> profile
router.get("/admin/profile", adminController.getAdminProfile);

//admin -> update profile
router.post("/admin/profile", adminController.postUpdateAdminProfile);

//admin -> update password
router.put("/admin/update-password", adminController.putUpdateAdminPassword);

// //admin -> notifications
// router.get("/admin/notifications", (req, res) => {
//    res.send("This route is still under development. will be added in next version");
// });

module.exports = router;