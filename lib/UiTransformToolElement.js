class UiTransformToolElement extends HTMLElement{

    static get observedAttributes() { 
        return ['width', 'height','minwidth','minheight','maxwidth','maxheight', 'left', 'top', 'active','moveable','resizable' ,'disabled' , 'class', 'hide-thandle', 'hide-bbox']; 
    }


    static defineCustomElements(name='ui-transform-tool'){
        if(!globalThis.window){return;}
        window.customElements.define(name, this);
    }
    static cssHtml = `<link rel="stylesheet" href="../asset/ui-transform-tool-shadowdom.css">`
    static contentHtml = `
        <div class="container">
            <div class="wrap">
                <div part="bounding-box bbox" class="bounding-box bbox"></div>
                <div part="transform-handle transform-handle-00 thandle" class="transform-handle thandle" data-thandle="00"></div>
                <div part="transform-handle transform-handle-01 thandle" class="transform-handle thandle" data-thandle="01"></div>
                <div part="transform-handle transform-handle-02 thandle" class="transform-handle thandle" data-thandle="02"></div>
                <div part="transform-handle transform-handle-10 thandle" class="transform-handle thandle" data-thandle="10"></div>
                <div part="transform-handle transform-handle-11 thandle" class="transform-handle thandle" data-thandle="11"></div>
                <div part="transform-handle transform-handle-12 thandle" class="transform-handle thandle" data-thandle="12"></div>
                <div part="transform-handle transform-handle-20 thandle" class="transform-handle thandle" data-thandle="20"></div>
                <div part="transform-handle transform-handle-21 thandle" class="transform-handle thandle" data-thandle="21"></div>
                <div part="transform-handle transform-handle-22 thandle" class="transform-handle thandle" data-thandle="22"></div>
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
        this.running = null;
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

        if(this.disabled){ this.container.setAttribute('disabled','') }else{ this.container.removeAttribute('disabled') }
        if(this.moveable){ this.container.setAttribute('moveable','') }else{ this.container.removeAttribute('moveable') }
        if(this.resizable){ this.container.setAttribute('resizable','') }else{ this.container.removeAttribute('resizable') }
        if(this.active){ this.container.setAttribute('active','') }else{ this.container.removeAttribute('active') }
        if(this.hideResizer){ this.container.setAttribute('hide-thandle',this.hideResizer) }else{ this.container.removeAttribute('hide-thandle') }
        if(this.hideMover){ this.container.setAttribute('hide-bbox',this.hideResizer) }else{ this.container.removeAttribute('hide-bbox') }
    }

    //----------
    static activate(element=null){
        document.querySelectorAll('ui-transform-tool').forEach(el=>{
            el.active = false;
        })
        if(element && !element.disabled) element.active = true;
    }
    activate(){
        this.constructor.activate(this)
    }

    //-----------
    get disabled(){ return this.hasAttribute('disabled')?true:false }
    set disabled(v){ if(v){ this.setAttribute('disabled','') }else{ this.removeAttribute('disabled') } }
    get moveable(){ return this.hasAttribute('moveable')?true:false }
    set moveable(v){ if(v){ this.setAttribute('moveable','') }else{ this.removeAttribute('moveable') } }
    get resizable(){ return this.hasAttribute('resizable')?true:false }
    set resizable(v){ if(v){ this.setAttribute('resizable','') }else{ this.removeAttribute('resizable') } }
    get active(){ return this.hasAttribute('active')?true:false }
    set active(v){ if(v){ this.setAttribute('active',''); }else{ this.removeAttribute('active') } }

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

    get running(){ return this.getAttribute('running'); }
    set running(v){ if(v===null || v.length==0){ this.removeAttribute('running') }else{ this.setAttribute('running',v) } }

    get hideResizer(){ return this.getAttribute('hide-thandle'); }
    set hideResizer(v){ if(v===null || v.length==0){ this.removeAttribute('hide-thandle') }else{ this.setAttribute('hide-thandle',v) } }

    get hideMover(){ return this.getAttribute('hide-bbox'); }
    set hideMover(v){ if(v===null || v.length==0){ this.removeAttribute('hide-bbox') }else{ this.setAttribute('hide-bbox',v) } }

    get detail(){
        return {
            x0:this.x0,
            y0:this.y0,
            x1:this.x1,
            y1:this.y1,
            distanceX:this.distanceX,
            distanceY:this.distanceY
        }
    }


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
        this.container.addEventListener('pointerdown',this.down)
    }

    /**
     * pointerdown 이벤트 처리
     *
     * @param {*} event
     */
    down=(event)=>{
        // console.log(this.disabled);
        
        if(this.disabled){return; }
        // this.eventElement = event.target;
        this.eventElement = event.composedPath()[0]; // 최초 이벤트 발생 요소 지정
        if(this.eventElement.part.contains('thandle') && this.resizable){
            this.running = 'thandle'
            this.dataset.thandle = this.eventElement.dataset.thandle
        }else if(this.eventElement.part.contains('bbox') && this.moveable){
            this.running = 'bbox'
        }else{
            this.running = null;
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
        // event.stopPropagation();
        // event.stopImmediatePropagation();
        this.layoutInfo0 = this.getLayoutInfo(this);
        this.x0 = event.x;
        this.y0 = event.y;
        this.x1 = event.x;
        this.y1 = event.y;
        this.distanceX = this.x1 - this.x0;
        this.distanceY = this.y1 - this.y0;
        // let dot = this.eventElement.dataset.dot;
        
        if(this.running =='thandle' && this.resizable){
            this.#ondownForResize(event);
        }else if(this.running =='bbox' && this.moveable){
            this.#ondownForMove(event);
        }
        this.ondown(event);
    }
    #onmove(event){
        if(!this.eventElement){return false;}
        event.preventDefault();
        // event.stopPropagation();
        // event.stopImmediatePropagation();
        this.x1 = event.x;
        this.y1 = event.y;
        this.distanceX = this.x1 - this.x0;
        this.distanceY = this.y1 - this.y0;
        // let dot = this.eventElement.dataset.dot;
        if(this.running =='thandle' && this.resizable){
            this.#onmoveForResize(event);
        }else if(this.running =='bbox' && this.moveable){
            this.#onmoveForMove(event);
        }
        this.onmove(event);
    }
    #onup(event){
        if(!this.eventElement){return false;}
        event.preventDefault();
        // event.stopPropagation();
        // event.stopImmediatePropagation();
        // let dot = this.eventElement.dataset.dot;
        
        if(this.running =='thandle' && this.resizable){
            this.#onupForResize(event);
        }else if(this.running =='bbox' && this.moveable){
            this.#onupForMove(event);
        }
        this.onup(event);

        this.running = null;
        delete this.dataset.thandle
        // 초기화 하지 말자, 끝나고 값을 써야할 수도 있다.
        // this.eventElement = null;
        // this.x0 = null;
        // this.y0 = null;
        // this.x1 = null;
        // this.y1 = null;
        // this.distanceX = null;
        // this.distanceY = null;
        
    }

    #ondownForMove(event){
        // this.running = 'move'
    }
    #onmoveForMove(event){
        this.left = this.layoutInfo0.left + this.distanceX;
        this.top = this.layoutInfo0.top + this.distanceY;
        this.dispatchEvent((new CustomEvent("utt-move",{bubbles:true,composed:true,detail:this.detail})));
    }
    #onupForMove(event){

    }

    #ondownForResize(event){

    }
    #onmoveForResize(event){
        const thandle = this.eventElement.dataset.thandle;
        if(!thandle){ return; }
        const thandleV = thandle[0];
        const thandleH = thandle[1];

        if(thandleH=="0"){
            let distanceX = this.distanceX;
            let width = this.layoutInfo0.width + (distanceX * -1);
            width = Math.max(this.layoutInfo0.minWidth,Math.min(width,this.layoutInfo0.maxWidth),0);
            this.distanceX = distanceX = this.layoutInfo0.width - width;
            this.width = width;
            this.left = this.layoutInfo0.left + distanceX;
            
        }else if(thandleH=="1"){
        }else if(thandleH=='2'){
            let width = this.layoutInfo0.width + this.distanceX;
            width = Math.max(this.layoutInfo0.minWidth,Math.min(width,this.layoutInfo0.maxWidth),0);
            this.width = width;
        }
        if(thandleV=="0"){
            let distanceY = this.distanceY;
            let height = this.layoutInfo0.height + (distanceY * -1);
            height = Math.max(this.layoutInfo0.minHeight,Math.min(height,this.layoutInfo0.maxHeight),0);
            this.distanceY = distanceY = this.layoutInfo0.height - height;
            this.height = height;
            this.top = this.layoutInfo0.top + distanceY;

        }else if(thandleV=="1"){
        }else if(thandleV=="2"){
            let height = this.layoutInfo0.height + this.distanceY;
            height = Math.max(this.layoutInfo0.minHeight,Math.min(height,this.layoutInfo0.maxHeight),0);
            this.height = height;

        }
        this.dispatchEvent((new CustomEvent("utt-resize",{bubbles:true,composed:true,detail:this.detail})));
    }
    #onupForResize(event){
        
    }


    ondown(event){}
    onmove(event){}
    onup(event){}

}