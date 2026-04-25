import React from 'react'
import { CVData } from '../../types'
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Calendar, Car, CheckCircle } from 'lucide-react'

interface UKStandardTemplateProps {
  cvData: CVData
}

const UKStandardTemplate: React.FC<UKStandardTemplateProps> = ({ cvData }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })
  }

  const formatDateRange = (startDate: string, endDate: string, current: boolean) => {
    const start = formatDate(startDate)
    const end = current ? 'Present' : formatDate(endDate)
    return `${start} - ${end}`
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
      {/* Header - UK Standard */}
      <header className="mb-8 border-b-2 border-gray-300 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {cvData.personalInfo.name || 'Your Name'}
        </h1>
        
        <div className="text-center mb-4">
          <p className="text-lg text-gray-700">
            {cvData.personalInfo.location && `${cvData.personalInfo.location}`}
            {cvData.personalInfo.postcode && `, ${cvData.personalInfo.postcode}`}
          </p>
          <p className="text-sm text-gray-600">
            {cvData.personalInfo.phone && `${cvData.personalInfo.phone} • `}
            {cvData.personalInfo.email}
          </p>
        </div>

        {/* UK-specific information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
          <div className="space-y-2">
            {cvData.personalInfo.dateOfBirth && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Date of Birth: {cvData.personalInfo.dateOfBirth}</span>
              </div>
            )}
            {cvData.personalInfo.nationality && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Nationality: {cvData.personalInfo.nationality}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {cvData.personalInfo.drivingLicense && (
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4" />
                <span>Full UK Driving License</span>
              </div>
            )}
            {cvData.personalInfo.rightToWork && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Right to Work in UK</span>
              </div>
            )}
          </div>
        </div>

        {/* Professional links */}
        {(cvData.personalInfo.website || cvData.personalInfo.linkedin || cvData.personalInfo.github) && (
          <div className="flex justify-center space-x-4 mt-4 text-sm">
            {cvData.personalInfo.website && (
              <div className="flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>{cvData.personalInfo.website}</span>
              </div>
            )}
            {cvData.personalInfo.linkedin && (
              <div className="flex items-center space-x-1">
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </div>
            )}
            {cvData.personalInfo.github && (
              <div className="flex items-center space-x-1">
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Personal Profile - UK Standard */}
      {cvData.summary && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-2">
            Personal Profile
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {cvData.summary}
          </p>
        </section>
      )}

      {/* Work Experience - UK Standard */}
      {cvData.experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            Work Experience
          </h2>
          <div className="space-y-6">
            {cvData.experience.map((exp) => (
              <div key={exp.id} className="border-l-4 border-blue-600 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {exp.position}
                    </h3>
                    <p className="text-blue-600 font-semibold">
                      {exp.company}
                    </p>
                    {exp.location && (
                      <p className="text-sm text-gray-600">
                        {exp.location}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                {exp.description && (
                  <div className="text-gray-700 leading-relaxed">
                    <p className="whitespace-pre-line">{exp.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education - UK Standard */}
      {cvData.education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            Education & Qualifications
          </h2>
          <div className="space-y-4">
            {cvData.education.map((edu) => (
              <div key={edu.id} className="border-l-4 border-green-600 pl-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {edu.degree} in {edu.field}
                    </h3>
                    <p className="text-green-600 font-semibold">
                      {edu.institution}
                    </p>
                    {edu.location && (
                      <p className="text-sm text-gray-600">
                        {edu.location}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                  </span>
                </div>
                {edu.gpa && (
                  <p className="text-sm text-gray-600">
                    Grade: {edu.gpa}
                  </p>
                )}
                {edu.description && (
                  <p className="text-gray-700 text-sm mt-2">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills - UK Standard */}
      {cvData.skills.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            Key Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cvData.skills.map((skill) => (
              <div key={skill.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium text-gray-900">{skill.name}</span>
                <span className="text-sm text-gray-500 capitalize">{skill.level}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications - UK Standard */}
      {cvData.certifications.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            Professional Certifications
          </h2>
          <div className="space-y-3">
            {cvData.certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                <div>
                  <h3 className="font-bold text-gray-900">{cert.name}</h3>
                  <p className="text-blue-600">{cert.issuer}</p>
                  {cert.description && (
                    <p className="text-sm text-gray-600 mt-1">{cert.description}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500 font-medium">{formatDate(cert.date)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* References - UK Standard */}
      {cvData.references && cvData.references.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            References
          </h2>
          <div className="space-y-4">
            {cvData.references.map((ref) => (
              <div key={ref.id} className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-bold text-gray-900">{ref.name}</h3>
                <p className="text-purple-600 font-semibold">{ref.position}</p>
                <p className="text-gray-700">{ref.company}</p>
                <p className="text-sm text-gray-600">{ref.email} • {ref.phone}</p>
                <p className="text-sm text-gray-500">Relationship: {ref.relationship}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Additional Information - UK Standard */}
      {(cvData.interests || cvData.availability || cvData.salary) && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            Additional Information
          </h2>
          <div className="space-y-3">
            {cvData.interests && cvData.interests.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Interests:</h3>
                <p className="text-gray-700">{cvData.interests.join(', ')}</p>
              </div>
            )}
            {cvData.availability && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Availability:</h3>
                <p className="text-gray-700">{cvData.availability}</p>
              </div>
            )}
            {cvData.salary && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Salary Expectations:</h3>
                <p className="text-gray-700">{cvData.salary}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Languages */}
      {cvData.languages.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            Languages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cvData.languages.map((lang) => (
              <div key={lang.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
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

export default UKStandardTemplate 