const roles = {
    ROLE_SCRUMMASTER: "scrummaster",
    ROLE_DEVELOPER: "developer",
};

const sprintStatus = {
    UPCOMING: "UPCOMING",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
};

const redisKey = "REDIS_REPORTS"

module.exports = {
    roles,
    sprintStatus,
    redisKey
};
