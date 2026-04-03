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
        return [];
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

    left=0;
    top=0;
    width=0;
    height=0;
    rotation=0; //deg
    zoom=1;

    #left0=0;
    #top0=0;
    #x0=null;
    #y0=null;
    #rect=null;

    _transformType = null;
    _resizeType = null;

    /* =========================
     * getter / setter
     * ========================= */


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
        this.addEventListener('pointerdown', this.handlePointerdown);
        this.addEventListener('pointerup', this.handlePointerup);
        this.addEventListener('pointercancel', this.handlePointercancel);
    }

    disconnectedCallback() {
        this.removeEventListener('pointerdown', this.handlePointerdown);
        this.removeEventListener('pointerup', this.handlePointerup);
        this.removeEventListener('pointercancel', this.handlePointercancel);
    }

    /* =========================
     * attribute
     * ========================= */

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
    }

    /* =========================
     * public API
     * ========================= */

    moveTo(left, top) {
        this.left = left;
        this.top = top;
        this._syncStyle();
    }
    resizeTo(width, height) {
        this.width = width;
        this.height = height;
        this._syncStyle();
    }
    setRect(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this._syncStyle();
    }
    /* =========================
     * internal utilities
     * ========================= */

    _syncStyle() {
        this.style.setProperty('--left', this.left+'px');
        this.style.setProperty('--top', this.top+'px');
        this.style.setProperty('--width', this.width+'px');
        this.style.setProperty('--height', this.height+'px');
        // this.style.setProperty('--rotation', this.rotation+'deg');
        // this.style.setProperty('--zoom', this.zoom);
    }

    /* =========================
     * pointer events
     * ========================= */

    handlePointerdown(event) {
        this.addEventListener('pointermove', this.handlePointermove);
        this.setPointerCapture(event.pointerId);

        const eventElement = event.composedPath()[0]; // 최초 이벤트 발생 요소 지정
        console.log(eventElement);
        
        if(eventElement.dataset.move){
            this._transformType = 'move'
            this.#left0 = this.left;
            this.#top0 = this.top;
            this.#x0 = event.clientX;
            this.#y0 = event.clientY;
        }else if(eventElement.dataset.resize){
            this._transformType = 'resize';
            this._resizeType = eventElement.dataset.resize;
            this.#y0 = null;
            this.#y0 = null;
            if(this._resizeType.includes('s')){
                this.#y0 = this.top;
            }
            if(this._resizeType.includes('n')){
                this.#y0 = this.top+this.height;
            }
            if(this._resizeType.includes('e')){
                this.#x0 = this.left;
            }
            if(this._resizeType.includes('w')){
                this.#x0 = this.left+this.width;
            }
        }

        
        // this.#rect = this.getBoundingClientRect();

        this.dispatchEvent(new Event('transform-start', { bubbles: true, cancelable: true }));
    }

    handlePointermove(event) {
        if (!this.hasPointerCapture(event.pointerId)) return;

        
        const x1 = event.clientX;
        const y1 = event.clientY;

        if(this._transformType==='move'){
            const left = this.#left0 + x1 - this.#x0;
            const top = this.#top0 + y1 - this.#y0;
            console.log(this.#left0,left,x1 - this.#x0);
            this.moveTo(left, top);
        }else if(this._transformType==='resize'){

            const left = this.#x0==null?this.left:Math.min(this.#x0, x1);
            const top  = this.#y0==null?this.top:Math.min(this.#y0, y1);
            const width = this.#x0==null?this.width:Math.abs(this.#x0 - x1);
            const height = this.#y0==null?this.height:Math.abs(this.#y0 - y1);
            this.setRect(left, top,width, height);
            
            

            
        }


        this.dispatchEvent(new Event('transform-move', { bubbles: true, cancelable: true }));
    }

    handlePointerup(event) {
        this.removeEventListener('pointermove', this.handlePointermove);
        this.releasePointerCapture(event.pointerId);
        
        this.#left0 = null;
        this.#top0 = null;
        this.#x0 = null;
        this.#y0 = null;

        this.dispatchEvent(new Event('transform-end', { bubbles: true, cancelable: true }));
    }

    handlePointercancel(event) {
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
                    width: var(--width,0);
                    height: var(--height,0);
                    pointer-events: none;                
                }
                :host::part(wapper){
                    pointer-events: none;      
                    position: absolute;
                    inset: 0;
                }
                :host::part(border){
                    pointer-events: none;                
                    border:1px dashed #000;
                    position: absolute;
                    inset:calc(-1px / 2);
                }                    
                :host::part(handles){
                    pointer-events: all;                
                    position: absolute;
                    inset: 0;
                }
                :host::part(resize-handle){
                    aspect-ratio: 1 / 1;
                    width:8px;
                    border: 1px solid #000;
                    box-sizing: border-box;
                    position: absolute;
                    
                    contain: strict;
                    overflow: hidden;
                    background-color: #fff;
                    pointer-events: all;
                    transform: translate(-50%, -50%);
                }
                :host::part(resize-handle-nw){
                    left:0;top:0;
                }
                :host::part(resize-handle-n){
                    left:50%;top:0;
                }
                :host::part(resize-handle-ne){
                    left:100%;top:0;
                }
                :host::part(resize-handle-w){
                    left:0;top:50%;
                }
                :host::part(resize-handle-c){
                    left:50%;top:50%;
                    display: none;
                }
                :host::part(resize-handle-e){
                    left:100%;top:50%;
                }
                :host::part(resize-handle-sw){
                    left:0;top:100%;
                }
                :host::part(resize-handle-s){
                    left:50%;top:100%;
                }
                :host::part(resize-handle-se){
                    left:100%;top:100%;
                }

            </style>
            ${this.constructor.appendStyle}
            <div part="wapper">
                <div part="border"></div>
                <div part="handles" data-move="move">
                    <div part="resize-handle resize-handle-nw" class="resize-handle" data-resize="nw">00</div>
                    <div part="resize-handle resize-handle-n" class="resize-handle" data-resize="n">01</div>
                    <div part="resize-handle resize-handle-ne" class="resize-handle" data-resize="ne">02</div>
                    <div part="resize-handle resize-handle-w" class="resize-handle" data-resize="w">10</div>
                    <div part="resize-handle resize-handle-c" class="resize-handle" data-move="move">11</div>
                    <div part="resize-handle resize-handle-e" class="resize-handle" data-resize="e">12</div>
                    <div part="resize-handle resize-handle-sw" class="resize-handle" data-resize="sw">20</div>
                    <div part="resize-handle resize-handle-s" class="resize-handle" data-resize="s">21</div>
                    <div part="resize-handle resize-handle-se" class="resize-handle" data-resize="se">22</div>
                </div>
                

                <slot></slot>
            </div>
        `;
    }
}