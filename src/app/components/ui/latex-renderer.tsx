'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LaTeXRendererProps {
  latexContent: string;
  className?: string;
}

export const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ 
  latexContent, 
  className = '' 
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!latexContent) return;

    setIsRendering(true);
    setError('');

    // Simulate LaTeX rendering process
    const renderLaTeX = async () => {
      try {
        // For now, we'll create a simplified HTML representation
        // In a real implementation, you'd use a LaTeX-to-HTML converter
        const htmlContent = convertLaTeXToHTML(latexContent);
        setRenderedContent(htmlContent);
      } catch (err) {
        console.error('LaTeX rendering error:', err);
        setError('Failed to render LaTeX document');
      } finally {
        setIsRendering(false);
      }
    };

    renderLaTeX();
  }, [latexContent]);

  if (isRendering) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Rendering LaTeX document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-red-800 text-sm">
          <strong>LaTeX Rendering Error:</strong> {error}
        </div>
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer">Show raw LaTeX</summary>
          <pre className="mt-2 text-xs text-gray-600 font-mono whitespace-pre-wrap">
            {latexContent}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className={`latex-document ${className}`}>
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </div>
  );
};

// Convert LaTeX to simplified HTML representation
const convertLaTeXToHTML = (latex: string): string => {
  let html = latex;

  // Step 1: Remove all LaTeX document structure and packages
  html = html.replace(/\\documentclass\[.*?\]\{.*?\}/g, '');
  html = html.replace(/\\usepackage\[.*?\]\{.*?\}/g, '');
  html = html.replace(/\\usepackage\{.*?\}/g, '');
  html = html.replace(/\\geometry\{.*?\}/g, '');
  html = html.replace(/\\onehalfspacing/g, '');
  html = html.replace(/\\pagestyle\{.*?\}/g, '');
  html = html.replace(/\\fancyhf\{\}/g, '');
  html = html.replace(/\\fancyhead\[L\]\{.*?\}/g, '');
  html = html.replace(/\\fancyhead\[R\]\{.*?\}/g, '');
  html = html.replace(/\\fancyhead\[C\]\{.*?\}/g, '');
  html = html.replace(/\\fancyfoot\[C\]\{.*?\}/g, '');
  html = html.replace(/\\renewcommand\{.*?\}/g, '');
  html = html.replace(/\\titleformat\{.*?\}/g, '');
  html = html.replace(/\\setlength\{.*?\}/g, '');
  html = html.replace(/\\begin\{document\}/g, '');
  html = html.replace(/\\end\{document\}/g, '');

  // Step 2: Remove all LaTeX comments
  html = html.replace(/%[^\n]*/g, '');

  // Step 3: Handle complex nested commands first
  const processComplexCommands = (text: string): string => {
    let result = text;
    
    // Handle \Large \MakeUppercase{text} pattern
    result = result.replace(/\\Large\s*\\MakeUppercase\{([^}]+)\}/g, '<span class="text-2xl font-bold uppercase">$1</span>');
    
    // Handle \large \MakeUppercase{text} pattern
    result = result.replace(/\\large\s*\\MakeUppercase\{([^}]+)\}/g, '<span class="text-xl font-semibold uppercase">$1</span>');
    
    // Handle \Large{text} pattern
    result = result.replace(/\\Large\{([^}]+)\}/g, '<span class="text-2xl font-bold">$1</span>');
    
    // Handle \large{text} pattern
    result = result.replace(/\\large\{([^}]+)\}/g, '<span class="text-xl font-semibold">$1</span>');
    
    // Handle \MakeUppercase{text} pattern
    result = result.replace(/\\MakeUppercase\{([^}]+)\}/g, '<span class="uppercase font-bold">$1</span>');
    
    // Handle \uppercase{text} pattern
    result = result.replace(/\\uppercase\{([^}]+)\}/g, '<span class="uppercase">$1</span>');
    
    return result;
  };

  html = processComplexCommands(html);

  // Step 4: Handle environments (begin/end blocks)
  const processEnvironments = (text: string): string => {
    let result = text;
    
    // Convert center environment
    result = result.replace(/\\begin\{center\}(.*?)\\end\{center\}/gs, '<div class="text-center my-4">$1</div>');
    
    // Convert tabular environment
    result = result.replace(/\\begin\{tabular\}\{([^}]+)\}(.*?)\\end\{tabular\}/gs, (match, cols, content) => {
      const rows = content.split('\\\\').filter(row => row.trim());
      const tableRows = rows.map(row => {
        const cells = row.split('&').map(cell => cell.trim());
        return `<tr>${cells.map(cell => `<td class="border border-gray-300 px-3 py-2">${cell}</td>`).join('')}</tr>`;
      }).join('');
      return `<table class="w-full border-collapse border border-gray-300 my-4">${tableRows}</table>`;
    });
    
    // Convert enumerate environment
    result = result.replace(/\\begin\{enumerate\}\[label=([^]]+)\](.*?)\\end\{enumerate\}/gs, (match, label, content) => {
      const items = content.split('\\item').filter(item => item.trim());
      const listItems = items.map(item => `<li class="ml-4 mb-1">${item.trim()}</li>`).join('');
      return `<ol class="list-decimal list-inside my-4">${listItems}</ol>`;
    });
    
    // Convert itemize environment
    result = result.replace(/\\begin\{itemize\}(.*?)\\end\{itemize\}/gs, (match, content) => {
      const items = content.split('\\item').filter(item => item.trim());
      const listItems = items.map(item => `<li class="ml-4 mb-1">${item.trim()}</li>`).join('');
      return `<ul class="list-disc list-inside my-4">${listItems}</ul>`;
    });
    
    return result;
  };

  html = processEnvironments(html);

  // Step 5: Handle sections and formatting
  html = html.replace(/\\section\{([^}]+)\}/g, '<h1 class="text-2xl font-bold mb-4 mt-6 text-gray-900 border-b border-gray-300 pb-2">$1</h1>');
  html = html.replace(/\\section\*\{([^}]+)\}/g, '<h1 class="text-2xl font-bold mb-4 mt-6 text-gray-900 border-b border-gray-300 pb-2">$1</h1>');
  html = html.replace(/\\subsection\{([^}]+)\}/g, '<h2 class="text-lg font-semibold mb-3 mt-4 text-gray-800">$1</h2>');
  html = html.replace(/\\subsection\*\{([^}]+)\}/g, '<h2 class="text-lg font-semibold mb-3 mt-4 text-gray-800">$1</h2>');

  // Step 6: Handle text formatting
  html = html.replace(/\\textbf\{([^}]+)\}/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/\\textit\{([^}]+)\}/g, '<em class="italic">$1</em>');
  
  // Handle specific LaTeX commands for construction template
  html = html.replace(/\\Large\s*\\textbf\{([^}]+)\}/g, '<h1 class="text-3xl font-bold text-center mb-4">$1</h1>');
  html = html.replace(/\\large\s*\\textbf\{([^}]+)\}/g, '<h2 class="text-xl font-semibold text-center mb-2">$1</h2>');

  // Step 7: Handle spacing and layout
  html = html.replace(/\\vspace\{([^}]+)\}/g, '<div class="my-2" style="height: $1"></div>');
  html = html.replace(/\\hspace\{([^}]+)\}/g, '<span style="width: $1; display: inline-block;"></span>');
  html = html.replace(/\\\\/g, '<br>');
  html = html.replace(/\\\\\[3cm\]/g, '<br class="mb-8">');

  // Step 8: Handle rules (signature lines)
  html = html.replace(/\\rule\{([^}]+)\}\{([^}]+)\}/g, '<hr class="border-t-2 border-gray-400 my-2" style="width: $1; height: $2;" />');

  // Step 9: Handle small text
  html = html.replace(/\\small\s*([^\\]+)/g, '<span class="text-sm">$1</span>');

  // Step 9.5: Handle specific LaTeX commands for construction template
  html = html.replace(/\\begin\{center\}(.*?)\\end\{center\}/gs, '<div class="text-center my-4">$1</div>');
  html = html.replace(/\\begin\{tabular\}\{([^}]+)\}(.*?)\\end\{tabular\}/gs, (match, cols, content) => {
    const rows = content.split('\\\\').filter(row => row.trim());
    const tableRows = rows.map(row => {
      const cells = row.split('&').map(cell => cell.trim());
      return `<tr>${cells.map(cell => `<td class="border border-gray-300 px-3 py-2">${cell}</td>`).join('')}</tr>`;
    }).join('');
    return `<table class="w-full border-collapse border border-gray-300 my-4">${tableRows}</table>`;
  });
  
  // Handle specific LaTeX spacing commands - removed problematic regex patterns

  // Step 10: Clean up any remaining LaTeX commands
  html = html.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '');
  html = html.replace(/\\[a-zA-Z]+/g, '');
  html = html.replace(/\{[^}]*\}/g, '');
  
  // Clean up any remaining braces and brackets
  html = html.replace(/\{[^}]*\}/g, '');
  html = html.replace(/\[[^\]]*\]/g, '');
  html = html.replace(/\}/g, '');
  html = html.replace(/\{/g, '');
  html = html.replace(/\[/g, '');
  html = html.replace(/\]/g, '');

  // Step 11: Clean up whitespace and format paragraphs
  html = html.replace(/\n\s*\n/g, '\n');
  html = html.replace(/\n\n+/g, '</p><p class="mb-3">');
  html = html.replace(/^/, '<p class="mb-3">');
  html = html.replace(/$/, '</p>');
  html = html.replace(/\s+/g, ' ');

  // Step 12: Wrap in document container
  html = `
    <div class="max-w-4xl mx-auto p-6 bg-white shadow-lg">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">CONTRACT DOCUMENT</h1>
        <p class="text-sm text-gray-600">Generated LaTeX Preview</p>
      </div>
      ${html}
    </div>
  `;

  return html;
};

export default LaTeXRenderer;
