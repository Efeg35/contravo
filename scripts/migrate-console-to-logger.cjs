/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// File extensions to process
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Logger mappings
const LOGGER_MAPPINGS = {
  'console.log': 'logger.info',
  'console.info': 'logger.info', 
  'console.warn': 'logger.warn',
  'console.error': 'logger.error',
  'console.debug': 'logger.debug'
};

// Files to skip (optional)
const SKIP_FILES = [
  'next.config.js',
  'tailwind.config.js'
];

function findReplacements(content) {
  const replacements = [];
  const lines = content.split('\n');
  
  lines.forEach((line, lineIndex) => {
    Object.keys(LOGGER_MAPPINGS).forEach(consoleMethod => {
      const regex = new RegExp(`\\b${consoleMethod.replace('.', '\\.')}\\s*\\(`, 'g');
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        replacements.push({
          line: lineIndex + 1,
          column: match.index + 1,
          original: consoleMethod,
          replacement: LOGGER_MAPPINGS[consoleMethod],
          context: line.trim()
        });
      }
    });
  });
  
  return replacements;
}

function replaceInContent(content) {
  let modifiedContent = content;
  let hasChanges = false;
  
  Object.keys(LOGGER_MAPPINGS).forEach(consoleMethod => {
    const regex = new RegExp(`\\b${consoleMethod.replace('.', '\\.')}\\b`, 'g');
    if (regex.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(regex, LOGGER_MAPPINGS[consoleMethod]);
      hasChanges = true;
    }
  });
  
  return { content: modifiedContent, hasChanges };
}

function processFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const replacements = findReplacements(content);
    
    if (replacements.length === 0) {
      console.log(`  ✓ No console statements found`);
      return { processed: true, changes: 0 };
    }
    
    console.log(`  Found ${replacements.length} console statement(s):`);
    replacements.forEach(r => {
      console.log(`    Line ${r.line}: ${r.original} → ${r.replacement}`);
      console.log(`      Context: ${r.context}`);
    });
    
    const { content: newContent, hasChanges } = replaceInContent(content);
    
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  ✓ File updated with ${replacements.length} change(s)`);
      return { processed: true, changes: replacements.length };
    } else {
      console.log(`  ⚠ No changes made (unexpected)`);
      return { processed: true, changes: 0 };
    }
    
  } catch (error) {
    console.error(`  ✗ Error processing file: ${error.message}`);
    return { processed: false, changes: 0, error: error.message };
  }
}

async function migrateConsoleToLogger() {
  console.log('🔄 Starting console.* to logger migration...\n');
  
  try {
    // Find all relevant files
    const patterns = FILE_EXTENSIONS.map(ext => `**/*${ext}`);
    const allFiles = [];
    
    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: [
          'node_modules/**',
          '.next/**',
          'dist/**',
          'build/**',
          ...SKIP_FILES.map(f => `**/${f}`)
        ]
      });
      allFiles.push(...files);
    }
    
    // Remove duplicates and sort
    const uniqueFiles = [...new Set(allFiles)].sort();
    
    console.log(`📁 Found ${uniqueFiles.length} files to process\n`);
    
    // Process each file
    let totalProcessed = 0;
    let totalChanges = 0;
    let totalErrors = 0;
    
    for (const file of uniqueFiles) {
      const result = processFile(file);
      
      if (result.processed) {
        totalProcessed++;
        totalChanges += result.changes;
      } else {
        totalErrors++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📊 Migration Summary:');
    console.log(`  Files processed: ${totalProcessed}`);
    console.log(`  Total changes: ${totalChanges}`);
    console.log(`  Errors: ${totalErrors}`);
    
    if (totalChanges > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('  1. Import logger in files that need it:');
      console.log('     import { logger } from "@/lib/logger"');
      console.log('  2. Review changes and test functionality');
      console.log('  3. Run your tests to ensure everything works');
    } else {
      console.log('\n✅ No console statements found - nothing to migrate!');
    }
    
  } catch (_error) {
    console.error('❌ Migration failed:', _error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateConsoleToLogger();
} 