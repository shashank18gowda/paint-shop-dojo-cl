export interface Language {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ParticipantType {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Line {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Designation {
  id: string;
  code: string;
  name: string;
}

export interface Plant {
  id: string;
  code: string;
  name: string;
  location?: string;
}
