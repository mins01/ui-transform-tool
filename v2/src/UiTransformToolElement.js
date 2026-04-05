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
        return [ 'width', 'height', 'left', 'top', ];
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

    #left=0;
    #top=0;
    #width=0;
    #height=0;
    #rotation=0; //deg
    zoom=1;

    #rotation0=null;
    #left0=null;
    #top0=null;
    #x0=null;
    #y0=null;
    #rect=null;

    _transformType = null;
    _resizeType = null;

    /* =========================
     * getter / setter
     * ========================= */
    get left() { return this.#left; }
    get top() { return this.#top; }
    get width() { return this.#width; }
    get height() { return this.#height; }
    get rotation() { return this.#rotation; }
    set left(v) { this.#left = v; this._syncStyle(); }
    set top(v) { this.#top = v; this._syncStyle(); }
    set width(v) { this.#width = v; this._syncStyle(); }
    set height(v) { this.#height = v; this._syncStyle(); }
    set rotation(v) { this.#rotation = v; this._syncStyle(); }

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
        this._syncStyle();
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
        if(name==='left') this.#left = Number(newValue);
        if(name==='top') this.#top = Number(newValue);
        if(name==='width') this.#width = Number(newValue);
        if(name==='height') this.#height = Number(newValue);
    }

    /* =========================
     * public API
     * ========================= */

    moveTo(left, top) {
        this.#left = left;
        this.#top = top;
        this._syncStyle();
    }
    resizeTo(width, height) {
        this.#width = width;
        this.#height = height;
        this._syncStyle();
    }
    setRect(left, top, width, height) {
        this.#left = left;
        this.#top = top;
        this.#width = width;
        this.#height = height;
        this._syncStyle();
    }
    attachTo(element) {
        const {left,top,width,height} = element.getBoundingClientRect()
        this.setRect(left, top, width, height);
        this.dispatchEvent(new CustomEvent('transform-attach', { bubbles: true, cancelable: true ,detail: { attachedElement: element, }})); 
    }
    rotateTo(rotation) {
        this.#rotation = rotation;
        this._syncStyle();
    }
    /* =========================
     * internal utilities
     * ========================= */

    _syncStyle() {
        this.style.setProperty('--left', this.#left+'px');
        this.style.setProperty('--top', this.#top+'px');
        this.style.setProperty('--width', this.#width+'px');
        this.style.setProperty('--height', this.#height+'px');
        this.style.setProperty('--rotation', this.#rotation+'deg');
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
        if(target.dataset.rotate){
            this.rotateTo(0);
            this.dispatchEvent(new Event('transform-rotate', { bubbles: true, cancelable: true }));
            this.dispatchEvent(new Event('transform-update', { bubbles: true, cancelable: true }));
        }
    }
    
    #fixedWorld = null;
    #width0;
    #height0;
    handlePointerdown = (event) => {
        // const eventElement = event.composedPath()[0]; // 최초 이벤트 발생 요소 지정
        const target = event.target; // 최초 이벤트 발생 요소 지정
        target.addEventListener('pointermove', this.handlePointermove);
        target.setPointerCapture(event.pointerId);

        if(!target){
            return;
        }else if(target.dataset.move){
            this._transformType = 'move'
            this.#left0 = this.#left;
            this.#top0 = this.#top;
            this.#x0 = event.clientX;
            this.#y0 = event.clientY;
        }else if(target.dataset.rotate){
            this._transformType = 'rotate'
            this.#rotation0 = this.#rotation;
            this.#x0 = this.#left+this.#width/2;
            this.#y0 = this.#top+this.#height/2;
        }else if(target.dataset.resize){
            this._transformType = 'resize';
            this._resizeType = target.dataset.resize;

            this.#rotation0 = this.#rotation;

            this.#left0 = this.#left;
            this.#top0 = this.#top;
            this.#width0 = this.#width;
            this.#height0 = this.#height;

            const cx = this.#left + this.#width / 2;
            const cy = this.#top  + this.#height / 2;

            // 고정점 (반대편 코너)
            let fx, fy;
            switch (this._resizeType) {
                case "se": fx = this.#left; fy = this.#top; break;
                case "nw": fx = this.#left + this.#width; fy = this.#top + this.#height; break;
                case "ne": fx = this.#left; fy = this.#top + this.#height; break;
                case "sw": fx = this.#left + this.#width; fy = this.#top; break;
                case "n": fx = this.#left + this.#width / 2; fy = this.#top + this.#height; break;
                case "s": fx = this.#left + this.#width / 2; fy = this.#top; break;
                case "w": fx = this.#left + this.#width; fy = this.#top + this.#height / 2; break;
                case "e": fx = this.#left; fy = this.#top + this.#height / 2; break;
            }

            // world 좌표로 고정 점 저장
            this.#fixedWorld = this.rotatePoint(fx, fy, cx, cy, this.#rotation);

            // 처음 클릭 위치. 사용 안할 듯
            this.#x0 = event.clientX;
            this.#y0 = event.clientY;

        }


        // this.#rect = this.getBoundingClientRect();

        this.dispatchEvent(new Event('transform-start', { bubbles: true, cancelable: true }));
    }

    handlePointermove = (event) => {
        const target = event.target; // 최초 이벤트 발생 요소 지정
        if (!target.hasPointerCapture(event.pointerId)) return;


        // 월드 좌표
        let x1 = event.clientX;
        let y1 = event.clientY;

        if(this._transformType==='move'){
            const left = this.#left0 + x1 - this.#x0;
            const top = this.#top0 + y1 - this.#y0;
            this.moveTo(left, top);
            this.dispatchEvent(new Event('transform-move', { bubbles: true, cancelable: true }));
            this.dispatchEvent(new Event('transform-update', { bubbles: true, cancelable: true }));
        }else if(this._transformType==='rotate'){
            const x1 = event.clientX;
            const y1 = event.clientY;
            const rad = Math.atan2(y1 - this.#y0, x1 - this.#x0);
            const rotation = ( rad * (180 / Math.PI) + 360 + 270) % 360; //+ 270 은 아래가 0deg가 되도록

            this.rotateTo(rotation);
            this.dispatchEvent(new Event('transform-rotate', { bubbles: true, cancelable: true }));
            this.dispatchEvent(new Event('transform-update', { bubbles: true, cancelable: true }));
        }else if(this._transformType==='resize'){
            // center를 매번 재계산
            const cx = (this.#fixedWorld.x + x1) / 2;
            const cy = (this.#fixedWorld.y + y1) / 2;

            // world → local (회전 제거)
            const fixed = this.rotatePoint(this.#fixedWorld.x, this.#fixedWorld.y, cx, cy, -this.#rotation0);
            const drag  = this.rotatePoint(x1, y1, cx, cy, -this.#rotation0);

            let left, top, width, height;

            switch (this._resizeType) {
                case "se":
                    left   = fixed.x;
                    top    = fixed.y;
                    width  = drag.x - fixed.x;
                    height = drag.y - fixed.y;
                    break;

                case "nw":
                    left   = drag.x;
                    top    = drag.y;
                    width  = fixed.x - drag.x;
                    height = fixed.y - drag.y;
                    break;

                case "ne":
                    left   = fixed.x;
                    top    = drag.y;
                    width  = drag.x - fixed.x;
                    height = fixed.y - drag.y;
                    break;

                case "sw":
                    left   = drag.x;
                    top    = fixed.y;
                    width  = fixed.x - drag.x;
                    height = drag.y - fixed.y;
                    break;
                // 🔥 엣지
                case "n":
                    left = fixed.x - (this.#width0 / 2);
                    top = drag.y;
                    width = this.#width0;
                    height = fixed.y - drag.y;
                    break;

                case "s":
                    left = fixed.x - (this.#width0 / 2);
                    top = fixed.y;
                    width = this.#width0;
                    height = drag.y - fixed.y;
                    break;

                case "w":
                    left = drag.x;
                    top = fixed.y - (this.#height0 / 2);
                    top = fixed.y;
                    width = fixed.x - drag.x;
                    height = this.#height0;
                    break;

                case "e":
                    left = fixed.x;
                    top = fixed.y - (this.#height0 / 2);
                    width = drag.x - fixed.x;
                    height = this.#height0;
                    break;
            }

            // 🔥 음수 방지 (뒤집힘 대응)
            if (width < 0) {
                left += width;
                width *= -1;
            }

            if (height < 0) {
                top += height;
                height *= -1;
            }


            this.setRect(left, top, width, height);

            this.dispatchEvent(new Event('transform-resize', { bubbles: true, cancelable: true }));
            this.dispatchEvent(new Event('transform-update', { bubbles: true, cancelable: true }));
        }

    }

    handlePointerup = (event) => {
        const target = event.target; // 최초 이벤트 발생 요소 지정

        target.removeEventListener('pointermove', this.handlePointermove);
        target.releasePointerCapture(event.pointerId);

        this.#left0 = null;
        this.#top0 = null;
        this.#x0 = null;
        this.#y0 = null;
        this.#rotation0 = null;

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