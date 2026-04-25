import React from 'react'
import { CVData } from '../../types'
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react'

interface ModernTemplateProps {
  cvData: CVData
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ cvData }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  const formatDateRange = (startDate: string, endDate: string, current: boolean) => {
    const start = formatDate(startDate)
    const end = current ? 'Present' : formatDate(endDate)
    return `${start} - ${end}`
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {cvData.personalInfo.name || 'Your Name'}
        </h1>
        
        {cvData.personalInfo.position && (
          <p className="text-xl text-primary-600 font-medium mb-4">
            {cvData.personalInfo.position}
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="space-y-2">
            {cvData.personalInfo.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{cvData.personalInfo.email}</span>
              </div>
            )}
            {cvData.personalInfo.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>{cvData.personalInfo.phone}</span>
              </div>
            )}
            {cvData.personalInfo.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{cvData.personalInfo.location}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {cvData.personalInfo.website && (
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>{cvData.personalInfo.website}</span>
              </div>
            )}
            {cvData.personalInfo.linkedin && (
              <div className="flex items-center space-x-2">
                <Linkedin className="w-4 h-4" />
                <span>{cvData.personalInfo.linkedin}</span>
              </div>
            )}
            {cvData.personalInfo.github && (
              <div className="flex items-center space-x-2">
                <Github className="w-4 h-4" />
                <span>{cvData.personalInfo.github}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Summary */}
      {cvData.summary && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {cvData.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {cvData.experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Work Experience
          </h2>
          <div className="space-y-6">
            {cvData.experience.map((exp) => (
              <div key={exp.id} className="border-l-4 border-primary-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {exp.position}
                    </h3>
                    <p className="text-primary-600 font-medium">
                      {exp.company}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-gray-700 leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {cvData.education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Education
          </h2>
          <div className="space-y-4">
            {cvData.education.map((edu) => (
              <div key={edu.id} className="border-l-4 border-gray-300 pl-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {edu.degree} in {edu.field}
                    </h3>
                    <p className="text-primary-600 font-medium">
                      {edu.institution}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                  </span>
                </div>
                {edu.description && (
                  <p className="text-gray-700 text-sm">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {cvData.skills.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cvData.skills.map((skill) => (
              <div key={skill.id} className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{skill.name}</span>
                <span className="text-sm text-gray-500 capitalize">{skill.level}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {cvData.projects.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Projects
          </h2>
          <div className="space-y-4">
            {cvData.projects.map((project) => (
              <div key={project.id} className="border-l-4 border-green-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {project.name}
                    </h3>
                    {project.technologies.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {project.technologies.join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDateRange(project.startDate, project.endDate, project.current)}
                  </span>
                </div>
                {project.description && (
                  <p className="text-gray-700 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {cvData.certifications.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Certifications
          </h2>
          <div className="space-y-3">
            {cvData.certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                  <p className="text-primary-600">{cert.issuer}</p>
                </div>
                <span className="text-sm text-gray-500">{formatDate(cert.date)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {cvData.languages.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Languages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cvData.languages.map((lang) => (
              <div key={lang.id} className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{lang.name}</span>
                <span className="text-sm text-gray-500 capitalize">{lang.level}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ModernTemplate 