const fs = require('fs');
const readline = require('readline');
const path = 'C:/Users/pc/.gemini/antigravity-ide/brain/824f3c0e-768b-4160-8528-43d091f8031a/.system_generated/logs/transcript.jsonl';

const targetFiles = [
  'AdminLayout.jsx', 'Sidebar.jsx', 'Topbar.jsx', 
  'DashboardOverview.jsx', 'RealTimeDashboard.jsx', 'MLOpsPanel.jsx', 'SimulatorView.jsx',
  'App.jsx', 'main.jsx'
];

const fileContents = {};

const rl = readline.createInterface({ input: fs.createReadStream(path) });
rl.on('line', (line) => {
  if (line.includes('write_to_file')) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const call of obj.tool_calls) {
          if (call.name === 'write_to_file') {
            const file = call.args.TargetFile;
            if (file) {
              for (const tf of targetFiles) {
                 if (file.includes(tf) && !fileContents[tf]) {
                    let content = call.args.CodeContent;
                    if (content.startsWith('"') && content.endsWith('"')) {
                       content = JSON.parse(content);
                    }
                    fileContents[tf] = content;
                 }
              }
            }
          }
        }
      }
    } catch(e) {}
  }
});

rl.on('close', () => {
  if (!fs.existsSync('src/components/layout')) {
    fs.mkdirSync('src/components/layout', { recursive: true });
  }
  if (!fs.existsSync('src/pages')) {
    fs.mkdirSync('src/pages', { recursive: true });
  }

  for (const basename of Object.keys(fileContents)) {
     const data = fileContents[basename];
     let targetPath = 'src/' + basename;
     if (['AdminLayout.jsx', 'Sidebar.jsx', 'Topbar.jsx'].includes(basename)) targetPath = 'src/components/layout/' + basename;
     if (['DashboardOverview.jsx', 'RealTimeDashboard.jsx', 'MLOpsPanel.jsx', 'SimulatorView.jsx'].includes(basename)) targetPath = 'src/pages/' + basename;
     
     fs.writeFileSync(targetPath, data);
     console.log('Restored: ' + targetPath);
  }
});
