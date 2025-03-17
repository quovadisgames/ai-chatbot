// Carousel Functionality for Landing Page
document.addEventListener('DOMContentLoaded', function() {
    initCarousel();
});

function initCarousel() {
    const carousel = document.getElementById('showcase-carousel');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (!carousel || dots.length === 0) {
        console.warn('Carousel elements not found');
        return;
    }
    
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const slideIndex = this.getAttribute('data-slide');
            const slideWidth = carousel.querySelector('.carousel-slide').offsetWidth;
            
            carousel.scrollTo({
                left: slideWidth * slideIndex,
                behavior: 'smooth'
            });
            
            // Update active dot
            dots.forEach(d => d.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Update dots on scroll
    carousel.addEventListener('scroll', function() {
        const slideWidth = carousel.querySelector('.carousel-slide').offsetWidth;
        const scrollPosition = carousel.scrollLeft;
        const activeIndex = Math.round(scrollPosition / slideWidth);
        
        dots.forEach((dot, index) => {
            if (index === activeIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    });
    
    // Auto-advance carousel every 5 seconds
    let carouselInterval = setInterval(advanceCarousel, 5000);
    
    // Pause auto-advance when user interacts with carousel
    carousel.addEventListener('mouseenter', function() {
        clearInterval(carouselInterval);
    });
    
    carousel.addEventListener('mouseleave', function() {
        carouselInterval = setInterval(advanceCarousel, 5000);
    });
    
    // Function to advance carousel to next slide
    function advanceCarousel() {
        const activeIndex = Array.from(dots).findIndex(dot => dot.classList.contains('active'));
        const nextIndex = (activeIndex + 1) % dots.length;
        dots[nextIndex].click();
    }
} 