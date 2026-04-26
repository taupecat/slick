/**
 * Version: 2.0.0
 *  Origin: Ken Wheeler (kenwheeler/slick v1.8.1)
 *    Fork: Tracy Rotton (taupecat/slick)
 *    Repo: http://github.com/taupecat/slick
 *   Notes: Ported from jQuery to vanilla JavaScript.
 *          jQuery dependency removed entirely.
 *          Initialized via window.slick() instead of $.fn.slick().
 */

'use strict';

( function() {

	const parseBreakpoint = ( value ) => {
		if ( 'number' === typeof value ) return value;

		const str = String( value ).trim();

		if ( 'em' === str.slice( -2 ) ) return parseFloat( str ) * 16;

		return parseFloat( str ); // Handles '992px' or bare strings.
	};

	let Slick = window.Slick || {};

	Slick = ( function() {

		let instanceUid = 0;

		function Slick( element, settings ) {

			const _ = this;

			let dataSettings;

			_.defaults = {
				accessibility   : true,
				adaptiveHeight  : false,
				appendArrows    : element,
				appendDots      : element,
				arrows          : true,
				asNavFor        : null,
				prevArrow       : '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
				nextArrow       : '<button class="slick-next" aria-label="Next" type="button">Next</button>',
				autoplay        : false,
				autoplaySpeed   : 3000,
				startPaused     : false,
				centerMode      : false,
				centerPadding   : '50px',
				cssEase         : 'ease',
				dots            : false,
				dotsClass       : 'slick-dots',
				draggable       : true,
				easing          : 'linear',
				edgeFriction    : 0.35,
				fade            : false,
				focusOnSelect   : false,
				focusOnChange   : false,
				infinite        : true,
				initialSlide    : 0,
				mobileFirst     : false,
				pauseOnHover    : true,
				pauseOnFocus    : true,
				pauseOnDotsHover: false,
				respondTo       : 'window',
				responsive      : null,
				rows            : 1,
				slide           : '',
				slidesPerRow    : 1,
				slidesToShow    : 1,
				slidesToScroll  : 1,
				speed           : 500,
				swipe           : true,
				swipeToSlide    : false,
				touchMove       : true,
				touchThreshold  : 5,
				useCSS          : true,
				useTransform    : true,
				variableWidth   : false,
				vertical        : false,
				verticalSwiping : false,
				waitForAnimate  : true,
				zIndex          : 1000,

				customPaging: ( slider, i ) => {
					const btn = document.createElement( 'button' );
					btn.type        = 'button';
					btn.textContent = i + 1;
					return btn;
				},
			};

			_.initials = {
				animating        : false,
				dragging         : false,
				autoPlayTimer    : null,
				currentDirection : 0,
				currentLeft      : null,
				currentSlide     : 0,
				direction        : 1,
				dots             : null,
				listWidth        : null,
				listHeight       : null,
				loadIndex        : 0,
				nextArrow        : null,
				prevArrow        : null,
				scrolling        : false,
				slideCount       : null,
				slideWidth       : null,
				slideTrack       : null,
				slides           : null,
				sliding          : false,
				slideOffset      : 0,
				swipeLeft        : null,
				swiping          : false,
				list             : null,
				touchObject      : {},
				transformsEnabled: false,
				unslicked        : false
			};

			Object.assign( _, _.initials );

			_.activeBreakpoint   = null;
			_.animType           = null;
			_.animProp           = null;
			_.breakpoints        = [];
			_.breakpointSettings = [];
			_.cssTransitions     = false;
			_.focussed           = false;
			_.interrupted        = false;
			_.hidden             = 'hidden';
			_.paused             = true;
			_.positionProp       = null;
			_.respondTo          = null;
			_.rowCount           = 1;
			_.shouldClick        = true;
			_.slider             = element;
			_.slidesCache        = null;
			_.transformType      = null;
			_.transitionType     = null;
			_.visibilityChange   = 'visibilitychange';
			_.windowWidth        = 0;
			_.windowTimer        = null;

			dataSettings = element.dataset.slick ? JSON.parse( element.dataset.slick ) : {};

			_.options          = Object.assign({}, _.defaults, settings, dataSettings );
			_.currentSlide     = _.options.initialSlide;
			_.originalSettings = Object.assign({}, _.options );
			_.autoPlay         = _.autoPlay.bind( _ );
			_.autoPlayClear    = _.autoPlayClear.bind( _ );
			_.autoPlayIterator = _.autoPlayIterator.bind( _ );
			_.changeSlide      = _.changeSlide.bind( _ );
			_.clickHandler     = _.clickHandler.bind( _ );
			_.selectHandler    = _.selectHandler.bind( _ );
			_.setPosition      = _.setPosition.bind( _ );
			_.swipeHandler     = _.swipeHandler.bind( _ );
			_.keyHandler       = _.keyHandler.bind( _ );
			_.instanceUid      = instanceUid++;

			_.orientationChangeHandler = _.orientationChange.bind( _ );
			_.resizeHandler            = _.resize.bind( _ );
			_.visibilityHandler        = _.visibility.bind( _ );

			_.focusInHandler  = null;
			_.focusOutHandler = null;

			// A simple way to check for HTML strings.
			// Strict HTML recognition (must start with <).
			_.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;

			_.registerBreakpoints();
			_.init( true );
		}

		return Slick;
	}() );

	Slick.prototype.activateADA = function() {
		const _ = this;

		_.slideTrack.querySelectorAll( '.slick-active' ).forEach( el => {
			el.setAttribute( 'aria-hidden', 'false' );
			el.setAttribute( 'tabindex', '0' );
			el.querySelectorAll( 'a, input, button, select' ).forEach( child => child.setAttribute( 'tabindex', '0' ) );
		});
	};

	Slick.prototype.addSlide = Slick.prototype.slickAdd = function( markup, index, addBefore ) {
		const _ = this;

		if ( 'boolean' === typeof( index ) ) {
			addBefore = index;
			index     = null;
		} else if ( 0 > index || ( index >= _.slideCount ) ) {
			return false;
		}

		_.unload();

		const tmp = document.createElement( 'div' );

		tmp.innerHTML = markup;

		const newSlide = tmp.firstElementChild;

		if ( 'number' === typeof index ) {
			if ( 0 === index && 0 === _.slides.length ) _.slideTrack.appendChild( newSlide );
			else if ( addBefore ) _.slideTrack.insertBefore( newSlide, _.slides[ index ] );
			else _.slides[ index ].insertAdjacentElement( 'afterend', newSlide );
		} else {
			if ( true === addBefore ) _.slideTrack.insertBefore( newSlide, _.slideTrack.firstChild );
			else _.slideTrack.appendChild( newSlide );
		}

		_.slides = Array.from( _.slideTrack.querySelectorAll( this.options.slide || '*' ) );

		const slideSelector = this.options.slide || '*';

		_.slideTrack.querySelectorAll( slideSelector ).forEach( el => el.remove() );
		_.slides.forEach( el => _.slideTrack.appendChild( el ) );
		_.slides.forEach( ( el, i ) => el.setAttribute( 'data-slick-index', i ) );
		_.slidesCache = _.slides;
		_.reinit();
	};

	Slick.prototype.animateHeight = function() {
		const _ = this;

		if ( 1 === _.options.slidesToShow && true === _.options.adaptiveHeight && false === _.options.vertical ) {
			const targetHeight = _.slides[_.currentSlide].offsetHeight;

			_.list.style.transition = `height ${ _.options.speed }ms ${ _.options.cssEase }`;
			_.list.style.height     = `${ targetHeight }px`;
		}
	};

	Slick.prototype.animateSlide = function( targetLeft, callback ) {
		const _ = this;

		_.animateHeight();

		if ( false === _.transformsEnabled ) {
			const prop = false === _.options.vertical ? 'left' : 'top';
			_.slideTrack.style.transition = `${ prop } ${ _.options.speed }ms ${ _.options.cssEase }`;
			_.slideTrack.style[ prop ]    = `${ targetLeft }px`;
			if ( callback ) setTimeout( () => callback.call(), _.options.speed );

		} else if ( false === _.cssTransitions ) {

			const startLeft = _.currentLeft || 0;
			const distance  = targetLeft - startLeft;
			const startTime = performance.now();

			const step = ( now ) => {
				const elapsed  = now - startTime;
				const progress = Math.min( elapsed / _.options.speed, 1 );
				const current  = Math.ceil( startLeft + distance * progress );

				if ( false === _.options.vertical ) _.slideTrack.style[ _.animType ] = `translate( ${ current }px, 0 )`;
				else _.slideTrack.style[ _.animType ] = `translate( 0, ${ current }px )`;

				if ( 1 > progress ) requestAnimationFrame( step );
				else if ( callback ) callback.call();
			};

			requestAnimationFrame( step );

		} else {

			_.applyTransition();
			targetLeft = Math.ceil( targetLeft );

			if ( false === _.options.vertical ) _.slideTrack.style[ _.animType ] = `translate3d( ${ targetLeft }px, 0, 0 )`;
			else _.slideTrack.style[ _.animType ] = `translate3d( 0, ${ targetLeft }px, 0 )`;

			if ( callback ) {
				setTimeout( () => {
					_.disableTransition();
					callback.call();
				}, _.options.speed );
			}
		}
	};

	Slick.prototype.getNavTarget = function() {
		const _ = this;

		let asNavFor = _.options.asNavFor;

		if ( asNavFor && null !== asNavFor ) asNavFor = Array.from( document.querySelectorAll( asNavFor ) ).filter( el => el !== _.slider );

		return asNavFor;
	};

	Slick.prototype.asNavFor = function( index ) {
		const _ = this;

		let asNavFor = _.getNavTarget();

		if ( null !== asNavFor && 'object' === typeof asNavFor ) {

			asNavFor.forEach( el => {

				const target = el.slick;

				if ( target && ! target.unslicked ) {
					target.slideHandler( index, true );
				}
			});
		}
	};

	Slick.prototype.applyTransition = function( slide ) {
		const _          = this;
		const transition = {};

		if ( false === _.options.fade ) transition[_.transitionType] = _.transformType + ' ' + _.options.speed + 'ms ' + _.options.cssEase;
		else transition[_.transitionType] = 'opacity ' + _.options.speed + 'ms ' + _.options.cssEase;

		if ( false === _.options.fade ) Object.assign( _.slideTrack.style, transition );
		else Object.assign( _.slides[slide].style, transition );
	};

	Slick.prototype.autoPlay = function() {
		const _ = this;

		_.autoPlayClear();

		if ( _.options.autoplay && ! _.paused && _.slideCount > _.options.slidesToShow ) _.autoPlayTimer = setInterval( _.autoPlayIterator, _.options.autoplaySpeed );
	};

	Slick.prototype.autoPlayClear = function() {
		const _ = this;

		if ( _.autoPlayTimer ) clearInterval( _.autoPlayTimer );
	};

	Slick.prototype.autoPlayIterator = function() {
		const _ = this;

		let slideTo = _.currentSlide + _.options.slidesToScroll;

		if ( ! _.paused && ! _.interrupted && ! _.focussed ) {

			if ( false === _.options.infinite ) {

				if ( 1 === _.direction && ( _.currentSlide + 1 ) === ( _.slideCount - 1 ) ) {
					_.direction = 0;
				} else if ( 0 === _.direction ) {
					slideTo = _.currentSlide - _.options.slidesToScroll;

					if ( 0 === _.currentSlide - 1 ) _.direction = 1;
				}
			}

			_.slideHandler( slideTo );
		}
	};

	Slick.prototype.buildArrows = function() {
		const _ = this;

		if ( true === _.options.arrows ) {

			if ( _.htmlExpr.test( _.options.prevArrow ) ) {
				const tmp = document.createElement( 'div' );
				tmp.innerHTML = _.options.prevArrow;
				_.prevArrow   = tmp.firstElementChild;
			} else {
				_.prevArrow = document.querySelector( _.options.prevArrow );
			}

			if ( _.htmlExpr.test( _.options.nextArrow ) ) {
				const tmp = document.createElement( 'div' );
				tmp.innerHTML = _.options.nextArrow;
				_.nextArrow   = tmp.firstElementChild;
			} else {
				_.nextArrow = document.querySelector( _.options.nextArrow );
			}

			_.prevArrow.classList.add( 'slick-arrow' );
			_.nextArrow.classList.add( 'slick-arrow' );

			_.prevArrow.dataset.slickMessage = 'previous';
			_.nextArrow.dataset.slickMessage = 'next';

			if ( _.slideCount > _.options.slidesToShow ) {
				_.prevArrow.classList.remove( 'slick-hidden' );
				_.prevArrow.removeAttribute( 'aria-hidden' );
				_.prevArrow.removeAttribute( 'tabindex' );
				_.nextArrow.classList.remove( 'slick-hidden' );
				_.nextArrow.removeAttribute( 'aria-hidden' );
				_.nextArrow.removeAttribute( 'tabindex' );

				if ( _.htmlExpr.test( _.options.prevArrow ) ) _.options.appendArrows.insertBefore( _.prevArrow, _.options.appendArrows.firstChild );

				if ( _.htmlExpr.test( _.options.nextArrow ) ) _.options.appendArrows.appendChild( _.nextArrow );

				if ( true !== _.options.infinite ) {
					_.prevArrow.classList.add( 'slick-disabled' );
					_.prevArrow.setAttribute( 'aria-disabled', 'true' );
				}
			} else {
				_.prevArrow.classList.add( 'slick-hidden' );
				_.prevArrow.setAttribute( 'aria-disabled', 'true' );
				_.prevArrow.setAttribute( 'tabindex', '-1' );
				_.nextArrow.classList.add( 'slick-hidden' );
				_.nextArrow.setAttribute( 'aria-disabled', 'true' );
				_.nextArrow.setAttribute( 'tabindex', '-1' );
			}
		}
	};

	Slick.prototype.buildDots = function() {
		const _ = this;

		let i;

		if ( true === _.options.dots && _.slideCount > _.options.slidesToShow ) {

			_.slider.classList.add( 'slick-dotted' );

			const dot = document.createElement( 'ul' );
			dot.className = _.options.dotsClass;

			for ( i = 0; i <= _.getDotCount(); i += 1 ) {
				const li = document.createElement( 'li' );
				li.dataset.slickMessage = 'index';
				li.dataset.slickIndex   = i * _.options.slidesToScroll;
				li.appendChild( _.options.customPaging.call( this, _, i ) );
				dot.appendChild( li );
			}

			_.options.appendDots.appendChild( dot );
			_.dots = dot;
			_.dots.querySelector( 'li' ).classList.add( 'slick-active' );
		}
	};

	Slick.prototype.buildOut = function() {
		const _        = this;
		const selector = _.options.slide ? _.options.slide + ':not(.slick-cloned)' : ':scope > :not(.slick-cloned)';

		_.slides = Array.from( _.slider.querySelectorAll( selector ) );
		_.slides.forEach( el => el.classList.add( 'slick-slide' ) );
		_.slideCount = _.slides.length;

		_.slides.forEach( ( el, index ) => {
			el.setAttribute( 'data-slick-index', index );
			el.dataset.originalStyling = el.getAttribute( 'style' ) || '';
		});

		_.slider.classList.add( 'slick-slider' );

		const track = document.createElement( 'div' );

		track.className = 'slick-track';

		if ( 0 === _.slideCount ) {
			_.slider.appendChild( track );
		} else {
			_.slides[0].parentNode.insertBefore( track, _.slides[0] );
			_.slides.forEach( el => track.appendChild( el ) );
		}

		_.slideTrack = track;

		const list = document.createElement( 'div' );

		list.className = 'slick-list';
		_.slideTrack.parentNode.insertBefore( list, _.slideTrack );

		list.appendChild( _.slideTrack );
		_.list = list;

		_.slideTrack.style.opacity = 0;

		if ( true === _.options.centerMode || true === _.options.swipeToSlide ) _.options.slidesToScroll = 1;

		_.setupInfinite();
		_.buildArrows();
		_.buildDots();
		_.updateDots();
		_.setSlideClasses( 'number' === typeof _.currentSlide ? _.currentSlide : 0 );

		if ( true === _.options.draggable ) _.list.classList.add( 'draggable' );
	};

	Slick.prototype.buildRows = function() {
		const _ = this;

		let a, b, c, newSlides, numOfSlides, originalSlides, slidesPerSection;

		newSlides      = document.createDocumentFragment();
		originalSlides = Array.from( _.slider.children );

		if ( 0 < _.options.rows ) {

			slidesPerSection = _.options.slidesPerRow * _.options.rows;
			numOfSlides      = Math.ceil( originalSlides.length / slidesPerSection );

			for ( a = 0; a < numOfSlides; a++ ) {
				const slide = document.createElement( 'div' );
				for ( b = 0; b < _.options.rows; b++ ) {
					const row = document.createElement( 'div' );
					for ( c = 0; c < _.options.slidesPerRow; c++ ) {
						const target = ( a * slidesPerSection + ( ( b * _.options.slidesPerRow ) + c ) );
						if ( originalSlides[ target ] ) row.appendChild( originalSlides[ target ] );
					}
					slide.appendChild( row );
				}
				newSlides.appendChild( slide );
			}

			while ( _.slider.firstChild ) _.slider.removeChild( _.slider.firstChild );
			_.slider.appendChild( newSlides );

			if ( 1 < _.options.slidesPerRow ) {
				Array.from( _.slider.children ).forEach( slide => {
					Array.from( slide.children ).forEach( row => {
						Array.from( row.children ).forEach( el => {
							el.style.width   = `${ 100 / _.options.slidesPerRow }%`;
							el.style.display = 'inline-block';
						});
					});
				});
			}
		}
	};

	Slick.prototype.checkResponsive = function( initial, forceUpdate ) {

		const _ = this;
		let breakpoint, targetBreakpoint, respondToWidth, triggerBreakpoint = false;
		const sliderWidth = _.slider.offsetWidth;
		const windowWidth = window.innerWidth;

		if ( 'window' === _.respondTo ) {
			respondToWidth = windowWidth;
		} else if ( 'slider' === _.respondTo ) {
			respondToWidth = sliderWidth;
		} else if ( 'min' === _.respondTo ) {
			respondToWidth = Math.min( windowWidth, sliderWidth );
		}

		if ( _.options.responsive &&
			_.options.responsive.length &&
			null !== _.options.responsive ) {

			targetBreakpoint = null;

			for ( breakpoint in _.breakpoints ) {
				if ( _.breakpoints.hasOwnProperty( breakpoint ) ) {
					if ( false === _.originalSettings.mobileFirst ) {
						if ( respondToWidth < _.breakpoints[breakpoint] ) {
							targetBreakpoint = _.breakpoints[breakpoint];
						}
					} else {
						if ( respondToWidth >= _.breakpoints[breakpoint] ) {
							targetBreakpoint = _.breakpoints[breakpoint];
						}
					}
				}
			}

			if ( null !== targetBreakpoint ) {
				if ( null !== _.activeBreakpoint ) {
					if ( targetBreakpoint !== _.activeBreakpoint || forceUpdate ) {
						_.activeBreakpoint =
							targetBreakpoint;
						if ( 'unslick' === _.breakpointSettings[targetBreakpoint] ) {
							_.unslick( targetBreakpoint );
						} else {
							_.options = Object.assign({}, _.originalSettings,
								_.breakpointSettings[
									targetBreakpoint] );
							if ( true === initial ) {
								_.currentSlide = _.options.initialSlide;
							}
							_.refresh( initial );
						}
						triggerBreakpoint = targetBreakpoint;
					}
				} else {
					_.activeBreakpoint = targetBreakpoint;
					if ( 'unslick' === _.breakpointSettings[targetBreakpoint] ) {
						_.unslick( targetBreakpoint );
					} else {
						_.options = Object.assign({}, _.originalSettings,
							_.breakpointSettings[
								targetBreakpoint] );
						if ( true === initial ) {
							_.currentSlide = _.options.initialSlide;
						}
						_.refresh( initial );
					}
					triggerBreakpoint = targetBreakpoint;
				}
			} else {
				if ( null !== _.activeBreakpoint ) {
					_.activeBreakpoint = null;
					_.options          = _.originalSettings;

					if ( true === initial ) {
						_.currentSlide = _.options.initialSlide;
					}
					_.refresh( initial );
					triggerBreakpoint = targetBreakpoint;
				}
			}

			// Only trigger breakpoints during an actual break. Not on
			// initialize.
			if ( ! initial && false !== triggerBreakpoint ) {
				_.slider.dispatchEvent( new CustomEvent( 'breakpoint', { detail: [_, triggerBreakpoint] }) );
			}
		}

	};

	Slick.prototype.changeSlide = function( event, dontAnimate ) {

		const _ = this;
		let target = event.currentTarget,
			indexOffset, slideOffset, unevenOffset;

		// If target is a link, prevent default action.
		if ( 'A' === target.tagName ) event.preventDefault();

		// If target is not the <li> element (ie: a child), find the <li>.
		if ( 'LI' !== target.tagName ) target = target.closest( 'li' );

		unevenOffset = ( 0 !== _.slideCount % _.options.slidesToScroll );
		indexOffset  = unevenOffset ? 0 : ( _.slideCount - _.currentSlide ) % _.options.slidesToScroll;

		switch ( target.dataset.slickMessage ) {

		case 'previous':
			slideOffset = 0 === indexOffset ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;
			if ( _.slideCount > _.options.slidesToShow ) _.slideHandler( _.currentSlide - slideOffset, false, dontAnimate );
			break;

		case 'next':
			slideOffset = 0 === indexOffset ? _.options.slidesToScroll : indexOffset;
			if ( _.slideCount > _.options.slidesToShow ) _.slideHandler( _.currentSlide + slideOffset, false, dontAnimate );
			break;

		case 'index': {
			const rawIndex = target.dataset.slickIndex;
			let index = '0' === rawIndex ? 0 : ( rawIndex ? parseInt( rawIndex ) : Array.from( target.parentNode.children ).indexOf( target ) * _.options.slidesToScroll );

			_.slideHandler( _.checkNavigable( index ), false, dontAnimate );

			const firstFocusable = target.querySelector( 'button, a, input, select' );

			if ( firstFocusable ) firstFocusable.focus();

			break;
		}

		default:
			return;
		}
	};

	Slick.prototype.checkNavigable = function( index ) {

		const _ = this;
		let navigables, prevNavigable;

		navigables    = _.getNavigableIndexes();
		prevNavigable = 0;

		if ( index > navigables[navigables.length - 1] ) {
			index = navigables[navigables.length - 1];
		} else {
			for ( let n in navigables ) {
				if ( index < navigables[n] ) {
					index = prevNavigable;
					break;
				}
				prevNavigable = navigables[n];
			}
		}

		return index;
	};

	Slick.prototype.cleanUpEvents = function() {
		const _ = this;
		if ( _.options.dots && null !== _.dots ) {
			_.dots.querySelectorAll( 'li' ).forEach( li => {
				li.removeEventListener( 'click', _.changeSlide );
				li.removeEventListener( 'mouseenter', _.interrupt.bind( _, true ) );
				li.removeEventListener( 'mouseleave', _.interrupt.bind( _, false ) );
			});

			if ( true === _.options.accessibility ) _.dots.removeEventListener( 'keydown', _.keyHandler );
		}

		_.slider.removeEventListener( 'focus', _.focusInHandler, true );
		_.slider.removeEventListener( 'blur',  _.focusOutHandler, true );

		if ( true === _.options.arrows && _.slideCount > _.options.slidesToShow ) {
			if ( _.prevArrow ) _.prevArrow.removeEventListener( 'click', _.changeSlide );
			if ( _.nextArrow ) _.nextArrow.removeEventListener( 'click', _.changeSlide );
			if ( true === _.options.accessibility ) {
				if ( _.prevArrow ) _.prevArrow.removeEventListener( 'keydown', _.keyHandler );
				if ( _.nextArrow ) _.nextArrow.removeEventListener( 'keydown', _.keyHandler );
			}
		}

		_.list.removeEventListener( 'touchstart',  _.swipeHandler );
		_.list.removeEventListener( 'mousedown',   _.swipeHandler );
		_.list.removeEventListener( 'touchmove',   _.swipeHandler );
		_.list.removeEventListener( 'mousemove',   _.swipeHandler );
		_.list.removeEventListener( 'touchend',    _.swipeHandler );
		_.list.removeEventListener( 'mouseup',     _.swipeHandler );
		_.list.removeEventListener( 'touchcancel', _.swipeHandler );
		_.list.removeEventListener( 'mouseleave',  _.swipeHandler );
		_.list.removeEventListener( 'click',       _.clickHandler );

		document.removeEventListener( _.visibilityChange, _.visibilityHandler );

		_.cleanUpSlideEvents();

		if ( true === _.options.accessibility ) _.list.removeEventListener( 'keydown', _.keyHandler );

		if ( true === _.options.focusOnSelect ) Array.from( _.slideTrack.children ).forEach( el => el.removeEventListener( 'click', _.selectHandler ) );

		window.removeEventListener( 'orientationchange', _.orientationChangeHandler );
		window.removeEventListener( 'resize', _.resizeHandler );
		window.removeEventListener( 'load', _.setPosition );
	};

	Slick.prototype.cleanUpSlideEvents = function() {

		const _ = this;

		_.list.removeEventListener( 'mouseenter', _.interrupt.bind( _, true ) );
		_.list.removeEventListener( 'mouseleave', _.interrupt.bind( _, false ) );
	};

	Slick.prototype.cleanUpRows = function() {

		const _ = this;

		if ( 0 < _.options.rows ) {
			const originalSlides = _.slides.flatMap( slide => Array.from( slide.children ).flatMap( row => Array.from( row.children ) ) );
			originalSlides.forEach( el => el.removeAttribute( 'style' ) );
			while ( _.slider.firstChild ) _.slider.removeChild( _.slider.firstChild );
			originalSlides.forEach( el => _.slider.appendChild( el ) );
		}
	};

	Slick.prototype.clickHandler = function( event ) {

		const _ = this;

		if ( false === _.shouldClick ) {
			event.stopImmediatePropagation();
			event.stopPropagation();
			event.preventDefault();
		}

	};

	Slick.prototype.destroy = function( refresh ) {

		const _ = this;

		_.autoPlayClear();
		_.touchObject = {};
		_.cleanUpEvents();
		_.slider.querySelectorAll( '.slick-cloned' ).forEach( el => el.remove() );

		if ( _.dots ) _.dots.remove();

		if ( _.prevArrow ) {
			_.prevArrow.classList.remove( 'slick-disabled', 'slick-arrow', 'slick-hidden' );
			_.prevArrow.removeAttribute( 'aria-hidden' );
			_.prevArrow.removeAttribute( 'aria-disabled' );
			_.prevArrow.removeAttribute( 'tabindex' );
			_.prevArrow.style.display = '';

			if ( _.htmlExpr.test( _.options.prevArrow ) ) _.prevArrow.remove();
		}

		if ( _.nextArrow ) {
			_.nextArrow.classList.remove( 'slick-disabled', 'slick-arrow', 'slick-hidden' );
			_.nextArrow.removeAttribute( 'aria-hidden' );
			_.nextArrow.removeAttribute( 'aria-disabled' );
			_.nextArrow.removeAttribute( 'tabindex' );
			_.nextArrow.style.display = '';

			if ( _.htmlExpr.test( _.options.nextArrow ) ) _.nextArrow.remove();
		}

		if ( _.slides ) {
			_.slides.forEach( el => {
				el.classList.remove( 'slick-slide', 'slick-active', 'slick-center', 'slick-visible', 'slick-current' );
				el.removeAttribute( 'aria-hidden' );
				el.removeAttribute( 'data-slick-index' );
				el.setAttribute( 'style', el.dataset.originalStyling || '' );
			});

			_.slides.forEach( el => _.slider.appendChild( el ) );
			_.slideTrack.remove();
			_.list.remove();
		}

		_.cleanUpRows();

		_.slider.classList.remove( 'slick-slider' );
		_.slider.classList.remove( 'slick-initialized' );
		_.slider.classList.remove( 'slick-dotted' );

		_.unslicked = true;

		if ( ! refresh ) _.slider.dispatchEvent( new CustomEvent( 'destroy', { detail: [ _ ] }) );
	};

	Slick.prototype.disableTransition = function( slide ) {

		const _          = this;
		const transition = {};

		transition[_.transitionType] = '';

		if ( false === _.options.fade ) Object.assign( _.slideTrack.style, transition );
		else Object.assign( _.slides[slide].style, transition );
	};

	Slick.prototype.fadeSlide = function( slideIndex, callback ) {

		const _ = this;

		if ( false === _.cssTransitions ) {
			_.slides[slideIndex].style.zIndex     = _.options.zIndex;
			_.slides[slideIndex].style.transition = `opacity ${ _.options.speed }ms ${ _.options.cssEase }`;
			_.slides[slideIndex].style.opacity    = 1;

			if ( callback ) setTimeout( () => callback.call(), _.options.speed );

		} else {

			_.applyTransition( slideIndex );

			_.slides[slideIndex].style.opacity = 1;
			_.slides[slideIndex].style.zIndex  = _.options.zIndex;

			if ( callback ) {
				setTimeout( function() {

					_.disableTransition( slideIndex );

					callback.call();
				}, _.options.speed );
			}
		}
	};

	Slick.prototype.fadeSlideOut = function( slideIndex ) {

		const _ = this;

		if ( false === _.cssTransitions ) {

			_.slides[slideIndex].style.transition = `opacity ${ _.options.speed }ms ${ _.options.cssEase }`;
			_.slides[slideIndex].style.opacity    = 0;
			_.slides[slideIndex].style.zIndex     = _.options.zIndex - 2;

		} else {

			_.applyTransition( slideIndex );

			_.slides[slideIndex].style.opacity = 0;
			_.slides[slideIndex].style.zIndex  = _.options.zIndex - 2;
		}
	};

	Slick.prototype.filterSlides = Slick.prototype.slickFilter = function( filter ) {

		const _ = this;

		if ( null !== filter ) {
			_.slidesCache = _.slides;
			_.unload();

			const slideSelector = this.options.slide || '*';

			_.slideTrack.querySelectorAll( slideSelector ).forEach( el => el.remove() );

			const filteredSlides = 'string' === typeof filter ? _.slidesCache.filter( el => el.matches( filter ) ) : _.slidesCache.filter( filter );
			filteredSlides.forEach( el => _.slideTrack.appendChild( el ) );

			_.reinit();
		}
	};

	Slick.prototype.focusHandler = function() {

		const _ = this;

		_.focusInHandler = event => {
			setTimeout( () => {
				if ( _.options.pauseOnFocus && _.slider.contains( document.activeElement ) ) {
					_.focussed = true;
					_.autoPlay();
				}
			}, 0 );
		};

		_.focusOutHandler = () => {
			if ( _.options.pauseOnFocus ) {
				_.focussed = false;
				_.autoPlay();
			}
		};

		_.slider.addEventListener( 'focus', _.focusInHandler, true );
		_.slider.addEventListener( 'blur',  _.focusOutHandler, true );
	};

	Slick.prototype.getCurrent = Slick.prototype.slickCurrentSlide = function() {

		const _ = this;
		return _.currentSlide;
	};

	Slick.prototype.getDotCount = function() {

		const _ = this;

		let breakPoint = 0;
		let counter    = 0;
		let pagerQty   = 0;

		if ( true === _.options.infinite ) {
			if ( _.slideCount <= _.options.slidesToShow ) {
				++pagerQty;
			} else {
				while ( breakPoint < _.slideCount ) {
					++pagerQty;
					breakPoint = counter + _.options.slidesToScroll;
					counter   += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
				}
			}
		} else if ( true === _.options.centerMode ) {
			pagerQty = _.slideCount;
		} else if ( ! _.options.asNavFor ) {
			pagerQty = 1 + Math.ceil( ( _.slideCount - _.options.slidesToShow ) / _.options.slidesToScroll );
		} else {

			while ( breakPoint < _.slideCount ) {
				++pagerQty;
				breakPoint = counter + _.options.slidesToScroll;
				counter   += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
			}
		}

		return pagerQty - 1;
	};

	Slick.prototype.getLeft = function( slideIndex ) {

		const _ = this;
		let targetLeft,
			verticalHeight,
			verticalOffset = 0,
			targetSlide,
			coef;

		_.slideOffset  = 0;
		verticalHeight = _.slides[0].offsetHeight;

		if ( true === _.options.infinite ) {
			if ( _.slideCount > _.options.slidesToShow ) {
				_.slideOffset = ( _.slideWidth * _.options.slidesToShow ) * -1;
				coef          = -1;

				if ( true === _.options.vertical && true === _.options.centerMode ) {

					if ( 2 === _.options.slidesToShow ) {
						coef = -1.5;
					} else if ( 1 === _.options.slidesToShow ) {
						coef = -2;
					}
				}

				verticalOffset = ( verticalHeight * _.options.slidesToShow ) * coef;
			}
			if ( 0 !== _.slideCount % _.options.slidesToScroll ) {

				if ( slideIndex + _.options.slidesToScroll > _.slideCount && _.slideCount > _.options.slidesToShow ) {

					if ( slideIndex > _.slideCount ) {
						_.slideOffset  = ( ( _.options.slidesToShow - ( slideIndex - _.slideCount ) ) * _.slideWidth ) * -1;
						verticalOffset = ( ( _.options.slidesToShow - ( slideIndex - _.slideCount ) ) * verticalHeight ) * -1;
					} else {
						_.slideOffset  = ( ( _.slideCount % _.options.slidesToScroll ) * _.slideWidth ) * -1;
						verticalOffset = ( ( _.slideCount % _.options.slidesToScroll ) * verticalHeight ) * -1;
					}
				}
			}
		} else {

			if ( slideIndex + _.options.slidesToShow > _.slideCount ) {
				_.slideOffset  = ( ( slideIndex + _.options.slidesToShow ) - _.slideCount ) * _.slideWidth;
				verticalOffset = ( ( slideIndex + _.options.slidesToShow ) - _.slideCount ) * verticalHeight;
			}
		}

		if ( _.slideCount <= _.options.slidesToShow ) {
			_.slideOffset  = 0;
			verticalOffset = 0;
		}

		if ( true === _.options.centerMode && _.slideCount <= _.options.slidesToShow ) {
			_.slideOffset = ( ( _.slideWidth * Math.floor( _.options.slidesToShow ) ) / 2 ) - ( ( _.slideWidth * _.slideCount ) / 2 );
		} else if ( true === _.options.centerMode && true === _.options.infinite ) {
			_.slideOffset += _.slideWidth * Math.floor( _.options.slidesToShow / 2 ) - _.slideWidth;
		} else if ( true === _.options.centerMode ) {
			_.slideOffset  = 0;
			_.slideOffset += _.slideWidth * Math.floor( _.options.slidesToShow / 2 );
		}

		if ( false === _.options.vertical ) {
			targetLeft = ( ( slideIndex * _.slideWidth ) * -1 ) + _.slideOffset;
		} else {
			targetLeft = ( ( slideIndex * verticalHeight ) * -1 ) + verticalOffset;
		}

		if ( true === _.options.variableWidth ) {

			const slides = Array.from( _.slideTrack.querySelectorAll( '.slick-slide' ) );

			if ( _.slideCount <= _.options.slidesToShow || false === _.options.infinite ) {
				targetSlide = slides[ slideIndex ];
			} else {
				targetSlide = slides[ slideIndex + _.options.slidesToShow ];
			}

			targetLeft = targetSlide ? targetSlide.offsetLeft * -1 : 0;

			if ( true === _.options.centerMode ) {
				if ( _.slideCount <= _.options.slidesToShow || false === _.options.infinite ) {
					targetSlide = slides[ slideIndex ];
				} else {
					targetSlide = slides[ slideIndex + _.options.slidesToShow + 1 ];
				}

				targetLeft = targetSlide ? targetSlide.offsetLeft * -1 : 0;

				targetLeft += ( _.list.offsetWidth - targetSlide.offsetWidth ) / 2;
			}
		}

		return targetLeft;

	};

	Slick.prototype.getOption = Slick.prototype.slickGetOption = function( option ) {

		const _ = this;

		return _.options[option];
	};

	Slick.prototype.getNavigableIndexes = function() {

		const _ = this;
		let breakPoint = 0,
			counter = 0,
			max;
		const indexes = [];

		if ( false === _.options.infinite ) {
			max = _.slideCount;
		} else {
			breakPoint = _.options.slidesToScroll * -1;
			counter    = _.options.slidesToScroll * -1;
			max        = _.slideCount * 2;
		}

		while ( breakPoint < max ) {
			indexes.push( breakPoint );
			breakPoint = counter + _.options.slidesToScroll;
			counter   += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
		}

		return indexes;

	};

	Slick.prototype.getSlick = function() {

		return this;

	};

	Slick.prototype.getSlideCount = function() {

		const _ = this;

		let slidesTraversed, swipedSlide, swipeTarget, centerOffset;

		centerOffset = true === _.options.centerMode ? Math.floor( _.list.offsetWidth / 2 ) : 0;
		swipeTarget  = ( _.swipeLeft * -1 ) + centerOffset;

		if ( true === _.options.swipeToSlide ) {

			Array.from( _.slideTrack.querySelectorAll( '.slick-slide' ) ).some( slide => {

				const slideOuterWidth = slide.offsetWidth;

				let slideOffset = slide.offsetLeft;

				if ( true !== _.options.centerMode ) slideOffset += ( slideOuterWidth / 2 );

				const slideRightBoundary = slideOffset + slideOuterWidth;

				if ( swipeTarget < slideRightBoundary ) {
					swipedSlide = slide;
					return true;
				}

				return false;
			});

			slidesTraversed = Math.abs( parseInt( swipedSlide.dataset.slickIndex ) - _.currentSlide ) || 1;

			return slidesTraversed;

		} else {
			return _.options.slidesToScroll;
		}
	};

	Slick.prototype.goTo = Slick.prototype.slickGoTo = function( slide, dontAnimate ) {

		const _ = this;

		_.slideHandler( _.checkNavigable( parseInt( slide ) ), false, dontAnimate );
	};

	Slick.prototype.init = function( creation ) {

		const _ = this;

		if ( ! _.slider.classList.contains( 'slick-initialized' ) ) {

			_.slider.classList.add( 'slick-initialized' );

			_.buildRows();
			_.buildOut();
			_.setProps();
			_.startLoad();
			_.loadSlider();
			_.initializeEvents();
			_.updateArrows();
			_.updateDots();
			_.checkResponsive( true );
			_.focusHandler();
		}

		if ( creation ) _.slider.dispatchEvent( new CustomEvent( 'init', { detail: [ _ ] }) );

		if ( true === _.options.accessibility ) _.initADA();

		if ( _.options.autoplay && ! _.options.startPaused ) {
			_.paused = false;
			_.autoPlay();
		}
	};

	Slick.prototype.initADA = function() {
		const _ = this,
			numDotGroups = Math.ceil( _.slideCount / _.options.slidesToScroll ),
			tabControlIndexes = _.getNavigableIndexes().filter( function( val ) {
				return ( 0 <= val ) && ( val < _.slideCount );
			});

		const cloned    = Array.from( _.slideTrack.querySelectorAll( '.slick-cloned' ) );
		const allSlides = [ ..._.slides, ...cloned ];

		allSlides.forEach( el => {
			el.setAttribute( 'aria-hidden', 'true' );
			el.setAttribute( 'tabindex', '-1' );
			el.querySelectorAll( 'a, input, button, select' ).forEach( child => child.setAttribute( 'tabindex', '-1' ) );
		});

		if ( null !== _.dots ) {
			const clonedSet = new Set( cloned );

			_.slides.forEach( ( el, i ) => {
				if ( clonedSet.has( el ) ) return;
				const slideControlIndex = tabControlIndexes.indexOf( i );

				el.setAttribute( 'role', 'tabpanel' );
				el.setAttribute( 'id', `slick-slide${ _.instanceUid }${ i }` );
				el.setAttribute( 'tabindex', '-1' );

				if ( -1 !== slideControlIndex ) {
					const ariaButtonControl = `slick-slide-control${ _.instanceUid }${ slideControlIndex }`;
					if ( document.getElementById( ariaButtonControl ) ) {
						el.setAttribute( 'aria-describedby', ariaButtonControl );
					}
				}
			});

			_.dots.setAttribute( 'role', 'tablist' );
			const dotItems = Array.from( _.dots.querySelectorAll( 'li' ) );
			dotItems.forEach( ( li, i ) => {
				const mappedSlideIndex = tabControlIndexes[i];

				li.setAttribute( 'role', 'presentation' );

				const btn = li.querySelector( 'button' );
				if ( btn ) {
					btn.setAttribute( 'role', 'tab' );
					btn.setAttribute( 'id', `slick-slide-control${ _.instanceUid }${ i }` );
					btn.setAttribute( 'aria-controls', `slick-slide${ _.instanceUid }${ mappedSlideIndex }` );
					btn.setAttribute( 'aria-label', `${ i + 1 } / ${ numDotGroups }` );
					btn.removeAttribute( 'aria-selected' );
					btn.setAttribute( 'tabindex', '-1' );
				}
			});

			const activeDotIndex = Math.floor( _.currentSlide / _.options.slidesToScroll );
			const activeBtn      = dotItems[ activeDotIndex ] && dotItems[ activeDotIndex ].querySelector( 'button' );

			if ( activeBtn ) {
				activeBtn.setAttribute( 'aria-selected', 'true' );
				activeBtn.setAttribute( 'tabindex', '0' );
			}
		}

		for ( let i = _.currentSlide, max = i + _.options.slidesToShow; i < max; i++ ) {
			if ( _.options.focusOnChange ) _.slides[i].setAttribute( 'tabindex', '0' );
			else _.slides[i].removeAttribute( 'tabindex' );
		}

		_.activateADA();
	};

	Slick.prototype.initArrowEvents = function() {

		const _ = this;

		if ( true === _.options.arrows && _.slideCount > _.options.slidesToShow ) {
			_.prevArrow.removeEventListener( 'click', _.changeSlide );
			_.prevArrow.addEventListener( 'click', _.changeSlide );
			_.nextArrow.removeEventListener( 'click', _.changeSlide );
			_.nextArrow.addEventListener( 'click', _.changeSlide );

			if ( true === _.options.accessibility ) {
				_.prevArrow.addEventListener( 'keydown', _.keyHandler );
				_.nextArrow.addEventListener( 'keydown', _.keyHandler );
			}
		}
	};

	Slick.prototype.initDotEvents = function() {

		const _ = this;

		if ( true === _.options.dots && _.slideCount > _.options.slidesToShow ) {
			_.dots.querySelectorAll( 'li' ).forEach( li => li.addEventListener( 'click', _.changeSlide ) );

			if ( true === _.options.accessibility ) {
				_.dots.addEventListener( 'keydown', _.keyHandler );
			}
		}

		if ( true === _.options.dots && true === _.options.pauseOnDotsHover && _.slideCount > _.options.slidesToShow ) {
			_.dots.querySelectorAll( 'li' ).forEach( li => {
				li.addEventListener( 'mouseenter', _.interrupt.bind( _, true ) );
				li.addEventListener( 'mouseleave', _.interrupt.bind( _, false ) );
			});
		}
	};

	Slick.prototype.initSlideEvents = function() {

		const _ = this;

		if ( _.options.pauseOnHover ) {
			_.list.addEventListener( 'mouseenter', _.interrupt.bind( _, true ) );
			_.list.addEventListener( 'mouseleave', _.interrupt.bind( _, false ) );
		}
	};

	Slick.prototype.initializeEvents = function() {

		const _ = this;

		_.initArrowEvents();
		_.initDotEvents();
		_.initSlideEvents();

		_.list.addEventListener( 'touchstart',  _.swipeHandler );
		_.list.addEventListener( 'mousedown',   _.swipeHandler );
		_.list.addEventListener( 'touchmove',   _.swipeHandler );
		_.list.addEventListener( 'mousemove',   _.swipeHandler );
		_.list.addEventListener( 'touchend',    _.swipeHandler );
		_.list.addEventListener( 'mouseup',     _.swipeHandler );
		_.list.addEventListener( 'touchcancel', _.swipeHandler );
		_.list.addEventListener( 'mouseleave',  _.swipeHandler );
		_.list.addEventListener( 'click',       _.clickHandler );

		document.addEventListener( _.visibilityChange, _.visibilityHandler );

		if ( true === _.options.accessibility ) _.list.addEventListener( 'keydown', _.keyHandler );

		if ( true === _.options.focusOnSelect ) Array.from( _.slideTrack.children ).forEach( el => el.addEventListener( 'click', _.selectHandler ) );

		window.addEventListener( 'orientationchange', _.orientationChangeHandler );
		window.addEventListener( 'resize', _.resizeHandler );

		_.slideTrack.querySelectorAll( '[draggable="false"]' ).forEach( el => el.addEventListener( 'dragstart', _.preventDefault ) );

		window.addEventListener( 'load', _.setPosition );
	};

	Slick.prototype.initUI = function() {

		const _ = this;

		if ( true === _.options.arrows && _.slideCount > _.options.slidesToShow ) {
			_.prevArrow.style.display = '';
			_.nextArrow.style.display = '';
		}

		if ( true === _.options.dots && _.slideCount > _.options.slidesToShow ) _.dots.style.display = '';
	};

	Slick.prototype.keyHandler = function( event ) {

		const _ = this;

		// Dont slide if the cursor is inside the form fields and arrow keys are
		// pressed.

		if ( ! event.target.tagName.match( 'TEXTAREA|INPUT|SELECT' ) ) {
			if ( 37 === event.keyCode && true === _.options.accessibility ) _.prev();
			else if ( 39 === event.keyCode && true === _.options.accessibility ) _.next();
		}
	};

	Slick.prototype.loadSlider = function() {

		const _ = this;

		_.setPosition();
		_.slideTrack.style.opacity = '1';
		_.slider.classList.remove( 'slick-loading' );
		_.initUI();
	};

	Slick.prototype.next = Slick.prototype.slickNext = function() {

		const _ = this;

		const unevenOffset = ( 0 !== _.slideCount % _.options.slidesToScroll );
		const indexOffset  = unevenOffset ? 0 : ( _.slideCount - _.currentSlide ) % _.options.slidesToScroll;
		const slideOffset  = 0 === indexOffset ? _.options.slidesToScroll : indexOffset;

		if ( _.slideCount > _.options.slidesToShow ) _.slideHandler( _.currentSlide + slideOffset, false );
	};

	Slick.prototype.orientationChange = function() {

		const _ = this;

		_.checkResponsive();
		_.setPosition();
	};

	Slick.prototype.pause = Slick.prototype.slickPause = function() {

		const _ = this;

		_.autoPlayClear();
		_.paused = true;
	};

	Slick.prototype.play = Slick.prototype.slickPlay = function() {
		const _ = this;

		_.paused      = false;
		_.focussed    = false;
		_.interrupted = false;
		_.autoPlay();
	};

	Slick.prototype.postSlide = function( index ) {

		const _ = this;

		if ( !_.unslicked ) {

			_.slider.dispatchEvent( new CustomEvent( 'afterChange', { detail: [_, index] }) );

			_.animating = false;

			if ( _.slideCount > _.options.slidesToShow ) _.setPosition();

			_.swipeLeft = null;

			if ( _.options.autoplay ) _.autoPlay();

			if ( true === _.options.accessibility ) {
				_.initADA();

				if ( _.options.focusOnChange ) {
					_.slides[_.currentSlide].setAttribute( 'tabindex', '0' );
					_.slides[_.currentSlide].focus();
				}
			}
		}
	};

	Slick.prototype.prev = Slick.prototype.slickPrev = function() {

		const _ = this;

		const unevenOffset = ( 0 !== _.slideCount % _.options.slidesToScroll );
		const indexOffset  = unevenOffset ? 0 : ( _.slideCount - _.currentSlide ) % _.options.slidesToScroll;
		const slideOffset  = 0 === indexOffset ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;

		if ( _.slideCount > _.options.slidesToShow ) _.slideHandler( _.currentSlide - slideOffset, false );
	};

	Slick.prototype.preventDefault = function( event ) {
		event.preventDefault();
	};

	Slick.prototype.refresh = function( initializing ) {

		const _ = this;

		let currentSlide, lastVisibleIndex;

		lastVisibleIndex = _.slideCount - _.options.slidesToShow;

		// In non-infinite sliders, we don't want to go past the last visible
		// index.
		if ( ! _.options.infinite && ( _.currentSlide > lastVisibleIndex ) ) _.currentSlide = lastVisibleIndex;

		// If less slides than to show, go to start.
		if ( _.slideCount <= _.options.slidesToShow ) _.currentSlide = 0;

		currentSlide = _.currentSlide;

		_.destroy( true );

		Object.assign( _, _.initials, { currentSlide: currentSlide });

		_.init();

		if ( ! initializing ) _.slideHandler( _.checkNavigable( currentSlide ), false, false );
	};

	Slick.prototype.registerBreakpoints = function() {

		const _ = this;
		let breakpoint, currentBreakpoint, l;
		const responsiveSettings = _.options.responsive || null;

		if ( Array.isArray( responsiveSettings ) && responsiveSettings.length ) {

			_.respondTo = _.options.respondTo || 'window';

			for ( breakpoint in responsiveSettings ) {

				l = _.breakpoints.length - 1;

				if ( responsiveSettings.hasOwnProperty( breakpoint ) ) {
					currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

					const parsedBreakpoint = parseBreakpoint( currentBreakpoint );

					// Loop through the breakpoints and cut out any existing
					// ones with the same breakpoint number, we don't want
					// dupes.
					while ( 0 <= l ) {
						if ( _.breakpoints[l] && _.breakpoints[l] === parsedBreakpoint ) {
							_.breakpoints.splice( l, 1 );
						}
						l--;
					}

					_.breakpoints.push( parsedBreakpoint );
					_.breakpointSettings[parsedBreakpoint] = responsiveSettings[breakpoint].settings;
				}
			}

			_.breakpoints.sort( function( a, b ) {
				return ( _.options.mobileFirst ) ? a - b : b - a;
			});
		}
	};

	Slick.prototype.reinit = function() {

		const _ = this;

		_.slides = Array.from( _.slideTrack.querySelectorAll( _.options.slide || '*' ) );
		_.slides.forEach( el => el.classList.add( 'slick-slide' ) );

		_.slideCount = _.slides.length;

		if ( _.currentSlide >= _.slideCount && 0 !== _.currentSlide ) _.currentSlide = _.currentSlide - _.options.slidesToScroll;

		if ( _.slideCount <= _.options.slidesToShow ) _.currentSlide = 0;

		_.registerBreakpoints();
		_.setProps();
		_.setupInfinite();
		_.buildArrows();
		_.updateArrows();
		_.initArrowEvents();
		_.buildDots();
		_.updateDots();
		_.initDotEvents();
		_.cleanUpSlideEvents();
		_.initSlideEvents();
		_.checkResponsive( false, true );

		if ( true === _.options.focusOnSelect ) Array.from( _.slideTrack.children ).forEach( el => el.addEventListener( 'click', _.selectHandler ) );

		_.setSlideClasses( 'number' === typeof _.currentSlide ? _.currentSlide : 0 );

		_.setPosition();
		_.focusHandler();

		_.paused = ! _.options.autoplay;
		_.autoPlay();

		_.slider.dispatchEvent( new CustomEvent( 'reInit', { detail: [ _ ] }) );
	};

	Slick.prototype.resize = function() {

		const _ = this;

		if ( window.innerWidth !== _.windowWidth ) {
			clearTimeout( _.windowDelay );
			_.windowDelay = window.setTimeout( () => {
				_.windowWidth = window.innerWidth;
				_.checkResponsive();
				if ( !_.unslicked ) _.setPosition();
			}, 50 );
		}
	};

	Slick.prototype.removeSlide = Slick.prototype.slickRemove = function( index, removeBefore, removeAll ) {

		const _ = this;

		if ( 'boolean' === typeof( index ) ) {
			removeBefore = index;
			index        = true === removeBefore ? 0 : _.slideCount - 1;
		} else {
			index = true === removeBefore ? --index : index;
		}

		if ( 1 > _.slideCount || 0 > index || index > _.slideCount - 1 ) return false;

		_.unload();

		if ( true === removeAll ) Array.from( _.slideTrack.children ).forEach( el => el.remove() );
		else _.slideTrack.querySelectorAll( this.options.slide || '*' )[ index ].remove();

		_.slides = Array.from( _.slideTrack.querySelectorAll( this.options.slide || '*' ) );

		const slideSelector = this.options.slide || '*';

		_.slideTrack.querySelectorAll( slideSelector ).forEach( el => el.remove() );
		_.slides.forEach( el => _.slideTrack.appendChild( el ) );
		_.slidesCache = _.slides;
		_.reinit();
	};

	Slick.prototype.setCSS = function( position ) {

		const _ = this;

		let positionProps = {};
		let x, y;

		x = 'left' === _.positionProp ? `${Math.ceil( position )}px` : '0';
		y = 'top' === _.positionProp ? `${Math.ceil( position )}px` : '0';

		positionProps[_.positionProp] = position;

		if ( false === _.transformsEnabled ) {
			Object.assign( _.slideTrack.style, positionProps );
		} else {
			positionProps = {};
			if ( false === _.cssTransitions ) {
				positionProps[_.animType] = `translate(${x}, ${y})`;
				Object.assign( _.slideTrack.style, positionProps );
			} else {
				positionProps[_.animType] = `translate3d(${x}, ${y}, 0)`;
				Object.assign( _.slideTrack.style, positionProps );
			}
		}
	};

	Slick.prototype.setDimensions = function() {

		const _ = this;

		if ( false === _.options.vertical ) {
			if ( true === _.options.centerMode ) _.list.style.padding = `0px ${_.options.centerPadding}`;
		} else {
			_.list.style.height = `${( _.slides[0].offsetHeight * _.options.slidesToShow )}px`;

			if ( true === _.options.centerMode ) _.list.style.padding = `${_.options.centerPadding} 0px`;
		}

		_.listWidth  = _.list.offsetWidth;
		_.listHeight = _.list.offsetHeight;

		if ( false === _.options.vertical && false === _.options.variableWidth ) {
			_.slideWidth             = Math.ceil( _.listWidth / _.options.slidesToShow );
			_.slideTrack.style.width = `${Math.ceil( _.slideWidth * _.slideTrack.querySelectorAll( '.slick-slide' ).length )}px`;

		} else if ( true === _.options.variableWidth ) {
			_.slideTrack.style.width = `${5000 * _.slideCount}px`;
		} else {
			_.slideWidth              = Math.ceil( _.listWidth );
			_.slideTrack.style.height = `${Math.ceil( _.slides[0].offsetHeight * _.slideTrack.querySelectorAll( '.slick-slide' ).length )}px`;
		}

		const slideStyle = window.getComputedStyle( _.slides[0] );
		const offset     = parseInt( slideStyle.marginLeft ) + parseInt( slideStyle.marginRight );

		if ( false === _.options.variableWidth ) _.slideTrack.querySelectorAll( '.slick-slide' ).forEach( el => el.style.width = `${_.slideWidth - offset}px` );
	};

	Slick.prototype.setFade = function() {

		const _ = this;
		let targetLeft;

		_.slides.forEach( ( el, index ) => {
			targetLeft = ( _.slideWidth * index ) * -1;
			Object.assign( el.style, {
				position: 'relative',
				left    : `${targetLeft}px`,
				top     : '0',
				zIndex  : _.options.zIndex - 2,
				opacity : '0'
			});
		});

		_.slides[_.currentSlide].style.zIndex  = _.options.zIndex - 1;
		_.slides[_.currentSlide].style.opacity = '1';
	};

	Slick.prototype.setHeight = function() {

		const _ = this;

		if ( 1 === _.options.slidesToShow && true === _.options.adaptiveHeight && false === _.options.vertical ) {
			const targetHeight = _.slides[_.currentSlide].offsetHeight;
			_.list.style.height = `${targetHeight}px`;
		}
	};

	Slick.prototype.setOption =
	Slick.prototype.slickSetOption = function() {

		/**
		 * accepts arguments in format of:
		 *
		 *  - for changing a single option's value:
		 *     .slick("setOption", option, value, refresh )
		 *
		 *  - for changing a set of responsive options:
		 *     .slick("setOption", 'responsive', [{}, ...], refresh )
		 *
		 *  - for updating multiple values at once (not responsive)
		 *     .slick("setOption", { 'option': value, ... }, refresh )
		 */

		const _ = this;
		let l, item, option, value, refresh = false, type;

		if ( '[object Object]' === Object.prototype.toString.call( arguments[0] ) ) {
			option  = arguments[0];
			refresh = arguments[1];
			type    = 'multiple';
		} else if ( 'string' === typeof arguments[0] ) {
			option  = arguments[0];
			value   = arguments[1];
			refresh = arguments[2];

			if ( 'responsive' === arguments[0] && Array.isArray( arguments[1] ) ) {
				type = 'responsive';
			} else if ( 'undefined' !== typeof arguments[1] ) {
				type = 'single';
			}
		}

		if ( 'single' === type ) {
			_.options[option] = value;
		} else if ( 'multiple' === type ) {

			Object.entries( option ).forEach( ( [opt, val] ) => {
				_.options[opt] = val;
			});
		} else if ( 'responsive' === type ) {

			for ( item in value ) {

				if ( ! Array.isArray( _.options.responsive ) ) {
					_.options.responsive = [ value[item] ];
				} else {
					l = _.options.responsive.length - 1;

					// Loop through the responsive object and splice out
					// duplicates.
					while ( 0 <= l ) {

						if ( _.options.responsive[l].breakpoint === value[item].breakpoint ) {
							_.options.responsive.splice( l, 1 );
						}

						l--;
					}

					_.options.responsive.push( value[item] );
				}
			}
		}

		if ( refresh ) {
			_.unload();
			_.reinit();
		}
	};

	Slick.prototype.setPosition = function() {

		const _ = this;

		_.setDimensions();
		_.setHeight();

		if ( false === _.options.fade ) {
			_.setCSS( _.getLeft( _.currentSlide ) );
		} else {
			_.setFade();
		}

		_.slider.dispatchEvent( new CustomEvent( 'setPosition', { detail: [ _ ] }) );
	};

	Slick.prototype.setProps = function() {

		const _ = this,
			bodyStyle = document.body.style;

		_.positionProp = true === _.options.vertical ? 'top' : 'left';

		if ( 'top' === _.positionProp ) {
			_.slider.classList.add( 'slick-vertical' );
		} else {
			_.slider.classList.remove( 'slick-vertical' );
		}

		if ( undefined !== bodyStyle.transition ) {
			if ( true === _.options.useCSS ) {
				_.cssTransitions = true;
			}
		}

		if ( _.options.fade ) {
			if ( 'number' === typeof _.options.zIndex ) {
				if ( 3 > _.options.zIndex ) {
					_.options.zIndex = 3;
				}
			} else {
				_.options.zIndex = _.defaults.zIndex;
			}
		}

		if ( undefined !== bodyStyle.webkitTransform ) {
			_.animType       = 'webkitTransform';
			_.transformType  = '-webkit-transform';
			_.transitionType = 'webkitTransition';
			if ( undefined === bodyStyle.perspectiveProperty && undefined === bodyStyle.webkitPerspective ) _.animType = false;
		}
		if ( undefined !== bodyStyle.transform && false !== _.animType ) {
			_.animType       = 'transform';
			_.transformType  = 'transform';
			_.transitionType = 'transition';
		}
		_.transformsEnabled = _.options.useTransform && ( null !== _.animType && false !== _.animType );
	};

	Slick.prototype.setSlideClasses = function( index ) {

		const _ = this;
		let centerOffset, indexOffset, remainder;

		const allSlides = Array.from( _.slider.querySelectorAll( '.slick-slide' ) );
		allSlides.forEach( el => {
			el.classList.remove( 'slick-active', 'slick-center', 'slick-current' );
			el.setAttribute( 'aria-hidden', 'true' );
		});

		if ( ! _.slides[index] ) return;

		_.slides[index].classList.add( 'slick-current' );

		if ( true === _.options.centerMode ) {

			let evenCoef;

			if ( _.options.slidesToShow >= _.slides.length ) {
				evenCoef     = -1;
				centerOffset = _.options.slidesToShow = _.slides.length;
			} else {
				evenCoef     = 0 === _.options.slidesToShow % 2 ? 1 : 0;
				centerOffset = Math.floor( _.options.slidesToShow / 2 );
			}

			if ( true === _.options.infinite ) {

				if ( index >= centerOffset && index <= ( _.slideCount - 1 ) - centerOffset ) {
					_.slides.slice( index - centerOffset + evenCoef, index + centerOffset + 1 ).forEach( el => {
						el.classList.add( 'slick-active' );
						el.setAttribute( 'aria-hidden', 'false' );
					});
				} else {
					indexOffset = _.options.slidesToShow + index;
					allSlides.slice( indexOffset - centerOffset + 1 + evenCoef, indexOffset + centerOffset + 2 ).forEach( el => {
						el.classList.add( 'slick-active' );
						el.setAttribute( 'aria-hidden', 'false' );
					});
				}

				if ( 0 === index ) {
					allSlides[_.options.slidesToShow + _.slideCount + 1].classList.add( 'slick-center' );
				} else if ( _.slideCount - 1 === index ) {
					allSlides[_.options.slidesToShow].classList.add( 'slick-center' );
				}
			}

			_.slides[index].classList.add( 'slick-center' );
		} else {

			if ( 0 <= index && index <= ( _.slideCount - _.options.slidesToShow ) ) {

				_.slides.slice( index, index + _.options.slidesToShow ).forEach( el => {
					el.classList.add( 'slick-active' );
					el.setAttribute( 'aria-hidden', 'false' );
				});
			} else if ( allSlides.length <= _.options.slidesToShow ) {

				allSlides.forEach( el => {
					el.classList.add( 'slick-active' );
					el.setAttribute( 'aria-hidden', 'false' );
				});
			} else {
				remainder   = _.slideCount % _.options.slidesToShow;
				indexOffset = true === _.options.infinite ? _.options.slidesToShow + index : index;

				if ( _.options.slidesToShow === _.options.slidesToScroll && ( _.slideCount - index ) < _.options.slidesToShow ) {

					allSlides.slice( indexOffset - ( _.options.slidesToShow - remainder ), indexOffset + remainder ).forEach( el => {
						el.classList.add( 'slick-active' );
						el.setAttribute( 'aria-hidden', 'false' );
					});
				} else {

					allSlides.slice( indexOffset, indexOffset + _.options.slidesToShow ).forEach( el => {
						el.classList.add( 'slick-active' );
						el.setAttribute( 'aria-hidden', 'false' );
					});
				}
			}
		}
	};

	Slick.prototype.setupInfinite = function() {

		const _ = this;

		let i, slideIndex, infiniteCount;

		if ( true === _.options.fade ) _.options.centerMode = false;

		if ( true === _.options.infinite && false === _.options.fade ) {

			slideIndex = null;

			if ( _.slideCount > _.options.slidesToShow ) {

				if ( true === _.options.centerMode ) infiniteCount = _.options.slidesToShow + 1;
				else infiniteCount = _.options.slidesToShow;

				for ( i = _.slideCount; i > ( _.slideCount - infiniteCount ); i -= 1 ) {
					slideIndex = i - 1;

					const clonePrev = _.slides[slideIndex].cloneNode( true );

					clonePrev.removeAttribute( 'id' );
					clonePrev.setAttribute( 'data-slick-index', slideIndex - _.slideCount );
					clonePrev.classList.add( 'slick-cloned' );
					_.slideTrack.insertBefore( clonePrev, _.slideTrack.firstChild );
				}

				for ( i = 0; i < infiniteCount  + _.slideCount; i += 1 ) {
					slideIndex = i % _.slideCount;

					const cloneNext = _.slides[slideIndex].cloneNode( true );

					cloneNext.removeAttribute( 'id' );
					cloneNext.setAttribute( 'data-slick-index', slideIndex + _.slideCount );
					cloneNext.classList.add( 'slick-cloned' );
					_.slideTrack.appendChild( cloneNext );
				}

				_.slideTrack.querySelectorAll( '.slick-cloned [id]' ).forEach( el => el.removeAttribute( 'id' ) );
			}
		}
	};

	Slick.prototype.interrupt = function( toggle ) {

		const _ = this;

		if ( ! toggle ) {
			_.autoPlay();
		}
		_.interrupted = toggle;

	};

	Slick.prototype.selectHandler = function( event ) {

		const _             = this;
		const targetElement = event.target.classList.contains( 'slick-slide' ) ? event.target : event.target.closest( '.slick-slide' );

		let index = parseInt( targetElement.dataset.slickIndex );

		if ( ! index ) index = 0;

		if ( _.slideCount <= _.options.slidesToShow ) {
			_.slideHandler( index, false, true );
			return;
		}

		_.slideHandler( index );
	};

	Slick.prototype.slideHandler = function( index, sync, dontAnimate ) {

		const _ = this;
		let targetSlide, animSlide, oldSlide, slideLeft, targetLeft = null, navTarget;

		sync = sync || false;

		if ( true === _.animating && true === _.options.waitForAnimate ) {
			return;
		}

		if ( true === _.options.fade && index === _.currentSlide ) {
			return;
		}

		if ( false === sync ) {
			_.asNavFor( index );
		}

		targetSlide = index;
		targetLeft  = _.getLeft( targetSlide );
		slideLeft   = _.getLeft( _.currentSlide );

		_.currentLeft = null === _.swipeLeft ? slideLeft : _.swipeLeft;

		if ( false === _.options.infinite && false === _.options.centerMode && ( 0 > index || index > _.getDotCount() * _.options.slidesToScroll ) ) {
			if ( false === _.options.fade ) {
				targetSlide = _.currentSlide;
				if ( true !== dontAnimate && _.slideCount > _.options.slidesToShow ) {
					_.animateSlide( slideLeft, function() {
						_.postSlide( targetSlide );
					});
				} else {
					_.postSlide( targetSlide );
				}
			}
			return;
		} else if ( false === _.options.infinite && true === _.options.centerMode && ( 0 > index || index > ( _.slideCount - _.options.slidesToScroll ) ) ) {
			if ( false === _.options.fade ) {
				targetSlide = _.currentSlide;
				if ( true !== dontAnimate && _.slideCount > _.options.slidesToShow ) {
					_.animateSlide( slideLeft, function() {
						_.postSlide( targetSlide );
					});
				} else {
					_.postSlide( targetSlide );
				}
			}
			return;
		}

		if ( _.options.autoplay ) {
			clearInterval( _.autoPlayTimer );
		}

		if ( 0 > targetSlide ) {
			if ( 0 !== _.slideCount % _.options.slidesToScroll ) {
				animSlide = _.slideCount - ( _.slideCount % _.options.slidesToScroll );
			} else {
				animSlide = _.slideCount + targetSlide;
			}
		} else if ( targetSlide >= _.slideCount ) {
			if ( 0 !== _.slideCount % _.options.slidesToScroll ) {
				animSlide = 0;
			} else {
				animSlide = targetSlide - _.slideCount;
			}
		} else {
			animSlide = targetSlide;
		}

		_.animating = true;

		_.slider.dispatchEvent( new CustomEvent( 'beforeChange', { detail: [_, _.currentSlide, animSlide] }) );

		oldSlide       = _.currentSlide;
		_.currentSlide = animSlide;

		_.setSlideClasses( _.currentSlide );

		if ( _.options.asNavFor ) {

			navTarget = _.getNavTarget();

			navTarget.forEach( el => {
				const nav = el.slick;
				if ( nav && nav.slideCount <= nav.options.slidesToShow ) {
					nav.setSlideClasses( _.currentSlide );
				}
			});

		}

		_.updateDots();
		_.updateArrows();

		if ( true === _.options.fade ) {
			if ( true !== dontAnimate ) {

				_.fadeSlideOut( oldSlide );

				_.fadeSlide( animSlide, function() {
					_.postSlide( animSlide );
				});

			} else {
				_.postSlide( animSlide );
			}
			_.animateHeight();
			return;
		}

		if ( true !== dontAnimate && _.slideCount > _.options.slidesToShow ) {
			_.animateSlide( targetLeft, function() {
				_.postSlide( animSlide );
			});
		} else {
			_.postSlide( animSlide );
		}
	};

	Slick.prototype.startLoad = function() {

		const _ = this;

		if ( true === _.options.arrows && _.slideCount > _.options.slidesToShow ) {
			_.prevArrow.style.display = 'none';
			_.nextArrow.style.display = 'none';
		}

		if ( true === _.options.dots && _.slideCount > _.options.slidesToShow ) {
			_.dots.style.display = 'none';
		}

		_.slider.classList.add( 'slick-loading' );
	};

	Slick.prototype.swipeDirection = function() {

		const _ = this;
		let xDist, yDist, r, swipeAngle;

		xDist = _.touchObject.startX - _.touchObject.curX;
		yDist = _.touchObject.startY - _.touchObject.curY;
		r     = Math.atan2( yDist, xDist );

		swipeAngle = Math.round( r * 180 / Math.PI );

		if ( 0 > swipeAngle ) {
			swipeAngle = 360 - Math.abs( swipeAngle );
		}

		if ( ( 45 >= swipeAngle ) && ( 0 <= swipeAngle ) ) {
			return 'left';
		}

		if ( ( 360 >= swipeAngle ) && ( 315 <= swipeAngle ) ) {
			return 'left';
		}

		if ( ( 135 <= swipeAngle ) && ( 225 >= swipeAngle ) ) {
			return 'right';
		}

		if ( true === _.options.verticalSwiping ) {
			if ( ( 35 <= swipeAngle ) && ( 135 >= swipeAngle ) ) {
				return 'down';
			} else {
				return 'up';
			}
		}

		return 'vertical';

	};

	Slick.prototype.swipeEnd = function( event ) {

		const _ = this;
		let slideCount,
			direction;

		_.dragging = false;
		_.swiping  = false;

		if ( _.scrolling ) {
			_.scrolling = false;
			return false;
		}

		_.interrupted = false;
		_.shouldClick = ( 10 < _.touchObject.swipeLength ) ? false : true;

		if ( _.touchObject.curX === undefined ) {
			return false;
		}

		if ( true === _.touchObject.edgeHit ) {
			_.slider.dispatchEvent( new CustomEvent( 'edge', { detail: [_, _.swipeDirection() ] }) );
		}

		if ( _.touchObject.swipeLength >= _.touchObject.minSwipe ) {

			direction = _.swipeDirection();

			switch ( direction ) {

			case 'left':
			case 'down':

				slideCount =
					_.options.swipeToSlide ?
						_.checkNavigable( _.currentSlide + _.getSlideCount() ) :
						_.currentSlide + _.getSlideCount();

				_.currentDirection = 0;

				break;

			case 'right':
			case 'up':

				slideCount =
					_.options.swipeToSlide ?
						_.checkNavigable( _.currentSlide - _.getSlideCount() ) :
						_.currentSlide - _.getSlideCount();

				_.currentDirection = 1;

				break;

			default:
			}

			if ( 'vertical' !== direction ) {

				_.slideHandler( slideCount );
				_.touchObject = {};
				_.slider.dispatchEvent( new CustomEvent( 'swipe', { detail: [_, direction ] }) );

			}

		} else {

			if ( _.touchObject.startX !== _.touchObject.curX ) {

				_.slideHandler( _.currentSlide );
				_.touchObject = {};

			}

		}

	};

	Slick.prototype.swipeHandler = function( event ) {

		const _ = this;

		if ( ( false === _.options.swipe ) || ( 'ontouchend' in document && false === _.options.swipe ) ) {
			return;
		} else if ( false === _.options.draggable  && -1 !== event.type.indexOf( 'mouse' ) ) {
			return;
		}

		_.touchObject.fingerCount = event.touches !== undefined ? event.touches.length : 1;

		_.touchObject.minSwipe = _.listWidth / _.options
			.touchThreshold;

		if ( true === _.options.verticalSwiping ) {
			_.touchObject.minSwipe = _.listHeight / _.options
				.touchThreshold;
		}

		switch ( event.type ) {

		case 'touchstart':
		case 'mousedown':
			_.swipeStart( event );
			break;

		case 'touchmove':
		case 'mousemove':
			_.swipeMove( event );
			break;

		case 'touchend':
		case 'touchcancel':
		case 'mouseup':
		case 'mouseleave':
			_.swipeEnd( event );
			break;
		}

	};

	Slick.prototype.swipeMove = function( event ) {

		const _ = this;
		let curLeft, swipeDirection, swipeLength, positionOffset, touches, verticalSwipeLength;

		touches = event.touches !== undefined ? event.touches : null;

		if ( ! _.dragging || _.scrolling || touches && 1 !== touches.length ) {
			return false;
		}

		curLeft = _.getLeft( _.currentSlide );

		_.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
		_.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

		_.touchObject.swipeLength = Math.round( Math.sqrt( Math.pow( _.touchObject.curX - _.touchObject.startX, 2 ) ) );

		verticalSwipeLength = Math.round( Math.sqrt( Math.pow( _.touchObject.curY - _.touchObject.startY, 2 ) ) );

		if ( ! _.options.verticalSwiping && ! _.swiping && 4 < verticalSwipeLength ) {
			_.scrolling = true;
			return false;
		}

		if ( true === _.options.verticalSwiping ) {
			_.touchObject.swipeLength = verticalSwipeLength;
		}

		swipeDirection = _.swipeDirection();

		if ( 4 < _.touchObject.swipeLength ) {
			_.swiping = true;
			event.preventDefault();
		}

		positionOffset = _.touchObject.curX > _.touchObject.startX ? 1 : -1;
		if ( true === _.options.verticalSwiping ) {
			positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
		}

		swipeLength = _.touchObject.swipeLength;

		_.touchObject.edgeHit = false;

		if ( false === _.options.infinite ) {

			if ( ( 0 === _.currentSlide && 'right' === swipeDirection ) || ( _.currentSlide >= _.getDotCount() && 'left' === swipeDirection ) ) {
				swipeLength           = _.touchObject.swipeLength * _.options.edgeFriction;
				_.touchObject.edgeHit = true;
			}
		}

		if ( false === _.options.vertical ) {
			_.swipeLeft = curLeft + swipeLength * positionOffset;
		} else {
			_.swipeLeft = curLeft + ( swipeLength * ( _.list.offsetHeight / _.listWidth ) ) * positionOffset;
		}

		if ( true === _.options.verticalSwiping ) {
			_.swipeLeft = curLeft + swipeLength * positionOffset;
		}

		if ( true === _.options.fade || false === _.options.touchMove ) {
			return false;
		}

		if ( true === _.animating ) {
			_.swipeLeft = null;
			return false;
		}

		_.setCSS( _.swipeLeft );

	};

	Slick.prototype.swipeStart = function( event ) {

		const _ = this;
		let touches;

		_.interrupted = true;

		if ( 1 !== _.touchObject.fingerCount || _.slideCount <= _.options.slidesToShow ) {
			_.touchObject = {};
			return false;
		}

		if ( event.touches !== undefined ) {
			touches = event.touches[0];
		}

		_.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
		_.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

		_.dragging = true;

	};

	Slick.prototype.unfilterSlides = Slick.prototype.slickUnfilter = function() {

		const _ = this;

		if ( null !== _.slidesCache ) {

			_.unload();

			const slideSelector = this.options.slide || '*';

			_.slideTrack.querySelectorAll( slideSelector ).forEach( el => el.remove() );
			_.slidesCache.forEach( el => _.slideTrack.appendChild( el ) );
			_.reinit();
		}
	};

	Slick.prototype.unload = function() {

		const _ = this;

		_.slider.querySelectorAll( '.slick-cloned' ).forEach( el => el.remove() );

		if ( _.dots ) _.dots.remove();
		if ( _.prevArrow && _.htmlExpr.test( _.options.prevArrow ) ) _.prevArrow.remove();
		if ( _.nextArrow && _.htmlExpr.test( _.options.nextArrow ) ) _.nextArrow.remove();

		_.slides.forEach( el => {
			el.classList.remove( 'slick-slide', 'slick-active', 'slick-visible', 'slick-current' );
			el.setAttribute( 'aria-hidden', 'true' );
			el.style.width = '';
		});
	};

	Slick.prototype.unslick = function( fromBreakpoint ) {

		const _ = this;
		_.slider.dispatchEvent( new CustomEvent( 'unslick', { detail: [_, fromBreakpoint] }) );
		_.destroy();

	};

	Slick.prototype.updateArrows = function() {

		const _ = this;

		if (
			true === _.options.arrows &&
			_.slideCount > _.options.slidesToShow &&
			!_.options.infinite
		) {
			_.prevArrow.classList.remove( 'slick-disabled' );
			_.prevArrow.setAttribute( 'aria-disabled', 'false' );
			_.nextArrow.classList.remove( 'slick-disabled' );
			_.nextArrow.setAttribute( 'aria-disabled', 'false' );

			if ( 0 === _.currentSlide ) {
				_.prevArrow.classList.add( 'slick-disabled' );
				_.prevArrow.setAttribute( 'aria-disabled', 'true' );
				_.nextArrow.classList.remove( 'slick-disabled' );
				_.nextArrow.setAttribute( 'aria-disabled', 'false' );
			} else if ( _.currentSlide >= _.slideCount - _.options.slidesToShow && false === _.options.centerMode ) {
				_.nextArrow.classList.add( 'slick-disabled' );
				_.nextArrow.setAttribute( 'aria-disabled', 'true' );
				_.prevArrow.classList.remove( 'slick-disabled' );
				_.prevArrow.setAttribute( 'aria-disabled', 'false' );
			} else if ( _.currentSlide >= _.slideCount - 1 && true === _.options.centerMode ) {
				_.nextArrow.classList.add( 'slick-disabled' );
				_.nextArrow.setAttribute( 'aria-disabled', 'true' );
				_.prevArrow.classList.remove( 'slick-disabled' );
				_.prevArrow.setAttribute( 'aria-disabled', 'false' );
			}
		}
	};

	Slick.prototype.updateDots = function() {

		const _ = this;

		if ( null !== _.dots ) {

			_.dots.querySelectorAll( 'li' ).forEach( li => li.classList.remove( 'slick-active' ) );

			const activeIndex = Math.floor( _.currentSlide / _.options.slidesToScroll );
			_.dots.querySelectorAll( 'li' )[ activeIndex ].classList.add( 'slick-active' );

		}
	};

	Slick.prototype.visibility = function() {

		const _ = this;

		if ( _.options.autoplay ) {

			if ( document[_.hidden] ) {

				_.interrupted = true;

			} else {

				_.interrupted = false;

			}

		}

	};

	window.slickInit = function( selector, opt ) {
		const elements = 'string' === typeof selector ?
			Array.from( document.querySelectorAll( selector ) ) :
			( selector instanceof Element ? [ selector ] : Array.from( selector ) );

		const args = Array.prototype.slice.call( arguments, 2 );
		let ret;

		elements.forEach( el => {
			if ( 'object' === typeof opt || 'undefined' === typeof opt ) {
				el.slick = new Slick( el, opt );
			} else {
				ret = el.slick[ opt ].apply( el.slick, args );
			}
		});

		if ( 'undefined' !== typeof ret ) return ret;
		if ( selector instanceof Element ) return selector.slick;
		return elements;
	};
})();
