process.env.NODE_ENV = "test";

let mongoose = require("mongoose");
let Role = require("../src/models/role.model");
let User = require("../src/models/user.model");
let chai = require("chai");
let deepEqualInAnyOrder = require("deep-equal-in-any-order");
let chaiHttp = require("chai-http");
let server = require("../src/server");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


let should = chai.should();
const { expect } = chai;

chai.use(chaiHttp);
chai.use(deepEqualInAnyOrder);

let body = {
    name: "vishnu thiyagarajan",
    email: "vishnu.thg@gmail.com",
    password: "password",
    role: {
        _id: "614b05624504fee469d60ba1",
        name: "scrummaster",
    },
};

describe("Roles", () => {
    describe("/GET allroles", () => {
        it("it should GET all the Roles", (done) => {
            chai.request(server)
                .get("/api/allroles")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("array");
                    res.body.length.should.be.eql(2);
                    done();
                });
        });
    });
});

describe("Users Register", () => {
    beforeEach((done) => {
        User.deleteOne({ email: body.email }, (err) => {
            done();
        });
    });
    describe("/POST register", () => {
        it("it should register the user", (done) => {
            chai.request(server)
                .post("/api/register")
                .send(body)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    expect(res.body).to.deep.equalInAnyOrder({
                        success: true,
                        message: "Please activate your account from your email",
                    });
                    done();
                });
        });
    });
});

describe("Users login", () => {
    beforeEach((done)  => {
        User.updateOne({ email: body.email }, { active: true }, (err) => {
            done();
        });
    });
    describe("/POST login", () => {
        it("it should login the user", (done) => {
            chai.request(server)
                .post("/api/login")
                .send(body)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    expect(res.body).to.have.keys([
                        "id",
                        "name",
                        "email",
                        "role",
                        "token",
                        "accessToken",
                    ]);
                    done();
                });
        });
    });
});

describe("All developers", () => {
    const tokenPayload = {
        name: body.name,
        email: body.email,
        role: body.role,
    };
    const token = jwt.sign(
        { user: tokenPayload },
        process.env.JWT_ACC_ACTIVATE
    );

    describe("/GET developers", () => {
        it("it should get all developers", (done) => {
            chai.request(server)
                .get("/api/alldevelopers")
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("array");
                    done();
                });
        });
    });
});
