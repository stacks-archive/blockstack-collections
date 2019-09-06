import { Collection, Attrs, Serializable } from "./collection";
import { Contact } from "./contact";

export class GitRepository extends Collection implements Serializable {
  static get collectionName(): string {
    return "gitRepository";
  }

  static schemaVersion = "1.0";

  static schema = {
    schemaVersion: String,
    identifier: String,
    name: String,
    owner: Contact,
    url: String,
    description: String,
    languages: Array,
  };

  constructor(attrs: Attrs = {}) {
    super(attrs);
  }

  collectionName(): string {
    return GitRepository.collectionName;
  }

  static fromData(data: string) {
    return this.fromJSON(data);
  }

  static fromJSON(data: string) {
    return new GitRepository(JSON.parse(data));
  }

  serialize() {
    return this.toJSON();
  }

  toJSON() {
    return JSON.stringify(this.attrs);
  }
}
