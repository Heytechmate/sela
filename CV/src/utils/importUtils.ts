import { CVData } from '../types'

export interface ImportOptions {
  format: 'json' | 'word' | 'pdf'
  validateData?: boolean
}

export interface ImportResult {
  success: boolean
  data?: CVData
  error?: string
  warnings?: string[]
}

export const importFromJSON = async (file: File): Promise<ImportResult> => {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    const validation = validateCVData(data)
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid CV data: ${validation.errors.join(', ')}`
      }
    }
    
    return {
      success: true,
      data: data as CVData,
      warnings: validation.warnings
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse JSON file'
    }
  }
}

export const importFromWord = async (file: File): Promise<ImportResult> => {
  try {
    // For Word documents, we'll need to extract text content
    // This is a simplified implementation
    const arrayBuffer = await file.arrayBuffer()
    const text = await extractTextFromWord(arrayBuffer)
    
    const cvData = parseWordContent(text)
    const validation = validateCVData(cvData)
    
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid CV data: ${validation.errors.join(', ')}`
      }
    }
    
    return {
      success: true,
      data: cvData as CVData,
      warnings: validation.warnings
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse Word document'
    }
  }
}

export const importFromText = async (file: File): Promise<ImportResult> => {
  try {
    const text = await file.text()
    const cvData = parseTextContent(text)
    const validation = validateCVData(cvData)
    
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid CV data: ${validation.errors.join(', ')}`
      }
    }
    
    return {
      success: true,
      data: cvData as CVData,
      warnings: validation.warnings
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse text file'
    }
  }
}

export const importCV = async (
  file: File, 
  options: ImportOptions = { format: 'json', validateData: true }
): Promise<ImportResult> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  
  switch (options.format) {
    case 'json':
      return await importFromJSON(file)
      
    case 'word':
      return await importFromWord(file)
      
    default:
      // Auto-detect format based on file extension
      if (fileExtension === 'json') {
        return await importFromJSON(file)
      } else if (['doc', 'docx'].includes(fileExtension || '')) {
        return await importFromWord(file)
      } else if (['txt'].includes(fileExtension || '')) {
        return await importFromText(file)
      } else {
        return {
          success: false,
          error: `Unsupported file format: ${fileExtension}`
        }
      }
  }
}

const validateCVData = (data: any): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check required fields
  if (!data.personalInfo) {
    errors.push('Personal information is missing')
  } else {
    if (!data.personalInfo.name) {
      errors.push('Name is required')
    }
    if (!data.personalInfo.email) {
      errors.push('Email is required')
    }
  }
  
  // Check data structure
  if (!Array.isArray(data.experience)) {
    errors.push('Experience must be an array')
  }
  
  if (!Array.isArray(data.education)) {
    errors.push('Education must be an array')
  }
  
  if (!Array.isArray(data.skills)) {
    errors.push('Skills must be an array')
  }
  
  // Check for warnings
  if (!data.summary) {
    warnings.push('Professional summary is missing')
  }
  
  if (!data.experience || data.experience.length === 0) {
    warnings.push('No work experience found')
  }
  
  if (!data.education || data.education.length === 0) {
    warnings.push('No education information found')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

const extractTextFromWord = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // This is a simplified implementation
  // In a real application, you would use a library like mammoth.js
  // For now, we'll return a placeholder
  return 'Word document content extraction not implemented'
}

const parseWordContent = (text: string): Partial<CVData> => {
  // Parse Word document content and extract CV data
  // This is a simplified implementation
  const cvData: Partial<CVData> = {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      postcode: '',
      website: '',
      linkedin: '',
      github: '',
      dateOfBirth: '',
      nationality: '',
      drivingLicense: false,
      rightToWork: false
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    references: [],
    interests: [],
    availability: '',
    salary: ''
  }
  
  // Extract information from text using regex patterns
  const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m)
  if (nameMatch) {
    cvData.personalInfo!.name = nameMatch[1]
  }
  
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  if (emailMatch) {
    cvData.personalInfo!.email = emailMatch[0]
  }
  
  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phoneMatch) {
    cvData.personalInfo!.phone = phoneMatch[0]
  }
  
  return cvData
}

const parseTextContent = (text: string): Partial<CVData> => {
  // Parse plain text content and extract CV data
  const cvData: Partial<CVData> = {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      postcode: '',
      website: '',
      linkedin: '',
      github: '',
      dateOfBirth: '',
      nationality: '',
      drivingLicense: false,
      rightToWork: false
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    references: [],
    interests: [],
    availability: '',
    salary: ''
  }
  
  // Extract information from text using regex patterns
  const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m)
  if (nameMatch) {
    cvData.personalInfo!.name = nameMatch[1]
  }
  
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  if (emailMatch) {
    cvData.personalInfo!.email = emailMatch[0]
  }
  
  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phoneMatch) {
    cvData.personalInfo!.phone = phoneMatch[0]
  }
  
  return cvData
}

export const createSampleCV = (): CVData => {
  return {
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+44 20 7123 4567',
      location: 'London, UK',
      postcode: 'SW1A 1AA',
      website: 'https://johndoe.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      dateOfBirth: '1990-01-01',
      nationality: 'British',
      drivingLicense: true,
      rightToWork: true
    },
    summary: 'Experienced software developer with 5+ years in web development, specializing in React, Node.js, and cloud technologies. Passionate about creating scalable solutions and leading development teams.',
    experience: [
      {
        id: '1',
        company: 'Tech Solutions Ltd',
        position: 'Senior Software Developer',
        location: 'London, UK',
        startDate: '2022-01',
        endDate: '',
        current: true,
        description: 'Led development of enterprise web applications using React and Node.js. Managed a team of 5 developers and implemented CI/CD pipelines.'
      }
    ],
    education: [
      {
        id: '1',
        institution: 'University of London',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'London, UK',
        startDate: '2018-09',
        endDate: '2021-06',
        current: false,
        gpa: '2:1',
        description: 'Specialized in software engineering and web development.'
      }
    ],
    skills: [
      { id: '1', name: 'JavaScript', level: 'expert', category: 'Programming' },
      { id: '2', name: 'React', level: 'advanced', category: 'Frontend' },
      { id: '3', name: 'Node.js', level: 'advanced', category: 'Backend' }
    ],
    projects: [],
    certifications: [],
    languages: [
      { id: '1', name: 'English', level: 'native' }
    ],
    references: [],
    interests: ['Web Development', 'Open Source', 'Technology'],
    availability: 'Immediate',
    salary: '£45,000 - £55,000'
  }
} 