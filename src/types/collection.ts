import { 
  UserSession, 
  getFile,
  putFile,
  deleteFile,
  listFilesLoop,
  getPublicKeyFromPrivate
} from 'blockstack'

export const COLLECTION_GAIA_PREFIX = 'collection'
export const COLLECTION_SCOPE_PREFIX = 'collection.'

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

export abstract class Collection implements Serializable {

  public attrs: Attrs
  public schema: Schema

  static schemaVersion = '1.0'

  public static schema: Schema = {
    identifier: String
  }

  constructor(attrs: Attrs = {}) {
    const { schema } = this.constructor as typeof Collection
    this.schema = schema

    this.attrs = {
      ...attrs
    };

    this.defineDynamicGetterSetters(this.schema, this.attrs)
  }

  /**
   * Define the getter and setters for each attribute in the schema
   */
  defineDynamicGetterSetters(schema: Schema, attrs: Attrs = {}) {
    for(let key in schema) {
      Object.defineProperty(this, key, {
        get: () => this.attrs[key],
        set: (value:any) => {
          if (this.attrs[key] !== value) {
            this.attrs[key] = value
            this.onValueChange(key, value)
          }
        }
      })
    }
  }

  /**
   * Invoked when a property changes, subclass this to observe object property changes
   */
  protected onValueChange(key: string, value: any) {
    return 
  }

  /**
   * Returns the collection type name
   * 
   * @returns Returns the collection type name as a string
   */
  static get collectionName(): string {
    throw new Error('Required abstract method collectionName was not implemented')
  }

  /**
   * Returns the collection scope string
   * 
   * @returns Returns the collection scope string
   */
  static get scope() {
    return `${COLLECTION_SCOPE_PREFIX}${this.collectionName}`
  }

  /**
   * Returns the collection type name
   * 
   * @returns Returns the collection type name as a string
   */
  public collectionName(): string {
    throw new Error('Required abstract method collectionName was not implemented')
  }

  /**
   * Returns an instance of the collection object created from input data
   * 
   * @returns Returns a collection object
   */
  static fromData(data: string | ArrayBuffer) {
    throw new Error('Required abstract method fromData was not implemented')
  }

  /**
   * Retrieves a collection object from the collection data store
   * @param {String} identifier - The identifier of the collection object to retrieve
   * @param {UserSession} userSession? - Optional user session object
   * 
   * @returns {Promise} that resolves to the a collection obbject or rejects with an error
   */
  static async get(identifier: string, userSession?: UserSession) {
    userSession = userSession || new UserSession()
    let config = await userSession.getCollectionConfigs(this.collectionName)
    let hubConfig = config.hubConfig
    let normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + identifier
    let opt = {
      gaiaHubConfig: hubConfig,
      decrypt: config.encryptionKey
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

  /**
   * List the objects in a collection
   * @param {function} callback - a callback to invoke on each object identifier that
   * returns `true` to continue the listing operation or `false` to end it
   * 
   * @returns {Promise} that resolves to the number of objects listed
   */
  static async list(callback: (identifier: string) => boolean, userSession?: UserSession) {
    userSession = userSession || new UserSession()
    let config = await userSession.getCollectionConfigs(this.collectionName)
    let hubConfig = config.hubConfig
    return listFilesLoop(userSession, hubConfig, null, 0, 0, false, (path) => {
      let collectionGaiaPathPrefix = COLLECTION_GAIA_PREFIX + '/'
      if (path.startsWith(collectionGaiaPathPrefix)) {
        // Remove collection/ prefix from file names
        let identifier = path.substr(collectionGaiaPathPrefix.length)
        return callback(identifier)
      } else {
        // Skip non-collection prefix files
        return true
      }
    })
  }

  /**
   * Deletes the object from the collection. 
   * @param {String} identifier - The identifier of the collection object to delete
   * @param {UserSession} userSession? - Optional user session object
   * 
   * @returns Resolves when the file has been removed or rejects with an error.
   */
  static async delete(identifier: string, userSession?: UserSession) {
    userSession = userSession || new UserSession()
    let config = await userSession.getCollectionConfigs(this.collectionName)
    let hubConfig = config.hubConfig
    let opt = {
      gaiaHubConfig: hubConfig
    }
    const normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + identifier
    return deleteFile(normalizedIdentifier, opt, userSession)
  }

  /**
   * Stores the collection object to collection data store.
   * @param {UserSession} userSession? - Optional user session object
   * 
   * @returns {Promise} that resolves to the object identifier if the operation succeed 
   * and rejects if it failed
   */
  async save(userSession?: UserSession) {
    userSession = userSession || new UserSession()
    let config = await userSession.getCollectionConfigs(this.collectionName())
    let hubConfig = config.hubConfig
    let identifier = this.constructIdentifier()
    this.attrs.identifier = identifier
    let file = this.serialize()
    let normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + identifier
    let opt = {
      gaiaHubConfig: hubConfig,
      encrypt: getPublicKeyFromPrivate(config.encryptionKey)
    }
    return putFile(normalizedIdentifier, file, opt, userSession).then(() => {
      return identifier
    })
  }

  /**
   * Deletes the object from the collection. 
   * @param {UserSession} userSession? - Optional user session object
   * 
   * @returns Resolves when the file has been removed or rejects with an error.
   */
  async delete(userSession?: UserSession) {
    userSession = userSession || new UserSession()
    let config = await userSession.getCollectionConfigs(this.collectionName())
    let hubConfig = config.hubConfig
    let opt = {
      gaiaHubConfig: hubConfig
    }
    const normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + this.attrs.identifier
    return deleteFile(normalizedIdentifier, opt, userSession)
  }

  /**
   * Build an identifier to be used as the filename of the collection object
   * 
   * @returns Returns an identifier string
   */
  abstract constructIdentifier()

  /**
   * Serialize the collection object data for storage
   * 
   * @returns Returns serialized string data
   */
  abstract serialize()
}