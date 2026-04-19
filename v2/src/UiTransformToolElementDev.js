export default class UiColorBarElement extends HTMLElement {

    /* =========================
     * static
     * ========================= */

    static transformToolSync = true; //싱크여부 기본형

    transformToolSync = UiColorBarElement.transformToolSync; //싱크여부

    /** 커스텀 엘리먼트 태그명 */
    static tagName = 'ui-transform-tool';



    // 스타일 확장
    static prependStyle = `<style>

            </style>`; // 값 초기화 등
    static appendStyle = `<style></style>`; // 커스텀 스타일 등

    /** 감시할 속성 목록 */
    static get observedAttributes() {
        return ['width', 'height', 'left', 'top','rotation','zoom'];
    }

    /** 커스텀 엘리먼트 등록 */
    static register(tagName = this.tagName) {
        if (!customElements.get(tagName)) {
            customElements.define(tagName, this);
            console.log('register', tagName);
        }
    }

    /* =========================
     * fields
     * ========================= */

    #left = 0;
    #top = 0;
    #width = 0;
    #height = 0;
    #rotation = 0; //deg
    #zoom = 1;

    #rotation0 = null;
    #left0 = null;
    #top0 = null;
    #x0 = null;
    #y0 = null;

    #transformType = null;
    #resizeType = null;

    #boundary = null;

    scaleX = 1;
    scaleY = 1;

    /* =========================
     * getter / setter
     * ========================= */
    get left() { return this.#left; }
    get top() { return this.#top; }
    get width() { return this.#width; }
    get height() { return this.#height; }
    get rotation() { return this.#rotation; }
    get zoom() { return this.#zoom; }
    set left(v) { this.#left = v; this.applyStyle(); }
    set top(v) { this.#top = v; this.applyStyle(); }
    set width(v) { this.#width = v; this.applyStyle(); }
    set height(v) { this.#height = v; this.applyStyle(); }
    set rotation(v) { this.#rotation = v; this.applyStyle(); }
    set zoom(v) { this.#zoom = v; this.applyStyle(); }
    

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
        if (!this.shadowRoot.firstChild){
            this.render();
            if(!this.hasAttribute('data-resize-origin')){
                this.dataset.resizeOrigin = "edge"; // edge, center
            }
        }
        this.applyStyle();
        this.#boundary = this.parentElement.closest('.transform-boundary')??document.body;
        this.clampToBoundary();
        const wapper = this.shadowRoot.querySelector('.wapper') //this가 아니라 내부 요소로 해야 event.target이 내부 요소로 나온다.
        wapper.addEventListener('dblclick', this.handleDblclick);
        wapper.addEventListener('pointerdown', this.handlePointerdown);
        wapper.addEventListener('pointerup', this.handlePointerup);
        wapper.addEventListener('pointercancel', this.handlePointercancel);
        
        
    }

    disconnectedCallback() {
        this.#boundary = null;
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
        if (name === 'left') this.#left = Number(newValue);
        if (name === 'top') this.#top = Number(newValue);
        if (name === 'width') this.#width = Number(newValue);
        if (name === 'height') this.#height = Number(newValue);
        if (name === 'rotation') this.#rotation = Number(newValue);
        if (name === 'zoom') this.#zoom = Number(newValue);
    }

    /* =========================
     * public API
     * ========================= */

    moveTo(left, top) {
        this.#left = left;
        this.#top = top;
        this.applyStyle();
    }
    resizeTo(width, height) {
        this.#width = width;
        this.#height = height;
        this.applyStyle();
    }
    setRect(left, top, width, height, rotation=null , zoom=null) {
        this.#left = left;
        this.#top = top;
        this.#width = width;
        this.#height = height;
        if(rotation!=null) this.#rotation = rotation
        if(zoom!=null) this.zoom = zoom
        this.applyStyle();
    }
    target = null;
    setTarget(target) {
        if(this.target){
            this.removeEventListener('transform-update', this.handleTargetSync);    
            this.classList.remove('has-target');
        }
        this.target = target
        if(target){
            this.classList.add('has-target');
            if(this.transformToolSync && !target.hasAttribute('data-transform-tool-no-sync')){
                this.syncFrom(target);               
                this.clampToBoundary();
                this.applyStyle(target);
            }
            this.addEventListener('transform-update', this.handleTargetSync);
        }
        this.dispatchCustomEvent('transform-target-change')
    }
    dispatchCustomEvent(type, optDetail={}) {
        const detail = {
            left:this.left,
            top:this.top,
            width:this.width,
            height:this.height,
            rotation:this.rotation,
            target:this.target,
            ...optDetail
        }
        this.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, detail }));
    }
    handleTargetSync = (event) => {
        const target = this.target
        if(!this.transformToolSync || target.hasAttribute('data-transform-tool-no-sync')) return; //싱크 안함
        this.syncTo(target);
    }

    // target -> tool 
    syncFrom(target) {
        const { left, top, width, height, rotation , zoom} = this.getRectFromStyle(target);
        this.setRect(left, top, width, height, rotation, zoom); 
    }
    // tool -> target
    syncTo(target) {
        this.applyStyle(target)
        this.syncFrom(target)
        this.dispatchCustomEvent('transform-target-sync',{action:'sync'})
    }
    rotateTo(rotation) {
        this.#rotation = rotation;
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
            zoom: parseFloat( style.getPropertyValue('--zoom')!=='' ? style.getPropertyValue('--zoom') : 1 ),
        };
        return {
            left: parseFloat( style.getPropertyValue('--left')!=='' ? style.getPropertyValue('--left') : style.getPropertyValue('left') ),
            top: parseFloat( style.getPropertyValue('--top')!=='' ? style.getPropertyValue('--top') : style.getPropertyValue('top') ),
            width: parseFloat( style.getPropertyValue('--width')!=='' ? style.getPropertyValue('--width') : style.getPropertyValue('width') ),
            height: parseFloat( style.getPropertyValue('--height')!=='' ? style.getPropertyValue('--height') : style.getPropertyValue('height') ),
            rotation: parseFloat( style.getPropertyValue('--rotation')!=='' ? style.getPropertyValue('--rotation') : 0 ),
            zoom: parseFloat( style.getPropertyValue('--zoom')!=='' ? style.getPropertyValue('--zoom') : 1 ),
        };
    }
    applyStyle(target=this) {
        target.style.setProperty('--left', this.#left + 'px');
        target.style.setProperty('--top', this.#top + 'px');
        target.style.setProperty('--width', this.#width + 'px');
        target.style.setProperty('--height', this.#height + 'px');
        target.style.setProperty('--rotation', this.#rotation + 'deg');
        target.style.setProperty('--scale-x', this.scaleX);
        target.style.setProperty('--scale-y', this.scaleY);
        target.style.setProperty('--zoom', this.zoom);
        target.classList.toggle('is-zoomed', this.zoom !== 1);
    }
    computeMatrix(left, top, width, height, rotation, scaleX, scaleY) {
        const matrix = new DOMMatrix();
        matrix.translateSelf(left, top);
        matrix.translateSelf(width / 2, height / 2);
        matrix.rotateSelf(rotation);
        matrix.scaleSelf(scaleX, scaleY);
        matrix.translateSelf(-width / 2, -height / 2);
        return matrix;
    }
    getBoundaryMatrices() {
        if(this.#boundary?.getMatrices){
            return this.#boundary.getMatrices();
        }
        return [];
    }
    // 부오와 연계해서 계산
    getMatrices(){
        let matrices = this.getBoundaryMatrices();
        const matrix = this.computeMatrix(this.#left, this.#top, this.#width, this.#height, this.#rotation, this.#zoom*this.scaleX, this.#zoom*this.scaleY);
        matrices.push(matrix);
        // console.log(matrices);
        return matrices;
    }
    getBoundaryMatrix(){
        const matrices = this.getBoundaryMatrices();
        const matrix = matrices.reduce( (acc, m) => acc.multiply(m), new DOMMatrix() );
        return matrix;
    }
    getMatrix(){
        const matrices = this.getMatrices();
        const matrix = matrices.reduce( (acc, m) => acc.multiply(m), new DOMMatrix() );
        return matrix;
    }
    #matrix = null;
    refreshMatrix(){
        this.#matrix = this.getMatrix();
    }
    get matrix() {
        this.refreshMatrix();
        // if (!this.#matrix) { this.refreshMatrix(); }
        return this.#matrix;
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
        event.stopPropagation();
        const target = event.target; // 최초 이벤트 발생 요소 지정
        if (target.dataset.rotate) {
            this.rotateTo(0);
            this.dispatchCustomEvent('transform-update',{action:'rotate',handle:target})
            this.dispatchCustomEvent('transform-update',{action:'rotate-reset',handle:target})
        }
    }


    #width0;
    #height0;
    #ratio0 = null
    
    handlePointerdown = (event) => {
        event.stopPropagation();
        // const eventElement = event.composedPath()[0]; // 최초 이벤트 발생 요소 지정
        const target = event.target; // 최초 이벤트 발생 요소 지정
        target.addEventListener('pointermove', this.handlePointermove);
        target.setPointerCapture(event.pointerId);

        //-- 동작 표시
        target.classList.add('is-active');
        if(target.hasAttribute('data-move')) this.dataset.move = target.dataset.move; 
        if(target.hasAttribute('data-resize')) this.dataset.resize = target.dataset.resize;
        if(target.hasAttribute('data-rotate')) this.dataset.rotate = target.dataset.rotate;
        this.classList.add('is-transforming');

        // 바운드리 rect
        this.#boundaryRect = this.#boundary.getBoundingClientRect();

        // 비율 고정 준비
        if(this.hasAttribute('data-lock-aspect-ratio')){
            this.#ratio0 = this.#width / this.#height;  //비율 고정
        }else{
            this.#ratio0 = null
        }
        
        // 배율 변수 초기화
        this.scaleX = 1;
        this.scaleY = 1;


        if (!target) {
            return;
        } else if (target.dataset.move) {
            this.#transformType = 'move'
            this.#left0 = this.#left;
            this.#top0 = this.#top;
            // this.#x0 = event.clientX - this.#boundaryRect.left;
            // this.#y0 = event.clientY - this.#boundaryRect.top;


            
            // 현재 툴 안의 내부 로컬 좌표가 구해진다. 회전해도 같은 값을 가진다.
            // 시작 포인터 local 좌표 저장 (delta 계산용)
            {
                this.matrixInv = this.getBoundaryMatrix().inverse();
                this.#startLocal = this.matrixInv.transformPoint({x:event.clientX,y:event.clientY});
            }

        } else if (target.dataset.rotate) {
            this.#transformType = 'rotate'
            this.#rotation0 = this.#rotation;
            // this.#x0 = this.#left + this.#width / 2;
            // this.#y0 = this.#top + this.#height / 2;

            // 부모 매트릭스를 쓰므로 left,top 이동해야함
            this.#cx0 = this.#left + this.#width / 2
            this.#cy0 = this.#top + this.#height / 2
            // 현재 툴 안의 내부 로컬 좌표가 구해진다. 회전해도 같은 값을 가진다.
            // 시작 포인터 local 좌표 저장 (delta 계산용)
            {
                this.matrixInv = this.getBoundaryMatrix().inverse();
                this.#startLocal = this.matrixInv.transformPoint({x:event.clientX,y:event.clientY});
            }

        } else if (target.dataset.resize) {
            this.#handlePointerdownForResize(event);
        }
        this.clampToBoundary();
        this.dispatchCustomEvent('transform-start',{action:'start',handle:event.target})
    }
    #cx0 = null
    #cy0 = null
    #anchorLocal = null
    #handleLocal = null
    // #startWorldX = null
    // #startWorldY = null
    #anchorWorldX = null
    #anchorWorldY = null
    #startLocal = null;
    #handlePointerdownForResize(event) {
        this.#transformType = 'resize';
        this.#resizeType = event.target.dataset.resize;

        this.#rotation0 = this.#rotation;

        this.#left0 = this.#left;
        this.#top0 = this.#top;
        this.#width0 = this.#width;
        this.#height0 = this.#height;
        

        // 회전 기준 center (고정)
        this.#cx0 = this.#left + this.#width / 2;
        this.#cy0 = this.#top + this.#height / 2;

        // anchor/handle을 local 좌표로 저장
        this.#anchorLocal = this.#getAnchorLocal(this.#resizeType);
        this.#handleLocal = this.#getHandleLocal(this.#resizeType);

        // 시작 포인터 world 좌표 저장 (delta 계산용) @deprecated
        // this.#startWorldX = event.clientX - this.#boundaryRect.left;
        // this.#startWorldY = event.clientY - this.#boundaryRect.top;


        //  현재 툴 안의 내부 로컬 좌표가 구해진다. 회전해도 같은 값을 가진다.
        // 시작 포인터 local 좌표 저장 (delta 계산용)
        {
            this.matrixInv = this.matrix.inverse();
            this.#startLocal = this.matrixInv.transformPoint({x:event.clientX,y:event.clientY});
        }

        // anchor의 world 좌표 (드래그 중 고정)
        const rad = this.#rotation0 * Math.PI / 180;
        const a = this.#anchorLocal;
        this.#anchorWorldX = this.#cx0 + a.x * Math.cos(rad) - a.y * Math.sin(rad);
        this.#anchorWorldY = this.#cy0 + a.x * Math.sin(rad) + a.y * Math.cos(rad);
    }

    handlePointermove = (event) => {
        event.stopPropagation();
        const target = event.target; // 최초 이벤트 발생 요소 지정
        if (!target.hasPointerCapture(event.pointerId)) return;

        if (this.#transformType === 'move') {
            // const x1 = event.clientX - this.#boundaryRect.left;
            // const y1 = event.clientY - this.#boundaryRect.top;
            // const left = this.#left0 + x1 - this.#x0;
            // const top = this.#top0 + y1 - this.#y0;
            
            const currentLocal = this.matrixInv.transformPoint({x:event.clientX,y:event.clientY});
            const left = this.#left0 + currentLocal.x - this.#startLocal.x;
            const top = this.#top0 + currentLocal.y - this.#startLocal.y;

            this.moveTo(left, top);
            this.clampToBoundary(false);
            this.dispatchCustomEvent('transform-update',{action:'move',handle:event.target})
        } else if (this.#transformType === 'rotate') {
            // const x1 = event.clientX - this.#boundaryRect.left;
            // const y1 = event.clientY - this.#boundaryRect.top;
            // const rad = Math.atan2(y1 - this.#y0, x1 - this.#x0);
            // const rotation = (rad * (180 / Math.PI) + 360 + 270) % 360; //+ 270 은 아래가 0deg가 되도록


            const currentLocal = this.matrixInv.transformPoint({x:event.clientX,y:event.clientY});
            const rad = Math.atan2(currentLocal.y - this.#cy0, currentLocal.x - this.#cx0);
            const rotation = (rad * (180 / Math.PI) + 360 + 270) % 360; //+ 270 은 아래가 0deg가 되도록

            this.rotateTo(rotation);
            this.clampToBoundary(false);
            this.dispatchCustomEvent('transform-update',{action:'rotate',handle:event.target})
        } else if (this.#transformType === 'resize') {
            this.handlePointermoveForResize(event)           
            this.clampToBoundary(false);
            this.dispatchCustomEvent('transform-update',{action:'resize',handle:event.target})
        }

    }



    handlePointermoveForResize(event) {
        const origin = this.dataset.resizeOrigin ?? "edge";
        if (origin === "center") {
            this.#resizeFromCenter(event);           
        }else{
            this.#resizeFromEdge(event);
        }
    }
    #getHandleLocal(type) {
        const w = this.#width0;
        const h = this.#height0;
        switch (type) {
            case "nw": return { x: -w / 2, y: -h / 2 };
            case "n":  return { x: 0,       y: -h / 2 };
            case "ne": return { x:  w / 2,  y: -h / 2 };
            case "w":  return { x: -w / 2,  y: 0 };
            case "e":  return { x:  w / 2,  y: 0 };
            case "sw": return { x: -w / 2,  y:  h / 2 };
            case "s":  return { x: 0,       y:  h / 2 };
            case "se": return { x:  w / 2,  y:  h / 2 };
        }
    }

    #getAnchorLocal(type) {
        const w = this.#width0;
        const h = this.#height0;

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

    // delta를 local 좌표로 변환
    #deltaToLocal(event) {

        const currentLocal = this.matrixInv.transformPoint({x:event.clientX,y:event.clientY});
        console.log('currentLocal',this.#startLocal.x,this.#startLocal.y,currentLocal.x,currentLocal.y);
        
        return{
            x: currentLocal.x - this.#startLocal.x,
            y: currentLocal.y - this.#startLocal.y
        }

        // const rad = -this.#rotation0 * Math.PI / 180;
        // const dwx = event.clientX - this.#boundaryRect.left - this.#startWorldX;
        // const dwy = event.clientY - this.#boundaryRect.top - this.#startWorldY;
        // return {
        //     x: dwx * Math.cos(rad) - dwy * Math.sin(rad),
        //     y: dwx * Math.sin(rad) + dwy * Math.cos(rad),
        // };
    }

    // 반대편 기준 리사이즈
    #resizeFromEdge(event) {
        // delta 기반: 핸들 초기 위치 + 포인터 이동량(local)
        const d = this.#deltaToLocal(event);
        const h = this.#handleLocal;
        
        const p = { x: h.x + d.x, y: h.y + d.y };
        const a = this.#anchorLocal;

        // // 뒤집힘 계산
        if(!this.hasAttribute('data-no-flip')){
            const dx0 = h.x - a.x;
            const dy0 = h.y - a.y;
            const dx  = p.x - a.x;
            const dy  = p.y - a.y;
            this.scaleX = dx * dx0 < 0 ? -1 : 1;
            this.scaleY = dy * dy0 < 0 ? -1 : 1;
        }

        const hw = this.#width0 / 2;
        const hh = this.#height0 / 2;

        // 비율 유지하기
        if (this.#ratio0 && ['se','sw','ne','nw'].includes(this.#resizeType)) {
            const ratio = this.#ratio0;
    
            const dx = p.x - a.x;
            const dy = p.y - a.y;
    
            if (Math.abs(dx) > Math.abs(dy)) {
                // 가로 기준 → 세로 맞춤
                const sign = dy >= 0 ? 1 : -1;
                p.y = a.y + sign * (Math.abs(dx) / ratio);
            } else {
                // 세로 기준 → 가로 맞춤
                const sign = dx >= 0 ? 1 : -1;
                p.x = a.x + sign * (Math.abs(dy) * ratio);
            }
        }


        
        let left, right, top, bottom;

        switch (this.#resizeType) {
            case "se": case "nw": case "ne": case "sw":
                left   = Math.min(a.x, p.x);
                right  = Math.max(a.x, p.x);
                top    = Math.min(a.y, p.y);
                bottom = Math.max(a.y, p.y);
                break;

            case "n": case "s":
                left   = -hw;
                right  =  hw;
                top    = Math.min(a.y, p.y);
                bottom = Math.max(a.y, p.y);
                break;

            case "e": case "w":
                top    = -hh;
                bottom =  hh;
                left   = Math.min(a.x, p.x);
                right  = Math.max(a.x, p.x);
                break;
        }

        const width  = right - left;
        const height = bottom - top;

        // anchor의 new rect 내 local offset
        const aOffX = a.x - (left + right) / 2;
        const aOffY = a.y - (top + bottom) / 2;

        // anchor world 좌표로부터 새 center 역산
        const rad = this.#rotation0 * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const cxWorld = this.#anchorWorldX - (aOffX * cos - aOffY * sin);
        const cyWorld = this.#anchorWorldY - (aOffX * sin + aOffY * cos);

        this.setRect(cxWorld - width / 2, cyWorld - height / 2, width, height);
    }

    // 중심 기준 대칭 리사이즈
    #resizeFromCenter(event) {
        // delta 기반: 핸들 초기 위치 + 포인터 이동량(local)
        const d = this.#deltaToLocal(event);
        const h = this.#handleLocal;
        const p = { x: h.x + d.x, y: h.y + d.y };
        
        // 뒤집힘 계산
        if(!this.hasAttribute('data-no-flip')){
            this.scaleX = p.x * h.x < 0 ? -1 : 1;
            this.scaleY = p.y * h.y < 0 ? -1 : 1;
        }


        if (this.#ratio0 && ['se','sw','ne','nw'].includes(this.#resizeType)) {
            const ratio = this.#ratio0;

            const absX = Math.abs(p.x);
            const absY = Math.abs(p.y);

            if (Math.abs(d.x) > Math.abs(d.y)) {
                // 가로 기준 → 세로 맞춤
                const signY = p.y >= 0 ? 1 : -1;
                p.y = signY * (absX / ratio);
            } else {
                // 세로 기준 → 가로 맞춤
                const signX = p.x >= 0 ? 1 : -1;
                p.x = signX * (absY * ratio);
            }
        }

        let left, right, top, bottom;

        const hw = this.#width0 / 2;
        const hh = this.#height0 / 2;

        switch (this.#resizeType) {

            // corner → 중심 기준 대칭 확장
            case "se":
            case "nw":
            case "ne":
            case "sw": {
                left = -Math.abs(p.x);
                right = Math.abs(p.x);
                top = -Math.abs(p.y);
                bottom = Math.abs(p.y);
                break;
            }

            // edge

            case "n":
            case "s": {
                left = -hw;
                right = hw;
                top = -Math.abs(p.y);
                bottom = Math.abs(p.y);
                break;
            }

            case "e":
            case "w": {
                const dx = p.x;

                top = -hh;
                bottom = hh;

                left = -Math.abs(dx);
                right = Math.abs(dx);
                break;
            }
        }

        // width / height
        const width = right - left;
        const height = bottom - top;

        // 중심은 변하지 않음 (핵심!)
        const cxWorld = this.#cx0;
        const cyWorld = this.#cy0;

        const newLeft = cxWorld - width / 2;
        const newTop = cyWorld - height / 2;

        this.setRect(newLeft, newTop, width, height);
    }

    handlePointerup = (event) => {
        event.stopPropagation();
        const target = event.target; // 최초 이벤트 발생 요소 지정

        target.removeEventListener('pointermove', this.handlePointermove);
        target.releasePointerCapture(event.pointerId);
        //-- 동작 표시 제거
        target.classList.remove('is-active');
        delete this.dataset.move;
        delete this.dataset.resize;
        delete this.dataset.rotate;
        this.classList.remove('is-transforming');

        this.clampToBoundary(false);

        this.dispatchCustomEvent('transform-end',{action:'end',handle:event.target})

        this.#left0 = null;
        this.#top0 = null;
        this.#x0 = null;
        this.#y0 = null;
        this.#rotation0 = null;
        this.#boundaryRect = null
        this.scaleX = 1;
        this.scaleY = 1;
        this.applyStyle();
        
    }

    handlePointercancel = (event) => {
        return this.handlePointerup(event);
    }

    #boundaryRect = null
    clampToBoundary(refreshBoundaryRect = true){
        if(this.hasAttribute('data-clamp-boundary') && this.#boundary){
            if(refreshBoundaryRect) this.#boundaryRect = this.#boundary.getViewportRect?.()??this.#boundary.getBoundingClientRect();
            this.clampToRect(this.#boundaryRect);
        }
    }
    clampToRect(boundaryRect){
        let { left, top, width, height } = this;

        // 1. 현재 중심점
        let cx = left + width / 2;
        let cy = top + height / 2;

        // 2. boundaryRect 안으로 center를 clamp
        const minX = 0;
        const maxX = 0 + boundaryRect.width;
        const minY = 0;
        const maxY = 0 + boundaryRect.height;

        cx = Math.max(minX, Math.min(maxX, cx));
        cy = Math.max(minY, Math.min(maxY, cy));

        // 3. center 기준으로 left/top 재계산
        left = cx - width / 2;
        top = cy - height / 2;

        // 4. 반영
        this.left = left;
        this.top = top;

        return this;
    }

    toJSON() { return { left: this.left, top: this.top, width: this.width, height: this.height, rotation: this.rotation, scaleX: this.scaleX, scaleY: this.scaleY }; }
    getLocalRect() {  return new DOMRect( this.left, this.top, this.width, this.height) }
    getViewportRect() { 
        const boundaryRect = this.#boundaryRect??this.#boundary.getBoundingClientRect();
        return new DOMRect( this.left + boundaryRect.left, this.top + boundaryRect.top, this.width, this.height)
    }
    getPageRect() { 
        const boundaryRect = this.#boundaryRect??this.#boundary.getBoundingClientRect();
        return new DOMRect( this.left + boundaryRect.left +  window.scrollX, this.top + boundaryRect.top + window.scrollY, this.width, this.height)
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
    //     return { value: this.#value };
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
                    position: absolute;
                    margin: 0;
                    padding: 0;
                    left:0;
                    top:0;
                    width: var(--width,0);
                    height: var(--height,0);
                    transform: translate(var(--left,0),var(--top,0)) rotate(var(--rotation,0deg)) scale(var(--scale-x,1),var(--scale-y,1));
                    pointer-events: none;
                    z-index: 3;
                }
                :host(.show-when-has-target:not(.has-target)){
                    display: none;
                }
                :host .wapper{
                    position: absolute;
                    inset:0;
                }
                :host .content-border{
                    position: absolute;
                    inset:0;
                    width: calc(var(--width) *  var(--zoom,1) );
                    height: calc(var(--height) *  var(--zoom,1) );
                    z-index: 1;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
                :host(.is-zoomed) .content-border{
                    outline: var(--content-border-width, 1px) var(--content-border-style, dashed) var(--content-border-color, #f009);
                }
                :host .border{
                    pointer-events: none;
                    position: absolute;
                    outline: var(--border-width, 2px) var(--border-style, dashed) var(--border-color, #000);
                    inset:0;
                }
                :host([data-no-border]) .border{
                    pointer-events: none;
                    display: none;
                }
                :host .controls{
                    pointer-events: none;
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: max(100%, var(--controls-min-size, 80px));
                    height: max(100%, var(--controls-min-size, 80px));
                    transform: translate(-50%, -50%);
                }
                :host .resize-handles{
                    pointer-events: none;
                    position: absolute;
                    inset: calc(var(--border-width,2px) / 2 * -1);
                }
                :host .move-handle{
                    pointer-events: all;
                    position: absolute;
                    inset:0;
                    width: max(100%,calc(var(--width) *  var(--zoom,1) ));
                    height: max(100%,calc(var(--height) *  var(--zoom,1) ));
                    z-index: 1;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
                :host([data-no-move]) .move-handle{
                    pointer-events: none;
                }
                :host .resize-handle{
                    pointer-events: all;
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
                :host([data-no-resize]) .resize-handle{
                    pointer-events: none;
                    display: none;
                }
                :host .resize-handle.is-active{
                    filter:invert(1);
                }

                :host .resize-handle[data-resize='nw']{ left:0;     top:0;   }
                :host .resize-handle[data-resize='n'] { left:50%;   top:0;   }
                :host .resize-handle[data-resize='ne']{ left:100%;  top:0;   }
                :host .resize-handle[data-resize='w'] { left:0;     top:50%; }
                :host .resize-handle[data-resize='c'] { left:50%;   top:50%; display: none; }
                :host .resize-handle[data-resize='e'] { left:100%;  top:50%; }
                :host .resize-handle[data-resize='sw']{ left:0;     top:100%; }
                :host .resize-handle[data-resize='s'] { left:50%;   top:100%; }
                :host .resize-handle[data-resize='se']{ left:100%;  top:100%; }

                :host .rotate-handle-wrap{
                    z-index: 2;
                    position: absolute;
                    left: 50%;
                    top: 100%;
                    transform: translate(-50%, 0%);
                    bottom: calc(var(--handle-size,12px) * -2);
                    width: 0px;
                    border-right: var(--border-width,2px) var(--border-style,dashed) var(--border-color,#000);
                    box-sizing: content-box;
                }
                :host .rotate-handle{
                    pointer-events: all;
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
                    transform: translate(calc(-50% + var(--border-width,2px) / 2), 50%);
                }
                :host .rotate-handle.is-active{
                    filter:invert(1);
                }
                :host([data-no-rotate]) :where(.rotate-handle-wrap, .rotate-handle){
                    pointer-events: none;
                    display: none;
                }
                :host .slot-wrapper{
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
            </style>
            ${this.constructor.appendStyle}
            <div part="wapper" class="wapper">                
                <div part="border" class="border"></div>
                <div part="content-border" class="content-border"></div>

                <div class="controls">
                    <div part="move-handle-area move-handle" class="move-handle-area move-handle" data-move="move"></div>
                    <div part="resize-handles" class="resize-handles" >
                        <div part="resize-handle resize-handle-c move-handle" class="resize-handle resize-handle-c move-handle" data-resize="c" data-move="move"></div>

                        <div part="resize-handle resize-handle-nw" class="resize-handle resize-handle-nw" data-resize="nw"></div>
                        <div part="resize-handle resize-handle-n" class="resize-handle resize-handle-n" data-resize="n"></div>
                        <div part="resize-handle resize-handle-ne" class="resize-handle resize-handle-ne" data-resize="ne"></div>
                        <div part="resize-handle resize-handle-w" class="resize-handle resize-handle-w" data-resize="w"></div>

                        <div part="resize-handle resize-handle-e" class="resize-handle resize-handle-e" data-resize="e"></div>
                        <div part="resize-handle resize-handle-sw" class="resize-handle resize-handle-sw" data-resize="sw"></div>
                        <div part="resize-handle resize-handle-s" class="resize-handle resize-handle-s" data-resize="s"></div>
                        <div part="resize-handle resize-handle-se" class="resize-handle resize-handle-se" data-resize="se"></div>
                    </div>
                    <div part="rotate-handle-wrap" class="rotate-handle-wrap">
                        <div part="rotate-handle" class="rotate-handle" data-rotate="rotate"></div>
                    </div>
                </div>


                <div class="slot-wrapper">
                    <slot></slot>
                </div>
            </div>
        `;
    }
}