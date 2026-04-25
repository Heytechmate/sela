import React, { useState, useEffect } from 'react'
import { CVData } from '../types'

interface CodeEditorProps {
  cvData: CVData
  onCVDataChange: (data: CVData) => void
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  cvData,
  onCVDataChange
}) => {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setJsonText(JSON.stringify(cvData, null, 2))
  }, [cvData])

  const handleJsonChange = (value: string) => {
    setJsonText(value)
    setError(null)
    
    try {
      const parsed = JSON.parse(value)
      onCVDataChange(parsed)
    } catch (err) {
      setError('Invalid JSON format')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">JSON Editor</h3>
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </div>
      
      <div className="flex-1 relative">
        <textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          className="w-full h-full font-mono text-sm bg-gray-50 border border-gray-200 rounded-md p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Enter CV data in JSON format..."
          spellCheck={false}
        />
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        <p>Edit the JSON data directly. Changes will be reflected in the visual editor and preview.</p>
      </div>
    </div>
  )
}

export default CodeEditor 