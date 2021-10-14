const express = require("express");
const mongoose = require("mongoose");
const ProjectsModel = mongoose.model("Projects");
const SprintsModel = mongoose.model("Sprints");
const passport = require("passport");
const UsersModel = mongoose.model("Users");
const { roles, sprintStatus } = require("../constants");
const checkIsInRole = require("../utils");
const router = express.Router();
const sdk = require("api")("@dyte/v1.0#4xeg4zkszwz5wi");

router.post(
    "/project",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        try {
            const user = await UsersModel.findOne({
                email: req.user.email,
            }).exec();
            if (user.projects.length >= 1)
                return res.status(200).send("A default project already exists");
            const meeting = await sdk.createMeeting(
                {
                    title: "Default Room",
                    presetName: "nimble",
                },
                {
                    organizationId: process.env.DYTE_ORG_ID,
                    Authorization: process.env.DYTE_API_KEY,
                }
            );
            if (!meeting.success) {
                return res.status(500).send({
                    message: "Unable to create room.",
                });
            }
            const upcomingSprint = await SprintsModel.create({
                name: "Sprint_1",
                retrospectives: [],
                activities: [],
                status: sprintStatus.UPCOMING,
            });
            upcomingSprint.save();
            const project = await ProjectsModel.create({
                projectName: "Default Project",
                startDate: Date.now(),
                members: [
                    {
                        userId: user._id,
                        standups: [],
                    },
                ],
                tickets: [],
                sprints: [upcomingSprint._id],
                meetingRoom: {
                    roomName: meeting?.data?.meeting?.roomName,
                    roomId: meeting?.data?.meeting?.id,
                },
            });
            user.projects.push(project._id);
            user.save();
            return res.json(project.toObject());
        } catch (error) {
            return res
                .status(500)
                .send({ message: "server side error", error: { ...error } });
        }
    }
);

router.get(
    "/projects",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        try {
            const user = await UsersModel.findOne({
                email: req.user.email,
            }).exec();
            const userProjects = user.projects;
            const projects = await ProjectsModel.find({
                _id: { $in: userProjects },
            })
                .populate("sprints")
                .lean()
                .exec();
            for (let i = 0; i < projects.length; i++) {
                const val = projects[i];
                for (let j = 0; j < val.members.length; j++) {
                    const member = val.members[j];
                    const user = await UsersModel.findById(
                        member.userId,
                        "name email active"
                    ).exec();
                    val.members[j] = { ...member, user };
                }
            }
            return res.status(200).json(projects);
        } catch (error) {
            return res
                .status(500)
                .send({ message: "server side error", error: { ...error } });
        }
    }
);

router.post(
    "/member",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        const { memberId, projectId } = req.body;
        const user = await UsersModel.findById(memberId).exec();
        const project = await ProjectsModel.findById(projectId).exec();
        if (
            Array(project.members).findIndex((e) => e.user_id === user._id) >= 0
        ) {
            return res.status(200).send("Member already exists.");
        }

        ProjectsModel.findById(projectId, (err, result) => {
            if (!err) {
                if (!result) {
                    res.sendStatus(404).send("Project was not found").end();
                } else {
                    result.members.push({
                        userId: user._id,
                        standups: [],
                    });
                    result.markModified("members");
                    result.save(function (saveerr, saveresult) {
                        if (!saveerr) {
                            res.status(200).send(saveresult);
                        } else {
                            res.status(400).send(saveerr.message);
                        }
                    });
                }
            } else {
                res.status(400).send(err.message);
            }
        });
    }
);

router.post(
    "/addStandup",
    passport.authenticate("jwt", { session: false }),
    // checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        const { projectId, userId, standup } = req.body;
        console.log(projectId, userId, standup);
        ProjectsModel.findById(projectId, (err, result) => {
            if (!err) {
                if (!result) {
                    res.sendStatus(404).send("Project was not found").end();
                } else {
                    const index = result.members.findIndex(
                        (member) => member.userId === userId
                    );
                    if (index < 0)
                        res.status(400)
                            .send({
                                success: false,
                                message: "user not found under this project",
                            })
                            .end();
                    if (
                        result.members[index].standups.slice(-1)[0].date ===
                        standup.date
                    )
                        res.status(400)
                            .send({
                                success: false,
                                message: "user is already done with stand up",
                            })
                            .end();
                    result.members[index].standups.push(standup);
                    result.save(function (saveerr, saveresult) {
                        if (!saveerr) {
                            res.status(200).send({
                                success: true,
                                message: "Stand up updated successfully",
                            });
                        } else {
                            res.status(400).send({
                                success: false,
                                message: saveerr.message,
                            });
                        }
                    });
                }
            } else {
                res.status(400).send(err.message);
            }
        });
    }
);

router.post(
    "/addTicket",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        const { projectId, ticketDetails } = req.body;
        ProjectsModel.findById(projectId, (err, result) => {
            if (!err) {
                if (!result) {
                    res.sendStatus(404).send("Project was not found").end();
                } else {
                    result.tickets.push(ticketDetails);
                    result.save(function (saveerr, saveresult) {
                        if (!saveerr) {
                            res.status(200).send({
                                success: true,
                                data: ticketDetails,
                            });
                        } else {
                            res.status(400).send({
                                success: false,
                                message: saveerr.message,
                            });
                        }
                    });
                }
            } else {
                res.status(400).send(err.message);
            }
        });
    }
);

