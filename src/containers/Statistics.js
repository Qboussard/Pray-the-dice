import React, {useState, useContext, useEffect} from 'react';
import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";
import "firebase/firestore";
import "firebase/database";
import 'firebase/analytics';
import {init} from '../utils/initFirebase';
import {
  getSessionPlayed,
  getMedium,
  getMedian,
  sortRoll,
  getRollByCharacterForGraph,
  getPercentOfSucAndFailByCharacters
} from '../utils/statsGeneration';
import "../styles/statistics.css";
import CampaignContext from '../context/CampaignContext';
import {
  AreaChart,
  XAxis,
  YAxis, 
  Tooltip,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import i18next from 'i18next';

init();
const db = firebase.firestore();

const Statistics = () => {
  const {campaign} = useContext(CampaignContext)
  const [rollList, setRollList] = useState([]);
  const [company, setCompany] = useState([]);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    if(campaign.uid){
      getCharactersCompany(campaign);
      const dbRefObject = firebase.database().ref().child(`${campaign.uid}`);
      dbRefObject.on('value', snap => {
        cleanDiceCreatedAt(Object.values(snap.val() || {}));
      });
    }
  }, [campaign]);

  const cleanDiceCreatedAt = (rollList) => {
    let savedDateFix = '';
    for(let i = 0; i < rollList.length; i+=1) {
      if(!rollList[i].createdAt){
        rollList[i].createdAt = savedDateFix;
      }
      savedDateFix = rollList[i].createdAt;
    }
    setRollList(rollList);
  }

  const getCharactersCompany = async (currentCampaign) => {
    try {
      const listCharactersGroup = [];
      await db.collection('characters').where('idCampaign', '==', currentCampaign.uid).where('active', '==', true).where('idUser', '!=', currentCampaign.idUserDm).get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            listCharactersGroup.push(doc.data())
          });
          setCompany(listCharactersGroup);
        })
        .catch(err => {
          console.log('err',err)
        })
    } catch (error) {
      console.log('error',error);
    }
  }

  const cleanRollList = rollList.filter(roll => roll.diceType !== "Magic" && roll.diceType !== 'update');
  return (
    <div className='containerStats' id="containerStats">
      {rollList.length > 0 && (
        <>
        <div className='navFilterStats'>
          <ul>
            <li className={`${!filter ? 'active' : ''}`} onClick={() => {
                setFilter(null);
              }}>
              {i18next.t('stats.campaign')}
            </li>
            {getSessionPlayed(cleanRollList).reverse().map((session, i) => (
              <li key={i} className={`${session.date === filter ? 'active' : ''}`} onClick={() => {
                setFilter(session.date);
              }}>
                {session.date}
              </li>
            ))}
          </ul>
        </div>
        <div className='statsCampaign'>
          {!filter && (
            <StatsGlobal
              company={company}
              rollList={cleanRollList}
            />
          )}
          {filter && (
            <StatsByDate
              company={company}
              rollList={cleanRollList.filter(roll => roll.createdAt === filter)}
            />
          )}
        </div>
        </>
      )}
      {rollList.length === 0 && (
        <div className='noRollContainer'>
          <span>{i18next.t('stats.noDice')}</span>
        </div>
      )}
    </div>
  );
  
}

const StatsGlobal = (props) => {
  const {rollList, company} = props;
  const dataRollCrit = [
    { name: i18next.t(`stats.successCrit`), value: rollList.filter(roll => roll.diceType === 100 && roll.value <= 10).length },
    { name: i18next.t(`stats.failCrit`), value: rollList.filter(roll => roll.diceType === 100 && roll.value >= 90).length },
  ];
  const dataRoll = [
    { name: i18next.t(`stats.success`), value: rollList.filter(roll => roll.diceType === 100 && roll.stat && roll.value <= roll.stat.value).length },
    { name: i18next.t(`stats.fail`), value: rollList.filter(roll => roll.diceType === 100 && roll.stat && roll.value > roll.stat.value).length },
  ];
  const COLORS = ['#007991', '#ffad23' ];
  const dataAllCharacterRoll = getPercentOfSucAndFailByCharacters(rollList, company);
  const sessionPlayed = getSessionPlayed(rollList);
  return (
    <div className='globalStats'>
      <div className='columnChart longChart'>
        <div className={'blockStat'}>
          <h3>{i18next.t('stats.graph1')}</h3>
          <AreaChart width={1000} height={250} data={sessionPlayed}
            margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffad23" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ffad23" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" />
            <YAxis />
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <Area type="monotone" dataKey="numberOfRolls" stroke="#ffad23" strokeWidth="3" fillOpacity={1} fill="url(#colorUv)" />
            <Tooltip content={<CustomTooltipArea />}/>
          </AreaChart>
        </div>
        <div className={'blockStat'}>
          <h3>{i18next.t('stats.graph2')}</h3>
          <BarChart
            width={1000}
            height={300}
            data={dataAllCharacterRoll}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltipBar />} cursor={false}/>
            <Legend content={<CustomLegend/>}/>
            <Bar dataKey="success" fill="#4059AD" />
            <Bar dataKey="successCrit" fill="#007991" />
            <Bar dataKey="fail" fill="#ffad23" />
            <Bar dataKey="failCrit" fill="#FF4242" />
          </BarChart>
        </div>
      </div>
      <div className='columnChart'>
        <div className='blockStat fix'>
          <h3>{i18next.t('stats.graph3')}</h3>
          <div>
            <span>{sessionPlayed.length}</span>
          </div>
        </div>
        <div className='blockStat'>
          <h3>{i18next.t('stats.graph4')}</h3>
          <PieChart width={300} height={120}>
            <Pie
              data={dataRollCrit}
              cx={145}
              cy={100}
              startAngle={180}
              endAngle={0}
              innerRadius={50}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              label
            >
              {dataRollCrit.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltipPie />}/>
          </PieChart>
        </div>
        <div className='blockStat'>
          <h3>{i18next.t('stats.graph5')}</h3>
          <PieChart width={300} height={120}>
            <Pie
              data={dataRoll}
              cx={145}
              cy={100}
              startAngle={180}
              endAngle={0}
              innerRadius={50}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              label
            >
              {dataRoll.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip  content={<CustomTooltipPie />}/>
          </PieChart>
        </div>
      </div>
    </div>
  );
}

