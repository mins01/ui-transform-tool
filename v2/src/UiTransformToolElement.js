export default class UiColorBarElement extends HTMLElement {

    /* =========================
     * static
     * ========================= */

    /** 커스텀 엘리먼트 태그명 */
    static tagName = 'ui-transform-tool';



    // 스타일 확장
    static prependStyle = `<style>

            </style>`; // 값 초기화 등
    static appendStyle = `<style></style>`; // 커스텀 스타일 등

    /** 감시할 속성 목록 */
    static get observedAttributes() {
        return ['width', 'height', 'left', 'top',];
    }

    /** 커스텀 엘리먼트 등록 */
    static defineCustomElement(tagName = this.tagName) {
        if (!customElements.get(tagName)) {
            customElements.define(tagName, this);
            console.log('defineCustomElement', tagName);
        }
    }

    /* =========================
     * fields
     * ========================= */

    _left = 0;
    _top = 0;
    _width = 0;
    _height = 0;
    _rotation = 0; //deg
    zoom = 1;

    _rotation0 = null;
    _left0 = null;
    _top0 = null;
    _x0 = null;
    _y0 = null;
    _rect = null;

    _transformType = null;
    _resizeType = null;

    /* =========================
     * getter / setter
     * ========================= */
    get left() { return this._left; }
    get top() { return this._top; }
    get width() { return this._width; }
    get height() { return this._height; }
    get rotation() { return this._rotation; }
    set left(v) { this._left = v; this.applyStyle(); }
    set top(v) { this._top = v; this.applyStyle(); }
    set width(v) { this._width = v; this.applyStyle(); }
    set height(v) { this._height = v; this.applyStyle(); }
    set rotation(v) { this._rotation = v; this.applyStyle(); }

    /* =========================
     * constructor
     * ========================= */

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /* =========================
     * lifecycle
     * ========================= */

    connectedCallback() {
        if (!this.shadowRoot.firstChild) this.render();
        this.applyStyle();
        const wapper = this.shadowRoot.querySelector('.wapper') //this가 아니라 내부 요소로 해야 event.target이 내부 요소로 나온다.
        wapper.addEventListener('dblclick', this.handleDblclick);
        wapper.addEventListener('pointerdown', this.handlePointerdown);
        wapper.addEventListener('pointerup', this.handlePointerup);
        wapper.addEventListener('pointercancel', this.handlePointercancel);
    }

    disconnectedCallback() {
        const wapper = this.shadowRoot.querySelector('.wapper')
        wapper.removeEventListener('dblclick', this.handleDblclick);
        wapper.removeEventListener('pointerdown', this.handlePointerdown);
        wapper.removeEventListener('pointerup', this.handlePointerup);
        wapper.removeEventListener('pointercancel', this.handlePointercancel);
    }

    /* =========================
     * attribute
     * ========================= */

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'left') this._left = Number(newValue);
        if (name === 'top') this._top = Number(newValue);
        if (name === 'width') this._width = Number(newValue);
        if (name === 'height') this._height = Number(newValue);
    }

    /* =========================
     * public API
     * ========================= */

    moveTo(left, top) {
        this._left = left;
        this._top = top;
        this.applyStyle();
    }
    resizeTo(width, height) {
        this._width = width;
        this._height = height;
        this.applyStyle();
    }
    setRect(left, top, width, height, rotation=null) {
        this._left = left;
        this._top = top;
        this._width = width;
        this._height = height;
        if(rotation!=null) this._rotation = rotation
        this.applyStyle();
    }
    target = null;
    setTarget(target) {
        if(this.target){
            this.removeEventListener('transform-update', this.handleTansformUpdate);    
        }
        this.target = target
        if(target){
            const { left, top, width, height, rotation } = this.getRectFromStyle(target);
            // console.log({ left, top, width, height, rotation });
            
            this.setRect(left, top, width, height, rotation);           
            this.addEventListener('transform-update', this.handleTansformUpdate);
        }
        this.target = target
        this.dispatchEvent(new CustomEvent('transform-target-change', { bubbles: true, cancelable: true, detail: { target: target, } }));
    }
    handleTansformUpdate = (event) => {
        const target = this.target
        this.applyStyle(target);

        const { left, top, width, height, rotation } = this.getRectFromStyle(target);
        console.log({ left, top, width, height, rotation });

        this.setRect(left, top, width, height, rotation); 

    }
    syncTo(target) {
        this.applyStyle(target)
    }
    rotateTo(rotation) {
        this._rotation = rotation;
        this.applyStyle();
    }
    /* =========================
     * internal utilities
     * ========================= */

    getRectFromStyle(target) {
        const style = window.getComputedStyle(target);
        const position = style.getPropertyValue('position');
        if(position==='static') return { 
            left: target.offsetLeft,
            top: target.offsetTop,
            width: parseFloat( style.getPropertyValue('--width')!=='' ? style.getPropertyValue('--width') : style.getPropertyValue('width') ),
            height: parseFloat( style.getPropertyValue('--height')!=='' ? style.getPropertyValue('--height') : style.getPropertyValue('height') ),
            rotation: parseFloat( style.getPropertyValue('--rotation')!=='' ? style.getPropertyValue('--rotation') : 0 ),
        };
        return {
            left: parseFloat( style.getPropertyValue('--left')!=='' ? style.getPropertyValue('--left') : style.getPropertyValue('left') ),
            top: parseFloat( style.getPropertyValue('--top')!=='' ? style.getPropertyValue('--top') : style.getPropertyValue('top') ),
            width: parseFloat( style.getPropertyValue('--width')!=='' ? style.getPropertyValue('--width') : style.getPropertyValue('width') ),
            height: parseFloat( style.getPropertyValue('--height')!=='' ? style.getPropertyValue('--height') : style.getPropertyValue('height') ),
            rotation: parseFloat( style.getPropertyValue('--rotation')!=='' ? style.getPropertyValue('--rotation') : 0 ),
        };
    }
    applyStyle(target=this) {
        target.style.setProperty('--left', this._left + 'px');
        target.style.setProperty('--top', this._top + 'px');
        target.style.setProperty('--width', this._width + 'px');
        target.style.setProperty('--height', this._height + 'px');
        target.style.setProperty('--rotation', this._rotation + 'deg');
        // this.style.setProperty('--zoom', this.zoom);
    }

    rotatePoint(x, y, cx, cy, angle) {
        const rad = angle * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const dx = x - cx;
        const dy = y - cy;

        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos
        };
    }

    /* =========================
     * pointer events
     * ========================= */
    handleDblclick = (event) => {
        const target = event.target; // 최초 이벤트 발생 요소 지정
        if (target.dataset.rotate) {
            this.rotateTo(0);
            this.dispatchEvent(new Event('transform-rotate', { bubbles: true, cancelable: true }));
            this.dispatchEvent(new Event('transform-update', { bubbles: true, cancelable: true }));
        }
    }

    _fixedWorld = null;
    _width0;
    _height0;
    handlePointerdown = (event) => {
        // const eventElement = event.composedPath()[0]; // 최초 이벤트 발생 요소 지정
        const target = event.target; // 최초 이벤트 발생 요소 지정
        target.addEventListener('pointermove', this.handlePointermove);
        target.setPointerCapture(event.pointerId);

        if (!target) {
            return;
        } else if (target.dataset.move) {
            this._transformType = 'move'
            this._left0 = this._left;
            this._top0 = this._top;
            this._x0 = event.clientX;
            this._y0 = event.clientY;
        } else if (target.dataset.rotate) {
            this._transformType = 'rotate'
            this._rotation0 = this._rotation;
            this._x0 = this._left + this._width / 2;
            this._y0 = this._top + this._height / 2;
        } else if (target.dataset.resize) {
            this._handlePointerdownForResize(event);
        }


        // this._rect = this.getBoundingClientRect();

        this.dispatchEvent(new Event('transform-start', { bubbles: true, cancelable: true }));
    }
    _handlePointerdownForResize(event) {
        this._transformType = 'resize';
        this._resizeType = event.target.dataset.resize;

        this._rotation0 = this._rotation;

        this._left0 = this._left;
        this._top0 = this._top;
        this._width0 = this._width;
        this._height0 = this._height;

        // 🔥 회전 기준 center (고정)
        this._cx0 = this._left + this._width / 2;
        this._cy0 = this._top + this._height / 2;

        // 🔥 anchor를 local 좌표로 저장
        this._anchorLocal = this._getAnchorLocal(this._resizeType);

        // 🔥 시작 포인터도 local
        this._startLocal = this._toLocal(event.clientX, event.clientY);
    }

    handlePointermove = (event) => {
        const target = event.target; // 최초 이벤트 발생 요소 지정
        if (!target.hasPointerCapture(event.pointerId)) return;


        // 월드 좌표


        if (this._transformType === 'move') {
            const x1 = event.clientX;
            const y1 = event.clientY;
            const left = this._left0 + x1 - this._x0;
            const top = this._top0 + y1 - this._y0;
            this.moveTo(left, top);
            this.dispatchEvent(new Event('transform-move', { bubbles: true, cancelable: true }));
            this.dispatchEvent(new Event('transform-update', { bubbles: true, cancelable: true }));
        } else if (this._transformType === 'rotate') {
            const x1 = event.clientX;
            const y1 = event.clientY;
            const rad = Math.atan2(y1 - this._y0, x1 - this._x0);
            const rotation = (rad * (180 / Math.PI) + 360 + 270) % 360; //+ 270 은 아래가 0deg가 되도록

            this.rotateTo(rotation);
            this.dispatchEvent(new Event('transform-rotate', { bubbles: true, cancelable: true }));
            this.dispatchEvent(new Event('transform-update', { bubbles: true, cancelable: true }));
        } else if (this._transformType === 'resize') {
            this._handlePointermoveForResize(event);
            this.dispatchEvent(new Event('transform-resize', { bubbles: true, cancelable: true }));
            this.dispatchEvent(new Event('transform-update', { bubbles: true, cancelable: true }));
        }

    }

    _toLocal(x, y) {
        const rad = -this._rotation0 * Math.PI / 180;

        const dx = x - this._cx0;
        const dy = y - this._cy0;

        return {
            x: dx * Math.cos(rad) - dy * Math.sin(rad),
            y: dx * Math.sin(rad) + dy * Math.cos(rad),
        };
    }

    _getAnchorLocal(type) {
        const w = this._width0;
        const h = this._height0;

        switch (type) {
            case "se": return { x: -w / 2, y: -h / 2 };
            case "nw": return { x: w / 2, y: h / 2 };
            case "ne": return { x: -w / 2, y: h / 2 };
            case "sw": return { x: w / 2, y: -h / 2 };

            case "n": return { x: 0, y: h / 2 };
            case "s": return { x: 0, y: -h / 2 };
            case "w": return { x: w / 2, y: 0 };
            case "e": return { x: -w / 2, y: 0 };
        }
    }

    _handlePointermoveForResize(event) {
        const p = this._toLocal(event.clientX, event.clientY);

        let left, right, top, bottom;

        const w0 = this._width0;
        const h0 = this._height0;

        const hw = w0 / 2;
        const hh = h0 / 2;

        switch (this._resizeType) {

            // 🔥 corner (기존 방식 유지)
            case "se":
            case "nw":
            case "ne":
            case "sw": {
                const a = this._anchorLocal;

                left = Math.min(a.x, p.x);
                right = Math.max(a.x, p.x);
                top = Math.min(a.y, p.y);
                bottom = Math.max(a.y, p.y);
                break;
            }

            // 🔥 edge (완전히 다르게 처리)

            case "n":
                left = -hw;
                right = hw;
                bottom = hh;
                top = p.y;
                break;

            case "s":
                left = -hw;
                right = hw;
                top = -hh;
                bottom = p.y;
                break;

            case "w":
                top = -hh;
                bottom = hh;
                right = hw;
                left = p.x;
                break;

            case "e":
                top = -hh;
                bottom = hh;
                left = -hw;
                right = p.x;
                break;
        }

        // 🔥 width/height
        let width = right - left;
        let height = bottom - top;

        // 🔥 center (local)
        const cxLocal = (left + right) / 2;
        const cyLocal = (top + bottom) / 2;

        // 🔥 world 변환
        const rad = this._rotation0 * Math.PI / 180;

        const cxWorld =
            this._cx0 +
            cxLocal * Math.cos(rad) -
            cyLocal * Math.sin(rad);

        const cyWorld =
            this._cy0 +
            cxLocal * Math.sin(rad) +
            cyLocal * Math.cos(rad);

        const newLeft = cxWorld - width / 2;
        const newTop = cyWorld - height / 2;

        this.setRect(newLeft, newTop, width, height);
    }

    handlePointerup = (event) => {
        const target = event.target; // 최초 이벤트 발생 요소 지정

        target.removeEventListener('pointermove', this.handlePointermove);
        target.releasePointerCapture(event.pointerId);

        this._left0 = null;
        this._top0 = null;
        this._x0 = null;
        this._y0 = null;
        this._rotation0 = null;

        this.dispatchEvent(new Event('transform-end', { bubbles: true, cancelable: true }));
    }

    handlePointercancel = (event) => {
        return this.handlePointerup(event);
    }

    /* =========================
     * primitive / serialization
     * ========================= */

    // [Symbol.toPrimitive](hint) {
    //     if (hint === 'number') return this.value;
    //     if (hint === 'string') return this.value.toString(10);
    //     return this.value;
    // }

    // toJSON() {
    //     return { value: this._value };
    // }

    /* =========================
     * render
     * ========================= */

    render() {
        this.shadowRoot.innerHTML = `
            ${this.constructor.prependStyle}
            <style>
                :host {
                    user-select: none;
                    touch-action: none;
                    display: block;
                    min-width: 10px;
                    min-height: 10px;
                    position: fixed;
                    margin: 0;
                    padding: 0;
                    left: var(--left,0);
                    top: var(--top,0);
                    // left: 0;
                    // top: 0;
                    width: var(--width,0);
                    height: var(--height,0);
                    transform: rotate(var(--rotation,0deg));
                    // transform: translate(var(--left,0), var(--top,0)) rotate(var(--rotation,0deg));
                    pointer-events: none;
                }
                :host::part(wapper){
                    pointer-events: none;
                    position: absolute;
                    inset: 0;
                }
                :host::part(border){
                    pointer-events: none;
                    position: absolute;
                    // border:2px dashed #000;
                    // inset:calc(-1px / 2);
                    outline: 2px dashed #000;
                    inset:0;
                }
                :host::part(handles){
                    pointer-events: all;
                    position: absolute;
                    inset: 0;
                }
                :host .resize-handle{
                    z-index: 3;
                    pointer-events: all;
                    aspect-ratio: 1 / 1;
                    width:var(--handle-size,12px);
                    border: 1px solid #000;
                    box-sizing: border-box;
                    position: absolute;

                    contain: strict;
                    overflow: hidden;
                    background-color: #fff;
                    transform: translate(-50%, -50%);
                }
                :host .resize-handle[data-resize='nw']{
                    left:0;top:0;
                }
                :host .resize-handle[data-resize='n']{
                    left:50%;top:0;
                }
                :host .resize-handle[data-resize='ne']{
                    left:100%;top:0;
                }
                :host .resize-handle[data-resize='w']{
                    left:0;top:50%;
                }
                :host .resize-handle[data-resize='c']{
                    left:50%;top:50%;
                    display: none;
                }
                :host .resize-handle[data-resize='e']{
                    left:100%;top:50%;
                }
                :host .resize-handle[data-resize='sw']{
                    left:0;top:100%;
                }
                :host .resize-handle[data-resize='s']{
                    left:50%;top:100%;
                }
                :host .resize-handle[data-resize='se']{
                    left:100%;top:100%;
                }
                :host .rotate-handle-wrap{
                    z-index: 2;
                    position: absolute;
                    left: 50%;
                    top: 100%;
                    transform: translate(-50%, 0%);
                    bottom: -30px;
                    width: 0px;
                    border-right: 2px dashed #000;
                    box-sizing: content-box;
                }
                :host .rotate-handle{
                    border-radius: 100vmax;
                    pointer-events: all;
                    aspect-ratio: 1 / 1;
                    width:var(--handle-size,12px);
                    border: 1px solid #000;
                    box-sizing: border-box;
                    position: absolute;
                    bottom:0px;
                    left:50%;
                    contain: strict;
                    overflow: hidden;
                    background-color: #fff;
                    transform: translate(calc(-50% + 1px), 50%);
                }
            </style>
            ${this.constructor.appendStyle}
            <div part="wapper" class="wapper">
                <div part="border"></div>
                <div part="handles" data-move="move">
                    <div part="resize-handle resize-handle-c" class="resize-handle" data-resize="c" data-move="move"></div>

                    <div part="resize-handle resize-handle-nw" class="resize-handle" data-resize="nw"></div>
                    <div part="resize-handle resize-handle-n" class="resize-handle" data-resize="n"></div>
                    <div part="resize-handle resize-handle-ne" class="resize-handle" data-resize="ne"></div>
                    <div part="resize-handle resize-handle-w" class="resize-handle" data-resize="w"></div>

                    <div part="resize-handle resize-handle-e" class="resize-handle" data-resize="e"></div>
                    <div part="resize-handle resize-handle-sw" class="resize-handle" data-resize="sw"></div>
                    <div part="resize-handle resize-handle-s" class="resize-handle" data-resize="s"></div>
                    <div part="resize-handle resize-handle-se" class="resize-handle" data-resize="se"></div>
                    <div part="rotate-handle-wrap" class="rotate-handle-wrap">
                        <div part="rotate-handle" class="rotate-handle" data-rotate="rotate"></div>
                    </div>
                </div>


                <slot></slot>
            </div>
        `;
    }
}