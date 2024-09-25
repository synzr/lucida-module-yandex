import { SigningRequestResult } from './interfaces/internal.js'
import { APIErrorObject } from './interfaces/api.js'

export class APIError implements Error {
  constructor(
    public readonly name: string,
    public readonly message: string
  ) {}

  static createFromObject(object: APIErrorObject): APIError {
    return new APIError(object.name, object.message)
  }
}

export class BadServerResponseError implements Error {
  name = 'BadServerResponseError'

  constructor(
    public readonly message: string,
    public readonly response: Response
  ) {}

  getHeaders(): Headers {
    return this.response.headers
  }

  getStatusCode(): number {
    return this.response.status
  }

  async getTextResponse(): Promise<string> {
    return await this.response.text()
  }
}

export class SmartCaptchaError extends BadServerResponseError {
  name = 'SmartCaptchaError'
}

export class BadSignatureError implements Error {
  name = 'BadSignatureError'
  message =
    'Bad signature is provided to server. ' +
    'Please report this error to maintainer(s)!'

  constructor(public readonly signingRequest: SigningRequestResult) {}
}
