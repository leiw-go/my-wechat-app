/**
 * 授权码生成器压测脚本
 *
 * 用法: ts-node scripts/bench-authcode.ts [count]
 *
 * DoD: 单实例 ≥ 5w QPS
 */

import { generateAuthCode, verifyAuthCode } from '../src/authcode/auth-code.generator';

const COUNT = parseInt(process.argv[2] || '50000', 10);

console.log(`🚀 AuthCode benchmark — generating ${COUNT.toLocaleString()} codes\n`);

const codes: string[] = [];

// 生成
const genStart = Date.now();
for (let i = 0; i < COUNT; i++) {
  codes.push(generateAuthCode());
}
const genElapsed = Date.now() - genStart;
const genQps = Math.floor((COUNT / genElapsed) * 1000);
console.log(`Generate: ${COUNT.toLocaleString()} in ${genElapsed}ms → ${genQps.toLocaleString()} QPS`);

// 校验
const verStart = Date.now();
let pass = 0;
for (const code of codes) {
  if (verifyAuthCode(code)) pass++;
}
const verElapsed = Date.now() - verStart;
const verQps = Math.floor((COUNT / verElapsed) * 1000);
console.log(`Verify:   ${COUNT.toLocaleString()} in ${verElapsed}ms → ${verQps.toLocaleString()} QPS`);
console.log(`Pass:     ${pass.toLocaleString()} / ${COUNT.toLocaleString()}`);

// 唯一性
const uniq = new Set(codes).size;
console.log(`Unique:   ${uniq.toLocaleString()} / ${COUNT.toLocaleString()}`);

const okGen = genQps >= 50000;
const okVer = verQps >= 50000;
console.log('');
console.log(`DoD check: gen ≥ 50k QPS  → ${okGen ? '✅' : '❌'} (${genQps.toLocaleString()})`);
console.log(`DoD check: ver ≥ 50k QPS  → ${okVer ? '✅' : '❌'} (${verQps.toLocaleString()})`);
console.log(`DoD check: uniqueness     → ${uniq === COUNT ? '✅' : '❌'} (${uniq.toLocaleString()})`);

if (!okGen || !okVer || uniq !== COUNT) {
  process.exit(1);
}
