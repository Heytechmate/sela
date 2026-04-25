import React from 'react'
import { CVData } from '../../types'
import ModernTemplate from './ModernTemplate'

interface ClassicTemplateProps {
  cvData: CVData
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ cvData }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif text-gray-900 mb-2">
          {cvData.personalInfo.name || 'Your Name'}
        </h1>
        <p className="text-lg text-gray-600">
          Classic Template - Coming Soon
        </p>
      </div>
      <ModernTemplate cvData={cvData} />
    </div>
  )
}

export default ClassicTemplate 