import React from 'react'
import VisualEditor from './VisualEditor'
import CodeEditor from './CodeEditor'
import { CVData, EditorTab } from '../types'

interface EditorProps {
  cvData: CVData
  onCVDataChange: (data: CVData) => void
  activeTab: EditorTab
}

const Editor: React.FC<EditorProps> = ({
  cvData,
  onCVDataChange,
  activeTab
}) => {
  return (
    <div className="editor-sidebar">
      <div className="editor-tabs">
        <button
          className={`editor-tab ${activeTab === 'visual' ? 'active' : ''}`}
          onClick={() => {/* TODO: Handle tab change */}}
        >
          Visual Editor
        </button>
        <button
          className={`editor-tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => {/* TODO: Handle tab change */}}
        >
          Code Editor
        </button>
      </div>
      
      <div className="editor-content">
        {activeTab === 'visual' ? (
          <VisualEditor 
            cvData={cvData}
            onCVDataChange={onCVDataChange}
          />
        ) : (
          <CodeEditor 
            cvData={cvData}
            onCVDataChange={onCVDataChange}
          />
        )}
      </div>
    </div>
  )
}

export default Editor 