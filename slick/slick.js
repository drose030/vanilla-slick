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

    initializeLazyLoad() {
        if (this.settings.lazyLoad !== 'ondemand') return;

        const slides = Array.from(this.trackElement.children);
        slides.forEach(slide => {
            const images = slide.querySelectorAll('[data-lazy]');
            images.forEach(img => {
                img.classList.add('slick-loading');
                this.setupLazyLoadHandler(img);
            });
        });
    }

    setupLazyLoadHandler(img) {
        const loadImage = () => {
            const src = img.getAttribute('data-lazy');
            img.src = src;
            img.removeAttribute('data-lazy');
            img.classList.remove('slick-loading');
            img.classList.add('slick-loaded');
        };

        if (this.isElementInViewport(img)) {
            loadImage();
        } else {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loadImage();
                        observer.disconnect();
                    }
                });
            });
            observer.observe(img);
        }
    }

    setupCenterMode() {
        if (!this.settings.centerMode) return;

        this.element.classList.add('slick-center');
        const padding = this.settings.centerPadding;
        
        this.element.style.padding = `0 ${padding}`;
        this.updateCenterOffset();
    }

    updateCenterOffset() {
        if (!this.settings.centerMode) return;

        const centerOffset = Math.floor(this.settings.slidesToShow / 2);
        const rtlOffset = this.settings.rtl ? 1 : 0;
        
        this.currentLeftOffset = (this.slideWidth * centerOffset) * (this.settings.rtl ? 1 : -1);
        this.setCSS(this.getLeft(this.currentSlide + centerOffset - rtlOffset));
    }

    setupRTL() {
        if (!this.settings.rtl) return;

        this.element.dir = 'rtl';
        this.element.classList.add('slick-rtl');

        // Reverse the order of slides for RTL
        const slides = Array.from(this.trackElement.children);
        slides.reverse().forEach(slide => this.trackElement.appendChild(slide));
    }

    setupVariableWidth() {
        if (!this.settings.variableWidth) return;

        this.trackElement.style.width = '';
        Array.from(this.trackElement.children).forEach(slide => {
            slide.style.width = '';
        });
    }

    setupVerticalMode() {
        if (!this.settings.vertical) return;

        this.element.classList.add('slick-vertical');
        this.setVerticalDimensions();
    }

    setVerticalDimensions() {
        const slides = Array.from(this.trackElement.children);
        const totalHeight = slides.reduce((acc, slide) => 
            acc + slide.offsetHeight, 0);
        
        this.trackElement.style.height = totalHeight + 'px';
        slides.forEach(slide => {
            slide.style.height = 'auto';
        });
    }

    setupRows() {
        if (this.settings.rows <= 1) return;

        const slides = Array.from(this.trackElement.children);
        const slidesPerRow = Math.ceil(slides.length / this.settings.rows);
        let newSlides = [];

        for (let i = 0; i < this.settings.rows; i++) {
            const row = document.createElement('div');
            row.className = 'slick-row';

            for (let j = 0; j < slidesPerRow; j++) {
                const slideIndex = i * slidesPerRow + j;
                if (slideIndex < slides.length) {
                    row.appendChild(slides[slideIndex].cloneNode(true));
                }
            }

            newSlides.push(row);
        }

        this.trackElement.innerHTML = '';
        newSlides.forEach(row => this.trackElement.appendChild(row));
    }

    addEventHandlers() {
        // Keyboard navigation
        if (this.settings.accessibility) {
            document.addEventListener('keydown', this.handleKeyboard.bind(this));
        }

        // Focus handling
        if (this.settings.focusOnSelect) {
            this.element.addEventListener('click', this.handleFocusSelect.bind(this));
        }

        // Mouse wheel navigation
        if (this.settings.mouseWheel) {
            this.element.addEventListener('wheel', this.handleMouseWheel.bind(this));
        }
    }

    handleKeyboard(event) {
        if (!this.element.contains(document.activeElement)) return;

        switch(event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                this.settings.rtl ? this.slickNext() : this.slickPrev();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.settings.rtl ? this.slickPrev() : this.slickNext();
                break;
            case 'ArrowUp':
                if (this.settings.vertical) {
                    event.preventDefault();
                    this.slickPrev();
                }
                break;
            case 'ArrowDown':
                if (this.settings.vertical) {
                    event.preventDefault();
                    this.slickNext();
                }
                break;
        }
    }

    handleFocusSelect(event) {
        const slide = event.target.closest('.slick-slide');
        if (!slide) return;

        const slideIndex = Array.from(this.trackElement.children).indexOf(slide);
        if (slideIndex >= 0) {
            this.slickGoTo(slideIndex);
            slide.focus();
        }
    }

    handleMouseWheel(event) {
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        
        if (delta > 0) {
            this.slickNext();
        } else if (delta < 0) {
            this.slickPrev();
        }
    }

    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }

    refresh() {
        this.setPosition();
        this.updateA11y();
        if (this.settings.lazyLoad === 'ondemand') {
            this.initializeLazyLoad();
        }
    }

    setupSyncedSliders() {
        if (!this.settings.asNavFor) return;

        const targetSlider = document.querySelector(this.settings.asNavFor);
        if (!targetSlider || !targetSlider.slick) return;

        this.navTarget = targetSlider.slick;
        this.navTarget.navSource = this;

        // Sync initial state
        this.syncPosition();
    }

    syncPosition() {
        if (!this.navTarget) return;

        const targetSlide = this.currentSlide;
        if (this.navTarget.currentSlide !== targetSlide) {
            this.navTarget.slickGoTo(targetSlide, true);
        }
    }

    setupEdgeFriction() {
        if (!this.settings.edgeFriction || this.settings.infinite) return;

        let startPosition = null;
        let currentPosition = null;

        const handleDragStart = (e) => {
            startPosition = this.getPointerPosition(e);
            currentPosition = startPosition;
        };

        const handleDragMove = (e) => {
            if (!startPosition) return;

            currentPosition = this.getPointerPosition(e);
            const delta = currentPosition - startPosition;

            if (this.isAtEdge()) {
                const friction = this.calculateEdgeFriction(delta);
                this.applyFriction(friction, delta);
            }
        };

        const handleDragEnd = () => {
            startPosition = null;
            currentPosition = null;
            this.resetPosition();
        };

        this.element.addEventListener('mousedown', handleDragStart);
        this.element.addEventListener('mousemove', handleDragMove);
        this.element.addEventListener('mouseup', handleDragEnd);
        this.element.addEventListener('mouseleave', handleDragEnd);
    }

    setupCallbacks() {
        this.callbacks = {
            beforeChange: [],
            afterChange: [],
            init: [],
            destroy: [],
            edge: [],
            swipe: [],
            lazyLoaded: [],
            lazyLoadError: []
        };
    }

    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event]
                .filter(cb => cb !== callback);
        }
    }

    trigger(event, ...args) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback.apply(this, args));
        }
    }

    enhanceAnimations() {
        if (!this.settings.useTransform) return;

        const prefixes = ['', 'webkit', 'Moz', 'ms'];
        const style = this.trackElement.style;

        prefixes.forEach(prefix => {
            const transform = prefix ? `-${prefix.toLowerCase()}-transform` : 'transform';
            style[`${prefix}Transform`] = '';
            style[`${prefix}Transition`] = '';
        });

        if (this.settings.cssEase !== 'ease') {
            this.setupCustomEasing();
        }
    }

    setupCustomEasing() {
        const easingFunction = this.getEasingFunction();
        this.trackElement.style.transition = 
            `transform ${this.settings.speed}ms ${easingFunction}`;
    }

    getEasingFunction() {
        // Custom easing functions
        const easings = {
            easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
            easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
            easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
            easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
            easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
            easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
            easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
            easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)'
        };

        return easings[this.settings.cssEase] || this.settings.cssEase;
    }

    setupTouchOptimization() {
        // Add hardware acceleration
        this.trackElement.style.willChange = 'transform';
        
        // Optimize paint layers
        this.element.style.backfaceVisibility = 'hidden';
        this.element.style.perspective = '1000px';
        
        // Prevent text selection during swipe
        this.element.style.userSelect = 'none';
        this.element.style.webkitUserSelect = 'none';
        this.element.style.mozUserSelect = 'none';
        this.element.style.msUserSelect = 'none';
    }

    setupInfiniteLoop() {
        if (!this.settings.infinite) return;

        const slides = Array.from(this.trackElement.children);
        const slidesToShow = this.settings.slidesToShow;
        const slidesToScroll = this.settings.slidesToScroll;

        // Clone slides for infinite loop
        const beforeClones = slides.slice(-slidesToShow).map(slide => 
            slide.cloneNode(true));
        const afterClones = slides.slice(0, slidesToShow).map(slide => 
            slide.cloneNode(true));

        // Add clone classes
        beforeClones.forEach(clone => clone.classList.add('slick-cloned'));
        afterClones.forEach(clone => clone.classList.add('slick-cloned'));

        // Insert clones
        beforeClones.forEach(clone => 
            this.trackElement.insertBefore(clone, this.trackElement.firstChild));
        afterClones.forEach(clone => 
            this.trackElement.appendChild(clone));

        // Update positions
        this.updateInfinitePositions();
    }

    updateInfinitePositions() {
        if (!this.settings.infinite) return;

        const slideCount = this.slideCount;
        const slidesToShow = this.settings.slidesToShow;

        if (this.currentSlide <= -slidesToShow) {
            this.currentSlide += slideCount;
            this.setPosition();
        } else if (this.currentSlide >= slideCount) {
            this.currentSlide -= slideCount;
            this.setPosition();
        }
    }

    setupProgressBar() {
        if (!this.settings.progressBar) return;

        this.progressBar = document.createElement('div');
        this.progressBar.classList.add('slick-progress');
        this.element.appendChild(this.progressBar);

        this.updateProgressBar();
    }

    updateProgressBar() {
        if (!this.progressBar) return;

        const progress = (this.currentSlide / (this.slideCount - 1)) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    getPointerPosition(event) {
        return event.touches ? 
            event.touches[0].clientX : 
            event.clientX;
    }

    isAtEdge() {
        return (this.currentSlide === 0 && !this.settings.infinite) || 
               (this.currentSlide === this.slideCount - 1 && !this.settings.infinite);
    }

    calculateEdgeFriction(delta) {
        const edgeWane = 0.39;
        return Math.pow(Math.abs(delta) / this.slideWidth, edgeWane);
    }

    applyFriction(friction, delta) {
        const position = this.getLeft(this.currentSlide);
        const adjustment = delta * friction;
        this.setCSS(position + adjustment);
    }

    resetPosition() {
        this.setPosition();
    }

    setupDynamicContent() {
        this.observer = new MutationObserver(mutations => {
            let needsRefresh = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && 
                    mutation.target === this.trackElement) {
                    needsRefresh = true;
                }
            });

            if (needsRefresh) {
                this.refresh();
                this.trigger('contentChange');
            }
        });

        this.observer.observe(this.trackElement, {
            childList: true,
            subtree: true
        });
    }

    addSlide(element, index = null) {
        const slide = element instanceof Element ? 
            element : 
            this.createElementFromHTML(element);
        
        slide.classList.add('slick-slide');

        if (index === null || index >= this.slideCount) {
            this.trackElement.appendChild(slide);
        } else {
            const target = this.trackElement.children[index];
            this.trackElement.insertBefore(slide, target);
        }

        this.slideCount++;
        this.refresh();
        this.trigger('slideAdded', slide, index);
    }

    removeSlide(index) {
        if (index < 0 || index >= this.slideCount) return;

        const slide = this.trackElement.children[index];
        if (!slide) return;

        slide.remove();
        this.slideCount--;
        
        if (index <= this.currentSlide) {
            this.currentSlide = Math.max(0, this.currentSlide - 1);
        }

        this.refresh();
        this.trigger('slideRemoved', index);
    }

    setupAdvancedA11y() {
        // Live region for screen readers
        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.classList.add('slick-live-region');
        this.element.appendChild(this.liveRegion);

        // Enhanced keyboard navigation
        this.setupKeyboardTrap();
        this.setupSlideRoles();
    }

    setupKeyboardTrap() {
        const focusableElements = 
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        
        this.element.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            const focusable = this.element
                .querySelectorAll(focusableElements);
            const firstFocusable = focusable[0];
            const lastFocusable = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        });
    }

    setupSlideRoles() {
        const slides = Array.from(this.trackElement.children);
        slides.forEach((slide, index) => {
            slide.setAttribute('role', 'tabpanel');
            slide.setAttribute('aria-roledescription', 'slide');
            slide.setAttribute('aria-label', `${index + 1} of ${slides.length}`);
            
            // Make all interactive elements focusable
            const interactive = slide.querySelectorAll(
                'a, button, input, select, textarea'
            );
            interactive.forEach(el => {
                if (index === this.currentSlide) {
                    el.setAttribute('tabindex', '0');
                } else {
                    el.setAttribute('tabindex', '-1');
                }
            });
        });
    }

    setupPerformanceMonitoring() {
        this.performanceMetrics = {
            frameDrops: 0,
            averageTransitionTime: 0,
            transitionCount: 0,
            lastFrameTime: performance.now()
        };

        // Monitor frame drops
        this.frameMonitor = requestAnimationFrame(this.monitorFrames.bind(this));
    }

    monitorFrames(timestamp) {
        const frameTime = timestamp - this.performanceMetrics.lastFrameTime;
        const expectedFrame = 1000 / 60; // 60fps

        if (frameTime > expectedFrame * 2) {
            this.performanceMetrics.frameDrops++;
            
            if (this.performanceMetrics.frameDrops > 5) {
                this.optimizePerformance();
            }
        }

        this.performanceMetrics.lastFrameTime = timestamp;
        this.frameMonitor = requestAnimationFrame(this.monitorFrames.bind(this));
    }

    optimizePerformance() {
        // Reduce animation complexity
        if (this.settings.cssEase !== 'ease') {
            this.settings.cssEase = 'ease';
            this.setupCustomEasing();
        }

        // Disable transitions during rapid interactions
        if (this.performanceMetrics.frameDrops > 10) {
            this.element.classList.add('slick-performance-mode');
        }

        // Force hardware acceleration
        this.trackElement.style.transform = 'translate3d(0,0,0)';
    }

    setupErrorHandling() {
        this.errorState = false;

        window.addEventListener('error', (event) => {
            if (event.target.closest('.slick-slider') === this.element) {
                this.handleError(event);
            }
        }, true);
    }

    handleError(error) {
        this.errorState = true;
        this.element.classList.add('slick-error');
        
        console.error('Slick Slider Error:', error);
        this.trigger('error', error);

        // Try to recover
        this.recoverFromError();
    }

    recoverFromError() {
        try {
            // Reset to initial slide
            this.slickGoTo(0, true);
            
            // Clear any ongoing animations
            this.trackElement.style.transition = 'none';
            
            // Reset error state after recovery
            setTimeout(() => {
                this.errorState = false;
                this.element.classList.remove('slick-error');
                this.trackElement.style.transition = '';
            }, 100);
        } catch (e) {
            console.error('Recovery failed:', e);
        }
    }

    setupDebugMode() {
        if (!this.settings.debug) return;

        this.debugLog = [];
        this.debugElement = document.createElement('div');
        this.debugElement.classList.add('slick-debug');
        this.element.appendChild(this.debugElement);

        this.on('beforeChange', (...args) => this.logDebug('beforeChange', args));
        this.on('afterChange', (...args) => this.logDebug('afterChange', args));
        this.on('error', (...args) => this.logDebug('error', args));
    }

    logDebug(type, data) {
        if (!this.settings.debug) return;

        const log = {
            timestamp: new Date().toISOString(),
            type,
            data
        };

        this.debugLog.push(log);
        this.updateDebugDisplay();
    }

    updateDebugDisplay() {
        if (!this.debugElement) return;

        const lastLog = this.debugLog[this.debugLog.length - 1];
        this.debugElement.textContent = JSON.stringify(lastLog, null, 2);
    }

    setupAdvancedGestures() {
        this.gestureState = {
            isGesturing: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            velocity: 0,
            lastTime: 0
        };

        this.hammer = new (window.Hammer || this.createBasicHammer)(
            this.element,
            {
                touchAction: 'pan-y pinch-zoom',
                recognizers: [
                    [Hammer.Pan, { direction: Hammer.DIRECTION_HORIZONTAL }],
                    [Hammer.Swipe, { direction: Hammer.DIRECTION_HORIZONTAL }],
                    [Hammer.Pinch, { enable: true }]
                ]
            }
        );

        this.setupGestureHandlers();
    }

    setupGestureHandlers() {
        this.hammer.on('panstart', this.handlePanStart.bind(this));
        this.hammer.on('panmove', this.handlePanMove.bind(this));
        this.hammer.on('panend', this.handlePanEnd.bind(this));
        this.hammer.on('swipe', this.handleSwipe.bind(this));
        this.hammer.on('pinchstart', this.handlePinchStart.bind(this));
        this.hammer.on('pinchmove', this.handlePinchMove.bind(this));
        this.hammer.on('pinchend', this.handlePinchEnd.bind(this));
    }

    setupAnimationQueue() {
        this.animationQueue = [];
        this.isAnimating = false;
    }

    queueAnimation(animation) {
        return new Promise((resolve, reject) => {
            this.animationQueue.push({ animation, resolve, reject });
            if (!this.isAnimating) {
                this.processAnimationQueue();
            }
        });
    }

    async processAnimationQueue() {
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            return;
        }

        this.isAnimating = true;
        const { animation, resolve, reject } = this.animationQueue.shift();

        try {
            await animation();
            resolve();
        } catch (error) {
            reject(error);
        }

        this.processAnimationQueue();
    }

    setupStateManagement() {
        this.state = new Proxy({
            currentSlide: 0,
            slideCount: 0,
            isDragging: false,
            isAnimating: false,
            direction: 'ltr',
            breakpoint: null
        }, {
            set: (target, property, value) => {
                const oldValue = target[property];
                target[property] = value;
                
                if (oldValue !== value) {
                    this.trigger('stateChange', property, value, oldValue);
                }
                return true;
            }
        });
    }

    setupNetworkStateHandling() {
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', 
                this.handleNetworkChange.bind(this));
        }

        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    handleNetworkChange() {
        const connection = navigator.connection;
        if (connection.saveData) {
            this.optimizeForSaveData();
        }

        if (connection.effectiveType === 'slow-2g' || 
            connection.effectiveType === '2g') {
            this.optimizeForSlowConnection();
        }
    }

    setupAdvancedResponsive() {
        this.breakpointManager = new BreakpointManager(this.settings.responsive);
        this.setupResizeObserver();
        this.setupOrientationHandler();
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(
            this.debounce(entries => {
                for (const entry of entries) {
                    this.handleResize(entry.contentRect);
                }
            }, 150)
        );

        this.resizeObserver.observe(this.element);
    }

    setupMemoryManagement() {
        this.cleanupTasks = new Set();
        this.setupMemoryMonitoring();
    }

    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memoryUsage = performance.memory;
                if (memoryUsage.usedJSHeapSize > 
                    memoryUsage.jsHeapSizeLimit * 0.8) {
                    this.handleHighMemoryUsage();
                }
            }, 10000);
        }
    }

    setupTestingUtilities() {
        if (process.env.NODE_ENV === 'test') {
            this.testUtils = {
                getState: () => ({ ...this.state }),
                simulateEvent: this.simulateEvent.bind(this),
                waitForAnimation: this.waitForAnimation.bind(this),
                getSlideElements: () => Array.from(this.trackElement.children)
            };
        }
    }

    // Helper Classes

    class BreakpointManager {
        constructor(breakpoints) {
            this.breakpoints = this.parseBreakpoints(breakpoints);
            this.currentBreakpoint = null;
        }

        parseBreakpoints(breakpoints) {
            return breakpoints
                .map(bp => ({
                    point: bp.breakpoint,
                    settings: bp.settings
                }))
                .sort((a, b) => b.point - a.point);
        }

        getCurrentBreakpoint(width) {
            return this.breakpoints.find(bp => width <= bp.point)?.point || null;
        }
    }

    class AnimationManager {
        constructor(element, settings) {
            this.element = element;
            this.settings = settings;
            this.animations = new Map();
        }

        async animate(properties, duration, easing = 'ease') {
            const animation = this.element.animate(properties, {
                duration,
                easing,
                fill: 'forwards'
            });

            this.animations.set(animation, true);
            
            try {
                await animation.finished;
                this.animations.delete(animation);
            } catch (error) {
                this.animations.delete(animation);
                throw error;
            }
        }

        cancelAll() {
            this.animations.forEach((_, animation) => {
                animation.cancel();
            });
            this.animations.clear();
        }
    }

    // Cleanup method
    destroy() {
        // Cancel all animations
        if (this.animationManager) {
            this.animationManager.cancelAll();
        }

        // Stop all observers
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.observer) {
            this.observer.disconnect();
        }

        // Remove event listeners
        this.hammer?.destroy();
        
        // Clear intervals and timeouts
        this.cleanupTasks.forEach(task => task());
        
        // Remove DOM elements
        this.element.innerHTML = this.originalHTML;
        
        // Clear references
        this.element = null;
        this.state = null;
        this.settings = null;
        
        // Trigger cleanup event
        this.trigger('destroy');
    }
}

// Export the class
export default Slick;

// Add to window object for non-module environments
if (typeof window !== 'undefined') {
    window.Slick = Slick;
}
