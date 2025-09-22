// src/composables/useRendicionesNotifications.js
import { watch } from 'vue'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toastStore'

function formatCLP(n){ try{ return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Number(n)||0)}catch{ return `$${n}`}}
function emailOf(r){ const e=r?.correo??r?.email??r?.userEmail??r?.perfil?.email; if(e) return e; if(typeof r?.usuario==='string'&&r.usuario.includes('@')) return r.usuario; return null }
function nameOf(r){ const n=r?.usuarioNombre??r?.nombre??r?.usuario??r?.displayName??r?.perfil?.nombre; if(n) return n; const e=emailOf(r); if(e) return e.split('@')[0]; return r?.userId||'—' }
function trimBody(s,max=200){ if(!s) return ''; const t=String(s).trim(); return t.length>max? t.slice(0,max-1)+'…':t }

const COL='rendiciones'
const FECHA_CAMPO='creadoEn'

/* ===== RENDIDOR ===== */
let _unsubUser=null,_loadedUser=false,_watchStopUser=null,_currentUidUser=null
const _lastUserStates=new Map()

export function useRendicionesNotificationsForUser(){
  const auth=useAuthStore()
  const toasts=useToastStore()
  const isRendidor=()=>auth.perfil?.rol==='rendidor'

  function start(){
    if(!auth.uid||!isRendidor()) return
    if(_unsubUser&&_currentUidUser===auth.uid) return
    stop(); _currentUidUser=auth.uid

    const qRef=query(collection(db,COL), where('userId','==',auth.uid), orderBy(FECHA_CAMPO,'desc'))
    _unsubUser=onSnapshot(qRef,(snap)=>{
      if(_loadedUser){
        snap.docChanges().forEach((ch)=>{
          if(ch.type!=='modified') return
          const id=ch.doc.id, data=ch.doc.data()
          const prev=_lastUserStates.get(id)?.estado, now=data.estado
          if(prev!==now&&(now==='aprobada'||now==='rechazada')){
            const titulo= now==='aprobada'?'Rendición aprobada':'Rendición rechazada'
            const comentario= now==='aprobada'?(data.comentarioAprob||''):(data.comentarioRechazo||'')
            toasts.pushRendicion({
              title: titulo,
              subtitle: `${data.categoria||'—'} · ${formatCLP(data.monto)} · ${new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}`,
              body: trimBody(comentario)|| (now==='aprobada'?'Tu rendición fue aprobada.':'Tu rendición fue rechazada.'),
              variant: now==='aprobada'?'success':'danger',
              timeout: 8000,
              to: { name:'detalle', params:{ id } },
            })
          }
        })
      }
      snap.docs.forEach(d=>_lastUserStates.set(d.id,{estado:d.data().estado}))
      _loadedUser=true
    }, console.error)
  }
  function stop(){ try{ if(_unsubUser) _unsubUser() }catch(e){ console.error(e)} _unsubUser=null; _loadedUser=false; _currentUidUser=null; _lastUserStates.clear() }

  if(!_watchStopUser){
    _watchStopUser=watch(()=>[auth.uid,auth.perfil?.rol],([uid,rol])=>{ if(!uid||rol!=='rendidor'){ stop(); return } start() },{immediate:true})
  }
  return {start,stop}
}

/* ===== APROBADOR ===== */
let _unsubApr=null,_loadedApr=false,_watchStopApr=null,_currentKeyApr=null

export function useRendicionesNotificationsForAprobador(){
  const auth=useAuthStore()
  const toasts=useToastStore()
  const isAprobador=()=>auth.perfil?.rol==='aprobador'

  function start(){
    if(!auth.uid||!isAprobador()) return
    const key=`${auth.uid}:${auth.perfil?.rol||''}`
    if(_unsubApr&&_currentKeyApr===key) return
    stop(); _currentKeyApr=key

    const qRef=query(collection(db,COL), orderBy(FECHA_CAMPO,'desc'), limit(50))
    _unsubApr=onSnapshot(qRef,(snap)=>{
      if(_loadedApr){
        snap.docChanges().forEach((ch)=>{
          if (ch.type !== 'added') return
          const id=ch.doc.id, data=ch.doc.data()
          if (data.estado === 'pendiente') {
            toasts.pushRendicion({
              title:'Nueva rendición presentada',
              subtitle:`${nameOf(data)} · ${emailOf(data)||'—'}`,
              body:`${data.categoria||'—'} · ${formatCLP(data.monto)}.`,
              variant:'warning',
              timeout:8000,
              to:{ name:'aprobador.rendiciones', query:{ rid:id } },
            })
          }
        })
      }
      _loadedApr=true
    }, console.error)
  }
  function stop(){ try{ if(_unsubApr) _unsubApr() }catch(e){ console.error(e)} _unsubApr=null; _loadedApr=false; _currentKeyApr=null }

  if(!_watchStopApr){
    _watchStopApr=watch(()=>[auth.uid,auth.perfil?.rol],([uid,rol])=>{ if(!uid||rol!=='aprobador'){ stop(); return } start() },{immediate:true})
  }
  return {start,stop}
}
