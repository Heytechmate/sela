import React from 'react'
import { CVData } from '../types'
import UKStandardTemplate from './templates/UKStandardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ClassicTemplate from './templates/ClassicTemplate'
import CreativeTemplate from './templates/CreativeTemplate'

interface PreviewProps {
  cvData: CVData
  template: string
}

const Preview: React.FC<PreviewProps> = ({ cvData, template }) => {
  const renderTemplate = () => {
    switch (template) {
      case 'uk-standard':
        return <UKStandardTemplate cvData={cvData} />
      case 'modern':
        return <ModernTemplate cvData={cvData} />
      case 'classic':
        return <ClassicTemplate cvData={cvData} />
      case 'creative':
        return <CreativeTemplate cvData={cvData} />
      default:
        return <UKStandardTemplate cvData={cvData} />
    }
  }

  return (
    <div className="preview-pane">
      <div className="cv-template">
        {renderTemplate()}
      </div>
    </div>
  )
}

export default Preview 