import React, {useEffect, useState, useContext, useRef} from 'react';
import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";
import "firebase/firestore";
import "firebase/database";
import 'firebase/analytics';
import {
  Switch,
  Route,
  Link,
  useParams,
  useRouteMatch,
} from "react-router-dom";
import i18next from 'i18next';
import {init} from '../utils/initFirebase'
import DiceHistorical from '../components/DiceHistorical';
import DiceRoll from '../components/DiceRoll';
import Inventory from '../components/Inventory';
import UserContext from '../context/UserContext';
import CharacterContext from '../context/CharacterContext';
import CampaignContext from '../context/CampaignContext';
import '../styles/character.css';
import '../styles/modal.css';
import DiceChat from './DiceChat';
import EditCharacter from './EditCharacter';
import MobileInventory from './MobileInventory';
import { PencilAltIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/outline'
import {dynamicSortWithTraduction} from '../utils/sort';
import {getRoll} from '../utils/dice';
import {
  BrowserView,
  MobileView,
  isMobile
} from "react-device-detect";
import { toast } from 'react-toastify';
import backpack from '../assets/Images/backpack.png'
import chat from '../assets/Images/chat.png'
import Picture from '../components/Picture';
import Skills from '../components/Skills';
import Characteristics from '../components/Characteristics';
import Company from '../components/Company';
import {getLabelDice} from '../utils/dice'
import {getValueOnLocalStorage} from '../utils/localStorage'

init();
const db = firebase.firestore();

const Character = (props) => {
  let match = useRouteMatch();
  const {user} = useContext(UserContext);
  const {campaign} = useContext(CampaignContext);
  const {character, updateCharacter} = useContext(CharacterContext);
  let { characterIdUrl } = useParams();
  const [descriptionIsDisplay, setDescriptionIsDisplay] = useState(false)
  const [rollList, setRollList] = useState([]);
  const [characteristics,setCharacteristics] = useState([]);
  const [skills,setSkills] = useState([]);
  const [hideRollSwitch,setHideRollSwitch] = useState(false);
  const [view,setView] = useState('character');
  const [company, setCompany] = useState([]);

  useEffect(() => {
    if(user.uid) {
      getCharacter();
      const companyMember = getValueOnLocalStorage('company');
      if(companyMember) {
        setCompany(getValueOnLocalStorage('company'));
      } else {
        getCharactersCompany(campaign);
      }
    }
  }, []);

  useEffect(() => {
    if(character.uid) {
      const dbRefObject = firebase.database().ref().child(`${character.idCampaign}`);
      dbRefObject.on('value', snap => {
        setRollList(Object.values(snap.val() || {}));
      });
      setCharacteristics(character.characteristics.sort(dynamicSortWithTraduction("label", 'characteristics')));
      setSkills(character.skills.sort(dynamicSortWithTraduction("label", 'skills')));
    }
  },[character])

  const getCharacter = async () => {
    await db.collection('characters').doc(character.uid || characterIdUrl).get()
      .then(doc => {
        updateCharacter({
          ...doc.data(),
        });
        setCharacteristics(doc.data().characteristics.sort(dynamicSortWithTraduction("label", 'characteristics')));
        setSkills(doc.data().skills.sort(dynamicSortWithTraduction("label", 'skills')));
    })
    .catch(err => {
      console.log(err)
    })
  }

  const sendNewRoll = (newRoll) => {
    const newList = [
      ...rollList
    ];
    newList.push(newRoll);
    firebase.database().ref().child(`${character.idCampaign}`).set(newList);
    if(isMobile) {
      toast.success(`${getLabelDice(newRoll)} : ${newRoll.value}`, {});
    }
    firebase.analytics().setUserId(user.uid);
    firebase.analytics().setUserProperties({
      name: user.displayName,
      uid: user.uid,
      campaign: campaign.uid,
    });
    firebase.analytics().logEvent('Roll', {
      campaign: campaign.uid,
      stat: newRoll.stat ? newRoll.stat.label : 'Custom',
      result: newRoll.value 
    });
  }

  const updateFirestoreCharacter = async (newData) => {
    await db.collection('characters').doc(newData.uid).set(newData).then(res => {
      // toast.success(i18next.t('update succed'), {});
    }).catch(e => {
      console.log(e)
    });
  }

  const getCharactersCompany = async (currentCampaign) => {
    try {
      const listCharactersGroup = [];
      await db.collection('characters').where('idCampaign', '==', currentCampaign.uid).get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            if(doc.data().idUser !== currentCampaign.idUserDm) {
              listCharactersGroup.push(doc.data())
            }
          });
          setCompany(listCharactersGroup);

        })
        .catch(err => {
          console.log(err.messsage)
        })
    } catch (error) {
      console.log(error);
    }
  }

  if(character) {
    return (
      <Switch>
        <Route path={`${match.url}/chat`}>
          <DiceChat
            list={rollList}
            setNewDice={(valMaxRoll) => {
              sendNewRoll(getRoll(valMaxRoll,campaign.idUserDm, character, user, null, hideRollSwitch));
            }}
            hideRollSwitch={hideRollSwitch}
            setHideRoll={(val) => {
              setHideRollSwitch(val)
             }}
          />
        </Route>
        <Route path={`${match.url}/edit`}>
          <EditCharacter
            updateDataCharacter={(characterUpdated) => {
              updateCharacter({
                ...characterUpdated,
              });
              updateFirestoreCharacter(characterUpdated);
            }}
          />
        </Route>
        <Route path={`${match.url}/inventory`}>
          <MobileInventory
            updateInventory={(characterWithNewInventory) => {
              updateCharacter({
                ...characterWithNewInventory,
              });
              updateFirestoreCharacter(characterWithNewInventory);
            }}
          />
        </Route>
        <Route path={match.path}>
          <div className='containerCharacterView'>
            {(character.idUser === user.uid || campaign.idUserDm === user.uid) && (
              <div className='characterContainer'>
                <BrowserView className='tabsDetails'>
                  <ul className='tabsContainer'>
                    <li
                      className={`tab ${view === 'character' ? 'active' : ''}`}
                      onClick={() => {
                        setView('character');
                      }}  
                    >
                      {character.name}
                    </li>
                    <li
                      className={`tab ${view === 'inventory' ? 'active' : ''}`}
                      onClick={() => {
                        setView('inventory');
                      }}  
                    >
                      {i18next.t('inventory')}
                    </li>
                    <li
                      className={`tab ${view === 'company' ? 'active' : ''}`}
                      onClick={() => {
                        setView('company');
                      }}  
                    >
                      {i18next.t('company')}
                    </li>
                  </ul>
                </BrowserView>
                {view === 'character' && (
                  <div className='containerInfo'>
                    <div className='nameCharacteristics'>
                      <div className='namePictureCharacter'>
                        <Picture character={character}/>
                        <h2>
                          <span>{character.name}</span>
                        </h2>
                        <Link
                          className={'link editLink'}
                          to={`${match.url}/edit`}
                        >
                          <PencilAltIcon className="iconEdit"/>
                        </Link>
                      </div>
                      <MobileView className='linkChatContainer'>
                        <Link
                          className='link'
                          to={`${match.url}/chat`}
                        >
                          <img className="iconChat" src={chat} alt="chat" />
                        </Link>
                      </MobileView>
                      {character.description && (
                        <div className='descriptionDetails'>
                          <p
                            className="click"
                            onClick={() => {
                              setDescriptionIsDisplay(!descriptionIsDisplay)
                            }}
                          >
                            {`${i18next.t('description')}`}
                            {descriptionIsDisplay && (
                              <ChevronUpIcon className='iconDescriptionOpen' />
                            )}
                            {!descriptionIsDisplay && (
                              <ChevronDownIcon className='iconDescriptionOpen' />
                            )}
                          </p>
                          {descriptionIsDisplay && (
                            <p>{character.description}</p>
                          )}
                        </div>
                      )}
                      <div className='characteristicsDetail'>
                        <p className='titleSection'><b>{i18next.t('characteristic')}</b></p>
                          <Characteristics
                            characteristics={characteristics}
                            campaign={campaign}
                            character={character}
                            user={user}
                            hideRollSwitch={hideRollSwitch}
                            sendNewRoll={(roll) => sendNewRoll(roll)}
                          />
                      </div>
                    </div>
                    <div className='skillsDetail'>
                      <div className='containerSkill'>
                        <div className='skillsDetail'>
                          <p className='titleSection'><b>{i18next.t('skill')}</b></p>
                          <Skills
                            skills={skills}
                            campaign={campaign}
                            character={character}
                            user={user}
                            hideRollSwitch={hideRollSwitch}
                            sendNewRoll={(roll) => sendNewRoll(roll)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {view === 'inventory' && (
                  <div className='containerInfo'>
                    <Inventory
                      updateInventory={(characterWithNewInventory) => {
                        updateCharacter({
                          ...characterWithNewInventory,
                        });
                        updateFirestoreCharacter(characterWithNewInventory);
                      }}
                      />
                  </div>
                )}
                {view === 'company' && (
                  <div className='containerInfo'>
                    {company && (
                      <Company
                        company={company}
                      />  
                    )}
                  </div>
                )}
                <BrowserView className='containerHisto'>
                  <DiceHistorical
                    list={rollList}
                    hideRollSwitch={hideRollSwitch}
                    setHideRoll={(val) => {
                      setHideRollSwitch(val)
                    }}
                  />
                </BrowserView>
                <BrowserView>
                  <DiceRoll
                    chat={false}
                    setNewDice={(valMaxRoll) => {
                      sendNewRoll(getRoll(valMaxRoll,campaign.idUserDm, character, user, null, hideRollSwitch, null))
                    }}
                  />
                </BrowserView>
                <MobileView className='mobileInv'>
                  <Link
                    className='fullButton'
                    to={`${match.url}/inventory`}
                  >
                    <img className="iconInvLarge" src={backpack} alt="Backpack" />
                    <span>{i18next.t('inventory')}</span>
                  </Link>
                </MobileView>
              </div>
            )}
          </div>
        </Route>
      </Switch>

    );
  } else {
    return null;
  }
  
}

export default Character