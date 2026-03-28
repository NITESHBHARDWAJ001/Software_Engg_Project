export class HttpError extends Error {
  constructor(statusCode, message, code = 'HTTP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
