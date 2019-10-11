import { 
  UserSession, 
  getFile,
  putFile,
  deleteFile,
  listFilesLoop,
  getPublicKeyFromPrivate,
  GaiaHubConfig
} from 'blockstack'

import * as uuid from 'uuid/v4'

export const COLLECTION_GAIA_PREFIX = 'collection'
export const COLLECTION_INDEX_FILENAME = 'index.json'
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
  private singleFile

  static schemaVersion = '1.0'
  static singleFile: boolean = false

  public static schema: Schema = {
    identifier: String
  }

  constructor(attrs: Attrs = {}) {
    const { schema, singleFile } = this.constructor as typeof Collection
    this.schema = schema
    this.singleFile = singleFile

    this.attrs = {
      ...attrs
    };

    if (!this.attrs.identifier) {
      this.attrs.identifier = uuid()
    }

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
   * Returns an instance of the collection object created from an object containing 
   * all of the attributes
   * 
   * @returns Returns a collection object
   */
  static fromObject(object: object) {
    throw new Error('Required abstract method fromObject was not implemented')
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
    const config = await userSession.getCollectionConfigs(this.collectionName)
    const hubConfig = config.hubConfig
    const opt = {
      gaiaHubConfig: hubConfig,
      decrypt: config.encryptionKey
    }

    if (this.singleFile) {
      // Single file collections
      const indexFileName = COLLECTION_GAIA_PREFIX + '/' + COLLECTION_INDEX_FILENAME
      return getFile(indexFileName, opt, userSession)
        .then((fileContent) => {
          if (fileContent) {
            const indexFile = JSON.parse(fileContent as string)
            if (indexFile[identifier]) {
              return this.fromObject(indexFile[identifier])
            } else {
              throw new Error('Collection item not found')
            }
          } else {
            throw new Error('Collection item not found')
          }
        })
    } else {
      // Multi-file collections
      let normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + identifier
      return getFile(normalizedIdentifier, opt, userSession)
        .then((fileContent) => {
          if (fileContent) {
            return this.fromData(fileContent)
          } else {
            throw new Error('Collection item not found')
          }
        })
    }


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
    const config = await userSession.getCollectionConfigs(this.collectionName)
    const hubConfig = config.hubConfig
    const opt = {
      gaiaHubConfig: hubConfig,
      decrypt: config.encryptionKey
    }

    if (this.singleFile) {
      // Single file collections
      const indexFile = COLLECTION_GAIA_PREFIX + '/' + COLLECTION_INDEX_FILENAME
      return getFile(indexFile, opt, userSession)
      .then((fileContent) => {
        if (fileContent) {
          const indexFile = JSON.parse(fileContent as string)
          if (indexFile instanceof Object) { 
            const keys = Object.keys(indexFile)
            keys.forEach(key => {
              callback(key)
            });
          } else {
            return 0
          }
        } else {
          return 0
        }
      })
      .catch((error) => {
        throw new Error('Error listing collection: Could not fetch index file.')
      })
    } else {
      // Multi-file collections
      return listFilesLoop(userSession, hubConfig, null, 0, 0, false, (path) => {
        const collectionGaiaPathPrefix = COLLECTION_GAIA_PREFIX + '/'
        if (path.startsWith(collectionGaiaPathPrefix)) {
          // Remove collection/ prefix from file names
          const identifier = path.substr(collectionGaiaPathPrefix.length)
          return callback(identifier)
        } else {
          // Skip non-collection prefix files
          return true
        }
      })
    }
  }

  static async deleteCollectionItem(    
    identifier: string, 
    hubConfig: GaiaHubConfig, 
    encryptionKey: string,
    userSession?: UserSession
  ) {
    const getFileOpt = {
      gaiaHubConfig: hubConfig,
      decrypt: encryptionKey
    }

    const putFileOpt = {
      gaiaHubConfig: hubConfig,
      encrypt: getPublicKeyFromPrivate(encryptionKey)
    }

    const indexFileName = COLLECTION_GAIA_PREFIX + '/' + COLLECTION_INDEX_FILENAME
    return getFile(indexFileName, getFileOpt, userSession)
      .then((fileContent) => {
        let newIndexFile
        if (fileContent) {
          const indexFile = JSON.parse(fileContent as string)
          if (indexFile[identifier]) {
            delete indexFile[identifier]
            newIndexFile = JSON.stringify(indexFile)
            return putFile(indexFileName, newIndexFile, putFileOpt, userSession)
              .then(() => Promise.resolve())
          } else {
            throw new Error('Error deleting from collection. Item does not exist.')
          }
        } else {
          throw new Error('Error deleting from collection. Item does not exist.')
        }
      })
  }

  static async deleteCollectionFile(
    identifier: string, 
    hubConfig: GaiaHubConfig, 
    userSession?: UserSession
  ) {
    const opt = {
      gaiaHubConfig: hubConfig
    }
    const normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + identifier
    return deleteFile(normalizedIdentifier, opt, userSession)
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
    const config = await userSession.getCollectionConfigs(this.collectionName)
    if (this.singleFile) {
      return this.deleteCollectionItem(identifier, config.hubConfig, config.encryptionKey, userSession)
    } else {
      return this.deleteCollectionFile(identifier, config.hubConfig, userSession)
    }
    
    // const opt = {
    //   gaiaHubConfig: config.hubConfig
    // }
    // const normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + identifier
    // return deleteFile(normalizedIdentifier, opt, userSession)
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
    const config = await userSession.getCollectionConfigs(this.collectionName())
    const hubConfig = config.hubConfig
    const opt = {
      gaiaHubConfig: hubConfig,
      encrypt: getPublicKeyFromPrivate(config.encryptionKey)
    }
    const getFileOpt = {
      gaiaHubConfig: hubConfig,
      decrypt: config.encryptionKey
    }

    if (this.singleFile) {
      // Single file collections
      const indexFileName = COLLECTION_GAIA_PREFIX + '/' + COLLECTION_INDEX_FILENAME
      return getFile(indexFileName, getFileOpt, userSession)
        .then((fileContent) => {
          let newIndexFile
          if (fileContent) {
            // Add to existing index file
            const indexFile = JSON.parse(fileContent as string)
            indexFile[this.attrs.identifier] = this.attrs
            newIndexFile = JSON.stringify(indexFile)
          } else {
            // Create new index file
            newIndexFile = JSON.stringify({ [this.attrs.identifier]: this.attrs })
          }
          return putFile(indexFileName, newIndexFile, opt, userSession).then(() => {
            return this.attrs.identifier
          })
        })
    } else {
      // Multi-file collections
      const item = this.serialize()
      const normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + this.attrs.identifier
      return putFile(normalizedIdentifier, item, opt, userSession).then(() => {
        return this.attrs.identifier
      })
    }
  }

  /**
   * Deletes the object from the collection. 
   * @param {UserSession} userSession? - Optional user session object
   * 
   * @returns Resolves when the file has been removed or rejects with an error.
   */
  async delete(userSession?: UserSession) {
    userSession = userSession || new UserSession()
    const config = await userSession.getCollectionConfigs(this.collectionName())
    if (this.singleFile) {
      return Collection.deleteCollectionItem(
        this.attrs.identifier, 
        config.hubConfig, 
        config.encryptionKey, 
        userSession
      )
    } else {
      return Collection.deleteCollectionFile(
        this.attrs.identifier, 
        config.hubConfig, 
        userSession
      )
    }

    // const opt = {
    //   gaiaHubConfig: hubConfig
    // }
    // const normalizedIdentifier = COLLECTION_GAIA_PREFIX + '/' + this.attrs.identifier
    // return deleteFile(normalizedIdentifier, opt, userSession)
  }


  /**
   * Serialize the collection object data for storage
   * 
   * @returns Returns serialized string data
   */
  abstract serialize()
}