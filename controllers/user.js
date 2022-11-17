// importing dependencies
const sharp = require('sharp');
const uid = require('uid');
const fs = require('fs');

// importing models
const User = require("../models/user"),
      Activity = require("../models/activity"),
      Project = require("../models/project"),
      Issue = require("../models/issue"),
      Comment = require("../models/comment");

// importing utilities
const deleteImage = require('../utils/delete_image');

// GLOBAL_VARIABLES
const PER_PAGE = 5;

//user -> dashboard
exports.getUserDashboard = async(req, res, next) => {
    var page = req.params.page || 1;
    const user_id = req. user._id;

    try {
        // fetch user info from db and populate it with related project issue
        const user = await User.findById(user_id);

        if(user.projectIssueInfo.length > 0) {
            const issues = await Issue.find({"user_id.id" : user._id});

            for(let issue of issues) {
                if(issue.project_info.returnDate < Date.now()) {
                    user.violatonFlag = true;
                    user.save();
                    req.flash("warning", "You are flagged for not returning " + issue.project_info.title + " in time");
                    break;
                }
            }
        }
        const activities = await Activity
            .find({"user_id.id": req.user._id})
            .sort({_id: -1})
            .skip((PER_PAGE * page) - PER_PAGE)
            .limit(PER_PAGE);

        const activity_count = await Activity.find({"user_id.id": req.user._id}).countDocuments();

        res.render("user/index", {
					user : user,
					current : page,
					pages: Math.ceil(activity_count / PER_PAGE),
					activities : activities,
        });
    } catch(err) {
			console.log(err);
			return res.redirect('back');
    }
}

// user -> profile
exports.getUserProfile = (req, res, next) => {
    res.render("user/profile");
}

// user -> update/change password
exports.putUpdatePassword = async(req, res, next) => {
    const username = req.user.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.password;

    try {
        const user = await User.findByUsername(username);
        await user.changePassword(oldPassword, newPassword);
        await user.save();

        // logging activity
        const activity = new Activity({
            category: "Update Password",
            user_id : {
                id : req.user._id,
                username : req.user.username,
            },
        });
        await activity.save();

        req.flash("success", "Your password is recently updated. Please log in again to confirm");
        res.redirect("/auth/user-login");
    } catch(err) {
        console.log(err);
        return res.redirect('back');
    }
}

// user -> update profile
exports.putUpdateUserProfile = async(req, res, next) => {
    try{
        const userUpdateInfo = {
            "firstName": req.body.firstName,
            "lastName": req.body.lastName,
            "email": req.body.email,
            "gender": req.body.gender,
            "address": req.body.address,
        }
        await User.findByIdAndUpdate(req.user._id, userUpdateInfo);

        // logging activity
        const activity = new Activity({
            category: "Update Profile",
            user_id: {
                id: req.user._id,
                username: req.user.username,
            }
        });
        await activity.save();

        res.redirect('back');
    } catch(err) {
        console.log(err);
        return res.redirect('back');
    }
}

// upload image
exports.postUploadUserImage = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const user = await User.findById(user_id);

        let imageUrl;
        if(req.file) {
            imageUrl = `${uid()}__${req.file.originalname}`;
            let filename = `images/${imageUrl}`;
            let previousImagePath = `images/${user.image}`;

            const imageExist = fs.existsSync(previousImagePath);
            if(imageExist) {
                deleteImage(previousImagePath);
            }
            await sharp(req.file.path)
                .rotate()
                .resize(500, 500)
                .toFile(filename);
            
            fs.unlink(req.file.path, (err) => {
                if(err) {
                    console.log(err);
                }
            })
        } else {
            imageUrl = 'profile.png';
        }
        
        user.image = imageUrl;
        await user.save();
        
        const activity = new Activity({
            category : "Upload Photo",
            user_id : {
              id : req.user._id,
              username: user.username,
             }
        });
        await activity.save();
        
        res.redirect("/user/1/profile");
    } catch(err) {
        console.log(err);
        res.redirect('back');
    }
};

