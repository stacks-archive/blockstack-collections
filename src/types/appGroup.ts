import { Collection, Attrs, Serializable } from "./collection";
import { AppLink } from "./appLink";

export class AppGroup extends Collection implements Serializable {
  static get collectionName(): string {
    return "appGroup";
  }

  static schemaVersion = "1.0";

  static schema = {
    schemaVersion: String,
    identifier: String,
    name: String,
    apps: Array(AppLink),
    description: String
  };

  constructor(attrs: Attrs = {}) {
    super(attrs);
  }

  collectionName(): string {
    return AppGroup.collectionName;
  }

  static fromData(data: string) {
    return this.fromJSON(data);
  }

  static fromJSON(data: string) {
    return new AppGroup(JSON.parse(data));
  }

  serialize() {
    return this.toJSON();
  }

  toJSON() {
    return JSON.stringify(this.attrs);
  }
}
