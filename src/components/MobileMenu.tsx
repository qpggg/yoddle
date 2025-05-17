const scrollToSubscriptionMobile = () => {
    const subscriptionSection = document.getElementById('subscription');
    if (subscriptionSection) {
        subscriptionSection.scrollIntoView({ behavior: 'smooth' });
    }
}; 