/* HamMasir service worker */
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('notificationclick',event=>{
  const data=(event.notification&&event.notification.data)||{};
  const action=event.action||'open';
  event.notification.close();
  event.waitUntil((async()=>{
    const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    if(all.length){
      for(const c of all)c.postMessage({type:'DOSE_ACTION',action,key:data.key,name:data.name,dose:data.dose,time:data.time});
      try{await all[0].focus();}catch(e){}
    }else{
      const url='./'+(action!=='open'?('?dose='+encodeURIComponent(action)+'&key='+encodeURIComponent(data.key||'')):'');
      const w=await self.clients.openWindow(url);
      if(w)w.postMessage({type:'DOSE_ACTION',action,key:data.key,name:data.name,dose:data.dose,time:data.time});
    }
  })());
});
