import React, { useState, useEffect } from 'react'
import { Target, CheckCircle, XCircle, AlertCircle, TrendingUp, Lightbulb } from 'lucide-react'
import { CVData, ATSAnalysis } from '../types'

interface ATSAnalysisProps {
  cvData: CVData
  jobDescription?: string
}

const ATSAnalysisComponent: React.FC<ATSAnalysisProps> = ({ cvData, jobDescription }) => {
  const [analysis, setAnalysis] = useState<ATSAnalysis>({
    score: 0,
    keywords: [],
    missingKeywords: [],
    suggestions: [],
    jobMatch: 0
  })

  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Mock ATS analysis - in a real app, this would call an API
  const analyzeATS = () => {
    setIsAnalyzing(true)
    
    // Simulate API call
    setTimeout(() => {
      const cvText = JSON.stringify(cvData).toLowerCase()
      const jobText = jobDescription?.toLowerCase() || ''
      
      // Extract common keywords from CV
      const cvKeywords = extractKeywords(cvText)
      const jobKeywords = extractKeywords(jobText)
      
      // Calculate matches
      const matches = cvKeywords.filter(keyword => jobKeywords.includes(keyword))
      const missing = jobKeywords.filter(keyword => !cvKeywords.includes(keyword))
      
      const score = Math.round((matches.length / jobKeywords.length) * 100)
      const jobMatch = Math.round((matches.length / Math.max(jobKeywords.length, 1)) * 100)
      
      setAnalysis({
        score: Math.min(score, 100),
        keywords: matches,
        missingKeywords: missing.slice(0, 10), // Top 10 missing
        suggestions: generateSuggestions(missing),
        jobMatch: Math.min(jobMatch, 100)
      })
      
      setIsAnalyzing(false)
    }, 2000)
  }

  const extractKeywords = (text: string): string[] => {
    const commonKeywords = [
      'javascript', 'python', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes',
      'agile', 'scrum', 'git', 'api', 'rest', 'graphql', 'typescript', 'angular',
      'vue.js', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'kafka',
      'microservices', 'ci/cd', 'jenkins', 'terraform', 'ansible', 'linux', 'unix',
      'project management', 'leadership', 'team management', 'mentoring', 'training',
      'analytics', 'data analysis', 'machine learning', 'ai', 'nlp', 'computer vision',
      'testing', 'unit testing', 'integration testing', 'tdd', 'bdd', 'devops',
      'cloud', 'azure', 'gcp', 'serverless', 'lambda', 'ec2', 's3', 'rds'
    ]
    
    return commonKeywords.filter(keyword => text.includes(keyword))
  }

  const generateSuggestions = (missingKeywords: string[]): string[] => {
    const suggestions = []
    
    if (missingKeywords.includes('javascript')) {
      suggestions.push('Add JavaScript experience to your skills section')
    }
    if (missingKeywords.includes('react')) {
      suggestions.push('Include React.js projects in your experience')
    }
    if (missingKeywords.includes('agile')) {
      suggestions.push('Mention Agile/Scrum methodologies in your work experience')
    }
    if (missingKeywords.includes('leadership')) {
      suggestions.push('Highlight leadership and team management experience')
    }
    if (missingKeywords.includes('testing')) {
      suggestions.push('Add testing frameworks and methodologies to your skills')
    }
    
    return suggestions.slice(0, 5)
  }

  useEffect(() => {
    if (jobDescription) {
      analyzeATS()
    }
  }, [jobDescription, cvData])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-600" />
          ATS Analysis
        </h3>
        {isAnalyzing && (
          <div className="flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Analyzing...
          </div>
        )}
      </div>

      {/* Overall Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">ATS Compatibility Score</span>
          <span className="text-lg font-bold text-blue-600">{analysis.score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${analysis.score}%` }}
          ></div>
        </div>
      </div>

      {/* Job Match Score */}
      {jobDescription && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Job Match Score</span>
            <span className="text-lg font-bold text-green-600">{analysis.jobMatch}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${analysis.jobMatch}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Keywords Found */}
      {analysis.keywords.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            Keywords Found ({analysis.keywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((keyword, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {analysis.missingKeywords.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <XCircle className="w-4 h-4 mr-2 text-red-600" />
            Missing Keywords ({analysis.missingKeywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.missingKeywords.map((keyword, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
            Optimization Suggestions
          </h4>
          <div className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start">
                <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <button 
            onClick={analyzeATS}
            disabled={isAnalyzing}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze CV'}
          </button>
          <button className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">
            Export Analysis Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default ATSAnalysisComponent 