import jsPDF from 'jspdf';
import { Entity } from '../types';

export const exportEntityToPDF = (entity: Entity): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(entity.name, margin, yPosition);
  yPosition += 10;

  // Type badge
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(entity.type.toUpperCase(), margin, yPosition);
  yPosition += 15;

  // Description
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  if (entity.description) {
    const descriptionLines = doc.splitTextToSize(entity.description, contentWidth);
    doc.text(descriptionLines, margin, yPosition);
    yPosition += descriptionLines.length * 7 + 10;
  }

  // Connections
  if (entity.connections.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Connections', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    entity.connections.forEach((conn) => {
      const connText = `• ${conn.type}: ${conn.targetId}${conn.description ? ' - ' + conn.description : ''}`;
      const connLines = doc.splitTextToSize(connText, contentWidth);
      doc.text(connLines, margin + 5, yPosition);
      yPosition += connLines.length * 7 + 3;
    });
    yPosition += 5;
  }

  // Encounter data (if applicable)
  if (entity.type === 'encounter' && entity.encounterData) {
    const data = entity.encounterData;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Encounter Details', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Party Level: ${data.partyLevel} | Party Size: ${data.partySize}`, margin, yPosition);
    yPosition += 7;
    
    if (data.difficulty) {
      doc.text(`Difficulty: ${data.difficulty.toUpperCase()}`, margin, yPosition);
      yPosition += 7;
    }
    
    if (data.totalXP) {
      doc.text(`Total XP: ${data.totalXP}`, margin, yPosition);
      yPosition += 10;
    }

    // Creatures
    if (data.creatures.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Creatures:', margin, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');

      data.creatures.forEach((creature) => {
        doc.text(`• ${creature.quantity}x ${creature.name} (Level ${creature.level}, ${creature.role})`, margin + 5, yPosition);
        yPosition += 7;
        
        if (creature.statblock) {
          doc.setFontSize(9);
          const statLines = doc.splitTextToSize(creature.statblock, contentWidth - 10);
          doc.text(statLines, margin + 10, yPosition);
          yPosition += statLines.length * 5 + 5;
          doc.setFontSize(11);
        }
      });
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const footer = `Generated from JDR Prep on ${new Date().toLocaleDateString()}`;
  doc.text(footer, margin, doc.internal.pageSize.getHeight() - 10);

  // Save
  const filename = `${entity.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(filename);
};
