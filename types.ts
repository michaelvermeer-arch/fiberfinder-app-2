
export interface Contact {
  name: string;
  title: string;
}

export interface Project {
  projectName: string;
  company: string;
  location: string;
  summary: string;
  sourceUrl: string;
  contacts: Contact[];
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}
