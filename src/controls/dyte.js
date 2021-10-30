const { default: axios } = require("axios");
const express = require("express");
const router = express.Router();
const sdk = require("api")("@dyte/v1.0#4xeg4zkszwz5wi");

router.post("/participant", async (req, res) => {
    const { meetingData, meetingId } = req.body;
    try {
        const response = await axios.post(
            `https://api.cluster.dyte.in/v1/organizations/${process.env.DYTE_ORG_ID}/meetings/${meetingId}/participant`,
            meetingData,
            {
                headers: {
                    Authorization: process.env.DYTE_API_KEY,
                },
            }
        );
        const { data } = response;
        if (data.success) {
            res.status(200).json({
                success: true,
                authToken: data.data.authResponse.authToken,
            });
        }
    } catch (error) {
        res.status(500).json(error);
    }
});

module.exports = router;
