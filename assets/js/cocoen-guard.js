/* cocoen-guard.js
 * Non-invasive guard to avoid vendor touch handlers blocking vertical scroll.
 * Strategy: attach capture-phase touch/pointer listeners; detect gesture direction
 * on touches that start inside a .cocoen element. If the gesture is vertical,
 * temporarily disable pointer-events on that .cocoen so vendor touch handlers
 * won't receive the events and the page may scroll normally.
 */
(function (){
    'use strict';

    var THRESHOLD = 8; // pixels

    var active = null; // the active .cocoen element for the current pointer/touch
    var startX = 0, startY = 0;
    var locked = false, isHorizontal = false;

    function findCocoen(el){
        while(el && el !== document.documentElement){
            if (el.classList && el.classList.contains('cocoen')) return el;
            el = el.parentNode;
        }
        return null;
    }

    function onTouchStart(e){
        // only single-finger
        if (e.touches && e.touches.length > 1) return;
        var target = (e.touches && e.touches[0] && e.touches[0].target) || e.target;
        var fig = findCocoen(target);
        if (!fig) return;

        active = fig;
        startX = (e.touches && e.touches[0]) ? e.touches[0].clientX : (e.clientX || 0);
        startY = (e.touches && e.touches[0]) ? e.touches[0].clientY : (e.clientY || 0);
        locked = false;
        isHorizontal = false;
    }

    function onTouchMove(e){
        if (!active) return;
        // ignore multi-touch
        if (e.touches && e.touches.length > 1) return;

        var curX = (e.touches && e.touches[0]) ? e.touches[0].clientX : (e.clientX || 0);
        var curY = (e.touches && e.touches[0]) ? e.touches[0].clientY : (e.clientY || 0);
        var dx = curX - startX;
        var dy = curY - startY;
        var adx = Math.abs(dx);
        var ady = Math.abs(dy);

        if (!locked){
            if (adx > THRESHOLD || ady > THRESHOLD){
                locked = true;
                isHorizontal = adx > ady;
            } else {
                return;
            }
        }

        if (locked && !isHorizontal){
            // vertical gesture -> disable pointer events on the active cocoen so vendor handlers won't catch the events
            try{ active.style.pointerEvents = 'none'; }
            catch(err){}
        } else if (locked && isHorizontal){
            // horizontal gesture -> ensure vendor can handle events
            try{ active.style.pointerEvents = 'auto'; }
            catch(err){}
        }
    }

    function clear(){
        if (active){
            try{ active.style.pointerEvents = ''; }
            catch(err){}
        }
        active = null;
        startX = startY = 0;
        locked = false; isHorizontal = false;
    }

    // Capture-phase listeners so this runs before vendor handlers attached in bubble phase
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    document.addEventListener('touchend', clear, { passive: true, capture: true });
    document.addEventListener('touchcancel', clear, { passive: true, capture: true });

    // Also support pointer events (some browsers / frameworks use pointer events instead)
    document.addEventListener('pointerdown', function(e){
        if (e.pointerType !== 'touch') return;
        var fig = findCocoen(e.target);
        if (!fig) return;
        active = fig;
        startX = e.clientX; startY = e.clientY;
        locked = false; isHorizontal = false;
    }, true);

    document.addEventListener('pointermove', function(e){
        if (!active || e.pointerType !== 'touch') return;
        var dx = e.clientX - startX; var dy = e.clientY - startY;
        var adx = Math.abs(dx); var ady = Math.abs(dy);
        if (!locked){
            if (adx > THRESHOLD || ady > THRESHOLD){
                locked = true;
                isHorizontal = adx > ady;
            } else return;
        }
        if (locked && !isHorizontal){
            try{ active.style.pointerEvents = 'none'; }catch(err){}
        } else if (locked && isHorizontal){
            try{ active.style.pointerEvents = 'auto'; }catch(err){}
        }
    }, true);

    document.addEventListener('pointerup', clear, true);
    document.addEventListener('pointercancel', clear, true);

})();
