const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'area.html',
  'index.html',
  'public/data/news.json',
  'public/data/general.json',
  'public/data/areas.json',
  'data/news.json',
  'data/general.json',
  'data/areas.json'
];

const CORRECT_NAME = 'Liceo Bicentenario de Excelencia Polivalente San Nicolás';

// Regex para atrapar variaciones (que no tengan ya el nombre completo exacto)
// Ej: Liceo Bicentenario San Nicolás, Liceo San Nicolás, Liceo Bicentenario de Excelencia San Nicolas
const regex = /Liceo\s+(?:Bicentenario\s+)?(?:de\s+Excelencia\s+)?(?:Polivalente\s+)?San\s+Nicol[aá]s/gi;

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Solo reemplazar si no es ya el nombre correcto exacto
    content = content.replace(regex, (match) => {
      // Ignorar caso base para no hacer replaces cíclicos en partes de palabras
      return CORRECT_NAME;
    });

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Actualizado: ${file}`);
  }
});
