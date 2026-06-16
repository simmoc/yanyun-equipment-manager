const fs = require('fs');
const path = require('path');
const https = require('https');

const configDir = path.join(__dirname, 'config_data');
const files = [
  {
    url: 'https://s.166.net/config/ds_h72/xinfa_data.json',
    filename: 'xinfa_data.json'
  },
  {
    url: 'https://s.166.net/config/ds_h72/slot_data.json',
    filename: 'slot_data.json'
  }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('开始下载配置文件...\n');
  
  for (const file of files) {
    const destPath = path.join(configDir, file.filename);
    console.log(`正在下载: ${file.url}`);
    
    try {
      await downloadFile(file.url, destPath);
      console.log(`✓ ${file.filename} 下载成功！保存到: ${destPath}\n`);
    } catch (error) {
      console.error(`✗ ${file.filename} 下载失败:`, error.message);
    }
  }
  
  console.log('所有文件下载完成！');
}

main().catch(console.error);
