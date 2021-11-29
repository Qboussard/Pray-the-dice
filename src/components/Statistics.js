import i18next from 'i18next';
import React from 'react';
import {
    getNumberOfDiceRoll,
    getNumberOfCriticalFail,
    getNumberOfCriticalSuccess,
    luckiestPlayer,
    mostThrows,
  } from '../utils/stats';

const Statistics = (props) => {
  const {rollList, company} = props;
  const luckiest = luckiestPlayer(rollList, company);
  const characterWithTheMostThrows = mostThrows(rollList, company);
  return (
    <div className='statsCampaign'>
      <h2>{i18next.t('stats.title')}</h2>
      <div className='line'>
        <span>
          {i18next.t('stats.TotalRoll')} :
        </span>
        <span>
          {getNumberOfDiceRoll(rollList)}
        </span>
      </div>
      <div className='line'>
        <span>
          {i18next.t('stats.criticFail')} :
        </span>
        <span>
          {getNumberOfCriticalFail(rollList)}
        </span>
      </div>
      <div className='line'>
        <span>
          {i18next.t('stats.criticSuccess')} :
        </span>
        <span>
          {getNumberOfCriticalSuccess(rollList)}
        </span>
      </div>
      <div className='line'>
        <span>
          {i18next.t('stats.mostRollPlayer')} :
        </span>
        <span>
          {characterWithTheMostThrows ? `${characterWithTheMostThrows.character} (${characterWithTheMostThrows.rolls.length})` : ''}
        </span>
      </div>
      <div className='line tooltip tooltipStats'>
        <span className="tooltiptext">{i18next.t('stats.average')}</span>
        <span>
          {i18next.t('stats.luckiestPlayer')} :
        </span>
        <div className='multiLineStat'>
          <ul>
            {luckiest.map(luck => (
              <li>{`${luck.character} (${luck.average})`}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
  
}

export default Statistics