import { app } from "./app";
import request from "supertest";

test("api with express.json()", async () => {
  return request(app)
    .post("/api")
    .set("Accept", "application/json")
    .send({
      jsonrpc: "2.0",
      method: "echo",
      params: ["hello"], 
      id: null,
    })
    .expect("Content-Type", /json/)
    .expect(200) 
    .then((response) => {
      expect(response.body).toStrictEqual({
        jsonrpc: "2.0",
        result: "hello",
        id: null,
      });
    });
});

