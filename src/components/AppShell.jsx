import { useEffect, useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Bell, Menu, LogOut, X } from 'lucide-react';
import { C, NAV, LOGO_HOME, LOGO_SIDEBAR } from '@/lib/theme';
import { Btn } from './ui-kit';
import NotificationSettings from './NotificationSettings';
import AppearanceSettings from './AppearanceSettings';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { startScaleNotificationRuntime } from '@/lib/push-client';
import { getCommunicationsInbox } from '@/lib/communications';

const COMMUNICATIONS_NAV = { id: 'communications', label: 'Comunicados', emoji: '📢', to: '/comunicados' };
const TOOLS_NAV = { id: 'tools', label: 'Ferramentas', emoji: '🛠️', to: '/ferramentas' };
const NATIVE_FOREGROUND_NOTIFICATION_EVENT = 'oitava:native-foreground-notification';

const MEMBER_NAV = [
  { id: 'home', label: 'Início', emoji: '🏠', to: '/' },
  { id: 'my-scales', label: 'Minhas Escalas', emoji: '📅', to: '/minhas-escalas' },
  { id: 'songs', label: 'Repertório', emoji: '🎵', to: '/repertorio' },
  TOOLS_NAV,
  COMMUNICATIONS_NAV,
];

const ADMIN_NAV = [NAV[0], { id: 'my-scales', label: 'Minhas Escalas', emoji: '📅', to: '/minhas-escalas' }, NAV[1], NAV[2], NAV[3], NAV[4], TOOLS_NAV, NAV[5], COMMUNICATIONS_NAV];

