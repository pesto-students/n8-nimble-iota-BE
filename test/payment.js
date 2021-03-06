
process.env.NODE_ENV = "test";

let mongoose = require("mongoose");
let User = require("../src/models/user.model");
let chai = require("chai");
let deepEqualInAnyOrder = require("deep-equal-in-any-order");
let chaiHttp = require("chai-http");
let server = require("../src/server");
const jwt = require("jsonwebtoken");

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


describe("Create Order", () => {

    describe("/POST createOrder", () => {
        const tokenPayload = {
            name: body.name,
            email: body.email,
            role: body.role,
        };
        const token = jwt.sign({ user: tokenPayload }, process.env.JWT_ACC_ACTIVATE);

        it("it should Create an Order with given fields", (done) => {
            chai.request(server)
                .post("/api/createOrder")
                .set({ Authorization: `Bearer ${token}` })      
                .send({
                    email: body.email,
                    amount: 1000,
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("order");
                    res.body.order.should.have.property("id");
                    res.body.order.should.have.property("amount");
                    done();
                });
        });
    });
});

describe("Update Payment status", () => {
    describe("/POST updatePayment", () => {
        const tokenPayload = {
            name: body.name,
            email: body.email,
            role: body.role,
        };
        const token = jwt.sign({ user: tokenPayload }, process.env.JWT_ACC_ACTIVATE);
        it("it should update payment status", (done) => {
            chai.request(server)
                .post("/api/updatePayment")
                .set({ Authorization: `Bearer ${token}` }) 
                .send({
                    transactionid: "2321jhkjhk213kjh123kj",
                    amount: 1000,
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    expect(res.body).to.deep.equalInAnyOrder({
                        success: true,
                        message:
                            "Subscription Updated ... Thanks for choosing Nimble :)",
                    });
                    done();
                });
        });
    });
});