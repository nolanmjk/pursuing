import{$t as e,vr as t,xr as n}from"./index-DnwixBlU.js";var r=n(t()),i={icon:{tag:`svg`,attrs:{viewBox:`64 64 896 896`,focusable:`false`},children:[{tag:`defs`,attrs:{},children:[{tag:`style`,attrs:{}}]},{tag:`path`,attrs:{d:`M931.4 498.9L94.9 79.5c-3.4-1.7-7.3-2.1-11-1.2a15.99 15.99 0 00-11.7 19.3l86.2 352.2c1.3 5.3 5.2 9.6 10.4 11.3l147.7 50.7-147.6 50.7c-5.2 1.8-9.1 6-10.3 11.3L72.2 926.5c-.9 3.7-.5 7.6 1.2 10.9 3.9 7.9 13.5 11.1 21.5 7.2l836.5-417c3.1-1.5 5.6-4.1 7.2-7.1 3.9-8 .7-17.6-7.2-21.6zM170.8 826.3l50.3-205.6 295.2-101.3c2.3-.8 4.2-2.6 5-5 1.4-4.2-.8-8.7-5-10.2L221.1 403 171 198.2l628 314.9-628.2 313.2z`}}]},name:`send`,theme:`outlined`};function a(){return a=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},a.apply(this,arguments)}var o=r.forwardRef((t,n)=>r.createElement(e,a({},t,{ref:n,icon:i}))),s=`sk-f506eba81c5c485bb03e76774aedc7ef`,c=`https://api.deepseek.com/v1`,l=`你是"小楷"，一个专注于甘肃高考志愿填报的AI助手。你的特点：
- 热情、耐心、专业，像一位有经验的学长/学姐
- 只回答高考志愿填报相关问题，尤其是甘肃省的政策
- 使用口语化的中文，回答简洁有条理（控制在300字以内）
- 如果问题超出高考志愿范围，礼貌引导回正题

你需要掌握的核心知识：
1. 平行志愿规则：分数优先、遵循志愿、一轮投档。甘肃本科批C段45个院校专业组平行志愿，每个专业组6个专业
2. 位次法：位次比分数更稳定，用位次匹配往年院校录取数据
3. 冲稳保策略：冲刺（位次高于你）、稳妥（位次接近）、保底（位次低于你），建议冲10-15/稳15-20/保10-15
4. 退档vs滑档：滑档=45个全没投上；退档=投上了被退回（主因是不服从调剂）
5. 院校专业组：新高考3+1+2下的填报单位，选科要求必须匹配
6. 省控线：2025甘肃物理类本科374/特控475，历史类本科421/特控499
7. 征集志愿：每批录取后的补录，时间紧竞争大
8. 服从调剂：强烈建议勾选，否则退档风险极大
9. 三大专项计划：国家专项、高校专项、地方专项
10. 填报时间一般在6月底-7月

当前日期：2026年5月。用户是甘肃高三毕业生。`;async function u(e,t={}){let{max_tokens:n=600}=t;try{let t={"Content-Type":`application/json`};t.Authorization=`Bearer ${s}`;let r=await fetch(`${c}/chat/completions`,{method:`POST`,headers:t,body:JSON.stringify({model:`deepseek-chat`,messages:[{role:`system`,content:l},...e],temperature:.7,max_tokens:n})});return r.ok&&(await r.json()).choices?.[0]?.message?.content||null}catch{return null}}function d({userScore:e,userRank:t,userSubject:n}){if(!e&&!t)return``;let r=[];return e&&r.push(`分数：${e}分`),t&&r.push(`位次：${t.toLocaleString()}名`),n&&r.push(`科类：${n}`),r.length>0?`\n\n（用户信息：${r.join(`，`)}。如果用户问及分数相关的问题，请结合这些信息给出个性化建议。）`:``}export{d as n,o as r,u as t};