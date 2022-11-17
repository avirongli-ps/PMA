const express = require("express"),
      router = express.Router();


// Importing controller
const projectController = require('../controllers/projects');

// Browse projects
router.get("/projects/:filter/:value/:page", projectController.getProjects);

// Fetch projects by search value
router.post("/projects/:filter/:value/:page", projectController.findProjects);

// Fetch individual project details
router.get("/projects/details/:project_id", projectController.getProjectDetails);

module.exports = router;