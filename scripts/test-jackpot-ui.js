const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
class Element {
 constructor(){this.children=[];this.style={setProperty(){}};this.textContent='';this.clientWidth=650;this.offsetWidth=135;this.offsetLeft=0;this.classes=new Set();this.classList={add:(...s)=>s.forEach(x=>this.classes.add(x)),remove:(...s)=>s.forEach(x=>this.classes.delete(x)),toggle:(s,on)=>on?this.classes.add(s):this.classes.delete(s),contains:s=>this.classes.has(s)};}
 append(...nodes){for(const n of nodes){n.parentElement=this;n.offsetLeft=20+this.children.length*149;this.children.push(n)}}
 prepend(n){n.parentElement=this;this.children.unshift(n)}
 replaceChildren(){this.children=[]}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this)}
 get lastElementChild(){return this.children.at(-1)}
 addEventListener(){} focus(){}
}
(async()=>{
const html=fs.readFileSync('views/page/jackpot.ejs','utf8');const elements={};for(const m of html.matchAll(/id="([^"]+)"/g))elements[m[1]]=new Element();
const reward={name:'Server reward',quantity:7,chest_id:0,icon_id:1,options:[]};
elements.jackpotData.textContent=JSON.stringify({level:3,balance:5000,price:1000,token:'test',ranks:[{name:'Đồng',amount:10000},{name:'Bạc'},{name:'Vàng'},{name:'Kim cương'}],rewards:[reward]});
elements.rouletteRail.parentElement=new Element();
let calls=0,frameTime=0;const stages=[];
const context=vm.createContext({document:{getElementById:id=>elements[id]||null,createElement:()=>new Element()},crypto:require('crypto').webcrypto,console,setTimeout:fn=>{stages.push([...elements.chestLidLayer.classes]);setImmediate(fn)},requestAnimationFrame:fn=>setImmediate(()=>fn(frameTime+=500)),fetch:async()=>{calls++;return{ok:true,json:async()=>({reward,balance:4000,receipt:{chestId:0,cost:1000,createdAt:'2026-10-23T00:00:00Z'}})}}});
vm.runInContext(fs.readFileSync('views/assets/arena-dashboard/jackpot.js','utf8'),context);
const opening=vm.runInContext('spinChest()',context);await vm.runInContext('spinChest()',context);await opening;
assert.equal(calls,1);assert.ok(stages.some(s=>s.includes('open-lid-anim')));
assert.equal(elements.rouletteRail.children.length,65);assert.equal(elements.rouletteRail.children[50].children[1].textContent,reward.name);
assert.ok(elements.rouletteRail.children[50].classList.contains('jackpot-winner'));
assert.equal(elements.history.children[0].children.length,5);assert.equal(elements.history.children[0].children[2].textContent,reward.name);
assert.equal(elements.balance.textContent,'4.000');assert.equal(elements.openChest.disabled,true);
vm.runInContext('closeRewardReveal()',context);assert.equal(elements.openChest.disabled,false);
assert.ok(elements.caseOpeningModal.classList.contains('hidden'));
console.log('PASS animation stages, server-selected winner, double-click guard, 5-column history, balance, modal close/reset.');
})().catch(e=>{console.error(e);process.exitCode=1});
