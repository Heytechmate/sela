import React, { useState } from 'react'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import { CVData, Template } from './types'

const defaultCVData: CVData = {
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

const templates: Template[] = [
  {
    id: 'uk-standard',
    name: 'UK Standard',
    description: 'ATS-optimized UK recruitment format',
    preview: '/templates/uk-standard-preview.png'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and professional design',
    preview: '/templates/modern-preview.png'
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional academic style',
    preview: '/templates/classic-preview.png'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold and innovative design',
    preview: '/templates/creative-preview.png'
  }
]

function App() {
  const [cvData, setCVData] = useState<CVData>(defaultCVData)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('uk-standard')
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual')

  const handleCVDataChange = (newData: CVData) => {
    setCVData(newData)
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  return (
    <div className="cv-editor">
      <Toolbar 
        selectedTemplate={selectedTemplate}
        onTemplateChange={handleTemplateChange}
        templates={templates}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cvData={cvData}
        onCVDataChange={handleCVDataChange}
      />
      <div className="editor-pane">
        <div className="split-pane">
          <Editor 
            cvData={cvData}
            onCVDataChange={handleCVDataChange}
            activeTab={activeTab}
          />
          <Preview 
            cvData={cvData}
            template={selectedTemplate}
          />
        </div>
      </div>
    </div>
  )
}

export default App 