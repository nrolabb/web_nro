(() => {
 const form=document.getElementById('wallet-form'), status=document.getElementById('wallet-status'), button=document.getElementById('wallet-submit');
 document.getElementById('wallet-receive').addEventListener('click',()=>{const panel=document.getElementById('wallet-receive-panel');panel.hidden=!panel.hidden;});
 document.getElementById('wallet-copy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(document.getElementById('wallet-receive-code').textContent);status.textContent='Đã sao chép mã nhận điểm.';}
  catch(_){status.textContent='Hãy chọn và sao chép tên tài khoản ở trên.';}
 });
 let pending=null, busy=false;
 form.addEventListener('submit',async event=>{
  event.preventDefault(); if(busy) return;
  if(!pending){
   if(!form.reportValidity()) return;
   pending={recipient:form.elements.recipient.value.trim(),amount:form.elements.amount.value,note:form.elements.note.value.trim(),requestId:form.dataset.requestId};
   if(!confirm(`Chuyển ${Number(pending.amount).toLocaleString('vi-VN')} điểm đến ${pending.recipient}?`)){pending=null;return;}
  }
  busy=true;button.disabled=true;
  form.elements.recipient.readOnly=true;form.elements.amount.readOnly=true;form.elements.note.readOnly=true;
  status.textContent='Đang xử lý...';
  try {
   const response=await fetch('/wallet/transfer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...pending,password:form.elements.password.value})});
   if(response.redirected){location.href='/login';return;}
   const data=await response.json();
   if(!response.ok || data.error){
    if(response.status===400){pending=null;form.elements.recipient.readOnly=false;form.elements.amount.readOnly=false;form.elements.note.readOnly=false;}
    throw new Error(data.message || 'Chưa xác nhận được giao dịch.');
   }
   status.textContent=data.message;
   document.getElementById('wallet-balance').textContent=Number(data.balance).toLocaleString('vi-VN');
   form.elements.password.value='';
   location.reload();
  } catch(error){status.textContent=error.message+(pending?' Bấm Thử lại để kiểm tra cùng giao dịch.':'');}
  finally{busy=false;button.disabled=false;button.textContent=pending?'Thử lại':'Chuyển điểm';}
 });
})();
