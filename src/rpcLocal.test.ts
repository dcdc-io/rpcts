import {
  connect,
  simplify,
  LocalType,
  RpcResponse,
  RpcError,
} from "./rpcLocal";
import nock from "nock";

describe("RpcLocal", () => {
  // a dummy endpoint to trap fetches
  const helloRoot = "http://domain";
  const helloName = "rpc-hello";
  const helloUrl = `${helloRoot}/${helloName}`;

  // create a service type
  type HelloService = {
    hello: () => "hello";
    broken: () => "broken";
  };

  const nockHello = () => {
    nock(helloRoot)
      .post(`/${helloName}`)
      .reply(200, { jsonrpc: "2.0", result: "hello", id: null });
  };

  const nockBroken = () => {
    nock(helloRoot)
      .post(`/${helloName}`)
      .reply(200, { jsonrpc: "2.0", error: "broken", id: null });
  };

  test("Connect to a service", async () => {
    // connect to a service
    const helloClient = connect<HelloService>(helloUrl);

    // assert the type with a type test
    expect<LocalType<HelloService>>(helloClient);

    // assert a sync method...
    expect<HelloService["hello"]>(() => "hello");
    // ... is async in the client
    expect<() => Promise<RpcResponse<string>>>(helloClient.hello);

    // assert the proxy produces a promise
    nockHello();
    const helloPromise = helloClient.hello();
    expect<Promise<RpcResponse<string>>>(helloPromise);

    // assert the awaited promise returns the same as the local service
    const helloResult = await helloPromise;
    expect(helloResult.result).toBe("hello");
  });

  test("Simplify a connected service's client", async () => {
    // connect to a service
    const helloClient = connect<HelloService>(helloUrl);

    // assert simplified local service returns correct result types
    const helloShortClient = simplify(helloClient);
    expect<{
      hello: () => Promise<string>;
    }>(helloShortClient);

    // assert a call to a simplified client
    nockHello();
    const helloString = await helloShortClient.hello();
    expect(helloString).toBe("hello");
  });

  test("Basic errors", async () => {
    nockBroken();
    const helloClient = connect<HelloService>(helloUrl);
    const errored = await helloClient.broken();
    expect<RpcError>(errored.error!).toBeDefined();
    expect(errored.result).toBeUndefined();

    nockBroken();
    const helloShortClient = simplify(helloClient);
    await expect(helloShortClient.broken).rejects.toBe("broken");
  });
});
