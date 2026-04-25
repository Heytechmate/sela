import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface ExportOptions {
  format: 'pdf' | 'word' | 'json'
  filename?: string
  includeStyling?: boolean
}

export const exportToPDF = async (cvElement: HTMLElement, filename: string = 'cv.pdf') => {
  try {
    const canvas = await html2canvas(cvElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
    return { success: true, filename }
  } catch (error) {
    console.error('PDF export error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const exportToWord = (cvData: any, filename: string = 'cv.docx') => {
  try {
    // Create Word document content
    const wordContent = generateWordContent(cvData)
    
    // Create blob and download
    const blob = new Blob([wordContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return { success: true, filename }
  } catch (error) {
    console.error('Word export error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const exportToJSON = (cvData: any, filename: string = 'cv.json') => {
  try {
    const jsonContent = JSON.stringify(cvData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return { success: true, filename }
  } catch (error) {
    console.error('JSON export error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const exportToHTML = (cvData: any, filename: string = 'cv.html') => {
  try {
    const htmlContent = generateHTMLContent(cvData)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return { success: true, filename }
  } catch (error) {
    console.error('HTML export error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

const generateWordContent = (cvData: any): string => {
  // Generate Word document XML content
  const content = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>${cvData.personalInfo?.name || 'CV'}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>${cvData.personalInfo?.email || ''}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>${cvData.personalInfo?.phone || ''}</w:t>
      </w:r>
    </w:p>
    
    ${cvData.summary ? `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>Professional Summary</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>${cvData.summary}</w:t>
      </w:r>
    </w:p>
    ` : ''}
    
    ${cvData.experience?.length > 0 ? `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>Work Experience</w:t>
      </w:r>
    </w:p>
    ${cvData.experience.map((exp: any) => `
    <w:p>
      <w:r>
        <w:t>${exp.position} at ${exp.company}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>${exp.description || ''}</w:t>
      </w:r>
    </w:p>
    `).join('')}
    ` : ''}
  </w:body>
</w:document>
  `
  
  return content
}

const generateHTMLContent = (cvData: any): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cvData.personalInfo?.name || 'CV'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 30px; }
        .section { margin-bottom: 20px; }
        .experience-item { margin-bottom: 15px; }
        .company { font-weight: bold; color: #2563eb; }
        .position { font-weight: bold; }
        .date { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>${cvData.personalInfo?.name || 'Your Name'}</h1>
    <p>${cvData.personalInfo?.email || ''} | ${cvData.personalInfo?.phone || ''}</p>
    <p>${cvData.personalInfo?.location || ''}</p>
    
    ${cvData.summary ? `
    <div class="section">
        <h2>Professional Summary</h2>
        <p>${cvData.summary}</p>
    </div>
    ` : ''}
    
    ${cvData.experience?.length > 0 ? `
    <div class="section">
        <h2>Work Experience</h2>
        ${cvData.experience.map((exp: any) => `
        <div class="experience-item">
            <div class="position">${exp.position}</div>
            <div class="company">${exp.company}</div>
            <div class="date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
            <p>${exp.description || ''}</p>
        </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${cvData.education?.length > 0 ? `
    <div class="section">
        <h2>Education</h2>
        ${cvData.education.map((edu: any) => `
        <div class="experience-item">
            <div class="position">${edu.degree} in ${edu.field}</div>
            <div class="company">${edu.institution}</div>
            <div class="date">${edu.startDate} - ${edu.current ? 'Present' : edu.endDate}</div>
        </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${cvData.skills?.length > 0 ? `
    <div class="section">
        <h2>Skills</h2>
        <p>${cvData.skills.map((skill: any) => skill.name).join(', ')}</p>
    </div>
    ` : ''}
</body>
</html>
  `
}

export const exportCV = async (
  cvData: any, 
  options: ExportOptions
): Promise<{ success: boolean; filename?: string; error?: string }> => {
  const filename = options.filename || `cv.${options.format}`
  
  switch (options.format) {
    case 'pdf':
      // For PDF, we need to get the CV element from the DOM
      const cvElement = document.querySelector('.cv-template') as HTMLElement
      if (!cvElement) {
        return { success: false, error: 'CV element not found' }
      }
      return await exportToPDF(cvElement, filename)
      
    case 'word':
      return exportToWord(cvData, filename)
      
    case 'json':
      return exportToJSON(cvData, filename)
      
    default:
      return { success: false, error: 'Unsupported format' }
  }
} 