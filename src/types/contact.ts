import { Collection, Attrs, Serializable } from './collection'
import { UserSession } from 'blockstack'

export class Contact extends Collection implements Serializable {

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

  static fromData(data: string) {
    return this.fromJSON(data)
  }

  static fromJSON(data: string) {
    return new Contact(JSON.parse(data))
  }

  identifierChanged: boolean = false
  previousIdentifier: string

  constructor(attrs: Attrs = {}) {
    super(attrs)
    if (!this.attrs.identifier) {
      this.attrs.identifier = this.constructIdentifier()
    }
  }

  collectionName(): string {
    return Contact.collectionName
  }

  constructIdentifier() {
    // Create identifier based on first and last name
    return `${this.attrs.firstName || ''} ${this.attrs.lastName || ''}`
  }

  serialize() {
    // Serialize to JSON
    return this.toJSON()
  }

  toJSON() {
    return JSON.stringify(this.attrs)
  }

  async save(userSession?: UserSession) {
    // Delete old file on save if object identifier changes
    return super.save(userSession)
      .then((result) => {
        if (this.identifierChanged) {
          return Contact.delete(this.previousIdentifier, userSession)
            .then(() => {
              this.identifierChanged = false
              return result
            })
        } else {
          return result
        }
      })
  }

  onValueChange(key: string, value: any) {
    if (key === 'firstName') {
      this.previousIdentifier = this.attrs.identifier
      this.attrs.identifier = this.constructIdentifier()
      this.identifierChanged = true
    }
    else if (key === 'lastName') {
      this.previousIdentifier = this.attrs.identifier
      this.attrs.identifier = this.constructIdentifier()
      this.identifierChanged = true
    }
  }
}
