export interface PersonalInfo {
  name: string
  email: string
  phone: string
  location: string
  postcode: string
  website: string
  linkedin: string
  github: string
  dateOfBirth?: string
  nationality?: string
  drivingLicense?: boolean
  rightToWork?: boolean
}

export interface Experience {
  id: string
  company: string
  position: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  gpa?: string
  description: string
}

export interface Skill {
  id: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  category: string
}

export interface Project {
  id: string
  name: string
  description: string
  technologies: string[]
  url?: string
  github?: string
  startDate: string
  endDate: string
  current: boolean
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  url?: string
  description: string
}

export interface Language {
  id: string
  name: string
  level: 'basic' | 'conversational' | 'fluent' | 'native'
}

export interface CVData {
  personalInfo: PersonalInfo
  summary: string
  experience: Experience[]
  education: Education[]
  skills: Skill[]
  projects: Project[]
  certifications: Certification[]
  languages: Language[]
  references?: Reference[]
  interests?: string[]
  availability?: string
  salary?: string
}

export interface Reference {
  id: string
  name: string
  position: string
  company: string
  email: string
  phone: string
  relationship: string
}

export interface JobBoard {
  id: string
  name: string
  url: string
  status: 'pending' | 'success' | 'failed'
  progress: number
}

export interface ATSAnalysis {
  score: number
  keywords: string[]
  missingKeywords: string[]
  suggestions: string[]
  jobMatch: number
}

export interface Template {
  id: string
  name: string
  description: string
  preview: string
}

export type EditorTab = 'visual' | 'code' 