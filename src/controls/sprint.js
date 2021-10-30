const express = require("express");
const mongoose = require("mongoose");
const SprintsModel = mongoose.model("Sprints");
const passport = require("passport");
const ProjectsModel = mongoose.model("Projects");
const router = express.Router();
const checkIsInRole = require("../utils");
const { roles, sprintStatus } = require("../constants");

router.post(
    "/activity",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        try {
            const sprint = await SprintsModel.findOne({
                _id: req.body.sprint_id,
            }).exec();
            sprint.activities.push({
                ticket_id: req.body.ticket_id,
                tostatus: req.body.tostatus,
                fromstatus: req.body.fromstatus,
                storypoints: req.body.storypoints,
            });
            sprint.save();
            return res.send({ success: true, message: "activity updated" });
        } catch (error) {
            return res.status(500).send({
                success: false,
                message: "server side error",
                error: { ...error },
            });
        }
    }
);

router.post(
    "/retrospectives",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        try {
            await SprintsModel.findOneAndUpdate(
                {
                    _id: req.body.sprint_id,
                },
                {
                    retrospectives: {
                        positives: req.body.positives || [],
                        neutrals: req.body.neutrals || [],
                        negatives: req.body.negatives || [],
                        actions: req.body.actions || [],
                    },
                }
            );
            return res.send({
                success: true,
                message: "retrospectives freezed",
            });
        } catch (error) {
            return res.status(500).send({
                success: false,
                message: "server side error",
                error: { ...error },
            });
        }
    }
);

router.put(
    "/completesprint",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        const sprintId = req.body.sprintId;
        try {
            const sprint = await SprintsModel.findById(sprintId).exec();
            if (sprint.status !== sprintStatus.ACTIVE) {
                return res.status(406).send({
                    success: false,
                    message: "This sprint is not active",
                });
            }
            sprint.status = sprintStatus.COMPLETED;
            sprint.enddate = Date.now();
            sprint.save();
            return res.send({
                success: true,
                message: "complete date updated",
            });
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                success: false,
                message: "server side error",
                error: { ...error },
            });
        }
    }
);

router.post(
    "/startsprint",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        const sprints = [];
        const projectId = req.body.projectId;
        const sprintId = req.body.sprintId;
        try {
            const project = await ProjectsModel.findById(projectId)
                .populate("sprints")
                .exec();
            const active = project.sprints.find(
                (e) => e.status === sprintStatus.ACTIVE
            );
            if (active) {
                return res.status(406).send({
                    success: false,
                    message:
                        "All active sprints should be closed before starting a new one!",
                });
            }
            const doc = project.sprints.find((e) => e.id === sprintId);
            if (!doc) {
                return res.status(406).send({
                    success: false,
                    message: "Sprint doesn't belong to the provided project!",
                });
            }

            if (project.sprints && project.sprints.length) {
                const currentSprint = await SprintsModel.findById(
                    sprintId
                ).exec();
                currentSprint.status = sprintStatus.ACTIVE;
                currentSprint.startdate = Date.now();
                currentSprint.save();

                const upcomingSprint = await SprintsModel.create({
                    name: "Sprint_" + (project.sprints.length + 1),
                    retrospectives: [],
                    activities: [],
                    status: sprintStatus.UPCOMING,
                });
                project.sprints.push(upcomingSprint._id);
                sprints.push(upcomingSprint);
                res.status(200).send({
                    success: true,
                    message: "Sprint started Successfully",
                });
            } else {
                res.status(406).send({
                    success: false,
                    message: "No sprint in the current project!",
                });
            }
            project.save();
            return res.send(sprints);
        } catch (error) {
            return res.status(500).send({
                success: false,
                message: "server side error",
                error: { ...error },
            });
        }
    }
);

router.get(
    "/sprints/:project_id",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        try {
            const project = await ProjectsModel.findOne({
                _id: req.params.project_id,
            }).exec();
            const projectSprints = project.sprints;
            const sprints = await SprintsModel.find({
                _id: { $in: projectSprints },
            }).exec();
            return res.status(200).json(sprints);
        } catch (error) {
            return res.status(500).send({
                success: false,
                message: "server side error",
                error: { ...error },
            });
        }
    }
);

module.exports = router;
