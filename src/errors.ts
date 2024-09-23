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
