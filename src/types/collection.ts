import { 
  UserSession, 
  getFile,
  putFile,
  deleteFile,
  listFilesLoop
} from 'blockstack'

export const COLLECTION_GAIA_PREFIX = 'collection'

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

  public collectionName(): string {
    throw new Error('Required abstract method collectionName was not implemented')
  }

  static fromData(data: string | ArrayBuffer) {
    throw new Error('Required abstract method fromData was not implemented')
  }

  static async get(identifier: string, userSession?: UserSession) {
    userSession = userSession || new UserSession()
    let hubConfig = await userSession.getCollectionGaiaHubConnection(this.collectionName)
    let normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + identifier
    let opt = {
      gaiaHubConfig: hubConfig
    }
    return getFile(normalizedIdentifier, opt, userSession)
      .then((fileContent) => {
        if (fileContent) {
          return this.fromData(fileContent)
        } else {
          throw new Error('Collection item not found')
        }
      })
  }

  static async list(callback: (name: string) => boolean, userSession?: UserSession) {
    userSession = userSession || new UserSession()
    let hubConfig = await userSession.getCollectionGaiaHubConnection(this.collectionName)
    return listFilesLoop(userSession, hubConfig, null, 0, 0, (name) => {
      let collectionGaiaPathPrefix = COLLECTION_GAIA_PREFIX + '/'
      if (name.startsWith(collectionGaiaPathPrefix)) {
        // Remove collection/ prefix from file names
        let identifier = name.substr(collectionGaiaPathPrefix.length)
        return callback(identifier)
      } else {
        // Skip non-collection prefix files
        return true
      }
    })
  }

  async save(userSession?: UserSession) {
    userSession = userSession || new UserSession()
    let hubConfig = await userSession.getCollectionGaiaHubConnection(this.collectionName())
    let file = this.serialize()
    let normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + this.attrs.identifier
    let opt = {
      gaiaHubConfig: hubConfig
    }
    return putFile(normalizedIdentifier, file, opt, userSession)
  }

  async delete(userSession?: UserSession) {
    userSession = userSession || new UserSession()
    let hubConfig = await userSession.getCollectionGaiaHubConnection(this.collectionName())
    let opt = {
      gaiaHubConfig: hubConfig
    }
    const normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + this.attrs.identifier
    return deleteFile(normalizedIdentifier, opt, userSession)
  }

  abstract serialize()

  public static schema: Schema
  public schema: Schema
}