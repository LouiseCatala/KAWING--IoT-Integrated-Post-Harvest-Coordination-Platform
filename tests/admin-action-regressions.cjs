const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function extract(file, name, scope) {
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let expr;
 function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(source)===name)expr=n.initializer.getText(source);ts.forEachChild(n,visit)}visit(source);assert.ok(expr);
 const js=ts.transpile(`const action=${expr}`,{target:ts.ScriptTarget.ES2022});return new Function(...Object.keys(scope),js+';return action;')(...Object.values(scope));
}
const fullStorage={setItem(){throw new DOMException('Full','QuotaExceededError')}};
for(const name of ['handleDeleteHarvest','handleDeleteHarvests']){
 let state;extract('src/App.tsx',name,{harvests:[{id:'1'}],setHarvests:v=>state=v,localStorage:fullStorage})(name.endsWith('s')?['1']:'1');assert.deepEqual(state,[]);
}
const user={name:'Test',email:'test@example.test',role:'farmer',address:'Old'};let saved=false;
extract('src/App.tsx','handleUpdateUser',{registeredUsers:[user],activeUser:user,skipNextFullSnapshotSync:{current:false},setRegisteredUsers:()=>{},setActiveUser:()=>{},localStorage:fullStorage,persistUserProfile:async()=>{saved=true},setSyncError:()=>{},alertDialog:()=>{}})(user.name,{...user,address:'New'});assert.equal(saved,true,'Server save must run despite full browser storage');
let updated;extract('src/pages/admin/AdminDashboard.tsx','handleRequestResubmission',{usersList:[user],onUpdateUser:(_,u)=>updated=u,setUsersList:()=>{}})(user.name,' Correct the plate number ');
const restored=JSON.parse(JSON.stringify(updated));assert.equal(restored.registrationReviewReason,'Correct the plate number');assert.equal(restored.registrationReviewStatus,'correction_requested');assert.equal(restored.isApproved,false);
console.log('PASS: single/bulk harvest deletion, profile API save with full storage, persisted correction record.');
