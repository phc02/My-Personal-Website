(()=>{
 const state=document.createElement('div');state.className='demo-connection-state';state.setAttribute('role','status');
 Object.assign(state.style,{position:'fixed',inset:'0',display:'grid',placeItems:'center',color:'#fff',background:'#0b0e12',zIndex:'10000',font:'14px/1.8 Arial,sans-serif',textAlign:'center'});
 state.textContent='正在加载地图…';document.body.append(state);
 const timeout=setTimeout(()=>{if(!window.__M7_DEMO_READY__)failed();},25000);
 function failed(){if(window.__M7_DEMO_READY__)return;clearTimeout(timeout);state.replaceChildren();const text=document.createElement('div');text.textContent='地图暂时未能加载，请检查网络后重试。';const retry=document.createElement('button');retry.textContent='重新加载';Object.assign(retry.style,{display:'block',margin:'18px auto 0',padding:'9px 20px',border:'1px solid #fff8',borderRadius:'24px',background:'transparent',color:'#fff',cursor:'pointer'});retry.onclick=()=>location.reload();text.append(retry);state.append(text);parent.postMessage({type:'m7-demo-load-error'},'*');}
 addEventListener('m7-demo-error',failed);
 addEventListener('keydown',event=>{if(event.key==='Escape')parent.postMessage({type:'m7-demo-close'},'*');});
 addEventListener('error',event=>{if(event.message?.includes('AMapLoader'))failed();});
})();
