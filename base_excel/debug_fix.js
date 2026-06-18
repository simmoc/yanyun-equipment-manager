const fs = require('fs');
const GraduationCalculator = require('./graduationCalculator');

const skillsData = JSON.parse(fs.readFileSync('./skills_data.json', 'utf8'));
const buffsData = JSON.parse(fs.readFileSync('./buffs_data.json', 'utf8'));
const statsData = JSON.parse(fs.readFileSync('./stats_data.json', 'utf8'));
const rotationData = JSON.parse(fs.readFileSync('./rotations_data.json', 'utf8'));

// 测试修复后的rotation
const flows = ['破竹鸢', '裂石威', '裂石钧', '牵丝霖'];

for (const flow of flows) {
  console.log(`\n=== ${flow} ===`);
  const calc = new GraduationCalculator(flow, skillsData, buffsData, statsData, rotationData);

  console.log('修复后rotation长度:', calc.rotation.length);
  console.log('前3个动作:');
  for (let i = 0; i < Math.min(3, calc.rotation.length); i++) {
    const action = calc.rotation[i];
    console.log(`  [${i}] skill="${action.skill}" count=${action.count}`);
  }

  // 检查有多少有效动作
  const validActions = calc.rotation.filter(a => a.skill && a.skill !== 'N/a');
  console.log('有效动作数:', validActions.length);

  // 检查技能匹配
  let matched = 0;
  for (const action of validActions) {
    if (calc._mapSkillName(action.skill)) matched++;
  }
  console.log('可匹配技能数:', matched);

  // 计算
  const report = calc.getReport();
  console.log('总伤害:', report.totalDamage.toLocaleString());
  console.log('ADPS:', report.adps.toLocaleString());
  console.log('毕业率:', report.graduationPercent);
}
