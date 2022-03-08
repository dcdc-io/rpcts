import type { RequestHandler } from "express";
import { middleware } from "./middleware";

describe("Express", () => {
  test("basic", async () => {
    expect<<ServiceType>(service: ServiceType) => RequestHandler>(middleware);

    // an rpc method
    const hello = jest.fn((str: string) => str);

    // express mocks
    const json = jest.fn();
    const next = jest.fn();

    // create an express middleware e.g. app.post('/rpc', applied)
    const applied = middleware(
      {
        hello,
      },
      { noBodyParser: true }
    );

    await applied(
      {
        body: {
          jsonrpc: "2.0",
          method: "hello",
          params: ["world"],
          id: null,
        },
      } as any,
      {
        json,
      } as any,
      next
    );

    expect(hello).toBeCalledTimes(1);
    expect(json).toBeCalledWith({
      jsonrpc: "2.0",
      result: "world",
      id: null,
    });
    expect(next).toBeCalledTimes(1);
  });
});
