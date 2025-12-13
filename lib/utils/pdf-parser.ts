/**
 * Server-side PDF parser utility
 * This file uses CommonJS require which works in Node.js runtime
 */

export async function parsePDF(buffer: Buffer): Promise<string> {
  // This will only work in Node.js runtime (API routes)
  try {
    // Try multiple methods to import pdf-parse
    let pdfParse: any;
    
    // Method 1: Try require (CommonJS)
    try {
      // @ts-ignore - require is available in Node.js runtime
      pdfParse = require('pdf-parse');
      console.log('pdf-parse loaded via require, type:', typeof pdfParse);
    } catch (requireError) {
      // Method 2: Try dynamic import (ESM)
      try {
        const module = await import('pdf-parse');
        pdfParse = module.default || module;
        console.log('pdf-parse loaded via import, type:', typeof pdfParse);
      } catch (importError) {
        throw new Error('Could not load pdf-parse module. Please paste the job description text instead.');
      }
    }
    
    // Handle different export formats
    let parseFunction: any;
    
    if (typeof pdfParse === 'function') {
      parseFunction = pdfParse;
    } else if (pdfParse && typeof pdfParse.default === 'function') {
      parseFunction = pdfParse.default;
    } else if (pdfParse && typeof pdfParse.pdfParse === 'function') {
      parseFunction = pdfParse.pdfParse;
    } else {
      // Debug: log what we got
      console.log('pdf-parse structure:', {
        type: typeof pdfParse,
        keys: Object.keys(pdfParse || {}),
        hasDefault: !!pdfParse?.default,
        defaultType: typeof pdfParse?.default
      });
      
      // Try to find any function in the module
      const keys = Object.keys(pdfParse || {});
      const funcKey = keys.find(key => typeof pdfParse[key] === 'function');
      if (funcKey) {
        parseFunction = pdfParse[funcKey];
      } else {
        throw new Error('pdf-parse module does not export a function. Please paste the job description text instead.');
      }
    }
    
    const pdfData = await parseFunction(buffer);
    const text = pdfData?.text || '';
    
    if (!text.trim()) {
      throw new Error('PDF appears to be empty or contains no extractable text');
    }
    
    return text;
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    throw new Error(`PDF parsing is not available. Please copy the text from the PDF and paste it in the "Paste JD" option instead.`);
  }
}
