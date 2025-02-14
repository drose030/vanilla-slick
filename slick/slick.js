class Slick {
    static defaults = {
        accessibility: true,
        adaptiveHeight: false,
        appendArrows: null,
        appendDots: null,
        arrows: true,
        asNavFor: null,
        prevArrow: '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
        nextArrow: '<button class="slick-next" aria-label="Next" type="button">Next</button>',
        autoplay: false,
        autoplaySpeed: 3000,
        centerMode: false,
        centerPadding: '50px',
        cssEase: 'ease',
        customPaging: (slider, i) => {
            return `<button type="button">${i + 1}</button>`;
        },
        dots: false,
        dotsClass: 'slick-dots',
        draggable: true,
        easing: 'linear',
        edgeFriction: 0.35,
        fade: false,
        focusOnSelect: false,
        focusOnChange: false,
        infinite: true,
        initialSlide: 0,
        lazyLoad: 'ondemand',
        mobileFirst: false,
        pauseOnHover: true,
        pauseOnFocus: true,
        pauseOnDotsHover: false,
        respondTo: 'window',
        responsive: null,
        rows: 1,
        rtl: false,
        slide: '',
        slidesPerRow: 1,
        slidesToShow: 1,
        slidesToScroll: 1,
        speed: 500,
        swipe: true,
        swipeToSlide: false,
        touchMove: true,
        touchThreshold: 5,
        useCSS: true,
        useTransform: true,
        variableWidth: false,
        vertical: false,
        waitForAnimate: true,
        zIndex: 1000
    };

    constructor(element, settings = {}) {
        if (!(element instanceof Element)) {
            element = document.querySelector(element);
        }
        
        this.element = element;
        this.settings = { ...Slick.defaults, ...settings };
        this.currentSlide = 0;
        this.slideCount = 0;
        this.dragging = false;
        this.touchObject = {};
        
        this.init();
    }

    init() {
        // Add necessary classes
        this.element.classList.add('slick-slider');
        
        // Create track element
        this.trackElement = document.createElement('div');
        this.trackElement.classList.add('slick-track');
        
        // Create list element
        this.listElement = document.createElement('div');
        this.listElement.classList.add('slick-list');
        
        // Build the structure
        this.listElement.appendChild(this.trackElement);
        this.element.appendChild(this.listElement);
        
        // Initialize slides
        this.initializeSlides();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Initialize arrows if enabled
        if (this.settings.arrows) {
            this.buildArrows();
        }
        
        // Initialize dots if enabled
        if (this.settings.dots) {
            this.buildDots();
        }
        
        // Initialize autoplay if enabled
        if (this.settings.autoplay) {
            this.initAutoplay();
        }
    }

    initializeSlides() {
        const slides = Array.from(this.element.children).filter(
            child => !child.classList.contains('slick-track') && 
                     !child.classList.contains('slick-list')
        );
        
        this.slideCount = slides.length;
        
        slides.forEach(slide => {
            slide.classList.add('slick-slide');
            this.trackElement.appendChild(slide);
        });
        
        this.updateSlideVisibility();
    }

    setupEventListeners() {
        // Touch events
        this.listElement.addEventListener('touchstart', e => this.swipeStart(e));
        this.listElement.addEventListener('touchmove', e => this.swipeMove(e));
        this.listElement.addEventListener('touchend', e => this.swipeEnd(e));
        
        // Mouse events
        if (this.settings.draggable) {
            this.listElement.addEventListener('mousedown', e => this.swipeStart(e));
            this.listElement.addEventListener('mousemove', e => this.swipeMove(e));
            this.listElement.addEventListener('mouseup', e => this.swipeEnd(e));
            this.listElement.addEventListener('mouseleave', e => this.swipeEnd(e));
        }
    }

    // Public API methods
    slickNext() {
        this.changeSlide({
            data: {
                message: 'next'
            }
        });
    }

    slickPrev() {
        this.changeSlide({
            data: {
                message: 'previous'
            }
        });
    }

    slickGoTo(slide, dontAnimate = false) {
        slide = parseInt(slide);
        if (isNaN(slide)) slide = 0;
        this.changeSlide({
            data: {
                message: 'index',
                index: slide,
                dontAnimate: dontAnimate
            }
        });
    }

    slickPlay() {
        this.autoPlay();
    }

    slickPause() {
        this.autoPlayClear();
    }

    // Helper methods for slide transitions
    changeSlide(options) {
        const { message, index, dontAnimate } = options.data;
        let targetSlide = this.currentSlide;
        
        switch (message) {
            case 'previous':
                targetSlide = this.currentSlide - this.settings.slidesToScroll;
                break;
            case 'next':
                targetSlide = this.currentSlide + this.settings.slidesToScroll;
                break;
            case 'index':
                targetSlide = index;
                break;
        }
        
        this.slideHandler(targetSlide, dontAnimate);
    }

    slideHandler(index, dontAnimate = false) {
        if (this.settings.fade) {
            this.fadeSlideOut(this.currentSlide);
            this.fadeSlideIn(index);
        } else {
            this.animateSlide(index, dontAnimate);
        }
        
        this.currentSlide = index;
        this.updateSlideVisibility();
    }

    animateSlide(targetSlide, dontAnimate = false) {
        const animProps = {};
        const targetLeft = this.getLeft(targetSlide);
        
        if (dontAnimate !== true) {
            this.trackElement.style.transition = `transform ${this.settings.speed}ms ${this.settings.cssEase}`;
        }

        if (this.settings.vertical) {
            animProps.transform = `translate3d(0px, ${targetLeft}px, 0px)`;
        } else {
            animProps.transform = `translate3d(${targetLeft}px, 0px, 0px)`;
        }

        Object.assign(this.trackElement.style, animProps);
    }

    getLeft(slideIndex) {
        let targetLeft = 0;
        let verticalOffset = 0;
        let slideOffset = 0;
        const slideWidth = this.slideWidth;

        if (this.settings.infinite) {
            if (slideIndex + this.settings.slidesToShow > this.slideCount) {
                slideOffset = -this.slideCount * slideWidth;
            }
            if (slideIndex < 0) {
                slideOffset = this.slideCount * slideWidth;
            }
        }

        if (this.settings.vertical) {
            targetLeft = (slideIndex * this.slideHeight) + verticalOffset;
        } else {
            targetLeft = (slideIndex * slideWidth) + slideOffset;
        }

        return targetLeft * -1;
    }

    swipeStart(event) {
        if (this.settings.swipe === false) return;

        const touches = event.touches ? event.touches[0] : event;
        
        this.touchObject = {
            startX: touches.pageX,
            startY: touches.pageY,
            curX: touches.pageX,
            curY: touches.pageY
        };

        this.dragging = true;
    }

    swipeMove(event) {
        if (!this.dragging) return;
        
        const touches = event.touches ? event.touches[0] : event;
        const curLeft = this.getLeft(this.currentSlide);

        this.touchObject.curX = touches.pageX;
        this.touchObject.curY = touches.pageY;

        const swipeLength = Math.round(Math.sqrt(
            Math.pow(this.touchObject.curX - this.touchObject.startX, 2)
        ));

        const edgeWasHit = this.checkNavigable(this.currentSlide);
        const shouldSlide = this.shouldSlide(swipeLength);

        if (!shouldSlide || edgeWasHit) {
            this.touchObject = {};
            return;
        }

        let swipeDirection = this.getSwipeDirection();
        let targetLeft = curLeft;

        if (swipeDirection === 'left') {
            targetLeft = curLeft + swipeLength;
        } else if (swipeDirection === 'right') {
            targetLeft = curLeft - swipeLength;
        }

        this.animateSlide(targetLeft, true);
    }

    swipeEnd(event) {
        if (!this.dragging) return;
        
        this.dragging = false;
        
        const swipeLength = Math.round(Math.sqrt(
            Math.pow(this.touchObject.curX - this.touchObject.startX, 2)
        ));

        if (swipeLength < this.settings.touchThreshold) {
            this.animateSlide(this.currentSlide);
            return;
        }

        const swipeDirection = this.getSwipeDirection();
        
        if (swipeDirection === 'left') {
            this.slickNext();
        } else if (swipeDirection === 'right') {
            this.slickPrev();
        }

        this.touchObject = {};
    }

    getSwipeDirection() {
        const xDist = this.touchObject.startX - this.touchObject.curX;
        const yDist = this.touchObject.startY - this.touchObject.curY;
        const r = Math.atan2(yDist, xDist);
        let swipeAngle = Math.round(r * 180 / Math.PI);
        
        if (swipeAngle < 0) {
            swipeAngle = 360 - Math.abs(swipeAngle);
        }

        if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
            return 'left';
        }
        if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
            return 'left';
        }
        if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
            return 'right';
        }

        return 'vertical';
    }

    buildArrows() {
        const prevArrow = this.createElementFromHTML(this.settings.prevArrow);
        const nextArrow = this.createElementFromHTML(this.settings.nextArrow);
        
        prevArrow.classList.add('slick-prev');
        nextArrow.classList.add('slick-next');

        if (this.settings.appendArrows) {
            const appendTo = typeof this.settings.appendArrows === 'string' 
                ? document.querySelector(this.settings.appendArrows) 
                : this.settings.appendArrows;
            appendTo.appendChild(prevArrow);
            appendTo.appendChild(nextArrow);
        } else {
            this.element.appendChild(prevArrow);
            this.element.appendChild(nextArrow);
        }

        prevArrow.addEventListener('click', () => this.slickPrev());
        nextArrow.addEventListener('click', () => this.slickNext());
    }

    buildDots() {
        const dots = document.createElement('ul');
        dots.classList.add(this.settings.dotsClass);

        for (let i = 0; i < Math.ceil(this.slideCount / this.settings.slidesToScroll); i++) {
            const dot = document.createElement('li');
            const button = this.settings.customPaging(this, i);
            
            if (typeof button === 'string') {
                dot.innerHTML = button;
            } else {
                dot.appendChild(button);
            }
            
            dot.addEventListener('click', () => this.slickGoTo(i * this.settings.slidesToScroll));
            dots.appendChild(dot);
        }

        if (this.settings.appendDots) {
            const appendTo = typeof this.settings.appendDots === 'string'
                ? document.querySelector(this.settings.appendDots)
                : this.settings.appendDots;
            appendTo.appendChild(dots);
        } else {
            this.element.appendChild(dots);
        }
    }

    initAutoplay() {
        if (this.settings.autoplay) {
            this.autoPlayTimer = setInterval(() => {
                this.slickNext();
            }, this.settings.autoplaySpeed);

            if (this.settings.pauseOnHover) {
                this.element.addEventListener('mouseenter', () => this.autoPlayClear());
                this.element.addEventListener('mouseleave', () => this.autoPlay());
            }
        }
    }

    autoPlayClear() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }

    autoPlay() {
        if (this.autoPlayTimer) {
            this.autoPlayClear();
        }
        this.initAutoplay();
    }

    // Utility methods
    createElementFromHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }

    checkNavigable(index) {
        const navigables = this.getNavigableIndexes();
        return navigables.includes(index);
    }

    getNavigableIndexes() {
        let indexes = [];
        let max = this.slideCount - this.settings.slidesToShow;

        if (!this.settings.infinite) {
            for (let i = 0; i <= max; i++) {
                if (i % this.settings.slidesToScroll === 0) {
                    indexes.push(i);
                }
            }
        }

        return indexes;
    }

    shouldSlide(swipeLength) {
        return swipeLength > this.settings.touchThreshold;
    }

    get slideWidth() {
        return this.element.offsetWidth / this.settings.slidesToShow;
    }

    get slideHeight() {
        return this.element.offsetHeight / this.settings.slidesToShow;
    }

    updateSlideVisibility() {
        const slides = this.trackElement.children;
        Array.from(slides).forEach((slide, index) => {
            if (index >= this.currentSlide && 
                index < this.currentSlide + this.settings.slidesToShow) {
                slide.style.display = 'block';
            } else {
                slide.style.display = 'none';
            }
        });
    }

    // Add static method for jQuery compatibility
    static jQueryInterface(config) {
        return this.each(function() {
            let data = this.dataset.slick;
            const options = {
                ...Slick.defaults,
                ...(typeof config === 'object' && config),
                ...(data && JSON.parse(data))
            };
            
            if (!this.slick) {
                this.slick = new Slick(this, options);
            }
            
            if (typeof config === 'string') {
                if (typeof this.slick[config] === 'function') {
                    this.slick[config]();
                }
            }
        });
    }
}

// Add jQuery compatibility layer if jQuery is present
if (typeof window.jQuery !== 'undefined') {
    window.jQuery.fn.slick = Slick.jQueryInterface;
}

export default Slick;
