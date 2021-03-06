const mongoose = require("mongoose");
const { sprintStatus } = require("../constants");
const Schema = mongoose.Schema;
const retrospectivesSchema = new Schema({
    positives: { type: [String], required: false },
    negatives: { type: [String], required: false },
    neutrals: { type: [String], required: false },
    actions: { type: [String], required: false },
});
const activitiesSchema = new Schema(
    {
        ticket_id: { type: String, required: true },
        tostatus: { type: String, required: true },
        fromstatus: { type: String, required: true },
        storypoints: { type: String, required: true },
    },
    {
        timestamp: true,
    }
);
const sprintsSchema = new Schema({
    name: { type: String, required: true },
    startdate: { type: Date, required: false },
    enddate: { type: Date, required: false },
    retrospectives: {
        type: [retrospectivesSchema],
        required: false,
    },
    activities: { type: [activitiesSchema], required: false },
    status: {
        type: String,
        enum: [
            sprintStatus.UPCOMING,
            sprintStatus.ACTIVE,
            sprintStatus.COMPLETED,
        ],
        default: sprintStatus.UPCOMING,
    },
});

const SprintsModel = mongoose.model("Sprints", sprintsSchema);
module.exports = SprintsModel;
