export interface SchemaAttribute {
  type: string | Record<string, any> | any[] | number | boolean;
}

export interface Schema {
  [key: string]: SchemaAttribute | string | Record<string, any> | any[] | number | boolean;
}

export interface Attrs {
  createdAt?: number,
  updatedAt?: number,
  signingKeyId?: string,
  _id?: string
  [key: string]: any,
}

export interface Serializable {
  serialize()
}

const COLLECTION_SCOPE_PREFIX = 'collection.'

export abstract class Collection implements Serializable {

  constructor(attrs: Attrs = {}) {
    const { schema } = this.constructor as typeof Collection
    this.schema = schema

    this.attrs = {
      ...attrs
    };
  }

  public attrs: Attrs

  static get collectionName(): string {
    throw new Error('Required abstract method collectionName was not implemented')
  }

  static get scope() {
    return `${COLLECTION_SCOPE_PREFIX}${this.collectionName}`
  }

  static fromData(data: string) {
    throw new Error('Required abstract method fromData was not implemented')
  }

  public collectionName(): string {
    throw new Error('Required abstract method collectionName was not implemented')
  }

  abstract serialize()

  public static schema: Schema
  public schema: Schema
}