import { Collection, Attrs, Serializable } from './collection'
import { UserSession } from 'blockstack'

export class Contact extends Collection implements Serializable {

  static singleFile = true

  static get collectionName(): string {
    return 'contact'
  }

  static schema = {
    identifier: String,
    firstName: String,
    lastName: String,
    blockstackID: String,
    email: String,
    website: String,
    address: String,
    telephone: String,
    organization: String
  }

  static fromObject(object: object) {
    return new Contact(object)
  }

  static fromData(data: string) {
    return this.fromJSON(data)
  }

  static fromJSON(data: string) {
    return new Contact(JSON.parse(data))
  }

  collectionName(): string {
    return Contact.collectionName
  }

  serialize() {
    // Serialize to JSON
    return this.toJSON()
  }

  toJSON() {
    return JSON.stringify(this.attrs)
  }

}
