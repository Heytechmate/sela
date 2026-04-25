import React from 'react'
import { Plus, Trash2, Edit3 } from 'lucide-react'
import { CVData, Experience, Education, Skill, Project, Certification, Language } from '../types'

interface VisualEditorProps {
  cvData: CVData
  onCVDataChange: (data: CVData) => void
}

const VisualEditor: React.FC<VisualEditorProps> = ({
  cvData,
  onCVDataChange
}) => {
  const updatePersonalInfo = (field: keyof CVData['personalInfo'], value: string | boolean) => {
    onCVDataChange({
      ...cvData,
      personalInfo: {
        ...cvData.personalInfo,
        [field]: value
      }
    })
  }

  const updateSummary = (value: string) => {
    onCVDataChange({
      ...cvData,
      summary: value
    })
  }

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }
    onCVDataChange({
      ...cvData,
      experience: [...cvData.experience, newExperience]
    })
  }

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    onCVDataChange({
      ...cvData,
      experience: cvData.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    })
  }

  const removeExperience = (id: string) => {
    onCVDataChange({
      ...cvData,
      experience: cvData.experience.filter(exp => exp.id !== id)
    })
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="cv-section">
        <h3 className="cv-section-title">Personal Information</h3>
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={cvData.personalInfo.name}
              onChange={(e) => updatePersonalInfo('name', e.target.value)}
              className="form-input"
              placeholder="John Doe"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={cvData.personalInfo.email}
              onChange={(e) => updatePersonalInfo('email', e.target.value)}
              className="form-input"
              placeholder="john.doe@example.com"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              value={cvData.personalInfo.phone}
              onChange={(e) => updatePersonalInfo('phone', e.target.value)}
              className="form-input"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              value={cvData.personalInfo.location}
              onChange={(e) => updatePersonalInfo('location', e.target.value)}
              className="form-input"
              placeholder="San Francisco, CA"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Website</label>
            <input
              type="url"
              value={cvData.personalInfo.website}
              onChange={(e) => updatePersonalInfo('website', e.target.value)}
              className="form-input"
              placeholder="https://johndoe.com"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">LinkedIn</label>
            <input
              type="url"
              value={cvData.personalInfo.linkedin}
              onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
              className="form-input"
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">GitHub</label>
            <input
              type="url"
              value={cvData.personalInfo.github}
              onChange={(e) => updatePersonalInfo('github', e.target.value)}
              className="form-input"
              placeholder="https://github.com/johndoe"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Postcode</label>
            <input
              type="text"
              value={cvData.personalInfo.postcode}
              onChange={(e) => updatePersonalInfo('postcode', e.target.value)}
              className="form-input"
              placeholder="SW1A 1AA"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              value={cvData.personalInfo.dateOfBirth}
              onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Nationality</label>
            <input
              type="text"
              value={cvData.personalInfo.nationality}
              onChange={(e) => updatePersonalInfo('nationality', e.target.value)}
              className="form-input"
              placeholder="British"
            />
          </div>
          
          <div className="form-group">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={cvData.personalInfo.drivingLicense}
                onChange={(e) => updatePersonalInfo('drivingLicense', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Full UK Driving License</span>
            </label>
          </div>
          
          <div className="form-group">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={cvData.personalInfo.rightToWork}
                onChange={(e) => updatePersonalInfo('rightToWork', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Right to Work in UK</span>
            </label>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="cv-section">
        <h3 className="cv-section-title">Professional Summary</h3>
        <div className="form-group">
          <textarea
            value={cvData.summary}
            onChange={(e) => updateSummary(e.target.value)}
            className="form-textarea"
            rows={4}
            placeholder="Write a brief professional summary highlighting your key strengths and career objectives..."
          />
        </div>
      </div>

      {/* Experience */}
      <div className="cv-section">
        <div className="flex items-center justify-between mb-3">
          <h3 className="cv-section-title">Work Experience</h3>
          <button
            onClick={addExperience}
            className="btn btn-sm btn-primary flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Experience</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {cvData.experience.map((exp) => (
            <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Experience</h4>
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    className="form-input"
                    placeholder="Company Name"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                    className="form-input"
                    placeholder="Job Title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      className="form-input"
                      disabled={exp.current}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Currently working here</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    className="form-textarea"
                    rows={3}
                    placeholder="Describe your responsibilities and achievements..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add more sections for Education, Skills, Projects, etc. */}
      <div className="cv-section">
        <h3 className="cv-section-title">Education</h3>
        <p className="text-sm text-gray-600">Education section coming soon...</p>
      </div>

      <div className="cv-section">
        <h3 className="cv-section-title">Skills</h3>
        <p className="text-sm text-gray-600">Skills section coming soon...</p>
      </div>

      <div className="cv-section">
        <h3 className="cv-section-title">Projects</h3>
        <p className="text-sm text-gray-600">Projects section coming soon...</p>
      </div>
    </div>
  )
}

export default VisualEditor 