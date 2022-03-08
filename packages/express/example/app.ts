import express from "express";
import { middleware } from "@rpcts/express";

export const app = express();

app.post(
  "/api",
  //express.json(),
  middleware({ 
    echo: (str: string) => str,
    time: () => ({ time: Date.now() }),
  })
);
