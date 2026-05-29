import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

function bulletPara(text: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: '• ', font: 'Microsoft YaHei', size: 21 }),
      new TextRun({ text, font: 'Microsoft YaHei', size: 21, color: '333333' }),
    ],
  });
}

export function generateWordDoc(data: any, _photoDataUrl?: string) {
  const pinfo = data.personalInfo || {};
  const sections = data.sections || [];
  const children: any[] = [];

  // Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: pinfo.name || '', font: 'Microsoft YaHei', size: 36, bold: true, color: '1a1a1a' })],
    })
  );

  // Contact info
  const contactParts = [pinfo.phone, pinfo.email, pinfo.location].filter(Boolean);
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: contactParts.join(' | '), font: 'Microsoft YaHei', size: 20, color: '666666' })],
    })
  );

  // Self introduction
  if (data.selfIntroduction) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' } },
        children: [new TextRun({ text: data.selfIntroduction, font: 'Microsoft YaHei', size: 21, color: '333333' })],
      })
    );
  }

  // Sections
  for (const section of sections) {
    if (section.visible === false) continue;
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: section.title, font: 'Microsoft YaHei', size: 26, bold: true, color: '1a1a1a' })],
      })
    );

    for (const item of section.items || []) {
      if (section.type === 'work_experience') {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [
              new TextRun({ text: `${item.company || ''} | ${item.position || ''}`, font: 'Microsoft YaHei', size: 21, bold: true }),
              new TextRun({ text: `  ${item.duration || ''}`, font: 'Microsoft YaHei', size: 18, color: '999999' }),
            ],
          })
        );
        for (const b of item.bullets || []) children.push(bulletPara(b));
      } else if (section.type === 'education') {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [
              new TextRun({ text: `${item.school || ''} | ${item.degree || ''} | ${item.major || ''}`, font: 'Microsoft YaHei', size: 21, bold: true }),
              new TextRun({ text: `  ${item.duration || ''}`, font: 'Microsoft YaHei', size: 18, color: '999999' }),
            ],
          })
        );
        for (const b of item.bullets || []) children.push(bulletPara(b));
      } else if (section.type === 'projects') {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [
              new TextRun({ text: `${item.name || ''} | ${item.role || ''}`, font: 'Microsoft YaHei', size: 21, bold: true }),
            ],
          })
        );
        for (const b of item.bullets || []) children.push(bulletPara(b));
      } else if (section.type === 'skills') {
        const allSkills = (section.items || []).map((s: any) => s.name || '').filter(Boolean).join('、');
        children.push(new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: allSkills, font: 'Microsoft YaHei', size: 21, color: '333333' })],
        }));
        break;
      } else if (section.type === 'self_evaluation') {
        for (const item of section.items || []) {
          for (const b of item.bullets || []) {
            children.push(new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: b, font: 'Microsoft YaHei', size: 21, color: '333333' })],
            }));
          }
        }
      }
    }
  }

  return new Document({
    styles: { default: { document: { run: { font: 'Microsoft YaHei', size: 21 } } } },
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });
}

export async function downloadWordFile(doc: Document, filename: string) {
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
