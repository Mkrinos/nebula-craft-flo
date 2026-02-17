import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mx2kLogo from '@/assets/mx2k-logo-new.png';

const DocumentationPDF = () => {
  const navigate = useNavigate();
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/docs/NexusTouch-Technical-Summary.md')
      .then(res => res.text())
      .then(text => {
        setMarkdownContent(text);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Parse markdown to structured sections
  const parseMarkdown = (md: string) => {
    const lines = md.split('\n');
    const sections: Array<{ type: string; content: string; level?: number }> = [];
    let currentCodeBlock = '';
    let inCodeBlock = false;
    let codeLanguage = '';

    for (const line of lines) {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          sections.push({ type: 'code', content: currentCodeBlock, level: 0 });
          currentCodeBlock = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.slice(3);
        }
        continue;
      }

      if (inCodeBlock) {
        currentCodeBlock += line + '\n';
        continue;
      }

      if (line.startsWith('# ')) {
        sections.push({ type: 'h1', content: line.slice(2) });
      } else if (line.startsWith('## ')) {
        sections.push({ type: 'h2', content: line.slice(3) });
      } else if (line.startsWith('### ')) {
        sections.push({ type: 'h3', content: line.slice(4) });
      } else if (line.startsWith('#### ')) {
        sections.push({ type: 'h4', content: line.slice(5) });
      } else if (line.startsWith('| ')) {
        sections.push({ type: 'table-row', content: line });
      } else if (line.startsWith('- ')) {
        sections.push({ type: 'list-item', content: line.slice(2) });
      } else if (line.startsWith('├── ') || line.startsWith('└── ') || line.startsWith('│')) {
        sections.push({ type: 'tree', content: line });
      } else if (line.startsWith('**') && line.endsWith('**')) {
        sections.push({ type: 'bold', content: line.slice(2, -2) });
      } else if (line.startsWith('---')) {
        sections.push({ type: 'divider', content: '' });
      } else if (line.startsWith('*') && line.endsWith('*')) {
        sections.push({ type: 'italic', content: line.slice(1, -1) });
      } else if (line.trim()) {
        sections.push({ type: 'paragraph', content: line });
      }
    }

    return sections;
  };

  const sections = parseMarkdown(markdownContent);

  // Group table rows
  const renderContent = () => {
    const elements: React.ReactNode[] = [];
    let tableRows: string[] = [];
    let treeLines: string[] = [];
    let i = 0;

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headers = tableRows[0].split('|').filter(Boolean).map(s => s.trim());
        const dataRows = tableRows.slice(2); // Skip header separator
        elements.push(
          <table key={`table-${i}`} className="pdf-table">
            <thead>
              <tr>
                {headers.map((h, idx) => <th key={idx}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIdx) => {
                const cells = row.split('|').filter(Boolean).map(s => s.trim());
                return (
                  <tr key={rowIdx}>
                    {cells.map((cell, cellIdx) => <td key={cellIdx}>{cell}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
        tableRows = [];
      }
    };

    const flushTree = () => {
      if (treeLines.length > 0) {
        elements.push(
          <pre key={`tree-${i}`} className="pdf-tree">{treeLines.join('\n')}</pre>
        );
        treeLines = [];
      }
    };

    for (i = 0; i < sections.length; i++) {
      const section = sections[i];

      if (section.type === 'table-row') {
        flushTree();
        tableRows.push(section.content);
        continue;
      } else {
        flushTable();
      }

      if (section.type === 'tree') {
        treeLines.push(section.content);
        continue;
      } else {
        flushTree();
      }

      switch (section.type) {
        case 'h1':
          elements.push(<h1 key={i} className="pdf-h1">{section.content}</h1>);
          break;
        case 'h2':
          elements.push(<h2 key={i} className="pdf-h2">{section.content}</h2>);
          break;
        case 'h3':
          elements.push(<h3 key={i} className="pdf-h3">{section.content}</h3>);
          break;
        case 'h4':
          elements.push(<h4 key={i} className="pdf-h4">{section.content}</h4>);
          break;
        case 'code':
          elements.push(<pre key={i} className="pdf-code">{section.content}</pre>);
          break;
        case 'list-item':
          elements.push(<li key={i} className="pdf-list-item">{section.content}</li>);
          break;
        case 'bold':
          elements.push(<p key={i} className="pdf-bold">{section.content}</p>);
          break;
        case 'italic':
          elements.push(<p key={i} className="pdf-italic">{section.content}</p>);
          break;
        case 'divider':
          elements.push(<hr key={i} className="pdf-divider" />);
          break;
        case 'paragraph':
          elements.push(<p key={i} className="pdf-paragraph">{section.content}</p>);
          break;
      }
    }

    flushTable();
    flushTree();

    return elements;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Screen-only controls */}
      <div className="print:hidden fixed top-4 left-4 right-4 z-50 flex justify-between items-center bg-background/95 backdrop-blur-sm p-4 rounded-lg border border-border">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
          <Button variant="secondary" onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="pdf-document">
        {/* Cover Page */}
        <div className="pdf-cover-page">
          <div className="pdf-cover-header">
            <img src={mx2kLogo} alt="MX2K Logo" className="pdf-logo" />
            <span className="pdf-powered-by">Powered by MX2K</span>
          </div>
          <div className="pdf-cover-content">
            <h1 className="pdf-cover-title">NexusTouch</h1>
            <h2 className="pdf-cover-subtitle">Creative Journey</h2>
            <div className="pdf-cover-divider"></div>
            <h3 className="pdf-cover-doc-title">Technical Summary & Platform Architecture</h3>
            <p className="pdf-cover-version">Version 1.0 | January 2026</p>
          </div>
          <div className="pdf-cover-footer">
            <p>Progressive Web Application with Native App Conversion Ready</p>
            <p className="pdf-confidential">CONFIDENTIAL - For Authorized Recipients Only</p>
          </div>
        </div>

        {/* Content Pages */}
        <div className="pdf-content">
          {/* Header for each page */}
          <div className="pdf-page-header">
            <img src={mx2kLogo} alt="MX2K" className="pdf-header-logo" />
            <span>NexusTouch Technical Summary</span>
            <span>January 2026</span>
          </div>

          {/* Rendered content */}
          {renderContent()}

          {/* Footer */}
          <div className="pdf-footer">
            <p>© 2026 NexusTouch Creative Journey. All rights reserved.</p>
            <p>Powered by MX2K</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media screen {
          .pdf-document {
            max-width: 900px;
            margin: 80px auto 40px;
            padding: 40px;
            background: hsl(var(--background));
            color: hsl(var(--foreground));
          }
          
          .pdf-cover-page {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            min-height: 80vh;
            padding: 60px 40px;
            background: linear-gradient(135deg, hsl(261 80% 15%), hsl(240 10% 8%));
            border-radius: 12px;
            margin-bottom: 40px;
            border: 1px solid hsl(var(--primary) / 0.3);
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 20mm 15mm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .pdf-document {
            margin: 0;
            padding: 0;
          }

          .pdf-cover-page {
            page-break-after: always;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 60px 40px;
            background: linear-gradient(135deg, #1a0a2e, #0d0d12) !important;
            -webkit-print-color-adjust: exact;
          }

          .pdf-page-header {
            position: running(header);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 2px solid #8a50ff;
            font-size: 10pt;
            color: #666;
          }

          .pdf-h2 {
            page-break-before: always;
          }

          .pdf-code, .pdf-table, .pdf-tree {
            page-break-inside: avoid;
          }

          .pdf-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9pt;
            color: #888;
            padding: 10px;
            border-top: 1px solid #ddd;
          }
        }

        /* Common Styles */
        .pdf-cover-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pdf-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }

        .pdf-powered-by {
          font-size: 14px;
          color: hsl(var(--muted-foreground));
          font-weight: 500;
        }

        .pdf-cover-content {
          text-align: center;
        }

        .pdf-cover-title {
          font-size: 56px;
          font-weight: 700;
          background: linear-gradient(135deg, #8a50ff, #00d9ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .pdf-cover-subtitle {
          font-size: 32px;
          font-weight: 300;
          color: hsl(var(--muted-foreground));
          margin-bottom: 24px;
        }

        .pdf-cover-divider {
          width: 200px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #8a50ff, #00d9ff, transparent);
          margin: 32px auto;
        }

        .pdf-cover-doc-title {
          font-size: 20px;
          font-weight: 500;
          color: hsl(var(--foreground));
          margin-bottom: 16px;
        }

        .pdf-cover-version {
          font-size: 14px;
          color: hsl(var(--muted-foreground));
        }

        .pdf-cover-footer {
          text-align: center;
          font-size: 12px;
          color: hsl(var(--muted-foreground));
        }

        .pdf-confidential {
          margin-top: 16px;
          color: #8a50ff;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .pdf-content {
          padding: 20px 0;
        }

        .pdf-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 2px solid hsl(var(--primary));
          margin-bottom: 32px;
          font-size: 12px;
          color: hsl(var(--muted-foreground));
        }

        .pdf-header-logo {
          width: 32px;
          height: 32px;
        }

        .pdf-h1 {
          font-size: 28px;
          font-weight: 700;
          color: hsl(var(--primary));
          margin: 32px 0 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid hsl(var(--primary) / 0.3);
        }

        .pdf-h2 {
          font-size: 22px;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 28px 0 14px;
          padding-top: 24px;
          border-top: 1px solid hsl(var(--border));
        }

        .pdf-h3 {
          font-size: 18px;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 20px 0 10px;
        }

        .pdf-h4 {
          font-size: 15px;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          margin: 16px 0 8px;
        }

        .pdf-paragraph {
          font-size: 14px;
          line-height: 1.7;
          color: hsl(var(--foreground));
          margin: 8px 0;
        }

        .pdf-bold {
          font-weight: 600;
          font-size: 14px;
          margin: 12px 0;
        }

        .pdf-italic {
          font-style: italic;
          color: hsl(var(--muted-foreground));
          font-size: 13px;
        }

        .pdf-code {
          background: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          padding: 16px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.5;
          overflow-x: auto;
          margin: 12px 0;
          white-space: pre-wrap;
        }

        .pdf-tree {
          background: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          line-height: 1.6;
          margin: 12px 0;
        }

        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 13px;
        }

        .pdf-table th {
          background: hsl(var(--primary) / 0.15);
          color: hsl(var(--primary));
          font-weight: 600;
          text-align: left;
          padding: 12px;
          border: 1px solid hsl(var(--border));
        }

        .pdf-table td {
          padding: 10px 12px;
          border: 1px solid hsl(var(--border));
        }

        .pdf-table tr:nth-child(even) {
          background: hsl(var(--muted) / 0.5);
        }

        .pdf-list-item {
          font-size: 14px;
          line-height: 1.6;
          margin: 6px 0 6px 24px;
          list-style-type: disc;
        }

        .pdf-divider {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent);
          margin: 32px 0;
        }

        .pdf-footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 2px solid hsl(var(--primary) / 0.3);
          text-align: center;
          font-size: 12px;
          color: hsl(var(--muted-foreground));
        }

        .pdf-footer p {
          margin: 4px 0;
        }

        @media print {
          .pdf-cover-title {
            color: #8a50ff !important;
            -webkit-text-fill-color: #8a50ff !important;
          }
          
          .pdf-table th {
            background: #f0e6ff !important;
          }
          
          .pdf-code, .pdf-tree {
            background: #f5f5f5 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentationPDF;