router.post(
    "/updateTicket",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        const { projectId, ticketDetails } = req.body;
        ProjectsModel.findById(projectId, (err, result) => {
            if (!err) {
                if (!result) {
                    res.sendStatus(404).send("Project was not found").end();
                } else {
                    const ticketIndex = result.tickets.findIndex(
                        (ticket) => ticket.ticketId === ticketDetails.ticketId
                    );
                    if (ticketIndex !== -1) {
                        result.tickets[ticketIndex] = ticketDetails;
                    } else {
                        res.sendStatus(404).send("Ticket was not found").end();
                    }
                    result.save(function (saveerr, saveresult) {
                        if (!saveerr) {
                            res.status(200).send({
                                success: true,
                                data: ticketDetails,
                            });
                        } else {
                            res.status(400).send({
                                success: false,
                                message: saveerr.message,
                            });
                        }
                    });
                }
            } else {
                res.status(400).send(err.message);
            }
        });
    }
);

router.post(
    "/deleteTicket",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        const { projectId, ticketId } = req.body;
        ProjectsModel.findById(projectId, (err, result) => {
            if (!err) {
                if (!result) {
                    res.sendStatus(404).send("Project was not found.").end();
                } else {
                    const ticketIndex = result.tickets.findIndex(
                        (ticket) => ticket.ticketId === ticketId
                    );
                    if (ticketIndex !== -1) {
                        result.tickets.splice(ticketIndex, 1);
                    } else {
                        res.sendStatus(404).send("Ticket id not valid.").end();
                    }
                    result.save(function (saveerr, saveresult) {
                        if (!saveerr) {
                            res.status(200).send({
                                success: true,
                                message: "Ticket deleted successfully ...",
                            });
                        } else {
                            res.status(400).send({
                                success: false,
                                message: saveerr.message,
                            });
                        }
                    });
                }
            } else {
                res.status(400).send(err.message);
            }
        });
    }
);

router.post(
    "/getAllTickets",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        const { projectId } = req.body;
        ProjectsModel.findById(projectId, (err, result) => {
            if (!err) {
                if (!result) {
                    res.sendStatus(404).send("Project was not found.").end();
                } else {
                    res.status(200).send({
                        success: true,
                        data: result.tickets,
                    });
                }
            } else {
                res.status(400).send(err.message);
            }
        });
    }
);

router.post(
    "/changeTicketStatus",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER, roles.ROLE_DEVELOPER),
    async (req, res) => {
        const { projectId, ticketId, status } = req.body;
        ProjectsModel.findById(projectId, (err, result) => {
            if (!err) {
                if (!result) {
                    res.sendStatus(404).send("Project was not found.").end();
                } else {
                    const ticketIndex = result.tickets.findIndex((ticket) => {
                        return ticket.ticketId === ticketId;
                    });
                    if (ticketIndex !== -1) {
                        // Add Validation If srpint should not be completed
                        result.tickets[ticketIndex].status = status;
                    } else {
                        res.sendStatus(404).send("Ticket was not found").end();
                    }

                    result.save(function (saveerr, saveresult) {
                        if (!saveerr) {
                            res.status(200).send({
                                success: true,
                                message: `Ticket status update to ${status}`,
                            });
                        } else {
                            res.status(400).send({
                                success: false,
                                message: saveerr.message,
                            });
                        }
                    });
                }
            } else {
                res.status(400).send(err.message);
            }
        });
    }
);

router.post(
    "/alldevelopersOfAProject",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER, roles.ROLE_DEVELOPER),
    async (req, res) => {
        const { projectId } = req.body;
        ProjectsModel.findById(projectId, (err, result) => {
            if (!err) {
                if (!result) {
                    res.sendStatus(404).send("Project was not found.").end();
                } else {
                    if (result.members.length > 0) {
                        const memObjIds = result.members.map(function (obj) {
                            return obj.userId;
                        });
                        UsersModel.find(
                            {
                                _id: { $in: memObjIds },
                            },
                            (_err, result) => {
                                if (!result) {
                                    res.sendStatus(404)
                                        .send(
                                            `Coudln't fetch developers list of porjectId ${projectId}`
                                        )
                                        .end();
                                }
                                res.status(200).send({
                                    success: true,
                                    data: result,
                                });
                            }
                        );
                    }
                }
            } else {
                res.status(400).send(err.message);
            }
        });
    }
);

router.post(
    "/addMemberToProject",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        const { projectId, memberId } = req.body;
        ProjectsModel.findById(projectId, (err, result) => {
            if (!err) {
                if (!result) {
                    res.sendStatus(404).send("Project was not found.").end();
                } else {
                    const member = {
                        userId: memberId,
                        standups: [],
                    };
                    result.members.push(member);
                    result.save(function (saveerr, saveresult) {
                        if (!saveerr) {
                            res.status(200).send({
                                success: true,
                                message: "Member added successfully",
                            });
                        } else {
                            res.status(400).send({
                                success: false,
                                message: saveerr.message,
                            });
                        }
                    });
                }
            } else {
                res.status(400).send(err.message);
            }
        });
    }
);

module.exports = router;
