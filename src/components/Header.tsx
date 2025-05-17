const scrollToSubscription = () => {
    const subscriptionSection = document.getElementById('subscription');
    if (subscriptionSection) {
        const offset = -100; // смещение на 100px выше
        const topPos = subscriptionSection.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top: topPos, behavior: 'smooth' });
    }
}; 