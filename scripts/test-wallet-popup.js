const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',style:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},removeAttribute(){},focus(){},querySelector:s=>node(id+s),querySelectorAll:()=>[]});return nodes.get(id);}
const links=[node('link')];let launch;
links[0].addEventListener=(type,fn)=>{launch=fn;};
const data={accountId:1,balance:10000,requestId:'d6b1c3f0-3344-4def-8456-123456789abc',transactions:[{id:1,type:'receive',amount:1000,targetCode:'test',note:'<script>alert(1)</script>',time:'12:00',status:'Thành Công'}]};
const context={console,Date,Math,Number,Set,JSON,String,Promise,location:{pathname:'/'},localStorage:{getItem:()=>null,setItem(){}},alert(){},confirm:()=>true,setInterval:()=>1,clearInterval(){},document:{getElementById:node,querySelector:s=>node(s),querySelectorAll:s=>s==='[data-wallet-open]'?links:[],body:node('body')},fetch:async url=>({ok:true,json:async()=>url==='/wallet/code'?{code:'123456',remainingMs:60000}:data})};
context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync('views/assets/arena-dashboard/wallet-popup.js','utf8'),context);
(async()=>{
 await launch({preventDefault(){},currentTarget:links[0]});
 const body=node('userFeatureModalBody');
 assert.ok(body.innerHTML.includes('Mã nhận điểm'));assert.ok(body.innerHTML.includes('Lịch Sử Trao Đổi'));
 const source=fs.readFileSync('../Web Arena Than Rong/main.html','utf8');
 const ref=source.slice(source.indexOf("titleEl.innerHTML = '<i class=\"fa-solid fa-wallet"),source.indexOf("} else if (type === 'password')"));
 const template=ref.match(/bodyEl.innerHTML = `([\s\S]*?)`;/)[1].replace('${userDonnetPoints.toLocaleString(\'vi-VN\')}','10.000');
 assert.equal(body.innerHTML,template,'Wallet markup must match reference exactly');
 await context.openReceiveCodeModal();assert.ok(body.innerHTML.includes('123456'));assert.ok(body.innerHTML.includes('60s'));assert.ok(!body.innerHTML.includes('clearInterval(receiveCodeInterval)'));
 context.openTransferPointsModal();assert.ok(body.innerHTML.includes('Mã số ví người nhận'));assert.ok(body.innerHTML.includes('Lời nhắn'));
 context.openExchangeHistoryModal();assert.ok(body.innerHTML.includes('exchange-history-card'));assert.ok(body.innerHTML.includes('&lt;script&gt;'));assert.ok(!body.innerHTML.includes('<script>'));
 context.deleteSingleHistoryItem(1);assert.ok(body.innerHTML.includes('Không có lịch sử'));
 context.closeUserModal();
 console.log('PASS: exact reference wallet markup; open/close, receive code, transfer, history, hide notification and XSS escaping.');
})().catch(e=>{console.error(e);process.exitCode=1});

