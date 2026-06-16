import {
  readCollection,
  writeCollection,
  generateId,
} from "../services/fileDb.js";

type UserRole = "User" | "Admin" | "company";

export interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isVerified: string;
  role: UserRole;
  cvUrl?: string;
  idUrl?: string;
  profileImageUrl?: string;
  skills: string[];
}

export class UserDoc {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isVerified: string;
  role: UserRole;
  cvUrl?: string;
  idUrl?: string;
  profileImageUrl?: string;
  skills: string[];

  constructor(data: UserData) {
    this._id = data._id;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.password = data.password;
    this.isVerified = data.isVerified;
    this.role = data.role;
    this.cvUrl = data.cvUrl;
    this.idUrl = data.idUrl;
    this.profileImageUrl = data.profileImageUrl;
    this.skills = data.skills ?? [];
  }

  toData(): UserData {
    return {
      _id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      isVerified: this.isVerified,
      role: this.role,
      cvUrl: this.cvUrl,
      idUrl: this.idUrl,
      profileImageUrl: this.profileImageUrl,
      skills: this.skills,
    };
  }

  async save(): Promise<this> {
    const users = await readCollection<UserData>("users");
    const idx = users.findIndex((u) => u._id === this._id);
    const data = this.toData();
    if (idx >= 0) {
      users[idx] = data;
    } else {
      users.push(data);
    }
    await writeCollection("users", users);
    return this;
  }
}

type RoleQuery = { $in: string[] };

interface UserQuery {
  email?: string;
  role?: UserRole | RoleQuery;
  isVerified?: string;
}

function matchesQuery(user: UserData, query: UserQuery): boolean {
  if (query.email !== undefined && user.email !== query.email) return false;
  if (
    query.isVerified !== undefined &&
    user.isVerified !== query.isVerified
  )
    return false;
  if (query.role !== undefined) {
    if (typeof query.role === "object" && "$in" in query.role) {
      if (!query.role.$in.includes(user.role)) return false;
    } else {
      if (user.role !== query.role) return false;
    }
  }
  return true;
}

class FindByIdQuery implements PromiseLike<UserDoc | null> {
  private promise: Promise<UserDoc | null>;

  constructor(id: string) {
    this.promise = readCollection<UserData>("users").then((users) => {
      const found = users.find((u) => u._id === id);
      return found ? new UserDoc(found) : null;
    });
  }

  select(fields: string): Promise<UserDoc | null> {
    return this.promise.then((user) => {
      if (!user) return null;
      if (fields.includes("-password")) {
        const copy = new UserDoc({ ...user.toData() });
        (copy as unknown as Record<string, unknown>).password = undefined;
        return copy;
      }
      return user;
    });
  }

  then<TResult1 = UserDoc | null, TResult2 = never>(
    onfulfilled?:
      | ((value: UserDoc | null) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}

const User = {
  async findOne(query: UserQuery): Promise<UserDoc | null> {
    const users = await readCollection<UserData>("users");
    const found = users.find((u) => matchesQuery(u, query));
    return found ? new UserDoc(found) : null;
  },

  findById(id: string): FindByIdQuery {
    return new FindByIdQuery(id);
  },

  async create(data: Omit<UserData, "_id">): Promise<UserDoc> {
    const users = await readCollection<UserData>("users");
    const newUser: UserData = {
      skills: [],
      ...data,
      _id: generateId(),
    };
    users.push(newUser);
    await writeCollection("users", users);
    return new UserDoc(newUser);
  },

  async find(query: UserQuery): Promise<UserDoc[]> {
    const users = await readCollection<UserData>("users");
    return users
      .filter((u) => matchesQuery(u, query))
      .map((u) => new UserDoc(u));
  },
};

export default User;
