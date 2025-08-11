document.addEventListener("DOMContentLoaded", function() {
    const slidesContainer = document.querySelector(".slides");
    const slides = document.querySelectorAll(".slides img");
    const navDots = document.querySelectorAll(".slider-nav div");
    let currentIndex = 0;
    let slideTimer;
    let gap, slideWidth;

    // Read measurements
    function updateMeasurements() {
        gap = parseInt(
            window.getComputedStyle(slidesContainer).getPropertyValue("gap"),
            10
        );
        // recalc slideWidth in case images have resized
        slideWidth = slides[0].offsetWidth;
    }

    function moveSlide(index) {
        slidesContainer.scrollLeft = index * (slideWidth + gap);
    }

    function resetDots() {
        navDots.forEach(dot => {
            dot.style.opacity = "0.5";
            dot.style.backgroundColor = "white";
        });
    }

    function updateSlide(index) {
        navDots[index].style.opacity = "1";
        navDots[index].style.backgroundColor = "red";
    }

    function startSlideshow() {
        slideTimer = setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            resetDots();
            updateSlide(currentIndex);
            moveSlide(currentIndex);
        }, 2000);
    }

    // Initial measurements and slideshow kickoff
    updateMeasurements();
    startSlideshow();

    // Recalculate on resize
    window.addEventListener("resize", () => {
        clearInterval(slideTimer);
        updateMeasurements();
        // reposition to current slide with new measurements
        moveSlide(currentIndex);
        startSlideshow();
    });

    navDots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            clearInterval(slideTimer);
            currentIndex = index;
            resetDots();
            updateSlide(currentIndex);
            moveSlide(currentIndex);
            startSlideshow();
        });
    });
});