export function Loader({ label = 'Conectando ao Firebase...' }) { return <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100dvh',color:C.textSecondary,gap:16 }}><img src={LOGO_HOME} alt="" style={{width:64,height:64,borderRadius:'50%',border:`2px solid ${C.accent}`}}/><div>{label}</div></div>; }
function SetupRequired(){return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100dvh',padding:24,textAlign:'center'}}><img src={LOGO_HOME} alt="" style={{width:72,height:72,borderRadius:'50%',border:`2px solid ${C.accent}`}}/><h2 style={{marginTop:18,color:C.accent,fontSize:20}}>Firebase não configurado</h2></div>}

export default function AppShell({ children, allowMember=false }) {
 const [sideOpen,setSideOpen]=useState(false); const [unreadCommunications,setUnreadCommunications]=useState(0); const [foregroundNotification,setForegroundNotification]=useState(null);
 const auth=useAuth(); const {syncing,syncOk,ready}=useData(); const navigate=useNavigate(); const pathname=useRouterState({select:(s)=>s.location.pathname}); const memberAllowed=allowMember&&auth.role==='membro'; const navItems=memberAllowed?MEMBER_NAV:auth.isAdmin?ADMIN_NAV:NAV;
 useEffect(()=>{if(!auth.configured||auth.loading)return;if(!auth.user)navigate({to:'/entrar',replace:true});else if(auth.role==='membro'&&!allowMember)navigate({to:'/',replace:true});},[auth.configured,auth.loading,auth.user,auth.role,allowMember,navigate]);
 useEffect(()=>{if(!auth.user||!auth.role)return;let alive=true,cleanup=()=>{};startScaleNotificationRuntime().then(fn=>{if(!alive){fn?.();return}cleanup=fn||(()=>{})}).catch(e=>console.warn('Falha ao iniciar notificações:',e));return()=>{alive=false;cleanup()};},[auth.user?.uid,auth.role]);
 useEffect(()=>{let timer;const show=(event)=>{const d=event?.detail||{};const title=String(d.title||'Oitava Music').trim(),body=String(d.body||'').trim();if(!title&&!body)return;if(timer)clearTimeout(timer);setForegroundNotification({title:title||'Oitava Music',body,path:String(d.path||'/minhas-escalas')});timer=setTimeout(()=>setForegroundNotification(null),6500)};window.addEventListener(NATIVE_FOREGROUND_NOTIFICATION_EVENT,show);return()=>{if(timer)clearTimeout(timer);window.removeEventListener(NATIVE_FOREGROUND_NOTIFICATION_EVENT,show)}},[]);
 useEffect(()=>{if(!auth.user||!auth.role){setUnreadCommunications(0);return}let alive=true;const refresh=()=>getCommunicationsInbox().then(d=>{if(alive)setUnreadCommunications(Number(d?.unread||0))}).catch(e=>console.warn('Falha ao atualizar contador de comunicados:',e));refresh();const interval=setInterval(refresh,30000);window.addEventListener('oitava:communications-updated',refresh);return()=>{alive=false;clearInterval(interval);window.removeEventListener('oitava:communications-updated',refresh)}},[auth.user?.uid,auth.role]);
 const openForegroundNotification=()=>{const path=String(foregroundNotification?.path||'');setForegroundNotification(null);if(!path.startsWith('/'))return;const nextUrl=new URL(path,window.location.origin);const nextPath=`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;const currentPath=`${window.location.pathname}${window.location.search}${window.location.hash}`;if(nextPath===currentPath)return;window.history.pushState(window.history.state,'',nextPath);window.dispatchEvent(new PopStateEvent('popstate',{state:window.history.state}))};
 if(auth.loading)return <Loader label="Verificando acesso..."/>; if(!auth.configured)return <SetupRequired/>; if(!auth.user)return <Loader label="Redirecionando..."/>; if(auth.role!=='admin'&&!memberAllowed)return <Loader label="Redirecionando..."/>; if(!ready)return <Loader/>; const current=navItems.find(n=>n.to===pathname)||navItems[0];
 return <><div className={`sidebar${sideOpen?' open':''}`}><div style={{padding:'16px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10}}><img src={LOGO_SIDEBAR} alt="Logo" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}}/><div style={{color:C.accent,fontSize:13,fontWeight:800}}>Oitava Music<br/>Betim</div></div><nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{navItems.map(n=><Link key={n.id} to={n.to} className={`nav-item${pathname===n.to?' active':''}`} onClick={()=>setSideOpen(false)}><span style={{fontSize:18}}>{n.emoji}</span><span style={{flex:1}}>{n.label}</span>{n.id==='communications'&&unreadCommunications>0&&<span>{unreadCommunications>99?'99+':unreadCommunications}</span>}</Link>)}</nav><div style={{padding:'12px 16px',borderTop:`1px solid ${C.border}`,fontSize:11,color:C.textSecondary}}><div style={{marginBottom:8,wordBreak:'break-all'}}>👤 {auth.email}</div><Btn variant="secondary" style={{width:'100%',justifyContent:'center'}} onClick={()=>auth.logout().then(()=>navigate({to:'/entrar',replace:true}))}><LogOut size={13}/>Sair</Btn></div></div>{sideOpen&&<div onClick={()=>setSideOpen(false)} style={{position:'fixed',inset:0,background:'var(--app-overlay)',zIndex:199}}/>}{foregroundNotification&&<div role="alert" onClick={openForegroundNotification} style={{position:'fixed',top:'calc(env(safe-area-inset-top, 0px) + 12px)',left:'50%',transform:'translateX(-50%)',zIndex:1200,width:'calc(100vw - 24px)',maxWidth:520,padding:12,borderRadius:16,background:C.bgCard}}><Bell size={18}/><b>{foregroundNotification.title}</b> {foregroundNotification.body}<button onClick={e=>{e.stopPropagation();setForegroundNotification(null)}}><X size={16}/></button></div>}<div className="main-content" style={{minHeight:'100dvh',display:'flex',flexDirection:'column',overflowX:'hidden',width:'auto',minWidth:0}}><div className="topbar-surface" style={{height:54,background:'var(--app-topbar)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',padding:'0 18px',gap:8,position:'sticky',top:0,zIndex:100}}><button className="topbar-menu-btn btn-ghost btn" onClick={()=>setSideOpen(x=>!x)} style={{padding:'6px 8px'}}><Menu size={19}/></button><span style={{fontWeight:800,color:C.accent,fontSize:13,flex:1,minWidth:0}}>{current?.emoji} {current?.label}</span><AppearanceSettings/><NotificationSettings/><div style={{width:8,height:8,borderRadius:'50%',background:syncing?C.textSecondary:syncOk===true?C.success:syncOk===false?C.danger:C.textSecondary}}/></div><div style={{flex:1,minWidth:0}}>{children}</div></div></>;
}
