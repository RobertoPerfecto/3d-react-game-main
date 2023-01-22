import classes from './RoomForm.module.css'

const RoomForm = (props) => {

    const socket = props.socket;

    const onSubmit = (event) => {
        event.preventDefault();
        const room = event.target?.room?.value;
        socket.emit('join_room', room);
        event.target.reset();
        alert('You joined the room '+room);
    }

    return (
    <form className={classes.form} onSubmit={onSubmit}>
        <input type="text" placeholder="Room" name='room'/>
        <button>Join</button>
    </form>
    )
}

export default RoomForm;