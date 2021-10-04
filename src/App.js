import React from 'react';
import './App.css';

// IMPORT DATA MANAGEMENT AND TRANSACTION STUFF
import DBManager from './db/DBManager';
import jsTPS from './transactions/jsTPS';
import ChangeItem_Transaction from './transactions/ChangeItem_Transaction';
import MoveItem_Transaction from './transactions/MoveItem_Transaction';

// THESE ARE OUR REACT COMPONENTS
import DeleteModal from './components/DeleteModal';
import Banner from './components/Banner.js'
import Sidebar from './components/Sidebar.js'
import Workspace from './components/Workspace.js';
import Statusbar from './components/Statusbar.js'

class App extends React.Component {
    constructor(props) {
        super(props);

        // THIS WILL TALK TO LOCAL STORAGE
        this.db = new DBManager();
        this.tps = new jsTPS();

        // GET THE SESSION DATA FROM OUR DATA MANAGER
        let loadedSessionData = this.db.queryGetSessionData();

        // SETUP THE INITIAL STATE
        this.state = {
            currentList : null,
            sessionData : loadedSessionData,
        }
        this.dragStart=-1;
        this.dragEnd=-1;
    }
    sortKeyNamePairsByName = (keyNamePairs) => {
        keyNamePairs.sort((keyPair1, keyPair2) => {
            // GET THE LISTS
            return keyPair1.name.localeCompare(keyPair2.name);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CREATING A NEW LIST
    createNewList = () => {
        // FIRST FIGURE OUT WHAT THE NEW LIST'S KEY AND NAME WILL BE
        let newKey = this.state.sessionData.nextKey;
        let newName = "Untitled" + newKey;

        // MAKE THE NEW LIST
        let newList = {
            key: newKey,
            name: newName,
            items: ["?", "?", "?", "?", "?"]
        };

        // MAKE THE KEY,NAME OBJECT SO WE CAN KEEP IT IN OUR
        // SESSION DATA SO IT WILL BE IN OUR LIST OF LISTS
        let newKeyNamePair = { "key": newKey, "name": newName };
        let updatedPairs = [...this.state.sessionData.keyNamePairs, newKeyNamePair];
        this.sortKeyNamePairsByName(updatedPairs);

        // CHANGE THE APP STATE SO THAT IT THE CURRENT LIST IS
        // THIS NEW LIST AND UPDATE THE SESSION DATA SO THAT THE
        // NEXT LIST CAN BE MADE AS WELL. NOTE, THIS setState WILL
        // FORCE A CALL TO render, BUT THIS UPDATE IS ASYNCHRONOUS,
        // SO ANY AFTER EFFECTS THAT NEED TO USE THIS UPDATED STATE
        // SHOULD BE DONE VIA ITS CALLBACK
        this.setState(prevState => ({
            currentList: newList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey + 1,
                counter: prevState.sessionData.counter + 1,
                keyNamePairs: updatedPairs,
                start:-1,
                end:-1
            }
        }), () => {
            // PUTTING THIS NEW LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationCreateList(newList);
        });
    }
    renameList = (key, newName) => {
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        // NOW GO THROUGH THE ARRAY AND FIND THE ONE TO RENAME
        for (let i = 0; i < newKeyNamePairs.length; i++) {
            let pair = newKeyNamePairs[i];
            if (pair.key === key) {
                pair.name = newName;
            }
        }
        this.sortKeyNamePairsByName(newKeyNamePairs);

        // WE MAY HAVE TO RENAME THE currentList
        let currentList = this.state.currentList;
        if (currentList.key === key) {
            currentList.name = newName;
        }

        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            let list = this.db.queryGetList(key);
            list.name = newName;
            this.db.mutationUpdateList(list);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF LOADING A LIST FOR EDITING
    loadList = (key) => {
        let newCurrentList = this.db.queryGetList(key);
        this.setState(prevState => ({
            currentList: newCurrentList,
            sessionData: prevState.sessionData
        }), () => {
            // ANY AFTER EFFECTS?
            let close = document.getElementById("close-button");
            close.classList.remove("disabled")
            let undo = document.getElementById("undo-button");
            let redo = document.getElementById("redo-button");
            undo.classList.add("disabled");
            redo.classList.add("disabled");
            this.tps.clearAllTransactions();
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CLOSING THE CURRENT LIST
    closeCurrentList = () => {
        this.setState(prevState => ({
            currentList: null,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            sessionData: this.state.sessionData
        }), () => {
            // ANY AFTER EFFECTS?
            let close = document.getElementById("close-button");
            let undo = document.getElementById("undo-button");
            let redo = document.getElementById("redo-button");
            close.classList.add("disabled");
            undo.classList.add("disabled");
            redo.classList.add("disabled");
            this.tps.clearAllTransactions();
        });
    }
    deleteList = (pair) => {
        // SOMEHOW YOU ARE GOING TO HAVE TO FIGURE OUT
        // WHICH LIST IT IS THAT THE USER WANTS TO
        // DELETE AND MAKE THAT CONNECTION SO THAT THE
        // NAME PROPERLY DISPLAYS INSIDE THE MODAL
        this.setState(prevState => ({
            currentList: null,
            listKeyPairMarkedForDeletion : pair,
            sessionData: prevState.sessionData
        }))
        this.showDeleteListModal();
    }
    // THIS FUNCTION SHOWS THE MODAL FOR PROMPTING THE USER
    // TO SEE IF THEY REALLY WANT TO DELETE THE LIST
    showDeleteListModal() {
        let modal = document.getElementById("delete-modal");
        modal.classList.add("is-visible");
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideDeleteListModal() {
        let modal = document.getElementById("delete-modal");
        modal.classList.remove("is-visible");
    }
    removeListCallback = () => {
        let update = this.state.sessionData;
        let index = this.state.sessionData.keyNamePairs.findIndex((element) => element===this.state.listKeyPairMarkedForDeletion);
        update.keyNamePairs.splice(index,1);
        this.setState(prevState => ({
            currentList: null,
            listKeyPairMarkedForDeletion : null,
            sessionData: update
        }))
        this.hideDeleteListModal();
        this.closeCurrentList()
        this.db.mutationUpdateSessionData(this.state.sessionData);

    }
    updateToolbarButtons(){
        let tps = this.tps;
        let undo= document.getElementById("undo-button");
        let redo= document.getElementById("redo-button");
        if (tps.hasTransactionToUndo()) { 
            undo.classList.remove("disabled");
        }
        else {
            undo.classList.add("disabled");
        }
        if (tps.hasTransactionToRedo()) {    
            redo.classList.remove("disabled");
        }
        else {
            redo.classList.add("disabled");
        }
    }
    ds = (index) => {
        this.dragStart=index;
    }
    de = (index) => {
        this.dragEnd=index;
    }
    renameItem = (index, newName) => {
        let newlist=this.state.currentList.items;
        let oldText=newlist[index];
        let transaction = new ChangeItem_Transaction(this,index,oldText,newName);
        this.tps.addTransaction(transaction);

    }
    dragItem = () => {
        let transaction = new MoveItem_Transaction(this,this.dragStart,this.dragEnd);
        this.tps.addTransaction(transaction);
        this.updateToolbarButtons();
    }
    changeItem = (index, newName) => {
        let newlist=this.state.currentList.items;
        newlist[index]=newName;

        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: {
                items: newlist,
                keyNamePairs: prevState.sessionData.keyNamePairs,
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
            }
        }), () => {
            this.db.mutationUpdateSessionData(this.state.sessionData);
            this.db.mutationUpdateList(this.state.currentList);
            this.updateToolbarButtons();
        });
    }
    moveItem = (oldIndex,newIndex) => {
        let newlist= this.state.currentList;
        newlist.items.splice(newIndex, 0, newlist.items.splice(oldIndex, 1)[0]);
        this.setState(prevState => ({
            currentList: newlist,
            sessionData: {
                items: newlist.items,
                keyNamePairs: prevState.sessionData.keyNamePairs,
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
            }
        }), () => {
            this.db.mutationUpdateSessionData(this.state.sessionData);
            this.db.mutationUpdateList(this.state.currentList);
            this.updateToolbarButtons();
        });
    }
    undo = () => {
        if(this.tps.hasTransactionToUndo()){
            this.tps.undoTransaction();
            this.updateToolbarButtons();
        }
    }
    redo = () => {
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();
            this.updateToolbarButtons();
        }
    }
    handleKeyDown = (event) => {
        console.log("event",event);
        if(event.ctrlKey){
            if(event.keyCode===90){
                this.undo();
            }
            else if (event.keyCode===89){
                this.redo();
            }
        }
    }
    componentDidMount = () => {
        document.addEventListener("keydown",this.handleKeyDown.bind(this));
    }
    componentWillUnmount = () => {
        document.removeEventListener("keydown",this.handleKeyDown.bind(this));
    }    
    render() {
        return (
            <div id="app-root">
                <Banner 
                    title='Top 5 Lister'
                    closeCallback={this.closeCurrentList}
                    undoCallback={this.undo}
                    redoCallback={this.redo}
                    />
                <Sidebar
                    heading='Your Lists'
                    currentList={this.state.currentList}
                    keyNamePairs={this.state.sessionData.keyNamePairs}
                    createNewListCallback={this.createNewList}
                    deleteListCallback={this.deleteList}
                    loadListCallback={this.loadList}
                    renameListCallback={this.renameList}
                />
                <Workspace
                    currentList={this.state.currentList}
                    ric={this.renameItem}
                    ds={this.ds}
                    de={this.de}
                    di={this.dragItem}
                 />
                <Statusbar 
                    currentList={this.state.currentList} />
                <DeleteModal
                    hideDeleteListModalCallback={this.hideDeleteListModal}
                    removeListCallback={this.removeListCallback}
                    listKeyPair={this.state.listKeyPairMarkedForDeletion}
                    
                />
            </div>
        );
    }
}

export default App;
