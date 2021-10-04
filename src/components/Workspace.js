import React from "react";
import Item from "./Item";

export default class Workspace extends React.Component {
    render() {
        const {ric,ds,de,di} = this.props;    
        if(this.props.currentList===null){
            return (
                <div id="top5-workspace">
                    <div id="workspace-edit">
                        <div id="edit-numbering">
                            <div className="item-number">1.</div>
                            <div className="item-number">2.</div>
                            <div className="item-number">3.</div>
                            <div className="item-number">4.</div>
                            <div className="item-number">5.</div>
                        </div>
                        <div id = "edit-items">
                            <div id= "item-0" className="top5-item"></div>
                            <div id= "item-1" className="top5-item"></div>
                            <div id= "item-2" className="top5-item"></div>
                            <div id= "item-3" className="top5-item"></div>
                            <div id= "item-4" className="top5-item"></div>
                        </div>
                    </div>
                </div>
            );
        }
        else{
            let idxItmPair=[];
            for(let i = 0; i<5 ; i++){
                let pair= {"key":i,"value":this.props.currentList.items[i]}
                idxItmPair.push(pair);
            }
            return (
                <div id="top5-workspace">
                    <div id="workspace-edit">
                        <div id="edit-numbering">
                            <div className="item-number">1.</div>
                            <div className="item-number">2.</div>
                            <div className="item-number">3.</div>
                            <div className="item-number">4.</div>
                            <div className="item-number">5.</div>
                        </div>
                        <div id = "edit-items">
                            {
                                 idxItmPair.map((item) => (
                                    <Item
                                        name={item.value}
                                        index={item.key}
                                        ric={ric}
                                        ds={ds}
                                        de={de}
                                        di={di}
                                    />
                                ))
                            }
                        </div>
                    </div>
                </div>
            );
        }
    }
}