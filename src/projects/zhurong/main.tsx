import React from 'react';
import {createRoot} from 'react-dom/client';
import {ContainerScroll} from './container-scroll-animation';
import CircleScroll from './circle-scroll';
function Atmosphere(){return <div className="case-atmosphere" aria-hidden="true"><div className="case-grain"/>{['left','right'].map((side,i)=><div className={'case-light case-light--'+side} key={side}><img className="case-light-glow" src={i?'./assets/figma/cf343.svg':'./assets/figma/933b7.svg'} alt=""/><img className="case-light-vector" src="./assets/figma/648eb.png" alt=""/></div>)}</div>}
function App(){return <>
<main className="zhurong-page"><ContainerScroll background={<Atmosphere/>} titleComponent={<h1 className="case-title">超级大压铸智能生产系统</h1>}>
<img src="./assets/casting-insight-dashboard.png" alt="“铸融”全域无人化｜超级大压铸智能生产系统" width={3200} height={1800} draggable={false} className="case-screen"/>
</ContainerScroll><CircleScroll/></main></>}
createRoot(document.getElementById('root')!).render(<App/>);
