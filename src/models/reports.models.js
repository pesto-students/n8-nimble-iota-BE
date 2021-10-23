const mongoose = require("mongoose");
const reportsSchema = new mongoose.Schema(
    {
        sprintId: { type: String, required: true },
        storyPoints: { type: Object, required: true }
    },
    { timestamps: true }
);
mongoose.model("Reports", reportsSchema);
module.exports = reportsSchema;
