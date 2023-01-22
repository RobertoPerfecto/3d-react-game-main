import classes from './Timer.module.css'

function Timer({gameStage, timer, color}) {
    let msg_title = "";
    if (gameStage === "HIDING") {
        msg_title = "hide";
    }
    if (gameStage === "SEEKING") {
        msg_title = "seek";
    }
    return (
        <div className={classes.timer} >
            <p style={{color}}> Time to {msg_title}:
            {millisToMinutesAndSeconds(timer)}
            </p>
        </div>
    );
}

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

export default Timer;