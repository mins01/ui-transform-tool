class UiTransformToolElement extends HTMLElement{

    static get observedAttributes() { 
        return ['width', 'height','minwidth','minheight','maxwidth','maxheight', 'left', 'top', 'active' ,'disabled' , 'class']; 
    }


    static defineCustomElements(name='ui-transform-tool'){
        if(!globalThis.window){return;}
        window.customElements.define(name, this);
    }
    static cssHtml = `<link rel="stylesheet" href="../asset/ui-transform-tool-shadowdom.css">`
    static contentHtml = `
        <div class="container">
            <div class="wrap">
                <slot name="body"><div class="body"></div></slot>
                <slot name="dot-00"><div class="dot" data-dot="00"></div></slot>
                <slot name="dot-01"><div class="dot" data-dot="01"></div></slot>
                <slot name="dot-02"><div class="dot" data-dot="02"></div></slot>
                <slot name="dot-10"><div class="dot" data-dot="10"></div></slot>
                <slot name="dot-11"><div class="dot" data-dot="11"></div></slot>
                <slot name="dot-12"><div class="dot" data-dot="12"></div></slot>
                <slot name="dot-20"><div class="dot" data-dot="20"></div></slot>
                <slot name="dot-21"><div class="dot" data-dot="21"></div></slot>
                <slot name="dot-22"><div class="dot" data-dot="22"></div></slot>                
            </div>
        </div>
    `;

    constructor(){
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = this.constructor.cssHtml + this.constructor.contentHtml;
        this.container = this.shadowRoot.querySelector('.container');
        
        this.layoutInfo = null;
        this.eventElement = null;
        this.eventElementType = null;
        this.x0 = null;
        this.y0 = null;
        this.x1 = null;
        this.y1 = null;
        this.distanceX = null;
        this.distanceY = null;
    }
    connectedCallback(){
        this.initEvent();
    }
    disconnectedCallback(){

    }
    adoptedCallback(){

    }
    attributeChangedCallback(){
        // console.log(this.width,this.height,this.left,this.top);
        this.style.width = this.width+'px';
        this.style.height = this.height+'px';
        this.style.left = this.left+'px';
        this.style.top = this.top+'px';
        this.style.minWidth = (this.minwidth===null)?'none':this.minwidth+'px';
        this.style.minHeight = (this.minheight===null)?'none':this.minheight+'px';
        this.style.maxWidth = (this.maxwidth===null)?'none':this.maxwidth+'px';
        this.style.maxHeight = (this.maxheight===null)?'none':this.maxheight+'px';
        
        
        this.container.className = 'container '+this.className;
    }

    //----------
    static active(tool=null){
        document.querySelectorAll('ui-transform-tool').forEach(el=>{
            el.classList.remove('active');
        })
        if(tool && !tool.disabled) tool.classList.add('active');
    }
    active(){
        this.constructor.active(this)
    }

    //-----------
    get disabled(){ return this.hasAttribute('disabled')?true:false }
    set disabled(v){ 
        if(v){
            this.setAttribute('disabled','disabled')
        }else{
            this.removeAttribute('disabled')
        }
    }
    get width(){ return parseFloat(this.getAttribute('width')??100); }
    set width(v){ this.setAttribute('width',v)}
    get minwidth(){ return this.getAttribute('minwidth'); }
    set minwidth(v){ this.setAttribute('minwidth',v)}
    get minheight(){ return this.getAttribute('minheight'); }
    set minheight(v){ this.setAttribute('minheight',v)}
    get maxwidth(){ return this.getAttribute('maxwidth'); }
    set maxwidth(v){ this.setAttribute('maxwidth',v)}
    get maxheight(){ return this.getAttribute('maxheight'); }
    set maxheight(v){ this.setAttribute('maxheight',v)}
    get height(){ return parseFloat(this.getAttribute('height')??100); }
    set height(v){ this.setAttribute('height',v)}
    get left(){ return parseFloat(this.getAttribute('left')??0); }
    set left(v){ this.setAttribute('left',v)}
    get top(){ return parseFloat(this.getAttribute('top')??0); }
    set top(v){ this.setAttribute('top',v)}



    /**
     * 엘레멘트의 위치와 크기 정보
     *
     * @param {HTMLElement} element
     * @returns {{ width: Number; height: Number; left: Number; top: Number; minWidth: Number; minHeight: Number; maxWidth: Number; maxHeight: Number; }}
     */
    static getLayoutInfo(element){
        const cs = getComputedStyle(element);
        // console.log(cs.minHeight);
        
        const minWidth = parseFloat(cs.minWidth);
        const minHeight = parseFloat(cs.minHeight);
        const maxWidth = parseFloat(cs.maxWidth);
        const maxHeight = parseFloat(cs.maxHeight);

        return {
            width:parseFloat(cs.width),
            height:parseFloat(cs.height),
            left:parseFloat(cs.left),
            top:parseFloat(cs.top),
            minWidth:Number.isFinite(minWidth)?minWidth:-Infinity,
            minHeight:Number.isFinite(minHeight)?minHeight:-Infinity,
            maxWidth:Number.isFinite(maxWidth)?maxWidth:Infinity,
            maxHeight:Number.isFinite(maxHeight)?maxHeight:Infinity
        }
    }
    getLayoutInfo(element){
        return this.constructor.getLayoutInfo(element);
    }





    /**
     * 이벤트 처리부분 시작
     */


    initEvent(){
        this.addEventListener('pointerdown',this.down)
    }

    /**
     * pointerdown 이벤트 처리
     *
     * @param {*} event
     */
    down=(event)=>{
        console.log(this.disabled);
        
        if(this.disabled){return; }
        // this.eventElement = event.target;
        this.eventElement = event.composedPath()[0]; // 최초 이벤트 발생 요소 지정
        if(this.eventElement.classList.contains('dot')){
            this.eventElementType = 'dot'
        }else if(this.eventElement.classList.contains('body')){
            this.eventElementType = 'body'
        }else{
            this.eventElementType = null;
        }
        
        this.setPointerCapture(event.pointerId);
        document.addEventListener('pointermove',this.move);       
        document.addEventListener('pointerup',this.up);
        this.#ondown(event);
        
    }
    move=(event)=>{
        this.#onmove(event);
    }
    up=(event)=>{
        this.#onup(event);
        document.removeEventListener('pointermove',this.move);
        document.removeEventListener('pointerup',this.up);
        this.releasePointerCapture(event.pointerId);
    }

    #ondown(event){
        if(!this.eventElement){ return false; }
        event.preventDefault();
        event.stopPropagation();
        // event.stopImmediatePropagation();
        this.layoutInfo0 = this.getLayoutInfo(this);
        this.x0 = event.x;
        this.y0 = event.y;
        this.x1 = event.x;
        this.y1 = event.y;
        this.distanceX = this.x1 - this.x0;
        this.distanceY = this.y1 - this.y0;
        // let dot = this.eventElement.dataset.dot;
        
        this.ondown(event);
        if(this.eventElementType =='dot'){
            this.#ondownForResize(event);
            this.ondownDot(event);
        }else if(this.eventElementType =='body'){
            this.#ondownForMove(event);
            this.ondownBody(event);
        }
    }
    #onmove(event){
        if(!this.eventElement){return false;}
        event.preventDefault();
        event.stopPropagation();
        // event.stopImmediatePropagation();
        this.x1 = event.x;
        this.y1 = event.y;
        this.distanceX = this.x1 - this.x0;
        this.distanceY = this.y1 - this.y0;
        // let dot = this.eventElement.dataset.dot;
        this.onmove(event);
        if(this.eventElementType =='dot'){
            this.#onmoveForResize(event);
            this.onmoveDot(event);
        }else if(this.eventElementType =='body'){
            this.#onmoveForMove(event);
            this.onmoveBody(event);
        }
    }
    #onup(event){
        if(!this.eventElement){return false;}
        event.preventDefault();
        event.stopPropagation();
        // event.stopImmediatePropagation();
        // let dot = this.eventElement.dataset.dot;
        
        this.onup(event);
        if(this.eventElementType =='dot'){
            this.#onupForResize(event);
            this.onupDot(event);
        }else if(this.eventElementType =='body'){
            this.#onupForMove();
            this.onupBody(event);
        }

        this.eventElement = null;
        this.eventElementType = null;
        this.x0 = null;
        this.y0 = null;
        this.x1 = null;
        this.y1 = null;
        this.distanceX = null;
        this.distanceY = null;
    }

    #ondownForMove(event){

    }
    #onmoveForMove(event){
        this.left = this.layoutInfo0.left + this.distanceX;
        this.top = this.layoutInfo0.top + this.distanceY;
    }
    #onupForMove(event){

    }

    #ondownForResize(event){

    }
    #onmoveForResize(event){
        const dot = this.eventElement.dataset.dot;
        if(!dot){ return; }
        const dotV = dot[0];
        const dotH = dot[1];

        if(dotH=="0"){
            let distanceX = this.distanceX;
            let width = this.layoutInfo0.width + (distanceX * -1);
            width = Math.max(this.layoutInfo0.minWidth,Math.min(width,this.layoutInfo0.maxWidth),0);
            this.distanceX = distanceX = this.layoutInfo0.width - width;
            this.width = width;
            this.left = this.layoutInfo0.left + distanceX;
            
        }else if(dotH=="1"){
        }else if(dotH=='2'){
            let width = this.layoutInfo0.width + this.distanceX;
            width = Math.max(this.layoutInfo0.minWidth,Math.min(width,this.layoutInfo0.maxWidth),0);
            this.width = width;
        }
        if(dotV=="0"){

            let distanceY = this.distanceY;
            let height = this.layoutInfo0.height + (distanceY * -1);

            height = Math.max(this.layoutInfo0.minHeight,Math.min(height,this.layoutInfo0.maxHeight),0);
            this.distanceY = distanceY = this.layoutInfo0.height - height;
            this.height = height;
            this.top = this.layoutInfo0.top + distanceY;

        }else if(dotV=="1"){
        }else if(dotV=="2"){
            let height = this.layoutInfo0.height + this.distanceY;
            height = Math.max(this.layoutInfo0.minHeight,Math.min(height,this.layoutInfo0.maxHeight),0);
            this.height = height;

        }
    }
    #onupForResize(event){

    }


    ondown(event){}
    onmove(event){}
    onup(event){}

    ondownBody(event){}
    onmoveBody(event){}
    onupBody(event){}

    ondownDot(event){}
    onmoveDot(event){}
    onupDot(event){}
}