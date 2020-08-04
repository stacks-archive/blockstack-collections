import { Collection, Attrs, Serializable } from "./collection";

export class AppLink extends Collection implements Serializable {
  static get collectionName(): string {
    return "appLink";
  }

  static schemaVersion = "1.0";

  static schema = {
    schemaVersion: String,
    identifier: String, // auth domain
    name: String,
    url: String,
    description: String
  };

  constructor(attrs: Attrs = {}) {
    super(attrs);
  }

  collectionName(): string {
    return AppLink.collectionName;
  }

  static fromData(data: string) {
    return this.fromJSON(data);
  }

  static fromJSON(data: string) {
    return new AppLink(JSON.parse(data));
  }

  serialize() {
    return this.toJSON();
  }

  toJSON() {
    return JSON.stringify(this.attrs);
  }
}
