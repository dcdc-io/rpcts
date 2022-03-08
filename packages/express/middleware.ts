import type { NextFunction, Request, RequestHandler, Response } from "express";
import { json } from "express";
import { compose, Next } from "compose-middleware";
import type * as http from "http";

type Param = Value[] | { [key: string]: Value };

type Value = string | number | boolean | null | Date | Param;

export const middleware = <ServiceType>(
  service: ServiceType,
  options: { noBodyParser: boolean } = { noBodyParser: false }
) =>
  compose(
    options.noBodyParser
      ? [(req: any, res: any, next: any) => _handler(service)(req, res, next)]
      : [
          json(),
          (req: any, res: any, next: any) => _handler(service)(req, res, next),
        ]
  );

const _handler =
  <ServiceType>(service: ServiceType): RequestHandler =>
  async (request, response, next) => {
    let jsonRpc: {
      jsonrpc: "2.0";
      method: string;
      params?: Param;
      id: string | number | null;
    };
    if (request.body.jsonrpc === "2.0") {
      jsonRpc = request.body as typeof jsonRpc;
    } else {
      jsonRpc = JSON.parse(request.body) as typeof jsonRpc;
    }
    const handler = service[
      jsonRpc.method as keyof typeof service
    ] as unknown as (...args: any[]) => Promise<any>;

    try {
      const result = await handler(
        ...(Array.isArray(jsonRpc.params)
          ? jsonRpc.params
          : [jsonRpc.params]
        ).slice(0, handler.length)
      );
      response.json({
        jsonrpc: jsonRpc.jsonrpc,
        result,
        id: jsonRpc.id,
      });
    } catch (error: any) {
      response.json({
        jsonrpc: jsonRpc.jsonrpc,
        error: {
          code: -32603,
          message: error.toString() as string,
          data: error,
        },
        id: jsonRpc.id,
      });
    } finally {
      next();
    }
  };
