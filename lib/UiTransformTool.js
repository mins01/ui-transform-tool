class UiTransformTool{
    constructor(tool){
        this.tool = tool;
        this.eventElement = null;
        this.element = null;

        this.x0 = null; // down x
        this.y0 = null; // down y
        this.x1 = null; // move x
        this.y1 = null; // move y
        this.distanceX = null; // x1-x0
        this.distanceY = null; // y1-y0
    }
    static active(tool=null){
        document.querySelectorAll('.ui-transform-tool').forEach(el=>{
            el.classList.remove('active');
        })
        if(tool && !tool.classList.contains('disabled')) tool.classList.add('active');

    }
    active(){
        this.constructor.active(this.tool)
    }
    hide(b=true){
        if(b){ this.tool.classList.add('hide'); }
        else{ this.tool.classList.remove('hide'); }
    }
    fit(element){
        this.fitElement = element;
        const rect = element.getBoundingClientRect();
        this.tool.style.setProperty('--left',(rect.left+window.scrollX)+'px');
        this.tool.style.setProperty('--top',(rect.top+window.scrollY)+'px');
        this.tool.style.setProperty('--width',rect.width+'px');
        this.tool.style.setProperty('--height',rect.height+'px');
    }

    /**
     * 엘레멘트의 위치와 크기 정보
     *
     * @param {HTMLElement} element
     * @returns {{ width: Number; height: Number; left: Number; top: Number; minWidth: Number; minHeight: Number; maxWidth: Number; maxHeight: Number; }}
     */
    getLayoutInfo(element){
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



    addEventListener(){
        this.tool.addEventListener('pointerdown',this.down)
    }







    /**
     * 이벤트 처리부분 시작
     */


    /**
     * pointerdown 이벤트 처리
     *
     * @param {*} event
     */
    down=(event)=>{
        this.eventElement = event.target;
        document.addEventListener('pointermove',this.move);       
        document.addEventListener('pointerup',this.up);
        this.active();
        this.#ondown(event);
        
    }
    move=(event)=>{
        this.#onmove(event);
    }
    up=(event)=>{
        this.#onup(event);
        document.removeEventListener('pointermove',this.move);
        document.removeEventListener('pointerup',this.up);
        this.eventElement = null;
        this.x0 = null;
        this.y0 = null;
        this.x1 = null;
        this.y1 = null;
        this.distanceX = null;
        this.distanceY = null;
    }

    #ondown(event){
        if(!this.eventElement){ return false; }
        this.x0 = event.x;
        this.y0 = event.y;
        this.x1 = event.x;
        this.y1 = event.y;
        this.distanceX = this.x1 - this.x0;
        this.distanceY = this.y1 - this.y0;
        let dot = this.eventElement.dataset.dot;
        this.ondown(event);
        if(dot && this['ondownDot'+dot]){
            this.ondownDot(event);
            return this['ondownDot'+dot](event);
        }else {
            return this.ondownTool(event);
        }
    }
    #onmove(event){
        if(!this.eventElement){return false;}
        this.x1 = event.x;
        this.y1 = event.y;
        this.distanceX = this.x1 - this.x0;
        this.distanceY = this.y1 - this.y0;
        let dot = this.eventElement.dataset.dot;
        this.onmove(event);
        if(dot && this['onmoveDot'+dot]){
            this.onmoveDot(event);
            return this['onmoveDot'+dot](event);
        }else {
            return this.onmoveTool(event);
        }
        
        
    }
    #onup(event){
        if(!this.eventElement){return false;}
        let dot = this.eventElement.dataset.dot;
        this.onup(event);
        if(dot && this['onupDot'+dot]){
            this.onupDot(event);
            return this['onupDot'+dot](event);
        }else {
            return this.onupTool(event);
        }

    }

    ondown(event){}
    onmove(event){}
    onup(event){}

    ondownTool(event){}
    onmoveTool(event){}
    onupTool(event){}

    ondownDot(event){}
    onmoveDot(event){}
    onupDot(event){}

    ondownDot00(event){}
    ondownDot01(event){}
    ondownDot02(event){}
    onmoveDot00(event){}
    onmoveDot01(event){}
    onmoveDot02(event){}
    onupDot00(event){}
    onupDot01(event){}
    onupDot02(event){}

    ondownDot10(event){}
    ondownDot10(event){}
    ondownDot11(event){}
    ondownDot12(event){}
    onmoveDot10(event){}
    onmoveDot11(event){}
    onmoveDot12(event){}
    onupDot10(event){}
    onupDot11(event){}
    onupDot12(event){}

    ondownDot20(event){}
    ondownDot21(event){}
    ondownDot22(event){}
    onmoveDot20(event){}
    onmoveDot21(event){}
    onmoveDot22(event){}
    onupDot20(event){}
    onupDot21(event){}
    onupDot22(event){}
}