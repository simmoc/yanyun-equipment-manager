const fs = require('fs');
const path = require('path');
const https = require('https');

const configDir = path.join(__dirname, 'config_data');
const baseUrl = 'https://s.166.net/config/ds_h72';

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const tmpPath = `${destPath}.tmp`;
    const file = fs.createWriteStream(tmpPath);
    
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        file.close();
        fs.unlink(tmpPath, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        fs.renameSync(tmpPath, destPath);
        resolve();
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(tmpPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  fs.mkdirSync(configDir, { recursive: true });
  const files = process.argv.slice(2);
  const filenames = files.length
    ? files.map((file) => path.basename(file).replace(/\.json$/i, '') + '.json')
    : fs.readdirSync(configDir)
      .filter((file) => file.endsWith('.json') && !file.startsWith('flow_'))
      .sort();

  console.log('开始下载配置文件...\n');
  let failed = 0;
  
  for (const filename of filenames) {
    const url = `${baseUrl}/${filename}`;
    const destPath = path.join(configDir, filename);
    console.log(`正在下载: ${url}`);
    
    try {
      await downloadFile(url, destPath);
      console.log(`✓ ${filename} 下载成功！保存到: ${destPath}\n`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${filename} 下载失败:`, error.message);
    }
  }
  
  if (failed > 0) process.exitCode = 1;
  console.log('所有文件下载完成！');
}

main().catch(console.error);
