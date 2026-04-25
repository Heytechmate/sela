import React, { useState, useRef } from 'react'
import { Download, Upload, FileText, FileJson, FileImage, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { exportCV, ExportOptions } from '../utils/exportUtils'
import { importCV, ImportResult, createSampleCV } from '../utils/importUtils'
import { CVData } from '../types'

interface ExportImportProps {
  cvData: CVData
  onCVDataChange: (data: CVData) => void
}

const ExportImport: React.FC<ExportImportProps> = ({ cvData, onCVDataChange }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async (format: 'pdf' | 'word' | 'json' | 'html') => {
    setIsExporting(true)
    setExportResult(null)

    try {
      const options: ExportOptions = {
        format: format as 'pdf' | 'word' | 'json',
        filename: `cv-${Date.now()}.${format}`,
        includeStyling: true
      }

      const result = await exportCV(cvData, options)
      
      if (result.success) {
        setExportResult({
          success: true,
          message: `CV exported successfully as ${result.filename}`
        })
      } else {
        setExportResult({
          success: false,
          message: result.error || 'Export failed'
        })
      }
    } catch (error) {
      setExportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Export failed'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const result = await importCV(file)
      setImportResult(result)

      if (result.success && result.data) {
        onCVDataChange(result.data)
      }
    } catch (error) {
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      })
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleLoadSample = () => {
    const sampleCV = createSampleCV()
    onCVDataChange(sampleCV)
    setImportResult({
      success: true,
      data: sampleCV,
      warnings: ['Sample CV loaded - customize with your information']
    })
  }

  const handleClearCV = () => {
    const emptyCV: CVData = {
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
    onCVDataChange(emptyCV)
    setImportResult({
      success: true,
      data: emptyCV,
      warnings: ['CV cleared - start fresh']
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Export & Import</h3>

      {/* Export Section */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Export CV
        </h4>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <FileImage className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          
          <button
            onClick={() => handleExport('word')}
            disabled={isExporting}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export Word
          </button>
          
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            <FileJson className="w-4 h-4 mr-2" />
            Export JSON
          </button>
          
          <button
            onClick={() => handleExport('html')}
            disabled={isExporting}
            className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export HTML
          </button>
        </div>

        {isExporting && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Exporting...
          </div>
        )}

        {exportResult && (
          <div className={`flex items-center text-sm ${exportResult.success ? 'text-green-600' : 'text-red-600'}`}>
            {exportResult.success ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            {exportResult.message}
          </div>
        )}
      </div>

      {/* Import Section */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
          <Upload className="w-4 h-4 mr-2" />
          Import CV
        </h4>
        
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.doc,.docx,.txt"
            onChange={handleImport}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import from File
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleLoadSample}
              className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Load Sample CV
            </button>
            
            <button
              onClick={handleClearCV}
              className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              Clear CV
            </button>
          </div>
        </div>

        {isImporting && (
          <div className="flex items-center text-sm text-blue-600 mt-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Importing...
          </div>
        )}

        {importResult && (
          <div className="mt-3">
            <div className={`flex items-center text-sm ${importResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {importResult.success ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {importResult.success ? 'Import successful' : importResult.error}
            </div>
            
            {importResult.warnings && importResult.warnings.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center text-sm text-yellow-600 mb-1">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Warnings:
                </div>
                <ul className="text-xs text-yellow-700 ml-6 list-disc">
                  {importResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Supported Formats */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Supported Formats</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• <strong>Export:</strong> PDF, Word (.docx), JSON, HTML</div>
          <div>• <strong>Import:</strong> JSON, Word (.doc, .docx), Text (.txt)</div>
          <div>• <strong>Sample:</strong> Pre-filled CV template</div>
        </div>
      </div>
    </div>
  )
}

export default ExportImport 