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

        this.initializeResponsive();
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

    initializeResponsive() {
        if (!this.settings.responsive) return;

        const sortedBreakpoints = this.settings.responsive
            .map(item => item.breakpoint)
            .sort((a, b) => b - a);

        this.breakpoints = sortedBreakpoints;
        this.currentBreakpoint = null;
        
        this.setupResponsiveEvents();
        this.respondToBreakpoint();
    }

    setupResponsiveEvents() {
        const debounced = this.debounce(this.respondToBreakpoint.bind(this), 150);
        window.addEventListener('resize', debounced);
        window.addEventListener('orientationchange', debounced);
    }

    respondToBreakpoint() {
        const breakpoint = this.getBreakpoint();
        if (breakpoint === this.currentBreakpoint) return;

        this.currentBreakpoint = breakpoint;
        
        if (breakpoint) {
            const matchedResponse = this.settings.responsive.find(
                resp => resp.breakpoint === breakpoint
            );

            if (matchedResponse) {
                const newSettings = matchedResponse.settings;
                if (newSettings === 'unslick') {
                    this.destroy();
                } else {
                    this.updateSettings(newSettings);
                }
            }
        } else {
            this.updateSettings(this.originalSettings);
        }
    }

    getBreakpoint() {
        const windowWidth = this.settings.respondTo === 'window' 
            ? window.innerWidth 
            : this.element.offsetWidth;

        return this.breakpoints.find(breakpoint => windowWidth < breakpoint) || null;
    }

    updateSettings(settings) {
        const prevSettings = { ...this.settings };
        this.settings = { ...this.settings, ...settings };

        // Reinitialize if critical settings changed
        if (
            prevSettings.slidesToShow !== this.settings.slidesToShow ||
            prevSettings.slidesToScroll !== this.settings.slidesToScroll ||
            prevSettings.vertical !== this.settings.vertical
        ) {
            this.reinitialize();
        }
    }

    reinitialize() {
        this.destroyEvents();
        this.initializeSlides();
        this.setupEventListeners();
        if (this.settings.arrows) this.buildArrows();
        if (this.settings.dots) this.buildDots();
        if (this.settings.autoplay) this.initAutoplay();
        this.setPosition();
    }

    setFade() {
        const slides = Array.from(this.trackElement.children);
        slides.forEach((slide, index) => {
            const leftOffset = this.slideWidth * index * -1;
            if (this.settings.rtl) {
                slide.style.position = 'relative';
                slide.style.right = leftOffset + 'px';
            } else {
                slide.style.position = 'relative';
                slide.style.left = leftOffset + 'px';
            }
        });
    }

    fadeSlideOut(slideIndex) {
        const slide = this.trackElement.children[slideIndex];
        if (!slide) return;

        slide.style.transition = `opacity ${this.settings.speed}ms ${this.settings.cssEase}`;
        slide.style.opacity = '0';
        slide.style.zIndex = this.settings.zIndex - 2;
    }

    fadeSlideIn(slideIndex) {
        const slide = this.trackElement.children[slideIndex];
        if (!slide) return;

        slide.style.transition = `opacity ${this.settings.speed}ms ${this.settings.cssEase}`;
        slide.style.opacity = '1';
        slide.style.zIndex = this.settings.zIndex - 1;
    }

    setPosition() {
        this.setDimensions();
        if (this.settings.fade) {
            this.setFade();
        } else {
            this.setCSS(this.getLeft(this.currentSlide));
        }
    }

    setDimensions() {
        const slides = Array.from(this.trackElement.children);
        const slideWidth = this.slideWidth;

        slides.forEach(slide => {
            slide.style.width = slideWidth + 'px';
        });

        this.trackElement.style.width = 
            (slideWidth * slides.length) + 'px';
    }

    setCSS(position) {
        const transform = this.settings.vertical
            ? `translate3d(0px, ${position}px, 0px)`
            : `translate3d(${position}px, 0px, 0px)`;

        this.trackElement.style.transform = transform;
    }

    setupA11y() {
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'carousel');

        const slides = Array.from(this.trackElement.children);
        slides.forEach((slide, index) => {
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-label', `slide ${index + 1} of ${slides.length}`);
            
            if (index === this.currentSlide) {
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.setAttribute('aria-hidden', 'true');
            }
        });

        if (this.settings.arrows) {
            const prevArrow = this.element.querySelector('.slick-prev');
            const nextArrow = this.element.querySelector('.slick-next');
            
            if (prevArrow) {
                prevArrow.setAttribute('role', 'button');
                prevArrow.setAttribute('aria-label', 'Previous slide');
            }
            
            if (nextArrow) {
                nextArrow.setAttribute('role', 'button');
                nextArrow.setAttribute('aria-label', 'Next slide');
            }
        }
    }

    updateA11y() {
        const slides = Array.from(this.trackElement.children);
        slides.forEach((slide, index) => {
            if (index === this.currentSlide) {
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.setAttribute('aria-hidden', 'true');
            }
        });
    }

    destroy() {
        this.destroyEvents();
        this.element.classList.remove('slick-slider');
        this.element.innerHTML = this.originalHTML;
        this.element.removeAttribute('role');
        this.element.removeAttribute('aria-label');
    }

    destroyEvents() {
        this.autoPlayClear();
        // Remove all event listeners...
        // This would need to store references to bound event handlers
    }

    // Utility method for debouncing resize events
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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
