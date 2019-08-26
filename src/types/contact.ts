import { Collection, Attrs, Serializable } from './collection'

export class Contact extends Collection implements Serializable {

  static get collectionName(): string {
    return 'contact'
  }

  static schemaVersion = '1.0'

  static schema = {
    schemaVersion: String,
    identifier: String,
    name: String,
    blockstackID: String,
    email: String,
    website: String,
    address: String,
    telephone: String,
    organization: String
  }

  constructor(attrs: Attrs = {}) {
    super(attrs)
  }

  collectionName(): string {
    return Contact.collectionName
  }
  
  static fromData(data: string) {
    return this.fromJSON(data)
  }

  static fromJSON(data: string) {
    return new Contact(JSON.parse(data))
  }

  serialize() {
    return this.toJSON()
  }

  toJSON() {
    return JSON.stringify(this.attrs)
  }
}
