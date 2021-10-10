const { default: axios } = require("axios");
const express = require("express");
const router = express.Router();
const sdk = require("api")("@dyte/v1.0#4xeg4zkszwz5wi");

router.post("/participant", async (req, res) => {
    const { meetingData, meetingId } = req.body;
    // console.log(meetingData);
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
        } else {
            // setError("Could not authenticate user!");
        }
        // console.log(process.env.DYTE_API_KEY);
        // const response = await sdk.addParticipant(meetingData, {
        //     organizationId: process.env.DYTE_ORG_ID,
        //     meetingId,
        //     Authorization: process.env.DYTE_API_KEY,
        // });
        // if (response.success) {
        //     res.status(200).json({
        //         authToken: response.data.authToken,
        //     });
        // }
        // .then(res => console.log(res))
        // .catch(err => console.error(err));
    } catch (error) {
        res.status(500).json(error);
    }
    // .then((res) => {

    // })
    // .catch((error) => {
    //     res.status(500).json(error);
    // });
});

module.exports = router;
