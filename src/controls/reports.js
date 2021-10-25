const express = require("express");
const mongoose = require("mongoose");
const { redisKey } = require("../constants");
const reportsModel = mongoose.model("Reports");
const router = express.Router();
const redis = require("../redis/index");
const redisClient = redis();

const generateRedisReportsKey = (sprintId) => {
    return redisKey + "_" + sprintId;
};

router.post("/incrementStoryPoint", async (req, res) => {
    try {
        const { sprintId, payload } = req.body;
        let result = await reportsModel.findOne({ sprintId: sprintId });
        const date = new Date();
        const dateKey =
            date.getDate() + "_" + date.getMonth() + "_" + date.getFullYear();
        if (!result) {
            result = {};
            result["storyPoints"] = {};
            result["sprintId"] = sprintId;
            result["storyPoints"][dateKey] = [payload];
            const updatedResult = await reportsModel.insertMany(result);
            res.status(200).send({
                success: true,
                message: "Reports Data updated",
            });
        } else {
            let temp = null;
            if (dateKey in result.storyPoints) {
                temp = result.storyPoints;
                temp[dateKey].push(payload);
            } else {
                temp = result.storyPoints;
                temp[dateKey] = [payload];
            }
            const key = "storyPoints";
            const updatedResult = await reportsModel.updateOne(
                { sprintId: sprintId },
                { $set: { [key]: temp } }
            );
            res.status(200).send({
                success: true,
                message: "Reports Data updated",
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "server side error" });
    }
});

router.post("/getReportsData", async (req, res) => {
    try {
        const { sprintId } = req.body;
        const redisReportsKey = generateRedisReportsKey(sprintId);
        const redisResult = await redisClient.get(redisReportsKey);
        if (redisResult) {
            res.status(200).send({
                success: true,
                data: JSON.parse(redisResult),
            });
        } else {
            const result = await reportsModel.findOne({ sprintId: sprintId });
            await redisClient.set(
                redisReportsKey,
                JSON.stringify(result.storyPoints)
            );
            if (result) {
                res.status(200).send({
                    success: true,
                    data: result.storyPoints,
                });
            } else {
                res.status(404).send({
                    success: false,
                    message: `No data for ${sprintId}`,
                });
            }
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: `Internal server error`,
        });
    }
});

module.exports = router;
