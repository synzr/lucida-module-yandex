import { YandexErrorObject } from './interfaces.js'

export class YandexError implements Error {
  constructor(
    public readonly name: string,
    public readonly message: string
  ) {}

  static createFromObject(object: YandexErrorObject): YandexError {
    return new YandexError(object.name, object.message)
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
