// Use a WeakSet to track HttpError instances across all module contexts
const httpErrorInstances = new WeakSet();

export class HttpError extends Error {
  constructor(statusCode, message, code = 'HTTP_ERROR') {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    // Track this instance in the WeakSet
    httpErrorInstances.add(this);
  }

  static isHttpError(instance) {
    return httpErrorInstances.has(instance) || instance instanceof HttpError;
  }
}

// Monkey-patch Symbol.hasInstance to make instanceof work across module boundaries
Object.defineProperty(HttpError, Symbol.hasInstance, {
  value: function(instance) {
    return httpErrorInstances.has(instance) || Error.prototype.isPrototypeOf(instance) && instance.name === 'HttpError';
  },
});



