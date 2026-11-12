/* Keep design geometry exact while the full-width sections adapt to the browser. */
(()=>{const sync=()=>document.documentElement.style.setProperty('--monitor-case-scale',String(document.documentElement.clientWidth/1920));sync();addEventListener('resize',sync,{passive:true});})();
