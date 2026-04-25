import React from 'react'
import { CVData } from '../../types'
import ModernTemplate from './ModernTemplate'

interface CreativeTemplateProps {
  cvData: CVData
}

const CreativeTemplate: React.FC<CreativeTemplateProps> = ({ cvData }) => {
  return (
    <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 p-8 shadow-lg rounded-lg">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {cvData.personalInfo.name || 'Your Name'}
        </h1>
        <p className="text-lg text-gray-600">
          Creative Template - Coming Soon
        </p>
      </div>
      <ModernTemplate cvData={cvData} />
    </div>
  )
}

export default CreativeTemplate 