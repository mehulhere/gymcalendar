
'use client'

export function WorkoutMascot() {
    return (
        <div className="mascot-wrapper">
            <div className="mascot-container">
                {/* Head */}
                <div className="head" />

                {/* Neck */}
                <div className="neck" />

                {/* Torso */}
                <div className="torso">
                    <div className="abs-line" />
                    <div className="pec pec-left" />
                    <div className="pec pec-right" />
                </div>

                {/* Left Arm */}
                <div className="arm arm-left">
                    <div className="shoulder" />
                    <div className="bicep" />
                    <div className="forearm">
                        <div className="dumbbell" />
                    </div>
                </div>

                {/* Right Arm */}
                <div className="arm arm-right">
                    <div className="shoulder" />
                    <div className="bicep" />
                    <div className="forearm">
                        <div className="dumbbell" />
                    </div>
                </div>
            </div>

            <style jsx>{`
                .mascot-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    max-width: 180px;
                    height: 240px;
                }

                .mascot-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.2));
                }

                .head {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(16, 185, 129, 0.9);
                    border-radius: 50%;
                    background: transparent;
                }

                .neck {
                    position: absolute;
                    top: 38px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 20px;
                    height: 15px;
                    border-left: 2px solid rgba(16, 185, 129, 0.7);
                    border-right: 2px solid rgba(16, 185, 129, 0.7);
                    background: transparent;
                }

                .torso {
                    position: absolute;
                    top: 53px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 70px;
                    height: 80px;
                    border: 3px solid rgba(16, 185, 129, 0.9);
                    border-radius: 35px 35px 15px 15px;
                    background: transparent;
                }

                .abs-line {
                    position: absolute;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 2px;
                    height: 50px;
                    background: rgba(16, 185, 129, 0.6);
                }

                .pec {
                    position: absolute;
                    top: 10px;
                    width: 22px;
                    height: 18px;
                    border: 2px solid rgba(16, 185, 129, 0.6);
                    border-radius: 50%;
                    border-bottom: none;
                }

                .pec-left {
                    left: 8px;
                    border-right: none;
                }

                .pec-right {
                    right: 8px;
                    border-left: none;
                }

                .arm {
                    position: absolute;
                    top: 60px;
                }

                .arm-left {
                    left: 20px;
                    animation: curlLeft 2.5s ease-in-out infinite;
                }

                .arm-right {
                    right: 20px;
                    animation: curlRight 2.5s ease-in-out infinite;
                    animation-delay: -1.25s;
                }

                .shoulder {
                    position: relative;
                    width: 38px;
                    height: 38px;
                    border: 3px solid rgba(16, 185, 129, 0.9);
                    border-radius: 50%;
                    background: transparent;
                }

                .bicep {
                    position: absolute;
                    top: 32px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 32px;
                    height: 50px;
                    border: 3px solid rgba(16, 185, 129, 0.9);
                    border-radius: 50%;
                    background: transparent;
                    transform-origin: top center;
                }

                .bicep::after {
                    content: '';
                    position: absolute;
                    top: 15px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 28px;
                    height: 24px;
                    border: 2px solid rgba(16, 185, 129, 0.5);
                    border-radius: 50%;
                    animation: bicepPump 2.5s ease-in-out infinite;
                }

                .arm-right .bicep::after {
                    animation-delay: -1.25s;
                }

                .forearm {
                    position: absolute;
                    top: 78px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 22px;
                    height: 50px;
                    border: 3px solid rgba(16, 185, 129, 0.9);
                    border-radius: 30% 30% 25% 25%;
                    background: transparent;
                    transform-origin: top center;
                    animation: forearmCurl 2.5s ease-in-out infinite;
                }

                .arm-right .forearm {
                    animation-delay: -1.25s;
                }

                .dumbbell {
                    position: absolute;
                    bottom: -28px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 32px;
                    height: 10px;
                    background: rgba(16, 185, 129, 0.9);
                    border-radius: 5px;
                }

                .dumbbell::before,
                .dumbbell::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 10px;
                    height: 20px;
                    background: rgba(16, 185, 129, 0.9);
                    border-radius: 3px;
                }

                .dumbbell::before {
                    left: -8px;
                }

                .dumbbell::after {
                    right: -8px;
                }

                @keyframes curlLeft {
                    0%, 100% { 
                        transform: rotate(0deg);
                    }
                    50% { 
                        transform: rotate(-5deg);
                    }
                }

                @keyframes curlRight {
                    0%, 100% { 
                        transform: rotate(0deg);
                    }
                    50% { 
                        transform: rotate(5deg);
                    }
                }

                @keyframes forearmCurl {
                    0%, 100% { 
                        transform: translateX(-50%) rotate(90deg);
                    }
                    50% { 
                        transform: translateX(-50%) rotate(25deg);
                    }
                }

                @keyframes bicepPump {
                    0%, 100% { 
                        transform: translateX(-50%) scale(0.9);
                        opacity: 0.3;
                    }
                    50% { 
                        transform: translateX(-50%) scale(1.15);
                        opacity: 0.7;
                    }
                }
            `}</style>
        </div>
    )
}