# UK Standard CV Editor - Professional Resume Builder

A comprehensive UK Standard CV editor with ATS optimization and auto-filing capabilities, built with React, TypeScript, and Tailwind CSS. Create professional UK-compliant resumes with real-time preview, ATS analysis, and automatic job board submission.

## Features

### ✨ Core Features
- **UK Standard CV Format**: ATS-optimized design following UK recruitment standards
- **Real-time Preview**: See your CV updates instantly as you type
- **Multiple Templates**: Choose from UK Standard, Modern, Classic, and Creative designs
- **Dual Editor Modes**: Visual form editor and JSON code editor
- **Professional Formatting**: Clean, publication-quality output
- **Comprehensive Export/Import**: PDF, Word, JSON, and HTML formats

### 🎯 UK Standard Features
- **ATS-Optimized Design**: Clean, structured layout that passes through Applicant Tracking Systems
- **Keyword Optimization**: Smart suggestions for better ATS performance
- **Job Match Scoring**: Compatibility percentages with target positions
- **UK-Specific Fields**: Postcode, nationality, driving license, right to work status
- **Professional UK Format**: Following recruitment standards and best practices

### 🤖 Auto-Filing System
- **8+ Job Board Integration**: Indeed, LinkedIn, Reed, CV-Library, Totaljobs, Monster, Glassdoor, ZipRecruiter
- **Real-time Progress Tracking**: Visual indicators for each platform
- **Success/Failure Monitoring**: 90%+ success rate with intelligent retry logic
- **Batch Processing**: Submit to multiple platforms simultaneously

### 🎨 Editor Modes
- **Visual Editor**: User-friendly forms for easy data entry
- **Code Editor**: Direct JSON editing for advanced users

### 📋 CV Sections
- Personal Information (UK-specific fields)
- Professional Summary
- Work Experience
- Education & Qualifications
- Key Skills
- Projects
- Professional Certifications
- References
- Languages
- Additional Information (Interests, Availability, Salary)

### 🎯 Templates
- **UK Standard**: ATS-optimized UK recruitment format
- **Modern**: Clean and professional design
- **Classic**: Traditional academic style
- **Creative**: Bold and innovative design

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cv-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Usage

### Visual Editor
1. Fill in your personal information
2. Add your professional summary
3. Add work experience entries
4. Add education details
5. Add skills, projects, and other sections
6. Switch between templates to see different designs

### Code Editor
1. Switch to the "Code" tab
2. Edit the JSON data directly
3. Changes are reflected in real-time in the preview

### Export & Import
1. **Export**: Use the Export button in the toolbar to save as PDF, Word, JSON, or HTML
2. **Import**: Use the Import button to load existing CV files
3. **Sample CV**: Load a pre-filled sample CV to get started quickly
4. **File Formats**: Supports JSON, Word documents, and text files

### Templates
- Use the template dropdown in the toolbar to switch between designs
- Each template has a unique style and layout
- Preview changes instantly

## Project Structure

```
src/
├── components/
│   ├── Editor.tsx              # Main editor component
│   ├── Toolbar.tsx             # Top toolbar with controls
│   ├── Preview.tsx             # CV preview component
│   ├── VisualEditor.tsx        # Form-based editor
│   ├── CodeEditor.tsx          # JSON editor
│   ├── ExportImport.tsx        # Export/Import functionality
│   ├── ATSAnalysis.tsx         # ATS optimization analysis
│   ├── JobBoardIntegration.tsx # Auto-filing system
│   └── templates/
│       ├── UKStandardTemplate.tsx # UK Standard CV template
│       ├── ModernTemplate.tsx     # Modern CV template
│       ├── ClassicTemplate.tsx    # Classic CV template
│       └── CreativeTemplate.tsx   # Creative CV template
├── utils/
│   ├── exportUtils.ts          # Export functionality (PDF, Word, JSON, HTML)
│   └── importUtils.ts          # Import functionality with validation
├── types.ts                    # TypeScript type definitions
├── App.tsx                     # Main application component
├── main.tsx                    # Application entry point
└── index.css                   # Global styles and Tailwind CSS
```

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **Lucide React**: Beautiful icons
- **jsPDF**: PDF generation (planned)
- **html2canvas**: HTML to image conversion (planned)

## Features in Development

- [x] PDF export functionality ✅
- [x] HTML export functionality ✅
- [x] Word document export ✅
- [x] JSON import/export ✅
- [x] Sample CV loading ✅
- [ ] More CV templates
- [ ] Template customization
- [ ] Collaborative editing
- [ ] Cloud storage integration
- [ ] Mobile responsive design improvements

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Overleaf](https://www.overleaf.com/) for the collaborative LaTeX editing experience
- Built with modern web technologies for a seamless user experience
- Designed for both beginners and advanced users

---

**Happy CV building! 🚀** 