export default class UiTransformTool{
    constructor(tool){
        this.tool = tool;
        this.eventTarget = null;
        this.element = null;

        this.x0 = null;
        this.y0 = null;
        this.x1 = null;
        this.y1 = null;
        this.distanceX = null;
        this.distanceY = null;
    }
    static active(tool=null){
        document.querySelectorAll('.ui-transform-tool').forEach(el=>{
            el.classList.remove('active');
        })
        if(tool) tool.classList.add('active');

    }
    active(){
        this.constructor.active(this.tool)
    }
    hide(b=true){
        if(b){ this.tool.classList.add('hide'); }
        else{ this.tool.classList.remove('hide'); }
    }
    fit(element){
        const rect = element.getBoundingClientRect();
        this.tool.style.setProperty('--left',(rect.left+window.scrollX)+'px');
        this.tool.style.setProperty('--top',(rect.top+window.scrollY)+'px');
        this.tool.style.setProperty('--width',rect.width+'px');
        this.tool.style.setProperty('--height',rect.height+'px');
    }

    addEventListener(){
        this.tool.addEventListener('pointerdown',this.down)
    }

    down=(event)=>{        
        this.eventTarget = event.target;
        this.active();
        this.#ondown(event);
        document.addEventListener('pointermove',this.move);
        document.addEventListener('pointerup',this.up);
    }
    move=(event)=>{
        this.#onmove(event);
    }
    up=(event)=>{
        this.#onup(event);
        document.removeEventListener('pointermove',this.move);
        document.removeEventListener('pointerup',this.up);
        this.eventTarget = null;
        this.x0 = null;
        this.y0 = null;
        this.x1 = null;
        this.y1 = null;
        this.distanceX = null;
        this.distanceY = null;
    }

    #ondown(event){
        if(!this.eventTarget){ return false; }
        this.x0 = event.x;
        this.y0 = event.y;
        this.x1 = event.x;
        this.y1 = event.y;
        this.distanceX = this.x1 - this.x0;
        this.distanceY = this.y1 - this.y0;
        let dot = this.eventTarget.dataset.dot;
        this.ondown(event);
        if(dot && this['ondownDot'+dot]){
            this.ondownDot(event);
            return this['ondownDot'+dot](event);
        }else { 
            return this.ondownTool(event);
        }        
    }
    #onmove(event){
        if(!this.eventTarget){return false;}
        this.x1 = event.x;
        this.y1 = event.y;
        this.distanceX = this.x1 - this.x0;
        this.distanceY = this.y1 - this.y0;
        let dot = this.eventTarget.dataset.dot;
        this.onmove(event);
        if(dot && this['onmoveDot'+dot]){
            this.onmoveDot(event);
            return this['onmoveDot'+dot](event);
        }else { 
            return this.onmoveTool(event);
        }
    }
    #onup(event){
        if(!this.eventTarget){return false;}
        let dot = this.eventTarget.dataset.dot;
        this.onup(event);
        if(dot && this['onupDot'+dot]){
            this.onupDot(event);
            return this['onupDot'+dot](event);
        }else { 
            return this.onupTool(event);
        }
        
    }
    
    ondown(event){

    }
    onmove(event){
        
    }
    onup(event){
        
    }
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