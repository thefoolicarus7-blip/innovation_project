import {
  readCollection,
  writeCollection,
  generateId,
} from "../services/fileDb.js";

export interface CandidateData {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  yearsOfExperience: number;
  skills: string[];
  education: string;
  summary: string;
  resumeUrl?: string;
}

export class CandidateDoc {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  yearsOfExperience: number;
  skills: string[];
  education: string;
  summary: string;
  resumeUrl?: string;

  constructor(data: CandidateData) {
    this._id = data._id;
    this.id = data.id;
    this.fullName = data.fullName;
    this.email = data.email;
    this.phone = data.phone;
    this.yearsOfExperience = data.yearsOfExperience;
    this.skills = data.skills ?? [];
    this.education = data.education;
    this.summary = data.summary;
    this.resumeUrl = data.resumeUrl;
  }

  toData(): CandidateData {
    return {
      _id: this._id,
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      yearsOfExperience: this.yearsOfExperience,
      skills: this.skills,
      education: this.education,
      summary: this.summary,
      resumeUrl: this.resumeUrl,
    };
  }

  async save(): Promise<this> {
    const records = await readCollection<CandidateData>("candidates");
    const idx = records.findIndex((c) => c._id === this._id);
    const data = this.toData();
    if (idx >= 0) {
      records[idx] = data;
    } else {
      records.push(data);
    }
    await writeCollection("candidates", records);
    return this;
  }
}

interface CandidateQuery {
  id?: string;
}

const Candidate = {
  async findOne(query: CandidateQuery): Promise<CandidateDoc | null> {
    const records = await readCollection<CandidateData>("candidates");
    const found = records.find((c) => {
      if (query.id !== undefined && c.id !== query.id) return false;
      return true;
    });
    return found ? new CandidateDoc(found) : null;
  },

  async find(): Promise<CandidateDoc[]> {
    const records = await readCollection<CandidateData>("candidates");
    return records
      .slice()
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map((c) => new CandidateDoc(c));
  },

  async upsert(
    id: string,
    data: Omit<CandidateData, "_id" | "id">,
  ): Promise<CandidateDoc> {
    const records = await readCollection<CandidateData>("candidates");
    const idx = records.findIndex((c) => c.id === id);
    if (idx >= 0) {
      records[idx] = { ...records[idx], ...data, id };
      await writeCollection("candidates", records);
      return new CandidateDoc(records[idx]);
    }
    const newRecord: CandidateData = { _id: generateId(), id, ...data };
    records.push(newRecord);
    await writeCollection("candidates", records);
    return new CandidateDoc(newRecord);
  },
};

export default Candidate;
