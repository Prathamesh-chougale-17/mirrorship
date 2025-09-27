"use client";

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      mermaid.initialize({ 
        startOnLoad: true,
        theme: 'neutral',
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#e5e7eb',
          lineColor: '#6b7280',
          sectionBkColor: '#f9fafb',
          altSectionBkColor: '#ffffff',
          gridColor: '#e5e7eb',
          secondaryColor: '#f3f4f6',
          tertiaryColor: '#ffffff'
        }
      });
      
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      elementRef.current.innerHTML = `<div class="mermaid" id="${id}">${chart}</div>`;
      const mermaidElement = elementRef.current.querySelector(`#${id}`);
      if (mermaidElement) {
        mermaid.run({ nodes: [mermaidElement as HTMLElement] });
      }
    }
  }, [chart]);

  return (
    <div 
      ref={elementRef} 
      className={`mermaid-container ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}
    />
  );
}