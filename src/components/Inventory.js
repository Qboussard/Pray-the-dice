import React, {useState, useContext, useEffect} from 'react';
import "firebase/analytics";
import "firebase/auth";
import "firebase/firestore";
import CharacterContext from '../context/CharacterContext';
import UserContext from '../context/UserContext';
import CampaignContext from '../context/CampaignContext';
import '../styles/inventory.css'
import { PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/solid'
import i18next from 'i18next';
import {dynamicSortInventory} from '../utils/sort';
import {generateUpdateHisto} from '../utils/dice';

const Inventory = (props) => {
  const {user} = useContext(UserContext);
  const {character} = useContext(CharacterContext);
  const {campaign} = useContext(CampaignContext);  const [itemName, setItemName] = useState("")
  const [numberOfnewItem, setNumberOfnewItem] = useState()
  const [lineToUpdateInv, setLineToUpdateInv] = useState(null)
  const [updateItem, setUpdateItem] = useState(null)
  const [defaultDataCharacter, setDefaultDataCharacter] = useState({});

  useEffect( () => {
    setDefaultDataCharacter(JSON.parse(JSON.stringify({...character})))
  }, [character]); 
  
  const createItem = () => {
    const newItem = {
      name: itemName,
      number: numberOfnewItem || 1,
    };
    character.inventory.push(newItem);
    props.updateInventory(character, generateUpdateHisto(character,defaultDataCharacter,campaign,user));
  }
  
  const updateItemNumber = async (item, index) => {
    const updatedItem = {
      ...item,
      number: updateItem !== null || updateItem !== undefined ? updateItem : item.number
    }
    setLineToUpdateInv('')
    character.inventory[index] = updatedItem;
    props.updateInventory(character, generateUpdateHisto(character,defaultDataCharacter,campaign,user));
  } 

  const removeItem = (itemIndex) => {
    character.inventory.splice(itemIndex, 1);
    props.updateInventory(character, generateUpdateHisto(character,defaultDataCharacter,campaign,user));
  }

  if(character.uid) {
    return (
      <div className='containerInv'>
        <p className='titleSection'><b>{i18next.t('inventory')}</b></p>
          <div>
            <div className={'tableInvHeader tableInvRow'}>
              <div>
                <span>{i18next.t('item')}</span>
              </div>
              <div>
                <span>{i18next.t('number')}</span>
              </div>
              <div>
                <span>{i18next.t('option')}</span>
              </div>
            </div>
          {
            character.inventory.sort(dynamicSortInventory('name', 'inv')).map((item, i) => (
              <div key={i} className='tableInvRow'>
                <div>
                  <span>{`${item.type === 'alchemy' && item.default ? i18next.t(`inventoryItem.${item.name}`) : item.name}`}</span>
                </div>
                <div>
                  {lineToUpdateInv === i && (
                    <input
                      className='updateItemNumber'
                      name="update number item"
                      type="number"
                      // placeholder={item.number}
                      defaultValue={item.number}
                      value={updateItem}
                      onChange={(e) => {
                        setUpdateItem(e.target.value ? JSON.parse(e.target.value) : '');
                      }}
                    />
                  )}
                  {lineToUpdateInv !== i && (
                    <span>{`x ${item.number}`}</span>
                  )}
                </div>
                <div>
                  {lineToUpdateInv === i && (
                    <button
                      className='optionBtnInv'
                      onClick={() => {
                        updateItemNumber(item, i)
                      }}
                    >
                      <CheckIcon className="iconInv"/>
                    </button>
                  )}
                  {lineToUpdateInv !== i && (
                    <button
                      className='optionBtnInv'
                      onClick={() => {
                        setUpdateItem(item.number)
                        setLineToUpdateInv(i);
                      }}
                    >
                      <PencilIcon className="iconInv"/> 
                    </button>
                  )}
                  { !item.default && (
                    <button
                    className='optionBtnInv'
                    onClick={() => {
                      removeItem(i);
                    }}
                  >
                    <TrashIcon className="iconInv" />
                  </button>
                  )}
                </div>
              </div>
            ))
          }
          </div>
          <form className='formNewInv' onSubmit={(e) => {
            if(itemName) {
              createItem();
            }
            setItemName('');
            setNumberOfnewItem('');
            e.preventDefault();
          }}>
            <input
              name="newItemInventory"
              type="text"
              placeholder={i18next.t('item name')}
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
              }}
            />
            <input
              name="numberOfNewItem"
              type="number"
              placeholder={i18next.t('number of item')}
              value={numberOfnewItem}
              onChange={(e) => {
                setNumberOfnewItem(e.target.value ? JSON.parse(e.target.value) : '');
              }}
            />
            <input className={itemName === "" ? 'disabled' : 'outline'} type="submit" value={i18next.t('create')} />
          </form>
      </div>
    )
  }
  return null;
}

export default Inventory