import React, { useState } from 'react'
import { Download, Eye, Code, FileText, Settings, Upload, MoreHorizontal } from 'lucide-react'
import { Template, EditorTab, CVData } from '../types'
import { exportCV, ExportOptions } from '../utils/exportUtils'
import { importCV, createSampleCV } from '../utils/importUtils'

interface ToolbarProps {
  selectedTemplate: string
  onTemplateChange: (templateId: string) => void
  templates: Template[]
  activeTab: EditorTab
  onTabChange: (tab: EditorTab) => void
  cvData: CVData
  onCVDataChange: (data: CVData) => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTemplate,
  onTemplateChange,
  templates,
  activeTab,
  onTabChange,
  cvData,
  onCVDataChange
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showImportMenu, setShowImportMenu] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleExport = async (format: 'pdf' | 'word' | 'json' | 'html') => {
    setIsExporting(true)
    try {
      const options: ExportOptions = {
        format: format as 'pdf' | 'word' | 'json',
        filename: `cv-${Date.now()}.${format}`,
        includeStyling: true
      }
      
      const result = await exportCV(cvData, options)
      if (result.success) {
        console.log(`Exported successfully: ${result.filename}`)
      } else {
        console.error('Export failed:', result.error)
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
      setShowExportMenu(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await importCV(file)
      if (result.success && result.data) {
        onCVDataChange(result.data)
        console.log('Import successful')
      } else {
        console.error('Import failed:', result.error)
      }
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setShowImportMenu(false)
    }
  }

  const handleLoadSample = () => {
    const sampleCV = createSampleCV()
    onCVDataChange(sampleCV)
    setShowImportMenu(false)
  }

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu || showImportMenu) {
        setShowExportMenu(false)
        setShowImportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showImportMenu])

  return (
    <div className="toolbar">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-primary-600" />
          <h1 className="text-lg font-semibold text-gray-900">CV Editor</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Template:</span>
          <select
            value={selectedTemplate}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="form-input py-1 px-2 text-sm"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-gray-100 rounded-md p-1">
          <button
            onClick={() => onTabChange('visual')}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'visual'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Visual</span>
          </button>
          <button
            onClick={() => onTabChange('code')}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'code'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
          </button>
        </div>

        <div className="border-l border-gray-300 h-6 mx-2" />

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="btn btn-sm btn-primary flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport('word')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as Word
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport('html')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as HTML
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowImportMenu(!showImportMenu)}
            className="btn btn-sm btn-secondary flex items-center space-x-1"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          
          {showImportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.doc,.docx,.txt"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Import from File
                </button>
                <button
                  onClick={handleLoadSample}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Load Sample CV
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-sm btn-secondary">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toolbar 