const ColumnStatCharacter = (props) => {
  const {member,characterRoll, color} = props;
  if(member && characterRoll) {
    console.log(characterRoll, getMedium(characterRoll))
    return (
      <div className='tableRow'>
        <div className='blockInfo'>
          <span style={{textDecoration: 'underline', textDecorationColor: color, fontWeight: 'bold', textDecorationThickness: 3, textUnderlineOffset: 3}}>{member.name}</span>
        </div>
        <div className='blockInfo'>
          <span>{getMedium(characterRoll)}</span>
        </div>
        <div className='blockInfo'>
          <span>{getMedian(characterRoll)}</span>
        </div>
        <div className='blockInfo'>
          <span>{sortRoll(characterRoll)[0] || "-"}</span>
        </div>
        <div className='blockInfo'>
          <span>{sortRoll(characterRoll).reverse()[0] || "-"}</span>
        </div>
      </div>
    );  
  }
  return (
    <div className='tableRow'>
      <div className='blockInfo head'>
        <span>{i18next.t('name')}</span>
      </div>
      <div className='blockInfo head'>
        <span>{i18next.t('stats.average')}</span>
      </div>
      <div className='blockInfo head'>
        <span>{i18next.t('stats.median')}</span>
      </div>
      <div className='blockInfo head'>
        <span>{i18next.t('stats.lowerDice')}</span>
      </div>
      <div className='blockInfo head'>
        <span>{i18next.t('stats.hightestDice')}</span>
      </div>
    </div>
  );
} 

const StatsByDate = (props) => {
  const {rollList, company} = props;
  const COLORS = ['#ffad23', '#ffc96e', '#FF4242', '#007991', '#64c6d9' , '#4059AD', '#798cc9', '#00C49F' ];
  const rollbyCharacter = getRollByCharacterForGraph(rollList,company);
  const dataAllCharacterRoll = getPercentOfSucAndFailByCharacters(rollList, company)
  return (
    <div className='statsPerDate'>
      <div className='shortChart'>
        <div className={'blockStat'}>
          <h3>{i18next.t('stats.graph6')}</h3>
          <BarChart
            width={800}
            height={300}
            data={dataAllCharacterRoll}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltipBar />} cursor={false}/>
            <Legend content={<CustomLegend/>}/>
            <Bar dataKey="success" fill="#4059AD" />
            <Bar dataKey="successCrit" fill="#007991" />
            <Bar dataKey="fail" fill="#ffad23" />
            <Bar dataKey="failCrit" fill="#FF4242" />
          </BarChart>
        </div>
        <div className={'blockStat'}>
          <h3>{i18next.t('stats.graph7')}</h3>
          <PieChart width={300} height={300}>
            <Pie
              data={rollbyCharacter}
              cx={145}
              cy={135}
              startAngle={90}
              endAngle={450}
              innerRadius={50}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              label
            >
              {rollbyCharacter.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltipPie />}/>
          </PieChart>
        </div>
      </div>
      <div className='table'>
        <ColumnStatCharacter />
        {company.map((member, i) => (
          <ColumnStatCharacter
            member={member}
            characterRoll={rollList.filter(roll => roll.diceType === 100 && roll.characterId === member.uid)}
            color={COLORS[i % COLORS.length]}
          />
        ))}
        
      </div>
    </div>
  );
}


function CustomTooltipArea({ payload, label, active }) {
  if (active) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${label} : ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
}

function CustomTooltipBar ({ payload, label, active }) {
  if (active) {
    return (
      <div className="custom-tooltip">
        <p className="label" style={{color: payload[0].fill}}>{`${i18next.t(`stats.${payload[0].name}`)} : ${payload[0].value}%`}</p>
        <p className="label" style={{color: payload[1].fill}}>{`${i18next.t(`stats.${payload[1].name}`)} : ${payload[1].value}%`}</p>
        <p className="label" style={{color: payload[2].fill}}>{`${i18next.t(`stats.${payload[2].name}`)} : ${payload[2].value}%`}</p>
        <p className="label" style={{color: payload[3].fill}}>{`${i18next.t(`stats.${payload[3].name}`)} : ${payload[3].value}%`}</p>
      </div>
    );
  }

  return null;
}
function CustomTooltipPie ({ payload, label, active }) {
  if (active) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
}

const CustomLegend = (props) => {
  const { payload } = props;
  const colors = ['#4059AD', '#007991', '#ffad23', '#FF4242']
  return (
    <div className='legendCharts'>
      {
        payload.map((entry, index) => (
          <span style={{color: colors[index]}} key={index}>{i18next.t(`stats.${entry.value}`)}</span>
        ))
      }
    </div>
  );
}

export default Statistics;