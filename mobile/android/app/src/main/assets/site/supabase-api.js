(function(){
'use strict';
var SUPABASE_URL='https://xqgjggvydcheqpjmrmgq.supabase.co';
var SUPABASE_KEY='sb_publishable_Wy_Y6-21zR_CW1On8AIhfA_Xeh8lxff';
var SESSION_KEY='bsch-supabase-session-v1';
var previousFetch=window.fetch.bind(window);
var session=null;
try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){session=null}
function headers(extra){var h={'Content-Type':'application/json','apikey':SUPABASE_KEY};if(session&&session.access_token)h.Authorization='Bearer '+session.access_token;return Object.assign(h,extra||{})}
function supa(path,opt){opt=opt||{};return previousFetch(SUPABASE_URL+path,Object.assign({},opt,{headers:headers(opt.headers)})).then(function(r){return r.json().catch(function(){return {}}).then(function(d){if(!r.ok){var e=Error(d.error_description||d.msg||d.message||d.error||'تعذر الاتصال بقاعدة البيانات');e.status=r.status;e.data=d;throw e}return d})})}
function saveSession(x){session=x||null;if(session)localStorage.setItem(SESSION_KEY,JSON.stringify(session));else localStorage.removeItem(SESSION_KEY)}
function currentUser(){return session&&session.user?session.user:null}
function profile(){var u=currentUser();if(!u)return Promise.resolve(null);return supa('/rest/v1/profiles?id=eq.'+encodeURIComponent(u.id)+'&select=*').then(function(a){var p=a[0];return p?p:null})}
function mapClinic(c,services){var rows=(services||[]).filter(function(s){return Number(s.clinic_id)===Number(c.id)});return Object.assign({},c,{start_time:String(c.start_time||'').slice(0,5),end_time:String(c.end_time||'').slice(0,5),services:rows.map(function(s){return {id:s.id,name:s.name,limit:s.daily_limit||0,daily_limit:s.daily_limit||0,direct_only:!!s.direct_only,instructions:s.instructions||'',active:s.active!==false}})})}
function clinics(all){var q=all?'':'&active=eq.true';return Promise.all([supa('/rest/v1/clinics?select=*&order=id.asc'+q),supa('/rest/v1/clinic_services?select=*&order=id.asc'+(all?'':'&active=eq.true'))]).then(function(x){return {clinics:x[0].map(function(c){return mapClinic(c,x[1])})}})}
function me(){return profile().then(function(p){return {user:p?{id:p.id,username:p.username,display_name:p.display_name,role:p.role,active:p.active}:null}})}
function login(body){var email=String(body.username||body.email||'').trim();var aliases={'Bahnasy':'ahmedbahnese@yahoo.com','booking_demo':'booking.bsch.demo@gmail.com'};if(aliases[email])email=aliases[email];return supa('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:email,password:body.password})}).then(function(x){saveSession(x);return me()})}
function logout(){saveSession(null);return Promise.resolve({ok:true})}
function rest(path,opt){return supa('/rest/v1/'+path,opt)}
function clinicPayload(b){return {name:String(b.name||'').trim(),location:b.location||'',work_days:b.work_days||'0,1,2,3,4',start_time:b.start_time||'09:00',end_time:b.end_time||'14:00',visit_minutes:Number(b.visit_minutes||15),daily_limit:Number(b.daily_limit||0),active:b.active!==0&&b.active!==false,direct_booking:!!b.direct_booking,documents:b.documents||'',instructions:b.instructions||''}}
function saveClinic(id,body){var p=clinicPayload(body),opt={method:id?'PATCH':'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(p)};return rest('clinics'+(id?'?id=eq.'+id:''),opt).then(function(rows){var c=rows[0];if(!c)throw Error('لم يتم حفظ العيادة');var services=Array.isArray(body.services)?body.services:[];return rest('clinic_services?clinic_id=eq.'+c.id,{method:'DELETE'}).then(function(){if(!services.length)return c;return rest('clinic_services',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(services.map(function(s){return {clinic_id:c.id,name:s.name,daily_limit:Number(s.limit||s.daily_limit||0),direct_only:!!s.direct_only,instructions:s.instructions||'',active:true}}))}).then(function(){return c})}).then(function(){return clinics(true).then(function(x){return {clinic:x.clinics.find(function(z){return Number(z.id)===Number(c.id)})||mapClinic(c,[])}})})})}
function apiResponse(data,status){return {ok:status<400,status:status||200,json:function(){return Promise.resolve(data)}}}
function apiError(e){return apiResponse({error:e.message||'تعذر الاتصال بقاعدة البيانات'},e.status||500)}
function handle(path,opt){var method=(opt&&opt.method||'GET').toUpperCase();
if(path==='/api/me')return me().then(function(x){return apiResponse(x,200)}).catch(function(e){return apiError(e)});
if(path==='/api/login'&&method==='POST')return login(JSON.parse(opt.body||'{}')).then(function(x){return apiResponse(x,200)}).catch(function(e){return apiError(e)});
if(path==='/api/logout')return logout().then(function(x){return apiResponse(x,200)});
if(path==='/api/clinics'||path==='/api/clinics/all')return clinics(path.endsWith('/all')).then(function(x){return apiResponse(x,200)}).catch(function(e){return apiError(e)});
if((path.match(/^\/api\/clinics\/(\d+)$/))&&method==='PATCH'){var id=path.match(/^\/api\/clinics\/(\d+)$/)[1];return saveClinic(id,JSON.parse(opt.body||'{}')).then(function(x){return apiResponse(x,200)}).catch(function(e){return apiError(e)})}
if(path==='/api/clinics'&&method==='POST')return saveClinic(null,JSON.parse(opt.body||'{}')).then(function(x){return apiResponse(x,201)}).catch(function(e){return apiError(e)});
if(path==='/api/users')return profile().then(function(p){return apiResponse({users:p?[p]:[]},200)}).catch(function(e){return apiError(e)});
var am=path.match(/^\/api\/clinics\/(\d+)\/availability$/);if(am)return Promise.all([supa('/rest/v1/clinics?id=eq.'+am[1]+'&select=*'),supa('/rest/v1/clinic_closures?clinic_id=eq.'+am[1]+'&select=closure_date')]).then(function(x){var c=x[0][0],closed=(x[1]||[]).map(function(z){return z.closure_date}),out=[],now=new Date();if(!c)return apiResponse({dates:[]},404);for(var i=0;i<90&&out.length<30;i++){var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i),iso=d.toISOString().slice(0,10),dow=d.getDay();if(String(c.work_days||'').split(',').indexOf(String(dow))<0||closed.indexOf(iso)>=0)continue;out.push({date:iso,label:iso,weekday_ar:d.toLocaleDateString('ar-EG',{weekday:'long'}),remaining:Number(c.daily_limit||0)})}return apiResponse({dates:out},200)}).catch(function(e){return apiError(e)});
var sm=path.match(/^\/api\/clinics\/(\d+)\/schedule$/);if(sm)return supa('/rest/v1/clinic_closures?clinic_id=eq.'+sm[1]+'&select=closure_date,reason&order=closure_date.asc').then(function(x){return apiResponse({closures:x||[]},200)}).catch(function(e){return apiError(e)});
return null}
window.BSCH_SUPABASE={url:SUPABASE_URL,configured:true,session:function(){return session}};
window.fetch=function(input,opt){var u=String(input&&input.url||input);if(u.indexOf('/api/')===0){var handled=handle(u,opt||{});if(handled)return handled.then(function(r){if(r.ok)return r;return previousFetch(input,opt)})}return previousFetch(input,opt)};
})();
