import React from "react";

export default class Item extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            text: this.props.name,
            editActive: false,
        }
    }
    handleClick = (event) => {
        if (event.detail === 2) {
            this.handleToggleEdit(event);
        }
    }

    handleToggleEdit = (event) => {
        this.setState({
            editActive: !this.state.editActive
        });
    }
    handleUpdate = (event) => {
        this.setState({ text: event.target.value });
    }
    handleKeyPress = (event) => {
        if (event.code === "Enter") {
            this.handleBlur();
        }
    }
    handleBlur = () => {
        let textValue = this.state.text;
        console.log("ListCard handleBlur: " + textValue);
        this.props.ric(this.props.index,textValue);
        this.handleToggleEdit();
    }
    highlight = () => {
        this.props.de(this.props.index);
        let target=document.getElementById("item-"+this.props.index);
        target.classList.add("top5-item-dragged-to");
        this.render();
    }
    unhighlight = () => {
        let target=document.getElementById("item-"+this.props.index);
        target.classList.remove("top5-item-dragged-to")
        this.render();
    }
    handleDragStart = () => {
        this.props.ds(this.props.index);
    }
    drag = () => {
        this.props.di();
    }
    render() {
        const{index,name} = this.props;
        if (this.state.editActive) {
            return (
                <input
                    id={"item-"+index}
                    className={"item-number"}
                    type='text'
                    onKeyPress={this.handleKeyPress}
                    onBlur={this.handleBlur}
                    onChange={this.handleUpdate}
                    defaultValue={name}
                />)
        }
        else {
            return (
                <div id={"item-"+index} 
                    className="top5-item" 
                    draggable="true"
                    onClick={this.handleClick}
                    onDragStart={this.handleDragStart}
                    onDragOver={this.highlight}
                    onDragEnd={this.drag}
                    onDragExit={this.unhighlight}
                    >
                    {name}
                </div>                
            )
        }
    }
}