//user -> notification
exports.getNotification = async(req, res, next) => {
    res.render("user/notification");
}

//user -> issue a project
exports.postIssueProject = async(req, res, next) => {
    if(req.user.violationFlag) {
        req.flash("error", "You are flagged for violating rules/delay on returning projects/paying fines. Untill the flag is lifted, You can't issue any projects");
        return res.redirect("back");
    }

    if(req.user.projectIssueInfo.length >= 5) {
        req.flash("warning", "You can't issue more than 5 projects at a time");
        return res.redirect("back");
    }

    try {
        const project = await Project.findById(req.params.project_id);
        const user = await User.findById(req.params.user_id);

        // registering issue
        project.stock -= 1;
        const issue =  new Issue({
            project_info: {
                id: project._id,
                title: project.title,
                author: project.author,
                ISBN: project.ISBN,
                category: project.category,
                stock: project.stock,
            },
            user_id: {
                id: user._id,
                username: user.username,
            }
        });

        // putting issue record on individual user document
        user.projectIssueInfo.push(project._id);

        // logging the activity
        const activity = new Activity({
            info: {
                id: project._id,
                title: project.title,
            },
            category: "Issue",
            time: {
                id: issue._id,
                issueDate: issue.project_info.issueDate,
                returnDate: issue.project_info.returnDate,
            },
            user_id: {
                id: user._id,
                username: user.username,
            }
        });

        // await ensure to synchronously save all database alteration
        await issue.save();
        await user.save();
        await project.save();
        await activity.save();

        res.redirect("/addProject");
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

// user -> show return-renew page
exports.getShowRenewReturn = async(req, res, next) => {
    const user_id = req.user._id;
    try {
        const issue = await Issue.find({"user_id.id": user_id});
        res.render("user/return-renew", {user: issue});
    } catch (err) {
        console.log(err);
        return res.redirect("back");
    }
}

// user -> renew project working procedure
/*
    1. construct the search object
    2. fetch issues based on search object
    3. increament return date by 7 days set isRenewed = true
    4. Log the activity
    5. save all db alteration
    6. redirect to /projects/return-renew
*/
exports.postRenewProject = async(req, res, next) => {
    try {
        const searchObj = {
            "user_id.id": req.user._id,
            "project_info.id": req.params.project_id,
        }
        const issue = await Issue.findOne(searchObj);
        // adding extra 7 days to that issue
        let time = issue.project_info.returnDate.getTime();
        issue.project_info.returnDate = time + 7*24*60*60*1000;
        issue.project_info.isRenewed = true;

        // logging the activity
        const activity = new Activity({
            info: {
                id: issue._id,
                title: issue.project_info.title,
            },
            category: "Renew",
            time: {
                id: issue._id,
                issueDate: issue.project_info.issueDate,
                returnDate: issue.project_info.returnDate,
            },
            user_id: {
                id: req.user._id,
                username: req.user.username,
            }
        });

        await activity.save();
        await issue.save();

        res.redirect("/projects/return-renew");
    } catch (err) {
        console.log(err);
        return res.redirect("back");
        
    }
}

// user -> return project working procedure
/*
    1. Find the position of the project to be returned from user.projectIssueInfo
    2. Fetch the project from db and increament its stock by 1
    3. Remove issue record from db
    4. Pop projectIssueInfo from user by position
    5. Log the activity
    6. refirect to /projects/return-renew
*/
exports.postReturnProject = async(req, res, next) => {
    try {
        // finding the position
        const project_id = req.params.project_id;
        const pos = req.user.projectIssueInfo.indexOf(req.params.project_id);
        
        // fetching project from db and increament
        const project = await Project.findById(project_id);
        project.stock += 1;
        await project.save();

        // removing issue 
        const issue =  await Issue.findOne({"user_id.id": req.user._id});
        await issue.remove();

        // popping project issue info from user
        req.user.projectIssueInfo.splice(pos, 1);
        await req.user.save();

        // logging the activity
        const activity = new Activity({
            info: {
                id: issue.project_info.id,
                title: issue.project_info.title,
            },
            category: "Return",
            time: {
                id: issue._id,
                issueDate: issue.project_info.issueDate,
                returnDate: issue.project_info.returnDate,
            },
            user_id: {
                id: req.user._id,
                username: req.user.username,
            }
        });
        await activity.save();

        // redirecting
        res.redirect("/projects/return-renew");
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

// user -> create new comment working procedure
/* 
    1. Find the project to be commented by id
    2. Create new Comment instance and fill information inside it
    3. Log the activity
    4. Redirect to /projects/details/:project_id
*/
exports.postNewComment = async(req, res, next) => {
    try {
        const comment_text = req.body.comment;
        const user_id = req.user._id;
        const username = req.user.username;

        // fetching the project to be commented by id
        const project_id = req.params.project_id;
        const project = await Project.findById(project_id);

        // creating new comment instance
        const comment = new Comment({
            text: comment_text,
            author: {
                id: user_id,
                username: username,
            },
            project: {
                id: project._id,
                title: project.title,
            }
        });
        await comment.save();
        
        // pushing the comment id to project
        project.comments.push(comment._id);
        await project.save();

        // logging the activity
        const activity = new Activity({
            info: {
                id: project._id,
                title: project.title,
            },
            category: "Comment",
            user_id: {
                id: user_id,
                username: username,
            }
        });
        await activity.save();

        res.redirect("/projects/details/"+project_id);
    } catch (err) {
        console.log(err);
        return res.redirect("back");
        
    }
}

// user -> update existing comment working procedure
/*
    1. Fetch the comment to be updated from db and update
    2. Fetch the project to be commented for logging project id, title in activity
    3. Log the activity
    4. Redirect to /projects/details/"+project_id
*/
exports.postUpdateComment = async(req, res, next) => {
    const comment_id = req.params.comment_id;
    const comment_text = req.body.comment;
    const project_id = req.params.project_id;
    const username = req.user.username;
    const user_id = req.user._id;

    try {
        // fetching the comment by id
        await Comment.findByIdAndUpdate(comment_id, comment_text);

        // fetching the project
        const project = await Project.findById(project_id);

        // logging the activity
        const activity = new Activity({
            info: {
                id: project._id,
                title: project.title,
             },
             category: "Update Comment",
             user_id: {
                id: user_id,
                username: username,
             }
        });
        await activity.save();

        // redirecting
        res.redirect("/projects/details/"+project_id);
        
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }

}

// user -> delete existing comment working procedure
/* 
    1. Fetch the project info for logging info
    2. Find the position of comment id in project.comments array in Project model
    3. Pop the comment id by position from Project
    4. Find the comment and remove it from Comment
    5. Log the activity
    6. Redirect to /projects/details/" + project_id
*/
exports.deleteComment = async(req, res, next) => {
    const project_id = req.params.project_id;
    const comment_id = req.params.comment_id;
    const user_id = req.user._id;
    const username = req.user.username;
    try {
        // fetching the project
        const project = await Project.findById(project_id);

        // finding the position and popping comment_id
        const pos = project.comments.indexOf(comment_id);
        project.comments.splice(pos, 1);
        await project.save();

        // removing comment from Comment
        await Comment.findByIdAndRemove(comment_id);

        // logging the activity
        const activity = new Activity({
            info: {
                id: project._id,
                title: project.title,
             },
            category: "Delete Comment",
            user_id: {
                id: user_id,
                username: username,
             }
        });
        await activity.save();

        // redirecting
        res.redirect("/projects/details/" + project_id);
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

// user -> delete user account
exports.deleteUserAccount = async (req, res, next) => {
    try {
        const user_id = req.user._id;

        const user = await User.findById(user_id);
        await user.remove();

        let imagePath = `images/${user.image}`;
        if(fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }

        await Issue.deleteMany({"user_id.id": user_id});
        await Comment.deleteMany({"author.id":user_id});
        await Activity.deleteMany({"user_id.id": user_id});

        res.redirect("/");
    } catch (err) {
        console.log(err);
        res.redirect('back');
    }
}

