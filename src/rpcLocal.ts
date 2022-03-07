export type Unwrap<Promised> = Promised extends Promise<infer Unwrapped>
  ? Unwrapped
  : Promised;

export type GenericFunc<Args extends any[]> = <Result>(
  ...args: Args
) => Promise<Result>;

export type Func<Args extends any[], Result> = (...args: Args) => Result;

export type RpcError<Data = any> = {
  code: string;
  message: string;
  data: Data;
};

export type RpcResponse<
  Result,
  Error extends RpcError = {
    code: string;
    message: string;
    data: any;
  }
> = {
  jsonrpc: "2.0";
  result?: Result;
  error?: Error;
  id?: string | number;
};

export type LocalType<RemoteType> = {
  [RemoteKey in keyof RemoteType]: RemoteType[RemoteKey] extends GenericFunc<
    infer Args
  >
    ? <Result>(...args: Args) => Promise<Unwrap<RpcResponse<Result>>>
    : RemoteType[RemoteKey] extends Func<infer Args, infer Result>
    ? (...args: Args) => Promise<Unwrap<RpcResponse<Result>>>
    : never;
};

export type Simplified<Local> = {
  [LocalKey in keyof Local]: Local[LocalKey] extends (
    ...args: infer Args
  ) => Promise<Unwrap<infer RpcResult>>
    ? RpcResult extends RpcResponse<infer Result>
      ? (...args: Args) => Promise<Result>
      : never
    : never;
};

export const simplify = <RemoteType>(
  local: LocalType<RemoteType>
): Simplified<LocalType<RemoteType>> => {
  const proxy = new Proxy(
    {},
    {
      get: function (_target, property) {
        return async (...params: any[]) => {
          const promise = local[property as keyof typeof local](...params);
          return await promise.then(({ result, error }) => {
            if (!error) {
              return result;
            } else {
              throw error;
            }
          });
        };
      },
    }
  );
  return proxy as Simplified<LocalType<RemoteType>>;
};

const installFetch = async () => {
  if (!globalThis.fetch) {
    globalThis.fetch = (await import("node-fetch")).default as any;
  }
};

export const connect = <RemoteType>(
  endpointUrl: string
): LocalType<RemoteType> => {
  const proxy = new Proxy(
    {},
    {
      get: function (_target, property, _receiver) {
        return async (...params: any[]) => {
          await installFetch();
          const result = await globalThis.fetch(endpointUrl, {
            method: "POST",
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: null,
              method: property,
              params: params,
            }),
          });
          if (result.status >= 400) {
            return Promise.reject(await result.text());
          }
          return await result.json();
        };
      },
    }
  );
  return proxy as LocalType<RemoteType>;
};
