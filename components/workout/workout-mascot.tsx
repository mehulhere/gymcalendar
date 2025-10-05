'use client'

export function WorkoutMascot() {
    return (
        <div className="flex items-center justify-center">
            <div className="mascot-container">
                <div className="mascot-head" />
                <div className="mascot-body" />
                <div className="mascot-belt" />
                <div className="mascot-leg mascot-leg-left" />
                <div className="mascot-leg mascot-leg-right" />

                <div className="mascot-arm mascot-arm-left">
                    <div className="mascot-forearm" />
                    <div className="mascot-dumbbell mascot-dumbbell-left" />
                </div>
                <div className="mascot-arm mascot-arm-right">
                    <div className="mascot-forearm" />
                    <div className="mascot-dumbbell mascot-dumbbell-right" />
                </div>
            </div>

            <style jsx>{`
                .mascot-container {
                    position: relative;
                    width: 96px;
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mascot-head {
                    position: absolute;
                    top: 0;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: linear-gradient(145deg, rgba(16, 185, 129, 0.8), rgba(6, 95, 70, 0.95));
                    box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
                }

                .mascot-body {
                    position: absolute;
                    top: 28px;
                    width: 48px;
                    height: 54px;
                    border-radius: 24px;
                    background: linear-gradient(160deg, rgba(16, 185, 129, 0.75), rgba(5, 150, 105, 0.95));
                    box-shadow: inset 0 0 12px rgba(4, 120, 87, 0.4);
                }

                .mascot-belt {
                    position: absolute;
                    top: 58px;
                    width: 46px;
                    height: 10px;
                    border-radius: 999px;
                    background: rgba(15, 118, 110, 0.9);
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
                }

                .mascot-leg {
                    position: absolute;
                    bottom: 0;
                    width: 14px;
                    height: 42px;
                    border-radius: 999px;
                    background: linear-gradient(180deg, rgba(13, 148, 136, 0.75), rgba(6, 78, 59, 0.95));
                }

                .mascot-leg-left {
                    left: 22px;
                }

                .mascot-leg-right {
                    right: 22px;
                }

                .mascot-arm {
                    position: absolute;
                    top: 38px;
                    width: 14px;
                    height: 38px;
                    border-radius: 999px;
                    background: linear-gradient(145deg, rgba(13, 148, 136, 0.75), rgba(4, 120, 87, 0.95));
                    transform-origin: top center;
                    animation: curl 2.2s ease-in-out infinite;
                }

                .mascot-arm-left {
                    left: 4px;
                    transform: rotate(26deg);
                }

                .mascot-arm-right {
                    right: 4px;
                    transform: rotate(-26deg);
                    animation-delay: -1.1s;
                }

                .mascot-forearm {
                    position: absolute;
                    bottom: -26px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 12px;
                    height: 32px;
                    border-radius: 999px;
                    background: linear-gradient(145deg, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.95));
                    transform-origin: top center;
                    animation: forearm 2.2s ease-in-out infinite;
                }

                .mascot-arm-right .mascot-forearm {
                    animation-delay: -1.1s;
                }

                .mascot-dumbbell {
                    position: absolute;
                    bottom: -42px;
                    width: 34px;
                    height: 14px;
                    border-radius: 10px;
                    background: rgba(16, 185, 129, 0.4);
                    box-shadow: inset 0 0 6px rgba(16, 185, 129, 0.55);
                    transform-origin: center;
                }

                .mascot-dumbbell::before,
                .mascot-dumbbell::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 8px;
                    height: 18px;
                    border-radius: 4px;
                    background: rgba(110, 231, 183, 0.9);
                }

                .mascot-dumbbell::before {
                    left: -6px;
                }

                .mascot-dumbbell::after {
                    right: -6px;
                }

                .mascot-dumbbell-left {
                    left: -10px;
                }

                .mascot-dumbbell-right {
                    right: -10px;
                    animation-delay: -1.1s;
                }

                @keyframes curl {
                    0%, 100% {
                        transform: rotate(26deg);
                    }
                    50% {
                        transform: rotate(-5deg);
                    }
                }

                .mascot-arm-right {
                    animation-name: curlRight;
                }

                @keyframes curlRight {
                    0%, 100% {
                        transform: rotate(-26deg);
                    }
                    50% {
                        transform: rotate(5deg);
                    }
                }

                @keyframes forearm {
                    0%, 100% {
                        transform: translateX(-50%) rotate(35deg);
                    }
                    50% {
                        transform: translateX(-50%) rotate(-35deg);
                    }
                }

                .mascot-arm-right .mascot-forearm {
                    animation-name: forearmRight;
                }

                @keyframes forearmRight {
                    0%, 100% {
                        transform: translateX(-50%) rotate(-35deg);
                    }
                    50% {
                        transform: translateX(-50%) rotate(35deg);
                    }
                }
            `}</style>
        </div>
    )
}

