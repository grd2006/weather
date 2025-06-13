import Lottie from 'lottie-react';

export default function Animation({ animationData, className }) {
    return (
        <Lottie
            animationData={animationData}
            className={className}
            loop={true}
            autoplay={true}
        />
    );
}