declare module "qrcode" {
  export type QRCodeToDataURLOptions = {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    scale?: number;
  };

  export type QRCode = {
    toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
  };

  const qrcode: QRCode;
  export default qrcode;
}

declare module "express" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  export type Request = IncomingMessage;

  export type Response = ServerResponse & {
    status(code: number): Response;
    type(contentType: string): Response;
    send(body: string): Response;
    json(body: unknown): Response;
  };

  export type RequestHandler = (req: Request, res: Response) => void;

  export type ExpressApp = {
    (req: IncomingMessage, res: ServerResponse): void;
    use(...handlers: unknown[]): void;
    get(path: string, handler: RequestHandler): void;
  } & Record<string, unknown>;

  export default function express(): ExpressApp;
}
